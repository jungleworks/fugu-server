const _                       = require('underscore');
const channelService          = require('../services/channel');
const conversationService     = require('../services/conversation');
const notifierService         = require('../services/notifier');
const userService             = require('../services/user');
const botController           = require('../Controller/botController');
const bot                     = require('../services/bot');
const constants               = require('../Utils/constants');
const { logger }              = require('../libs/pino_logger');
const RESP                    = require('../Config').responseMessages;
const utils                   = require('../Utils/commonFunctions');
const UniversalFunc           = require('../Utils/universalFunctions');
const messageBuilder          = require('../Builder/message');
const utilityService          = require('../services/utility');
const pushNotificationBuilder = require('../Builder/pushNotification');
const redis                   = require('../Utils/redis').Redis;
const businessService         = require('../services/business');
const esClient                = require('../Utils/elasticServer');
const cheerio                 = require('cheerio');
const notificationBuilder     = require('../Builder/notification');
const workspaceService        = require('../services/workspace');
const {
  performance
} = require('perf_hooks');

const fs = require('fs');
const fse = require('fs-extra');
const zipdir = require('zip-dir');
const lz4 = require('lz4');

const PromiseManager = require('../Utils/promiseManager').promiseManager;

const promiseManager = new PromiseManager('executingReports');


exports.getMessages             = getMessages;
exports.getConversations        = getConversations;
exports.getThreadMessages       = getThreadMessages;
exports.getLatestThreadMessage  = getLatestThreadMessage;
exports.searchMessages          = searchMessages;
exports.starMessage             = starMessage;
exports.getStarredMessages      = getStarredMessages;
exports.inviteToConference      = inviteToConference;
exports.conversationSendMessage = conversationSendMessage;
exports.uploadFile              = uploadFile;
exports.map                     = map;
exports.verifyTurnCreds         = verifyTurnCreds;
exports.insertElasticMessages   = insertElasticMessages;
exports.updateStatus            = updateStatus;
exports.exportData              = exportData;
exports.requestExport           = requestExport;
exports.getExportData           = getExportData;
exports.updateConferenceCall    = updateConferenceCall;
exports.getBotConfiguration     = getBotConfiguration;

async function map(logHandler, payload) {
  const response = {};

  const messages = await promiseManager.fetchAndExecute(575023);
  response.messages = messages;

  const list = await promiseManager.list(575023);
  response.list = list;

  const hasHash = await promiseManager.has(575023);
  response.hasHash = hasHash;
  return response;
}

async function getMessages(logHandler, payload) {
  if (payload.old_dashboard) {
    throw RESP.ERROR.eng.REDIRECT_ERROR;
  }
  const opts = {};
  opts.app_secret_key = payload.businessInfo.app_secret_key;
  opts.access_token = payload.access_token;
  opts.channel_id = payload.channel_id;
  opts.user_id = payload.userInfo.user_id;
  opts.user_type = payload.userInfo.user_type;
  opts.user_unique_key = payload.userInfo.user_unique_key;
  payload.token = payload.device_token;
  const response = {};
  opts.page_start = parseInt(payload.page_start) || 1; // pagination
  opts.page_end = parseInt(payload.page_end) || opts.page_start + constants.getMessagesPageSize - 1;
  opts.store_promise = payload.store_promise;
  const { channelInfo } = payload;
  const { userInfo } = payload;

  if (channelInfo.status == constants.status.DISABLE) {
    throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
  }

  if (userInfo.workspace_id != channelInfo.workspace_id) {
    const error = {
      user_id: userInfo.user_id,
      user_business_id: userInfo.workspace_id,
      channel_id: channelInfo.channel_id,
      channel_business_id: channelInfo.workspace_id
    };
    logger.error(logHandler, "user and channel don't belong to same workspace ", error);
    throw new Error("user and channel don't belong to same workspace ");
  }

  let role ;
  if (payload.userInfo.user_type == constants.userType.CUSTOMER) {
    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
    if (!userExistsInChannel.length && channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
      logger.error(logHandler, 'user does not belong to this channel');
      throw new Error(RESP.ERROR.eng.UNAUTHORIZED.customMessage);
    }
    if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      if (payload.userInfo.role == constants.userRole.OWNER) {
        role = constants.userRole.ADMIN;
      } else  {
        role = userExistsInChannel[0].role;
      }
    } else if (userExistsInChannel.length) {
      role = userExistsInChannel[0].role;
    }
    payload.user_channel_status = userExistsInChannel.length ? userExistsInChannel[0].status : 0;
  }

  // get clear chat history message_id
  const clearChatHistory = await channelService.getClearChatHistory(logHandler, opts);
  opts.clear_chat_message_id = clearChatHistory.length ? clearChatHistory[0].last_message_id : 0;

  let saveGetMessageResponse = false;

  if (payload.store_promise && opts.page_start == 1 &&
    ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type))) {
    if (!opts.clear_chat_message_id) {
      saveGetMessageResponse = true;
    } else {
      const messageCount = await conversationService.getMessageIndex(logHandler, { channel_id: channelInfo.channel_id,
         message_id: opts.clear_chat_message_id + 1, workspace_id: channelInfo.workspace_id });
      if (messageCount[0].count >= constants.getMessagesPageSize) {
        saveGetMessageResponse = true;
      }
    }

    if (saveGetMessageResponse) {
      // as json is compressed and stored as buffer so need to use get buffer to get it from redis.
      const hashResponse = await redis.getBuffer(constants.promiseHash + channelInfo.channel_id);
      if (hashResponse) {
        var t0 = performance.now();
        const output = lz4.decode(hashResponse).toString();
        var t1 = performance.now();
        console.log("Decompression took " + (t1 - t0) + " milliseconds. " + channelInfo.channel_id);
        const historyPayload = {
          user_id: userInfo.user_id,
          user_unique_key: userInfo.user_unique_key,
          business_id: channelInfo.business_id,
          channel_id: channelInfo.channel_id,
          mark_all_read: true,
          chat_type: channelInfo.chat_type,
          last_read_message_id: clearChatHistory.length ? clearChatHistory[0].last_read_message_id : 0,
          workspace_id: userInfo.workspace_id
        };

        conversationService.syncMessageHistory(logHandler, historyPayload);
        return JSON.parse(output);
      // await promiseManager.fetchAndExecute(channelInfo.channel_id + process.env.pm_id );
      }
    }
  }
  opts.workspace_id = channelInfo.workspace_id;
  // get chat
  let chatMessages = await conversationService.getChatMessages(logHandler, opts);
  chatMessages = chatMessages.reverse();

  const message_ids = [];
  const threadMessageIds = [];
  const poll_message_ids = [];

  for (let j = 0; j < chatMessages.length; j++) {
    utils.addAllKeyValues(utils.jsonToObject(logHandler, chatMessages[j].message), chatMessages[j]);
    chatMessages[j].message = chatMessages[j].encrypted_message;
    delete chatMessages[j].encrypted_message;
    if (chatMessages[j].message_state == constants.status.DISABLE) {
      if (chatMessages[j].user_id == userInfo.user_id) {
        chatMessages[j].message = constants.deleteMessage.FOR_ME;
      } else {
        chatMessages[j].message = constants.deleteMessage.FOR_OTHERS;
      }
    }

    if (chatMessages[j].thread_message) {
      threadMessageIds.push(chatMessages[j].id);
    }

    message_ids.push(chatMessages[j].id);
    chatMessages[j].user_type = chatMessages[j].user_type || 0;
    if (chatMessages[j].message_type == constants.messageType.POLL) {
      poll_message_ids.push(chatMessages[j].id);
    }
  }

  let threadMessageMap = {}
  try {
    if (threadMessageIds.length) {
      let threadResult = await conversationService.getLatestThreadMessages(logHandler, { thread_message_ids: threadMessageIds });
      if (threadResult.length) {
        for (let data of threadResult) {
          if (data.image_set) {
            data.image_set = JSON.parse(data.image_set);
            data.user_image_50x50 = data.image_set.image_50x50;
          }

          if (threadMessageMap[data.message_id]) {
            if (threadMessageMap[data.message_id].length < 2) {
              threadMessageMap[data.message_id].push(data)
              if(threadMessageMap[data.message_id].length == 2) {
                threadMessageMap[data.message_id].reverse();
              }
            }
          } else {
            threadMessageMap[data.message_id] = []
            threadMessageMap[data.message_id].push(data)
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  }


  if (message_ids.length) {
    const { userReactionMap, totalUserReactionMap } = await conversationService.getMessageReaction(logHandler, { messageIds: message_ids });
    const lastReadMessage = await conversationService.getReadLastReadMessageByOtherUser(logHandler, channelInfo.channel_id, userInfo.user_id);
    const { userPollMap } = await conversationService.getMessagePoll(logHandler, { messageIds: poll_message_ids });

    for (let i = 0; i < chatMessages.length; i++) {
      chatMessages[i].message_status = (lastReadMessage.last_read_message_id >= chatMessages[i].id) ? constants.messageStatus.READ : constants.messageStatus.SENT;
      chatMessages[i].user_reaction = {};
      chatMessages[i].thread_message_data = threadMessageMap[chatMessages[i].id] ? threadMessageMap[chatMessages[i].id] : [];
      chatMessages[i].user_reaction.reaction = userReactionMap[chatMessages[i].id] ? userReactionMap[chatMessages[i].id] : [];
      chatMessages[i].user_reaction.total_reaction = totalUserReactionMap[chatMessages[i].id] ? totalUserReactionMap[chatMessages[i].id] : 0;

      if (userPollMap[chatMessages[i].id]) {
        chatMessages[i].poll_options = [];
        chatMessages[i].total_votes = 0;
        _.each(userPollMap[chatMessages[i].id], (value, key) => {
          const poll_object = {};
          poll_object.puid = key;
          poll_object.users = value.users || [];
          poll_object.label = value.label;
          poll_object.poll_count = value.poll_count;
          chatMessages[i].total_votes = chatMessages[i].total_votes + value.poll_count;
          chatMessages[i].poll_options.push(poll_object);
        });
      }
    }
  }

  // let channelAndLabelInfo = await channelService.getChannelAndLabelInfo(logHandler, opts.channel_id);
  // let ownerAndAgentInfo = await channelService.getOwnerAndAgentOfChannel(logHandler, opts);

  // if user is a customer assign business name to auto message
  if (opts.user_type == constants.userType.CUSTOMER) {
    if (chatMessages.length) { chatMessages[0].full_name = chatMessages[0].full_name || payload.businessInfo.workspace_name; }
  }

  const historyPayload = {
    user_id: userInfo.user_id,
    user_unique_key: userInfo.user_unique_key,
    business_id: channelInfo.business_id,
    channel_id: channelInfo.channel_id,
    mark_all_read: true,
    chat_type: channelInfo.chat_type,
    last_read_message_id: clearChatHistory.length ? clearChatHistory[0].last_read_message_id : 0,
    user_channel_status: payload.user_channel_status,
    workspace_id: channelInfo.workspace_id
  };

  conversationService.syncMessageHistory(logHandler, historyPayload);
  // sending read notification
  conversationService.notifyReadAll(logHandler, opts);

  const options = {
    channelInfo,
    businessInfo: payload.businessInfo,
    userInfo,
    notificationType: pushNotificationBuilder.notificationType.READ_ALL,
    usersUnreadNotificationCount: {},
    isSilent: true,
    userIds: [userInfo.user_id]
  };
  notifierService.notifyUsers(logHandler, options);
  // sync notifications
  const syncPayload = {
    businessInfo: payload.businessInfo,
    channelInfo: payload.channelInfo,
    userInfo: payload.userInfo,
    user_unique_keys: [userInfo.user_unique_key],
    channel_id: channelInfo.channel_id,
    decrement_count: true
  };
  notifierService.syncNotificationCount(logHandler, syncPayload);

  response.messages = chatMessages;
  response.channel_id = opts.channel_id;
  response.page_size = constants.getMessagesPageSize;
  response.channel_name = channelInfo.channel_name;
  response.channel_attributes = channelInfo.custom_attributes || {};
  response.chat_type = channelInfo.chat_type;
  response.full_name = userInfo.full_name;
  // response.user_id            = channelInfo.agent_id ||  -1;
  response.label = channelInfo.custom_label || channelInfo.label
    || payload.businessInfo.workspace_name;

  if ((opts.user_type == constants.userType.CUSTOMER || opts.user_type == constants.userType.ATTENDANCE_BOT || opts.user_type == constants.userType.GUEST) && (channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT)) {
    let otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: opts.channel_id, user_id: opts.user_id });

    //remove duplicate element
    otherUsers=otherUsers.reverse();
    otherUsers = otherUsers.reduce((acc, current) => {
      const x = acc.find(item => item.user_id === current.user_id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    if (otherUsers.length && otherUsers[0].user_type == constants.userType.SELF_BOT) {
      otherUsers = [userInfo];
      otherUsers[0].full_name = otherUsers[0].full_name + " (me)"
      otherUsers[0].user_type = constants.userType.SELF_BOT
    }

    response.user_id = otherUsers[0].user_id;
    response.status = +constants.getFuguUserStatus[otherUsers[0].status];
    response.user_image = otherUsers[0].user_image;
    response.user_type = otherUsers[0].user_type;

    if (userInfo.user_properties) {
      userInfo.user_properties = JSON.parse(userInfo.user_properties);

      if (userInfo.user_properties.hasOwnProperty('is_one_to_one_chat_allowed') && !userInfo.user_properties.is_one_to_one_chat_allowed) {
        response.status = 0;
      }
    }

    response.label = (otherUsers.length > 0) ? (otherUsers[0].full_name || payload.businessInfo.workspace_name) : response.label;
    (otherUsers.length) ? response.leave_type = otherUsers[0].leave_type : 0;
  }

  if ((channelInfo.chat_type != constants.chatType.O20_CHAT && channelInfo.chat_type != constants.chatType.FUGU_BOT) && (!channelInfo.custom_label || !channelInfo.channel_image)) {
    const result = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: userInfo.user_id });
    const channelsUserInfo = result.channelUserMap || {};
    const channelLabelMap = result.channelLabelMap || {};
    const members_info = channelsUserInfo[channelInfo.channel_id] || [];
    let label = channelLabelMap[channelInfo.channel_id];

    if (members_info.length < constants.unamedGroupMemberLength) {
      label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
    }

    response.label = !channelInfo.custom_label ? label : channelInfo.custom_label;
    response.custom_label = !channelInfo.custom_label ? response.label : undefined;
  }

  if (payload.device_id) {
    payload.device_details = utils.objectToJson(logHandler, payload.device_details);
    userService.updateDeviceInfo(logHandler, payload, userInfo);
  }
  if (response.user_type == constants.userType.FUGU_BOT) {
    response.fugu_bot_tags = constants.fuguBotTags.slice();
    if(payload.userInfo.role == constants.userRole.OWNER) {
      response.fugu_bot_tags.push(constants.exportDataTags[0], constants.exportDataTags[1], constants.disableWorkspaceTags[0])
    }
    const secretSantaBot = await bot.getApps(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: 14 });
    if (secretSantaBot.length && secretSantaBot[0].status == 1 && (userInfo.role == constants.userRole.ADMIN || userInfo.role == constants.userRole.OWNER)) {
      response.fugu_bot_tags.push(constants.secretSantaTags);
    }
  } else if (response.user_type == constants.userType.ATTENDANCE_BOT || response.user_type == constants.userType.HRM_BOT) {
    response.fugu_bot_tags = constants.attendanceBotTags;
  } else if (response.user_type == constants.userType.SCRUM_BOT) {
    response.fugu_bot_tags = constants.scrumBotMetric;
  } else if (response.user_type == constants.userType.CONFERENCE_BOT ) {
    response.fugu_bot_tags = constants.conferenceBotTags;
  } else {
    response.fugu_bot_tags = [];
  }


  if(channelInfo.channel_properties) {
    channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
    response.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
    if (channelInfo.channel_properties.only_admin_can_message) {
      if (role == constants.userRole.USER) {
        response.status = 0;
      }
    }
  }
  response.user_channel_role = role || constants.userRole.USER;

  if (saveGetMessageResponse && opts.page_start == 1
    && ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type))) {
    var t3 = performance.now();

    const compressed = lz4.encode(JSON.stringify(response));
    var t4 = performance.now();
    console.log("Compression took " + (t4 - t3) + " milliseconds. " + channelInfo.channel_id);
    redis.setex(constants.promiseHash + channelInfo.channel_id, constants.getMessageCacheTime, compressed);
}
  response.user_channel_status = payload.user_channel_status;
  return response;
}

