const request                   = require('request');
const _                         = require('underscore');
const Promise                   = require('bluebird');
const pushNotification          = require('../Controller/pushNotification');
const { logger }                = require('../libs/pino_logger');
const commonFunctions           = require('../Utils/commonFunctions');
const dbHandler                 = require('../database').dbHandler;
const notificationBuilder       = require('../Builder/notification');
const pushNotificationBuilder   = require('../Builder/pushNotification');
const notificationCenterBuilder = require('../Builder/notificationCenter');
const constants                 = require('../Utils/constants');
const notifierService           = require('../services/notifier');
const userService               = require('../services/user');
const channelService            = require('../services/channel');
const conversationService       = require('../services/conversation');
const pushLogsService           = require('../services/pushLogs');
const Encoder                   = require('node-html-encoder').Encoder;

const encoder = new Encoder('entity');

exports.controlChannelPushes            = controlChannelPushes;
exports.fetchBusinessPushTitle          = fetchBusinessPushTitle;
exports.getPushMessage                  = getPushMessage;
exports.preparePushNotificationList     = preparePushNotificationList;
exports.pushNotifications               = pushNotifications;
exports.getChatTitle                    = getChatTitle;
exports.sendSilentPushNotification      = sendSilentPushNotification;
exports.insertOrUpdateTaggedUsers       = insertOrUpdateTaggedUsers;
exports.prepareNotificationToBeSaved    = prepareNotificationToBeSaved;
exports.getPushMessageAndroid           = getPushMessageAndroid;

function sendSilentPushNotification(logHandler, opts, cb) {
  return new Promise((resolve, reject) => {
    let users = Array.from(opts.userPushList);
    let validUserIds = [];
    let inValidUserIds = [];
    let silentPushNotificationList = [];
    let webNotificationList = [];
    // TODO : refactor
    for (let i = 0; i < users.length; i++) {
      if (commonFunctions.isValidObject(users[i].device_type)
        && users[i].device_token
        && !(users[i].user_type == constants.userType.AGENT && users[i].online_status == constants.onlineStatus.OFFLINE)) {
        // silent push
        let notificationObject = pushNotificationBuilder.getObject(pushNotificationBuilder.notificationType.NOTIFICATION);
        notificationObject.business_id = (users[i].user_type != constants.userType.AGENT) ? users[i].business_id : 0;
        notificationObject.push_to = users[i].user_id;
        notificationObject.device_token = users[i].device_token;
        notificationObject.device_type = users[i].device_type;
        notificationObject.app_type = users[i].app_type || 1;
        notificationObject.device_info = {};
        notificationObject.remove_voip = opts.remove_voip;
        users[i].push_payload.showpush = 0; // for slient push
        notificationObject.payload = users[i].push_payload;
        validUserIds.push(users[i].user_id);
        silentPushNotificationList.push(notificationObject);
      }
    }
    logger.trace(logHandler, { WEB_NOTIFICATION_LENGTH: webNotificationList.length });
    logger.trace(logHandler, { SILENT_PUSH_NOTIFICATIONS: silentPushNotificationList });

    // logging pushes
    let pushLog = {};
    inValidUserIds.sort();
    validUserIds.sort();
    pushLog.skipping = inValidUserIds;
    pushLog.sending = validUserIds;
    logger.trace(logHandler, { PUSH_LOG: pushLog });

    let pushLogData = {
      message_id: opts.message_id,
      channel_id: opts.channel_id,
      skipped: ' | ' + inValidUserIds.toString()
    };

    // sending silent push
    if (!_.isEmpty(silentPushNotificationList)) {
      logger.trace(logHandler, "SENDING SILENT PUSH IN MAIN FUNCTION", silentPushNotificationList);
      pushNotification.sendBulkNotification(logHandler, silentPushNotificationList, pushLogData);
    }

    pushNotification.webNotification(logHandler, webNotificationList);

    pushLogsService.insertLog(logHandler, pushLogData).then((result) => {
    }).catch((error) => {
      logger.error(logHandler, { EVENT: "push log error", ERROR: error });
    });
    resolve();
  });
}


