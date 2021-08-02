const request = require('request');
const apns = require('apn');
const Promise = require('bluebird');
const async = require('async');
const apnConnect = require('../Config/apnConnect');
const constants = require('../Utils/constants');
const { logger } = require('../libs/pino_logger');
const commonFunctions = require('../Utils/commonFunctions');
// const businessService       = require('../services/business');
// const pushLogsService       = require('../services/pushLogs');
const notificationBuilder = require('../Builder/notification');
const utilityService = require('../services/utility');
const workspaceService = require('../services/workspace');
const dbHandler = require('../database').dbHandler;


exports.sendBulkNotification = sendBulkNotification;
exports.webNotification      = webNotification;


function sendBulkNotification(logHandler, pushNotifications, pushLogData, businessInfo) {
  Promise.coroutine(function* () {
    let businessId = pushNotifications[0].business_id;
    let payload = pushNotifications[0].payload;
    logger.trace(logHandler, { pushNotifications: pushNotifications });
    let businessDetailsWrapper = {};
    let androidPushes = {};
    let iosPushes = {};
    let deviceTokenToUserId = {};
    let remove_voip = pushNotifications[0].remove_voip;

    const [businessInfo] = yield workspaceService.getWorkspaceDetailsWithDomain(logHandler, { workspace_id: pushNotifications[0].business_id });

    for (let i = 0; i < pushNotifications.length; i++) {
      deviceTokenToUserId[pushNotifications[i].device_token] = pushNotifications[i].push_to;

      if (pushNotifications[i].device_type == "ANDROID") {
        // if (pushNotifications[i].android_app_version && pushNotifications[i].android_app_version > 262 ) {
        //   users[i].push_payload.push_message = users[i].push_payload.push_message.split(':')[1];
        // }
        let key = pushNotifications[i].app_type;
        if (!androidPushes[key]) {
          androidPushes[key] = [pushNotifications[i].device_token];
        } else {
          androidPushes[key].push(pushNotifications[i].device_token);
        }
      } else if (pushNotifications[i].device_type == "IOS") {
        let key = pushNotifications[i].app_type;
        if (!iosPushes[key]) {
          iosPushes[key] = [pushNotifications[i].device_token];
        } else {
          iosPushes[key].push(pushNotifications[i].device_token);
        }
      }
    }

    for (let key in androidPushes) {
      let appType = key;
      let deviceTokens = androidPushes[key];
      let dataWrapper = {
        business_id: businessId,
        app_type: appType
      };
      let BUSINESS_DEVICE_MAPPINGS =  {};
      if (!BUSINESS_DEVICE_MAPPINGS[businessId] || !BUSINESS_DEVICE_MAPPINGS[businessId][appType]) {
        businessDetailsWrapper.data = {
          api_key: businessInfo.api_key,
          certificate: businessInfo.certificate,
          voip_certificate: businessInfo.voip_certificate,
          topic: businessInfo.topic
        }
      }
      if (!BUSINESS_DEVICE_MAPPINGS[businessId] || !BUSINESS_DEVICE_MAPPINGS[businessId][appType]) {
        if (!mappingDataValidation(constants.deviceType.ANDROID, businessDetailsWrapper.data)) {
          logger.trace(logHandler, "Invalid business device details ", businessDetailsWrapper.data);
          return;
        }
        BUSINESS_DEVICE_MAPPINGS[businessId] = {};
        BUSINESS_DEVICE_MAPPINGS[businessId][appType] = businessDetailsWrapper.data;
      }
      sendAndroidBulkPushNotificationInternal(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, payload, 0, appType, deviceTokenToUserId, pushLogData);
    }
    for (let key in iosPushes) {
      let appType = key;
      let deviceTokens = iosPushes[key];
      let BUSINESS_DEVICE_MAPPINGS = {};
      if (!BUSINESS_DEVICE_MAPPINGS[businessId] || !BUSINESS_DEVICE_MAPPINGS[businessId][appType]) {
        businessDetailsWrapper.data = {
          api_key: businessInfo.api_key,
          certificate: businessInfo.certificate,
          voip_certificate: businessInfo.voip_certificate,
          topic: businessInfo.topic
        }
      }
      if (!BUSINESS_DEVICE_MAPPINGS[businessId] || !BUSINESS_DEVICE_MAPPINGS[businessId][appType]) {
        if (!mappingDataValidation(constants.deviceType.IOS, businessDetailsWrapper.data)) {
          logger.trace(logHandler, "Invalid business device details ", businessDetailsWrapper.data);
          return;
        }
        BUSINESS_DEVICE_MAPPINGS[businessId] = {};
        BUSINESS_DEVICE_MAPPINGS[businessId][appType] = businessDetailsWrapper.data;
      }
      sendIosBulkPushNotificationInternal(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, payload.message, payload, appType, deviceTokenToUserId, pushLogData, remove_voip);
    }
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
  }, (error) => {
    logger.error(logHandler, error);
  });
}