async function getConversations(logHandler, payload) {
  const { userInfo } = payload;
  const { businessInfo } = payload;
  if (payload.old_dashboard) {
    throw RESP.ERROR.eng.REDIRECT_ERROR;
  }
  if (payload.app_secret_key && !payload.en_user_id && utils.securedBusiness(businessInfo)) {
    throw new Error('Something is missing from our end.');
  }

  const opts = {
    user_id: userInfo.user_id,
    business_id: businessInfo.business_id,
    business_name: businessInfo.business_name,
    domain_id: businessInfo.domain_id,
    app_secret_key: businessInfo.app_secret_key,
    device_type: payload.device_type,
    app_version: payload.app_version,
    device_details: payload.device_details,
    device_id: payload.device_id,
    token: payload.device_token,
    businessInfo,
    userInfo
  };

  payload.voip_token ? opts.voip_token = payload.voip_token : 0;

  if (payload.page_start) {
    opts.page_start = parseInt(payload.page_start);
    opts.page_end = payload.page_end ? parseInt(payload.page_end) : opts.page_start + constants.getConversationsPageSize - 1;
  }

  return await conversationService.getUserConversation(logHandler, opts);
}

async function getThreadMessages(logHandler, payload) {
  const { channelInfo } = payload;
  const { userInfo } = payload;
  const result = {};
  let error;
  let messageInfo = await conversationService.getMessageUserInfo(logHandler, { channel_id: channelInfo.channel_id, muid: payload.muid });

  if (!messageInfo.length) {
    logger.error(logHandler, 'Invalid Muid');
    return { message: {}, thread_message: [] };
  }
  messageInfo = messageInfo[0];
  if (messageInfo.message_state == constants.status.DISABLE) {
    error = new Error('This message has been deleted.');
    error.errorResponse = RESP.ERROR.eng.MESSAGE_DELETED;
  }

  if(messageInfo.channel_id != channelInfo.channel_id) {
    throw new Error("Invalid workspace channel")
  }

  if(userInfo.workspace_id != channelInfo.workspace_id) {
    throw new Error("Invalid workspace.")
  }

  if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
    let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: channelInfo.workspace_id, status: constants.status.ENABLED });
    if (userOwnerInfo.length && userOwnerInfo[0].fugu_user_id == payload.userInfo.user_id) {
      result.user_channel_role == constants.userRole.ADMIN;
    }
  } else if (channelInfo.channel_properties) {
    channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
    result.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
    if (channelInfo.channel_properties.only_admin_can_message && userExistsInChannel.length) {
      result.user_channel_role = userExistsInChannel[0].role;
    } else {
      result.user_channel_role = constants.userRole.USER
    }
  }


  utils.addAllKeyValues(utils.jsonToObject(logHandler, messageInfo.message), messageInfo);
  messageInfo.message = messageInfo.encrypted_message;
  delete messageInfo.encrypted_message;
  if (messageInfo.message_state == constants.status.DISABLE) {
    if (messageInfo.user_id == userInfo.user_id) {
      messageInfo.message = constants.deleteMessage.FOR_ME;
    } else {
      messageInfo.message = constants.deleteMessage.FOR_OTHERS;
    }
  }

  const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
  if (!userExistsInChannel.length && channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
    logger.error(logHandler, 'user does not belong to this channel');
    throw new Error(RESP.ERROR.eng.UNAUTHORIZED.customMessage);
  }


  const { userReactionMap, totalUserReactionMap } = await conversationService.getMessageReaction(logHandler, { messageIds: [messageInfo.id] });

  messageInfo.user_reaction = {};
  messageInfo.user_reaction.reaction = userReactionMap[messageInfo.id] ? userReactionMap[messageInfo.id] : [];
  messageInfo.user_reaction.total_reaction = totalUserReactionMap[messageInfo.id] ? totalUserReactionMap[messageInfo.id] : 0;

  result.message = messageInfo;

  const threadMessages = await conversationService.getThreadMessages(logHandler, { message_id: messageInfo.id, user_id: payload.userInfo.user_id, channel_id: channelInfo.channel_id });

  const threadMessageIds = [];
  let lastThreadMessage;
  // convert json to fields
  for (let j = 0; j < threadMessages.length; j++) {
    utils.addAllKeyValues(utils.jsonToObject(logHandler, threadMessages[j].message), threadMessages[j]);
    threadMessages[j].message = threadMessages[j].encrypted_message;
    delete threadMessages[j].encrypted_message;
    if (threadMessages[j].message_state == constants.status.DISABLE) {
      if (userInfo.user_id == threadMessages[j].user_id) {
        threadMessages[j].message = constants.deleteMessage.FOR_ME;
      } else {
        threadMessages[j].message = constants.deleteMessage.FOR_OTHERS;
      }
    }
    threadMessageIds.push(threadMessages[j].thread_message_id);

    if (j == threadMessages.length - 1) {
      lastThreadMessage = threadMessages[j].thread_message_id;
    }
  }

  if (lastThreadMessage && (channelInfo.chat_type == constants.chatType.PRIVATE_GROUP || channelInfo.chat_type == constants.chatType.PUBLIC_GROUP || channelInfo.chat_type == constants.chatType.O20_CHAT)) {
    channelService.insertIntoMessageSeen(logHandler, { user_id: userInfo.user_id, channel_id: channelInfo.channel_id, thread_message_id: lastThreadMessage });
  }

  if (threadMessageIds.length) {
    const getUsersThreadMessageReaction = await conversationService.getUsersThreadMessageReaction(logHandler, { threadMessageIds });
    // let getTotalUserThreadMessageReaction = yield conversationService.getTotalUserThreadMessageReaction(logHandler, { threadMessageIds : threadMessageIds });

    const userThreadReactionMap = {};
    const totalUserThreadReactionMap = {};

    for (const reactionData of getUsersThreadMessageReaction) {
      if (!userThreadReactionMap[reactionData.thread_message_id]) {
        userThreadReactionMap[reactionData.thread_message_id] = [];
      }

      if (totalUserThreadReactionMap[reactionData.thread_message_id]) {
        totalUserThreadReactionMap[reactionData.thread_message_id] = totalUserThreadReactionMap[reactionData.thread_message_id] + reactionData.total_count;
      } else if (!totalUserThreadReactionMap[reactionData.thread_message_id] || totalUserThreadReactionMap[reactionData.thread_message_id] == 0) {
        totalUserThreadReactionMap[reactionData.thread_message_id] = reactionData.total_count;
      }

      const reactionObj = {};
      reactionObj.users = reactionData.users.split(',');
      reactionObj.full_names = reactionData.full_names.split(',');
      reactionObj.reaction = reactionData.user_reaction;
      reactionObj.total_count = reactionData.total_count;
      userThreadReactionMap[reactionData.thread_message_id].push(reactionObj);
    }

    for (let i = 0; i < threadMessages.length; i++) {
      threadMessages[i].user_reaction = {};
      threadMessages[i].user_reaction.reaction = userThreadReactionMap[threadMessages[i].thread_message_id] ? userThreadReactionMap[threadMessages[i].thread_message_id] : [];
      threadMessages[i].user_reaction.total_reaction = totalUserThreadReactionMap[threadMessages[i].thread_message_id] ? totalUserThreadReactionMap[threadMessages[i].thread_message_id] : 0;
    }
  }
  result.thread_message = threadMessages;

  const userFollowingStatus = await conversationService.getUserToThread(logHandler, { message_id: messageInfo.id, user_id: userInfo.user_id });

  if (!_.isEmpty(userFollowingStatus)) {
    result.user_following_status = userFollowingStatus[0].status;
  }

  if (channelInfo.chat_type == constants.chatType.O20_CHAT) {
    const otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
    result.status = +constants.getFuguUserStatus[otherUsers[0].status];
  }

  if (channelInfo.chat_type != constants.chatType.O20_CHAT) {
    const channelLabel = await channelService.getChannelsUsersInfo(logHandler, { user_id: userInfo.user_id, channel_ids: [channelInfo.channel_id] });
    let otherUsersData = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });

    if (otherUsersData.length && otherUsersData[0].user_type == constants.userType.SELF_BOT) {
      result.label = userInfo.full_name + " (me)"
      result.other_user_type = constants.userType.SELF_BOT;
    }  else {
      const channelLabelData = channelLabel.channelLabelMap || {};
      result.label = channelInfo.custom_label || channelLabelData[channelInfo.channel_id];
    }
  }

  // sync notifications
  const syncPayload = {
    businessInfo: payload.businessInfo,
    channelInfo: payload.channelInfo,
    userInfo: payload.userInfo,
    user_unique_keys: [userInfo.user_unique_key],
    channel_id: channelInfo.channel_id,
    muid: payload.muid,
    decrement_count: true,
  };
  notifierService.syncNotificationCount(logHandler, syncPayload);
  result.user_channel_status = userExistsInChannel.length ? userExistsInChannel[0].status : 0;

  return result;
}