function controlChannelPushes(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let controlChannelPushes = [];
    let ccPushListUsers = [];
    let editMessage;
    // prepare messages
    opts.ccMentionPushUsers ? 0 : opts.ccMentionPushUsers = {};
    opts.deviceMap ? 0 : opts.deviceMap = {};
    opts.notToUpdateUsersMap ? editMessage = false : opts.notToUpdateUsersMap = {};
    opts.followThreadUserUniqueKey ? 0 : opts.followThreadUserUniqueKey = {};
    opts.allDeviceMap ? 0 : opts.allDeviceMap = {};
    opts.skipSnoozeNotificationMap ? 0 : opts.skipSnoozeNotificationMap = {};
    let currentTime = commonFunctions.getCurrentTime();
    for (let user of Array.from(opts.userCCPushList)) {
      let messageToSend = notificationBuilder.getObject(opts.notification_type);
      // logger.debug(logHandler,"-------------",opts)
      messageToSend.channel_id = opts.channel_id;
      messageToSend.caller_text = opts.caller_text;
      messageToSend.username = opts.username;
      messageToSend.is_deleted_group = opts.is_deleted_group;
      messageToSend.invite_link = opts.invite_link;
      messageToSend.is_audio_conference = opts.is_audio_conference;
      messageToSend.muid = opts.muid;
      messageToSend.workspace = opts.workspace;
      messageToSend.stop_screen_share = opts.stop_screen_share;
      messageToSend.reason = opts.reason;
      messageToSend.refresh_call = opts.refresh_call;
      messageToSend.thread_muid = opts.thread_muid;
      messageToSend.message = opts.message;
      messageToSend.full_name = opts.full_name;
      messageToSend.user_id = opts.user_id;
      messageToSend.hungup_type = opts.hungup_type;
      messageToSend.user_unique_key = opts.user_unique_key;
      messageToSend.user_type = opts.user_type;
      messageToSend.last_sent_by_id = opts.send_by;
      messageToSend.last_sent_by_full_name = opts.full_name;
      messageToSend.last_sent_by_user_type = opts.last_sent_by_user_type;
      messageToSend.user_thumbnail_image = opts.user_thumbnail_image;
      messageToSend.label = opts.label || opts.full_name || constants.anonymousUserName;
      messageToSend.title = opts.label || opts.full_name || constants.anonymousUserName;
      messageToSend.chat_status = opts.channel_status;
      messageToSend.bot_channel_name = opts.bot_channel_name || "";
      messageToSend.date_time = currentTime;
      messageToSend.channel_image = opts.channel_thumbnail_url;
      messageToSend.channel_thumbnail_url = opts.channel_thumbnail_url;
      messageToSend.chat_type = opts.chat_type;
      messageToSend.message_type = opts.message_type;
      messageToSend.is_thread_message = opts.is_thread_message;
      messageToSend.members_info = opts.members_info;
      messageToSend.custom_label = opts.custom_label;
      messageToSend.removed_user_id = opts.removed_user_id;
      messageToSend.image_url = opts.image_url;
      messageToSend.thumbnail_url = opts.thumbnail_url;
      messageToSend.added_member_info = opts.added_member_info;
      messageToSend.app_secret_key = opts.app_secret_key;
      messageToSend.message_id = opts.message_id;
      messageToSend.video_call_type = user.video_call_type || opts.video_call_type;
      messageToSend.sdp = opts.sdp;
      messageToSend.rtc_candidate = opts.rtc_candidate;
      messageToSend.device_id = opts.device_id;
      messageToSend.update_notification_count = opts.notToUpdateUsersMap[user.user_id] ? false : opts.notification_type == 1 ? false : opts.update_notification_count;
      messageToSend.is_screen_share = opts.is_screen_share;
      messageToSend.device_type = opts.device_type;
      messageToSend.call_type = opts.call_type;
      messageToSend.user_ids_to_remove_admin = opts.user_ids_to_remove_admin;
      messageToSend.user_ids_to_make_admin = opts.user_ids_to_make_admin;
      messageToSend.is_chat_type_changed = opts.is_chat_type_changed;
      messageToSend.domain = opts.domain;
      messageToSend.question = opts.question;
      messageToSend.comment = opts.comment;
      messageToSend.poll_options = opts.poll_options;
      messageToSend.multiple_select = opts.multiple_select;
      messageToSend.expire_time = opts.expire_time;
      messageToSend.url = opts.url;
      messageToSend.file_size = opts.file_size;
      messageToSend.custom_actions = opts.custom_actions;
      messageToSend.default_text_field = opts.default_text_field;
      messageToSend.file_name = opts.file_name;
      messageToSend.document_type = opts.document_type;
      messageToSend.is_web = opts.is_web;
      messageToSend.image_width = opts.image_width;
      messageToSend.image_height = opts.image_height;
      messageToSend.notification = user.notification;
      messageToSend.sender_user_id = opts.sender_user_id;
      messageToSend.only_admin_can_message = opts.only_admin_can_message;
      messageToSend.unread_notification_count = opts.usersUnreadNotificationCount[user.user_unique_key] ? opts.usersUnreadNotificationCount[user.user_unique_key].count : 0;
      messageToSend.business_name = opts.business_name;
      messageToSend.business_id = opts.business_id;
      messageToSend.user_image_50x50 = opts.user_image_50x50;
      messageToSend.image_url_100x100 = opts.image_url_100x100;
      messageToSend.android_device_id = opts.deviceMap[user.user_unique_key] || opts.allDeviceMap[user.user_unique_key];
      messageToSend.last_notification_id = opts.last_notification_id || 0;
      messageToSend.message = !commonFunctions.isEmptyString(opts.message) ? opts.message : commonFunctions.getDefaultMessage(null, opts.message_type, opts);
      messageToSend.new_message = !commonFunctions.isEmptyString(opts.message) ? opts.message : commonFunctions.getDefaultMessage(null, opts.message_type, opts);
      messageToSend.noti_msg = commonFunctions.isEmptyString(opts.message) ? commonFunctions.getDefaultMessage(null, opts.message_type, opts) : opts.push_message || getPushMessageAndroid(opts, user);
      messageToSend.hasCaption = !commonFunctions.isEmptyString(opts.message) ? true : false;
      messageToSend.tagged_users = opts.tagged_users;
      messageToSend.hrm_bot_type = opts.hrm_bot_type;
      messageToSend.play_sound = true;


      if (opts.ccMentionPushUsers[user.user_id] || opts.followThreadUserUniqueKey[user.user_unique_key]) {
        messageToSend.update_notification_count = true;
      }

      if (!opts.skipSnoozeNotificationMap[user.user_unique_key] && ((opts.ccMentionPushUsers[user.user_id] && user.notification_level != constants.pushNotificationLevels.NONE) || (user.notification_level == constants.pushNotificationLevels.ALL_CHATS && (user.tagged_chat || (user.notification != constants.channelNotification.DIRECT_MENTIONS && user.notification != constants.channelNotification.MUTED) || (opts.is_thread_message && opts.followThreadUserUniqueKey[user.user_unique_key]))) ||
        (user.notification_level == constants.pushNotificationLevels.DIRECT_MESSAGES && opts.chat_type == constants.chatType.O20_CHAT))) {
        messageToSend.showpush = 1;
      } else {
        if (opts.skipSnoozeNotificationMap[user.user_unique_key] || user.notification_level == constants.pushNotificationLevels.NONE || (user.notification_level == constants.pushNotificationLevels.DIRECT_MESSAGES && opts.chat_type != constants.chatType.O20_CHAT && !opts.ccMentionPushUsers[user.user_id])) {
          messageToSend.play_sound = false;
        }
        messageToSend.showpush = 0;
      }

      if (messageToSend.sender_user_id == user.user_id) {
        messageToSend.notification_type = 1
        messageToSend.showpush = 0;
      }

      let messageTo = user.user_unique_key;
      let messageAt = commonFunctions.getSHAOfObject(messageTo);
      controlChannelPushes.push({
        messageTo: messageTo,
        messageAt: messageAt,
        message: messageToSend
      });
      ccPushListUsers.push({
        user_unique_key: messageTo,
        messageAt: messageAt
      });

      // if (!opts.is_thread_message) {
      // io.sockets.in(messageAt).emit(notificationBuilder.controlChannelEvent[opts.notification_type], messageToSend);
      // if (opts.notification_type == 16) {
      //   io.sockets.in(messageAt).emit("message", messageToSend);
      // }
      // }

      if (opts.notification_type == notificationBuilder.notificationType.VIDEO_CONFERENCE || opts.notification_type == notificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION) {
        messageToSend.notification_type = notificationBuilder.notificationType.MESSAGE;
        messageToSend.noti_msg = messageToSend.caller_text;
        messageToSend.play_sound = true;
        io.sockets.in(messageAt).emit("message", messageToSend);
      } else {
        io.sockets.in(messageAt).emit(notificationBuilder.controlChannelEvent[opts.notification_type], messageToSend);
      }

      if (!editMessage && (opts.update_notification_count || opts.update_tagged_notification_count)) {
        io.sockets.in(messageAt).emit("update_notification_count", { notification_count: messageToSend.unread_notification_count, update_notification_count: opts.update_notification_count, user_unique_key: opts.user_unique_key, domain: opts.domain });
      }
    }
    resolve();
  });
  // // // send pushes
  // logger.trace(logHandler, "cc push list users ", controlChannelPushes);
  // notifierService.sendControlChannelPushes({ ccPushList : controlChannelPushes }, cb);
}