function sendAndroidBulkPushNotificationInternal(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, payload, timeToLive, appType, deviceTokenToUserId, pushLogData) {
  let notificationDataObj = {
    message: payload,
    time_to_live: timeToLive,
    business_id: businessId,
    app_type: appType,
  };
  let iterations = parseInt(deviceTokens.length / constants.androidBatchPushLimit);
  if (deviceTokens.length % constants.androidBatchPushLimit > 0) {
    iterations++;
  }
  logger.trace(logHandler, { EVENT: "sendAndroidBulkPushNotificationInternal", PAYLOAD: payload });
  for (let i = 0; i < iterations; i++) {
    notificationDataObj.device_tokens = deviceTokens.slice(i * constants.androidBatchPushLimit, (i + 1) * constants.androidBatchPushLimit);
    sendAndroidBulkPushNotificationFCM(logHandler, BUSINESS_DEVICE_MAPPINGS, notificationDataObj, deviceTokenToUserId, pushLogData);
  }
}


async function sendAndroidBulkPushNotificationFCM(logHandler, BUSINESS_DEVICE_MAPPINGS, notificationDataObj, deviceTokenToUserId, pushLogData) {
  logger.trace(logHandler, "total android deviceTokens: " + notificationDataObj.device_tokens.length, notificationDataObj.message);
  let payload = {
    data: {
      message: JSON.stringify(notificationDataObj.message),
      push_source: "FUGU",
      app_name: BUSINESS_DEVICE_MAPPINGS[notificationDataObj.business_id][notificationDataObj.app_type].app_name
    }
  };


  let headers = {
    "Content-Type": "application/json",
    Authorization: "key=" + BUSINESS_DEVICE_MAPPINGS[notificationDataObj.business_id][notificationDataObj.app_type].api_key
  };

  payload.registration_ids = notificationDataObj.device_tokens;

  payload.priority = "high";

  payload.timeToLive = 86400;

  if(notificationDataObj.message.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE || notificationDataObj.message.notification_type== notificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION){
    return {};
  }
  if (notificationDataObj.message.notification_type == notificationBuilder.notificationType.VIDEO_CALL || notificationDataObj.message.notification_type == notificationBuilder.notificationType.AUDIO_CALL || notificationDataObj.message.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE) {
    payload.timeToLive = 30;
  }

  let options = {
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    body: payload,
    json: true,
    rejectUnauthorized: false,
    headers: headers
  };
  let ress = await utilityService.sendHttpRequest(logHandler, options);
}


function sendIosBulkPushNotificationInternal(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, message, payload, appType, deviceTokenToUserId, pushLogData, remove_voip) {
  let certificateURL
  if (payload.notification_type == notificationBuilder.notificationType.SESSION_EXPIRED ||
    payload.notification_type == notificationBuilder.notificationType.VIDEO_CALL ||
    payload.notification_type == notificationBuilder.notificationType.AUDIO_CALL ||
    payload.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE ||
    payload.notification_type == notificationBuilder.notificationType.READ_ALL ||
    payload.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP) {
    certificateURL = BUSINESS_DEVICE_MAPPINGS[businessId][appType].voip_certificate;
  } else {
    certificateURL = BUSINESS_DEVICE_MAPPINGS[businessId][appType].certificate;
 }
  if(remove_voip){
    certificateURL = BUSINESS_DEVICE_MAPPINGS[businessId][appType].certificate;
  }

  if (!certificateURL) {
    logger.error(logHandler, "Invalid certificate url : " + certificateURL + ", business_id : " + businessId);
    return;
  }
  let fileName = global.base_dir + '/certs/' + certificateURL.split('/').pop();


  let asyncTasks = [];
  if (!BUSINESS_DEVICE_MAPPINGS[businessId][appType].valid_certificate) {
    asyncTasks.push(downloadPemFile.bind(null, certificateURL, fileName));

    // commonFunctions.downloadFile(certificateURL, fileName, (err, res) => {
    //   if (err) {
    //     return err;
    //   }
    //   BUSINESS_DEVICE_MAPPINGS[businessId][appType].valid_certificate = true;
    //   logger.error(logHandler, "Cert downloaded at : " + fileName);
    //   return {}
    // })
  }


  function downloadPemFile(certificateURL, fileName, cb) {
    commonFunctions.downloadFile(certificateURL, fileName, (err, res) => {
      if (err) {
        return cb(err);
      }
      BUSINESS_DEVICE_MAPPINGS[businessId][appType].valid_certificate = true;
      // logger.error(logHandler, "Cert downloaded at : " + fileName);
      return cb();
    });
  }

  async.series(asyncTasks, (error, response) => {
    if (error) {
      logger.error(logHandler, "Error in sendIosPushNotificationInternal ", error);
      return;
    }
    BUSINESS_DEVICE_MAPPINGS[businessId][appType].certificate_path = fileName;
    sendIosBulkPushNotification(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, message, payload, appType, deviceTokenToUserId, pushLogData, remove_voip);
  });
}