async function getLatestThreadMessage(logHandler, payload) {
  const { channelInfo } = payload;
  const { userInfo } = payload;
  const messages = await conversationService.getMessagesByMuids(logHandler, { channel_id: channelInfo.channel_id, muids: payload.muids });

  if (!messages.length) {
    logger.error(logHandler, 'Invalid Muids!');
    return { threaded_message_info: [] };
  }

  const messageToMuidMap = {};
  const messageIds = [];
  for (const message of messages) {
    messageToMuidMap[message.message_id] = message.muid;
    messageIds.push(message.message_id);
  }


  //    let latestMessage = yield conversationService.getLatestThreadMessage(logHandler, { messageIds : messageIds });
  const chatCount = await conversationService.threadMessageCount(logHandler, { messageIds });

  const threadMessageInfo = [];
  const countMap = {};

  // for (let countData of chatCount) {
  //   countMap[countData.message_id] = {};
  //   countMap[countData.message_id].total_message_count = countData.total_message_count;
  //   countMap[countData.message_id] = countData.total_message_count;
  // }

  for (const messageData of chatCount) {
    const messageObj = {};
    messageObj.total_message_count = messageData.total_message_count;
    messageObj.muid = messageToMuidMap[messageData.message_id];
    messageObj.date_time = messageData.date_time;

    // if(messageData.message_state == constants.status.DISABLE) {
    //   if(userInfo.user_id == messageData.user_id) {
    //     messageObj.message = constants.deleteMessage.FOR_ME;
    //   } else {
    //     messageObj.message = constants.deleteMessage.FOR_OTHERS;
    //   }
    // }

    threadMessageInfo.push(messageObj);
  }
  return { threaded_message_info: threadMessageInfo };
}

async function conversationSendMessage(logHandler, payload) {
  if(payload.isDiscourseEvent){
    let userPayload = {
      user_id: payload.user_id,
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      muid: UniversalFunc.getRandomString(),
      is_web: true,
    };
    if (payload.discourseEventType == constants.discourseEventType.TOPIC) {
      switch (payload.discourseEvent) {
        case constants.discourseEvent.TOPIC_CREATED :
          userPayload.message = `*${payload.topic.created_by.username}* just posted a new topic. \n *${payload.topic.title}* - ${payload.discourseURL}/t/${payload.topic.slug}/${payload.topic.id}`
          break;
        case constants.discourseEvent.TOPIC_EDITED :
          userPayload.message = `*${payload.topic.created_by.username}* edited the topic name to *${payload.topic.title}* \n  ${payload.discourseURL}/t/${payload.topic.slug}/${payload.topic.id}`
          break;
        case constants.discourseEvent.TOPIC_DELETED :
          userPayload.message = `*${payload.topic.created_by.username}* deleted the topic *${payload.topic.title}*`
          break;
        default:
          return {}
      }
    } else if (payload.discourseEventType == constants.discourseEventType.POST) {
      if (payload.post.post_number == 1) {
        return {}
      }
      switch (payload.discourseEvent) {
        case constants.discourseEvent.POST_CREATED :
          userPayload.message = `*${payload.post.username}* replied on the topic *${payload.post.topic_title}* \n  ${payload.discourseURL}/t/${payload.post.topic_slug}/${payload.post.topic_id}/${payload.post.post_number}?u=${payload.post.username}`
          break;
        case constants.discourseEvent.POST_EDITED :
          userPayload.message = `*${payload.post.username}* edited their post on the topic *${payload.post.topic_title}* \n  ${payload.discourseURL}/t/${payload.post.topic_slug}/${payload.post.topic_id}/${payload.post.post_number}?u=${payload.post.username}`
          break;
        case constants.discourseEvent.POST_DELETED :
          userPayload.message = `*${payload.post.username}* deleted their post on the topic *${payload.post.topic_title}*`
          break;
        default:
          return {}
      }
    } else if (payload.discourseEventType == constants.discourseEventType.USER) {
      switch (payload.discourseEvent) {
        case constants.discourseEvent.USER_CREATED :
          if(constants.jungleworksDomains.includes(payload.user.email.split("@")[1])) {
            userPayload.message = `_Jungleworks User SignUp_\n*Name:* ${payload.user.name}\n*Username:* ${payload.user.username}\n*E-Mail:* ${payload.user.email}`
          } else {
            userPayload.message = `_New User SignUp_\n*Name:* ${payload.user.name}\n*Username:* ${payload.user.username}\n*E-Mail:* ${payload.user.email}`
          }
          break;
        default:
          return {};
      }
    } else if (payload.discourseEventType == constants.discourseEventType.PING) {
      switch (payload.discourseEvent) {
        case constants.discourseEvent.PING :
          userPayload.message = `*Ding Dong!* I'm actively monitoring all the topics and posts on community.`
          break;
        default:
          return {};
      }
    } else {
      return {};
    }
    return await botController.publishMessage(logHandler, userPayload, payload.channel_id);
  }

  // message is expected in data field
  let messageObject = '';
  const opts = {};
  let check = false;
  if (payload.token && !payload.is_hippo_message) {
    const result = await bot.getWebhooks(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_id: payload.user_id });
    if (_.isEmpty(result) || !result[0].webhook_status || !result[0].app_status) {
      throw new Error('Webhook is disabled.');
    }

    payload.channel_id = result[0].channel_id;
    if (payload.channel_id) {
      try {
        redis.del(constants.promiseHash + payload.channel_id);
      } catch (e) {
        console.error("ERROR WHILE REMOVING DELETE MESSAGE HASH", payload.channel_id, ">>>>>>", e)
      }
    }

    switch (result[0].app_id) {
      case constants.AppIdCheck.JIRA_BOT_APP_ID:
        payload.data = { message: createJiraMessage(payload) };
        messageObject = messageBuilder.getObject(constants.messageType.BUTTON).message;
        check = true;
        break;

      case constants.AppIdCheck.TOOKAN_BOT_APP_ID:
        if (!payload.job_id) {
          return {};
        }
        payload.data = {message: createTookanMessage(payload)};
        messageObject = messageBuilder.getObject(constants.messageType.BUTTON).message;
        check = true;
        // payload.data = { message : payload.task_history[payload.task_history.length - 1].description };
        break;

      case constants.AppIdCheck.BITBUCKET_APP_ID:
        messageObject = messageBuilder.getObject(constants.messageType.BUTTON).message;
        payload.data = { message: createBitBucketMessage(payload) };
        check = true;
        break;

      case constants.AppIdCheck.TRELLO_BOT_APP_ID:
        messageObject = messageBuilder.getObject(constants.messageType.BUTTON).message;
        payload.data = { message: createTrelloMessage(payload) };
        check = true;
        break;
    }
  }
  messageObject ? 0 : messageObject = messageBuilder.getObject(constants.messageType.MESSAGE).message;
  logger.trace(logHandler, 'getMessageObj', messageObject);
  messageObject.channel = payload.channel_id;
  const data = utils.cloneObject(messageObject.data);
  utils.addAllKeyValues(payload.data, data);
  logger.trace(logHandler, 'clone obj', data, payload.data);
  messageObject.data = data;
  messageObject.data.user_id = payload.userInfo.user_id;
  messageObject.data.full_name = payload.userInfo.full_name;
  logger.trace(logHandler, { PREPARED_MESSAGE: messageObject });

  opts.clientId = messageObject.clientId;
  opts.channel = messageObject.channel;
  opts.data = messageObject.data;

  if (check) {
    messageObject = messageBuilder.getObject(constants.messageType.BUTTON).message;
    const actionPayload = {
      title: payload.data.message
    };
    opts.data.custom_actions = [actionPayload]; opts.data.message = payload.msg;
  }
  const messageResponse = await botController.publishMessage(logHandler, opts.data, opts.channel);
  return messageResponse;
}