function fetchBusinessPushTitle(logHandler, opts, cb) {
  let title = constants.pushNotification.DEFAULT_TITLE;
  // WARNING fetch business config from cache
  dbquery.getBusinessConfiguration(logHandler, opts, (err, res) => {
    if (err) {
      logger.error(logHandler, "Error while fetching push title", err);
    } else {
      let businessProperty = res;
      if (businessProperty.push_based_on_chat) {
        let data = commonFunctions.jsonParse(businessProperty.push_based_on_chat);
        title = data[opts.chat_type] || constants.pushNotification.DEFAULT_TITLE;
      }
    }
    cb(null, title);
  });
}

function getPushMessage(opts, user) {
  let message = opts.message;
  if (commonFunctions.isHtml(message)) {
    message = commonFunctions.HtmlReplacer(message);
  }

  if (opts.tagged_chat) {
    return encoder.htmlDecode(opts.full_name + " mentioned you: " + message);
  }

  if (opts.is_thread_message) {
    let string = '';

    if (opts.chat_type != constants.chatType.O20_CHAT) {
      string = " on " + opts.label || opts.full_name || constants.anonymousUserName;
    }

    if (opts.send_by == opts.thread_owner_id) {
      return encoder.htmlDecode(opts.full_name + " replied to your followed thread");
    }

    if (user.user_id == opts.thread_owner_id) {
      return encoder.htmlDecode(opts.full_name + " replied to your message");
    }
    return encoder.htmlDecode(opts.full_name + " replied to " + opts.thread_owner_name + "'s message");
  }

  if (opts.chat_type == constants.chatType.PRIVATE_GROUP || opts.chat_type == constants.chatType.PUBLIC_GROUP
    || opts.chat_type == constants.chatType.GENERAL_CHAT || opts.chat_type == constants.chatType.DEFAULT_GROUP) {
    return encoder.htmlDecode(opts.full_name + ": " + message);
  }
  return encoder.htmlDecode(message);
}

