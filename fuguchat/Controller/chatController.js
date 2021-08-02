const _ = require('underscore');
const moment = require('moment');
const cheerio = require('cheerio');
const channelService = require('../services/channel');
const userService = require('../services/user');
const utilityService = require('../services/utility');
const conversationService = require('../services/conversation');
const notifierService = require('../services/notifier');
const workspaceService = require('../services/workspace');
const constants = require('../Utils/constants');
const utils = require('../Utils/commonFunctions');
const UniversalFunc = require('../Utils/universalFunctions');
const pushNotificationBuilder = require('../Builder/pushNotification');
const notificationBuilder = require('../Builder/notification');
const { logger } = require('../libs/pino_logger');
const redis = require('../Utils/redis').Redis;
const RESP = require('../Config').responseMessages;
const PromiseManager = require('../Utils/promiseManager').promiseManager;
const promiseManager = new PromiseManager("executingReports");
const botController = require('../Controller/botController');
const botService = require('../services/bot')
const esClient = require('../Utils/elasticServer');



async function userSearch(logHandler, payload) {
  let search_query = {
    workspace_id: payload.userInfo.workspace_id,
    search_text: payload.search_text,
    user_id: payload.userInfo.user_id,
    user_status: payload.user_status,
  };
  payload.accepted_members ? search_query.accepted_members = payload.accepted_members : 0;
  payload.channel_id ? search_query.channel_id = payload.channel_id : 0;
  payload.no_guest_users ? search_query.no_guest_users = payload.no_guest_users : 0;
  payload.include_current_user ? search_query.include_current_user = payload.include_current_user : 0;



  if (payload.userInfo.user_type == constants.userType.GUEST && !payload.tagging) {
    let [guestUsersAndChannels] = await userService.getGuestData(logHandler, { user_id: payload.userInfo.user_id });
    if (!_.isEmpty(guestUsersAndChannels)) {
      if (guestUsersAndChannels.user_ids_to_connect) {
        search_query.user_ids_to_connect = JSON.parse(guestUsersAndChannels.user_ids_to_connect);}
      // } else {
      //   search_query.user_ids_to_connect = 0;
      // }
      if (guestUsersAndChannels.channel_ids_to_connect) {
        search_query.channel_ids_to_connect = JSON.parse(guestUsersAndChannels.channel_ids_to_connect);}
      // } else {
      //   search_query.channel_ids_to_connect = 0;
      // }
    }
  }

  // get users
  let users = []
  if (payload.channel_id) {
    users = await userService.searchUserInChannel(logHandler, search_query);
  } else if (payload.user_type == constants.getMembers.SEARCH_GUESTS) {
    users = await userService.searchGuestUsers(logHandler, search_query);
  } else {
    users = await userService.searchUser(logHandler, search_query)
  }

  //remove duplicate element
  users=users.reverse();
  users = users.reduce((acc, current) => {
    const x = acc.find(item => item.user_id === current.user_id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  //let userIds = [];
  // let guestToConnect = [];
  // if (payload.userInfo.user_type != constants.userType.GUEST) {
  //   guestToConnect = await userService.getGuestUsersToConnectWith(logHandler, { fugu_user_id: payload.userInfo.user_id, workspace_id: payload.businessInfo.workspace_id });
  //   if (guestToConnect.length) {
  //     guestToConnect = guestToConnect.map(x => x["user_id"]);
  //   }
  // }

  // for (let i = 0; i < users.length; i++) {
  //   if (users[i].user_type == constants.userType.GUEST && !guestToConnect.includes(users[i].user_id)) {
  //     users.splice(i, 1);
  //   } else {
  //     userIds.push(users[i].user_id);
  //   }
  // }
  return { users: users };
}

async function groupChatSearch(logHandler, payload) {
  const { userInfo } = payload;

  const search_query = {
    workspace_id: payload.userInfo.workspace_id,
    search_text: payload.search_text,
    user_id: payload.userInfo.user_id,
    search_deactivated_member: payload.search_deactivated_member || false
  };

  if (payload.userInfo.user_type == constants.userType.GUEST) {
    const [guestUsersAndChannels] = await userService.getGuestData(logHandler, { user_id: payload.userInfo.user_id });
    if (!_.isEmpty(guestUsersAndChannels)) {
      if (guestUsersAndChannels.user_ids_to_connect) {
        search_query.user_ids_to_connect = JSON.parse(guestUsersAndChannels.user_ids_to_connect);
      } else {
        search_query.user_ids_to_connect = 0;
      }
      if (guestUsersAndChannels.channel_ids_to_connect) {
        search_query.channel_ids_to_connect = JSON.parse(guestUsersAndChannels.channel_ids_to_connect);
      } else {
        search_query.channel_ids_to_connect = 0;
      }
    }
  }

  search_query.include_all_users = payload.include_all_users ? payload.include_all_users = JSON.parse(payload.include_all_users) : '';

  const bot = await userService.searchBot(logHandler, search_query);
  for (const item of bot) {
    item.status = +constants.getFuguUserStatus[item.status];
  }

  let [getDomainCredentials] = await workspaceService.getDomainCredentials(logHandler, { domain_id : payload.businessInfo.domain_id});

  getDomainCredentials.properties = JSON.parse(getDomainCredentials.properties)

  if(getDomainCredentials.properties.is_self_chat_enabled) {
    let botInfo = await botService.getBotInfo(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_type: constants.userType.SELF_BOT });
    if(botInfo.length) {
      let searchText = payload.search_text.toLowerCase();
      if (searchText == "me" || searchText == "(me" || searchText == "me)" || searchText == "(me)") {
        searchText = payload.userInfo.full_name
      }
      let searchself = await userService.searchSelf(logHandler, {
        workspace_id: payload.userInfo.workspace_id,
        search_text: searchText,
        user_id: payload.userInfo.user_id
      });
      if(searchself.length) {
        bot.push({ fugu_user_id: botInfo[0].user_id, full_name: userInfo.full_name + " (me)", status: 1, user_id: botInfo[0].user_id,
          user_image: payload.userInfo.user_image, user_thumbnail_image: payload.userInfo.user_image, user_type: constants.userType.SELF_BOT });
      }
    }
  }
  // get users
  let users = [];
  const userIds = [];
  let guestToConnect = [];


  if(!payload.searchOnlyGroupsAndBots){
   users = await userService.searchByName(logHandler, search_query);
   let disabledUsers = [], enabledUsers = [];
   for(let i = 0; i < users.length; i++){
      if(users[i].status == constants.userStatus.DISABLED){
        disabledUsers.push(users[i]);
      }else{
        enabledUsers.push(users[i]);
      }
   }
   users = enabledUsers.concat(disabledUsers);

  if (payload.userInfo.user_type != constants.userType.GUEST) {
    guestToConnect = await userService.getGuestUsersToConnectInWorkspace(logHandler, { user_id: payload.userInfo.user_id, workspace_id: payload.businessInfo.workspace_id });

    if (guestToConnect.length) {
      guestToConnect = guestToConnect.map(x => x["user_id"]);
    }
  }

   for (i = users.length - 1; i >= 0; i--) {
      if (payload.userInfo.user_type != constants.userType.GUEST && users[i].user_type == constants.userType.GUEST && !guestToConnect.includes(users[i].user_id)) {
      users.splice(i, 1);
    } else {
        if(users[i].status == "ENABLED") {
          userIds.push(users[i].user_id);
        }
      }
  }
}

  // get channels
  const channelIdsSet = new Set();
  let channels = await channelService.getUsersParticipatedChannels(logHandler, { userIds, user_id: userInfo.user_id });


  _.each(channels, (channel) => {
    channelIdsSet.add(channel.channel_id);
  });

  channels = await channelService.groupSearchByName(logHandler, search_query);

  const defaultChannel = [];
  if (channels.length) {
    _.each(channels, (channel) => {
      channelIdsSet.add(channel.channel_id);
      defaultChannel.push(channel.channel_id);
    });
  }
  let channelIds = Array.from(channelIdsSet);
  let defaultGroup = '';
  if (defaultChannel.length) {
    defaultGroup = await channelService.getDefaultChannelIds(logHandler, { channels: defaultChannel });
  }

  const channelInfo = await channelService.getGroupChannelsWithMemberNames(
    logHandler,
    {
      workspace_id: payload.userInfo.workspace_id,
      channel_ids: channelIds,
      status: !!(defaultGroup.length),
      channel_ids_to_connect: search_query.channel_ids_to_connect
    }
  );

  // using for unamed groups or donot have image
  channelIds = [];
  for (const channel of channelInfo) {
    if (_.isEmpty(utils.jsonToObject(logHandler, channel.channel_image)) || !channel.label) {
      channelIds.push(channel.channel_id);
    }
  }


  let openGroup = [];
  if (payload.userInfo.user_type != constants.userType.GUEST) {
    openGroup = await channelService.getOpenGroups(logHandler, {
      workspace_id: payload.userInfo.workspace_id, search_query: payload.search_text, user_id: userInfo.user_id, channel_ids_to_connect: search_query.channel_ids_to_connect
    });
    for (const group of openGroup) {
      if (_.isEmpty(utils.jsonToObject(logHandler, group.channel_image)) || !group.label) {
        channelIds.push(group.channel_id);
      }
    }
  }

  const unamedChannelsInfo = await channelService.getChannelsUsersInfo(logHandler,
    { channel_ids: channelIds, user_id: userInfo.user_id, channel_ids_to_connect: search_query.channel_ids_to_connect });
  const channelsUserInfo = unamedChannelsInfo.channelUserMap || {};
  const channelLabelMap = unamedChannelsInfo.channelLabelMap || {};

  for (const channel of channelInfo) {
    const channelImage = utils.jsonToObject(logHandler, channel.channel_image);
    if (!channel.label || _.isEmpty(channelImage)) {
      channel.members_info = channelsUserInfo[channel.channel_id] || [];
      let label = channelLabelMap[channel.channel_id];
      if (channel.members_info.length < constants.unamedGroupMemberLength) {
        label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
        channel.members_info.push({
          full_name: userInfo.full_name.split(' ')[0],
          user_id: userInfo.user_id,
          user_image: userInfo.user_image || ''
        });
      }

      if (!channel.label) {
        channel.label = label;
      }
    }
    channel.channel_image = channelImage.channel_thumbnail_url
      || constants.groupChatImageURL.channel_thumbnail_url;
    channel.channel_thumbnail_url = channelImage.channel_thumbnail_url
      || constants.groupChatImageURL.channel_thumbnail_url;
  }

  for (const group of openGroup) {
    const channelImage = utils.jsonToObject(logHandler, group.channel_image);
    if (!group.label || _.isEmpty(channelImage)) {
      group.members_info = channelsUserInfo[group.channel_id] || [];
      const label = channelLabelMap[group.channel_id];
      if (!group.label) {
        group.label = label;
      }
    }
    group.channel_image = channelImage.channel_thumbnail_url
      || constants.groupChatImageURL.channel_thumbnail_url;
    group.channel_thumbnail_url = channelImage.channel_thumbnail_url
      || constants.groupChatImageURL.channel_thumbnail_url;
  }

  return {
    bot,
    users,
    channels: channelInfo,
    general_groups: [],
    open_groups: openGroup
  };
}

async function createGroupChat(logHandler, payload) {
  try {
    let workspaceConfig = await workspaceService.getWorkspaceConfiguration(logHandler, payload.businessInfo.workspace_id )
    if(workspaceConfig.enable_create_group) {
    workspaceConfig.enable_create_group = JSON.stringify(workspaceConfig.enable_create_group)
    if(!(workspaceConfig.enable_create_group.includes(payload.userInfo.role))){
      throw new Error("You are not allowed to create group in this workspace.");
    }
  }

    if (payload.chat_type == constants.chatType.RESTRICTED_GROUP) {
      throw new Error("Cannot create group");
    }

    if (payload.userInfo.user_properties) {
       payload.userInfo.user_properties = JSON.parse(payload.userInfo.user_properties);

      if (payload.userInfo.user_properties.hasOwnProperty('is_create_group_allowed') && !payload.userInfo.user_properties.is_create_group_allowed) {
        throw new Error('You cannot create group.')
      }

      payload.user_ids_to_add = utils.isString(payload.user_ids_to_add) ? utils.jsonParse(payload.user_ids_to_add) : payload.user_ids_to_add;
      if (payload.userInfo.user_properties.hasOwnProperty('max_group_member') && payload.user_ids_to_add.length + 1 > payload.userInfo.user_properties.max_group_member) {
        throw new Error(`You cannot create group with more than ${payload.userInfo.user_properties.max_group_member} members`);
      }
    }


    payload.user_ids_to_add = utils.isString(payload.user_ids_to_add) ? utils.jsonParse(payload.user_ids_to_add) : payload.user_ids_to_add;

    if (payload.userInfo.user_type == constants.userType.GUEST) {
      throw new Error('Guest user can`t create group.');
    }

    if (parseInt(workspaceConfig.max_member_in_group)) {
      if (payload.user_ids_to_add.length + 1 > workspaceConfig.max_member_in_group) {
        throw new Error(`Cannot create group with more than ${workspaceConfig.max_member_in_group} users.`)
      }
    }

    const { userInfo } = payload;
    const { businessInfo } = payload;
    let customLabel;
    let activeUsers = await userService.getActiveUsersOfBusiness(
      logHandler,
      { workspace_id: userInfo.workspace_id, userIds: payload.user_ids_to_add }
    );

    if (payload.user_ids_to_add.length != activeUsers.length) {
      throw new Error('Invalid Users in list.');
    }

    activeUsers.push(userInfo);
    activeUsers = Array.from(new Set(activeUsers));

    const imageUrl = {};
    const channelImage = {};
    if (!_.isEmpty(payload.channel_image)) {
      const image_url = await utilityService.uploadFile(logHandler, { file: payload.channel_image });
      if (image_url) {
        channelImage.channel_image_url = image_url.url;
        channelImage.channel_thumbnail_url = image_url.thumbnail_url;
        imageUrl.channel_image = utils.objectToJson(logHandler, channelImage);
      }
    }

    // create channel and add users
    let params = {};
    params.chat_type = payload.chat_type || constants.chatType.PRIVATE_GROUP;
    params.workspace_id = userInfo.workspace_id;
    params.owner_id = userInfo.user_id;
    params.custom_label = payload.custom_label;
    params.channel_image = !_.isEmpty(imageUrl.channel_image) ? imageUrl.channel_image : null;
    const response = await channelService.insertIntoChannels(logHandler, params);
    const channel_id = response.insertId;

    for (let i = 0; i < activeUsers.length; i++) {
      const updateObj = {};
      updateObj.user_id = activeUsers[i].user_id;
      updateObj.channel_id = channel_id;
      updateObj.last_read_message_id = '0';
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.last_activity = moment().add(2 * i, 'seconds')._d;

      payload.admin_user_ids ? 0 : payload.admin_user_ids = [];
      if ((activeUsers[i].user_id == userInfo.user_id && !payload.no_admin_group) || payload.admin_user_ids.includes(activeUsers[i].user_id)) {
        updateObj.role = constants.userRole.ADMIN;
      } else {
        updateObj.role = constants.userRole.USER;
      }
      await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    }

    let channelInfo = await channelService.getInfo(logHandler, { channel_id });
    channelInfo = channelInfo[0];

    utils.addAllKeyValues(utils.jsonToObject(logHandler, channelInfo.channel_image), channelInfo);

    const muid = UniversalFunc.getRandomString();
    const message = `${userInfo.full_name} created a new group`;
    params = {};
    params.workspace_id = userInfo.workspace_id;
    params.user_id = userInfo.user_id;
    params.channel_id = channelInfo.channel_id;
    params.data = { message };
    params.user_type = userInfo.user_type;
    params.full_name = userInfo.full_name;
    params.muid = muid;
    params.message_type = constants.messageType.PUBLIC_NOTE;
    params.status = constants.userConversationStatus.MESSAGE;
    const result = await conversationService.insertUsersConversation(logHandler, params);

    const label = [];
    const members_info = [];
    if (!payload.channel_image || !payload.custom_label) {
      activeUsers = activeUsers.reverse();
      for (const user of activeUsers) {
        if (user.user_id != userInfo.user_id && members_info.length < constants.unamedGroupMemberLength) {
          label.push(user.full_name.split(' ')[0]);
          members_info.push({
            full_name: user.full_name.split(' ')[0],
            user_image: user.user_image || '',
            user_id: user.user_id
          });
        }

        if (members_info.length == constants.unamedGroupMemberLength) {
          break;
        }
      }
      if (members_info.length < constants.unamedGroupMemberLength) {
        label.push(userInfo.full_name.split(' ')[0]);
        members_info.push({
          full_name: userInfo.full_name.split(' ')[0],
          user_image: userInfo.user_image,
          user_id: userInfo.user_id
        });
      }
      channelInfo.label = channelInfo.custom_label || label.join(', ');
      if (!channelInfo.custom_label) {
        channelInfo.label = label.join(', ');
        channelInfo.custom_label = label.join(', ');
        customLabel = label.join(', ');
      }
    }
    channelInfo.channel_thumbnail_url = channelInfo.channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
    const options = {
      channelInfo,
      businessInfo,
      message: `${userInfo.full_name + constants.pushMessage.NEW_GROUP} ${channelInfo.custom_label || customLabel}`,
      userInfo,
      userIds: payload.user_ids_to_add,
      notificationType: pushNotificationBuilder.notificationType.ADD_MEMBER,
      messageId: result.insertId,
      muid,
      messageType: constants.messageType.PUBLIC_NOTE,
      pushMessage: `${userInfo.full_name + constants.pushMessage.NEW_GROUP} ${channelInfo.custom_label || customLabel}`,
      label: channelInfo.custom_label || label.join(', '),
      custom_label: customLabel,
      members_info,
      update_notification_count: constants.saveNotificationFor.CREATE_GROUP,
      usersUnreadNotificationCount: {}
    };


    notifierService.notifyUsers(logHandler, options);
    return {
      channel_id: channelInfo.channel_id,
      created_by_user_id : userInfo.user_id,
      label: channelInfo.custom_label || label.join(', '),
      custom_label: channelInfo.custom_label || label.join(', '),
      channel_image: utils.jsonParse(channelInfo.channel_image) ? utils.jsonParse(channelInfo.channel_image).channel_thumbnail_url : constants.groupChatImageURL.channel_image_url,
      channel_thumbnail_url: utils.jsonParse(channelInfo.channel_image) ? utils.jsonParse(channelInfo.channel_image).channel_thumbnail_url : constants.groupChatImageURL.channel_thumbnail_url,
      muid,
      message,
      members_info,
      message_type: constants.messageType.PUBLIC_NOTE,
      date_time: new Date()
    };
  } catch (error) {
    throw new Error(error);
  }
}

async function createO2OChat(logHandler, payload) {
  try {
    let workspaceConfig = await workspaceService.getWorkspaceConfiguration(logHandler, payload.businessInfo.workspace_id);
    if (workspaceConfig.enable_one_to_one_chat) {
      workspaceConfig.enable_one_to_one_chat = JSON.stringify(workspaceConfig.enable_one_to_one_chat)
      if (!(workspaceConfig.enable_one_to_one_chat.includes(payload.userInfo.role))) {
        throw new Error("You are not allowed to create One to One chat in this workspace.")
      }
    }

    const { businessInfo } = payload;

    const { userInfo } = payload;


    if (userInfo.user_properties) {
       userInfo.user_properties = JSON.parse(userInfo.user_properties);

      if (userInfo.user_properties.hasOwnProperty('is_one_to_one_chat_allowed') && !userInfo.user_properties.is_one_to_one_chat_allowed) {
        throw new Error('You cannot create one to one chat.')
      }
    }


    const usersIds = [userInfo.user_id, payload.chat_with_user_id];

    const otherUserInfo = await userService.getUserDetail(logHandler, { user_id: payload.chat_with_user_id });

    if (!otherUserInfo.length || userInfo.workspace_id != otherUserInfo[0].workspace_id) {
      throw new Error("user not found in workspace")
    }

    const guest = {};
    if (payload.userInfo.user_type == constants.userType.GUEST) {
      guest.user_id = payload.userInfo.user_id;
      guest.channel_with_user_id = payload.chat_with_user_id;
    } else if (otherUserInfo[0].user_type == constants.userType.GUEST) {
      guest.user_id = payload.chat_with_user_id;
      guest.channel_with_user_id = payload.userInfo.user_id;
    }

    let chatType;
    let channelType;
    if (otherUserInfo[0].user_type == constants.userType.FUGU_BOT || otherUserInfo[0].user_type == constants.userType.ATTENDANCE_BOT || otherUserInfo[0].user_type == constants.userType.FUGU_SUPPORT || otherUserInfo[0].user_type == constants.userType.SCRUM_BOT || otherUserInfo[0].user_type == constants.userType.CONFERENCE_BOT || otherUserInfo[0].user_type == constants.userType.SELF_BOT || otherUserInfo[0].user_type == constants.userType.HRM_BOT) {
      chatType = constants.chatType.FUGU_BOT;
      channelType = constants.channelType.FUGU_BOT;
    } else {
      chatType = constants.chatType.O20_CHAT;
      channelType = constants.channelType.DEFAULT;
    }

    // const activeUsers = await userService.getActiveUsersOfBusiness(logHandler, {
    //   workspace_id: businessInfo.workspace_id, userIds: usersIds, chatType, user_type: otherUserInfo[0].user_type
    // });
    // if (activeUsers.length != 2) {
    //   throw new Error('Invalid user ids ');
    // }

    let existingChannel = await channelService.getChannelsHavingUsers(logHandler, { chat_type: chatType, userIds: usersIds });
    if (existingChannel.length > 0) {
      existingChannel = existingChannel[0];

      return {
        channel_id: existingChannel.channel_id,
        other_user_status: otherUserInfo[0].status,
        label: otherUserInfo[0].user_type == constants.userType.SELF_BOT ? userInfo.full_name + " (me)" :existingChannel.custom_label,
        channel_image: otherUserInfo[0].user_type == constants.userType.SELF_BOT ? userInfo.user_image: existingChannel.channel_image
      };
    }


    if (guest.user_id && !(otherUserInfo[0].user_type == constants.userType.FUGU_BOT || otherUserInfo[0].user_type == constants.userType.ATTENDANCE_BOT || otherUserInfo[0].user_type == constants.userType.FUGU_SUPPORT || otherUserInfo[0].user_type == constants.userType.SCRUM_BOT)) {
      const guestChannels = await userService.getGuestData(logHandler, { user_id: guest.user_id });
      if (guestChannels.length) {
        if (guestChannels[0].user_ids_to_connect) {
          guestChannels[0].user_ids_to_connect = JSON.parse(guestChannels[0].user_ids_to_connect);
          if (!guestChannels[0].user_ids_to_connect.includes(guest.channel_with_user_id)) {
            throw new Error('You are not allowed to create chat.');
          }
        }
      }
    }

    // create channel and add users
    const params = {};
    params.chat_type = chatType;
    params.channel_type = channelType;
    params.workspace_id = businessInfo.workspace_id;
    params.owner_id = userInfo.user_id;
    const response = await channelService.insertIntoChannels(logHandler, params);
    const channel_id = response.insertId;
    for (let i = 0; i < usersIds.length; i++) {
      const updateObj = {};
      updateObj.user_id = usersIds[i];
      updateObj.channel_id = channel_id;
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.role = constants.userRole.USER;

      await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    }


    let channel = await channelService.getInfo(logHandler, { channel_id });
    [channel] = channel;

    if (otherUserInfo[0].user_type == constants.userType.CONFERENCE_BOT || otherUserInfo[0].user_type == constants.userType.SELF_BOT) {
      const content = {
        user_id: payload.chat_with_user_id,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true
      };

      if (otherUserInfo[0].user_type == constants.userType.CONFERENCE_BOT) {
        content.message = constants.defaltConferenceMessage
      } else {
        content.message = constants.selfBotDefaultMessage
      }

      botController.publishMessage(logHandler, content, channel.channel_id);
    }
    return {
      channel_id: channel.channel_id,
      label: otherUserInfo[0].user_type == constants.userType.SELF_BOT ? userInfo.full_name + " (me)" : existingChannel.custom_label,
      channel_image: otherUserInfo[0].user_type == constants.userType.SELF_BOT ? userInfo.user_image : existingChannel.channel_image
    };
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function addChatMember(logHandler, payload, res) {
  try {
    payload.user_ids_to_add = utils.isString(payload.user_ids_to_add) ? utils.jsonParse(payload.user_ids_to_add) : payload.user_ids_to_add;
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;

    const userChannelInfo = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
    if ((!userChannelInfo.length && !payload.api_key) || (payload.userInfo.user_type == constants.userType.GUEST && userChannelInfo[0].role != constants.userRole.ADMIN)) {
      throw new Error('You are not authorized.');
    }

    let result = {};
    let customLabel;

    const channelParticipatedUsers = [];
    // TODO check if already in group

    if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      throw new Error("Can't add member in default chat");
    }

    if (channelInfo.chat_type == constants.chatType.O20_CHAT) {
      throw new Error("Can't add member in one to one chat");
    }
    if (channelInfo.label_id > 0) {
      throw new Error("Can't add member in default channel");
    }
    const participationDetails = await channelService.getUserToChannelDetails(
      logHandler,
      { channel_id: channelInfo.channel_id, status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED] }
    );


    let workspaceConfig = await workspaceService.getWorkspaceConfiguration(logHandler, payload.businessInfo.workspace_id)

    if (channelInfo.chat_type == constants.chatType.RESTRICTED_GROUP) {
      throw new Error("Cannot add member in this group.");
    }

    if (parseInt(workspaceConfig.max_member_in_group)) {
      if (payload.user_ids_to_add.concat(participationDetails).length > workspaceConfig.max_member_in_group) {
        throw new Error(`Cannot add member more than ${workspaceConfig.max_member_in_group} users.`)
      }
    }


    if (userInfo.user_properties) {
      userInfo.user_properties = JSON.parse(userInfo.user_properties);

      if (userInfo.user_properties.hasOwnProperty('max_group_member') && payload.user_ids_to_add.concat(participationDetails).length > userInfo.user_properties.max_group_member) {
        throw new Error(`You cannot add member more than ${userInfo.user_properties.max_group_member} users.`)
      }
    }

    for (const users of participationDetails) {
      channelParticipatedUsers.push(users.user_id);
    }

    if (!channelParticipatedUsers.includes(userInfo.user_id) && !payload.api_key) {
      throw new Error('Only group member can perform this action');
    }

    // for (const id of payload.user_ids_to_add) {
    //   if (channelParticipatedUsers.includes(id)) {
    //     payload.user_ids_to_connect = payload.user
    //     throw new Error('User is already in Group');
    //   }
    // }

    for (const index in payload.user_ids_to_add){
      if(channelParticipatedUsers.includes( payload.user_ids_to_add[index])){
        payload.user_ids_to_add.splice(index, 1);
       }
    }

    if(payload.user_ids_to_add.length == 0){
      throw new Error('User is already in Group');
    }

    const activeUsers = await userService.getActiveUsersOfBusiness(
      logHandler,
      { workspace_id: businessInfo.workspace_id, userIds: payload.user_ids_to_add }
    );
    if (payload.user_ids_to_add.length != activeUsers.length) {
      throw new Error('Invalid data in user_ids_to_add');
    }

    redis.del(`channelInfo` + channelInfo.channel_id);

    let membersInfo = [];
    const channelImage = utils.jsonParse(channelInfo.channel_image);
    if (_.isEmpty(channelImage) || !channelInfo.custom_label) {
      const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: userInfo.user_id });
      const channelUserInfo = lastActiveUsers.channelUserMap || {};
      const channelLabelInfo = lastActiveUsers.channelLabelMap || {};
      let label = channelLabelInfo[channelInfo.channel_id];
      membersInfo = channelUserInfo[channelInfo.channel_id] || [];
      if (membersInfo.length < constants.unamedGroupMemberLength) {
        label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
        membersInfo.push({
          full_name: userInfo.full_name.split(' ')[0],
          user_id: userInfo.user_id,
          user_image: userInfo.user_image
        });
      }
      channelInfo.label = channelInfo.custom_label || label;
      if (!channelInfo.custom_label) {
        channelInfo.custom_label = label;
        customLabel = label;
      }
    }
    channelInfo.channel_image_url = channelImage ? channelImage.channel_image_url : constants.groupChatImageURL.channel_image_url;
    channelInfo.channel_thumbnail_url = channelImage ? channelImage.channel_thumbnail_url : constants.groupChatImageURL.channel_thumbnail_url;
    const messagesDetail = [];
    if (userInfo.image_set) {
      userInfo.image_set = JSON.parse(userInfo.image_set);
      userInfo.user_image = userInfo.image_set.image_100x100;
    }

    const options = {
      channelInfo,
      members_info: membersInfo,
      businessInfo,
      userInfo,
      custom_label: customLabel,
      user_thumbnail_image: userInfo.user_image,
      notificationType: pushNotificationBuilder.notificationType.ADD_MEMBER,
      messageType: constants.messageType.PUBLIC_NOTE,
      pushMessage: `${userInfo.full_name + constants.pushMessage.NEW_GROUP} ${channelInfo.custom_label || customLabel}`,
      update_notification_count: constants.saveNotificationFor.ADD_MEMBER,
      usersUnreadNotificationCount: {}
    };

    const silentPushPayload = utils.cloneObject(options);
    silentPushPayload.isSilent = true;
    silentPushPayload.userIds = channelParticipatedUsers;


    let messageInfo = await conversationService.getMessage(logHandler, { workspace_id: businessInfo.workspace_id, channel_id: channelInfo.channel_id });


    let userAlreadyInGroup = await channelService.getClearChatHistory(logHandler, { channel_id: channelInfo.channel_id, user_id: payload.user_ids_to_add });
    let userChannelLastMessageMap = {};
    if (userAlreadyInGroup.length) {
      for (let data of userAlreadyInGroup) {
        if (!userChannelLastMessageMap[data.user_id]) {
          userChannelLastMessageMap[data.user_id] = data.last_read_message_id;
        }
      }
    }

    for (let i = 0; i < activeUsers.length; i++) {
      const muid = UniversalFunc.getRandomString();

      if (activeUsers[i].user_type == constants.userType.GUEST) {
         userService.updateGuestChannels(logHandler, { user_id: activeUsers[i].user_id, channel_id: channelInfo.channel_id });
      }

      if ((userChannelLastMessageMap[activeUsers[i].user_id] && messageInfo.length && userChannelLastMessageMap[activeUsers[i].user_id] < messageInfo[0].id) || (!userChannelLastMessageMap[activeUsers[i].user_id] && messageInfo.length)) {
        channelService.updateMessageSeen(logHandler, { user_id: activeUsers[i].user_id, channel_id: channelInfo.channel_id, message_id: messageInfo[0].id, channel_status: constants.userMessageSeenChannelStatus.JOIN });
      }

      const updateObj = {};

      const message = `${userInfo.full_name} added ${activeUsers[i].full_name} to the conversation`;
      const params = {};
      params.workspace_id = businessInfo.workspace_id;
      params.user_id = userInfo.user_id;
      params.channel_id = channelInfo.channel_id;
      params.data = { message };
      params.label_id = channelInfo.label_id;
      params.user_type = userInfo.user_type;
      params.full_name = userInfo.full_name;
      params.muid = muid;
      params.message_type = userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.GUEST ? constants.messageType.PUBLIC_NOTE : constants.messageType.NOTE;
      params.status = constants.userConversationStatus.MESSAGE;
      result = await conversationService.insertUsersConversation(logHandler, params);

      updateObj.user_id = activeUsers[i].user_id;
      updateObj.channel_id = channelInfo.channel_id;
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.role = constants.userRole.USER;
      updateObj.last_read_message_id = result.insertId;
      await userService.insertOrUpdateUserInChannel(logHandler, updateObj);

      messagesDetail.push({
        muid,
        message,
        date_time: new Date(),
        message_type: constants.messageType.PUBLIC_NOTE
      });
      options.message_id = result.insertId;
      options.muid = muid;
      options.userIds = [activeUsers[i].user_id];
      options.message = message;
      options.added_member_info = {
        user_id: activeUsers[i].user_id,
        user_unique_key: activeUsers[i].user_unique_key,
        full_name: activeUsers[i].full_name || '',
        user_image: activeUsers[i].user_image || ''
      };

      silentPushPayload.message_id = result.insertId;
      silentPushPayload.muid = muid;
      silentPushPayload.message = message;
      silentPushPayload.added_member_info = {
        user_id: activeUsers[i].user_id,
        user_unique_key: activeUsers[i].user_unique_key,
        full_name: activeUsers[i].full_name || '',
        user_image: activeUsers[i].user_image || ''
      };

      if (channelInfo.channel_properties) {
        channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
        options.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
        silentPushPayload.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
      }
      notifierService.notifyUsers(logHandler, options);
      notifierService.notifyUsers(logHandler, silentPushPayload);
    }

    return {
      messages_detail: messagesDetail
    };
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}


async function removeChatMember(logHandler, payload, res) {
  try {
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;


    let customLabel;
    if (channelInfo.chat_type == constants.chatType.O20_CHAT) {
      throw new Error("You can't remove member from this chat.");
    }

    if (channelInfo.chat_type == constants.chatType.RESTRICTED_GROUP) {
      throw new Error("You can't remove member from this chat.");
    }

    if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      throw new Error("You can't remove member from this chat.");
    }
    const [userChannelInfo] = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);

    if (!payload.api_key) {
      if (userChannelInfo.role == constants.userRole.USER && channelInfo.chat_type == constants.chatType.PRIVATE_GROUP) {
        throw new Error('Only Group admin can perform this action.');
      }
    }


    const participationDetails = await channelService.getUserToChannelDetails(
      logHandler,
      { user_id: userInfo.user_id, channel_id: channelInfo.channel_id, status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED] }
    );

    if (!participationDetails.length) {
      throw new Error('Only group member can perform this action');
    }

    let disableUser = await channelService.getUsersParticipatedInChannels(logHandler, { channel_id: channelInfo.channel_id, user_ids: [payload.user_id_to_remove] });


    if (!disableUser.length) {
      throw new Error("User doesn't belongs to this group");
    }
    disableUser = disableUser[0];


    channelService.updateMessageSeen(logHandler, { user_id: disableUser.user_id, channel_id: channelInfo.channel_id, message_id: disableUser.last_read_message_id, channel_status: constants.userMessageSeenChannelStatus.LEFT });

    if (disableUser.user_type == constants.userType.GUEST) {
      const guestChannels = await userService.getGuestData(logHandler, { user_id: disableUser.user_id });
      let updatedChannels = [];
      if (guestChannels.length) {
        if (guestChannels[0].channel_ids_to_connect) {
          updatedChannels = JSON.parse(guestChannels[0].channel_ids_to_connect);
          updatedChannels.splice(updatedChannels.indexOf(channelInfo.channel_id), 1);
        }
      }
      if (updatedChannels.length) {
        updatedChannels = JSON.stringify(updatedChannels);
      } else {
        updatedChannels = null;
      }
      await userService.updateGuest(logHandler, { update_fields: { channel_ids_to_connect: updatedChannels }, where_clause: { user_id: disableUser.user_id } });
    }


    if (!payload.api_key) {
      if (userChannelInfo.role == constants.userRole.USER && disableUser.role == constants.userRole.ADMIN) {
        throw new Error('You can not remove Admin.');
      }
    }

    conversationService.unstarMessages(logHandler, { user_id: disableUser.user_id, channel_id: channelInfo.channel_id });
    redis.del(`channelInfo` + channelInfo.channel_id);

    const updateObj = {};
    updateObj.user_id = disableUser.user_id;
    updateObj.channel_id = channelInfo.channel_id;
    updateObj.status = constants.userStatus.DISABLE;
    updateObj.role = constants.userRole.USER;
    userService.insertOrUpdateUserToChannelDetails(logHandler, updateObj);
    const opts = {
      update_fields: {
        status: constants.status.DISABLE
      },
      where_clause: {
        user_id: disableUser.user_id,
        channel_id: channelInfo.channel_id
      }
    };
    await notifierService.updateNotification(logHandler, opts);

    const message = `${userInfo.full_name} removed ${disableUser.full_name} from the conversation`;
    const params = {};
    params.workspace_id = businessInfo.workspace_id;
    params.user_id = userInfo.user_id;
    params.channel_id = channelInfo.channel_id;
    params.data = { message };
    params.label_id = channelInfo.label_id;
    params.user_type = userInfo.user_type;
    params.full_name = userInfo.full_name;
    params.muid = UniversalFunc.getRandomString();
    params.message_type = userInfo.user_type == constants.userType.CUSTOMER ? constants.messageType.PUBLIC_NOTE : constants.messageType.NOTE;
    params.status = constants.userConversationStatus.MESSAGE;
    conversationService.insertUsersConversation(logHandler, params);

    let membersInfo = [];
    const users = await channelService.getAllUsersParticipatedInChannels(logHandler, { channel_id: channelInfo.channel_id });
    const channelImage = utils.jsonParse(channelInfo.channel_image);

    if (_.isEmpty(channelImage) || !channelInfo.custom_label) {
      const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: userInfo.user_id });
      const channelUserInfo = lastActiveUsers.channelUserMap || {};
      const channelLabelInfo = lastActiveUsers.channelLabelMap || {};
      let label = channelLabelInfo[channelInfo.channel_id] || '';
      membersInfo = channelUserInfo[channelInfo.channel_id] || [];
      if (membersInfo.length < constants.unamedGroupMemberLength) {
        label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
        membersInfo.push({
          full_name: userInfo.full_name.split(' ')[0],
          user_id: userInfo.user_id,
          user_image: userInfo.user_image || ''
        });
      }

      channelInfo.label = channelInfo.custom_label || label;
      if (!channelInfo.custom_label) {
        channelInfo.label = label;
        channelInfo.custom_label = label;
        customLabel = label;
      }
    }
    channelInfo.channel_image_url = channelImage ? channelImage.channel_image_url : constants.groupChatImageURL.channel_image_url;
    channelInfo.channel_thumbnail_url = channelImage ? channelImage.channel_thumbnail_url : constants.groupChatImageURL.channel_thumbnail_url;
    const options = {
      channelInfo,
      businessInfo,
      userInfo,
      muid: params.muid,
      notificationType: pushNotificationBuilder.notificationType.REMOVE_USER,
      messageType: constants.messageType.PUBLIC_NOTE,
      pushMessage: message,
      message,
      isSilent: true,
      userIds: users[0].user_ids.split(',').map(Number),
      removedUserId: parseInt(payload.user_id_to_remove),
      members_info: membersInfo,
      custom_label: customLabel,
      removedUserUniquekey: disableUser.user_unique_key,
      usersUnreadNotificationCount: {}
    };

    if (channelInfo.channel_properties) {
      channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
      options.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
    }

    notifierService.notifyUsers(logHandler, options);

    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function joinChat(logHandler, payload, res) {
  try {
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;

    if (channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
      throw new Error('You can join only public group from outside !!');
    }

    if (channelInfo.chat_type == constants.chatType.RESTRICTED_GROUP) {
      throw new Error("You cannot join this chat.");
    }

    if(userInfo.workspace_id != channelInfo.workspace_id) {
      throw new Error("Invalid workspace channel")
    }

    const participationDetails = await channelService.getUserToChannelDetails(
      logHandler,
      { channel_id: channelInfo.channel_id, status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED] }
    );


    try {
      let workspaceConfig = await workspaceService.getWorkspaceConfiguration(logHandler, payload.businessInfo.workspace_id)
      if (workspaceConfig.max_member_in_group) {
        if (participationDetails.length + 1 > workspaceConfig.max_member_in_group) {
          throw new Error(`Cannot create group with more than ${workspaceConfig.max_member_in_group} users.`)
        }
      }
    } catch (err) {
      console.error("-----",err)
    }

    if (userInfo.user_properties) {
      userInfo.user_properties = JSON.parse(userInfo.user_properties);

      if (userInfo.user_properties.hasOwnProperty('max_group_member') && participationDetails.length + 1 > userInfo.user_properties.max_group_member) {
        throw new Error('You cannot join this chat.')
      }
    }


    redis.del(channelInfo.channel_id);

    const updateObj = {};
    updateObj.user_id = userInfo.user_id;
    updateObj.channel_id = channelInfo.channel_id;
    updateObj.status = constants.userStatus.ENABLE;
    updateObj.role = constants.userRole.USER;
    // updateObj.last_activity = new Date();

    let messageInfo = await conversationService.getMessage(logHandler, { workspace_id: businessInfo.workspace_id, channel_id : channelInfo.channel_id });
    // const participationDetails = await channelService.getUserToChannelDetails(
    //   logHandler,
    //   { user_id: userInfo.user_id, channel_id: channelInfo.channel_id }
    // );

    if ((participationDetails.length && messageInfo.length && participationDetails[0].last_read_message_id < messageInfo[0].id) || (!participationDetails.length && messageInfo.length)) {
      channelService.updateMessageSeen(logHandler, { user_id: userInfo.user_id, channel_id: channelInfo.channel_id, message_id: messageInfo[0].id, channel_status: constants.userMessageSeenChannelStatus.JOIN });
    }

    await userService.insertOrUpdateUserToChannel(logHandler, updateObj);

    const message = `${userInfo.full_name} joined  conversation`;
    const params = {};
    params.workspace_id = businessInfo.workspace_id;
    params.user_id = userInfo.user_id;
    params.channel_id = channelInfo.channel_id;
    params.channel_name = channelInfo.channel_name;
    params.data = { message };
    params.label_id = channelInfo.label_id;
    params.user_type = userInfo.user_type;
    params.full_name = userInfo.full_name;
    params.muid = UniversalFunc.getRandomString();
    params.message_type = userInfo.user_type == constants.userType.CUSTOMER ? constants.messageType.PUBLIC_NOTE : constants.messageType.NOTE;
    params.status = constants.userConversationStatus.MESSAGE;
    conversationService.insertUsersConversation(logHandler, params);

    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}