async function searchMessages(logHandler, payload, res) {
  const { userInfo } = payload;
  const channelToUserName = {};
  let userInChannels = await channelService.getUserAllChannels(logHandler,{ user_id : userInfo.user_id, channel_id : payload.channel_id });

  let userLastMessageMap = {};
  let channelLabelMap = {};
  let channelChatTypeMap = {}
  let channelsToSearchMessage = []
  for(let data of userInChannels) {
    channelsToSearchMessage.push(data.channel_id);
    if(!userLastMessageMap[data.channel_id]) {
      userLastMessageMap[data.channel_id] = data.last_message_id
      channelChatTypeMap[data.channel_id] = data.chat_type
      if(data.custom_label) {
        channelLabelMap[data.channel_id] = data.custom_label;
      }
    }
  }

  var searchMessageData = [] ;
  await esClient.search({
  index: 'users_conversation',
  type: 'message',
  from : payload.page_start - 1 || 0,
  size : 50,
    body: {
      query: {
        "bool": {
          "must": [
            { "terms": { "channel_id": channelsToSearchMessage } },
            { "match_phrase": { "message" : payload.search_text} }//

          ]
        }
      },
      "sort": [
        { "id": { "order": "desc"} }
      ]
    }
  }).then(function (body) {
     searchMessageData = body.hits.hits;
  }, function (error) {
    console.trace(error.message);
  });

  messageData = []
  let users = []
  if (searchMessageData.length) {
    for (let data of searchMessageData) {
      if (data._source.id <= userLastMessageMap[data._source.channel_id]) {
        continue;
      }
      if(messageData.length == constants.getSearchMessagePageSize) {
        break;
      }
      messageData.push(data._source)
      users.push(data._source.user_id)
    }
  }

  let threadMessages = [];
  if (payload.page_start <= 1)
  await esClient.search({
    index: 'thread_user_messages',
    type: 'message',
    from: payload.page_start - 1 || 0,
    size: 50,
    body: {
      query: {
        "bool": {
          "must": [
            { "terms": { "channel_id": channelsToSearchMessage } },
            { "match_phrase": { "message": payload.search_text } }//

          ]
        }
      },
      "sort": [
        { "thread_message_id": { "order": "desc" } }
      ]
    }
  }).then(function (body) {
    threadMessages = body.hits.hits;
  }, function (error) {
    console.trace(error.message);
  });

  let threadMessageData = []
  if (threadMessages.length) {
    for (let data of threadMessages) {
      if (data._source.message_id <= userLastMessageMap[data._source.channel_id]) {
        continue;
      }
      threadMessageData.push(data._source)
      users.push(data._source.user_id)
    }
  }

  if(!searchMessageData.length && !threadMessages.length) {
    return { searchable_messages: [], thread_messages: [], page_size : constants.getSearchMessagePageSize }
  }

  let userNameMap = {};
  if(users.length) {
    let usersInfo = await userService.getUsersWithIds(logHandler, { userIds: users })
    for (let data of usersInfo) {
      if (!userNameMap[data.user_id]) {
        userNameMap[data.user_id] = data.full_name;
      }
    }
  }

  let channelIds = [];
  const searchedMessages = [];

  const getInfoOfOtherUsers = await conversationService.getInfoOfOtherUsers(logHandler, { user_id: userInfo.user_id });
  for (const data of getInfoOfOtherUsers) {
    channelToUserName[data.channel_id] = data.full_name;
  }

  if (messageData.length) {
    for (const data of messageData) {
      if (!channelLabelMap[data.channel_id]) {
        channelIds.push(data.channel_id);
      } else {
        data.label = channelLabelMap[data.channel_id]
      }
      data.chat_type = channelChatTypeMap[data.channel_id];
    }

    const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channelIds, user_id: userInfo.user_id });
    const channelsLabelInfo = lastActiveUsers.channelLabelMap || {};
    const channelsUserInfo = lastActiveUsers.channelUserMap || {};
    for (const messageRow of messageData) {
      //utils.addAllKeyValues(utils.jsonToObject(logHandler, messageRow.message), messageRow);
      messageRow.full_name = userNameMap[messageRow.user_id]
      if (messageRow.user_type == constants.userType.SELF_BOT) {
        messageRow.full_name = userInfo.full_name + " (me)";
      }

      messageRow.searchable_message = messageRow.message;
      if ((messageRow.chat_type != constants.chatType.O20_CHAT) && !messageRow.label) {
        let label = channelsLabelInfo[messageRow.channel_id];
        const channelUserData = channelsUserInfo[messageRow.channel_id] || [];
        if (channelUserData.length && channelUserData[0].user_type == constants.userType.SELF_BOT) {
          label = userInfo.full_name + " (me)";
        } else if (channelUserData.length < constants.unamedGroupMemberLength) {
          label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
        }
        messageRow.label = label;
      }

      if (messageRow.chat_type == constants.chatType.O20_CHAT) {
        messageRow.label = channelToUserName[messageRow.channel_id] || constants.anonymousUserName;
      }

      const count = await conversationService.getMessageIndex(logHandler, { channel_id: messageRow.channel_id,
        message_id: messageRow.id, workspace_id: messageRow.workspace_id });
      messageRow.message_index = count[0].count;
      searchedMessages.push(messageRow);
    }
  }
  const response = {};
  response.searchable_messages = searchedMessages;
  response.thread_messages = [];
  channelIds = [];
  if (payload.page_start <= 1) {
    for (const data of threadMessageData) {
      if (!channelLabelMap[data.channel_id]) {
        channelIds.push(data.channel_id);
      } else {
        data.label = channelLabelMap[data.channel_id]
      }
      data.chat_type = channelChatTypeMap[data.channel_id];
    }
    const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channelIds, user_id: userInfo.user_id });
    const channelsLabelInfo = lastActiveUsers.channelLabelMap || {};
    const channelsUserInfo = lastActiveUsers.channelUserMap || {};
    for (const messageRow of threadMessageData) {
      messageRow.full_name = userNameMap[messageRow.user_id]
      if (messageRow.chat_type != constants.chatType.O20_CHAT && !messageRow.label) {
        let label = channelsLabelInfo[messageRow.channel_id];
        const channelUserData = channelsUserInfo[messageRow.channel_id] || [];

        if (channelUserData.length && channelUserData[0].user_type == constants.userType.SELF_BOT) {
          label = userInfo.full_name + " (me)";
        } else if (channelUserData.length < constants.unamedGroupMemberLength) {
          label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
        }
        messageRow.label = label;
      }
      if (messageRow.chat_type == constants.chatType.O20_CHAT) {
        messageRow.label = channelToUserName[messageRow.channel_id] || constants.anonymousUserName;
      }
      messageRow.searchable_message = messageRow.message;
    }

    response.thread_messages = threadMessageData;
  }

  response.page_size = constants.getSearchMessagePageSize;
  return response;
}

async function starMessage(logHandler, payload, res) {
  try {
    if (!payload.muid && !payload.thread_muid && !payload.unstar_all) {
      throw new Error('Please provide something to update');
    }

    if (payload.unstar_all) {
      await conversationService.updateStatusOrIsStarred(logHandler, { user_id: payload.userInfo.user_id, unstar_all: payload.unstar_all });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.ALL_MESSAGES_UNSTARRED, {}, res);
    }
    let messageInfo;
    const opts = {
      user_id: payload.userInfo.user_id,
      status: constants.status.ENABLE,
      is_starred: payload.is_starred
    };

    if (payload.muid) {
      messageInfo = await conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: payload.channel_id });
      opts.message_id = messageInfo[0].id;
    } else {
      messageInfo = await conversationService.getThreadMessageByThreadMuid(logHandler, { thread_muid: payload.thread_muid });
      opts.thread_message_id = messageInfo[0].thread_message_id;
    }


    if (_.isEmpty(messageInfo) || messageInfo[0].message_state == constants.status.DISABLE) {
      throw new Error('Invalid data');
    }

    const channelInfo = await channelService.getInfo(logHandler, { channel_id: messageInfo[0].channel_id });

    if(channelInfo[0].workspace_id != payload.userInfo.workspace_id) {
      throw new Error("Cannot take action on this message")
    }

    const data = await conversationService.insertOrUpdateStarredMessage(logHandler, opts);
    logger.trace(logHandler, { STAR_MESSAGE_RESPONSE: data });
    if (payload.is_starred) {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_STARRED, {}, res);
    }
    return UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_UNSTARRED, {}, res);
  } catch (error) {
    throw new Error(error);
  }
}

