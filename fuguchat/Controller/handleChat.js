const _ = require('underscore');
const Promise = require('bluebird');
const { logger } = require('../libs/pino_logger');
const pushNotificationBuilder = require('../Builder/pushNotification');
const constants = require('../Utils/constants');
const notifierService = require('../services/notifier');
const userService = require('../services/user');
const channelService = require('../services/channel');
const businessService = require('../services/business');
const handleChatService = require('../services/handleChat');
const redis = require("../Utils/redis").Redis;
const commonFunctions = require('../Utils/commonFunctions');
const conversationService = require('../services/conversation');
const utils = require('../Utils/commonFunctions');

exports.handleChat = handleChat;
exports.getSocket = getSocket;

function handleChat(userInfo, channelInfo, businessInfo, messageInfo) { // WARNING use fixed schemas
  const logHandler = {
    apiModule: "chathandler",
    apiHandler: "handleChat"
  };

  Promise.coroutine(function* () {
    yield channelService.updateLastActivityAtChannel(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });


    try {
      if (userInfo.image_set) {
        userInfo.image_set = JSON.parse(userInfo.image_set);
        userInfo.user_image = userInfo.image_set.image_100x100;
        userInfo.user_image_50x50 = userInfo.image_set ? userInfo.image_set.image_50x50 : "";
      }
      let message = messageInfo.message;
      // let ownerAndAgent = yield channelService.getOwnerAndAgentOfChannel(logHandler, { channel_id : channelInfo.channel_id });
      let options = {};
      //   options.ownerAndAgent            = ownerAndAgent;
      options.userInfo = commonFunctions.cloneObject(userInfo);
      messageInfo.channel_id = channelInfo.channel_id;
      options.user_id = userInfo.user_id;
      options.user_unique_key = options.userInfo.user_unique_key;
      options.send_by = userInfo.user_id;
      options.last_sent_by_user_type = userInfo.user_type;
      options.channel_id = channelInfo.channel_id;
      options.message = message;
      options.muid = messageInfo.muid;
      options.message_type = messageInfo.message_type;
      options.full_name = userInfo.full_name;
      options.business_id = businessInfo.workspace_id;
      options.bot_channel_name = channelInfo.label;
      options.username = userInfo.emails || "";
      options.chat_type = channelInfo.chat_type;
      options.channel_status = channelInfo.status;
      options.message_type = messageInfo.message_type;
      options.message_id = messageInfo.message_id;
      options.email = userInfo.email || "";
      options.is_thread_message = messageInfo.is_thread_message || false;
      options.thread_owner_id = messageInfo.thread_owner_id;
      options.thread_owner_name = messageInfo.thread_owner_name;
      options.thread_muid = messageInfo.thread_muid;
      options.user_thumbnail_image = userInfo.user_image;
      options.user_image = userInfo.user_image;
      options.user_type = userInfo.user_type;
      options.typeList = [];
      options.notification_type = messageInfo.is_video_conference ? pushNotificationBuilder.notificationType.VIDEO_CONFERENCE : pushNotificationBuilder.notificationType.MESSAGE;
      options.business_id = businessInfo.business_id;
      options.image_url = messageInfo.image_url;
      options.thumbnail_url = messageInfo.thumbnail_url;
      options.tagged_chat = 0;
      options.question = messageInfo.question;
      options.comment = messageInfo.comment;
      options.multiple_select = messageInfo.multiple_select;
      options.expire_time = messageInfo.expire_time;
      options.poll_options = messageInfo.poll_options;
      options.url = messageInfo.url;
      options.file_size = messageInfo.file_size;
      options.custom_actions = messageInfo.custom_actions;
      options.default_text_field = messageInfo.default_text_field;
      options.file_name = messageInfo.file_name;
      options.document_type = messageInfo.document_type;
      options.is_web = messageInfo.is_web;
      options.message_id = messageInfo.message_id;
      options.is_voip_push = messageInfo.is_voip_push;
      options.invite_link = messageInfo.invite_link;
      options.is_audio_conference = messageInfo.is_audio_conference;
      options.caller_text = messageInfo.caller_text;
      options.image_width = messageInfo.image_width;
      options.user_image_50x50 = userInfo.user_image_50x50
      options.image_height = messageInfo.image_height;
      options.image_url_100x100 = messageInfo.image_url_100x100;
      options.tagged_all = messageInfo.tagged_all;
      options.sender_user_id = messageInfo.sender_user_id;
      options.user_tagged_message = messageInfo.tagged_users;
      options.last_notification_id = yield redis.get("lastPushId")
      //for google meet integration
      if(options.invite_link && options.invite_link.includes('meet.google.com')){
        options.notification_type = pushNotificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION;
      }
      options.hrm_bot_type = messageInfo.hrm_bot_type;

      options.usersUnreadNotificationCount = {};

      if (channelInfo.channel_properties) {
        options.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
      }
      // for channel thumbnail image
      let channelImage = commonFunctions.jsonParse(channelInfo.channel_image);
      options.channel_thumbnail_url = channelImage ? channelImage.channel_thumbnail_url : constants.groupChatImageURL.channel_thumbnail_url;

      if ((channelInfo.chat_type != constants.chatType.O20_CHAT && channelInfo.chat_type != constants.chatType.FUGU_BOT) && (_.isEmpty(channelInfo.channel_image) || !channelInfo.custom_label)) {
        let lastActiveUsers = yield channelService.getChannelsUsersInfo(logHandler, { channel_ids: [channelInfo.channel_id], user_id: userInfo.user_id });
        let channelUserInfo = lastActiveUsers.channelUserMap || {};
        let channelLabelInfo = lastActiveUsers.channelLabelMap || {};
        channelUserInfo[channelInfo.channel_id] = channelUserInfo[channelInfo.channel_id] || [];
        let label = channelLabelInfo[channelInfo.channel_id];

        if (channelUserInfo[channelInfo.channel_id].length == constants.unamedGroupMemberLength) {
          let labelArray = label.split(',');
          labelArray.pop();
          label = userInfo.full_name.split(' ')[0] + ", " + labelArray.join(', ');
        }

        if (channelUserInfo[channelInfo.channel_id].length < constants.unamedGroupMemberLength) {
          label = label ? userInfo.full_name.split(' ')[0] + ", " + label : userInfo.full_name.split(' ')[0];
        }
        options.label = label;
        if (!channelInfo.custom_label) {
          channelInfo.custom_label = options.label;
          options.custom_label = label;
        }
      }

      // get owner and agent of channel
      //options.owner_user_id = ownerAndAgent.owner_id;
      options.label = channelInfo.label || channelInfo.custom_label //|| ownerAndAgent.owner_name;
      options.tags = [];
      options.app_secret_key = businessInfo.app_secret_key;


      // save tagged users as involved in threading
      if (!_.isEmpty(messageInfo.tagged_users) || messageInfo.tagged_all) {
        let allUsers = []
        if (messageInfo.tagged_all) {
          if (messageInfo.tagged_users && messageInfo.tagged_users.length) {
            options.direct_tags = true;
            options.directTagUsersMap = {};
            for (let user_id of messageInfo.tagged_users) {
              options.directTagUsersMap[user_id] = true;
            }
          }
          let usersToInsert = false;//yield redis.get(`channelInfo` + channelInfo.channel_id);
          if (!usersToInsert) {
            allUsers = yield channelService.getUsersParticipatedInChannel(logHandler, options);
          } else {
            allUsers = JSON.parse(usersToInsert);
          }
          if (allUsers.length) {
            for (let data of allUsers) {
              if (data.notification != constants.channelNotification.DIRECT_MENTIONS) {
                messageInfo.tagged_users.push(data.user_id);
              }
            }
          }
        }
        yield handleChatService.insertOrUpdateTaggedUsers(logHandler, messageInfo);
      }


      if (messageInfo.is_thread_message) {
        options.userCCPushList = yield channelService.getThreadUsersParticipatedInChannel(logHandler, options);
        // logger.error(logHandler, { DATA: "thread_message", RESULT: options.userCCPushList, tagged_users: messageInfo.tagged_users });
      } else {
        let usersInChannel = false//yield redis.get( `channelInfo` + channelInfo.channel_id);
        if (!usersInChannel) {
          options.userCCPushList = yield channelService.getUsersParticipatedInChannel(logHandler, options);
          // redis.set(`channelInfo` + channelInfo.channel_id, JSON.stringify(options.userCCPushList));
        } else {
          options.userCCPushList = JSON.parse(usersInChannel);
        }
      }

      // notifications  : send pushes to users, remove self pushes
      options.userIds = [];
      options.userIdsToUserUniqueKeyMap = {};
      let followThreadUserIds = {};
      options.followThreadUserUniqueKey = {};
      options.ccMentionPushUsers = {}
      options.userUniqueKeyForNotificationCount = [];
      options.skipSnoozeNotificationMap = {};
      let pushList = Array.from(options.userCCPushList);
      let userToChannelNotificationMap = {};
      let skipUsers = [];

      for (let user of pushList) {
        if (user.user_id != userInfo.user_id) {
          options.userIdsToUserUniqueKeyMap[user.user_id] = user.user_unique_key;
          if (options.is_thread_message && user.follow_thread) {
            followThreadUserIds[user.user_id] = true;
            options.followThreadUserUniqueKey[user.user_unique_key] = true;
          }

          if (user.notification_snooze_time && new Date() < new Date(user.notification_snooze_time)) {
            options.skipSnoozeNotificationMap[user.user_unique_key] = true;
          }
          if (!options.is_thread_message && ((messageInfo.tagged_all && (user.notification_level == constants.channelNotification.MUTED || user.notification_level == constants.channelNotification.UNMUTED)) ||
            (options.user_tagged_message && options.user_tagged_message.length && options.user_tagged_message.includes(user.user_id)))) {
            options.ccMentionPushUsers[user.user_id] = true;
          }

          options.userIds.push(user.user_id);
          options.userUniqueKeyForNotificationCount.push(user.user_unique_key);
          userToChannelNotificationMap[user.user_id] = user.notification;
          if (channelInfo.chat_type == constants.chatType.O20_CHAT || channelInfo.chat_type == constants.chatType.FUGU_BOT) {
            options.label = userInfo.full_name;
            options.channel_thumbnail_url = userInfo.user_image || '';
          }
        } else {
          skipUsers.push(user.user_id);
        }
      }
      options.followThreadUserIds = followThreadUserIds;
      skipUsers.sort();
      logger.debug(logHandler, { SKIPPING_PUSH: skipUsers });

      options.show_push = followThreadUserIds;

      // change query
      //  let [businessDetails] = yield businessService.getBusinessDetails(logHandler, { app_secret_key : businessInfo.app_secret_key });
      options.domain = businessInfo.domain;
      options.icon = businessInfo.push_icon;
      options.domain_id = businessInfo.domain_id;
      options.business_name = businessInfo.workspace_name;
      options.workspace = businessInfo.workspace;

      options.activeUserFlag = {};
      options.deviceMap = {};
      options.allDeviceMap = {};
      // making unique user_ids
      let set = new Set(options.userIds);
      options.userIds = Array.from(set);
      // send tagged users push for OC
      let androidServiceNotificationUsers = commonFunctions.cloneObject(options);
      let iosServiceNotificationUsers = commonFunctions.cloneObject(options);
      iosServiceNotificationUsers.userPushList = [];
      androidServiceNotificationUsers.userPushList = [];
      if (userInfo.user_type == constants.userType.CUSTOMER && messageInfo.tagged_users) {
        let tagged_users = commonFunctions.isString(messageInfo.tagged_users) ? commonFunctions.jsonParse(messageInfo.tagged_users) : messageInfo.tagged_users;
        tagged_users = Array.from(new Set(tagged_users));
        if (!_.isEmpty(tagged_users)) {
          let tagged_options = commonFunctions.cloneObject(options);
          // filtering out tagged Ids
          let taggedUserIds = options.userIds.filter(el => tagged_users.indexOf(el) >= 0);
          options.userIds = options.userIds.filter(el => tagged_users.indexOf(el) < 0);
          if (taggedUserIds.length) {
            tagged_options.userPushList = yield userService.getLatestUsersDeviceDetails(logHandler, { userIds: taggedUserIds });
            tagged_options.userIds = taggedUserIds;
            tagged_options.userPushList = Array.from(tagged_options.userPushList)
            var tagged_array = tagged_options.userPushList;

            let taggedPushTimeLimit = new Date();
            taggedPushTimeLimit.setSeconds(taggedPushTimeLimit.getSeconds() - constants.pushTimeLimitForAllDevices);
            for (var i = tagged_array.length - 1; i >= 0; i--) {
              tagged_options.userPushList[i].notification = userToChannelNotificationMap[tagged_options.userPushList[i].user_id];
              if ((messageInfo.tagged_all && ((tagged_options.userPushList[i].notification == constants.channelNotification.DIRECT_MENTIONS && tagged_options.direct_tags && tagged_options.directTagUsersMap[tagged_options.userPushList[i].user_id]) || tagged_options.userPushList[i].notification == constants.channelNotification.MUTED)) || (!messageInfo.tagged_all)) {
                tagged_options.userPushList[i].tagged_chat = true;
              }

              if (tagged_options.userPushList[i].updated_at > taggedPushTimeLimit && !options.activeUserFlag[tagged_options.userPushList[i].user_unique_key]) {
                options.activeUserFlag[tagged_options.userPushList[i].user_unique_key] = true
                options.deviceMap[tagged_options.userPushList[i].user_unique_key] = tagged_options.userPushList[i].device_id;
              }
              if(tagged_options.userPushList[i].device_type == 'IOS'){
                try{
                  let device_details = JSON.parse(tagged_options.userPushList[i].device_details);
                  if(device_details.app_version > 232){
                    iosServiceNotificationUsers.userPushList.push(tagged_options.userPushList[i]);
                    tagged_options.userPushList.splice(i, 1);
                  }
                }catch(e){
                  console.log("ERROR IN IOS PUSH",e);
                }
              }else if (tagged_options.userPushList[i] && tagged_options.userPushList[i].device_type == "ANDROID" && options.notification_type != pushNotificationBuilder.notificationType.VIDEO_CONFERENCE && options.notification_type != pushNotificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION) {
                let clients = yield getSocket(logHandler, businessInfo.domain_id + tagged_options.userPushList[i].user_unique_key + tagged_options.userPushList[i].device_id)

                if (clients.length) {
                  options.ccMentionPushUsers[tagged_options.userPushList[i].user_id] = true;
                  tagged_options.userPushList.splice(i, 1);
                  continue;
                } else {
                  try {
                    tagged_options.userPushList[i].device_details = JSON.parse(tagged_options.userPushList[i].device_details);
                    if (tagged_options.userPushList[i].device_details.android_app_version >= 268) {
                      tagged_options.userPushList[i].tagged_chat = true;
                      androidServiceNotificationUsers.userPushList.push(tagged_options.userPushList[i]);
                      tagged_options.userPushList.splice(i, 1);

                    }
                  } catch (err) {
                    console.error("ERROR ANDROID PARSING", err)
                  }
                }
              }

            }


            tagged_options.tagged_chat = 1;
            tagged_options.tagged_users = tagged_users;
            tagged_options.is_thread_message = messageInfo.is_thread_message || false;
            tagged_options.new_message = "";
            tagged_options.label_id = channelInfo.label_id;
            tagged_options.update_notification_count = constants.saveNotificationFor.TAGGED_MESSAGE;
            options.update_tagged_notification_count = constants.saveNotificationFor.TAGGED_MESSAGE;
            tagged_options.domain = businessInfo.domain;
            yield notifierService.saveNotifications(logHandler, tagged_options);
            messageInfo.tagged_all ? tagged_options.tagged_users = [-1] : 0;
            options.tagged_users = tagged_options.tagged_users
            tagged_options.title = yield handleChatService.getChatTitle(logHandler, userInfo, channelInfo, businessInfo);
            options.title = tagged_options.title;
            tagged_options.userPushList = handleChatService.preparePushNotificationList(tagged_options);
            
            yield handleChatService.pushNotifications(logHandler, tagged_options);
          }
        }
      }

      if (messageInfo.is_thread_message) {
        options.update_notification_count = constants.saveNotificationFor.THREAD_MESSAGE;
      } else {
        options.update_notification_count = constants.saveNotificationFor.MESSAGE;
      }

      let pushTimeLimit = new Date();
      pushTimeLimit.setSeconds(pushTimeLimit.getSeconds() - constants.pushTimeLimitForAllDevices);

      if (!_.isEmpty(options.userIds)) {
        yield notifierService.saveNotifications(logHandler, options);
        options.userPushList = yield userService.getLatestUsersDeviceDetails(logHandler, { userIds: options.userIds, skip_user_id: options.sender_user_id });
        var pushListUsers = options.userPushList
        for (var index = pushListUsers.length - 1; index >= 0; index--) {
          options.userPushList[index].notification = userToChannelNotificationMap[options.userPushList[index].user_id];
          options.userPushList[index].follow_thread = followThreadUserIds[options.userPushList[index].user_id];
          if ((options.notification_type == pushNotificationBuilder.notificationType.VIDEO_CONFERENCE || options.notification_type == pushNotificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION) && options.userPushList[index].device_type == constants.deviceType.IOS) {
           try{
            let device_details = JSON.parse(pushListUsers[index].device_details);
            if(device_details.app_version <= 232){
              options.userPushList[index].device_token = options.userPushList[index].voip_token;
            }
           }catch(err){
             console.log("IOS PARSING ERROR----->", err);
           }
         }



          if (options.userPushList[index].updated_at > pushTimeLimit && !options.activeUserFlag[options.userPushList[index].user_unique_key]) {
            options.deviceMap[options.userPushList[index].user_unique_key] = options.userPushList[index].device_id;
            options.activeUserFlag[options.userPushList[index].user_unique_key] = true
          }

          if (options.userPushList[index].device_type == "ANDROID" && options.notification_type != pushNotificationBuilder.notificationType.VIDEO_CONFERENCE && options.notification_type != pushNotificationBuilder.notificationType.HANGOUTS_CALL_NOTIFICATION) {
            let clients = yield getSocket(logHandler, businessInfo.domain_id + options.userPushList[index].user_unique_key + options.userPushList[index].device_id)
            if (clients.length) {
              options.userPushList.splice(index, 1);
            } else {
              try {
                options.userPushList[index].device_details = JSON.parse(options.userPushList[index].device_details);
                if (options.userPushList[index].device_details &&
                    options.userPushList[index].device_details.hasOwnProperty('android_app_version')
                    && options.userPushList[index].device_details.android_app_version >= 268) {
                  options.userPushList[index].notification = userToChannelNotificationMap[options.userPushList[index].user_id];
                  options.userPushList[index].follow_thread = followThreadUserIds[options.userPushList[index].user_id];
                  androidServiceNotificationUsers.userPushList.push(options.userPushList[index]);
                  options.userPushList.splice(index, 1);
                }
              } catch (err) {
                console.error("ERROR ANDROID PARSING", err + " --list--" + JSON.stringify(options.userPushList[index]))
              }
            }
          }else if(options.userPushList[index] && options.userPushList[index].device_type == "IOS"){
            try{
              options.userPushList[index].device_details = JSON.parse(options.userPushList[index].device_details);
              if (options.userPushList[index].device_details.app_version > 232) {
                iosServiceNotificationUsers.userPushList.push(options.userPushList[index]);
                options.userPushList.splice(index, 1);
              }
            }catch(error){
              console.log("ERRRO IN IOS PARSING-------->", error);
            }     
          }
        }

        options.new_message = 1;
        options.label_id = channelInfo.label_id;
        options.title = yield handleChatService.getChatTitle(logHandler, userInfo, channelInfo, businessInfo);

        if (userInfo.user_type == constants.userType.SELF_BOT) {
          let otherUsers = yield channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
          options.label = otherUsers[0].full_name + " (me)"
          options.title = otherUsers[0].full_name + " (me)"
          options.full_name = otherUsers[0].full_name + " (me)"
          options.user_thumbnail_image = otherUsers[0].user_image
          options.channel_thumbnail_url = otherUsers[0].user_image
        }
        options.userPushList = handleChatService.preparePushNotificationList(options);
        yield handleChatService.pushNotifications(logHandler, options, businessInfo);
      } else {
        logger.error(logHandler, "No valid users found to send push notification");
      }

      // calculating unread notification count
      // change query
      let usersUnreadNotifications = [];
      if (!_.isEmpty(options.userUniqueKeyForNotificationCount)) {
        let userDetails = yield businessService.getAllBusinessUserInfo(logHandler, { domain_id: businessInfo.domain_id, user_unique_key: options.userUniqueKeyForNotificationCount });

        let userIds = userDetails.map(x => x["fugu_user_id"]);
        usersUnreadNotifications = yield userService.getUsersNotificationUnreadCount(logHandler, { fugu_user_id: userIds, user_unique_key: options.userUniqueKeyForNotificationCount, domain_id: businessInfo.domain_id });
      }
      for (let row of usersUnreadNotifications) {
        if (!options.usersUnreadNotificationCount[row.user_unique_key]) {
          options.usersUnreadNotificationCount[row.user_unique_key] = {};
          // options.usersUnreadNotificationCount[row.user_unique_key].count = 0;
        }
        options.usersUnreadNotificationCount[row.user_unique_key].count = row.unread_notification_count;
      }
      // control channels
      if (androidServiceNotificationUsers.userPushList.length) {
        androidServiceNotificationUsers.push_type = 1
        androidServiceNotificationUsers.title = options.title;
        androidServiceNotificationUsers.label = options.label
        androidServiceNotificationUsers.user_thumbnail_image = options.user_thumbnail_image || userInfo.user_image
        androidServiceNotificationUsers.channel_thumbnail_url = options.user_image
        androidServiceNotificationUsers.full_name = options.full_name
        androidServiceNotificationUsers.tagged_users = options.tagged_users;
        androidServiceNotificationUsers.domain_id = businessInfo.domain_id;
        androidServiceNotificationUsers.notification_type = pushNotificationBuilder.notificationType.ANDROID_PUSH_SERVICE;
        androidServiceNotificationUsers.userPushList = handleChatService.preparePushNotificationList(androidServiceNotificationUsers);
        yield handleChatService.pushNotifications(logHandler, androidServiceNotificationUsers, businessInfo);
      }
      if(iosServiceNotificationUsers.userPushList.length){
        iosServiceNotificationUsers.remove_voip           = true;
        iosServiceNotificationUsers.title                 = options.title;
        iosServiceNotificationUsers.label                 = options.label
        iosServiceNotificationUsers.user_thumbnail_image  = options.user_thumbnail_image || userInfo.user_image
        iosServiceNotificationUsers.channel_thumbnail_url = options.user_image
        iosServiceNotificationUsers.full_name             = options.full_name
        iosServiceNotificationUsers.tagged_users          = options.tagged_users;
        iosServiceNotificationUsers.domain_id             = businessInfo.domain_id;
        iosServiceNotificationUsers.userPushList          = handleChatService.preparePushNotificationList(iosServiceNotificationUsers);
        yield handleChatService.pushNotifications(logHandler, iosServiceNotificationUsers, businessInfo);   
      }
      yield handleChatService.controlChannelPushes(logHandler, options);
    } catch (error) {
      console.error(">>>>>>>>>>>", error)
    }

    return "success";
  })().then(
    (data) => {
      logger.trace(logHandler, { RESPONSE: data });
    },
    (error) => {
      console.error(">>>>>>>>>>>", error)
      logger.error(logHandler, error);
    }
  );
}


function getSocket(logHandler, params) {
  return new Promise((resolve, reject) => {
    io.in(params).clients((err, clients) => {
      if (clients) {
        resolve(clients);
      }
    })
  });
}