function sendIosBulkPushNotification(logHandler, BUSINESS_DEVICE_MAPPINGS, businessId, deviceTokens, message, payloadObject, appType, deviceTokenToUserId, pushLogData, remove_voip) {
  try {
    logger.trace(logHandler, "BUSINESS_DEVICE_MAPPINGS", BUSINESS_DEVICE_MAPPINGS, "businessId", businessId, "payloadObject", payloadObject)
    // TODO : remove invalid tokens and use cache
    let payload = commonFunctions.cloneObject(payloadObject);
    if(payload.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE || payload.notification_type== notificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION){
      return {};
    }
    let topic = certificateURL = BUSINESS_DEVICE_MAPPINGS[businessId][appType].topic;
    let sound = '';
    if (payload.notification_type == notificationBuilder.notificationType.SESSION_EXPIRED ||
      payload.notification_type == notificationBuilder.notificationType.VIDEO_CALL ||
      payload.notification_type == notificationBuilder.notificationType.AUDIO_CALL ||
      payload.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE ||
      payload.notification_type == notificationBuilder.notificationType.READ_ALL ||
      payload.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP
    ) {
      topic = topic + ".voip";
    } else {
      sound = 'ping.aiff';
   }
   if(remove_voip){
     topic = certificateURL = BUSINESS_DEVICE_MAPPINGS[businessId][appType].topic;
   }
  if(payload.video_call_type == constants.videoCallResponseTypes.HUNGUP_CONFERENCE){
     sound = "disconnect_call.mp3";
  }else if(payload.notification_type == 21 || payload.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS || payload.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE){
    sound = "incoming_call.mp3";
   }

    //  BUSINESS_DEVICE_MAPPINGS[businessId][appType].certificate_path = fileName;
    // if(!apnsConnection[businessId] || !apnsConnection[businessId][appType]) {
    let certificatePath = BUSINESS_DEVICE_MAPPINGS[businessId][appType].certificate_path;
    let passphrase = BUSINESS_DEVICE_MAPPINGS[businessId][appType].passphrase;
    let apnsConnection = {};
    apnConnect.createConnection(apnsConnection, businessId, appType, certificatePath, passphrase);
    // }


    let note = new apns.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    if (payload.notification_type == 20 || payload.notification_type == 17) {
      note.mutableContent = 1
    }
    if (payload.showpush != 0) {
      note.alert = {
        title: payload.title,
        body: payload.push_message || payload.message
      };
      note.sound = sound;
      delete payload.title;
    }else{
      note.priority = 5;
    }
    if(payload.notification_type == 16 && remove_voip){
      note.sound = "incoming_call.mp3";
    }

    payload.push_source = "FUGU";
    note.newsstandAvailable = 1;
    note.contentAvailable = 1;
    note.topic = topic;
    note.payload = payload;
   if([notificationBuilder.notificationType.MISSED_CALL, notificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP, notificationBuilder.notificationType.CALLING_CONFERENCE, notificationBuilder.notificationType.VIDEO_CONFERENCE].includes(payload.notification_type)){
      note.collapseId = payload.muid;
   }
    if (apnsConnection[businessId][appType]) {
      apnsConnection[businessId][appType]
        .send(note, deviceTokens)
        .then((result) => {
          let failed = [];
          if (result.failed && result.failed.length) {
            for (let i = 0; i < result.failed.length; i++) {
              failed.push(deviceTokenToUserId[result.failed[i].device]);
            }
            logger.trace(logHandler, { APNS_FAILED: failed, app_type: appType });
          }
          let success = [];
          if (result.sent && result.failed.length) {
            for (let i = 0; i < result.sent.length; i++) {
              success.push(deviceTokenToUserId[result.sent[i].device]);
            }
            logger.trace(logHandler, { APNS_SUCCESS: success, app_type: appType });
          }

          if (pushLogData) {
            let updatePushLog = {
              ios_failed: " | " + failed.toString(),
              ios_success: " | " + success.toString(),
              message_id: pushLogData.message_id,
              channel_id: pushLogData.channel_id
            };
            insertLog(logHandler, updatePushLog).then((result) => {
              logger.trace(logHandler, "pushLog updated");
            }).catch((error) => {
              logger.trace(logHandler, { EVENT: "push log error", ERROR: error });
            });
          }

          if (result.failed && result.failed.length > 0) {
            logger.trace(logHandler, {
              APNS_ERROR: result.failed,
              PUSH_PAYLOAD: note,
              app_type: appType,
              APNS_SUCCESS: result.sent.length
            });
          } else {
            logger.trace(logHandler, {
              APNS_SUCCESS: success,
              DEVICE_TOKENS: deviceTokens,
              RESULT: result,
              PUSH_PAYLOAD: note,
              app_type: appType
            });
          }
        });
    } else {
      logger.trace(logHandler, "Error in APNS connection");
    }
  } catch (error) {
    logger.trace(logHandler, {
      APNS_ERROR: "Error while sending IOS push notification",
      error: error,
      message: message,
      payload: payloadObject
    });
  }
}