function getNotificationTitleMessage(opts, user) {
  let message = opts.message;
  if (commonFunctions.isHtml(message)) {
    message = commonFunctions.HtmlReplacer(message);
  }

  if (opts.tagged_chat) {
    return encoder.htmlDecode(" mentioned you: " + message);
  }

  if (opts.notification_type == notificationCenterBuilder.notificationType.ADD_MEMBER) {
    return encoder.htmlDecode(constants.pushMessage.NEW_GROUP + " " + opts.label || opts.custom_label);
  }
  if(opts.notification_type == notificationCenterBuilder.notificationType.ASSIGN_TASK){
    return encoder.htmlDecode(` has assigned you a task`);
  }

  if(opts.notification_type == notificationCenterBuilder.notificationType.SCHEDULE_MEETING){
    return encoder.htmlDecode(` has invited you join a meeting`);
  }

  if (opts.notification_type == notificationCenterBuilder.notificationType.NEW_WORKSPACE) {
    return encoder.htmlDecode(constants.pushMessage.NEW_WORKSPACE + " on " + opts.businessInfo.workspace_name);
  }

  if (opts.notification_type == notificationCenterBuilder.notificationType.CHANGE_GROUP_INFO) {
    if (opts.updateFields.custom_label) {
      return encoder.htmlDecode(` changed the group name to ${opts.updateFields.custom_label}`);
    }
    return encoder.htmlDecode(" updated the group icon");
  }


  if (opts.is_thread_message) {
    let string = '';

    if (opts.chat_type != constants.chatType.O20_CHAT) {
      string = " on " + opts.label || opts.full_name || constants.anonymousUserName;
    }


    if (opts.send_by == opts.thread_owner_id) {
      return encoder.htmlDecode(" replied to your followed thread");
    }

    if (user.user_id == opts.thread_owner_id) {
      return encoder.htmlDecode(" replied to your message");
    }
    return encoder.htmlDecode(" replied to " + opts.thread_owner_name + "'s message");
  }

  if (opts.chat_type == constants.chatType.PRIVATE_GROUP || opts.chat_type == constants.chatType.PUBLIC_GROUP
    || opts.chat_type == constants.chatType.GENERAL_CHAT || opts.chat_type == constants.chatType.DEFAULT_GROUP) {
    return encoder.htmlDecode(opts.full_name + ": " + message);
  }
  return encoder.htmlDecode(message);
}

