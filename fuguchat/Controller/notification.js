const _ = require('underscore');
const constants = require('../Utils/constants');
const userService = require('../services/user');
const notifierService = require('../services/notifier');
const handleChatService = require('../services/handleChat');
const pushNotificationBuilder = require('../Builder/pushNotification');
const workspaceService = require('../services/workspace');

async function markReadAll(logHandler, payload) {
  try {
    const userDetails = await workspaceService.getUsersByUniqueKey(logHandler,
      {
        domain_id: payload.businessInfo.domain_id,
        user_unique_key: payload.userInfo.user_unique_key
      });

    const userIds = userDetails.map(x => x.user_id);

    const options = {
      update_fields: {
        read_at: new Date()
      },
      where_clause: {
        user_unique_key: payload.userInfo.user_unique_key,
        user_id: userIds,
        read_at: null
      }
    };
    await notifierService.updateNotification(logHandler, options);
    return {};
  } catch (error) {
    throw new Error(error);
  }
}

async function getNotifications(logHandler, payload) {
  try {
    const options = {};
    options.user_unique_key = payload.userInfo.user_unique_key;
    options.page_start = parseInt(payload.page_start) || 1;
    options.page_end = payload.page_end ? payload.page_end - 1 : options.page_start + constants.getNotificationsPageSize - 1;
    const userDetails = await workspaceService.getUsersByUniqueKey(logHandler, { domain_id: payload.businessInfo.domain_id,user_unique_key: payload.userInfo.user_unique_key});

    const userIds = userDetails.map(x => x.user_id);
    
    // for (let data of userDetails) {
    //   userIds.push(data.user_id);
    // }
   
    options.userIds = userIds;

    const updateObj = {
      update_fields: {
        counted: 0
      },
      where_clause: {
        user_id: userIds
      }
    };
    const result = await notifierService.getNotifications(logHandler, options);

    await notifierService.updateNotification(logHandler, updateObj);
    await userService.updateUserNotificationCount(logHandler, { notificationCount: 0, fugu_user_id: userIds });

    options.notification_type = pushNotificationBuilder.notificationType.READ_UNREAD_NOTIFICATION;
    const userPushList = await userService.getUsersUniqueDevices(logHandler, { user_unique_keys: [options.user_unique_key] });

    options.usersUnreadNotificationCount = {};
    options.isSilent = true;
    options.ccMentionPushUsers = {}
    options.followThreadUserIds = {};
    options.userCCPushList = { user_unique_key: options.user_unique_key, user_id: payload.userInfo.user_id };
    await handleChatService.controlChannelPushes(logHandler, options);
    if (_.isEmpty(userPushList)) {
      return { notifications: result, notification_page_size: constants.getNotificationsPageSize };
    }
    options.userPushList = userPushList;
    options.userPushList = handleChatService.preparePushNotificationList(options);
    await handleChatService.pushNotifications(logHandler, options);
    return { notifications: result, notification_page_size: constants.getNotificationsPageSize };
  } catch (error) {
    throw new Error(error);
  }
}

async function getUnreadNotifications(logHandler, payload) {
  try {
    const options = {};
    options.user_unique_key = payload.userInfo.user_unique_key;
    const notifications = await notifierService.getUnreadNotifications(logHandler, { user_unique_key: options.user_unique_key });
    return { unread_notification: notifications };
  } catch (error) {
    throw new Error(error);
  }
}

exports.markReadAll = markReadAll;
exports.getNotifications = getNotifications;
exports.getUnreadNotifications = getUnreadNotifications;
