/**
 * Created by puneetKumar on 25/01/18.
 */

const Promise                  = require('bluebird');
const config                   = require('config');
const { logger }               = require('../libs/pino_logger');
const constants                = require('../Utils/constants');
const utilityService           = require('../services/utility');
const commonFunctions          = require('../Utils/commonFunctions');

exports.notifyUser =  function notifyUser(logHandler, userIds, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let headers = {
        "Content-Type" : "application/json",
        source         : "Office chat Server",
        app_secret_key : payload.workspaceInfo.fugu_secret_key,
        app_version    : payload.app_version,
        device_type    : constants.getFuguDeviceType(payload.device_type) || 1
      };

      let opts = {
        en_user_id        : commonFunctions.encryptText(payload.workspaceInfo.fugu_user_id),
        user_unique_keys  : userIds,
        notification_type : payload.notification_type,
        domain            : payload.workspaceInfo.domain,
        notification_title: payload.notificationTitle,
        push_message      : payload.pushMessage
      };

      payload.fuguUserStatus ? opts.status = payload.fuguUserStatus : 0;

      let options = {
        method  : 'POST',
        url: config.get('socketBaseUrl') + constants.API_END_POINT.NOTIFY_USERS,
        headers : headers,
        json    : opts
      };

      let response = yield utilityService.sendHttpRequest(logHandler, options);
      if(response.statusCode != 200) {
        throw new Error(response.message || "Some error occured in editBusinessInfo");
      }
      return {};
    })().then(() => {
      resolve();
    }, (error) => {
      logger.error(logHandler, "fuguUserUnreadCount error", error);
      resolve();
    });
  });
}