function preparePushNotificationList(opts) {
  let users = Array.from(opts.userPushList);
  let currentTime = commonFunctions.getCurrentTime();
  opts.notToUpdateUsersMap ? 0 : opts.notToUpdateUsersMap = {};
  for (let i = 0; i < users.length; i++) {

    if (!opts.isSilent) {
      let web_payload = pushNotificationBuilder.getObject(opts.notification_type);

      web_payload.title = opts.title || "New Conversation";
      web_payload.body = commonFunctions.isEmptyString(opts.message) ? commonFunctions.getDefaultMessage(null, opts.message_type, opts) : opts.push_message || getPushMessage(opts, users[i]);
      web_payload.channel_id = opts.channel_id;
      web_payload.is_thread_message = opts.is_thread_message;
      web_payload.muid = opts.muid;
      web_payload.device_id = opts.device_id;
      web_payload.thread_muid = opts.thread_muid;
      web_payload.business_id = opts.business_id;
      web_payload.workspace = opts.workspace;
      web_payload.app_secret_key = opts.app_secret_key;
      web_payload.video_call_type = opts.video_call_type;
      web_payload.call_type = opts.call_type;
      web_payload.domain = opts.domain;
      web_payload.icon = opts.icon;
      users[i].firebase_payload = web_payload;
    }

    let payload = pushNotificationBuilder.getObject(opts.notification_type);

    payload.push_message = commonFunctions.isEmptyString(opts.message) ? commonFunctions.getDefaultMessage(null, opts.message_type, opts) : opts.push_message || getPushMessage(opts, users[i]);
    payload.message = !commonFunctions.isEmptyString(opts.message) ? opts.message : commonFunctions.getDefaultMessage(null, opts.message_type, opts);
    payload.noti_msg = commonFunctions.isEmptyString(opts.message) ? commonFunctions.getDefaultMessage(null, opts.message_type, opts) : opts.push_message || getPushMessageAndroid(opts, users[i]);
    payload.hasCaption = !commonFunctions.isEmptyString(opts.message) ? true : false;
    payload.message_type = opts.message_type;
    payload.push_type = opts.push_type;
    payload.muid = opts.muid;
    payload.thread_muid = opts.thread_muid;
    payload.title = opts.title;
    payload.caller_text = opts.caller_text;
    payload.chat_type = opts.chat_type;
    payload.user_id = opts.user_id;
    payload.user_unique_key = opts.user_unique_key;
    payload.follow_thread = opts.follow_thread;
    payload.invite_link = opts.invite_link;
    payload.channel_id = opts.channel_id;
    payload.label = opts.label || opts.full_name || constants.anonymousUserName;
    payload.date_time = currentTime;
    payload.label_id = opts.label_id;
    payload.new_message = !commonFunctions.isEmptyString(opts.message) ? opts.message : commonFunctions.getDefaultMessage(null, opts.message_type, opts);
    payload.last_sent_by_full_name = opts.full_name;
    payload.last_sent_by_id = opts.send_by;
    payload.last_sent_by_user_type = opts.last_sent_by_user_type;
    payload.tagged_users = opts.tagged_users;
    payload.members_info = opts.members_info;
    payload.email = opts.email;
    //   payload.icon                      = opts.icon;
    payload.hungup_type = opts.hungup_type;
    payload.user_thumbnail_image = opts.user_thumbnail_image;
    payload.app_secret_key = opts.app_secret_key;
    payload.is_deleted_group = opts.is_deleted_group;
    payload.is_thread_message = opts.is_thread_message;
    payload.channel_image = opts.channel_thumbnail_url || constants.groupChatImageURL.channel_image_url;
    payload.channel_thumbnail_url = opts.channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
    payload.image_url = opts.image_url;
    payload.thumbnail_url = opts.thumbnail_url;
    payload.custom_label = opts.custom_label;
    payload.removed_user_id = opts.removed_user_id;
    payload.added_member_info = opts.added_member_info;
    payload.showpush = opts.isSilent ? 0 : 1;
    payload.video_call_type = opts.video_call_type;
    payload.is_silent = opts.isSilent;
    payload.device_id = opts.device_id;
    payload.full_name = opts.full_name;
    payload.call_type = opts.call_type;
    payload.user_ids_to_make_admin = opts.user_ids_to_make_admin;
    payload.user_ids_to_remove_admin = opts.user_ids_to_remove_admin;
    payload.unread_notification_count = opts.usersUnreadNotificationCount[users[i].user_unique_key] ? opts.usersUnreadNotificationCount[users[i].user_unique_key].count : 0;
    payload.update_notification_count = opts.notToUpdateUsersMap[users[i].user_id] ? false : opts.update_notification_count;
    // payload.update_notification_count = opts.update_notification_count;
    payload.is_chat_type_changed = opts.is_chat_type_changed;
    payload.domain = opts.domain;
    payload.domain_id = opts.domain_id;
    payload.business_id = opts.business_id;
    payload.business_name = opts.business_name;
    payload.user_type = opts.user_type;
    payload.image_url = opts.image_url,
      payload.thumbnail_url = opts.thumbnail_url,
      payload.url = opts.url,
      payload.file_size = opts.file_size,
      payload.file_name = opts.file_name,
      payload.document_type = opts.document_type,
      payload.image_height = opts.image_height,
      payload.image_width = opts.image_width,
      payload.image_url_100x100 = opts.image_url_100x100
    payload.message_id = opts.message_id
    payload.only_admin_can_message = opts.only_admin_can_message;
    payload.save_push = true;
    if(opts.remove_voip){
      payload.showpush = 1;
    }
    users[i].push_payload = payload;
  }
  return users;
}

