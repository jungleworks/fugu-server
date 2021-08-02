const Promise = require('bluebird');
const _ = require('underscore');
const { logger } = require('../libs/pino_logger');
const notificationBuilder = require('../Builder/notification');
const constants = require('../Utils/constants');
const config = require('config');
const utilityService = require('../services/utility');
const utils = require('../Utils/commonFunctions');
const userService = require('../services/user');
const channelService = require('../services/channel');
const handleChatService = require('../services/handleChat');
const pushNotificationBuilder = require('../Builder/pushNotification');
const notificationCenterBuilder = require('../Builder/notificationCenter');
const dbHandler = require('../database').dbHandler;
const businessService = require('../services/business');
// const businessService               = require('../services/business');



exports.sendCCPushes = sendCCPushes;
exports.sendCCEvent = sendCCEvent;
exports.sendControlChannelPushes = sendControlChannelPushes;
exports.sendControlChannelEvent = sendControlChannelEvent;
exports.sendMessageToFaye = sendMessageToFaye;
exports.notifyUsers = notifyUsers;
exports.saveNotifications = saveNotifications;
exports.getUnreadCount = getUnreadCount;
exports.updateUsersNotification = updateUsersNotification;
exports.updateNotification = updateNotification;
exports.getNotifications = getNotifications;
exports.getUserChannelMessage = getUserChannelMessage;
exports.syncNotificationCount = syncNotificationCount;
exports.getUnreadNotifications = getUnreadNotifications;
exports.updateChannelNotification = updateChannelNotification;

let logHandler = {
  apiModule: "notifier",
  apiHandler: "sendControlChannelPushes"
};

function sendControlChannelPushes(opts, cb) {
  try {
    let options = {
      url: config.get('fuguChatURL') + constants.API_END_POINT.HANDLE_PUSH,
      method: 'POST',
      json: {
        pushObject: opts
      }
    };
    utilityService.sendHttpRequest(logHandler, options).then((data) => { }, (error) => { });
  } catch (error) {
    logger.error(logHandler, "Error in sendControlChannelPushes ", error);
  }
  if (cb) { return cb(); }
}

function sendControlChannelEvent(opts, cb) {
  try {
    let pushObject = {
      messageAt: opts.messageAt,
      message: opts.message
    };
    let options = {
      url: config.get('fuguChatURL') + constants.API_END_POINT.HANDLE_PUSH,
      method: 'POST',
      json: {
        pushObject: pushObject
      }
    };
    utilityService.sendHttpRequest(logHandler, options).then((data) => { }, (error) => { });
  } catch (error) {
    logger.error(logHandler, "Error in sendControlChannelEvent ", error);
  }
  if (cb) { return cb(); }
}


//--------------------------------------------------------------
//                     SENDING CC PUSHES
//--------------------------------------------------------------