async function getStarredMessages(logHandler, payload, res) {
  try {
    const channelToUserName = {};
    const { userInfo } = payload;
    const pageStart = parseInt(payload.page_start);
    const pageEnd = parseInt(payload.page_end) ? parseInt(payload.page_end) : pageStart + constants.getStarredMessagesPageSize - 1;

    if (payload.start_message_id) {
      let staredMessages = await conversationService.getStarMessages(logHandler, {
 user_id: userInfo.user_id, start_message_id: payload.start_message_id, end_message_id: payload.end_message_id, channel_id: payload.channel_id
});
      staredMessages = staredMessages.map(x => x.muid);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, { starred_muids: staredMessages }, res);
      return { starred_muids: staredMessages };
    }

    const messageData = await conversationService.getStarredMessages(logHandler, { user_id: userInfo.user_id, page_start: pageStart, page_end: pageEnd });

    const getInfoOfOtherUsers = await conversationService.getInfoOfOtherUsers(logHandler, { user_id: userInfo.user_id });

    const response = {};
    const channelIds = [];
    if (!_.isEmpty(messageData)) {
      for (const data of getInfoOfOtherUsers) {
        channelToUserName[data.channel_id] = data.full_name;
      }

      for (const data of messageData) {
        if (!data.label) {
          channelIds.push(data.channel_id);
        }
      }
      const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channelIds, user_id: userInfo.user_id });
      const channelsLabelInfo = lastActiveUsers.channelLabelMap || {};
      const channelsUserInfo = lastActiveUsers.channelUserMap || {};

      for (const messageRow of messageData) {
        utils.addAllKeyValues(utils.jsonToObject(logHandler, messageRow.message), messageRow);
        messageRow.message = messageRow.encrypted_message;

        if (messageRow.chat_type != constants.chatType.O20_CHAT && !messageRow.label) {
          let label = channelsLabelInfo[messageRow.channel_id];
          const channelUserData = channelsUserInfo[messageRow.channel_id] || [];
          if (channelUserData.length && channelUserData[0].user_type == constants.userType.SELF_BOT) {
            label = userInfo.full_name + " (me)";
          } else if (channelUserData.length < constants.unamedGroupMemberLength) {
            label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
          }
          messageRow.label = label;
        }

        if (messageRow.chat_type == constants.chatType.O20_CHAT) {
          messageRow.label = channelToUserName[messageRow.channel_id] || constants.anonymousUserName;
        }
        if (!messageRow.thread_muid) {
          const count = await conversationService.getMessageIndex(logHandler, { message_id: messageRow.id,
            channel_id: messageRow.channel_id, workspace_id: messageRow.workspace_id });
          messageRow.message_index = count[0].count;
        }
      }
      response.starred_messages = messageData;
      response.page_size = constants.getStarredMessagesPageSize;
    } else {
      response.starred_messages = [];
    }
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, response, res);
    return response;
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    UniversalFunc.sendError(error, res);
  }
}
async function inviteToConference(logHandler, payload) {
  try {
    if (payload.invite_user_ids.length > constants.maxUserAllowedInVideoConference) {
      throw new Error('Users limit exceeds.');
    }
    let is_google_meet_conference = payload.is_google_meet_conference || false;

    const video_conference = await bot.getApps(logHandler, { workspace_id: payload.userInfo.workspace_id, app_id: constants.AppIdCheck.VIDEO_CONFERENCE });

    if (!video_conference[0].status && !is_google_meet_conference) {
      throw new Error('Video Conference is Disabled');
    }

    let botData = await bot.getBotInfo(logHandler, { workspace_id: payload.userInfo.workspace_id, user_type: constants.userType.CONFERENCE_BOT });

    if(_.isEmpty(botData)) {
      await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: "Conference Bot", user_type: constants.userType.CONFERENCE_BOT, user_unique_key: video_conference[0].bot_user_id, user_image: video_conference[0].icon, original_image: video_conference[0].icon });
      botData = await bot.getBotInfo(logHandler, { workspace_id: payload.userInfo.workspace_id, user_type: constants.userType.CONFERENCE_BOT });
    }

    if (_.isEmpty(botData) || botData[0].status == constants.status.DISABLE) {
      throw new Error('Fugu Bot not enabled. Please contact admin owner.');
    }

    if (video_conference[0].app_state == constants.appState.EXPIRED) {
      throw new Error('Plan Expired. please contact admin.');
    }

    let usersInWorkspace = await userService.getUsersByIds(logHandler, { user_ids: payload.invite_user_ids, workspace_id: payload.businessInfo.workspace_id });
    if (!usersInWorkspace.length) {
      throw new Error("User Does not exist")
    }

    const userChannelWithFuguBot = await bot.getChannelsWithVideoConferenceBot(logHandler, { user_ids: payload.invite_user_ids, workspace_id: payload.businessInfo.workspace_id });

    const userChannel = {};
    for (const data of userChannelWithFuguBot) {
      userChannel[data.user_id] = data.channel_id;
    }

    const channelIds = [];
    for (const data of payload.invite_user_ids) {
      if (userChannel[data]) {
        channelIds.push(userChannel[data]);
      } else {
        const usersIds = [data, botData[0].user_id];
        const params = {};
        params.chat_type = constants.chatType.FUGU_BOT;
        params.workspace_id = payload.userInfo.workspace_id;
        [params.owner_id] = usersIds;
        const response = await channelService.insertIntoChannels(logHandler, params);
        const channel_id = response.insertId;
        channelIds.push(channel_id);
        for (let i = 0; i < usersIds.length; i++) {
          const updateObj = {};
          updateObj.user_id = usersIds[i];
          updateObj.channel_id = channel_id;
          updateObj.status = constants.userStatus.ENABLE;
          updateObj.role = constants.userRole.USER;
          updateObj.workspace_id = payload.userInfo.workspace_id;
          await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
        }
      }
    }

    const content = {
      user_id: botData[0].user_id,
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 14,
      user_type: 3,
      message_status: 3,
      server_push: 0,
      is_thread_message: false,
      is_video_conference: true,
      sender_user_id: payload.userInfo.user_id,
      is_audio_conference: payload.is_audio_conference,
      caller_text: `${payload.userInfo.full_name} has invited you to join ${payload.is_audio_conference ? 'audio' : 'video'} conference`,
      message: `${payload.is_audio_conference ? 'Audio' : 'Video'} Conference.`,
      invite_link: payload.invite_link
    };
    const actionPayload = {
      confirmation_type: constants.leaveState.VIDEO_CONFERENCE,
      title: `*${payload.userInfo.full_name} has invited you to join ${payload.is_audio_conference ? 'audio' : 'video'} conference.*`,
      buttons: [{
        label: constants.buttonsForLeave.JOIN, action: constants.videoConference, style: constants.buttonStyles.DEFAULT, action_type: constants.buttonActionTypes.ACTION_PUBLISH, invite_link: payload.invite_link, is_audio_conference: payload.is_audio_conference || false
      }],
    };
    if(payload.invite_link.includes('meet.google.com')){
      actionPayload.title = `*${payload.userInfo.full_name} has invited you to join a conference call on Google Meet*`
      content.caller_text =  `${payload.userInfo.full_name} has invited you to join a conference call on Google Meet`
    }

    content.custom_actions = [actionPayload];

     const sameUserPayload = {
      confirmation_type: constants.leaveState.VIDEO_CONFERENCE,
       tagged_users : payload.invite_user_ids,
       title: `*Invitations have been sent for your meeting*`,
      buttons: [{
        label: constants.buttonsForLeave.JOIN, action: constants.videoConference, style: constants.buttonStyles.DEFAULT, action_type: constants.buttonActionTypes.ACTION_PUBLISH, invite_link: payload.invite_link, is_audio_conference: payload.is_audio_conference || false},
        {
          label: constants.buttonsForLeave.END, action: constants.videoConferenceAction.END, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, invite_link: payload.invite_link, is_audio_conference: payload.is_audio_conference || false
        }],
    };

    let message_ids= []
    for (const channel_id of channelIds) {
      if (payload.channel_id == channel_id) {
        continue;
        //content.custom_actions = [sameUserPayload];
      }
      let result = await botController.publishMessage(logHandler, content, channel_id);
      message_ids.push(result.message_id)
    }

    if(payload.channel_id)  {
      if(message_ids.length) {
        sameUserPayload.message_ids = message_ids;
      }
      content.custom_actions = [sameUserPayload];
      botController.publishMessage(logHandler, content, payload.channel_id);
    }
    return {};
  } catch (error) {
    throw new Error(error);
  }
}


function createJiraMessage(payload) {
  const message = payload;
  let titleMessage = '';
  let Message = '';

  if (message.issue.fields.issuetype.name) {
    Message += (message.issue.fields.issuetype.name == 'Sub-task') ? (message.webhookEvent == 'comment_created') ? `${message.comment.author.displayName} commented on a Sub-task`
      : (message.webhookEvent == 'jira:issue_created') ? `${message.user.displayName} created Sub-task` : (message.webhookEvent == 'jira:issue_updated') ? `${message.user.displayName} updated a Sub-task`
        : `${message.comment.author.displayName} updated a comment on a sub-task` : '';

    Message += ((message.issue.fields.issuetype.name) == 'Task') ? (message.webhookEvent == 'comment_created') ? `${message.comment.author.displayName} commented on a Task`
      : (message.webhookEvent == 'jira:issue_created') ? `${message.user.displayName} created a Task` : (message.webhookEvent == 'comment_updated') ? `${message.comment.author.displayName} updated a comment on a task`
        : `${message.user.displayName} updated a Task` : '';

    Message += (message.issue.fields.issuetype.name == 'Bug') ? (message.webhookEvent == 'comment_created') ? `${message.comment.author.displayName} commented on a Bug`
      : (message.webhookEvent == 'jira:issue_created') ? `${message.user.displayName} created a Bug` : (message.webhookEvent == 'jira:issue_updated') ? `${message.user.displayName} updated a bug`
        : `${message.comment.author.displayName} updated a comment on a bug` : '';


    Message += ((message.issue.fields.issuetype.name) == 'Story') ? (message.webhookEvent == 'comment_created') ? `${message.comment.author.displayName} commented on a Story`
      : (message.webhookEvent == 'jira:issue_created') ? `${message.user.displayName} created a Story` : (message.webhookEvent == 'comment_updated') ? `${message.comment.author.displayName} updated a comment on a story`
        : `${message.user.displayName} updated a Story` : '';
  }

  payload.msg = Message;
  const msg = (`${message.issue.fields.project.self}`).split('rest')[0];

  titleMessage += ((message.issue.fields).hasOwnProperty('summary')) ? `${` <a href="${`${msg}browse/${message.issue.key}`}" target="_blank"> ${message.issue.key} </a>` + ': '}${message.issue.fields.summary}` : '';
  if (message.webhookEvent == 'comment_created') {
    titleMessage += `\n comment: ${message.comment.body}`;
  }
  if (message.webhookEvent == 'comment_updated') {
    titleMessage += `\n comment: ${message.comment.body}`;
  }

  if (message.webhookEvent == 'jira:issue_updated') {
    titleMessage += `\n ${message.changelog.items[0].field}: ${message.changelog.items[0].toString}`;
  }

  if (message.webhookEvent == 'jira:issue_created') {
    if (message.issue.fields.assignee) { titleMessage += ((message.issue.fields.assignee).hasOwnProperty('key')) ? `\n Assignee: ${message.issue.fields.assignee.key}` : `\n Assignee: ${message.issue.fields.assignee}`; }
    titleMessage += `\n Priority: ${message.issue.fields.priority.name}\n Status: ${message.issue.fields.status.name}`;
  }

  if (message.issue.fields.description && (!(message.webhookEvent == 'jira:issue_updated'))) { titleMessage += (message.issue.fields).hasOwnProperty('description') ? `\n Description: ${message.issue.fields.description}` : ''; }

  return titleMessage;
}