async function pushNotifications(logHandler, opts, businessInfo) {
  let users = opts.userPushList;
  let validUserIds = [];
  let inValidUserIds = [];
  let pushNotificationList = [];
  let silentPushNotificationList = [];
  let webNotificationList = {};
  let silentPushUserIds = [];
  let activePushFlag = {};
  let remove_ios_voip = opts.remove_voip;
  let notToUpdateUsersNotificationCountMap = opts.notToUpdateUsersMap ? opts.notToUpdateUsersMap : {};

  let pushTimeLimit = new Date();
  pushTimeLimit.setSeconds(pushTimeLimit.getSeconds() - constants.pushTimeLimitForAllDevices);
  // TODO : refactor
  let pushData = []
opts.activeUserFlag ? 0 : opts.activeUserFlag = {};
  opts.deviceMap ? 0 : opts.deviceMap = {};
  opts.skipSnoozeNotificationMap ? 0 : opts.skipSnoozeNotificationMap = {};
  for (let i = 0; i < users.length; i++) {
    if (commonFunctions.isValidObject(users[i].device_type)
      && users[i].device_token
      && !(users[i].user_type == constants.userType.AGENT && users[i].online_status == constants.onlineStatus.OFFLINE)) {

      if ((!opts.skipSnoozeNotificationMap[users[i].user_unique_key]) && (!notToUpdateUsersNotificationCountMap[users[i].user_id]) && (!opts.activeUserFlag[users[i].user_unique_key] || opts.deviceMap[users[i].user_unique_key] == users[i].device_id) && (
        // (opts.tagged_all && opts.direct_tags && opts.directTagUsersMap[users[i].user_id] && users[i].notification == "DIRECT_MENTIONS") ||
        (users[i].tagged_chat && users[i].notification_level != constants.pushNotificationLevels.NONE) ||
        (users[i].notification_level == constants.pushNotificationLevels.ALL_CHATS && (users[i].tagged_chat || (users[i].notification == constants.channelNotification.UNMUTED) || (users[i].push_payload.is_thread_message && users[i].follow_thread))) ||
        (users[i].notification_level == constants.pushNotificationLevels.DIRECT_MESSAGES && opts.chat_type == constants.chatType.O20_CHAT) ||
        (opts.pushFlag && users[i].notification_level != constants.pushNotificationLevels.NONE))) {

        if (!users[i].push_payload.save_push && users[i].push_payload.message_type != constants.messageType.VIDEO_CALL && users[i].updated_at && users[i].updated_at > pushTimeLimit) {
          activePushFlag[users[i].user_id] = [];
          activePushFlag[users[i].user_id] = true;
        }

        let notificationObject = pushNotificationBuilder.getObject(pushNotificationBuilder.notificationType.NOTIFICATION);
        notificationObject.business_id = (users[i].user_type != constants.userType.AGENT) ? users[i].business_id : 0;
        notificationObject.push_to = users[i].user_id;
        notificationObject.device_token = users[i].device_token;
        notificationObject.device_type = users[i].device_type;
        notificationObject.app_type = users[i].app_type;
        notificationObject.device_info = {};

        notificationObject.payload = users[i].push_payload;
        notificationObject.remove_voip = remove_ios_voip;
        pushNotificationList.push(notificationObject);
        validUserIds.push(users[i].user_id);
        if (users[i].push_payload.save_push) {
          let pushObject = {
            device_id: users[i].device_id,
            domain_id: users[i].push_payload.domain_id,
            user_unique_key: users[i].user_unique_key,
            data: JSON.stringify(users[i].push_payload)
          }
          pushData.push(pushObject);
          continue;
        }
        if (users[i].device_token && users[i].device_type == 'WEB' && !users[i].push_payload.save_push) {
          let body = {};
          body.to = users[i].device_token;

          users[i].firebase_payload.channel_id = users[i].firebase_payload.channel_id
              ? users[i].firebase_payload.channel_id : constants.collapse_key

          body.collapse_key = users[i].firebase_payload.channel_id.toString();
          body.data = users[i].firebase_payload;
          webNotificationList[users[i].device_token] = body;
        }
      } else if (users[i].device_type != 'WEB' && !users[i].push_payload.save_push) {
        // silent push
        let notificationObject = pushNotificationBuilder.getObject(pushNotificationBuilder.notificationType.NOTIFICATION);
        notificationObject.business_id = (users[i].user_type != constants.userType.AGENT) ? users[i].business_id : 0;
        notificationObject.push_to = users[i].user_id;
        notificationObject.device_token = users[i].device_token;
        notificationObject.device_type = users[i].device_type;
        notificationObject.app_type = users[i].app_type;
        notificationObject.device_info = {};
        users[i].push_payload.showpush = 0; // for slient push
        notificationObject.payload = users[i].push_payload;
        notificationObject.remove_voip = remove_ios_voip;
        silentPushNotificationList.push(notificationObject);
        silentPushUserIds.push(users[i].user_id);
      }
    } else {
      // logger.debug(logHandler, { SKIPPING_USER : users[i] });
      inValidUserIds.push(users[i].user_id);
    }
  }
  logger.trace(logHandler, "Skipping notification for users : ", inValidUserIds.length);
  logger.trace(logHandler, "Pushing notifications for users : ", validUserIds.length);
  logger.trace(logHandler, { WEB_NOTIFICATION_LENGTH: webNotificationList.length });
  logger.trace(logHandler, { SILENT_PUSH_NOTIFICATIONS: silentPushNotificationList.length });
  logger.trace(logHandler, "Silent Push User Ids :", silentPushUserIds);

  // logging pushes
  if (pushData.length) {
    await userService.insertPushNotification(logHandler, pushData)
  }

  let pushLog = {};
  inValidUserIds.sort();
  validUserIds.sort();
  pushLog.skipping = inValidUserIds;
  pushLog.sending = validUserIds;
  logger.trace(logHandler, { PUSH_LOG: pushLog });

  let pushLogData = {
    message_id: opts.message_id,
    channel_id: opts.channel_id,
    skipped: ' | ' + inValidUserIds.toString()
  };
  if (!_.isEmpty(pushNotificationList)) {
    pushNotification.sendBulkNotification(logHandler, pushNotificationList, pushLogData, businessInfo);
  }

  // sending silent push
  if (!_.isEmpty(silentPushNotificationList)) {
    pushNotification.sendBulkNotification(logHandler, silentPushNotificationList, pushLogData, businessInfo);
  }

  webNotificationList = Object.values(webNotificationList);
  pushNotification.webNotification(logHandler, webNotificationList);
  return {};
}



