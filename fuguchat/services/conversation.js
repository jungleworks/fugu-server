/**
 * Created by vidit on 10/7/17.
 */
const Promise                       = require('bluebird');
const timsort                       = require('timsort');
const _                             = require('underscore');
const dbHandler                     = require('../database').dbHandler;
const slaveDbHandler = require('../database').slaveDbHandler;
const commonFunctions               = require('../Utils/commonFunctions');
const constants                     = require('../Utils/constants');
const { logger }                        = require('../libs/pino_logger');
const userService                   = require('./user');
const notifierService               = require('./notifier');
const channelService                = require('../services/channel');
const conversationService           = require('../services/conversation');
const workspaceService              = require('../services/workspace');
// const dbquery                       = require('../DAOManager/query');
const notificationBuilder           = require('../Builder/notification');
const config                        = require('config');
const bot                           = require('./bot');
const utilityService                = require('./../services/utility');

// const businessService               = require('../services/business')
const utils = require('../Utils/commonFunctions');
const pro = require('../Utils/promiseManager').promiseManager;



exports.getChatMessages                         = getChatMessages;
exports.getUserConversation                     = getUserConversation;
exports.getMessage                              = getMessage;
exports.notifyReadAll                           = notifyReadAll;
exports.getReadUnreadOfUserMessages             = getReadUnreadOfUserMessages;
exports.syncMessageHistory                      = syncMessageHistory;
exports.markConversation                        = markConversation;
exports.getChannelsTotalMessageCount            = getChannelsTotalMessageCount;
exports.getUnreadCountForCustomer               = getUnreadCountForCustomer;
exports.getReadLastReadMessageByOtherUser       = getReadLastReadMessageByOtherUser;
exports.insertOrUpdateUserMessageReaction       = insertOrUpdateUserMessageReaction;
exports.insertUserThreadMessage                 = insertUserThreadMessage;
exports.getUsersReaction                        = getUsersReaction;
exports.getTotalUserReaction                    = getTotalUserReaction;
exports.getMessageReactions                     = getMessageReactions;
exports.getMessageByMuid                        = getMessageByMuid;
exports.updateInfo                              = updateInfo;
exports.getUserToThread                         = getUserToThread;
exports.insertUserToMessage                     = insertUserToMessage;
exports.getThreadMessages                       = getThreadMessages;
exports.getLatestThreadMessage                  = getLatestThreadMessage;
exports.threadMessageCount                      = threadMessageCount;
exports.getMessagesByMuids                      = getMessagesByMuids;
exports.getThreadMessageUsers                   = getThreadMessageUsers;
exports.insertOrUpdateUserThreadMessageReaction = insertOrUpdateUserThreadMessageReaction;
exports.getUsersThreadMessageReaction           = getUsersThreadMessageReaction;
exports.getUserUnreadCount                      = getUserUnreadCount;
exports.getThreadMessageByThreadMuid            = getThreadMessageByThreadMuid;
exports.getMessageReaction                      = getMessageReaction;
exports.getMessageUserInfo                      = getMessageUserInfo;
exports.updateThreadMessageInfo                 = updateThreadMessageInfo;
exports.insertOrUpdateUserToMessage             = insertOrUpdateUserToMessage;
exports.updateStatusOrIsStarred                 = updateStatusOrIsStarred;
exports.insertOwnerIntoUserToMessage            = insertOwnerIntoUserToMessage;
exports.getMessageIndex                         = getMessageIndex;
exports.searchMessage                           = searchMessage;
exports.searchThreadMessage                     = searchThreadMessage;
exports.getInfoOfOtherUsers                     = getInfoOfOtherUsers;
exports.getLatestMessageIdConversation          = getLatestMessageIdConversation;
exports.getStarredMessages                      = getStarredMessages;
exports.insertOrUpdateStarredMessage            = insertOrUpdateStarredMessage;
exports.updateUserToMessage                     = updateUserToMessage;
exports.getUserSendEmailData                    = getUserSendEmailData;
exports.insertOrUpdateSendMessageAsEmail        = insertOrUpdateSendMessageAsEmail;
exports.insertMessagePollOptions                = insertMessagePollOptions;
exports.insertUserMessagePoll                   = insertUserMessagePoll;
exports.updateUserMessagePoll                   = updateUserMessagePoll;
exports.getMessagePoll                          = getMessagePoll;
exports.getUserPoll                             = getUserPoll;
exports.getUserPollInfo                         = getUserPollInfo;
exports.updatePollExpired                       = updatePollExpired;
exports.insertMessageHistory                    = insertMessageHistory;
exports.updateAction                            = updateAction;
exports.editMessage                             = editMessage;
exports.getTokenFromUserId                      = getTokenFromUserId;
exports.editMessage                             = editMessage;
exports.insertUsersConversation                 = insertUsersConversation;
exports.getUserDetails                          = getUserDetails;
exports.getStarMessages                         = getStarMessages;
exports.insertUserThreadMessageAndCreatedAt     = insertUserThreadMessageAndCreatedAt;
exports.updateAdminOfGeneralGroups              = updateAdminOfGeneralGroups;
exports.getWorkspaceUnreadCount                 = getWorkspaceUnreadCount;
exports.getLatestThreadMessages                 = getLatestThreadMessages;
exports.deleteNotification                      = deleteNotification;
exports.getAllMessagesForElastic                = getAllMessagesForElastic;
exports.getAllThreadMessagesForElastic          = getAllThreadMessagesForElastic;
exports.getWorkspaceConversation                = getWorkspaceConversation;
exports.getWorkspaceChannels                    = getWorkspaceChannels;
exports.getWorkspaceMessagesReactions           = getWorkspaceMessagesReactions;
exports.insertExportDataRequest                 = insertExportDataRequest;
exports.getExportData                           = getExportData;
exports.getUserExportCount                      = getUserExportCount;
exports.getWorkspaceAllUsers                    = getWorkspaceAllUsers;
exports.getWorkspaceThreadMessagesReactions     = getWorkspaceThreadMessagesReactions;
exports.getExpectedDate                         = getExpectedDate;
exports.updateExportData                        = updateExportData;
exports.insertCallingDetails                    = insertCallingDetails;
exports.getCallingDetails                       = getCallingDetails;
exports.updateCallingDetails                    = updateCallingDetails;
exports.unstarMessages                          = unstarMessages;

function notifyReadAll(logHandler, opts) {
  logger.trace(logHandler, "sending read all push for notify readUnread");
  let message = notificationBuilder.getObject(notificationBuilder.notificationType.READ_ALL);
  message.user_id     = opts.user_id;
  message.user_type   = opts.user_type;
  message.channel_id  = opts.channel_id;
  message.app_secret_key = opts.app_secret_key;
  // let ccPush = {
  //   messageAt : '/' + opts.channel_id,
  //   message   : message
  // };
  // notifierService.sendControlChannelEvent(ccPush);
  io.sockets.in(opts.channel_id).emit('read_all', message);
  io.sockets.in(utils.getSHAOfObject(opts.user_unique_key)).emit('read_all', message);
  io.sockets.in(opts.channel_id).emit('read_all', message);
}

function getMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                 id
             FROM
                 users_conversation
            WHERE
                workspace_id = ? AND channel_id = ?
             ORDER BY
                 id DESC
             LIMIT ?, ?`;
    let queryObj = {
      query : query,
      args  : [opts.workspace_id, opts.channel_id, constants.getMessagesPageSize,1 ],
      event : "getMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

async function getUserConversation(logHandler, opts) {
  let userInfo = opts.userInfo;
   // fetch conversation
  opts.business_id     = userInfo.workspace_id;

  let userConversation = await getUserConversationInfo(logHandler, opts);
  let conversations = [];
  let lastMessageUserIds = [];
  let channelIds = [];
  // channels whose user names are needed (one to one and self bot)
  const usersNeededChannels = [];
  // channels whose names are empty or images are not there (3 name groups)
  const unnamedChannels = [];

  for (let i = 0; i < userConversation.length; i++) {
    userConversation[i].user_id = userInfo.user_id;
    userConversation[i].user_type = userInfo.user_type;
    if(userConversation[i].message_type == constants.messageType.VIDEO_CALL) {
      utils.addAllKeyValues(utils.jsonToObject(logHandler, userConversation[i].full_message), userConversation[i]);
    }
    userConversation[i].label = userConversation[i].custom_label || "";
    lastMessageUserIds.push(userConversation[i].last_message_user_id);

    conversations.push(userConversation[i]);
    channelIds.push(userConversation[i].channel_id);
    // if one to one or bot we need to add these channel ids to get names from user to space
    if ([constants.chatType.O20_CHAT, constants.chatType.FUGU_BOT].includes(userConversation[i].chat_type)) {
      usersNeededChannels.push(userConversation[i].channel_id);
    }
    // if not one to one and no bot and no image present or no channel name present, channel ids forwaded to query
    if (![constants.chatType.O20_CHAT, constants.chatType.FUGU_BOT].includes(userConversation[i].chat_type)
      && (!userConversation[i].custom_label || !Object.keys(JSON.parse(userConversation[i].channel_image)).length)) {
      unnamedChannels.push(userConversation[i].channel_id);
    }
    if(userConversation[i].message_state == constants.status.DISABLE) {
      if(userConversation[i].user_id == userInfo.user_id) {
        userConversation[i].message = constants.deleteMessage.FOR_ME;
      } else {
        userConversation[i].message = constants.deleteMessage.FOR_OTHERS;
      }
    }
  }

 // let [userDetails] = await userService.getUserDetail(logHandler, { user_id : userInfo.user_id });

  let functionListToExecute = [];

  // fetch unread count for every channel   ( for user )
  functionListToExecute.push(getUnreadCountForCustomer(logHandler, channelIds, opts.user_id));

  // read unread of user message for each last message
  functionListToExecute.push(getReadLastReadMessagesByOtherUser(logHandler, channelIds, opts.user_id));


  // fetch labels for every channel
  functionListToExecute.push(channelService.getUsersFromUserToChannelExceptUserIdHavingChannelIds(logHandler, { channel_ids: usersNeededChannels, user_id : opts.user_id }));

  // getting names of users having channels ids for un-named group
  functionListToExecute.push(channelService.getChannelsUsersInfo(logHandler, { channel_ids: unnamedChannels, user_id: userInfo.user_id }));

  // running all function in parallel
  let result = await Promise.all(functionListToExecute);

  let channelToUnreadCount    = result[0];
  let lastReadMessages        = result[1];
  let userChannelInfo         = result[2];
  let channelsUserInfo        = result[3] ? result[3].channelUserMap : {};
  let channelLabelMap         = result[3] ? result[3].channelLabelMap : {};


  // adding last_message_status and channelToUnreadCount
  for (let i = 0; i < conversations.length; i++) {

    // last three active users of channel
    if((conversations[i].chat_type != constants.chatType.O20_CHAT && conversations[i].chat_type != constants.chatType.FUGU_BOT) && (!conversations[i].custom_label || _.isEmpty(utils.jsonParse(conversations[i].channel_image)))) {
      conversations[i].members_info = channelsUserInfo[conversations[i].channel_id] || [];
      let label = channelLabelMap[conversations[i].channel_id];
      if(conversations[i].members_info.length < constants.unamedGroupMemberLength) {
        label = label ? label + ", " + userInfo.full_name.split(' ')[0] : userInfo.full_name.split(' ')[0];
        conversations[i].members_info.push({
          full_name  : userInfo.full_name.split(' ')[0],
          user_id    : userInfo.user_id,
          user_image : userInfo.user_image || ""
        });
      }

      let customLabel = conversations[i].custom_label;
      if(!conversations[i].custom_label) {
        conversations[i].label = label;
      } else {
        delete conversations[i].custom_label;
      }

      if(!customLabel) {
        conversations[i].custom_label = customLabel || label;
      }
    } else {
      delete conversations[i].custom_label;
    }

    let channelImage = utils.cloneObject(utils.jsonParse(conversations[i].channel_image));
    conversations[i].channel_image         = channelImage.channel_thumbnail_url || constants.groupChatImageURL.channel_image_url;
    conversations[i].channel_thumbnail_url = channelImage.channel_thumbnail_url || constants.groupChatImageURL.channel_image_url;

    if(conversations[i].chat_type == constants.chatType.O20_CHAT || conversations[i].chat_type == constants.chatType.FUGU_BOT) {

      let otherUsers         = userChannelInfo[conversations[i].channel_id] || [];
      if (otherUsers.length && otherUsers[0].user_type == constants.userType.SELF_BOT) {
        otherUsers = [userInfo];
        otherUsers[0].full_name = otherUsers[0].full_name + " (me)"
      }
      conversations[i].label = (otherUsers.length > 0) ? (otherUsers[0].full_name || opts.business_name) : conversations[i].label;
      conversations[i].other_user_type = (otherUsers.length > 0) ? (otherUsers[0].user_type || 1) : 1;
      conversations[i].other_user_status = (otherUsers.length > 0) ? (otherUsers[0].status || "ENABLED") : "ENABLED";
      // TODO remove
      conversations[i].channel_image = ((otherUsers.length > 0) && !_.isEmpty(otherUsers[0].user_image)) ? otherUsers[0].user_image : "";
      conversations[i].channel_thumbnail_url = ((otherUsers.length > 0) && !_.isEmpty(otherUsers[0].user_image)) ? otherUsers[0].user_image : "";
    }
    (lastReadMessages[conversations[i].channel_id] && lastReadMessages[conversations[i].channel_id].last_read_message_id >= conversations[i].last_message_user_id) ?
      conversations[i].last_message_status = constants.messageStatus.READ : conversations[i].last_message_status = constants.messageStatus.SENT;
    conversations[i].unread_count          = channelToUnreadCount[conversations[i].channel_id] || 0;

    delete conversations[i].last_message_user_id;
  }

  if(opts.device_id) {
    opts.device_details = utils.objectToJson(logHandler, opts.device_details);
    userService.updateDeviceInfo(logHandler, opts, { user_id : opts.user_id });
  }
  // checking app version

  let [businessDetails] = await workspaceService.getDomainCredentials(logHandler, { domain_id: opts.domain_id });

  let response = {
    conversation_list         : conversations,
    count                     : conversations.length,
    page_size                 : constants.getConversationsPageSize
  };
  let installed_apps = await bot.getAppState(logHandler, {workspace_id: userInfo.workspace_id, app_id: constants.AppIdCheck.ATTENDANCE_BOT_APP_ID});
  //check punch in status
  if(opts.page_start == 1 && !(_.isEmpty(installed_apps)) && installed_apps[0].status == 1){
    let user_working_days, currentDay;
    let punch_in_obj = {
      status: constants.ATTENDANCE_STATUS.NOT_PUNCH_IN,
    }
    let punchInStatus = await bot.getUserPunchInStatus(logHandler, {user_id: opts.user_id});
    if(punchInStatus && punchInStatus.length){
      if(!punchInStatus[0].status){
        delete punch_in_obj;
      }else{
        user_working_days = punchInStatus[0].work_days;
        if(!user_working_days){
          user_working_days = constants.WORKING_DAYS.DEFAULT;
        }
        user_working_days = utils.jsonToObject(logHandler,user_working_days)
        currentDay = utilityService.getDayIdFromDate(new Date());
        if(punchInStatus[0].punch_in_time || (punchInStatus[0].is_clock_in_allowed == 0 && (punchInStatus[0].leave_phase == 'FIRST_HALF' || punchInStatus[0].leave_phase == 'FULL_DAY' ))
           || utilityService.addTimeInShiftTime(punchInStatus[0].shift_start_time,330) > utilityService.addTimeInShiftTime(new Date(), 330) || !user_working_days.includes(currentDay)){
          punch_in_obj.status = constants.ATTENDANCE_STATUS.PUNCH_IN;
        }
        if(!punchInStatus[0].punch_in_time && punchInStatus[0].leave_phase == 'FIRST_HALF' && utilityService.addTimeInShiftTime(punchInStatus[0].shift_start_time, 630) < utilityService.addTimeInShiftTime(new Date(), 330)){
          punch_in_obj.status = constants.ATTENDANCE_STATUS.NOT_PUNCH_IN;
        }
        if(punch_in_obj.status == constants.ATTENDANCE_STATUS.NOT_PUNCH_IN){
          if(!userInfo.manager_fugu_user_id){
            punch_in_obj.status = constants.ATTENDANCE_STATUS.PUNCH_IN;
          }else{
            let attendanceBotUserId = await bot.getBotInfo(logHandler, {workspace_id: userInfo.workspace_id, user_type: constants.userType.ATTENDANCE_BOT});
            if(!_.isEmpty(attendanceBotUserId)){
              let attendanceBotChannel = await bot.getBotChannelId(logHandler, { user_id: opts.user_id, attendance_user_id: attendanceBotUserId[0].user_id});
              if(!_.isEmpty(attendanceBotChannel)){
                punch_in_obj.attendance_bot_channel_id = attendanceBotChannel[0].channel_id;
              }
            }
          }
        }
        response.punch_in_obj = punch_in_obj;
      }
    }
  }

  opts.device_type = constants.deviceTypeEnums[opts.device_type];
  if(opts.device_type == constants.deviceType.ANDROID || opts.device_type == constants.deviceType.IOS) {
      let app_update_config = {
      app_link           : businessDetails[constants.deviceTypeLinkKeys[opts.device_type]],
      app_update_text    : constants.appUpdateText[opts.device_type].replace("app_name",opts.businessInfo.app_name)
    };
    let currentAppVersion = opts.app_version;

    if(currentAppVersion < businessDetails[constants.deviceTypeLatestVersionKeys[opts.device_type]]) {
      app_update_config.app_update_message = constants.appUpdateMessage.SOFT_UPDATE;
    }

    if(currentAppVersion < businessDetails[constants.deviceTypeCriticalVersionKeys[opts.device_type]]) {
      app_update_config.app_update_message = constants.appUpdateMessage.HARD_UPDATE;
    }
    response.app_update_config = app_update_config;
  }

  if(userInfo.role == constants.userRole.OWNER) {
    let billingDetails = await workspaceService.getWorkspaceExpirationDays(logHandler, { workspace_id : opts.business_id });
    if (billingDetails.length && billingDetails[0].days_left > 0 && billingDetails[0].days_left <= constants.remainingDaysForTrialExpires) {
      response.billing_details = {
        days_left : billingDetails[0].days_left,
        billing_url: `https://${opts.businessInfo.workspace}.${businessDetails.domain}/billing`
      }
    } else if (billingDetails.length && billingDetails[0].days_left <= 0){
      workspaceService.updateInfo(logHandler, { where_clause : { workspace_id: opts.business_id }, status: constants.allowedWorkspaceStatus.EXPIRED });
    }
  }

//   utils.checkAppVersion(logHandler, opts);

  return response;
}


function getUserConversationInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let values = [opts.business_id, opts.user_id, opts.business_id];
    let placeholder = "";
    if(opts.page_start){
      placeholder = "LIMIT ? , ?";
      values.push(Math.abs(opts.page_start - 1), Math.abs(opts.page_end - opts.page_start + 1))
    }

    let query = ` SELECT
    utc.channel_id,
    uc.id,
    uc.id as last_message_user_id,
    COALESCE(uc.muid, "") as muid,
    c.custom_label,
    c.chat_type,
    utc.notification,
    utc.is_pinned,
    utc.role,
    COALESCE(c.status, -1) as channel_status,
    COALESCE(c.channel_image, "{}") AS channel_image,
    CAST(AES_DECRYPT(uc.encrypted_message,"${config.get('aesKey')}") as CHAR(31000)) as message,
    uc.message_type as message_type,
    uc.created_at as date_time,
    uc.status as message_state,
    uc.message as full_message,
    COALESCE(last_message_user.user_id, -1) AS last_sent_by_id,
    COALESCE(last_message_user.full_name, "") AS last_sent_by_full_name,
    COALESCE(last_message_user.user_type, -1) AS last_sent_by_user_type
FROM
    user_to_channel utc
         JOIN
    channels c ON c.channel_id = utc.channel_id AND c.status = 1 AND c.workspace_id = ?
    JOIN
      channel_latest_message cl ON
      cl.channel_id = c.channel_id
    JOIN
      users_conversation uc ON uc.id = cl.message_id 
    LEFT JOIN
    user_to_workspace as last_message_user ON last_message_user.user_id = uc.user_id
WHERE
    utc.user_id = ? AND c.workspace_id = ?
        AND utc.status IN (1,2)
        AND uc.message is not null AND uc.id > utc.last_message_id
ORDER BY    utc.is_pinned DESC, c.status, uc.id DESC ${placeholder}`;

    let queryObj = {
      query : query,
      args  : values,
      event : "getUserConversation"
    };

   dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getChatMessages(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let where_clause = "";
    if(opts.user_type == constants.userType.CUSTOMER) {
      where_clause = " AND uc.message_type IN (" + constants.userVisibleMessageTypes.join(", ") + ") ";
    }
    // if(opts.user_type == constants.userType.AGENT) {
    //   where_clause = " AND uc.user_id not IN (0) ";
    // }
    let selectedColumn = ``
    if (opts.store_promise) {
      selectedColumn = ` COUNT(tum.message_id) as thread_message_count, max(tum.created_at) as last_reply,`;
    } else {
      selectedColumn = ` IFNULL(utm.is_starred, 0) AS is_starred,`;
    }

    let selectTable = ``;
    let groupByClause = ``;
    if (opts.store_promise) {
      selectTable = ` LEFT  JOIN thread_user_messages tum on uc.id = tum.message_id`;
      groupByClause = `GROUP by uc.id`;
    } else {
      selectTable =  `LEFT JOIN user_to_message utm ON utm.message_id = uc.id AND utm.user_id = ${opts.user_id}`;
    }
//FORCE INDEX(workspace_id_channel_id) - using a forced index as mysql was applying random indexes
    let query = `
                SELECT
                COALESCE(uc.muid, "") AS muid,
                COALESCE(u.user_thumbnail_image,"") AS user_image,
                u.full_name AS full_name,
                u.user_type AS user_type,
                uc.channel_id,
                uc.id,
                u.emails as username,
                uc.user_id,
                ${selectedColumn}
                uc.created_at AS date_time,
                uc.message,
                IFNULL(CAST(AES_DECRYPT(uc.encrypted_message,"${config.get('aesKey')}") as CHAR(31000)), "This message cannot be displayed.") as encrypted_message,
                uc.status as message_state,
                uc.message_type
            FROM
                users_conversation uc
                USE INDEX(workspace_id_channel_id)
                    LEFT JOIN
                user_to_workspace u ON u.user_id = uc.user_id
                ${selectTable}             
                WHERE
                uc.workspace_id = ? AND uc.channel_id = ? AND uc.id > ?
    ${where_clause} ${groupByClause}
     ORDER BY uc.id  DESC LIMIT ? , ?`;
    let queryObj = {
      query : query,
      args  : [opts.workspace_id, opts.channel_id, opts.clear_chat_message_id, Math.abs(opts.page_start - 1), Math.abs(opts.page_end - opts.page_start + 1)],
      event : "getChatMessages"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getLatestMessageIdConversation(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [opts.channel_id];
    let query = `
                SELECT
                    *
                 FROM
                     users_conversation
                USE INDEX(ch, w_id)
                 WHERE
                    channel_id = ? `
      if(opts.workspace_id){
        query += ` AND workspace_id = ? `;
        values.push(opts.workspace_id);
      }
      query +=` ORDER BY id desc limit 1 `;
    let queryObj = {
      query : query,
      args  : values,
      event : "getLatestMessageIdConversation"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function syncMessageHistory(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let latestMessage = yield getLatestMessageIdConversation(logHandler, { channel_id : opts.channel_id, workspace_id: opts.workspace_id});
      if(!latestMessage.length) {
        // logger.debug(logHandler, "No latest message on channel found : " + opts.channel_id);
        return {};
      }

      latestMessage = latestMessage[0];
      if(!latestMessage.id) {
        logger.error(logHandler, "Last message id null");
        return {};
      }

      if(latestMessage.id == null) {
        logger.error(logHandler, "Last message id null");
        return {};
      }

      if (opts.user_channel_status != constants.userStatus.SUSPENDED &&  (!opts.last_read_message_id || opts.last_read_message_id <= latestMessage.id) && (opts.chat_type == constants.chatType.PRIVATE_GROUP || opts.chat_type == constants.chatType.PUBLIC_GROUP || opts.chat_type == constants.chatType.O20_CHAT)) {
        channelService.insertIntoMessageSeen(logHandler, { user_id: opts.user_id, channel_id: opts.channel_id, message_id: latestMessage.id });
      }

      channelService.updateChannelHistory(logHandler, { user_id : opts.user_id, channel_id : opts.channel_id, message_id : latestMessage.id });

      return {};
    })().then(
      (data) => {
        logger.trace(logHandler, "syncReadUnread complete");
        resolve(data);
      },
      (error) => {
        logger.error(logHandler, "Error in syncReadUnread ", error);
        reject(error);
      }
    );
  });
}