function createTookanMessage(payload) {
  let titleMessage = '';
  let message = '';

  message = `Job id: ${payload.job_id}`;
  payload.msg = message;

  titleMessage = `\n Job Description: ${payload.job_description}\n `;
  titleMessage += (payload.job_status == 0) ? `${'The task has been assigned to an agent.' + '\n Fleet name:'}${payload.fleet_name}\n Fleet phone no.${payload.fleet_phone}`
    : (payload.job_status == 1) ? `${'The task has been started and the agent is on the way.' + '\n Your tracking link is : '}${payload.tracking_link}`
      : (payload.job_status == 2) ? 'The task has been completed successfully '
        : (payload.job_status == 3) ? ' The task has been completed unsuccessfully'
          : (payload.job_status == 4) ? `${' The task is being performed and the agent has reached the destination. ' + '\n Your tracking link is : '}${payload.tracking_link}`
            : (payload.job_status == 6) ? ' The task has not been assigned to any agent '
              : (payload.job_status == 7) ? `${'The task has been accepted by the agent which is assigned to him. ' + '\n Fleet name:'}${payload.fleet_name}\n Fleet phone no.${payload.fleet_phone}`
                : (payload.job_status == 8) ? 'The task has been declined by the agent which is assigned to him. '
                  : (payload.job_status == 9) ? ' The task has been cancelled by the agent which is accepted by him.'
                    : (payload.job_status == 10) ? 'The task is deleted from the Dashboard. '
                      : '';
  return titleMessage;
}

function createBitBucketMessage(payload) {
  let message = '';
  let titleMessage = '';

  if (payload.pullrequest) {
    message = `[${  payload.repository.full_name  }] ` + ` ${  (payload.repository.full_name).split('/')[0]}`;
    message += (payload.comment) ? `${' commented on a pull request' + ':'}${  payload.pullrequest.title}`
      : (payload.pullrequest.state == 'OPEN') ? `${' opened a pull request in ' + '"'}${  payload.pullrequest.source.branch.name  }"` : (payload.approval) ? '  approved pull request'
        : (payload.pullrequest.state == 'DECLINED')
          ? ' declined pull request' : (payload.pullrequest.state == 'MERGED') ? `${' merged a pull request into ' + '"'}${  payload.pullrequest.source.branch.name  }"` : '';

    const id = `#${  payload.pullrequest.id  } - `;
    titleMessage += (payload.comment) ? ` <a href="${payload.comment.links.html.href}" target="_blank"> ${id} </a>${payload.comment.content.raw}`
      : (payload.pullrequest.state == 'DECLINED' && (!payload.approval)) ? `${` <a href="${payload.pullrequest.links.html.href}" target="_blank"> ${id}</a>` + '"'}${payload.pullrequest.rendered.title.raw}"`
        + `\n reason: ${payload.pullrequest.reason}` : ` <a href="${payload.pullrequest.links.html.href}" target="_blank"> ${id}</a>${payload.pullrequest.rendered.title.raw}`;
  } else if (payload.push) {
    message = `[${  payload.repository.full_name  }]${  (payload.repository.full_name).split('/')[0]  } pushed #${  payload.push.changes[0].commits.length  } commit(s) to  ` + `"${  payload.push.changes[0].new.name  }"`;
    for (let i = 0; i < payload.push.changes[0].commits.length; i++) {
      titleMessage += `${` <a href="${payload.push.changes[0].new.target.links.html.href}" target="_blank"> ${(payload.push.changes[0].commits[i].hash).substring(0, 6)} </a>` + ' - '}${payload.push.changes[0].commits[i].summary.raw}`;
    }
  } else {
    message = '';
    titleMessage = '';
  }
  payload.msg = message;

  return titleMessage;
}

function createTrelloMessage(payload) {
  let message = '';
  let titleMessage = '';

  (payload.action.data.card) ? payload.action.data.card.LinkName = payload.action.data.card.name.replace(/\s+/g, '-').toLowerCase() : payload.action.data.list.LinkName = payload.action.data.list.name.replace(/\s+/g, '-').toLowerCase();


  titleMessage = (payload.action.type == constants.trelloMessage.COMMENT_CARD)
    ? `${`<a href="${`${constants.trelloMessage.TRELLO_URL  }c/${  payload.action.data.card.shortLink  }/${  payload.action.data.card.idShort  }-${  payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + '\n'}${payload.action.data.text}`

    : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ARCHIVED_CARD)
      ? 'card' + ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + '\n' + 'archived'

      : (payload.action.type == constants.trelloMessage.CREATE_LIST)
        ? `${'List ' + '"'}${  payload.action.data.list.name  }"` + ` created in board ` + ` <a href="${payload.model.url}" target="_blank"> ${payload.model.name} </a>`

        : (payload.action.type == constants.trelloMessage.CREATE_CARD)
          ? `${'Card ' + `<a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.display.entities.card.text} </a>` + ' added to ' + '"'}${  payload.action.data.list.name  }"`

          : (payload.action.type == constants.trelloMessage.ADD_CHECKLIST_TO_CARD)
            ? `${'Checklist ' + '"'}${  payload.action.data.checklist.name  }"` + ` added to` + `<a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

            : (payload.action.type == constants.trelloMessage.CREATE_CHECK_ITEM)
              ? `"${payload.action.data.checkItem.name}"` + ' added to ' + `"${payload.action.data.checklist.name}"` + ' in ' + `<a href="${`${constants.trelloMessage.TRELLO_URL  }c/${  payload.action.data.card.shortLink  }/${  payload.action.data.card.idShort  }-${  payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

              : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ARCHIVED_LIST)
                ? 'list ' + ` <a href="${`${payload.model.shortUrl}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${`"${payload.action.data.list.name}"`} </a>` + 'archived'

                : (payload.action.type == constants.trelloMessage.ADD_ATTACHMENT_TO_CARD)
                  ? ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

                  : (payload.action.type == constants.trelloMessage.MOVE_CARD_FROM_BOARD)
                    ? ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

                    : (payload.action.display.translationKey == constants.trelloMessage.ACTION_MOVE_CARD_FROM_LIST_TO_LIST)
                      ? `${` <a href="${`${constants.trelloMessage.TRELLO_URL  }c/${  payload.action.data.card.shortLink  }/${  payload.action.data.card.idShort  }-${  payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + ' moved from list ' + '"'}${payload.action.data.listBefore.name}"` + ' to list ' + `"${payload.action.data.listAfter.name}"`

                      : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ADD_LABEL_TO_CARD)
                        ? ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

                        : (payload.action.type == constants.trelloMessage.ADD_MEMBER_TO_CARD)
                          ? `${payload.action.memberCreator.fullName} added ${payload.action.data.member.name} to ` + ` <a href="${payload.model.url}" target="_blank"> ${`"${  payload.action.data.card.name  }"`} </a>`

                          : (payload.action.display.translationKey == constants.trelloMessage.ACTION_CHANGED_DESCRIPTION_OF_CARD)
                            ? `${'card ' + ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + ' added to ' + '"'}${  payload.action.data.list.name  }"`

                            : (payload.action.display.translationKey == constants.trelloMessage.ACTION_CHANGED_A_DUE_DATE)
                              ? `${' Due date of ' + ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + ' changed from '}${  moment(payload.action.data.old.due).format('MMMM DD')  } to ${  moment(payload.action.data.card.due).format('MMMM DD')}`

                              : (payload.action.type == constants.trelloMessage.REMOVE_CHECKLIST_FROM_CARD)
                                ? ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

                                : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ADDED_A_DUE_DATE)
                                  ? `${' Due date of ' + ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>` + ' added: '}${  moment(payload.action.display.entities.card.due).format('MMMM DD')}`

                                  : (payload.action.type == constants.trelloMessage.UPDATE_CARD)
                                    ? ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`

                                    : ` <a href="${`${constants.trelloMessage.TRELLO_URL}c/${payload.action.data.card.shortLink}/${payload.action.data.card.idShort}-${payload.action.data.card.LinkName}`}" target="_blank"> ${payload.action.data.card.name} </a>`;


  message = (payload.action.type == constants.trelloMessage.COMMENT_CARD) ? `${payload.action.memberCreator.fullName} commented on a card `
    : (payload.action.type == constants.trelloMessage.CREATE_LIST) ? `${payload.action.memberCreator.fullName} created a new list`
      : (payload.action.type == constants.trelloMessage.CREATE_CARD) ? `${payload.action.memberCreator.fullName} added a card `
        : (payload.action.type == constants.trelloMessage.ADD_CHECKLIST_TO_CARD) ? `${payload.action.memberCreator.fullName} added a checklist`
          : (payload.action.type == constants.trelloMessage.CREATE_CHECK_ITEM) ? `${payload.action.memberCreator.fullName} added a checklist item`
            : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ARCHIVED_LIST) ? `${payload.action.memberCreator.fullName} archived a list ` + `"${payload.action.data.list.name}"`
              : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ARCHIVED_CARD) ? `${payload.action.memberCreator.fullName} archived a card ` + `"${payload.action.data.card.name}"`
                : (payload.action.type == constants.trelloMessage.ADD_ATTACHMENT_TO_CARD) ? `${payload.action.memberCreator.fullName} added an attachment to a card`
                  : (payload.action.type == constants.trelloMessage.MOVE_CARD_FROM_BOARD) ? `${payload.action.memberCreator.fullName} moved a card from board`
                    : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ADD_LABEL_TO_CARD) ? `${payload.action.memberCreator.fullName} added label to a card`
                      : (payload.action.type == constants.trelloMessage.ADD_MEMBER_TO_CARD) ? `${payload.action.data.member.name} was added to a card`
                        : (payload.action.display.translationKey == constants.trelloMessage.ACTION_CHANGED_DESCRIPTION_OF_CARD) ? `${payload.action.memberCreator.fullName} changed description of a card `
                          : (payload.action.display.translationKey == constants.trelloMessage.ACTION_MOVE_CARD_FROM_LIST_TO_LIST) ? `${payload.action.memberCreator.fullName} moved a card from one list to another`
                            : (payload.action.display.translationKey == constants.trelloMessage.ACTION_CHANGED_A_DUE_DATE) ? `${payload.action.memberCreator.fullName} changed due date `
                              : (payload.action.type == constants.trelloMessage.REMOVE_CHECKLIST_FROM_CARD) ? `${payload.action.memberCreator.fullName} removed a checklist from a card`
                                : (payload.action.display.translationKey == constants.trelloMessage.ACTION_ADDED_A_DUE_DATE) ? `${payload.action.memberCreator.fullName} added due date to a card`
                                  : (payload.action.type == constants.trelloMessage.UPDATE_CARD) ? `${payload.action.memberCreator.fullName} updated a card`
                                    : `${payload.action.memberCreator.fullName} performed an action on a card`;

  payload.msg = message;

  return titleMessage;
}