function getChatTitle(logHandler, userInfo, channelInfo, businessInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      switch (channelInfo.chat_type) {
        case constants.chatType.P2P:
        case constants.chatType.O20_CHAT:
        case constants.chatType.FUGU_BOT:
          return userInfo.full_name;
        case constants.chatType.PRIVATE_GROUP:
        case constants.chatType.PUBLIC_GROUP:
        case constants.chatType.GENERAL_CHAT:
        case constants.chatType.DEFAULT_GROUP:
        case constants.chatType.RESTRICTED_GROUP:
          return channelInfo.custom_label || businessInfo.business_name;
        default:
      }
    })().then(
      (data) => {
        logger.trace(logHandler, "getChatTitle", data);
        resolve(data);
      },
      (error) => { reject(error); }
    );
  });
}

function insertOrUpdateTaggedUsers(logHandler, messageInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let taggedUsers = Array.from(messageInfo.tagged_users);
      let userToThreadInfo = yield conversationService.getUserToThread(logHandler, { message_id: messageInfo.message_id, status: constants.status.ENABLE });
      let alreadyInvolvedUsers = [];
      //   let unfollowedUsers      = [];
      let totalInvolvedUsers = [];

      for (let row of userToThreadInfo) {
        if (row.status == constants.status.ENABLE) {
          alreadyInvolvedUsers.push(row.user_id);
        }
        // else {
        //   unfollowedUsers.push(row.user_id);
        // }
        totalInvolvedUsers.push(row.user_id);
      }

      // if(messageInfo.tagged_all) {
      //   if(!_.isEmpty(unfollowedUsers)) {
      //     let usersToFollow = yield channelService.getUserFromUserToChannel(logHandler, unfollowedUsers, messageInfo.channel_id);
      //     let updateUsers= [];
      //     for(let data of usersToFollow) {
      //       if(data.notification != constants.channelNotification.DIRECT_MENTIONS) {
      //         updateUsers.push(data.user_id);
      //       }
      //     }

      //     if(updateUsers.length) {
      //       yield conversationService.updateStatusOrIsStarred(logHandler, { user_ids: updateUsers, message_id : messageInfo.message_id});
      //     }
      //   }
      // }

      // if (!_.isEmpty(messageInfo.tagged_users)){
      //   yield conversationService.updateStatusOrIsStarred(logHandler, { user_ids: messageInfo.tagged_users, message_id: messageInfo.message_id});
      // }

      let newlyInvolvedUserIds = taggedUsers.filter((el) => { if (!totalInvolvedUsers.includes(el)) return el; });
      if (!_.isEmpty(newlyInvolvedUserIds)) {
        yield conversationService.insertUserToMessage(logHandler, { userIds: newlyInvolvedUserIds, message_id: messageInfo.message_id, status: constants.status.ENABLE });
      }

    })().then(
      (data) => {
        logger.trace(logHandler, { RESPONSE: data });
        resolve(data);
      },
      (error) => {
        reject("Something went wrong!");
      });
  });
}