function markConversation(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let message;
      let status = opts.status;
      let userInfo = opts.userInfo;
      let businessInfo = opts.businessInfo;
      let channelInfo = opts.channelInfo;
      let serverTriggered = opts.serverTriggered;

      if(serverTriggered) {
        if(status == constants.channelStatus.OPEN) {
          message = "The chat was auto-opened";
        } else if(status == constants.channelStatus.CLOSED) {
          message = "The chat was auto-closed";
        }
      } else if(status == constants.channelStatus.OPEN) {
        message = "The chat was re-opened by " + userInfo.full_name + "";
      } else if(status == constants.channelStatus.CLOSED) {
        message = "The chat was closed by " + userInfo.full_name + "";
      }


      let updatePayload = {
        update_fields : { status : status, lm_updated_at : new Date() },
        where_clause  : {
          channel_id : channelInfo.channel_id
        }
      };
      yield channelService.update(logHandler, updatePayload);


      let params = {};
      params.business_id  = businessInfo.business_id;
      params.user_id      = userInfo.user_id;  // (serverTriggered) ? 0 :
      params.channel_id   = channelInfo.channel_id;
      params.channel_name = channelInfo.channel_name;
      params.data         = { message : message };
      params.label_id     = channelInfo.label_id;
      params.user_type    = userInfo.user_type;
      params.user_name    = userInfo.user_name;
      params.message_type = constants.messageType.NOTE;
      params.status       = constants.userConversationStatus.MESSAGE;
      yield Promise.promisify(dbquery.insertUsersConversation).call(null, logHandler, params);



      // prepare cc pushes notifying chat status
      let messageToSend = notificationBuilder.getObject(notificationBuilder.notificationType.MARK_CONVERSATION);
      messageToSend.message      = message;
      messageToSend.channel_id   = channelInfo.channel_id;
      messageToSend.status       = status;
      let ccPush = {
        messageAt : '/' + businessInfo.app_secret_key + '/' + constants.ccPushEvents.MARK_CONVERSATION,
        message   : messageToSend
      };
      notifierService.sendControlChannelEvent(ccPush);


      return {};
    })().then(
      (data) => {
        resolve(data);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// join with users except current
function getUnreadCountForCustomer(logHandler, channel_ids, user_id) {
  return new Promise((resolve, reject) => {
    if(_.isEmpty(channel_ids)) {
      return resolve({});
    }
    let userVisibleMessageTypes = constants.userReadUnreadMessageTypes.join(", ");
    let query = `SELECT
                      ch.channel_id, COUNT(*) AS unread_count
                  FROM
                  user_to_channel ch
                           JOIN
                       users_conversation uc ON ch.channel_id = uc.channel_id
                  WHERE
                      ch.channel_id IN (?) AND ch.user_id = ? AND uc.id > ch.last_read_message_id AND uc.message_type in (${userVisibleMessageTypes})
                  GROUP BY ch.channel_id`;
    let queryObj = {
      query : query,
      args  : [channel_ids, user_id],
      event : "getUnreadCountForCustomer"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let channelToUnreadCount = {};
      for (let i = 0; i < result.length; i++) {
        channelToUnreadCount[result[i].channel_id] = result[i].unread_count;
      }
      // logger.debug(logHandler, { getUnreadCountForCustomer : channelToUnreadCount });
      resolve(channelToUnreadCount);
    }, (error) => {
      logger.error(logHandler, "error in getUnreadCountForCustomer", error);
      reject(error);
    });
  });
}

function getReadLastReadMessageByOtherUser(logHandler, channel_id, user_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                      last_read_message_id
                  FROM user_to_channel
                  WHERE
                      channel_id = ? AND user_id != ?
                  ORDER BY
                      last_read_message_id
                  DESC
                  LIMIT 1
                `;
    let queryObj = {
      query : query,
      args  : [channel_id, user_id],
      event : "getReadLastReadMessageByOtherUser"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if(!result.length) {
        resolve({ last_read_message_id : 0 });
      }
      resolve(result[0]);
    }, (error) => {
      logger.error(logHandler, "error in getReadLastReadMessageByOtherUser", error);
      reject(error);
    });
  });
}


function getReadLastReadMessagesByOtherUser(logHandler, channel_ids, user_id) {
  return new Promise((resolve, reject) => {
    if(!channel_ids.length) {
      return resolve({});
    }
    let query = `SELECT
                      channel_id, last_read_message_id
                  FROM user_to_channel
                  WHERE
                      channel_id in (?) AND user_id != ?
                  GROUP BY
                    channel_id
                  ORDER BY
                      last_read_message_id
                  DESC
                `;
    let queryObj = {
      query : query,
      args  : [channel_ids, user_id],
      event : "getReadLastReadMessagesByOtherUser"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let channelToStatus = {};
      for (let channel_id of channel_ids) {
        channelToStatus[channel_id] = { channel_id : channel_id, last_read_message_id : 0 };
      }
      for (let i = 0; i < result.length; i++) {
        channelToStatus[result[i].channel_id] = result[i];
      }
      // logger.debug(logHandler,{getReadLastReadMessagesByOtherUser : channelToStatus});
      resolve(channelToStatus);
    }, (error) => {
      logger.error(logHandler, "error in getReadLastReadMessagesByOtherUser", error);
      reject(error);
    });
  });
}

function getReadUnreadOfUserMessages(logHandler, message_ids) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      return {};
    })().then(
      (data) => {
        logger.debug(logHandler, "getReadUnreadOfUserMessages complete");
        resolve(data);
      },
      (error) => {
        logger.error(logHandler, "Error in getReadUnreadOfUserMessages ", error);
        reject(error);
      }
    );
  });
}

function getChannelsTotalMessageCount(logHandler, channelIds) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT
                      channel_id,
                      COUNT(*) AS total_messages
                  FROM
                      users_conversation
                  WHERE
                      channel_id IN(?) AND user_type = 1
                  GROUP BY
                      channel_id`;
    let queryObj = {
      query : query,
      args  : [channelIds],
      event : "getChannelsTotalMessageCount"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let channelMessageCount = {};
      for (let i = 0; i < result.length; i++) {
        channelMessageCount[result[i].channel_id] = result[i].total_messages;
      }
      resolve(channelMessageCount);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateUserMessageReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO  user_message_reaction  (user_id,message_id,user_reaction) VALUES (?,?,?)
                 ON DUPLICATE KEY UPDATE user_reaction = ?`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.message_id, opts.user_reaction, opts.user_reaction],
      event : "insertOrUpdateUserMessageReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getMessageByMuid(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = 'where muid = ?'
    if(opts.message_id){
      placeHolder = `where id = ${opts.message_id}`
    }
    const query = ` select id,
           muid,
           workspace_id,
           message_type,
           user_id,
           channel_id,
           message,
           created_at ,
           status,
           CAST(AES_DECRYPT(encrypted_message, "${config.get('aesKey')}") AS CHAR(31000)) encrypted_message ,
           status as message_state from users_conversation ${placeHolder}`;
    const queryObj = {
      query,
      args: [opts.muid],
      event: 'getMessageidByMuid'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertUserThreadMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO thread_user_messages (user_id, message_id, channel_id, thread_muid, message, encrypted_message, searchable_encrypted_message, message_type ) values (?,?,?,?,?,  AES_ENCRYPT(?,"${config.get("aesKey")}"), AES_ENCRYPT(?,"${config.get("aesKey")}") ,?)`;
    let expectedFields = opts.message_type in constants.fieldsBasedOnMessageType ?
      constants.fieldsBasedOnMessageType[opts.message_type] : constants.fieldsBasedOnMessageType.default;

    let message = {};
    for (let i = 0; i < expectedFields.length; i++) {
      if(expectedFields[i] in opts.data) {
        message[expectedFields[i]] = opts.data[expectedFields[i]];
      }
    }
    let messageString = utils.objectToJson(logHandler, message);
    const values = [opts.user_id, opts.message_id, opts.channel_id, opts.thread_muid, messageString, opts.message, opts.searchable_encrypted_message, opts.message_type];
    let queryObj = {
      query : query,
      args  : values,
      event : "insertUserThreadMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      opts.thread_message_id = result.insertId;
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertUserThreadMessageAndCreatedAt(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO thread_user_messages (user_id, message_id, channel_id, thread_muid, message, encrypted_message, searchable_encrypted_message, message_type , created_at ) values (?,?,?,?,?,  AES_ENCRYPT(?,"${config.get("aesKey")}"), AES_ENCRYPT(?,"${config.get("aesKey")}") ,? , ?)`;
    let expectedFields = opts.message_type in constants.fieldsBasedOnMessageType ?
      constants.fieldsBasedOnMessageType[opts.message_type] : constants.fieldsBasedOnMessageType.default;

    let message = {};
    for (let i = 0; i < expectedFields.length; i++) {
      if(expectedFields[i] in opts.data) {
        message[expectedFields[i]] = opts.data[expectedFields[i]];
      }
    }
    let messageString = utils.objectToJson(logHandler, message);
    const values = [opts.user_id, opts.message_id, opts.channel_id, opts.thread_muid, messageString, opts.message, opts.searchable_encrypted_message, opts.message_type,opts.created_at];
    let queryObj = {
      query : query,
      args  : values,
      event : "insertUserThreadMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      opts.thread_message_id = result.insertId;
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function updateInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    opts.message ? updateObj.message = opts.message : 0;
    (opts.status || opts.status == 0) ? updateObj.status = opts.status : 0;

    let query = `update users_conversation set ? where id  = ?`;

    let queryObj = {
      query : query,
      args  : [updateObj, opts.message_id],
      event : "updateUserMessageContent"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                      umr.message_id,
                      umr.user_reaction,
                      group_concat (umr.user_id) as users,
                      group_concat (u.full_name) as full_names,
                      COUNT(*) AS total_count
                  FROM
                      user_message_reaction umr
                      join user_to_workspace u on umr.user_id = u.user_id
                  WHERE
                      umr.message_id IN(` + opts.message_ids + `) and umr.user_reaction != '' and umr.user_reaction  is not null
                  GROUP BY
                      umr.user_reaction,
                      umr.message_id
                  ORDER BY
                      COUNT(*)`;
    let queryObj = {
      query : query,
      args  : [],
      event : "getUsersReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getTotalUserReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                      message_id,
                      COUNT(*) AS total_count
                  FROM
                      user_message_reaction
                  WHERE
                       message_id IN(` + opts.message_ids + `) and user_reaction != '' and user_reaction is not null
                  GROUP BY
                      message_id`;
    let queryObj = {
      query : query,
      args  : [],
      event : "getTotalUserReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getMessageReactions(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    group_concat (umr.user_id) as users,
                    group_concat (u.full_name) as full_names,
                    COUNT(*) AS total_count,
                    umr.user_reaction
                FROM
                    user_message_reaction umr
                JOIN users u ON
                    umr.user_id = u.user_id
                WHERE
                    umr.message_id = ? and umr.user_reaction != '' and umr.user_reaction is not null
                    group by umr.message_id, umr.user_reaction
                ORDER BY  u.full_name `;

    let queryObj = {
      query : query,
      args  : [payload.message_id],
      event : "getTotalUserReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertUserToMessage(logHandler, params) {
  return new Promise((resolve, reject) => {
    let userIds = params.userIds;
    if(_.isEmpty(userIds)) {
      logger.error(logHandler, { insertUserToMessage : "NOTHING TO INSERT INTO" });
      return resolve();
    }

    let values = [];
    let placeHolders = new Array(userIds.length).fill("(?,?,?)").join(', ');
    for (let i = 0; i < userIds.length; i++) {
      values = values.concat([userIds[i], params.message_id, params.status]);
    }

    let query = `INSERT INTO  user_to_message  (user_id, message_id, status) VALUES  ${placeHolders} ON DUPLICATE KEY UPDATE status = VALUES(status)`;

    let queryObj = {
      query : query,
      args  : values,
      event : "insertUserToMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserToThread(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeholder = "";
    let values = [payload.message_id];

    if(payload.status){
      placeholder = "AND status = ?";
      values.push(payload.status);
    }

    if (payload.user_id) {
      placeholder = "AND user_id = ?";
      values.push(payload.user_id);
    }

    let query = `select user_id , status from user_to_message where message_id = ? ${placeholder}`;

    let queryObj = {
      query : query,
      args  : values,
      event : "getUserToThread"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getThreadMessages(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
                  u.user_id,
                  u.full_name AS full_name,
                  IFNULL(utm.is_starred, 0) AS is_starred,
                  CAST(AES_DECRYPT(tm.encrypted_message,"${config.get("aesKey")}") as CHAR(31000)) as encrypted_message,
                  tm.message_id,
                  u.emails as username,
                  tm.message,
                  tm.thread_message_id,
                  tm.thread_muid,
                  tm.created_at as date_time,
                  tm.status as message_state,
                  tm.message_type
                           FROM
                 thread_user_messages tm
                      LEFT JOIN
                  user_to_workspace u ON u.user_id = tm.user_id
                      LEFT JOIN
                  user_to_message utm ON tm.thread_message_id = utm.thread_message_id AND utm.user_id = ?
                 WHERE
                   tm.message_id = ? order by tm.thread_message_id asc`;
    let queryObj = {
      query : query,
      args  : [payload.user_id, payload.message_id],
      event : "getThreadMessages"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}


function getLatestThreadMessage(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                  message_id,
                  user_id,
                  message,
                  message_type,
                  status as message_state, 
                  created_at as date_time
                   FROM
                      thread_user_messages
                  WHERE
                      thread_message_id IN (
                        SELECT
                            MAX(tum.thread_message_id)
                        FROM
                            thread_user_messages tum
                        LEFT JOIN users u ON
                            u.user_id = tum.user_id
                        WHERE
                            tum.message_id IN (?)
                        GROUP BY
                            tum.message_id
                        ORDER BY
                            tum.thread_message_id
                        DESC
                       )`;
    let queryObj = {
      query : query,
      args  : [payload.messageIds],
      event : "getLatestThreadMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function threadMessageCount(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                   COUNT(*) as total_message_count,
                   message_id,
                   max(created_at) as date_time
                     FROM
                 thread_user_messages
                 WHERE
                  message_id IN (?)
                 GROUP BY message_id`;
    let queryObj = {
      query : query,
      args  : [payload.messageIds],
      event : "threadMessageCount"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function getMessagesByMuids(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                   id as message_id,
                   muid,
                   channel_id,
                   user_id,
                   status as message_state
                 FROM
                  users_conversation
                   WHERE
                   channel_id = ? AND
                  muid IN (?)`;
    let queryObj = {
      query : query,
      args  : [payload.channel_id, payload.muids],
      event : "getMessagesByMuids"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}


function insertOrUpdateUserThreadMessageReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO  user_thread_message_reaction  (user_id,thread_message_id,user_reaction) VALUES (?,?,?)
                 ON DUPLICATE KEY UPDATE user_reaction = ?`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.thread_message_id, opts.user_reaction_emoji, opts.user_reaction_emoji],
      event : "insertOrUpdateUserThreadMessageReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      logger.debug(logHandler, { RESPONSE : "insertOrUpdateUserThreadMessageReaction",  result });
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersThreadMessageReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    utmr.thread_message_id,
                    utmr.user_reaction,
                    group_concat(utmr.user_id) as users,
                    group_concat(u.full_name) as full_names,
                    COUNT(*) AS total_count
                  FROM
                  user_thread_message_reaction utmr
                      join user_to_workspace u on utmr.user_id = u.user_id
                  WHERE
                   utmr.thread_message_id IN(` + opts.threadMessageIds + `) and utmr.user_reaction != '' and utmr.user_reaction  is not null
                  GROUP BY
                    utmr.user_reaction,
                    utmr.thread_message_id
                  ORDER BY
                      COUNT(*)`;
    let queryObj = {
      query : query,
      args  : [],
      event : "getUsersThreadMessageReaction"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getThreadMessageUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `select distinct user_id from thread_user_messages where message_id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.message_id],
      event : "getThreadMessageUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function getUserUnreadCount(logHandler, user_id) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let unreadCount = 0;
      // let userInfo = opts.userInfo;
      let userParticipatedChannels = yield channelService.getUserToChannelDetails(logHandler, { user_id: user_id, status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED] });
      let channelIds = [];

      for (let channel of userParticipatedChannels) {
        channelIds.push(channel.channel_id);
      }

      if(channelIds.length > 0) {
        let result = yield conversationService.getUnreadCountForCustomer(logHandler, channelIds, user_id);
        for (let res in result) {
          unreadCount += result[res];
        }
      }
      return { unread_count : unreadCount };
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getThreadMessageByThreadMuid(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `select thread_message_id, 
            message_id, 
            message_type, 
            message, 
            user_id ,
            channel_id,
            CAST(AES_DECRYPT(encrypted_message, "${config.get("aesKey")}") AS CHAR(31000)) encrypted_message ,
            status as message_state , created_at as date_time from thread_user_messages where thread_muid = ?`;
    let queryObj = {
      query : query,
      args  : [opts.thread_muid],
      event : "getThreadMessageUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}


function getMessageReaction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let message_ids = opts.messageIds;
      // get user reaction message
      let userReaction = yield getUsersReaction(logHandler, { message_ids : message_ids });
      // let totalUserReaction = yield getTotalUserReaction(logHandler, { message_ids : message_ids });
      let userReactionMap = {};
      let totalUserReactionMap = {};

      for (let reactionData of userReaction) {
        if(!userReactionMap[reactionData.message_id]) {
          userReactionMap[reactionData.message_id] = [];
        }

        if(totalUserReactionMap[reactionData.message_id]) {
          totalUserReactionMap[reactionData.message_id] = totalUserReactionMap[reactionData.message_id] + reactionData.total_count;
        } else if(!totalUserReactionMap[reactionData.message_id] || totalUserReactionMap[reactionData.message_id] == 0) {
          totalUserReactionMap[reactionData.message_id] = reactionData.total_count;
        }

        let reactionObj = {};
        reactionObj.users = reactionData.users.split(",");
        reactionObj.full_names = reactionData.full_names.split(',');
        reactionObj.reaction = reactionData.user_reaction;
        reactionObj.total_count = reactionData.total_count;
        userReactionMap[reactionData.message_id].push(reactionObj);
      }

      // for (let totalReaction of totalUserReaction) {
      //     totalUserReactionMap[totalReaction.message_id] = totalReaction.total_count
      // }

      return {
        userReactionMap      : userReactionMap,
        totalUserReactionMap : totalUserReactionMap
      };
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}

function getMessageUserInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    uc.id,
                    uc.muid,
                    uc.channel_id,
                    uc.user_id,
                    u.full_name,
                    u.user_type,
                    COALESCE(u.user_thumbnail_image, "") AS user_image,
                    uc.status as message_state,
                    uc.message,
                    uc.message_type,
                    CAST(AES_DECRYPT(encrypted_message, "${config.get("aesKey")}") AS CHAR(31000)) encrypted_message,
                    uc.created_at as date_time
                FROM
                    users_conversation uc
                JOIN user_to_workspace u ON
                    uc.user_id = u.user_id
                WHERE
                    uc.muid = ?`;
    let queryObj = {
      query : query,
      args  :  [opts.muid],
      event : "getMessageUserInfo"
    };
   dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function updateThreadMessageInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    opts.message ? updateObj.message = opts.message : 0;
    (opts.status || opts.status == 0) ? updateObj.status = opts.status : 0;

    let query = `update thread_user_messages set ? where thread_message_id  = ?`;
    let queryObj = {
      query : query,
      args  : [updateObj, opts.thread_message_id],
      event : "updateThreadMessageInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateUserToMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO  user_to_message (user_id,message_id,status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status = ?`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.message_id,opts.status,opts.status],
      event : "insertOrUpdateUserToMessage"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateStatusOrIsStarred(logHandler,opts){
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];

    if(opts.unstar_all) {
      placeHolder = ` user_id = ?`;
      values = [{ is_starred : constants.status.DISABLE }, opts.user_id];
    } else if(opts.is_starred == constants.status.DISABLE && (opts.message_id || opts.thread_message_id)) {
      if(opts.message_id){
        placeHolder = ` user_id = ? AND message_id = ?`;
      } else {
        placeHolder = ` user_id = ? AND thread_message_id = ?`;
      }
      values = [{ is_starred : constants.status.DISABLE }, opts.user_id, opts.message_id || opts.thread_message_id];
    } else {
      placeHolder = ` user_id IN (?) AND message_id = ?`;
      values = [{ status : constants.status.ENABLE }, opts.user_ids, opts.message_id];
    }

    let query = `UPDATE user_to_message SET ? WHERE ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "updateStatusOrIsStarred"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOwnerIntoUserToMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT IGNORE INTO  user_to_message (user_id,message_id) VALUES (?,?)`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.message_id],
      event : "insertOwnerIntoUserToMessage"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getMessageIndex(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT COUNT(*) as count FROM users_conversation WHERE channel_id = ? and workspace_id = ? and id >= ? and  message_type IN (${constants.userVisibleMessageTypes})`;
    let queryObj = {
      query : query,
      args: [opts.channel_id, opts.workspace_id, opts.message_id],
      event : "getMessageIndex"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function searchMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];

    if(opts.channel_id) {
      placeHolder = `  uc.channel_id = ? AND `;
      values.push(opts.channel_id);
    }

    values.push(opts.user_id , "%" + opts.search_text + "%", Math.abs(opts.page_start - 1), Math.abs(opts.page_end - opts.page_start + 1) )
// AND c.chat_type != 7
    let query = `SELECT
                     u.full_name,
                     uc.id,
                     utc.last_message_id,
                     uc.muid,
                     uc.user_id,
                     uc.channel_id,
                     uc.message,
                     uc.status,
                     uc.user_type,
                     uc.created_at AS date_time,
                     uc.message_type,
                     COALESCE(c.custom_label, "") as label,
                     c.chat_type,
                     c.channel_image,
                     c.status,
                     IFNULL(CAST(AES_DECRYPT(uc.searchable_encrypted_message, "${config.get("aesKey")}") AS CHAR(31000)), CAST(AES_DECRYPT(uc.encrypted_message, "${config.get("aesKey")}") AS CHAR(31000))) searchable_message 
                 FROM
                     users_conversation uc
                 JOIN user_to_channel utc ON
                     utc.channel_id = uc.channel_id
                 JOIN channels c ON
                     utc.channel_id = c.channel_id AND c.status = 1
                 LEFT JOIN user_to_workspace u ON
                     uc.user_id = u.user_id AND u.user_type IN (1,6,10)
                 WHERE
                    ${placeHolder}  utc.user_id = ? AND utc.status = 1 AND uc.status IN (1,4)  AND uc.muid IS NOT NULL AND uc.message_type IN (1,10) AND uc.id > utc.last_message_id HAVING searchable_message
                     LIKE ? ORDER BY uc.id DESC LIMIT ?,?`;
    let queryObj = {
      query : query,
      args  : values,
      event : "searchMessage"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function searchThreadMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    let values = [];

    if(opts.channel_id) {
      placeHolder = `  uc.channel_id = ? AND `;
      values.push(opts.channel_id);
    }

    values.push(opts.user_id,  "%" + opts.search_text + "%");

    let query = `SELECT
                    IFNULL(CAST(AES_DECRYPT(tum.searchable_encrypted_message, "${config.get("aesKey")}") AS CHAR(31000)), CAST(AES_DECRYPT(tum.encrypted_message, "${config.get("aesKey")}") AS CHAR(31000))) searchable_message ,
                    tum.message,
                    tum.message_id,
                    tum.thread_muid,
                    tum.user_id AS thread_user_id,
                    uc.channel_id,
                    uc.muid,
                    uc.user_id,
                    u.full_name,
                    COALESCE(c.custom_label, "") as label,
                    c.chat_type,
                    c.channel_image,
                    tum.created_at AS date_time
                FROM
                    thread_user_messages tum
                LEFT JOIN users_conversation uc ON
                    tum.message_id = uc.id
                LEFT JOIN user_to_workspace u ON
                    u.user_id = tum.user_id  and u.user_type IN (1,6,10)
                LEFT JOIN user_to_channel utc ON
                    uc.channel_id = utc.channel_id
               JOIN channels c ON
                   c.channel_id = uc.channel_id AND c.status = 1
                WHERE
                ${placeHolder} utc.user_id = ?  AND uc.status IN (1,4) AND tum.status IN (1,4) AND utc.status = 1 AND uc.message_type IN (1,10) AND uc.id > utc.last_message_id HAVING searchable_message
                LIKE ?`;
    let queryObj = {
      query : query,
      args  : values,
      event : "searchThreadMessage"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoOfOtherUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                       u.user_id,
                       u.full_name,
                       utc.channel_id
                   FROM
                       user_to_workspace u
                   LEFT JOIN user_to_channel utc ON
                       utc.user_id = u.user_id
                   WHERE
                       utc.channel_id IN(
                       SELECT
                          c.channel_id
                       FROM
                           user_to_channel utc
                           LEFT JOIN channels c ON
                     c.channel_id = utc.channel_id
                       WHERE
                           utc.user_id = ?  and c.chat_type = 2
                   ) AND u.user_id != ? and utc.status = 1
                  `;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.user_id],
      event : "getInfoOfOtherUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getStarredMessages(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                      *
                  FROM
                      (
                      SELECT
                          uc.id,
                          uc.muid,
                          CAST(AES_DECRYPT(uc.encrypted_message,"${config.get("aesKey")}") as CHAR(31000)) as encrypted_message,
                          uc.message,
                          uc.channel_id,
                          c.workspace_id,
                          c.custom_label AS label,
                          c.chat_type AS chat_type,
                          utm.thread_message_id AS thread_muid,
                          uw.full_name AS user_name,
                          uc.message_type,
                          utm.is_starred,
                          uc.created_at AS date_time
                      FROM
                          user_to_message utm
                      JOIN users_conversation uc ON
                          uc.id = utm.message_id
                      LEFT JOIN channels c ON
                          uc.channel_id = c.channel_id
                      JOIN user_to_workspace uw ON
                          uw.user_id = uc.user_id
                      WHERE
                          utm.user_id = ? AND utm.is_starred = 1 AND uc.status IN (1,4)
                      UNION
                  
                      SELECT
                          ucc.id,
                          ucc.muid,
                          CAST(AES_DECRYPT(tum.encrypted_message,"${config.get("aesKey")}") as CHAR(31000)) as encrypted_message,
                          tum.message,
                          ucc.channel_id,
                          tc.workspace_id,
                          COALESCE(tc.custom_label, "") AS label,
                          tc.chat_type,
                          tum.thread_muid,
                          u.full_name AS user_name,
                          tum.message_type,
                          utm.is_starred,
                          tum.created_at AS date_time
                      FROM
                          user_to_message utm
                      JOIN thread_user_messages tum ON
                          tum.thread_message_id = utm.thread_message_id
                      LEFT JOIN users_conversation ucc ON
                          tum.message_id = ucc.id
                      LEFT JOIN channels tc ON
                          ucc.channel_id = tc.channel_id
                      LEFT JOIN user_to_workspace u ON
                          tum.user_id = u.user_id
                      WHERE
                          utm.user_id = ? AND utm.is_starred = 1 AND tum.status in (1,4)
                      ) AS a
                      ORDER BY
                          date_time
                      DESC
                         LIMIT ?,?`
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.user_id, Math.abs(opts.page_start - 1), Math.abs(opts.page_end - opts.page_start + 1)],
      event : "getStarredMessages"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateStarredMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    if (!opts.status) {
      opts.status = 1;
    }
    let values = [opts.user_id, opts.status, opts.is_starred, opts.is_starred];
    if(opts.message_id) {
      placeHolder = `(user_id,message_id,status,is_starred)`;
      values = [opts.user_id, opts.message_id, opts.status, opts.is_starred, opts.is_starred];
    } else {
      placeHolder = `(user_id,thread_message_id,status,is_starred)`;
      values = [opts.user_id, opts.thread_message_id, opts.status, opts.is_starred, opts.is_starred];
    }
    let query = `INSERT INTO  user_to_message ${placeHolder} VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE is_starred = ?`;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertOrUpdateStarredMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function unstarMessages(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];
    if (opts.user_id) {
      placeHolder = ` AND utm.user_id = ? `;
      values = [opts.channel_id, opts.user_id, opts.channel_id, opts.user_id];
    } else {
      values = [opts.channel_id, opts.channel_id]
    }
    let query = `SELECT
                    utm.id
                 FROM
                     users_conversation uc
                 JOIN user_to_message utm ON
                     uc.id = utm.message_id
                 WHERE
                     uc.channel_id = ? ${placeHolder}
                    UNION ALL
                 SELECT
                    utm.id
                 FROM
                     thread_user_messages tum
                 LEFT JOIN user_to_message utm ON
                     tum.thread_message_id = utm.thread_message_id
                 JOIN users_conversation uc ON
                     uc.id = tum.message_id
                 WHERE
                     uc.channel_id = ? ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "updateUserToMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if (result.length) {
        const arrayOfStrings = result.map(item => item.id);
        updateUserToMessage(logHandler, arrayOfStrings);
      }
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserToMessage(logHandler, values) {
  return new Promise((resolve, reject) => {
    let query = `update user_to_message set is_starred = 0 WHERE id IN (?)`;
    let queryObj = {
      query : query,
      args  : [values],
      event : "updateUserToMessage"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserSendEmailData(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let values = [opts.user_id, opts.userIds];
    let placeHolder = '';
    if(opts.message_id) {
      placeHolder = ' and message_id = ?';
      values.push(opts.message_id);
    } else {
      placeHolder = ' and thread_message_id = ?';
      values.push(opts.thread_message_id);
    }

    let query = `select * from send_email where user_id = ? and send_email_to_user_id IN (?) ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "checkChatIsCreatedByAgent"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateSendMessageAsEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let values = [];
    let placeHolders = [];
    let columns = ' ( user_id, message_id, send_email_to_user_id, send_message_email_count)';
    if(payload.message_id) {
      _.each(payload.insertSendEmail, (value, key) => {
        values = values.concat(payload.userInfo.user_id, payload.message_id, key, value.send_message_email_count);
        placeHolders = placeHolders.concat("(?,?,?,?)");
      });
    } else {
      columns = ' ( user_id, thread_message_id, send_email_to_user_id, send_message_email_count)';
      _.each(payload.insertSendEmail, (value, key) => {
        values       = values.concat(payload.userInfo.user_id, payload.thread_message_id, key, value.send_message_email_count);
        placeHolders = placeHolders.concat("(?,?,?,?)");
      });
    }

    let query = `INSERT
                   INTO
                       send_email ${columns}
                   VALUES ${placeHolders}
                   ON DUPLICATE KEY
                   UPDATE
                       send_message_email_count = VALUES(send_message_email_count)`;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertOrUpdateSendMessageAsEmail"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertMessagePollOptions(logHandler, opts) {
  return new Promise((resolve, reject) => {

    if(_.isEmpty(opts.poll_options)) {
      throw new Error("Insufficient information.");
    }

    let values = [];
    let placeHolders = new Array(opts.poll_options.length).fill("(?,?,?)").join(', ');
    for (let i = 0; i < opts.poll_options.length; i++) {
      values = values.concat(opts.poll_options[i].puid, opts.message_id, opts.poll_options[i].label);
    }

    let query =  `INSERT INTO message_poll_options (puid, message_id, poll_option) VALUES  ${placeHolders} `;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertMessagePollOptions"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserMessagePoll(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let placeholder = ``;
    let values =  [opts.message_id, opts.user_id, opts.puid];

    if(!opts.is_voted) {
      placeholder = ` status = ?`;
      values.push(constants.status.DISABLE);
    } else if(opts.multiple_select && opts.is_voted) {
      placeholder = ` status = ?`;
      values.push(constants.status.ENABLE);
    } else {
      placeholder = ` puid = ?`;
      values.push(opts.puid);
    }

    let query =  `INSERT INTO  user_message_poll (message_id, user_id, puid) VALUES (?,?,?) ON DUPLICATE KEY update ${placeholder} `;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertMessagePollOptions"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserMessagePoll(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query =  `UPDATE user_message_poll SET puid = ? where message_id = ? AND user_id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.puid, opts.message_id, opts.user_id],
      event : "updateUserMessagePoll"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getMessagePoll(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let userPollMap = {};

      if(!_.isEmpty(opts.messageIds)) {
        let userPoll = yield getUserPoll(logHandler, { message_ids : opts.messageIds });
        for (let pollData of userPoll) {

          if(!userPollMap[pollData.message_id]) {
            userPollMap[pollData.message_id] = {};
          }

          if(!userPollMap[pollData.message_id][pollData.puid]) {
            userPollMap[pollData.message_id][pollData.puid] = {}
            userPollMap[pollData.message_id][pollData.puid].users = [];
            userPollMap[pollData.message_id][pollData.puid].puid = pollData.puid;
            userPollMap[pollData.message_id][pollData.puid].label = pollData.poll_option;
            userPollMap[pollData.message_id][pollData.puid].poll_count = 0;
          }

          if(pollData.user_id) {
            let messagePollObj = {};
            messagePollObj.user_id = pollData.user_id;
            messagePollObj.full_name = pollData.full_name;
            messagePollObj.user_image = pollData.user_image;
            userPollMap[pollData.message_id][pollData.puid].users.push(messagePollObj);
            userPollMap[pollData.message_id][pollData.puid].poll_count = userPollMap[pollData.message_id][pollData.puid].poll_count + 1;
          }
        }
      }

      return {
        userPollMap : userPollMap
      };
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}

function getUserPoll(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query =  `SELECT
                 mpo.poll_option,
                 mpo.message_id,
                 mpo.puid,
                 ump.user_id,
                 u.full_name,
                 coalesce(u.user_thumbnail_image,"") as user_image
             FROM
                 user_message_poll ump
             RIGHT JOIN message_poll_options mpo ON
                 ump.puid = mpo.puid and ump.status = 1
             LEFT JOIN user_to_workspace u ON
                 u.user_id = ump.user_id
                 WHERE mpo.message_id IN (?)`;
    let queryObj = {
      query : query,
      args  : [opts.message_ids],
      event : "getUserPoll"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserPollInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query =  `SELECT * FROM user_message_poll where message_id = ? and user_id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.message_id, opts.user_id],
      event : "getUserPoll"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updatePollExpired(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];
    if(opts.is_expired) {
      placeHolder = '$.is_expired';
      values = [opts.is_expired, opts.id];
    } else {
      placeHolder = "$.question";
      values = [opts.question, opts.id];
    }

    let query = `update users_conversation set message = JSON_SET(message,'${placeHolder}', ?) where id = ?`;
    let queryObj = {
      query : query,
      args  : values,
      event : "updatePollExpired"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertMessageHistory(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO message_history (muid, message, encrypted_message) VALUES (?,?,AES_ENCRYPT(?,"${config.get("aesKey")}"))`;
    let queryObj = {
      query : query,
      args  : [opts.muid, opts.message, opts.encrypted_message],
      event : "getThreadMessageUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function updateAction(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `update users_conversation set message = JSON_SET(message, "$.is_action_taken", ?) where id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.is_action_taken, opts.id],
      event : "updatePollExpired"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function editMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let table = ``;
    let whereCondition = ``;
    let values =  [opts.encrypted_message, opts.searchable_message];
    let message = ``
    if(opts.message_id) {
      table = `users_conversation`;
      whereCondition = `id = ?`;
      if(opts.message) {
        message = `  message = ? ,`
        values.push(JSON.stringify(opts.message))
      }
      values.push(opts.message_id);
    } else {
      table = `thread_user_messages`;
      whereCondition = `thread_message_id = ?`
      if (opts.message) {
        message = `  message = ? ,`
        values.push(JSON.stringify(opts.message))
      }
      values.push(opts.thread_message_id);
    }

    let query = ` UPDATE
            ${table} SET  
            encrypted_message =  AES_ENCRYPT(?,"${config.get("aesKey")}"),
            searchable_encrypted_message =  AES_ENCRYPT(?,"${config.get("aesKey")}"),
            ${message}
            status = 4
            WHERE ${whereCondition} `;

    let queryObj = {
      query : query,
      args  : values,
      event : "editMessage"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getTokenFromUserId(logHandler, values) {
  const query = `SELECT 
                  ud.full_name,
                  ud.user_unique_key,
                  ud.workspace_id,
                  ud.user_id,
                  ud.image_set,
                  ud.user_thumbnail_image as user_image,
                  ud.user_image as image,
                  ud.user_type,
                  ud.emails as email,
                  ud.role,
                  ud.contact_number,
                  ud.status,
                  ud.user_properties,
                  ud.manager_fugu_user_id
                FROM user_to_workspace ud
                WHERE ud.user_id = ?`;

  const queryObj = {
    query: query,
    args: [values.user_id],
    event: "getMessages"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch(error) {
    throw new Error(error);
  }
}

/**
 * made changes because of duplicate entry error from mysql, create a table mutex which is a reference table to avoid auto
 * increment holes that would come if we have used insert ignore. its work just like insert ignore but do not skip primary key values.
 */
async function insertUsersConversation(logHandler, opts) {
   let sql = `INSERT INTO users_conversation(workspace_id, user_id, muid, channel_id, message, encrypted_message, searchable_encrypted_message, user_type, message_type, status)
              values ( ?, ?, ?,  ?, ?, AES_ENCRYPT(?,"${config.get("aesKey")}"), AES_ENCRYPT(?,"${config.get("aesKey")}") , ?, ?, ? ) `;

  let expectedFields = opts.message_type in constants.fieldsBasedOnMessageType ?
    constants.fieldsBasedOnMessageType[opts.message_type] : constants.fieldsBasedOnMessageType.default;

  let message = {};
  for (let i = 0; i < expectedFields.length; i++) {
    if (expectedFields[i] in opts.data) {
      message[expectedFields[i]] = opts.data[expectedFields[i]];
    }
  }
  let messageString = commonFunctions.objectToJson(logHandler, message);

  const values = [opts.workspace_id, opts.user_id, opts.muid, opts.channel_id,
    messageString, opts.data.message, opts.searchable_encrypted_message, opts.user_type, opts.message_type, opts.status];

  const queryObj = {
    query: sql,
    args: values,
    event: "insertUsersConversation"
  };

  try {
    const result = dbHandler.executeQuery(logHandler, queryObj)
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

exports.insertIntoChannels = function (logHandler, opts, callback) {
  let allowedFields = [`workspace_id`, `status`,
    `label`, `channel_image`, `owner_id`, `chat_type`, 'custom_label'];
  let fields = [];
  let values = [];
  for (let field of allowedFields) {
    if (field in opts) {
      fields.push(field);
      values.push(opts[field]);
    }
  }
  let sql = "INSERT INTO `channels`(" + fields.join(', ') + " ) " +
    " VALUES( " + new Array(fields.length).fill("?").join(', ') + " )";

  dbHandler.query(logHandler, "query :: insertIntoChannels ", sql, values, (err, response) => {
    if (err) {
      return callback(err);
    }

    logger.trace(logHandler, "Channel inserted into db ");
    return callback(null, response);
  });
};



async function getUserDetails(logHandler, values) {
  let arr = [];
  let flag = true;
  let query = `SELECT 
                  ud.full_name,
                  ud.workspace_id,
                  ud.user_id,
                  ud.user_type,
                  ud.role,
                  ud.user_properties,
                  ud.emails,
                  ud.contact_number,
                  ud.user_thumbnail_image
                FROM user_to_workspace ud `;

    if(values.join_workspace_details){
      query += ` INNER JOIN workspace_details wd ON ud.workspace_id = wd.workspace_id`;
    }
    query += ` WHERE 1 = 1 `;

    if(values.attendance_token){
      flag = false;
      query += ` AND wd.attendance_token = ?`;
      arr.push(values.attendance_token);
    }
    if(values.user_type){
      flag = false;
      query += ` AND user_type = ?`;
      arr.push(values.user_type);
    }
    if(values.user_id){
      flag = false;
      query += ` AND ud.user_id = ? `;
      arr.push(values.user_id);
    }
    if(values.role){
      flag = false;
      query += ` AND ud.role = ? `;
      arr.push(values.role);
    }
    if(values.workspace_id){
      flag = false;
      query += ` AND ud.workspace_id = ? `;
      arr.push(values.workspace_id);
    }
    if(values.status){
      flag = false;
      query += ' AND ud.status = ? ';
      arr.push(values.status);
    }
    if(values.user_ids){
      flag = false;
      query += ' AND ud.user_id IN (?) ';
      arr.push(values.user_ids);
    }
    if(flag){
      throw('Invalid Data');
    }

  const queryObj = {
    query: query,
    args: arr,
    event: "getMessages"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch(error) {
    throw new Error(error);
  }
}

async function getStarMessages(logHandler, opts) {
  const query = `SELECT muid 
            FROM user_to_message u JOIN users_conversation uc on u.message_id = uc.id
             WHERE 
             u.user_id = ? AND is_starred = 1 and uc.channel_id = ? AND uc.id >= ? and uc.id <= ? `;

  const queryObj = {
    query: query,
    args: [opts.user_id, opts.channel_id, opts.start_message_id, opts.end_message_id],
    event: "getStarMessages"
  };

  try {
    return await slaveDbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function updateAdminOfGeneralGroups(logHandler, payload) {
  const query = `UPDATE user_to_channel uc JOIN channels c on c.channel_id = uc.channel_id
               SET role = "ADMIN" WHERE c.workspace_id = ? AND uc.user_id = ? AND
                c.chat_type IN (5,6) `;

  const queryObj = {
    query: query,
    args: [payload.workspace_id, payload.user_id],
    event: "updateAdminOfGeneralGroups"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}



async function getLatestThreadMessages(logHandler, payload) {
  const query = `SELECT utw.full_name, 
                    tum.message_id,
                    max(tum.thread_message_id) as a,
                    tum.user_id,
                    utw.image_set
                    FROM thread_user_messages tum 
                    JOIN 
                    user_to_workspace utw 
                    on
                     tum.user_id = utw.user_id 
                     WHERE 
                     tum.message_id IN (?)
                     GROUP BY tum.user_id,tum.message_id  ORDER BY a  DESC`;

  const queryObj = {
    query: query,
    args: [payload.thread_message_ids],
    event: "getLatestThreadMessages"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function getWorkspaceUnreadCount(logHandler, opts) {
  const query = `SELECT
       ch.channel_id, COUNT(*) AS unread_count
       FROM
       user_to_channel ch
       JOIN user_to_workspace u ON ch.user_id = u.user_id AND ch.status = 1
       JOIN channels  c on ch.channel_id = c.channel_id AND c.status = 1
       JOIN
       users_conversation uc ON ch.channel_id = uc.channel_id
       
       WHERE
       ch.user_id = ? AND uc.id > ch.last_read_message_id AND uc.message_type in (${constants.userReadUnreadMessageTypes})`;

  const queryObj = {
    query: query,
    args: [opts.user_id],
    event: "getWorkspaceUnreadCount"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function deleteNotification(logHandler, opts) {
  let placeHolder = ``;
  let values = [opts.thread_muid || opts.muid]
  if (opts.thread_muid) {
    placeHolder = ` thread_muid = ? and  thread_muid IS NOT NULL `
    if(!_.isEmpty(opts.tagged_users)) {
      placeHolder = placeHolder + ' AND user_id IN (?)'
      values.push(opts.tagged_users)
    }
  } else {
    placeHolder = ` muid = ? AND muid IS NOT NULL `
  }
  const query = `DELETE FROM notifications WHERE ${placeHolder}`;

  const queryObj = {
    query: query,
    args: values,
    event: "deleteNotification"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}



function getAllMessagesForElastic(logHandler, opts) {
  return new Promise((resolve, reject) => {
    const query = ` select id,
           muid,
           workspace_id,
           message_type,
           user_id,
           channel_id,
           message,
           created_at ,
           CAST(AES_DECRYPT(encrypted_message, "${config.get('aesKey')}") AS CHAR(31000)) encrypted_message ,
           CAST(AES_DECRYPT(searchable_encrypted_message, "${config.get('aesKey')}") AS CHAR(31000)) searchable_encrypted_message ,
           created_at,
           status as message_state from users_conversation WHERE id > ?  AND id < ? AND  message_type in (1,10) AND
         (  encrypted_message is not null 
           OR
          searchable_encrypted_message IS NOT NULL) 
           `;
    const queryObj = {
      query,
      args: [opts.page_start, opts.page_end],
      event: 'getAllMessagesForElastic'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllThreadMessagesForElastic(logHandler, opts) {
  return new Promise((resolve, reject) => {
    const query = `select thread_message_id as id,
           thread_muid,
           muid,
           message_id,
           tum.user_id,
           tum.message_type,
           tum.channel_id,
           tum.created_at ,
        CAST(AES_DECRYPT(tum.encrypted_message, "${config.get('aesKey')}") AS CHAR(31000)) encrypted_message ,
        CAST(AES_DECRYPT(tum.searchable_encrypted_message, "${config.get('aesKey')}") AS CHAR(31000)) searchable_encrypted_message, 
          tum.status as message_state from thread_user_messages tum JOIN channels c ON tum.channel_id = c.channel_id 
          JOIN users_conversation uc on tum.message_id = uc.id
          
          WHERE c.chat_type != 7 AND tum.message_type in (1,10) AND tum.status in (1,4) AND
           tum.encrypted_message is not null 
           OR
            tum.searchable_encrypted_message IS NOT NULL LIMIT ?,?
           `;
    const queryObj = {
      query,
      args: [opts.page_start,opts.page_end],
      event: 'getAllThreadMessagesForElastic'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceConversation(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if(opts.end_date < opts.start_date) {
      throw new Error("Invalid date")
    }
    let placeHolder = ``
    let values = [opts.workspace_id]
    if(opts.start_date) {
     placeHolder =  ` AND uc.created_at > ? AND uc.created_at < ? `
      values = [opts.workspace_id, opts.start_date,opts.end_date || new Date()]
    }
    let query = `SELECT
                      uc.id,
                      u.full_name,
                      uc.message_type,
                      uc.user_id,
                      IFNULL(CAST(AES_DECRYPT(uc.encrypted_message,"${config.get('aesKey')}") as CHAR(31000)), "This message cannot be displayed.") as message,
                      uc.message as extra_message_details,
                      uc.muid,
                      uc.channel_id,
                      c.custom_label,
                      tum.message as extra_thread_message_details,
                      GROUP_CONCAT(tum.user_id) as thread_user_id,
                      GROUP_CONCAT(tum.thread_muid) as thread_muid,
                     GROUP_CONCAT(tum.thread_message_id) as thread_message_id,
                      GROUP_CONCAT(u.full_name) as thread_user_full_name,
                      COUNT(*) as count,
                      DATE_FORMAT( uc.created_at - INTERVAL 330 MINUTE,"%Y-%m-%d" ) AS date_time
                  FROM
                      users_conversation uc
                  LEFT JOIN channels c ON
                      c.channel_id = uc.channel_id
                     LEFT JOIN thread_user_messages tum ON 
                      uc.id = tum.message_id
                     LEFT JOIN user_to_workspace u ON  tum.user_id = u.user_id 
                  WHERE
                      uc.workspace_id = ? AND c.chat_type IN(4,5,6) AND uc.status IN (1,4) ${placeHolder} GROUP by uc.id  
                  ORDER BY uc.created_at DESC`;
    let queryObj = {
      query: query,
      args: values,
      event: "getWorkspaceConversation"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                 c.channel_id,
                 c.owner_id as creator,
                 c.custom_label as group_name,
                 GROUP_CONCAT(uc.user_id) AS user_id,
                 GROUP_CONCAT(u.full_name) AS full_name
             FROM
                 channels c
             JOIN user_to_channel uc ON
                 c.channel_id = uc.channel_id AND c.chat_type IN (4,5,6)
             LEFT JOIN user_to_workspace u ON
                 uc.user_id = u.user_id
             WHERE
                 c.workspace_id = ?
             GROUP BY
                 uc.channel_id`;
    let queryObj = {
      query: query,
      args: [opts.workspace_id],
      event: "getWorkspaceChannels"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceMessagesReactions(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    umr.message_id,
                    umr.user_reaction,
                    GROUP_CONCAT(umr.user_id) AS users,
                    COUNT(*) AS total_count,
                    umr.created_at
                FROM
                    user_message_reaction umr
                JOIN users_conversation u ON
                    umr.message_id = u.id
                JOIN channels c ON
                    u.channel_id = c.channel_id
                WHERE
                    u.workspace_id = ? AND umr.user_reaction != '' AND umr.user_reaction IS NOT NULL AND c.chat_type IN(4,5,6)
                GROUP BY
                    umr.user_reaction,
                    umr.message_id
                ORDER BY
                    umr.created_at
                DESC
    `;
    let queryObj = {
      query: query,
      args: [opts.workspace_id],
      event: "getWorkspaceMessagesReactions"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertExportDataRequest(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `insert into export_data (user_id, start_date, end_date) values (?, ?, ?)`;

    let queryObj = {
      query: query,
      args: [opts.userInfo.user_id, opts.start_date, opts.end_date],
      event: "insertExportDataRequest"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getExportData(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                   ed.id,
                    ed.user_id,
                    ed.url,
                    u.full_name,
                    ed.request_count,
                    ed.from_time,
                    ed.to_time,
                    ed.status,
                    ed.created_at
                FROM
                    export_data ed
                JOIN user_to_workspace u ON
                    ed.user_id = u.user_id
                WHERE
                    ed.user_id = ?  and u.workspace_id = ?
            ORDER BY ed.created_at DESC`;
    let queryObj = {
      query: query,
      args: [opts.userInfo.user_id, opts.userInfo.workspace_id],
      event: "getExportData"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertCallingDetails(logHandler, opts) {
  return new Promise((resolve, reject) => {
    const query = `INSERT IGNORE INTO calling_details SET ?`;
    const queryObj = {
      query,
      args: [opts],
      event: 'insertCallingDetails'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserExportCount(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                 COUNT(*) AS data_count
             FROM
                 export_data ed
             WHERE
                 ed.user_id = ? AND ed.created_at > (NOW() - INTERVAL 7 DAY)`;
    let queryObj = {
      query: query,
      args: [opts.user_id],
      event: "getExportData"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceAllUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
               uw.full_name,
               u.email,
               uw.contact_number,
               uw.user_unique_key AS unique_id,
               uw.user_id AS id,
               uw.user_image,
               uw.user_thumbnail_image,
               uw.image_set,
               uw.department,
               uw.designation,
               uw.role,
               uw.status,
               uw.created_at AS onboard_date
           FROM
               user_to_workspace uw
           JOIN users u ON
               uw.user_unique_key = u.user_id
           WHERE
               uw.workspace_id = ?`;
    let queryObj = {
      query: query,
      args: [opts.workspace_id],
      event: "getWorkspaceAllUsers"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceThreadMessagesReactions(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    u.thread_message_id,
                    umr.user_reaction,
                      IFNULL(CAST(AES_DECRYPT(u.encrypted_message,"kenwfdhwoiujGSDIUUHU82E8HD98") as CHAR(31000)), "This message cannot be displayed.") as thread_message,
                      u.message as thread_extra_details,
                    GROUP_CONCAT(umr.user_id) AS users,
                    COUNT(*) AS total_count,
                    umr.created_at
                FROM
                 users_conversation uc JOIN thread_user_messages u on uc.id = u.message_id
                  LEFT JOIN  user_thread_message_reaction umr ON
                    umr.thread_message_id = u.thread_message_id
                JOIN channels c ON
                    u.channel_id = c.channel_id
                    
                WHERE
                    c.workspace_id = ?  AND c.chat_type IN(4,5,6)
                  GROUP BY
              umr.user_reaction,
                    u.thread_message_id
                ORDER BY
                    umr.created_at
                DESC`;
    let queryObj = {
      query: query,
      args: [opts.workspace_id],
      event: "getWorkspaceThreadMessagesReactions"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getExpectedDate(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``
    if(opts.export_id) {
      placeHolder = ` AND id < ?`
    } else {
      placeHolder = ` LIMIT 1`
    }
    let query = `SELECT COUNT(*)/6 as time,
     date_format(now()+ INTERVAL COUNT(*)/6 day,"%M %e, %Y") as date_time, user_id, id, start_date,end_date
     FROM export_data WHERE status = "PENDING" ${placeHolder}`;
    let queryObj = {
      query: query,
      args: [opts.export_id],
      event: "getExpectedDate"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getCallingDetails(logHandler, opts) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM calling_details WHERE calling_link = ? `;
    const queryObj = {
      query,
      args: [opts.calling_link],
      event: 'getCallingDetails'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateExportData(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    if(opts.status) {
      updateObj.status = opts.status;
    }

    if(opts.url) {
      updateObj.url = opts.url;
    }

    let query = `UPDATE export_data  set ? WHERE id = ? `;
    let queryObj = {
      query: query,
      args: [updateObj, opts.export_id],
      event: "updateExportData"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateCallingDetails(logHandler, opts) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE calling_details SET user_count = user_count + 1, user_ids_in_call = ?  where id = ?`;
    const queryObj = {
      query,
      args: [opts.user_ids_in_call, opts.calling_id],
      event: 'updateCallingDetails'
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