function sendCCPushes(logHandler, opts) {
  logger.trace(logHandler, "cc initializing", { ccPushListLength: opts.ccPushList.length });
  try {

    for (let userPush of opts.ccPushList) {
      let messageAt = userPush.messageAt;
      const message = userPush.message;
      message.control_channel = true;
      messageAt = messageAt.replace(/\//, '');

      io.sockets.in(messageAt).emit(notificationBuilder.controlChannelEvent[message.notification_type], message);
    }
  } catch (error) {
    logger.error(logHandler, "Error in cc ", error);
  }

  // logging cc pushes
  let userList = [];
  for (let userPush of opts.ccPushList) {
    userList.push(userPush.messageTo);
  }
  userList.sort();
  logger.debug(logHandler, { sendControlChannelPushes: userList });
}


function sendCCEvent(logHandler, opts) {
  try {
    const messageAt = opts.messageAt;
    const message = opts.message;
    // publish message
    io.sockets.in(messageAt).emit(notificationBuilder.controlChannelEvent[message.notification_type], message);
  } catch (error) {
    logger.error(logHandler, "Error in cc ", error);
  }

  logger.debug(logHandler, { sendControlChannelEvent: opts });
}

// TODO : refactor
function sendMessageToFaye(logHandler, opts) {
  try {
    const messageAt = opts.channel;
    const message = opts.data;
    var params = {
      userIds: [message.user_id]
    };
    message.server_push = 1;
    message.date_time = utils.getCurrentTime();
    userService.getUsersWithIds(logHandler, params).then((result) => {
      if (!result.length) {
        logger.error(logHandler, "Error in sending message ", "no user found");
      } else {
        message.full_name = result[0].full_name || "";
      }
      // publish message
      io.sockets.in(messageAt).emit(notificationBuilder.controlChannelEvent[message.notification_type], message);
    });
  } catch (error) {
    logger.error(logHandler, "Error in cc ", error);
  }
}

function notifyUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let businessInfo = opts.businessInfo;
      let channelInfo = opts.channelInfo;
      let userInfo = opts.userInfo;
      let notificationType = opts.notificationType;
      let pushMessage = opts.pushMessage;
      let userCCPushList = yield channelService.getUsersParticipatedInChannels(logHandler, { user_ids: opts.userIds, channel_id: channelInfo.channel_id });
      let userNotificationMap = {};

      // for remove user send faye to them also
      if (notificationType == pushNotificationBuilder.notificationType.REMOVE_USER && opts.removedUserId) {
        userCCPushList.push({ user_id: opts.removedUserId, user_unique_key: opts.removedUserUniquekey });
        opts.userIds.push(opts.removedUserId);
      }

      opts.userIdsToUserUniqueKeyMap = {};
      opts.skipSnoozeNotificationMap = {};

      for (let user of Array.from(userCCPushList)) {
        if (user.notification_snooze_time && new Date() < new Date(user.notification_snooze_time)) {
          opts.skipSnoozeNotificationMap[user.user_unique_key] = true;
        }

        userNotificationMap[user.user_id] = user.notification;
        opts.userIdsToUserUniqueKeyMap[user.user_id] = user.user_unique_key;
        if (opts.video_call_type == constants.videoCallResponseTypes.VIDEO_ANSWER || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY || opts.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY_CONFERENCE) {
          if (user.user_id == userInfo.user_id) {
            if (opts.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY_CONFERENCE) {
              user.video_call_type = constants.videoCallResponseTypes.HUNGUP_CONFERENCE
            } else {
              user.video_call_type = constants.videoCallResponseTypes.CALL_HUNG_UP;
            }
          } else {
            user.video_call_type = opts.video_call_type;
          }
        }
      }


      let usersToDevicePayload = {
        userIds: opts.userIds
      }
      if (!_.isEmpty(opts.skip_user_devices)) {
        usersToDevicePayload.skip_user_devices = opts.skip_user_devices;
      }

      if (opts.messageType == constants.messageType.VIDEO_CALL) {
        if (opts.video_call_type != constants.videoCallResponseTypes.REJECT_CONFERENCE) {
          usersToDevicePayload.user_id = userInfo.user_id;
        }
        if (opts.device_id && (opts.video_call_type == constants.videoCallResponseTypes.VIDEO_ANSWER || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY || opts.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY_CONFERENCE)) {
          usersToDevicePayload.device_id = opts.device_id;
          if (opts.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || opts.video_call_type == constants.videoCallResponseTypes.USER_BUSY_CONFERENCE) {
            opts.video_call_type = constants.videoCallResponseTypes.HUNGUP_CONFERENCE
          } else {
            opts.video_call_type = constants.videoCallResponseTypes.CALL_HUNG_UP;
          }
        }
      }
      let userPushList = yield userService.getLatestUsersDeviceDetails(logHandler, usersToDevicePayload);
      if (notificationType == pushNotificationBuilder.notificationType.READ_ALL ||
        notificationType == pushNotificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP ||
        (opts.messageType == constants.messageType.VIDEO_CALL &&
          notificationType != pushNotificationBuilder.notificationType.MISSED_CALL &&
          constants.sendVoipPushForVideoTypes.includes(opts.video_call_type))) {
        for (let row of userPushList) {
          if (row.device_type == constants.deviceType.IOS) {
            row.device_token = row.voip_token;
          }
        }
      }
      let iosPushUser = [];
    
      if (notificationType == pushNotificationBuilder.notificationType.MISSED_CALL) {
        for (i = 0; i < userPushList.length; i++) {
          if (userPushList[i].device_type == constants.deviceType.IOS) {
            userPushList[i].device_details = JSON.parse(userPushList[i].device_details);
            if (userPushList[i].device_details.app_version < "187") {
              userPushList.splice(i, 1);
            }
          }
        }
      }

      for (let user of Array.from(userPushList)) {
        user.notification = userNotificationMap[user.user_id];
        if (opts.tagged_chat) {
          user.tagged_chat = true;
        }
      }
      let [businessDetails] = yield businessService.getBusinessDetails(logHandler, { app_secret_key: businessInfo.app_secret_key });

      let options = {};
      options.skipSnoozeNotificationMap = opts.skipSnoozeNotificationMap;
      options.domain = businessDetails.domain;
      options.userPushList = userPushList;
      options.userIds = opts.userIds;
      options.workspace = businessInfo.workspace;
      options.tagged_chat = opts.tagged_chat;
      options.only_admin_can_message = opts.only_admin_can_message;
      options.userIdsToUserUniqueKeyMap = opts.userIdsToUserUniqueKeyMap;
      options.message_id = opts.message_id;
      options.muid = opts.muid;
      options.stop_screen_share = opts.stop_screen_share;
      options.thread_muid = opts.thread_muid;
      options.app_secret_key = businessInfo.app_secret_key;
      options.userInfo = utils.cloneObject(userInfo);
      options.user_id = userInfo.user_id;
      options.user_unique_key = userInfo.user_unique_key;
      options.send_by = userInfo.user_id;
      options.last_sent_by_user_type = userInfo.user_type;
      options.channel_id = channelInfo.channel_id;
      options.message = opts.message || "";
      options.noti_msg = opts.message || "";
      options.message_type = opts.messageType;
      options.refresh_call = opts.refresh_call;
      options.hungup_type = opts.hungup_type;
      options.full_name = userInfo.full_name;
      options.business_id = businessDetails.workspace_id;
      options.bot_channel_name = channelInfo.label;
      options.is_deleted_group = opts.is_deleted_group;
      options.reason = opts.reason;
      options.chat_type = channelInfo.chat_type;
      options.channel_status = channelInfo.status;
      options.channel_image = channelInfo.channel_thumbnail_url;
      options.channel_thumbnail_url = channelInfo.channel_thumbnail_url;
      options.email = userInfo.email || "";
      options.push_message = pushMessage;
      options.label = opts.label || channelInfo.label || channelInfo.custom_label || userInfo.full_name;
      options.notification_type = notificationType;
      options.invite_link = opts.invite_link;
      options.members_info = opts.members_info;
      options.custom_label = opts.custom_label;
      options.removed_user_id = opts.removedUserId;
      options.notToUpdateUsersMap = opts.notToUpdateUsersMap;
      options.added_member_info = opts.added_member_info;
      options.isSilent = opts.isSilent;
      options.usersUnreadNotificationCount = opts.usersUnreadNotificationCount;
      options.updateFields = opts.updateFields;
      options.update_notification_count = opts.update_notification_count;
      options.video_call_type = opts.video_call_type;
      options.sdp = opts.sdp;
      options.rtc_candidate = opts.rtc_candidate;
      options.user_thumbnail_image = opts.user_thumbnail_image;
      options.device_id = opts.device_id;
      options.is_screen_share = opts.is_screen_share;
      options.is_thread_message = opts.is_thread_message;
      options.device_type = opts.device_type;
      options.call_type = opts.call_type;
      options.tagged_users = opts.tagged_users;
      options.thread_owner_name = opts.thread_owner_name;
      options.user_ids_to_remove_admin = opts.user_ids_to_remove_admin;
      options.user_ids_to_make_admin = opts.user_ids_to_make_admin;
      options.is_chat_type_changed = opts.is_chat_type_changed;
      options.ccMentionPushUsers = {};
      options.followThreadUserIds = {};
      options.business_name = businessDetails.workspace_name;
      options.title = yield handleChatService.getChatTitle(logHandler, userInfo, channelInfo, businessInfo);
      saveNotifications(logHandler, options);
      options.userPushList = handleChatService.preparePushNotificationList(options);

      options.userCCPushList = userCCPushList;
      logger.trace(logHandler, "??>>>>VIDEO CALL>>>>", options);
      yield handleChatService.controlChannelPushes(logHandler, options);
      if(opts.isSilent && ((opts.messageType == constants.messageType.VIDEO_CALL && opts.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS) || options.notification_type == notificationBuilder.notificationType.READ_ALL)){
        for(let i = 0; i < userPushList.length; i++){
          if(userPushList[i].device_type == constants.deviceType.IOS){
            try{
              let deviceDetails = JSON.parse(userPushList[i].device_details);
              if(deviceDetails.app_version > 232){
                options.remove_voip = true;
                iosPushUser.push(userPushList[i]);
              }
            }catch(err){
              console.log("ERROR IN IOS PARSING", err);
            }
           
          }
        }
      }
      if(options.isSilent && options.message_type == constants.messageType.VIDEO_CALL && options.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS && options.remove_voip){
        options.userPushList = iosPushUser;
        options.userPushList = handleChatService.preparePushNotificationList(options);
        yield handleChatService.pushNotifications(logHandler, options, businessInfo);
      }else if (options.isSilent) {
        if (!(options.message_type == constants.messageType.VIDEO_CALL && !(options.video_call_type == constants.videoCallResponseTypes.REJECT_CONFERENCE
          || options.video_call_type == constants.videoCallResponseTypes.CALL_REJECTED ||
          options.video_call_type == constants.videoCallResponseTypes.CALL_HUNG_UP ||
          options.video_call_type == constants.videoCallResponseTypes.READY_TO_REFRESH ||
          options.video_call_type == constants.videoCallResponseTypes.HUNGUP_CONFERENCE))) {
          yield handleChatService.sendSilentPushNotification(logHandler, options);
        }
      } else {
        if (options.message_type == constants.messageType.VIDEO_CALL && ![constants.videoCallResponseTypes.START_CALL,
        constants.videoCallResponseTypes.START_CONFERENCE,
        constants.videoCallResponseTypes.REJECT_CONFERENCE, constants.videoCallResponseTypes.USER_BUSY_CONFERENCE,
        constants.videoCallResponseTypes.HUNGUP_CONFERENCE,
        constants.videoCallResponseTypes.CALL_HUNG_UP, constants.videoCallResponseTypes.USER_BUSY,
        constants.videoCallResponseTypes.CALL_REJECTED,
        ].includes(options.video_call_type)) {
          return;
        }
        yield handleChatService.pushNotifications(logHandler, options, businessInfo);
      }

    })().then((data) => {
      logger.trace(logHandler, { DATA: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}
function saveNotifications(logHandler, options) {

  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (!options.update_notification_count) {
        return {};
      }
      let opts = utils.cloneObject(options);
      opts.savedMessageUserIds = [];
      opts.users = {};

      // ignore other types notifications
      if (!(new Set(utils.getAllValuesFromMap(notificationCenterBuilder.notificationType)).has(opts.notification_type))) {
        return {};
      }
      if (opts.notification_type == notificationCenterBuilder.notificationType.ADD_MEMBER && opts.isSilent) {
        return;
      }

      if (opts.muid && opts.notification_type == notificationCenterBuilder.notificationType.MESSAGE && !opts.thread_muid && !opts.tagged_chat) {
        opts.label = "on " + opts.label;
      }

      for (let userId of opts.userIds) {
        let notificationToBeSaved = handleChatService.prepareNotificationToBeSaved(opts, { user_id: userId });
        opts.users[userId] = {};
        opts.users[userId].notificationToBeSaved = notificationToBeSaved;
        opts.users[userId].notificationToBeSaved.user_unique_key = opts.userIdsToUserUniqueKeyMap[userId];

        if (opts.muid && opts.notification_type == notificationCenterBuilder.notificationType.MESSAGE && !opts.thread_muid && !opts.tagged_chat) {
          if (opts.chat_type == constants.chatType.O20_CHAT) {
            opts.users[userId].notificationToBeSaved.notification_title = " sent you a message ";
          }
          if (opts.chat_type != constants.chatType.O20_CHAT) {
            opts.users[userId].notificationToBeSaved.notification_title = " sent a message " + opts.label;
          }
        }
      }
      opts.validUserIdsToIncrementCount = [];

      if (opts.muid && opts.notification_type == notificationCenterBuilder.notificationType.MESSAGE && !opts.tagged_chat) {
        let userAlreadySavedMessage = yield getMessageNotification(logHandler, opts);
        for (let row of userAlreadySavedMessage) {
          if (!row.counted) {
            opts.validUserIdsToIncrementCount.push(row.user_id);
          }
          opts.savedMessageUserIds.push(row.user_id);
        }

        if (!_.isEmpty(opts.savedMessageUserIds)) {
          yield updateUsersNotification(logHandler, opts);
        }
      }

      opts.savedMessageUserIdsSet = new Set(opts.savedMessageUserIds);

      /*  if(opts.notification_type == pushNotificationBuilder.notificationType.NEW_WORKSPACE) {
          opts.userIds = [opts.userIds[1]];
        }*/
      yield insertNotifications(logHandler, opts);

      if (!(opts.muid && opts.notification_type == notificationCenterBuilder.notificationType.MESSAGE && !opts.tagged_chat)) {
        opts.validUserIdsToIncrementCount = opts.userIds;
      }

      if (_.isEmpty(opts.validUserIdsToIncrementCount)) {
        return {};
      }

      let userUniqueKeys = yield userService.getUsersWithIds(logHandler, { userIds: opts.validUserIdsToIncrementCount });
      let userUuqs = [];
      for (let row of userUniqueKeys) {
        userUuqs.push(row.user_unique_key);
      }
      if (opts.notification_type == notificationCenterBuilder.notificationType.CHANGE_GROUP_INFO && userUuqs.indexOf(options.userInfo.user_unique_key) > -1) {
        userUuqs.splice(userUuqs.indexOf(options.userInfo.user_unique_key), 1);
      }

      if (_.isEmpty(userUuqs)) {
        return {};
      }

      if (opts.notToUpdateUsersMap) {
        let skipUserIds = Object.keys(opts.notToUpdateUsersMap).map(Number);
        if (skipUserIds.length) {
          opts.validUserIdsToIncrementCount = opts.validUserIdsToIncrementCount.filter(id => !skipUserIds.includes(id))
        }
      }

      if (opts.validUserIdsToIncrementCount.length) {
        yield userService.incrementUserNotificationUnreadCount(logHandler, { fugu_user_id: opts.validUserIdsToIncrementCount });
      }
    })().then((data) => {
      logger.trace(logHandler, { DATA: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}

function insertNotifications(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let allowedFields = utils.getAllKeysFromMap(notificationCenterBuilder.getObjectBasedOnNotificationTypes(opts.notification_type));

      opts.userIds = Array.from(new Set(opts.userIds))
      // for other notifications like remove clear chat or delete message
      if (!allowedFields) {
        return resolve();
      }
      let values = [];
      let placeHolder = ``;
      for (let userId of opts.userIds) {
        if (!opts.savedMessageUserIdsSet.has(userId) && userId != opts.userInfo.user_id) {
          opts.validUserIdsToIncrementCount.push(userId);
          for (let field of allowedFields) {
            values.push(opts.users[userId].notificationToBeSaved[field]);
          }
          placeHolder = placeHolder + " (" + new Array(allowedFields.length).fill("?").join(', ') + "),";
        }
      }
      placeHolder = placeHolder.substr(0, placeHolder.length - 1);

      if (_.isEmpty(values)) {
        return resolve();
      }
      let query = "INSERT INTO `notifications`(" + allowedFields.join(', ') + " )  VALUES " + placeHolder;

      let queryObj = {
        query: query,
        args: values,
        event: "saveNotifications"
      };

      yield dbHandler.executeQuery(logHandler, queryObj);

    })().then((data) => {
      logger.trace(logHandler, { DATA: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}

function getMessageNotification(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    if (opts.thread_muid) {
      placeHolder = ' and muid = ?';
    } else {
      placeHolder = ' and thread_muid is null';
    }
    let query = `Select user_id, counted from notifications where user_id IN (?) and notification_type = ? and app_secret_key = ? and channel_id = ? and ( is_tagged = 0 || is_tagged is null ) ${placeHolder}`;

    let queryObj = {
      query: query,
      args: [opts.userIds, pushNotificationBuilder.notificationType.MESSAGE, opts.app_secret_key, opts.channel_id, opts.muid],
      event: "saveNotifications"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUsersNotification(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    if (opts.thread_muid) {
      placeHolder = ' and muid = ?';
    } else {
      placeHolder = ' and thread_muid is null';
    }

    let query = `update notifications set action_by_user_id = ?, action_by_user_image = ?, action_by_user_name = ?, message = ?, muid = ?, thread_muid = ?, read_at = null, updated_at = now(), counted = ? where user_id IN (?) and notification_type = ? and (is_tagged = 0 or is_tagged is null) and app_secret_key = ? and channel_id = ? ${placeHolder} `;

    let queryObj = {
      query: query,
      args: [opts.userInfo.user_id, opts.userInfo.user_image, opts.userInfo.full_name, opts.message, opts.muid, opts.thread_muid, 1, opts.savedMessageUserIds, pushNotificationBuilder.notificationType.MESSAGE, opts.app_secret_key, opts.channel_id, opts.muid],
      event: "updateUsersNotification"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUnreadCount(logHandler, userInfo) {
  return new Promise((resolve, reject) => {
    let query = "select count(*) as unread_count from notifications where user_unique_key = ? and read_at is null";

    let queryObj = {
      query: query,
      args: [userInfo.user_unique_key],
      event: "getUnreadNotificationCount"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if (_.isEmpty(result)) {
        return resolve({ unread_count: 0 });
      }
      return resolve({ unread_count: result[0].unread_count });
    }, (error) => {
      reject(error);
    });
  });
}

function updateNotification(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(payload.update_fields)) {
      return reject(new Error("Update Fields Missing"));
    }
    if (_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }

    let updateObj = {};
    let validUpdateColumns = new Set(["read_at", "channel_id", "muid", "counted", "status"]);
    _.each(payload.update_fields, (value, key) => {
      if (validUpdateColumns.has(key) && (value === null || value == 0 || value)) {
        updateObj[key] = value;
      }
    });

    let values = [];
    let whereCondition = "";
    _.each(payload.where_clause, (value, key) => {
      if(key == 'read_at'){
        whereCondition += " AND " + key + " IS ?";
      }else{
        whereCondition += " AND " + key + " IN (?) ";
      }
      values.push(value);
    });

    let query = `UPDATE notifications SET ?  where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: [updateObj].concat(values),
      event: "updateNotification"
    };
    
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      logger.error(logHandler, { EVENT: "updateNotification", ERROR: error });
      reject(error);
    });
  });
}

function updateChannelNotification(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE notifications SET status = 0 where channel_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.channel_id],
      event: "updateChannelNotification"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      logger.error(logHandler, { EVENT: "updateNotification", ERROR: error });
      reject(error);
    });
  });
}

function getNotifications(logHandler, options) {
  return new Promise((resolve, reject) => {
    let query = "select * from notifications where user_id IN (?) AND status = 1 order by updated_at DESC limit ?, ?";

    let queryObj = {
      query: query,
      args: [options.userIds, options.page_start - 1, options.page_end - options.page_start + 1],
      event: "getNotifications "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserChannelMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = "select read_at  from notifications where user_unique_key = ? and channel_id = ?";

    let queryObj = {
      query: query,
      args: [opts.user_unique_key, opts.channel_id],
      event: "getUserChannelMessage"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersNotifications(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = "select counted, user_unique_key, notification_type, is_tagged from notifications where user_unique_key In (?) and channel_id = ? and notification_type = ?";

    let queryObj = {
      query: query,
      args: [opts.user_unique_keys, opts.channel_id, opts.notification_type],
      event: "getUsersNotificationsBasedOnNotificationType"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function syncNotificationCount(logHandler, options) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let usersUnreadCount = yield getUsersNotifications(logHandler, { channel_id: options.channel_id, user_unique_keys: options.user_unique_keys, notification_type: notificationCenterBuilder.notificationType.MESSAGE });
      options.userUniqueKeysToNotify = [];
      let userUniqueKeysWithCount = [];
      let userUniqueKeysWithoutCount = [];
      for (let row of usersUnreadCount) {
        if (!row.counted) {
          userUniqueKeysWithoutCount.push(row.user_unique_key);
        }
        if (row.counted && (row.notification_type == notificationCenterBuilder.notificationType.MESSAGE && !row.is_tagged)) {
          userUniqueKeysWithCount.push(row.user_unique_key);
        }
        options.userUniqueKeysToNotify.push(row.user_unique_key);
      }

      if (_.isEmpty(options.userUniqueKeysToNotify)) {
        return {};
      }

      options.businessInfo.fugu_secret_key ? options.businessInfo.app_secret_key = options.businessInfo.fugu_secret_key : 0;
      let [businessDetails] = yield businessService.getBusinessDetails(logHandler, { app_secret_key: options.businessInfo.app_secret_key });
      let userDetails = yield businessService.getAllBusinessUserInfo(logHandler, { domain_id: businessDetails.domain_id, user_unique_key: options.userUniqueKeysToNotify });

      let userIds = userDetails.map(x => x["fugu_user_id"]);
      options.userIds = userIds;

      if (options.decrement_count && !_.isEmpty(userUniqueKeysWithCount)) {
        let updateOptions = {
          counted: 0,
          user_unique_keys: options.user_unique_keys,
          channel_id: options.channel_id,
          read_at: new Date(),
          muid: options.muid,
          thread_muid: options.thread_muid,
          notification_type: notificationCenterBuilder.notificationType.MESSAGE
        };
        yield updateCounted(logHandler, updateOptions);
        yield userService.decrementUserNotificationUnreadCount(logHandler, { userIds: userIds, workspace_id: businessDetails.workspace_id });
      }

      if (_.isEmpty(options.userUniqueKeysToNotify)) {
        return {};
      }

      options.notification_type = pushNotificationBuilder.notificationType.READ_UNREAD_NOTIFICATION;
      // let users = yield userService.getUsersUsingUserUniqueKey(logHandler, options.userUniqueKeysToNotify);

      let usersUnreadNotifications = yield userService.getUsersNotificationUnreadCount(logHandler, { fugu_user_id: userIds, user_unique_key: options.userUniqueKeysToNotify, domain_id: businessDetails.domain_id });
      options.usersUnreadNotificationCount = {};
      for (let row of usersUnreadNotifications) {
        if (!options.usersUnreadNotificationCount[row.user_unique_key]) {
          options.usersUnreadNotificationCount[row.user_unique_key] = {};
          //options.usersUnreadNotificationCount[row.user_unique_key].count = 0;
        }
        options.usersUnreadNotificationCount[row.user_unique_key].count = row.unread_notification_count;
      }
      options.isSilent = true;
      options.app_secret_key = options.businessInfo.app_secret_key;
      options.userCCPushList = usersUnreadNotifications;
      yield Promise.promisify(handleChatService.controlChannelPushes).call(null, logHandler, options);

      let userPushList = yield userService.getUsersUniqueDevices(logHandler, { user_unique_keys: options.userUniqueKeysToNotify });
      if (_.isEmpty(userPushList)) {
        return {};
      }
      options.userPushList = userPushList;
      options.userPushList = handleChatService.preparePushNotificationList(options);
      yield handleChatService.pushNotifications(null, logHandler, options);
      return {};
    })().then((data) => {
      logger.trace(logHandler, { DATA: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}


function updateCounted(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [opts.counted];
    let placeHolder = '';
    if (opts.thread_muid) {
      placeHolder = ' and muid = ?';
    }

    let setVariable = '';
    if (opts.read_at) {
      setVariable = `, read_at = NOW() `;
    }

    values.push(opts.user_unique_keys, pushNotificationBuilder.notificationType.MESSAGE, opts.channel_id, opts.muid);
    let query = `update notifications set counted = ? ${setVariable} where user_unique_key IN (?) and notification_type = ? and (is_tagged = 0 or is_tagged is null) and channel_id = ? ${placeHolder}`;

    let queryObj = {
      query: query,
      args: values,
      event: "updateUsersNotification"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUnreadNotifications(logHandler, options) {
  return new Promise((resolve, reject) => {
    let query = "select user_unique_key, channel_id, muid, notification_type, thread_muid, is_tagged from notifications where user_unique_key = ? and status = 1 and counted = 1";

    let queryObj = {
      query: query,
      args: [options.user_unique_key],
      event: "getNotifications "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