function prepareNotificationToBeSaved(opts, users) {
  let payload = notificationCenterBuilder.getObjectBasedOnNotificationTypes(opts.notification_type);

  payload.notification_title = opts.notification_title || getNotificationTitleMessage(opts, users) || opts.push_message;
  payload.message = opts.message;
  payload.muid = opts.muid;
  payload.thread_muid = opts.thread_muid;
  payload.user_id = users.user_id;
  payload.channel_id = opts.channel_id;
  payload.chat_type = opts.chat_type;
  payload.action_by_user_id = opts.userInfo.user_id;
  payload.action_by_user_image = opts.userInfo.user_image || "";
  payload.user_unique_key = users.user_unique_key;
  payload.app_secret_key = opts.app_secret_key;
  payload.channel_image = opts.channel_thumbnail_url || "";
  payload.is_tagged = opts.tagged_chat;
  payload.business_image = opts.business_image;
  payload.action_by_user_name = opts.userInfo.full_name || "";

  return payload;
}

function getPushMessageAndroid(opts, user) {
  let message = opts.message;
  if (commonFunctions.isHtml(message)) {
    message = commonFunctions.HtmlReplacer(message);
  }

  if (opts.tagged_chat || user.tagged_chat || opts.ccMentionPushUsers[user.user_id]) {
    return encoder.htmlDecode(opts.full_name + " mentioned you: " + message);
  }

  if (opts.is_thread_message) {
    let string = '';

    if (opts.chat_type != constants.chatType.O20_CHAT) {
      string = " on " + opts.label || opts.full_name || constants.anonymousUserName;
    }

    if (opts.send_by == opts.thread_owner_id) {
      return encoder.htmlDecode(opts.full_name + " replied to your followed thread");
    }

    if (user.user_id == opts.thread_owner_id) {
      return encoder.htmlDecode(opts.full_name + " replied to your message");
    }
    return encoder.htmlDecode(opts.full_name + " replied to " + opts.thread_owner_name + "'s message");
  }

  if (opts.chat_type == constants.chatType.PRIVATE_GROUP || opts.chat_type == constants.chatType.PUBLIC_GROUP
    || opts.chat_type == constants.chatType.GENERAL_CHAT || opts.chat_type == constants.chatType.DEFAULT_GROUP) {
    return encoder.htmlDecode(message);
  }
  return encoder.htmlDecode(message);
}