function mappingDataValidation(deviceType, mappindData) {
  if (deviceType == constants.deviceType.ANDROID) {
    if (!mappindData.api_key || !mappindData.api_key.trim()) {
      return 0;
    }
  } else if (deviceType == constants.deviceType.IOS) {
    // && (!mappindData.beta_certificate || !mappindData.beta_certificate.trim())
    if ((!mappindData.certificate || !mappindData.certificate.trim())) {
      return 0;
    }
  }
  return 1;
}

function webNotification(loggerInfo, pushList) {
  Promise.all(pushList.map(push => sendWebNotification(loggerInfo, push))).then(() => {
    logger.trace(loggerInfo, { EVENT: "WEB NOTIFICATION SENT" });
  }, (error) => {
    logger.error(loggerInfo, { EVENT: "ERROR IN SENDING WEB NOTIFICATION" }, { ERROR: error.message });
  });
}

function sendWebNotification(loggerInfo, body) {
  return new Promise((resolve, reject) => {
    let headers = {
      "Content-Type": "application/json",
      Authorization: "key=" + config.get('firebaseFcmKey')
    };
    let options = {
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      body: body,
      json: true,
      rejectUnauthorized: false,
      headers: headers
    };
    request(options, (error, response, body) => {
      if (error) {
        logger.error(
          loggerInfo, { EVENT: 'Error from external server for :' + loggerInfo.apiHandler },
          { OPTIONS: options }, { ERROR: error }, { RESPONSE: response }, { BODY: body }
        );
        return reject(error);
      }

      if (response == undefined) {
        error = new Error('No response from external server');
        return reject(error);
      }

      if (response.statusCode != '200') {
        error = new Error('Couldn\'t request with external server ');
        error.code = response.statusCode;
        logger.error(
          loggerInfo, { EVENT: 'Error from external server for : ' + loggerInfo.apiHandler },
          { OPTIONS: options }, { ERROR: error }, { RESPONSE: response }, { BODY: body }
        );
        return reject(error);
      }
      logger.trace(
        loggerInfo, { EVENT: 'Response from external server for : ' + loggerInfo.apiHandler },
        { OPTIONS: options }, { ERROR: error }, { RESPONSE: response }, { BODY: body }
      );

      resolve(body);
    });
  });
}


function insertLog(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO push_notification_logs (channel_id, message_id, skipped, ios_failed, ios_success, android_failed, android_success) VALUES (?,?,?,?,?,?,?)`;

    let queryObj = {
      query: query,
      args: [payload.channel_id, payload.message_id, payload.skipped, payload.ios_failed, payload.ios_success, payload.android_failed, payload.android_success],
      event: "insertLog"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