async function uploadFile(logHandler, payload) {
  const opts = {};
  opts.file = payload.file;
  opts.response = {};

  if (!opts.file) {
    return;
  }
  try {
    const result = await utilityService.uploadFileV2(logHandler, { file: opts.file, file_name: payload.file_name, message_type: payload.message_type });
    opts.response.url = result.url;
    opts.response.image_url = result.image_url;
    opts.response.thumbnail_url = result.thumbnail_url;
    opts.response.image_url_100x100 = result.blur_image_url;
    opts.response.muid = payload.muid || null;
    result.image_size ? opts.response.image_size = result.image_size : 0;
    return opts.response;
  } catch (error) {
    throw new Error(error);
  }
}


async function verifyTurnCreds(logHandler, payload) {
  let turnRedis = await redis.get("turn");
  if (turnRedis) {
    turnRedis = JSON.parse(turnRedis)
    return turnRedis;
}
  let options = {
    url: `https://networktraversal.googleapis.com/v1alpha/iceconfig?key=` + config.get('networkTraversalKey'),
    method: 'POST',
    headers: {
      'Sec-Fetch-Mode': 'cors',
      'Referer': 'https://appr.tc/r/879380821',
      'Origin': 'https://appr.tc'
    }
  };
  let turnResult = await utilityService.sendHttpRequest(logHandler, options);

  let turnObject = {};
  if (turnResult.error && turnResult.error.code == 429) {
    let originalCreds = await businessService.getTurnCredentials(logHandler);
    originalCreds[0].ice_servers = utils.jsonParse(originalCreds[0].ice_servers);
    turnObject = originalCreds[0];
  } else {
    turnObject.credential = turnResult.iceServers[1].credential;
    turnObject.ice_servers = {
      stun: turnResult.iceServers[0].urls,
      turn: turnResult.iceServers[1].urls
    }
    turnObject.turn_api_key = 'abc';
    turnObject.username = turnResult.iceServers[1].username
  }
  return turnObject;

}


async function insertElasticMessages(logHandler, payload) {
  if(payload.is_thread) {

        //   esClient.indices.delete({
    //     index: "thread_user_messages"
    //   })
    //  frf
    let threadMessageInsert = true;
    let pageStart = 0;
    let pageEnd = 500;

    while (threadMessageInsert) {
      let threadResult = await conversationService.getAllThreadMessagesForElastic(logHandler, { page_start : pageStart, page_end : pageEnd})
      if (!threadResult.length) {
        threadMessageInsert = false;
        return {};
      }
      let threadFullData = []
      for (let data of threadResult) {
        const messageText = cheerio.load(data.searchable_encrypted_message || data.encrypted_message);
        let z = messageText.text();

        threadFullData.push({ "index": { "_index": 'thread_user_messages', "_type": 'message', "_id": data.id } });

        threadFullData.push({
          thread_message_id: data.id,
          thread_muid: data.thread_muid,
          muid: data.muid,
          workspace_id: data.workspace_id,
          message: z,
          channel_id: data.channel_id,
          user_id: data.user_id,
          message_type: data.message_type,
          date_time: data.created_at,
        })
      }
      esClient.bulk({ body: threadFullData }, function (err, resp, status) {
        //console.log(resp);
      });
      await sleep()
      pageStart = pageEnd;
      pageEnd = pageEnd + 10000
    }


  } else {

    let messageInsert = true;
    let messagePageStart = 368639883;
    let messagePageEnd = 368631883;

      //   esClient.indices.delete({
      //     index: "users_conversation"
      //   })
      //  frf
    while (messageInsert) {
      let result = await conversationService.getAllMessagesForElastic(logHandler, { page_start: messagePageStart, page_end: messagePageEnd })
      let fullData = []
      if (messagePageStart >= 385277484) {
        messageInsert = false;
        return {};
      }
      if(result.length) {
        for (let data of result) {
          const messageText = cheerio.load(data.searchable_encrypted_message || data.encrypted_message || "");
          let z = messageText.text();

          fullData.push({ "index": { "_index": 'users_conversation', "_type": 'message', "_id": data.id } });

          fullData.push({
            id: data.id,
            muid: data.muid,
            workspace_id: data.workspace_id,
            message: z,
            channel_id: data.channel_id,
            user_id: data.user_id,
            message_type: data.message_type,
            date_time: data.created_at
          })
        }


        esClient.bulk({ body: fullData }, function (err, resp, status) {
          // console.log(resp);
        });

        await sleep()
      }
      messagePageStart = messagePageEnd;
      messagePageStart = messagePageStart + 1000
    }
  }
}


async function sleep() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}


async function updateStatus(logHandler, payload) {
  const channelInfo = await channelService.getInfo(logHandler, { channel_id: payload.channel_id });
  if(channelInfo.length) {
    if(channelInfo[0].workspace_id != payload.userInfo.workspace_id) {
      throw new Error("Invalid workspace channel")
    }

    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, payload.userInfo.user_id, channelInfo[0].channel_id);

    if(!userExistsInChannel.length) {
      throw new Error("User doesn`t belong to this channel")
    }

    if (payload.conversation_status == constants.conversationStatus.PIN_CHAT && userExistsInChannel[0].is_pinned) {
      throw new Error("Chat already pinned.")
    }

    if (payload.conversation_status == constants.conversationStatus.UNPIN_CHAT && !userExistsInChannel[0].is_pinned) {
      throw new Error("Chat already unpinned.")
    }

    const allPinChannels = await channelService.getAllPinChannels(logHandler, { user_id : payload.userInfo.user_id });

    if (payload.conversation_status == constants.conversationStatus.PIN_CHAT && allPinChannels.length >= constants.maxPinChannels) {
      throw new Error(`You cannot pin more than ${constants.maxPinChannels} chats`);
    }

    await channelService.updatePinChannel(logHandler, { user_id: payload.userInfo.user_id, channel_id: channelInfo[0].channel_id, conversation_status: payload.conversation_status });
    io.sockets.in(utils.getSHAOfObject(payload.userInfo.user_unique_key)).emit(notificationBuilder.controlChannelForConversationUpdate[payload.conversation_status], { channel_id : channelInfo[0].channel_id, user_id : payload.userInfo.user_id });

  } else {
    throw new Error("Invalid Channel")
  }
}

async function updateConferenceCall(logHandler, payload) {
  let callDetails = await conversationService.getCallingDetails(logHandler, { calling_link : payload.calling_link});
  if(callDetails.length) {
    if (payload.user_id_in_call && callDetails[0].user_ids_in_call){
      while(typeof callDetails[0].user_ids_in_call != 'object'){
        callDetails[0].user_ids_in_call = utils.jsonToObject(logHandler, callDetails[0].user_ids_in_call);
      }
      callDetails[0].user_ids_in_call.push(payload.user_id_in_call)
    } else if (payload.user_id_in_call) {
      callDetails[0].user_ids_in_call = [];
      callDetails[0].user_ids_in_call.push(payload.user_id_in_call)
    }

    conversationService.updateCallingDetails(logHandler, { calling_id: callDetails[0].id, user_ids_in_call: callDetails[0].user_ids_in_call ? JSON.stringify(callDetails[0].user_ids_in_call) : null  })
  }
  return {};
}