async function leaveChat(logHandler, payload, res) {
  try {
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;
    let customLabel;


    if (channelInfo.chat_type == constants.chatType.RESTRICTED_GROUP) {
      throw new Error("You cannot leave this chat.");
    }

    if (userInfo.user_type == constants.userType.GUEST) {
      const guestChannels = await userService.getGuestData(logHandler, { user_id: userInfo.user_id });
      let updatedChannels = [];
      if (guestChannels.length) {
        if (guestChannels[0].channel_ids_to_connect) {
          updatedChannels = JSON.parse(guestChannels[0].channel_ids_to_connect);
          updatedChannels.splice(updatedChannels.indexOf(channelInfo.channel_id), 1);
        }
      }
      if (updatedChannels.length) {
        updatedChannels = JSON.stringify(updatedChannels);
      } else {
        updatedChannels = null;
      }
      await userService.updateGuest(logHandler, { update_fields: { channel_ids_to_connect: updatedChannels }, where_clause: { user_id: payload.user_id } });
    }


    if (channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT) {
      throw new Error("You can't leave this chat.");
    }
    if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      throw new Error("You can't leave default group.");
    }
    const participationDetails = await channelService.getUserToChannelDetails(
      logHandler,
      { user_id: userInfo.user_id, channel_id: channelInfo.channel_id, status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED] }
    );
    if (!participationDetails.length) {
      throw new Error('Only group member can perform this action');
    }

    channelService.updateMessageSeen(logHandler, { user_id: userInfo.user_id, channel_id: channelInfo.channel_id, message_id: participationDetails[0].last_read_message_id, channel_status: constants.userMessageSeenChannelStatus.LEFT });

    redis.del(`channelInfo` + channelInfo.channel_id);

    const updateObj = {};
    updateObj.user_id = userInfo.user_id;
    updateObj.channel_id = channelInfo.channel_id;
    updateObj.status = constants.userStatus.DISABLE;
    updateObj.role = constants.userRole.USER;
    await userService.insertOrUpdateUserToChannelDetails(logHandler, updateObj);
    // conversationService.updateUserToMessage(logHandler, {user_id : userInfo.user_id, channel_id : channelInfo.channel_id});

    const opts = {
      update_fields: {
        status: constants.status.DISABLE
      },
      where_clause: {
        user_id: userInfo.user_id,
        channel_id: channelInfo.channel_id
      }
    };
    await notifierService.updateNotification(logHandler, opts);

    if (participationDetails[0].role == constants.userRole.ADMIN) {
      const otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
      if (!_.isEmpty(otherUsers)) {
        const adminUsers = [];
        for (const user of otherUsers) {
          if (user.role == constants.userRole.ADMIN) {
            adminUsers.push(user.user_id);
          }
        }
        if (_.isEmpty(adminUsers)) {
          await userService.updateUserToChannel(logHandler, { channel_id: channelInfo.channel_id, user_id: otherUsers[0].user_id, role: constants.userRole.ADMIN });
        }
      }
    }


    const message = `${userInfo.full_name} left the conversation`;
    const params = {};
    params.workspace_id = businessInfo.workspace_id;
    params.user_id = userInfo.user_id;
    params.channel_id = channelInfo.channel_id;
    params.channel_name = channelInfo.channel_name;
    params.data = { message };
    params.label_id = channelInfo.label_id;
    params.user_type = userInfo.user_type;
    params.full_name = userInfo.full_name;
    params.muid = UniversalFunc.getRandomString();
    params.message_type = userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.GUEST ? constants.messageType.PUBLIC_NOTE : constants.messageType.NOTE;
    params.status = constants.userConversationStatus.MESSAGE;
    conversationService.insertUsersConversation(logHandler, params);

    const users = await channelService.getAllUsersParticipatedInChannels(logHandler, { channel_id: channelInfo.channel_id });

    const channelImage = utils.jsonParse(channelInfo.channel_image);

    if (!_.isEmpty(users)) {
      let membersInfo = [];
      if (!channelInfo.channel_image || !channelInfo.label) {
        const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: userInfo.user_id });
        const channelUserInfo = lastActiveUsers.channelUserMap || {};
        membersInfo = channelUserInfo[channelInfo.channel_id] || [];
        const channelLabelInfo = lastActiveUsers.channelLabelMap || {};
        let label = channelLabelInfo[channelInfo.channel_id] || '';
        if (membersInfo.length < constants.unamedGroupMemberLength) {
          label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
          membersInfo.push({
            full_name: userInfo.full_name.split(' ')[0],
            user_id: userInfo.user_id,
            user_image: userInfo.user_image || ''
          });
        }
        channelInfo.label = channelInfo.custom_label || label;
        if (!channelInfo.custom_label) {
          channelInfo.label = label;
          channelInfo.custom_label = label;
          customLabel = label;
        }
      }
      channelInfo.channel_image_url = channelImage ? channelImage.channel_image_url : constants.groupChatImageURL.channel_image_url;
      channelInfo.channel_thumbnail_url = channelImage ? channelImage.channel_thumbnail_url : constants.groupChatImageURL.channel_thumbnail_url;
      const options = {
        channelInfo,
        businessInfo,
        userInfo,
        muid: params.muid,
        notificationType: pushNotificationBuilder.notificationType.REMOVE_USER,
        messageType: constants.messageType.PUBLIC_NOTE,
        pushMessage: message,
        message,
        isSilent: true,
        userIds: users[0].user_ids.split(',').map(Number),
        removedUserId: userInfo.user_id,
        removedUserUniquekey: userInfo.user_unique_key,
        members_info: membersInfo,
        custom_label: customLabel,
        usersUnreadNotificationCount: {}
      };
      notifierService.notifyUsers(logHandler, options);
    }
    return RESP.SUCCESS.LEFT_GROUP;
  } catch (error) {
    logger.error(logHandler, { ERROR: error });
    throw new Error(error);
  }
}