async function exportData(logHandler, payload) {
  let expectedDate = await conversationService.getExpectedDate(logHandler, {});

  if (!expectedDate.length || !expectedDate[0].user_id) {
    return;
  }
    const userInfo = await conversationService.getTokenFromUserId(logHandler, { user_id : expectedDate[0].user_id});
    if(userInfo[0].status == constants.userStatus.DISABLED) {
      throw new Error('User is Disabled')
    }
        if(userInfo[0].role != constants.userRole.OWNER) {
      throw new Error('Only owner is allowed')
    }
    const businessInfo = await workspaceService.getSpaceDetailsById(logHandler, { workspace_id: userInfo[0].workspace_id });
    payload.userInfo = userInfo[0];
    payload.businessInfo = businessInfo[0];
  try{
    let asyncTasks = [];
    asyncTasks.push(conversationService.getWorkspaceConversation(logHandler, { workspace_id: payload.userInfo.workspace_id, start_date: expectedDate[0].start_date, end_date: expectedDate[0].end_date }));
    asyncTasks.push(conversationService.getWorkspaceMessagesReactions(logHandler, { workspace_id: payload.userInfo.workspace_id }));
    asyncTasks.push(conversationService.getWorkspaceChannels(logHandler, { workspace_id: payload.userInfo.workspace_id }));
    asyncTasks.push(conversationService.getWorkspaceAllUsers(logHandler, { workspace_id: payload.userInfo.workspace_id }))
    asyncTasks.push(conversationService.getWorkspaceThreadMessagesReactions(logHandler, { workspace_id: payload.userInfo.workspace_id }))

    let result = await Promise.all(asyncTasks);
    let businessConversation = result[0];
    let businessMessagesReactions = result[1];
    let businessThreadMessagesReactions = result[4];


    let userReactionMap = {};
    for (let reactionData of businessMessagesReactions) {
      if (!userReactionMap[reactionData.message_id]) {
        userReactionMap[reactionData.message_id] = [];
      }
      let reactionObj = {};
      reactionObj.users = reactionData.users.split(",");
      reactionObj.reaction = reactionData.user_reaction;
      reactionObj.total_count = reactionData.total_count;
      userReactionMap[reactionData.message_id].push(reactionObj);
    }

    let userThreadReactionMap = {};
    let userThreadMessageMap = {};
    for (let reactionData of businessThreadMessagesReactions) {
      if (!userThreadReactionMap[reactionData.thread_message_id]) {
        userThreadReactionMap[reactionData.thread_message_id] = [];
        userThreadMessageMap[reactionData.thread_message_id] = { message: reactionData.thread_message, thread_extra_detais: reactionData.thread_extra_details  || {}};
      }
      if (reactionData.user_reaction) {
        let reactionObj = {};
        reactionObj.users = reactionData.users.split(",");
        reactionObj.reaction = reactionData.user_reaction;
        reactionObj.total_count = reactionData.total_count;
        userThreadReactionMap[reactionData.thread_message_id].push(reactionObj);
      }
    }

    let channelMap = {};
    for (let messageData of businessConversation) {
      if (!channelMap[messageData.channel_id]) {
        channelMap[messageData.channel_id] = {};
      }
      if (!channelMap[messageData.channel_id][messageData.date_time]) {
        channelMap[messageData.channel_id][messageData.date_time] = [];
      }
      messageData.message = messageData.message;
      userReactionMap[messageData.id] ? messageData.reactions = userReactionMap[messageData.id] : 0;
      if (messageData.thread_muid) {
        let responseObj = []
        let user_id = messageData.thread_user_id.split(',');
        let full_name = messageData.thread_user_full_name.split(',');
        let thread_muid = messageData.thread_muid.split(',');
        let thread_message_id = messageData.thread_message_id.split(',');
        for (let i = 0; i < user_id.length; i++) {
          let a = {};
          a.user_id = user_id[i];
          a.full_name = full_name[i];
          a.thread_muid = thread_muid[i];
          userThreadMessageMap[thread_message_id[i]] ? a.message = userThreadMessageMap[thread_message_id[i]] : 0;
          userThreadReactionMap[thread_message_id[i]] ? a.thread_reactions = userThreadReactionMap[thread_message_id[i]] : 0;
          responseObj.push(a);
        }
        messageData.reply_count = messageData.count;
        messageData.replies = responseObj;
      }
      delete messageData.thread_muid;
      delete messageData.thread_user_full_name;
      delete messageData.thread_user_id;
      delete messageData.count;
      channelMap[messageData.channel_id][messageData.date_time].push(messageData);
    }

    let filename = "Zip/" + UniversalFunc.getRandomString();
    fs.mkdirSync(filename, {recursive:true});

    _.each(channelMap, (value, key) => {
      let objectKeys = Object.keys(value);
      let c = value[objectKeys[0]];
      let customLabelFolder = filename + "/" + (c[0].custom_label || "Unnamed-channel") + "-" + key;

      fs.mkdirSync(customLabelFolder, {recursive:true});
      _.each(value, (oValue, oKey) => {
        let a = customLabelFolder + "/" + oKey + ".json"
        fs.writeFileSync(a, JSON.stringify(oValue, null, 4));
      });
    });

    fs.writeFileSync(filename + "/channels.json", JSON.stringify(result[2], null, 4))
    fs.writeFileSync(filename + "/users.json", JSON.stringify(result[3], null, 4))

    let zipFileName = "Zip/" + UniversalFunc.getRandomString() + ".zip";

    await zipDirectory(filename, zipFileName)

    let obj = {
      originalname: zipFileName,
      path: zipFileName
    }
    let result1 = await utilityService.uploadFileV2(logHandler, { file: obj, file_name: payload.businessInfo.workspace_name + ".zip" });
    fse.removeSync(filename)
    fse.removeSync(zipFileName)

    let channelData = await bot.getChannelsWithFuguBotUser(logHandler, { workspace_id : payload.businessInfo.workspace_id, user_ids : expectedDate[0].user_id})
    let content = {
      user_id: channelData[0].bot_id,
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      muid: UniversalFunc.getRandomString(),
      is_web: true,
      message: `Hey, we got back with your request for exporting data. Please find the link here:\n ${result1.url}`
    };
    botController.publishMessage(logHandler, content, channelData[0].channel_id);

    // let opts = {
    //   user_name: payload.userInfo.full_name,
    //   business_name: payload.businessInfo.workspace_name,
    //   message: result1.url,
    //   app_name: payload.businessInfo.app_name,
    //   custom_label: `<div style="font-size: 1.2em;margin-top:-1px;"><b>test</b></div>`
    // };
    // sendEmail(constants.emailType.MESSAGE_MAIL, opts, payload.userInfo.email, `(${payload.businessInfo.workspace_name}) ${payload.userInfo.full_name}`);
    await conversationService.updateExportData(logHandler , { export_id : expectedDate[0].id, status : "DELEIVERED", url : result1.url})
    return (result1);
  } catch (error) {
    await conversationService.updateExportData(logHandler , { export_id : expectedDate[0].id, status : "ERRORED"})
    console.error(error)
  }
}

  async function zipDirectory(filename, saveto) {
    return new Promise((resolve) => {
      zipdir(filename, { saveTo: saveto }, function (err, buffer) {
        if(err) {
          throw new Error("Error while zipping")
        }
        resolve()
      });
    });
  }

async function requestExport(logHandler, payload) {
  if(payload.userInfo.workspace_id != payload.workspace_id) {
    throw new Error("Invalid workspace")
  }

  if (payload.userInfo.role != constants.userRole.ADMIN && payload.userInfo.role != constants.userRole.OWNER) {
    throw new Error("Only workspace admin/owner can export data")
  }

  let result = await conversationService.getUserExportCount(logHandler, { user_id: payload.userInfo.user_id });
  if (result[0].data_count >= constants.maxExportDataCount) {
    throw new Error("Export chat limits exceed. You can only request thrice a week.")
  }
  let insertExportRequest = await conversationService.insertExportDataRequest(logHandler, payload);
  let response = {};
  let expectedDate = await conversationService.getExpectedDate(logHandler, { export_id: insertExportRequest.insertId });
  if (expectedDate.length) {
    if (expectedDate[0].time < 1) {
      response.expected_date = "Today";
    } else if (expectedDate[0].time < 2) {
      response.expected_date = "Tomorrow";
    } else {
      response.expected_date = expectedDate[0].date_time;
    }
  } else {
    response.expected_date = "Today"
  }
  return response;
}

async function getExportData(logHandler, payload) {
  if (payload.userInfo.workspace_id != payload.workspace_id) {
    throw new Error("Invalid workspace")
  }

  if (payload.userInfo.role != constants.userRole.ADMIN && payload.userInfo.role != constants.userRole.OWNER) {
    throw new Error("Only workspace admin/owner can export data")
  }

  let result =  await conversationService.getExportData(logHandler, payload);
  if(result.length) {
    for(let data of result) {
      if(data.status == "PENDING") {
        let expectedDate = await conversationService.getExpectedDate(logHandler, { export_id : data.id});
        if(expectedDate.length) {
          if(expectedDate[0].time < 1) {
            data.expected_date =  "Today";
          } else if (expectedDate[0].time < 2) {
            data.expected_date = "Tomorrow";
          } else {
            data.expected_date = expectedDate[0].date_time;
          }
        } else {
          data.expected_date = "Today"
        }
      }
    }
  }
  return result;
}

async function getBotConfiguration(logHandler, payload) {
  let response = {};
  let botInfo = await bot.getBotInfo(logHandler,{workspace_id: payload.businessInfo.workspace_id, user_type: constants.userType.ATTENDANCE_BOT});
  if(!botInfo.length){
    return response;
  }
  let channelsWithAttendanceBot = await bot.getBotChannelId(logHandler,{attendance_user_id: botInfo[0].user_id, user_id: payload.userInfo.user_id});
  if(!channelsWithAttendanceBot.length){
   return response;
 }
    payload.channel_id = channelsWithAttendanceBot[0].channel_id
  if (payload.channel_id) {
    let otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: payload.channel_id, user_id: payload.userInfo.user_id });

    if (payload.businessInfo.attendance_token && otherUsers[0].user_type == constants.userType.ATTENDANCE_BOT) {
      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS + `?business_token=${payload.businessInfo.attendance_token}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}&user_name=fugu${payload.userInfo.user_id}&user_count=${constants.usersCount.USER}`,
        method: 'GET',
        attendance: true
      };
      let apiResult = await utilityService.sendHttpRequest(logHandler, options);
      try {
        apiResult = JSON.parse(apiResult);
        response.user_attendance_config = JSON.parse(apiResult.data.user_info[0].config);
        response.attendance_role = apiResult.data.user_info[0].role;
        response.attendance_user_name = apiResult.data.user_info[0].user_name;
      } catch (err) {
        console.error("attendace error", err)
      }
    } else if (payload.businessInfo.hrm_api_key && otherUsers[0].user_type == constants.userType.HRM_BOT) {
      const hrm_configuration = JSON.parse(payload.businessInfo.hrm_configuration);
      let options = {
        url: hrm_configuration.base_url + constants.API_END_POINT.GET_PUNCH_PERMISSION,
        method: 'POST',
        json: {
          email: payload.userInfo.emails
        },
        headers: {
          "Content-Type": "application/json",
          "Authorization": hrm_configuration.token
        }
      };
      try {
        let punchResult = await utilityService.sendHttpRequest(logHandler, options);
        if (punchResult.message.data) {
          response.user_attendance_config = punchResult.message.data.user_attendance_config;
        }
      } catch (e) {
        console.log('hrm error', e);
      }
    }
  }
  return response;
}