async function getGroupInfo(logHandler, payload) {
  try {
    const { channelInfo } = payload;
    const pageStart = utils.parseInteger(payload.page_start) || 0;
    payload.user_page_start = utils.parseInteger(payload.user_page_start)
    const pageEnd = constants.getAttachmentPageSize;
     payload.user_page_end = constants.getChatMembersPageSize;
    let chatMembers = [];
    let chatMedia = [];
    let threadMedia = [];
    let allMedia = []; // chatmedia + threadMedia
    let channelImage = {};
    let user_count = '';
    const userIds = [];
    // get data by enum data type
    let userNotificationStatus;

    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, payload.userInfo.user_id, channelInfo.channel_id);
    if (!userExistsInChannel.length && channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
      throw new Error(RESP.ERROR.eng.UNAUTHORIZED.customMessage);
    }

    if (payload.userInfo.workspace_id != channelInfo.workspace_id) {
      throw new Error("Invalid Workspace");
    }
    if ((payload.get_data_type == constants.getGroupInfoDataType.DEFAULT) || (payload.get_data_type == constants.getGroupInfoDataType.MEMBERS)) {
      const allParticipants = await channelService.getUserToChannelDetails(logHandler, {
        channel_id: channelInfo.channel_id,
        status: [constants.userStatus.ENABLE, constants.userStatus.SUSPENDED]
      });
      //const userIds = [];
      _.each(allParticipants, (user) => {
        if (user.user_id == payload.userInfo.user_id) {
          userNotificationStatus = user.notification;
        }
        user.status = +constants.getFuguUserStatus[user.status];
        userIds.push(user.user_id);
      });
      if (channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT) {
        chatMembers = await userService.getInfoUsers(logHandler, { user_id: userIds, workspace_id: channelInfo.workspace_id, page_start: payload.user_page_start, page_end: payload.user_page_end });
      } else if(payload.user_page_start || payload.user_page_start == 0){
        if (payload.user_page_start == 0) {
          chatMembersCount = await userService.getUsersWithAppInfo(logHandler,
            {
              userIds,
              status: [constants.userStatus.ENABLE, constants.userStatus.INVITED],
              channel_id: channelInfo.channel_id,
              workspace_id: channelInfo.workspace_id,
              user_id: payload.userInfo.user_id,
              user:true
            });

          //remove duplcate count
          chatMembersCount = chatMembersCount.reduce((acc, current) => {
            const x = acc.find(item => item.user_id === current.user_id);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, []);
          user_count = chatMembersCount.length ;
        }
        chatMembers = await userService.getUsersWithAppInfo(logHandler,
          {
            userIds,
            status: [constants.userStatus.ENABLE, constants.userStatus.INVITED],
            channel_id: channelInfo.channel_id,
            workspace_id: channelInfo.workspace_id
            , page_start: payload.user_page_start, page_end: payload.user_page_end,
            user_id: payload.userInfo.user_id,
            chat_type : channelInfo.chat_type,
          });
      } else {
        chatMembers = await userService.getUsersWithAppInfo(logHandler,
          {
            userIds,
            status: [constants.userStatus.ENABLE, constants.userStatus.INVITED],
            channel_id: channelInfo.channel_id,
            workspace_id: channelInfo.workspace_id
            , page_start: payload.user_page_start, page_end: payload.user_page_end,
            user_id: payload.userInfo.user_id,
            user:true
          });
      }
    }
    if (!(channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT) && payload.user_page_start == 0 && userIds.includes(payload.userInfo.user_id)) {
     let userData = await userService.getUsersWithAppInfo(logHandler, { userIds: [payload.userInfo.user_id], workspace_id: channelInfo.workspace_id, channel_id: channelInfo.channel_id,user : true })
     // if (!(chatMembers.includes(userData[0])))
      if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
        if (payload.userInfo.role == constants.userRole.OWNER && payload.userInfo.user_id == userData[0].user_id) {
          userData[0].role = constants.userRole.ADMIN;
        }
      }
     chatMembers.unshift(userData[0])
    }

    for (const item of chatMembers) {
      item.status = +constants.getFuguUserStatus[item.status];
      if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
        if (payload.userInfo.role == constants.userRole.OWNER && payload.userInfo.user_id == item.user_id) {
          item.role == constants.userRole.ADMIN;
        }
      }
    }

    if ((payload.get_data_type == constants.getGroupInfoDataType.DEFAULT) || (payload.get_data_type == constants.getGroupInfoDataType.ATTACHMENTS)) {
      chatMedia = await channelService.getChannelAttachments(logHandler, {
        channel_id: payload.channel_id,
        page_start: pageStart,
        page_end: pageEnd,
        message_type: payload.message_type || constants.getAttachmentTypes,
        workspace_id: channelInfo.workspace_id
      });
      for (const chatData of Array.from(chatMedia)) {
        chatData.message = utils.jsonParse(chatData.message);
      }
      threadMedia = await channelService.getThreadAttachments(logHandler, {
        channel_id: Number(payload.channel_id),
        page_start: pageStart,
        page_end: pageEnd,
        message_type: payload.message_type || constants.getAttachmentTypes,
        workspace_id: channelInfo.workspace_id
      });
      for (const threadData of Array.from(threadMedia)) {
        threadData.message = utils.jsonParse(threadData.message);
      }
    }
    allMedia = chatMedia.concat(threadMedia);
    allMedia.sort((a, b) => ((a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0)));

    if (payload.get_data_type == constants.getGroupInfoDataType.DEFAULT) {
      channelImage = utils.jsonToObject(logHandler, channelInfo.channel_image);
      if (_.isEmpty(channelImage)) {
        channelImage = constants.groupChatImageURL;
      }
    }

    const membersInfo = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: payload.userInfo.user_id });
    membersInfo.channelUserMap[channelInfo.channel_id] = membersInfo.channelUserMap[channelInfo.channel_id] ? membersInfo.channelUserMap[channelInfo.channel_id] : [];
    let [userDetails] = await userService.getUserDetail(logHandler, { user_id: payload.userInfo.user_id });

    if (membersInfo.channelUserMap[channelInfo.channel_id].length < constants.unamedGroupMemberLength) {
      membersInfo.channelUserMap[channelInfo.channel_id].push({
        full_name: payload.userInfo.full_name.split(' ')[0],
        user_image: userDetails.user_image,
        user_id: payload.userInfo.user_id
      });
    }
    //remove duplicate element
    chatMembers = chatMembers.reduce((acc, current) => {
      const x = acc.find(item => item.user_id === current.user_id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    const response = {
      chat_members: chatMembers,
      chat_media: allMedia,
      channel_image: channelImage,
      members_info: membersInfo.channelUserMap[channelInfo.channel_id] || [],
      page_size: constants.getAttachmentPageSize,
      chat_type: channelInfo.chat_type,
      user_notification_status: userNotificationStatus,
      user_page_size: constants.getChatMembersPageSize
    };

    (!user_count || user_count.length === 0) ? 0 : response.user_count = user_count ;

    if (!(channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT)) {
      [response.channel_info] = await channelService.getOwnerAndChannelInfo(logHandler, { channel_id: channelInfo.channel_id, user_id: payload.userInfo.user_id });
    }
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

async function getChatGroups(logHandler, payload) {
  try {
    const workspaceId = payload.businessInfo.workspace_id;
    const { userInfo } = payload;
    const channelIds = [];

    const response = {};
    let joinedChannels = [];
    if (payload.channel_type == constants.channelsType.JOINED || !payload.channel_type) {
      joinedChannels = await channelService.getUserJoinedGroups(logHandler, { user_id: userInfo.user_id, workspace_id: workspaceId });
      for (const channelInfo of joinedChannels) {
        if (!channelInfo.label || _.isEmpty(utils.jsonParse(channelInfo.channel_image))) {
          channelIds.push(channelInfo.channel_id);
        }
      }
      response.o2o_channels = await channelService.getUserO2OChannels(logHandler, { user_id: userInfo.user_id });
    }


    let openChannels = [];
    if (payload.channel_type == constants.channelsType.OPEN || !payload.channel_type) {
      openChannels = await channelService.getOpenGroups(logHandler, { user_id: userInfo.user_id, workspace_id: workspaceId });
      for (const channelInfo of openChannels) {
        if (!channelInfo.label || _.isEmpty(utils.jsonParse(channelInfo.channel_image))) {
          channelIds.push(channelInfo.channel_id);
        }
      }
    }

    const unamedChannelsInfo = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channelIds, user_id: userInfo.user_id });
    const channelsUserInfo = unamedChannelsInfo.channelUserMap || {};
    const channelLabelMap = unamedChannelsInfo.channelLabelMap || {};

    if (!_.isEmpty(joinedChannels)) {
      for (const channelInfo of joinedChannels) {
        if (!channelInfo.label || _.isEmpty(utils.jsonParse(channelInfo.channel_image))) {
          channelInfo.members_info = channelsUserInfo[channelInfo.channel_id] || [];
          let label = channelLabelMap[channelInfo.channel_id];
          if (channelInfo.members_info.length < constants.unamedGroupMemberLength) {
            label = label ? `${label}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0];
            channelInfo.members_info.push({
              full_name: userInfo.full_name.split(' ')[0],
              user_id: userInfo.user_id,
              user_image: userInfo.user_image
            });
          }

          if (!channelInfo.label) {
            channelInfo.label = label;
            channelInfo.custom_label = label;
          }
        }
        channelInfo.channel_image = utils.jsonParse(channelInfo.channel_image).channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
      }
      response.joined_channels = joinedChannels;
    }

    if (!_.isEmpty(openChannels)) {
      for (const channelInfo of openChannels) {
        if (!channelInfo.label || _.isEmpty(utils.jsonParse(channelInfo.channel_image))) {
          channelInfo.members_info = channelsUserInfo[channelInfo.channel_id] || [];
          const label = channelLabelMap[channelInfo.channel_id];
          if (!channelInfo.label) {
            channelInfo.label = label;
            channelInfo.custom_label = label;
          }
        }
        channelInfo.channel_image = utils.jsonParse(channelInfo.channel_image).channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
      }
    }
    response.open_channels = openChannels;

    //fixing case for empty label and custom label
    response.o2o_channels.forEach (key => {
        if (key.chat_type
            && (   key.chat_type == constants.chatType.PRIVATE_GROUP
                || key.chat_type == constants.chatType.PUBLIC_GROUP
                || key.chat_type == constants.chatType.GENERAL_CHAT
                || key.chat_type == constants.chatType.DEFAULT_GROUP
            )
            && !key.custom_label) {
            key.label        = 'Abandoned Group'
            key.custom_label = 'Abandoned Group'
        }
    })

    response.open_channels.forEach (key => {
      if (key.chat_type
          && (   key.chat_type == constants.chatType.PRIVATE_GROUP
              || key.chat_type == constants.chatType.PUBLIC_GROUP
              || key.chat_type == constants.chatType.GENERAL_CHAT
              || key.chat_type == constants.chatType.DEFAULT_GROUP
          )
          && !key.custom_label) {
        key.label        = 'Abandoned Group'
        key.custom_label = 'Abandoned Group'
      }
    })

    return response;
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}


async function clearChatHistory(logHandler, payload) {
  try {
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;

    if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      try {
        for (let data of constants.pmIdOffiecChat) {
          redis.del(constants.promiseHash + channelInfo.channel_id + data);
        }
      } catch (e) {
        console.error("ERROR WHILE REMOVING MESSAGE CLEAR CHAT HASH", channelInfo.channel_id, ">>>>>>", e)
      }
    }

    const workspaceConfig = await workspaceService.getConfiguration(logHandler, businessInfo.workspace_id);

    if (!parseInt(workspaceConfig[constants.workspaceConfig.clearChatHistory])) {
      throw new Error("You can't clear chat from this space.");
    }
    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);

    if(!userExistsInChannel.length) {
      throw new Error("User not belong to this channel")
    }

    const result = await conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: channelInfo.channel_id });
    if (_.isEmpty(result)) {
      throw new Error("You can't perform this action for this message.");
    }

    if(result[0].workspace_id != userInfo.workspace_id) {
      throw new Error("Invalid workspace.")
    }

    await channelService.insertOrUpdateChannelHistory(logHandler, { message_id: result[0].id, channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
    // save chat clear upto message id
    await channelService.saveChatClearUptoMessageId(logHandler, { message_id: result[0].id, channel_id: channelInfo.channel_id, user_id: userInfo.user_id });

    const opts = {};
    opts.userIds = [userInfo.user_id];
    opts.businessInfo = businessInfo;
    opts.channelInfo = channelInfo;
    opts.userInfo = userInfo;
    opts.muid = payload.muid;
    opts.app_type = 1;
    opts.isSilent = true;
    opts.usersUnreadNotificationCount = {};
    opts.notificationType = notificationBuilder.notificationType.CLEAR_CHAT;
    notifierService.notifyUsers(logHandler, opts);
    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function deleteMessage(logHandler, payload) {
  try {
    const { businessInfo } = payload;
    const { channelInfo } = payload;
    const { userInfo } = payload;
    const opts = {};
    if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
      try {
        redis.del(constants.promiseHash + channelInfo.channel_id);
      } catch (e) {
        console.error("ERROR WHILE REMOVING DELETE MESSAGE HASH", channelInfo.channel_id, ">>>>>>", e)
      }
    }    const workspaceConfig = await workspaceService.getConfiguration(logHandler, businessInfo.workspace_id);
    const updateStarMessage = {};
    updateStarMessage.user_id = userInfo.user_id;
    updateStarMessage.is_starred = constants.status.DISABLE;
    if (!JSON.parse(workspaceConfig[constants.workspaceConfig.deleteMessage])) {
      throw new Error("You can't delete message from this space.");
    }

    if (payload.muid) {
      const result = await conversationService.getMessageByMuid(logHandler, {
        channel_id: channelInfo.channel_id,
        muid: payload.muid
      });

      if (_.isEmpty(result)) {
        throw new Error("You can't perform this action for this message.");
      }

      if (result[0].user_id != userInfo.user_id) {
        throw new Error('You are not authorised to perform this action.');
      }

      // checking time difference for delete message
      const timeDifferenceInMinutes = utils.getTimeDifference(result[0].created_at, new Date(), 'minutes');
      const deleteMessageDuration = JSON.parse(workspaceConfig[constants.workspaceConfig.deleteMessageDuration]);
      if (deleteMessageDuration > 0 && timeDifferenceInMinutes > deleteMessageDuration) {
        throw new Error('Cannot delete Message!');
      }
      updateStarMessage.message_id = result[0].id;
      // save chat clear upto message id
      esClient.delete({
        index: 'users_conversation',
        id: result[0].id,
        type: 'message'
      }, function (err, resp, status) {
        if (err) {
          console.error(err);
        }
      })

      await conversationService.updateInfo(logHandler, { message_id: result[0].id, status: constants.status.DISABLE });
    } else {
      const result = await conversationService.getThreadMessageByThreadMuid(logHandler, {
        thread_muid: payload.thread_muid
      });

      if (_.isEmpty(result)) {
        throw new Error('Invalid Thread Muid!');
      }

      if (result[0].user_id != userInfo.user_id) {
        throw new Error('Unauthorized');
      }

      // checking time difference for delete message
      const timeDifferenceInMinutes = utils.getTimeDifference(result[0].created_at, new Date(), 'minutes');
      const deleteMessageDuration = JSON.parse(workspaceConfig[constants.workspaceConfig.deleteMessageDuration]);
      if (deleteMessageDuration > 0 && timeDifferenceInMinutes > deleteMessageDuration) {
        throw new Error('Cannot delete Message!');
      }
      updateStarMessage.thread_message_id = result[0].thread_message_id;
      // save chat clear upto message id
      esClient.delete({
        index: 'thread_user_messages',
        id: result[0].thread_message_id,
        type: 'message'
      }, function (err, resp, status) {
        if (err) {
          console.error(err);
        }
      })

      await conversationService.updateThreadMessageInfo(logHandler, {
        thread_message_id: result[0].thread_message_id,
        status: constants.status.DISABLE
      });
    }

    await conversationService.updateStatusOrIsStarred(logHandler, updateStarMessage);
    const users = await channelService.getUsersParticipatedInChannel(logHandler, { channel_id: channelInfo.channel_id });
    const userIds = [];
    for (const user of users) {
      userIds.push(user.user_id);
    }
    opts.userIds = userIds;
    opts.businessInfo = businessInfo;
    opts.channelInfo = channelInfo;
    opts.userInfo = userInfo;
    opts.muid = payload.muid;
    opts.thread_muid = payload.thread_muid;
    opts.app_type = 1;
    opts.isSilent = true;
    opts.usersUnreadNotificationCount = {};
    opts.notificationType = notificationBuilder.notificationType.DELETE_MESSAGE;
    notifierService.notifyUsers(logHandler, opts);
    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function changeFollowingStatus(logHandler, payload) {
  try {
    const { userInfo } = payload;
    const { channelInfo } = payload;
    const messageInfo = await conversationService.getMessageByMuid(logHandler, { channel_id: channelInfo.channel_id, muid: payload.muid });

    if (!_.isEmpty(messageInfo)) {
      if(messageInfo[0].channel_id != channelInfo.channel_id) {
        throw new Error("Invalid channel id");
      }

      if (messageInfo[0].workspace_id != userInfo.workspace_id) {
        throw new Error("Invalid workspace");
      }

      const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
      if (!userExistsInChannel.length && channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
        logger.error(logHandler, 'user does not belong to this channel');
        throw new Error(RESP.ERROR.eng.UNAUTHORIZED.customMessage);
      }

      await conversationService.insertOrUpdateUserToMessage(logHandler,
        {
          message_id: messageInfo[0].id,
          user_id: userInfo.user_id,
          status: payload.following_status
        });
    } else {
      throw new Error("Invalid message")
    }
    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function changeGroupInfo(logHandler, payload) {
  try {
    const activeUsersId = [];
    const channelIdsToAdd = payload.channel_ids_to_add;
    const channelIdsToRemove = payload.channel_ids_to_remove;

    const { businessInfo } = payload;

    if (_.isEmpty(businessInfo)) {
      throw new Error('Invalid workspace');
    }

    if(payload.userInfo.workspace_id != businessInfo.workspace_id) {
      throw new Error("Invalid workspace")
    }

    if(payload.userInfo.role == constants.userRole.USER) {
      throw new Error("User not allowed to update info")
    }

    if (!_.isEmpty(channelIdsToRemove)) {
      let channelDetails = await channelService.getChannelsInfo(logHandler, { channel_ids: channelIdsToRemove, workspace_id: businessInfo.workspace_id});
      if(!channelDetails.length) {
        throw new Error("Unable to remove channel.")
      }
      await channelService.updateGroupChatType(logHandler, { channelIds: channelIdsToRemove, chat_type: constants.chatType.PUBLIC_GROUP });
    }

    if (!_.isEmpty(channelIdsToAdd)) {
      let channelDetails = await channelService.getChannelsInfo(logHandler, { channel_ids: channelIdsToAdd, workspace_id: businessInfo.workspace_id });
      if (!channelDetails.length) {
        throw new Error("Unable to add channel.")
      }
      await channelService.updateGroupChatType(logHandler, { channelIds: channelIdsToAdd, chat_type: constants.chatType.DEFAULT_GROUP });

      const activeUsers = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: businessInfo.workspace_id, allowed_guest: true });
      for (const user of activeUsers) {
        activeUsersId.push(user.user_id);
      }
      const userToChannelMap = {};
      const usersParticipatedInChannel = await channelService.getAllUsersParticipatedInChannels(logHandler, { channel_id: channelIdsToAdd });
      for (const users of usersParticipatedInChannel) {
        userToChannelMap[users.channel_id] = users.user_ids.split(',').map(Number);
      }

      const businessOwnerAndAdmin = await channelService.getAdminAndOwnerOfBusiness(logHandler, { app_secret_key: businessInfo.app_secret_key });
      const businessAdminUserIds = businessOwnerAndAdmin.map(x => x.fugu_user_id);

      for (const channelId of channelIdsToAdd) {
        const usersToBeInserted = activeUsersId.filter(el => userToChannelMap[channelId].indexOf(el) < 0);
        if (!_.isEmpty(usersToBeInserted)) {
          await userService.insertUserToChannel(logHandler, { channel_id: channelId }, usersToBeInserted);
        }
        const alreadyAdminUsers = await channelService.getUserToChannelDetails(logHandler, { channel_id: channelId, role: constants.userRole.ADMIN });
        alreadyAdminUsersId = alreadyAdminUsers.map(x => x.user_id);
        const userIdsToMakeUsers = alreadyAdminUsersId.filter(el => businessAdminUserIds.indexOf(el) < 0);

        if (!_.isEmpty(userIdsToMakeUsers)) {
          await userService.updateUserToChannel(logHandler, { role: constants.userRole.USER, channel_id: channelId, user_id: userIdsToMakeUsers });
        }
        await userService.updateUserToChannel(logHandler, { role: constants.userRole.ADMIN, channel_id: channelId, user_id: businessAdminUserIds });
      }
    }
    if (!_.isEmpty(channelIdsToRemove)) {
      return RESP.SUCCESS.CHANNELS_REMOVED_SUCESSFULLY
    } else if (!_.isEmpty(channelIdsToAdd)) {
      return RESP.SUCCESS.CHANNELS_ADDED_SUCESSFULLY
    } else {
    return {};
    }
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function editInfo(logHandler, payload) {
  try {
    const { channelInfo } = payload;
    const { userInfo } = payload;
    const { businessInfo } = payload;

    if (payload.custom_label && channelInfo.chat_type == constants.chatType.GENERAL_CHAT) {
      throw new Error("You can't change general chat name.");
    }

    const [userChannelInfo] = await channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);

    if (_.isEmpty(userChannelInfo) && !payload.api_key) {
      throw new Error("User don't belong to this channel");
    }

    if (!payload.api_key) {
      if (userChannelInfo.role == constants.userRole.USER && (channelInfo.chat_type == constants.chatType.PRIVATE_GROUP || payload.only_admin_can_message)) {
        throw new Error("You can't perform this action");
      }
    }

    utils.addAllKeyValues(utils.jsonToObject(logHandler, channelInfo.channel_image), channelInfo);
    const opts = {
      update_fields: {},
      where_clause: {
        workspace_id: businessInfo.workspace_id,
        channel_id: payload.channel_id
      }
    };

    let message = userInfo.full_name;
    const channelImage = {};
    const options = {};

    if (payload.channel_image) {
      const image_url = await utilityService.uploadFile(logHandler, { file: payload.channel_image });
      if (image_url) {
        channelImage.channel_image_url = image_url.url;
        channelImage.channel_thumbnail_url = image_url.thumbnail_url;
        opts.update_fields.channel_image = utils.objectToJson(logHandler, channelImage);
        message += ' updated the group icon';
      }
    }

    if (payload.custom_label) {
      message += ` changed the group name to ${payload.custom_label} `;
      opts.update_fields.custom_label = payload.custom_label;
    }

    if(channelInfo.channel_properties) {
      let send_message = JSON.parse(channelInfo.channel_properties);
      options.only_admin_can_message = send_message.only_admin_can_message;
    }
    let clonedObject = utils.cloneObject(payload)
    // [Object: null prototype] while console so added channel image check
    let addPublicNote = true;
    if (!payload.channel_image && clonedObject.hasOwnProperty('only_admin_can_message') && typeof clonedObject.only_admin_can_message == "boolean") {
      redis.del(constants.promiseHash + channelInfo.channel_id);
      if(channelInfo.channel_properties) {
        channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
      } else {
        channelInfo.channel_properties = {};
      }
      channelInfo.channel_properties.only_admin_can_message = payload.only_admin_can_message;
      options.only_admin_can_message = payload.only_admin_can_message;
      opts.update_fields.channel_properties = JSON.stringify(channelInfo.channel_properties);
      addPublicNote = false;
    }

    let otherUserChannelInfo =[];


    if (payload.chat_type == constants.chatType.RESTRICTED_GROUP || (channelInfo.chat_type == constants.chatType.RESTRICTED_GROUP && payload.chat_type)) {
      if (payload.status == constants.status.DISABLE) {
        throw new Error("You cannot delete this group.");
      } else {
        throw new Error("You cannot change type of this group.");
      }
    }

    if (payload.status == constants.status.DISABLE) {
      if (channelInfo.chat_type == constants.chatType.PRIVATE_GROUP || channelInfo.chat_type == constants.chatType.PUBLIC_GROUP) {
        options.is_deleted_group = true;
        opts.update_fields.status = constants.status.DISABLE;
        conversationService.unstarMessages(logHandler, { channel_id: channelInfo.channel_id });
        notifierService.updateChannelNotification(logHandler, { channel_id: channelInfo.channel_id });
      } else {
        throw new Error("You cannot delete this group.");
      }
    }

    if (!_.isEmpty(payload.user_ids_to_make_admin)) {

      if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
        addPublicNote = false;
        redis.del(constants.promiseHash + channelInfo.channel_id);
        if (payload.userInfo.role == constants.userRole.OWNER) {
          userChannelInfo.role = constants.userRole.ADMIN;
        }
      }

      if (userChannelInfo.role == constants.userRole.USER) {
        throw new Error('Users can not make admin.');
      }
      for (const userId of payload.user_ids_to_make_admin) {
         otherUserChannelInfo = await channelService.getUsersParticipatedInChannels(logHandler, { user_ids: userId, channel_id: channelInfo.channel_id });
        if (_.isEmpty(otherUserChannelInfo)) {
          throw new Error("User don't belong to this channel.");
        }

        if (otherUserChannelInfo[0].role == constants.userRole.ADMIN) {
          throw new Error('User is already Admin.');
        }

        await userService.updateUserToChannel(logHandler, { channel_id: channelInfo.channel_id, user_id: userId, role: constants.userRole.ADMIN });
      }
      message += ' updated the group admin.';
      options.user_ids_to_make_admin = payload.user_ids_to_make_admin;
    }


    if (!_.isEmpty(payload.user_ids_to_remove_admin)) {
      if ((payload.user_ids_to_remove_admin).includes(userInfo.user_id)) {
        throw new Error('You can not remove admin rights by yourself.');
      }

      if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
        addPublicNote = false;
        redis.del(constants.promiseHash + channelInfo.channel_id);

        if (payload.userInfo.role == constants.userRole.OWNER) {
          userChannelInfo.role = constants.userRole.ADMIN;
        }
      }

      if (userChannelInfo.role == constants.userRole.USER) {
        throw new Error('Users can not remove admin.');
      }

      if (channelInfo.chat_type == constants.chatType.GENERAL_CHAT || channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
        let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: channelInfo.workspace_id, status: constants.status.ENABLED });
        if (userOwnerInfo.length && payload.user_ids_to_remove_admin.includes(userOwnerInfo[0].fugu_user_id)) {
          throw new Error("You cannot remove this admin.")
        }
      }

      for (const userId of payload.user_ids_to_remove_admin) {
         otherUserChannelInfo = await channelService.getUsersParticipatedInChannels(logHandler, { user_ids: userId, channel_id: channelInfo.channel_id });
        if (_.isEmpty(otherUserChannelInfo)) {
          throw new Error("User don't belong to this channel.");
        }

        if (otherUserChannelInfo[0].role == constants.userRole.USER) {
          throw new Error('Already a user.');
        }
        await userService.updateUserToChannel(logHandler, { channel_id: channelInfo.channel_id, user_id: userId, role: constants.userRole.USER });
      }
      message += ' dismissed the group admin.';
      options.user_ids_to_remove_admin = payload.user_ids_to_remove_admin;
    }

    if (payload.chat_type) {
      message += ' changed the group privacy to ';
      if (payload.chat_type == constants.chatType.PRIVATE_GROUP) {
        message += 'private.';
      } else {
        message += 'public.';
      }
      opts.update_fields.chat_type = payload.chat_type;
      options.is_chat_type_changed = true;
      channelInfo.chat_type = payload.chat_type;
    }

    if (payload.channel_image || payload.custom_label || payload.chat_type || payload.status == constants.status.DISABLE || (clonedObject.hasOwnProperty('only_admin_can_message') && typeof clonedObject.only_admin_can_message == "boolean")) {
      if (_.isEmpty(opts.update_fields)) {
        throw new Error('Please provide something to update');
      }
      await channelService.update(logHandler, opts);
    }

    if (payload.channel_image || payload.custom_label) {
      options.update_notification_count = constants.saveNotificationFor.CHANGE_GROUP_INFO;
    } else {
      options.update_notification_count = false;
    }

    const muid = UniversalFunc.getRandomString();
    const params = {};

    params.workspace_id = businessInfo.workspace_id;
    params.user_id = userInfo.user_id;
    params.channel_id = channelInfo.channel_id;
    params.channel_name = channelInfo.channel_name;
    params.data = { message };
    params.label_id = channelInfo.label_id;
    params.user_type = userInfo.user_type;
    params.user_name = userInfo.user_name;
    params.full_name = userInfo.full_name;
    params.muid = muid;
    params.message_type = constants.messageType.PUBLIC_NOTE;
    params.status = constants.userConversationStatus.MESSAGE;
    if(!options.is_deleted_group && addPublicNote) {
      await conversationService.insertUsersConversation(logHandler, params);
      options.message = message;
      options.messageType = constants.messageType.PUBLIC_NOTE;
      options.pushMessage = message;
    }

    const users = await channelService.getAllUsersParticipatedInChannels(logHandler, { channel_id: channelInfo.channel_id });
    opts.update_fields.chat_type = channelInfo.chat_type;
    opts.update_fields.channel_id = channelInfo.channel_id;
    opts.update_fields.channel_image ? utils.addAllKeyValues(utils.jsonToObject(logHandler, opts.update_fields.channel_image), opts.update_fields) : 0;


    options.muid = muid;
    options.channelInfo = opts.update_fields;
    options.businessInfo = businessInfo;
    options.userInfo = userInfo;
    options.notificationType = pushNotificationBuilder.notificationType.CHANGE_GROUP_INFO;
    options.isSilent = true;
    options.userIds = users[0].user_ids.split(',').map(Number);
    options.updateFields = opts.update_fields;
    options.custom_label = opts.update_fields.custom_label;
    options.usersUnreadNotificationCount = {};

    notifierService.notifyUsers(logHandler, options);
    if(payload.user_ids_to_remove_admin){
      return { channel_image: channelImage , customMessage : `${otherUserChannelInfo[0].full_name} removed as admin` }
    } else if(payload.user_ids_to_make_admin){
      return { channel_image: channelImage , customMessage : `${otherUserChannelInfo[0].full_name} is admin now` }
    } else if(payload.custom_label){
      return { channel_image: channelImage , customMessage : RESP.SUCCESS.GROUP_NAME_CHANGED.customMessage }
    } else if(payload.channel_image){
      return { channel_image: channelImage , customMessage : RESP.SUCCESS.GROUP_PHOTO_UPDATED.customMessage }
    } else if(options.is_deleted_group) {
      return { channel_image: channelImage , customMessage : RESP.SUCCESS.GROUP_DELETED.customMessage }
    } else {
      return { channel_image: channelImage };
    }
    //return { channel_image: channelImage };
  } catch (error) {
    console.error("------------------",error)
    logger.error(logHandler, error);
    throw new Error(error);
  }
}

async function getChannelInfo(logHandler, payload) {
  try {
    const { userInfo } = payload;
    const { channelInfo } = payload;
    const channelImage = utils.cloneObject(utils.jsonParse(channelInfo.channel_image));

    if(channelInfo.workspace_id != userInfo.workspace_id) {
      throw new Error("User and channel does not belong to same workspace")
    }

    if (channelInfo.chat_type == constants.chatType.O20_CHAT) {
      const otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
      const response = {
        user_id: otherUsers[0].user_id,
        status: otherUsers[0].status,
        channel_thumbnail_url: otherUsers[0].user_image,
        user_type: otherUsers[0].user_type,
        label: (otherUsers.length > 0) ? (otherUsers[0].full_name || payload.businessInfo.workspace_name) : response.label
      };
      return response;
    }

    if (!(channelInfo.chat_type != constants.chatType.O20_CHAT && (!channelInfo.channel_image || !channelInfo.custom_label))) {
      channelInfo.label = channelInfo.custom_label;
      channelInfo.channel_image_url = channelImage.channel_image_url || constants.groupChatImageURL.channel_image_url;
      channelInfo.channel_thumbnail_url = channelImage.channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
      delete channelInfo.custom_label;
      return channelInfo;
    }

    const result = await channelService.getChannelsUsersInfo(logHandler, { user_id: userInfo.user_id, channel_ids: [payload.channelInfo.channel_id] });

    const channelUserData = result.channelUserMap || {};
    const channelLabelData = result.channelLabelMap || {};


    const response = {};
    response.channel_id = channelInfo.channel_id;
    response.label = channelInfo.custom_label || channelLabelData[channelInfo.channel_id];
    response.channel_image_url = channelImage.channel_image_url || constants.groupChatImageURL.channel_image_url;
    response.channel_thumbnail_url = channelImage.channel_thumbnail_url || constants.groupChatImageURL.channel_thumbnail_url;
    response.members_info = channelUserData[channelInfo.channel_id] || [];

    if (response.members_info.length < constants.unamedGroupMemberLength) {
      response.label = channelInfo.custom_label || (channelLabelData[channelInfo.channel_id] ? `${channelLabelData[channelInfo.channel_id]}, ${userInfo.full_name.split(' ')[0]}` : userInfo.full_name.split(' ')[0]);
      response.members_info.push({
        full_name: userInfo.full_name.split(' ')[0],
        user_image: userInfo.user_image,
        user_id: userInfo.user_id
      });
    }

    if (!channelInfo.custom_label) {
      response.custom_label = response.label;
    }
    return response;
  } catch (error) {
    logger.error(logHandler, error);
    throw new Error(error);
  }
}

async function editMessage(logHandler, payload) {
  try {
    let { businessInfo } = payload;
    const { channelInfo } = payload;
    businessInfo.business_name = businessInfo.workspace_name;
    const { userInfo } = payload;
    if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
      try {
        redis.del(constants.promiseHash + channelInfo.channel_id);
      } catch (e) {
        console.error("ERROR WHILE REMOVING MESSAGE EDIT HASH", channelInfo.channel_id, ">>>>>>", e)
      }
    }
    const workspaceConfig = await workspaceService.getConfiguration(logHandler, businessInfo.workspace_id);

    const getUserRole = userInfo.role;

    let notToUpdateUsers = [];
    let newTags = [];
    if (_.isEmpty(getUserRole)) {
      throw new Error('User does not Exist.');
    }

    if (!(JSON.parse(workspaceConfig[constants.workspaceConfig.editMessageRole]).includes(getUserRole))) {
      throw new Error('You can not perform this action for this message.');
    }

    const messageObject = {};

    const messageInfo = await conversationService.getMessageUserInfo(logHandler, { muid: payload.muid });

    if (_.isEmpty(messageInfo)) {
      throw new Error('Invalid muid.');
    }

    if (payload.muid && !payload.thread_muid) {
      if (messageInfo[0].message_state == constants.userConversationStatus.DELETE_MESSAGE) {
        throw new Error('You can not edit deleted message.');
      }

      if (messageInfo[0].user_id != userInfo.user_id) {
        throw new Error('You are not authorised to perform this action.');
      }
      let message;
      if(payload.tagged_users || payload.tagged_all) {
       message = JSON.parse(messageInfo[0].message);
        if (payload.tagged_users.length && message.tagged_user_ids && message.tagged_user_ids.length) {
          notToUpdateUsers = Array.from(new Set(message.tagged_user_ids)) ;
          newTags = payload.tagged_users.filter(id => !message.tagged_user_ids.includes(id))
          message.tagged_user_ids = Array.from(new Set(payload.tagged_users))
        }
        else if (payload.tagged_users.length && !payload.tagged_all) {
          message.tagged_user_ids = Array.from(new Set(payload.tagged_users))
          newTags = payload.tagged_users
        }
      }

      const timeDifferenceInSeconds = utils.getTimeDifference(messageInfo[0].date_time, new Date(), 'seconds');
      const editMessageDuration = workspaceConfig[constants.workspaceConfig.editMessageDuration];

      if (editMessageDuration > 0 && timeDifferenceInSeconds > editMessageDuration) {
        throw new Error('Cannot update Message!');
      }
      messageObject.message_id = messageInfo[0].id;
      messageObject.message_type = messageInfo[0].message_type;

      conversationService.insertMessageHistory(logHandler, { muid: payload.muid, message: messageInfo[0].encrypted_message, encrypted_message: messageInfo[0].encrypted_message });

      await esClient.update({
        index: 'users_conversation',
        type: 'message',
        id: messageInfo[0].id ,
        body : {
          // query: {
          //   "bool": {
          //     "must": [
          //       { "match": { "id": messageInfo[0].id } }
          //     ]
          //   }
          // },
          "script": {
            "source": `ctx._source.message =params.message`,
            "params": {
              "message": cheerio.load(payload.formatted_message || payload.message).text()
            }
          }
        }
      }).then(function (body) {
      }, function (error) {
        console.trace(error.message);
      });




      await conversationService.editMessage(logHandler, {
        message_id: messageInfo[0].id, searchable_message: cheerio.load(payload.formatted_message || payload.message).text(), status: constants.userConversationStatus.EDIT_MESSAGE, encrypted_message: payload.message, message: message
      });
    } else {
      const result = await conversationService.getThreadMessageByThreadMuid(logHandler, {
        thread_muid: payload.thread_muid
      });

      if (_.isEmpty(result)) {
        throw new Error('Invalid Thread Muid!');
      }

      if (result[0].message_state == constants.userConversationStatus.DELETE_MESSAGE) {
        throw new Error('You can not edit deleted message.');
      }

      if (result[0].user_id != userInfo.user_id) {
        throw new Error('Unauthorized');
      }

      let threadMessage;
      if (payload.tagged_users || payload.tagged_all) {
        threadMessage = JSON.parse(result[0].message);
        if (payload.tagged_users.length && threadMessage.tagged_user_ids && threadMessage.tagged_user_ids.length) {
          notToUpdateUsers = Array.from(new Set(threadMessage.tagged_user_ids));
          newTags = payload.tagged_users.filter(id => !threadMessage.tagged_user_ids.includes(id))
          threadMessage.tagged_user_ids = Array.from(new Set(payload.tagged_users))
        } else if (payload.tagged_users.length && !payload.tagged_all ) {
          threadMessage.tagged_user_ids = Array.from(new Set(payload.tagged_users))
          newTags = payload.tagged_users
        }
      }

      messageObject.message_id = result[0].message_id;
      messageObject.message_type = result[0].message_type;
      const timeDifferenceInSeconds = utils.getTimeDifference(result[0].date_time, new Date(), 'seconds');
      const editMessageDuration = workspaceConfig[constants.workspaceConfig.editMessageDuration];
      if (editMessageDuration > 0 && timeDifferenceInSeconds > editMessageDuration) {
        throw new Error('Cannot update Message!');
      }

      conversationService.insertMessageHistory(logHandler, { muid: payload.thread_muid, message: result[0].encrypted_message, encrypted_message: result[0].encrypted_message });





      await esClient.update({
        index: 'thread_user_messages',
        type: 'message',
        id: result[0].thread_message_id,
        body: {
          "script": {
            "source": `ctx._source.message =params.message`,
            "params": {
              "message": cheerio.load(payload.formatted_message || payload.message).text()
            }
          }
        }
      }).then(function (body) {
      }, function (error) {
        console.trace(error.message);
      });






      await conversationService.editMessage(logHandler, {
        thread_message_id: result[0].thread_message_id, searchable_message: cheerio.load(payload.formatted_message || payload.message).text(), status: constants.userConversationStatus.EDIT_MESSAGE, encrypted_message: payload.message, message: threadMessage
      });
    }

    if (!_.isEmpty(payload.tagged_users) || payload.tagged_all) {
      await conversationService.deleteNotification(logHandler, { thread_muid : payload.thread_muid, muid : payload.muid, tagged_users : payload.tagged_users })
    }

    const users = await channelService.getUsersParticipatedInChannel(logHandler, { channel_id: channelInfo.channel_id, remove_self : true, user_id : userInfo.user_id });
    let userIds = [];
    let silentPushUsers= []
    let notToUpdateUsersMap = {}
    for (const user of users) {
      if(!notToUpdateUsers.length) {
        notToUpdateUsersMap[user.user_id] = true;
      }
      if ((user.notification == constants.channelNotification.DIRECT_MENTIONS && payload.tagged_all) || (_.isEmpty(payload.tagged_users && !payload.tagged_all)) ) {
        silentPushUsers.push(user.user_id);
      } else {
        userIds.push(user.user_id);
      }
    }


    if (notToUpdateUsers.length) {
      for (let user_id of notToUpdateUsers) {
        notToUpdateUsersMap[user_id] = true;
      }
    }

    if(newTags.length) {
      for(let data of newTags) {
        delete notToUpdateUsersMap[data]
      }
    }

    if (!_.isEmpty(payload.tagged_users) || (payload.tagged_all && userIds.length )) {
      if (payload.tagged_all) {
        payload.tagged_users = userIds;
      }
      await conversationService.insertUserToMessage(logHandler, { userIds: payload.tagged_users, message_id: messageObject.message_id, status: constants.status.ENABLE });
      userIds = userIds.filter(el => payload.tagged_users.indexOf(el) < 0);
      const tagged_payload = {};
      tagged_payload.tagged_chat = 1;
      tagged_payload.userIds = payload.tagged_users;
      tagged_payload.tagged_users = payload.tagged_users;
      tagged_payload.businessInfo = businessInfo;
      tagged_payload.channelInfo = channelInfo;
      tagged_payload.userInfo = userInfo;
      tagged_payload.muid = payload.muid;
      tagged_payload.thread_muid = payload.thread_muid;
      tagged_payload.is_thread_message = !!payload.thread_muid;
      tagged_payload.message = payload.formatted_message || payload.message;
      tagged_payload.message_type = messageObject.message_type;
      tagged_payload.chat_type = channelInfo.chat_type,
        tagged_payload.notToUpdateUsersMap = notToUpdateUsersMap
        tagged_payload.notificationType = notificationBuilder.notificationType.EDIT_MESSAGE;
      tagged_payload.thread_owner_name = messageInfo[0].full_name,
        tagged_payload.update_notification_count = constants.saveNotificationFor.TAGGED_MESSAGE;
      tagged_payload.usersUnreadNotificationCount = {};

      notifierService.notifyUsers(logHandler, tagged_payload);
    }

    if (!_.isEmpty(silentPushUsers)) {
      const opts = {};
      opts.userIds = silentPushUsers;
      opts.businessInfo = businessInfo;
      opts.channelInfo = channelInfo;
      opts.userInfo = userInfo;
      opts.muid = payload.muid;
      opts.thread_muid = payload.thread_muid;
      //opts.tagged_users = payload.tagged_users;
      opts.message = payload.message;
      opts.message_type = messageObject.message_type;
      opts.isSilent = true;
      opts.update_notification_count = constants.saveNotificationFor.MESSAGE;
      opts.is_thread_message = !!payload.thread_muid;
      opts.usersUnreadNotificationCount = {};
      opts.notificationType = notificationBuilder.notificationType.EDIT_MESSAGE;
      notifierService.notifyUsers(logHandler, opts);
    }

    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function updateGuest(logHandler, payload) {
  const updateObj = {};
  if (!_.isEmpty(payload.user_ids_to_connect)) {
    updateObj.user_ids_to_connect = JSON.stringify(payload.user_ids_to_connect);
  } else {
    updateObj.user_ids_to_connect = null;
  }

  if (!_.isEmpty(payload.channel_ids_to_connect)) {
    updateObj.channel_ids_to_connect = JSON.stringify(payload.channel_ids_to_connect);
  } else {
    updateObj.channel_ids_to_connect = null;
  }

  const guestChannels = await userService.getGuestData(logHandler, { guest_id: payload.guest_id });
  let removeFromChannels = [];

  if (guestChannels.length) {
    if(payload.userInfo.workspace_id != guestChannels[0].workspace_id) {
      throw new Error("Cannot update guest info.")
    }
    if (guestChannels[0].channel_ids_to_connect) {
      payload.channel_ids_to_connect ? 0 : payload.channel_ids_to_connect = [];
      removeFromChannels = JSON.parse(guestChannels[0].channel_ids_to_connect).filter(x => payload.channel_ids_to_connect.indexOf(x) < 0);
    }
  }

  if (removeFromChannels.length) {
    channelService.disableUserOnChannels(logHandler, guestChannels[0].user_id, removeFromChannels);
  }

  if (!_.isEmpty(payload.channel_ids_to_connect)) {
    userService.insertUserToChannels(logHandler, { user_id: guestChannels[0].user_id }, payload.channel_ids_to_connect);
  }
  // channelService.enableUsersOfUserToChannel(logHandler, guestChannels[0].user_id, payload.channel_ids_to_connect );
  await userService.updateGuest(logHandler, { update_fields: updateObj, where_clause: { guest_id: payload.guest_id } });
  return {};
}

async function deleteFromChannel(logHandler, payload) {
  try {
    // let customLabel;
    let channel = await channelService.getInfo(logHandler, { channel_id : payload.channel_id});
    payload.channelInfo= channel[0];
    if (payload.channelInfo.chat_type == constants.chatType.O20_CHAT) {
      throw new Error("You can't remove member from this chat.");
    }

    if (payload.channelInfo.chat_type == constants.chatType.GENERAL_CHAT || payload.channelInfo.chat_type == constants.chatType.DEFAULT_GROUP) {
      throw new Error("You can't remove member from this chat.");
    }
    // const [userChannelInfo] = await channelService.getUserFromUserToChannel(logHandler, payload.userInfo.user_id, payload.channelInfo.channel_id);

    // if(userChannelInfo.role == constants.userRole.USER && payload.channelInfo.chat_type == constants.chatType.PRIVATE_GROUP && !payload.api_key) {
    //   throw new Error("Only Group admin can perform this action.");
    // }


    // const participationDetails = await channelService.getUserToChannelDetails(logHandler,
    //   {
    //     user_id: payload.userInfo.user_id,
    //     channel_id: payload.channelInfo.channel_id,
    //     status: constants.userStatus.ENABLE
    //   });

    // if(!participationDetails.length) {
    //   throw new Error("Only group member can perform this action");
    // }

    if (payload.delete_channel) {
      await channelService.disableUsersOnChannelExceptUser(logHandler, { channel_id: payload.channelInfo.channel_id, user_id: -1 });
      return {};
    }

    const disableUsers = await channelService.getUsersParticipatedInChannels(logHandler, { channel_id: payload.channelInfo.channel_id, user_ids: payload.user_ids_to_remove });

    if (!disableUsers.length) {
      throw new Error('Invalid data in user_id_to_remove');
    }

    const disableUsersId = disableUsers.map(x => x.user_id);

    channelService.disableUsersOfUserToChannel(logHandler, disableUsersId, payload.channelInfo.channel_id);

    return {};
  } catch (error) {
    logger.error(logHandler, { ERROR: error.message });
    throw new Error(error);
  }
}

async function getGuestChannels(logHandler, payload) {

  let opts = {
    guest_id: payload.guest_id
  }
  payload.get_invited_by ? opts.get_invited_by = payload.get_invited_by : 0;
  const result = await userService.getGuestData(logHandler, opts);

  const response = {
    channels: [],
    users: [],
    invited_by: result[0].invited_by
  };
  if (result.length) {
    if(payload.userInfo.role == constants.userRole.USER) {
      throw new Error("Unauthorized")
    }

    if(result[0].workspace_id != payload.userInfo.workspace_id) {
      throw new Error("Not allowed.")
    }
    let channelIds = [];

    if (result[0].channel_ids_to_connect) {
      channelIds = JSON.parse(result[0].channel_ids_to_connect);
    }

    if (channelIds.length) {
      const allChannels = await channelService.getChannelsInfo(logHandler, { workspace_id: payload.businessInfo.workspace_id, channel_ids: channelIds });

      const channels = [];
      for (const data of allChannels) {
        if (!data.custom_label) {
          channels.push(data.channel_id);
        } else {
          data.label = data.custom_label;
        }
      }
      const lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channels });
      const channelsLabelInfo = lastActiveUsers.channelLabelMap || {};
      const channelsUserInfo = lastActiveUsers.channelUserMap || {};
      for (const data of allChannels) {
        if ((data.chat_type != constants.chatType.O20_CHAT) && !data.custom_label) {
          let label = channelsLabelInfo[data.channel_id];
          const channelUserData = channelsUserInfo[data.channel_id] || [];
          if (channelUserData.length < constants.unamedGroupMemberLength) {
            label = label ? `${label}, ${payload.userInfo.full_name.split(' ')[0]}` : payload.userInfo.full_name.split(' ')[0];
          }
          data.label = label;
        }

        if (data.chat_type == constants.chatType.O20_CHAT) {
          data.label = channelToUserName[data.channel_id] || constants.anonymousUserName;
        }
        response.channels.push(data);
      }
    }

    if (result[0].user_ids_to_connect) {
      const allUsers = await userService.getUserDetail(logHandler, { user_id: JSON.parse(result[0].user_ids_to_connect) });
      if (allUsers.length) {
        response.users = allUsers;
      }
    }
  }
  return response;
}


async function pendingAndAcceptedUserSearch(logHandler, payload) {
  let users = [];
  users = await workspaceService.pendingAndAcceptedUsers(logHandler, { workspace_id: payload.userInfo.workspace_id, status: payload.user_type == constants.getMembers.PENDING  ? constants.invitationStatus.NOT_EXPIRED : constants.invitationStatus.EXPIRED , search_text: payload.search_text });
  return { users: users };
}

async function getMessageSeenBy(logHandler, payload) {
  let messagesInfo = [];

  payload.page_start = parseInt(payload.page_start);
  payload.page_end = payload.page_end ? parseInt(payload.page_end) : constants.messageSeenByPageSize;

  if (payload.muid) {
    messagesInfo = await conversationService.getMessagesByMuids(logHandler, { channel_id: payload.channel_id, muids: payload.muid });
  } else {
    messagesInfo = await conversationService.getThreadMessageByThreadMuid(logHandler, { thread_muid: payload.thread_muid })
  }

  if(messagesInfo.length) {
    if (messagesInfo[0].message_state == constants.userConversationStatus.DELETED_MESSAGE) {
      throw new Error("Message is Deleted");
    }

    if (messagesInfo[0].user_id != payload.userInfo.user_id) {
      throw new Error("Unauthorized");
    }


    let channelInfo = await channelService.getInfo(logHandler, { channel_id : messagesInfo[0].channel_id});

    let response = {
      page_size: constants.messageSeenByPageSize,
      customMessage: constants.defaultSeenByMessage
    };
    if(channelInfo[0].chat_type == constants.chatType.O20_CHAT) {
      let otherUsers = await channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo[0].channel_id, user_id: payload.userInfo.user_id });
      if(otherUsers.length) {
        response.customMessage = otherUsers[0].full_name.split(' ')[0] + ` has not seen your message yet`
      }
    }

    if (messagesInfo[0].thread_message_id) {
      let result = await channelService.getThreadMessageSeenBy(logHandler, { user_id : payload.userInfo.user_id, channel_id: payload.channel_id, message_id: messagesInfo[0].message_id, thread_message_id: messagesInfo[0].thread_message_id, page_start : payload.page_start, page_end : payload.page_end });
      // if(result.length < constants.messageSeenByPageSize) {
      //   let messageSeenByCount = await channelService.getThreadMeesageSeenByCount(logHandler, { user_id: payload.userInfo.user_id, channel_id: payload.channel_id, message_id: messagesInfo[0].message_id, thread_message_id: messagesInfo[0].thread_message_id })
      // }
      response.message_seen_by = result;
    }  else {
      let result = await channelService.getMessageSeenBy(logHandler, { user_id: payload.userInfo.user_id, channel_id: payload.channel_id, message_id: messagesInfo[0].message_id, page_start: payload.page_start, page_end: payload.page_end });
      response.message_seen_by = result;
    }

    return response;
  } else {
    throw new Error("Invalid Message");
  }
}


async function requestMessage(logHandler, payload) {
  let [channelInfo] = await channelService.getInfo(logHandler, { channel_id : payload.channel_id });
  if(payload.userInfo.workspace_id != channelInfo.workspace_id) {
    throw new Error("Channel does not belong to same business.")
  }

  const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, payload.userInfo.user_id, channelInfo.channel_id);
  if (_.isEmpty(userExistsInChannel) || userExistsInChannel[0].status == constants.userStatus.DISABLE) {
    throw new Error('user does not belong to this channel');
  }

  if(channelInfo.chat_type != constants.chatType.PRIVATE_GROUP && channelInfo.chat_type != constants.chatType.PUBLIC_GROUP) {
    throw new Error('Invalid Channel');
  }

  let adminChannelDetails = await channelService.getUserToChannelDetails(logHandler, { channel_id: channelInfo.channel_id, role: constants.userRole.ADMIN })
  let adminPayload = {
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    user_type: 1,
    message_status: 3,
    server_push: 0,
    is_thread_message: false
  };
  if (adminChannelDetails.length) {
    adminPayload.user_id = adminChannelDetails[0].user_id
    adminPayload.message = `Hi ! Thanks for requesting a call back. One of us will call you right away !`
    setTimeout(() => {
      botController.publishMessage(logHandler, adminPayload, channelInfo.channel_id);
    }, 200);
  } else {
    throw new Error('No admin in this group.');
  }
  return {};
}



exports.groupChatSearch = groupChatSearch;
exports.createGroupChat = createGroupChat;
exports.createO2OChat = createO2OChat;
exports.addChatMember = addChatMember;
exports.removeChatMember = removeChatMember;
exports.joinChat = joinChat;
exports.leaveChat = leaveChat;
exports.getGroupInfo = getGroupInfo;
exports.getChatGroups = getChatGroups;
exports.clearChatHistory = clearChatHistory;
exports.deleteMessage = deleteMessage;
exports.changeFollowingStatus = changeFollowingStatus;
exports.changeGroupInfo = changeGroupInfo;
exports.editInfo = editInfo;
exports.getChannelInfo = getChannelInfo;
exports.editMessage = editMessage;
exports.updateGuest = updateGuest;
exports.deleteFromChannel = deleteFromChannel;
exports.getGuestChannels = getGuestChannels;
exports.userSearch = userSearch;
exports.pendingAndAcceptedUserSearch = pendingAndAcceptedUserSearch;
exports.getMessageSeenBy = getMessageSeenBy;
exports.requestMessage = requestMessage;
