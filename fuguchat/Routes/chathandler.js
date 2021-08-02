

const _                       = require('underscore');
const Promise                 = require('bluebird');
const constants               = require('../Utils/constants');
const handleChat              = require('../Controller/handleChat');
const { logger }              = require('../libs/pino_logger');
const conversationService     = require('../services/conversation');
const userService             = require('../services/user');
const channelService          = require('../services/channel');
const notifierService         = require('../services/notifier');
const notificationBuilder     = require('../Builder/notification');
const UniversalFunc           = require('../Utils/universalFunctions');
const botController           = require('../Controller/botController');
const hrmController           = require('../Controller/hrmController');
const businessService         = require('../services/business')
const RESP                    = require('../Config').responseMessages;
const cheerio                 = require('cheerio');
const moment                  = require('moment');
const utils                   = require('../Utils/commonFunctions');
const redis                   = require('../Utils/redis').Redis;
const utilityService          = require('../services/utility');
const commonFunctions         = require('../Utils/commonFunctions');
const PromiseManager          = require('../Utils/promiseManager').promiseManager;
const esClient                = require('../Utils/elasticServer');
const pushNotificationBuilder = require('../Builder/pushNotification');
const handleChatService       = require('../services/handleChat');

exports.handlePublish = handlePublish;

let numUsers = 0;
exports.handleSocket = async (socket) => {
  const logHandler = {
    uuid: UniversalFunc.generateRandomString(10),
    apiModule: 'chathandler',
    apiHandler: 'handleSocket'
  };
  logger.trace(logHandler, `connected socket id : ${socket.id}`, 'en_user_id', socket.handshake.query.en_user_id);
  const decryptedId = +(commonFunctions.decryptText(socket.handshake.query.en_user_id));
  socket.user_id = decryptedId;
  // redis.set('socket' + socket.id, decryptedId);
  numUsers += 1;
  console.log(`CONNECTED USERS PROCESS ${process.env.pm_id} :: ${numUsers}`);

  // ONLINE OFFLINE
  if (!socket.handshake.query.avoid_last_seen) {
    // joining his own en user id room for maintaing whether user is online or not
    socket.join(socket.handshake.query.en_user_id);
    onSocketConnectLastSeenEvent(decryptedId, socket.id);
  }
  // onSocketConnectLastSeenEvent(socket.handshake.query.en_user_id, socket.id);

  socket.on('subscribe_channel', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data) {
      socket.join(data);
      callback(null, { channel: data });
    }
  });

  socket.on('subscribe_user', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data) {
      socket.join(data);
      callback(null, { channel: data });
    }
  });

  socket.on('subscribe_push', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data) {
      socket.join(data);
      callback(null, { channel: data });
    }
  });

  socket.on('subscribe_presence', (data, callback) => {
    logger.trace(logHandler, 'Subscribe Presence', { socketid: socket.id, joining_room: data });
    if (!callback) {
      callback = () => {
      };
    }
    if (data) {
      if (typeof data == 'string') {
        const userId = +(data.slice(2));
        socket.join(userId);
        callback(null, { user_presence_subscribed: userId });
        getUserPresence(userId, logHandler);
      }
    }
  });

  socket.on('unsubscribe_presence', (data, callback) => {
    logger.trace(logHandler, 'Unsubscribe Presence', { socketid: socket.id, leaving_room: data });
    if (!callback) {
      callback = () => {
      };
    }
    if (data) {
      const userId = +(data.slice(2));
      socket.leave(userId);
      callback(null, { user_presence_unsubscribed: data });
    }
  });

  socket.on('unsubscribe_channel', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data) {
      socket.leave(data);
      callback(null, { channel: data });
    }
  });

  socket.on('typing', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    io.sockets.in(data.channel_id).emit('typing', {
      full_name: data.full_name,
      user_id: data.user_id,
      channel_id: data.channel_id
    });
    callback(null, data);
  });


  socket.on('stop_typing', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    io.sockets.in(data.channel_id).emit('stop_typing', {
      full_name: data.full_name,
      user_id: data.user_id,
      channel_id: data.channel_id
    });
    callback(null, data);
  });


  socket.on('message', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.channel_id) {
      handlePublish({ data, channel: '/' + data.channel_id, is_socket_io: true, socket_id: socket.user_id }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          //    io.sockets.in(data.channel_id).emit('MESSAGE', data);
          callback(null, data);
        }
      });
    }
  });


  socket.on('thread_message', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.channel_id) {
      handlePublish({ data, channel: `/${data.channel_id}`, is_socket_io: true }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          callback(null, data);
        }
      });
    }
  });

  socket.on('poll', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.channel_id) {
      handlePublish({ data, channel: `/${data.channel_id}`, is_socket_io: true }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          // io.sockets.in(data.channel_id).emit('poll', data);
          callback(null, data);
        }
      });
    }
  });

  socket.on('reaction', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.channel_id) {
      handlePublish({ data, channel: `/${data.channel_id}`, is_socket_io: true }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          // io.sockets.in(data.channel_id).emit('reaction', data);
          callback(null, data);
        }
      });
    }
  });

  socket.on('read_all', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.channel_id && data.notification_type) {
      handlePublish({ data, channel: `/${data.channel_id}`, is_socket_io: true }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          // io.sockets.in(data.channel_id).emit('read_all', data);
          callback(null, data);
        }
      });
    }
  });

  socket.on('read_unread_notification', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.notification_id) {
      handlePublish({ data, channel: `/${data.channel_id}`, is_socket_io: true }, (err, messageData) => {
        if (err) {
          callback(err);
        } else {
          callback(null, data);
        }
      });
    }
  });

  socket.on('video_conference', (data, callback) => {
    if (!callback) {
      callback = function () {
      };
    }
    if (data.message_type) {
      dismissConferenceCall(data);
      callback(null, data);
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', async () => {
    // redis.del(`socket` + socket.id);
    numUsers -= 1;
    console.log(`DISCONNECTED USERS PROCESS ${process.env.pm_id} :: ${numUsers}`);
    if (!socket.handshake.query.avoid_last_seen) {
      onSocketDisconnectLastSeenEvent(decryptedId);
    }
  });
};


async function dismissConferenceCall(data) {
  const logHandler = {
    uuid: UniversalFunc.generateRandomString(10),
    apiModule: 'chathandler',
    apiHandler: 'handlePublish'
  };
  let userInfo = await userService.getUserDetail(logHandler, { user_id: data.user_id });
  const businessInfo = await businessService.getInfo(logHandler, { workspace_id: userInfo[0].workspace_id });
  const userIds = [data.user_id];
  const videoPayload = {
    message: `Hungup Call`,
    userInfo,
    businessInfo,
    isSilent: true,
    notificationType: pushNotificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP,
    video_call_type: data.video_call_type,
    userIds,
    messageType: data.message_type,
    user_thumbnail_image: userInfo[0].user_image,
  };
  if (data.device_payload) {
    videoPayload.device_id = data.device_id || data.device_payload.device_id;
    videoPayload.device_type = data.device_payload.device_type;
  }
  const usersToDevicePayload = {
    userIds
  };
  usersToDevicePayload.user_id = data.user_id;
  usersToDevicePayload.device_id = data.device_payload.device_id;
  let userPushList = await userService.getLatestUsersDeviceDetails(logHandler, usersToDevicePayload);
  userPushList.forEach(item => {
    //because of voip push
    if (item.device_type == constants.deviceType.IOS) {
      item.device_token = item.voip_token;
    }
    item.push_payload = {
      notification_type: videoPayload.notificationType,
      message: videoPayload.message,
      message_type: constants.messageType.CONFERENCE_CALL
    }
  })
  await handleChatService.sendSilentPushNotification(logHandler, { userPushList });
  const userCCPushList = [
    { user_id: data.user_id, user_unique_key: data.user_unique_key }];
  await handleChatService.controlChannelPushes(logHandler, {
    userCCPushList,
    app_secret_key: businessInfo.fugu_secret_key,
    notification_type: videoPayload.notificationType, usersUnreadNotificationCount: {}
  });
}

function handlePublish(opts, callback) {
  const logHandler = {
    uuid: UniversalFunc.generateRandomString(10),
    apiModule: 'chathandler',
    apiHandler: 'handlePublish'
  };
  if (!callback) {
    callback = function () {
    };
  }
  Promise.coroutine(function* () {
    const { channel } = opts;


    const data = utils.cloneObject(opts.data);
    data.is_socket_io = opts.is_socket_io;
    // if (opts.socket_id) {
    //  let socket_user_id = yield redis.get(`socket` + opts.socket_id);
    //   if (socket_user_id && socket_user_id != data.user_id) {
    //    console.log('>>> Invalid User >>>',)
    //    throw new Error('Invalid User.')
    //  }
    // }
    // for server time
    data.date_time = new Date();

    if (data.old_dashboard) {
      throw RESP.ERROR.eng.REDIRECT_ERROR;
    }
    logger.trace(logHandler, 'Data in handlePublish', opts);

    if (data.server_push) {
      logger.debug(logHandler, 'Server push');
      return {};
    }

    if (!data.muid) {
      data.muid = UniversalFunc.getRandomString(10);
    }

    if (!channel) {
      logger.trace(logHandler, 'Invalid data in socket publish ', { channel });
      return {};
    }

    if (data.type == 100) {
      logger.error(logHandler, 'should not listen');
      return {};
    }
    if (!data.user_id) {
      logger.error(logHandler, 'Invalid User Id');
      throw new Error('Invalid user Id');
    }

    // validate user
    let userInfo = yield userService.getUserDetail(logHandler, { user_id: data.user_id });
    if (_.isEmpty(userInfo) || (userInfo[0].status == constants.userStatus.DISABLED && (userInfo[0].user_type == constants.userType.CUSTOMER || userInfo[0].user_type == constants.userType.GUEST))) {
      logger.error(logHandler, 'User doesssss not exist');
      throw RESP.ERROR.eng.USER_NOT_FOUND;
    }
    userInfo = userInfo[0];
    if (data.message_type != constants.messageType.VIDEO_CALL && opts.socket_id) {
      // let socket_user_id = yield redis.get(`socket` + opts.socket_id);
      const socket_user_id = opts.socket_id;
      if (socket_user_id && socket_user_id != data.user_id) {
        let options = {
          url: `https://socket-new.fugu.chat/api/webhook?token=15d87734cc70ef16f2cc37d81811aa5221d84eb382edf5b115a914774af58d33`,
          method: 'POST',
          json: {
            data: {
              message: `*USERID IN DATA:* ` + data.user_id + `\n*Socket id connected with*\n Socket id : ${opts.socket_id}\n User id : ${socket_user_id}\n Full name : ${userInfo.full_name}\n workspace id : ${userInfo.workspace_id}`
            }
          }
        };
        utilityService.sendHttpRequest(logHandler, options);
        throw new Error('Invalid User.')
      }
    }

    (data.message_type == constants.messageType.IMAGE || data.message_type == constants.messageType.VIDEO || data.message_type == constants.messageType.FILE_ATTACHMENT) && !data.message ? data.message = '' : 0;

    // mark notifications read for user subscription to /hash(user_unique_key)
    if (data.notification_type == notificationBuilder.notificationType.READ_UNREAD_NOTIFICATION) {
      if (!data.notification_id) {
        return {};
      }
      // logger.debug(logHandler, 'read all event of Notification ', { user_unique_key: userInfo.user_unique_key, notification_id: data.notification_id });
      const options = {
        update_fields: {
          read_at: new Date()
        },
        where_clause: {
          notification_id: data.notification_id,
          user_unique_key: userInfo.user_unique_key
        }
      };
      notifierService.updateNotification(logHandler, options);
      userService.decrementUserNotificationUnreadCount(logHandler, { user_unique_keys: [userInfo.user_unique_key] });
      return {};
    }


    // validate channel
    const channel_var = channel.split('/');
    const channel_id = parseInt(channel_var[1]);
    const message_type = data.message_type || 1;
    if (!channel_id || channel_id < 0) {
      logger.trace(logHandler, `invalid channel_id : ${channel_id}`);
      return {};
    }
    // validate channel
    let channelInfo = yield channelService.getInfo(logHandler, { channel_id });
    if (_.isEmpty(channelInfo)) {
      logger.error(logHandler, 'ERROR', 'Channel not found');
      throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
    }
    channelInfo = channelInfo[0];

    if (channelInfo.status == constants.status.DISABLE) {
      throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
    }

    if (userInfo.user_properties) {
      let userProperties = JSON.parse(userInfo.user_properties);

      if (userProperties.hasOwnProperty('is_one_to_one_chat_allowed') && !userProperties.is_one_to_one_chat_allowed && channelInfo.chat_type == constants.chatType.O20_CHAT && !data.video_call_type) {
        throw RESP.ERROR.eng.ACCESS_DENIED;
      }

      if (userProperties.hasOwnProperty('suspend_call') && userProperties.suspend_call && data.video_call_type == constants.videoCallResponseTypes.START_CALL) {
        throw RESP.ERROR.eng.ACCESS_DENIED;
      }
    }

    /*
    if(userInfo.user_type == constants.userType.GUEST) {
      let guestChannels = yield userService.getGuestData(logHandler, { user_id : userInfo.user_id });
      if(guestChannels.length ) {
        if(channelInfo.chat_type != constants.chatType.O20_CHAT && channelInfo.chat_type != constants.chatType.FUGU_BOT) {
          console.log("...............")
          if(guestChannels[0].channel_ids_to_connect) {
            guestChannels[0].channel_ids_to_connect = JSON.parse(guestChannels[0].channel_ids_to_connect);
            if(!guestChannels[0].channel_ids_to_connect.includes(channel_id)) {
              throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
            }
          } else {
            throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
          }
        } else {
          if(guestChannels[0].user_ids_to_connect) {
            let otherUsers = yield channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id : channelInfo.channel_id, user_id : userInfo.user_id });
            guestChannels[0].user_ids_to_connect = JSON.parse(guestChannels[0].user_ids_to_connect);
            if(!guestChannels[0].user_ids_to_connect.includes(otherUsers[0].user_id)) {
              throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
            }
          } else {
            throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
          }
        }
      }
    }

*/

    let labelInfo;
    if (channelInfo.label_id) {
      labelInfo = yield channelService.getLabelById(logHandler, channelInfo.label_id);
      if (!_.isEmpty(labelInfo)) {
        labelInfo = labelInfo[0];
      }
    }

    if (userInfo.status == constants.userStatus.DISABLE) {
      logger.error(logHandler, 'User has been deactivated! ', userInfo);
      throw RESP.ERROR.eng.USER_BLOCKED;
    }

    if (userInfo.workspace_id != channelInfo.workspace_id) {
      const error = {
        user_id: userInfo.user_id,
        user_business_id: userInfo.business_id,
        channel_id: channelInfo.channel_id,
        channel_business_id: channelInfo.business_id
      };
      logger.error(logHandler, "user and channel don't belong to same business ", error);
      throw RESP.ERROR.eng.INVALID_DATA;
    }

    if (userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.FUGU_BOT || userInfo.user_type == constants.userType.ATTENDANCE_BOT || userInfo.user_type == constants.userType.SCRUM_BOT || userInfo.user_type == constants.userType.CONFERENCE_BOT) {
      const userExistsInChannel = yield channelService.getUserFromUserToChannel(logHandler, userInfo.user_id, channelInfo.channel_id);
      if (_.isEmpty(userExistsInChannel) && !(userInfo.user_type == constants.userType.SCRUM_BOT)) {
        logger.error(logHandler, 'user does not belong to this channel', userInfo, channelInfo);
        throw RESP.ERROR.eng.INVALID_DATA;
      }
      if (channelInfo.channel_properties) {
        channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
        if (channelInfo.channel_properties.only_admin_can_message && userExistsInChannel[0].role == constants.userRole.USER) {
          throw RESP.ERROR.eng.USER_BLOCKED;
        }
      }
      if (userExistsInChannel[0].status == constants.userStatus.SUSPENDED) {
        throw RESP.ERROR.eng.INVALID_DATA;
      }
    }

    // mark messages read for user
    if (data.notification_type == notificationBuilder.notificationType.READ_ALL) {
      logger.trace(logHandler, 'read all event ', { user_id: userInfo.user_id, channel_id: channelInfo.channel_id });
      const userbusinessInfo = yield businessService.getInfo(logHandler, { workspace_id: channelInfo.workspace_id });
      data.app_secret_key = userbusinessInfo.fugu_secret_key;
      io.sockets.in(utils.getSHAOfObject(userInfo.user_unique_key)).emit('read_all', data);
      io.sockets.in(channelInfo.channel_id).emit('read_all', data);
      const payload = {
        user_id: userInfo.user_id, workspace_id: channelInfo.workspace_id, business_id: channelInfo.business_id, channel_id: channelInfo.channel_id, mark_all_read: true, chat_type: channelInfo.chat_type
      };


      conversationService.syncMessageHistory(logHandler, payload);
      const syncPayload = {
        channelInfo: payload.channelInfo,
        userInfo: payload.userInfo,
        businessInfo: userbusinessInfo,
        user_unique_keys: [userInfo.user_unique_key],
        channel_id: channelInfo.channel_id,
        decrement_count: true
      };
      notifierService.syncNotificationCount(logHandler, syncPayload);
      return {};
    }

    if (isValidMessage(data) && userReactionValidation(logHandler, data)) {
      logger.error(logHandler, 'SENDING MESSAGE AND REACTION AND COMMENT');
      return;
    }

    // process message
    if (isValidMessage(data)) {
      const response = {};
      const messageInfo = {
        user_id: userInfo.user_id
      };
      logger.trace(logHandler, { valid_message: data });
      const opts = {};
      opts.workspace_id = userInfo.workspace_id;
      opts.user_id = data.user_id;
      opts.channel_id = channel_id;
      opts.channel_name = channelInfo.channel_name;
      opts.full_name = userInfo.full_name;
      opts.data = data;
      opts.muid = data.muid;
      opts.thread_muid = data.thread_muid;
      opts.user_type = userInfo.user_type;
      opts.label_id = channelInfo.label_id;
      opts.agent_id = channelInfo.agent_id;
      opts.message_type = message_type;
      opts.message = data.message;


      if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
        try {
          redis.del(constants.promiseHash + channelInfo.channel_id);
        } catch (e) {
          console.error("ERROR WHILE REMOVING MESSAGE NEW HASH", channel_id, ">>>>>>", e)
        }
      }


      const businessInfo = yield businessService.getInfo(logHandler, { workspace_id: channelInfo.workspace_id });
      businessInfo.app_secret_key = businessInfo.fugu_secret_key;
      businessInfo.business_id = businessInfo.workspace_id;
      // check if message is thread message;
      if (businessInfo.status == constants.status.DISABLED) {
        throw new Error("Workspace Disabled.")
      }


      if (message_type == constants.messageType.VIDEO_CALL) {
        const logHandler = {
          uuid: UniversalFunc.generateRandomString(10),
          apiModule: 'chathandler',
          apiHandler: 'video'
        };

        logger.trace(logHandler, 'VIDEO CALL DATA', data);
        if (channelInfo.chat_type != constants.chatType.O20_CHAT) {
          throw RESP.ERROR.eng.CHANNEL_NOT_FOUND;
        }
        if (data.video_call_type == constants.videoCallResponseTypes.START_CALL) {
          const videoState = yield redis.get(data.muid + message_type);
          if (videoState) {
            return {};
          }
        }

        if ((Object.values(constants.videoCallResponseTypes)).includes(data.video_call_type)) {
          if (data.video_call_type == constants.videoCallResponseTypes.VIDEO_ANSWER || data.video_call_type == constants.videoCallResponseTypes.CALL_HUNG_UP || data.video_call_type == constants.videoCallResponseTypes.CALL_REJECTED || data.video_call_type == constants.videoCallResponseTypes.USER_BUSY) {
            redis.setex(data.muid + message_type, constants.videoCallExpirationTime, 1);
          }

          const turnCredentials = yield businessService.getTurnCredentials(logHandler);

          if (data.video_call_type == constants.videoCallResponseTypes.START_CALL || data.video_call_type == constants.videoCallResponseTypes.READY_TO_CONNECT) {
            const error = new Error();
            error.obj = {};
            if (data.turn_creds && (_.isEmpty(turnCredentials) || turnCredentials[0].credential != data.turn_creds.credential)) {
              turnCredentials[0].ice_servers = utils.jsonParse(turnCredentials[0].ice_servers);
              error.obj.statusCode = 413;
              error.obj.data = turnCredentials[0];
              throw error.obj;
            } else if (!data.turn_creds) {
              throw new Error('turn credential not found.');
            }
          } else if (data.video_call_type == constants.videoCallResponseTypes.SWITCH_TO_CONFERENCE) {
            const options = {
              url: config.get('socketBaseUrl') + constants.API_END_POINT.INVITE_TO_CONFERENCE,
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                app_secret_key: businessInfo.app_secret_key,
                device_type: 1,
                app_version: 1
              },
              json: {
                invite_link: data.invite_link,
                en_user_id: data.en_user_id,
                invite_user_ids: data.invite_user_ids,
                is_audio_conference: data.is_audio_conference
              }
            };
            utilityService.sendHttpRequest(logHandler, options);
          }


          const users = yield channelService.getUsersParticipatedInChannel(logHandler, { channel_id: channelInfo.channel_id });

          const userIds = users.map(x => x.user_id);

          if (data.video_call_type == constants.videoCallResponseTypes.START_CALL || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS) {
            let usersToDevicePayload = {
              userIds: userIds,
              user_id: userInfo.user_id,
              remove_web: true
            }
          }


          const videoPayload = {
            message: `${userInfo.full_name} is calling you...`,
            muid: data.muid,
            userInfo,
            channelInfo,
            businessInfo,
            isSilent: data.is_silent,
            call_type: data.call_type,
            video_call_type: data.video_call_type,
            userIds,
            sdp: data.sdp,
            messageType: message_type,
            rtc_candidate: data.rtc_candidate,
            user_thumbnail_image: userInfo.user_image,
            is_screen_share: data.is_screen_share || false,
            invite_link: data.invite_link,
            usersUnreadNotificationCount: {},
            hungup_type: data.hungup_type || "DEFAULT",
            reason: data.reason,
            stop_screen_share: data.stop_screen_share,
            refresh_call: data.refresh_call
          };

          if (data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE && !data.is_silent) {
            let insertObj = {
              user_id: userInfo.user_id,
              calling_link: data.invite_link,
              device_details: JSON.stringify({ start_call: data.device_payload }),
            }
            yield conversationService.insertCallingDetails(logHandler, insertObj)
          }
          if (data.call_type == constants.callTypes.AUDIO) {
            videoPayload.notificationType = notificationBuilder.notificationType.AUDIO_CALL;
          } else {
            videoPayload.notificationType = notificationBuilder.notificationType.VIDEO_CALL;
          }

          if (data.video_call_type == constants.videoCallResponseTypes.READY_TO_CONNECT_CONFERENCE_IOS || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.READY_TO_CONNECT_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.HUNGUP_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.OFFER_CONFERENCE ||
            data.video_call_type == constants.videoCallResponseTypes.USER_BUSY_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.REJECT_CONFERENCE) {
            videoPayload.notificationType = notificationBuilder.notificationType.CALLING_CONFERENCE;
          }

          if (videoPayload.notificationType == notificationBuilder.notificationType.CALLING_CONFERENCE || videoPayload.notificationType == notificationBuilder.notificationType.HUNGUP_CONFERENCE) {
            let callingDetails = yield conversationService.getCallingDetails(logHandler, { calling_link: data.invite_link });
            if (callingDetails.length && callingDetails[0].user_count > 2) {
              return {};
            }
          }
          if (data.device_payload) {
            videoPayload.device_id = data.device_id || data.device_payload.device_id;
            videoPayload.device_type = data.device_payload.device_type;
          }

          if (data.video_call_type == constants.videoCallResponseTypes.READY_TO_CONNECT || data.video_call_type == constants.videoCallResponseTypes.START_CALL || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.READY_TO_CONNECT_CONFERENCE) {
            let deviceIds;
            const devices = yield redis.get(data.muid);
            if (data.video_call_type == constants.videoCallResponseTypes.START_CALL || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE_IOS) {
              if (devices) {
                videoPayload.skip_user_devices = JSON.parse(devices);
              }
            } else {
              if (!devices) {
                deviceIds = [data.device_payload.device_id];
              } else {
                deviceIds = JSON.parse(devices);
                deviceIds.push(data.device_payload.device_id);
              }
              redis.setex(data.muid, constants.videoCallExpirationTime, JSON.stringify(deviceIds));
            }
          }

          if ((data.video_call_type == constants.videoCallResponseTypes.START_CALL || data.video_call_type == constants.videoCallResponseTypes.START_CONFERENCE) && !data.is_silent) {
            try {
              opts.status = constants.userConversationStatus.CALL_MISSED;
              data.message = constants.videoMessageForOldApps;
              opts.call_type = data.call_type;

              let callTurn = ``

              if (data.turn_creds && data.turn_creds.ice_servers) {
                callTurn = data.turn_creds.ice_servers.turn[0]
              } else if (data.turn_creds && data.turn_creds.turn) {
                callTurn = data.turn_creds.turn[0];
              }

              let messageDetails = yield conversationService.insertUsersConversation(logHandler, opts);
              if (messageDetails.insertId) {
                try {
                  yield channelService.updateChannelHistory(logHandler, { message_id: messageDetails.insertId, user_id: opts.user_id, channel_id: opts.channel_id });
                } catch (e) {
                  logger.error(logHandler, 'Something went wrong');
                }
              }

            } catch (e) {
              if (e && e.code == 'ER_DUP_ENTRY') {
                logger.error(logHandler, 'DUPLICATE ENTRY ' + opts.muid);
                throw RESP.ERROR.eng.DUPLICATE_ENTRY;
              }
              logger.error(logHandler, 'Something went wrong');
              throw RESP.ERROR.eng.DEFAULT;
            }
          }


          if (data.video_call_type == constants.videoCallResponseTypes.VIDEO_ANSWER || data.video_call_type == constants.videoCallResponseTypes.CALL_HUNG_UP || data.video_call_type == constants.videoCallResponseTypes.ANSWER_CONFERENCE || data.video_call_type == constants.videoCallResponseTypes.HUNGUP_CONFERENCE) {
            const result = yield conversationService.getMessageByMuid(logHandler, { channel_id: channelInfo.channel_id, muid: data.muid });
            if (!_.isEmpty(result)) {
              const updateObj = {
                message_id: result[0].id
              };

              const messageData = {};
              utils.addAllKeyValues(utils.jsonToObject(logHandler, result[0].message), messageData);
              if (data.video_call_type == constants.videoCallResponseTypes.CALL_HUNG_UP || data.video_call_type == constants.videoCallResponseTypes.HUNGUP_CONFERENCE) {
                if (messageData.answer_call_device_id != data.device_payload.device_id && messageData.answer_by_user_id == userInfo.user_id) {
                  return {};
                }
                messageData.end_call_device_device_id = data.device_payload.device_id;
                if (!messageData.video_call_start_time) {
                  const pushDetails = yield redis.get(data.muid + notificationBuilder.notificationType.MISSED_CALL);
                  if (!pushDetails) {
                    yield redis.setex(data.muid + notificationBuilder.notificationType.MISSED_CALL, 3, 1);
                  } else {
                    return {};
                  }
                  const missedCallPayload = utils.cloneObject(videoPayload);
                  missedCallPayload.message = `You missed call from ${userInfo.full_name}`;
                  missedCallPayload.isSilent = false;
                  missedCallPayload.notificationType = notificationBuilder.notificationType.MISSED_CALL;
                  if (data.call_type == constants.callTypes.AUDIO) {
                    missedCallPayload.message = missedCallPayload.message.replace('call', 'an audio call');
                  } else {
                    missedCallPayload.message = missedCallPayload.message.replace('call', 'a video call');
                  }
                  if (data.hungup_type != "DISCONNECTED") {
                    notifierService.notifyUsers(logHandler, missedCallPayload);
                  }
                }
                messageData.video_call_duration = utils.getTimeDifference(messageData.video_call_start_time, new Date(), 'seconds');
                if(data.message_type == constants.messageType.VIDEO_CALL && result[0].status ==  constants.userConversationStatus.CALL_ANSWERED && messageData.answer_by_user_id){
                  yield channelService.updateChannelHistory(logHandler, {message_id: result[0].id, user_id: messageData.answer_by_user_id, channel_id: opts.channel_id});
                }

                let turn = ""

                if (data.turn_creds && data.turn_creds.ice_servers) {
                  turn = data.turn_creds.ice_servers.turn[0]
                } else if (data.turn_creds && data.turn_creds.turn) {
                  turn = data.turn_creds.turn[0];
                }
                let username = '';
                if (data.turn_creds) {
                  username = data.turn_creds.username;
                }
                data.reason ? messageData.reason = data.reason : 0;
              } else {
                messageData.answer_call_device_id = data.device_payload.device_id;
                messageData.answer_by_user_id = userInfo.user_id;
                messageData.video_call_start_time = moment(new Date());
                updateObj.status = constants.userConversationStatus.CALL_ANSWERED;
              }
              updateObj.message = utils.objectToJson(logHandler, messageData);
              conversationService.updateInfo(logHandler, updateObj);
            }
          }

          notifierService.notifyUsers(logHandler, videoPayload);


          if (data.video_call_type == constants.videoCallResponseTypes.VIDEO_ANSWER || (data.video_call_type == constants.videoCallResponseTypes.START_CALL && !data.is_silent)) {
            conversationService.syncMessageHistory(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id, workspace_id: businessInfo.workspace_id});
          }
        }
        return {};
      }

      if (data.message && (message_type == constants.messageType.MESSAGE || message_type == constants.messageType.IMAGE || message_type == constants.messageType.VIDEO)) {
        const messageText = cheerio.load(data.formatted_message || data.message);
        opts.searchable_message = messageText.text();
        if (!_.isEmpty(data.tagged_users) || data.tagged_all) {
          opts.searchable_encrypted_message = opts.searchable_message;
        }
      }


      data.tagged_users ? opts.data.tagged_user_ids = Array.from(new Set(data.tagged_users)) : 0;
      data.tagged_all ? opts.data.tagged_all = data.tagged_all : 0;
      if (data.is_thread_message) {
        let messageData = yield conversationService.getMessageUserInfo(logHandler, { muid: data.muid });
        if (_.isEmpty(messageData)) {
          logger.error(logHandler, 'INVALID MUID', data);
          throw RESP.ERROR.eng.INVALID_MUID;
        }
        messageData = messageData[0];

        if (messageData.message_state == constants.status.DISABLE) {
          logger.error(logHandler, 'Message has been deleted!');
          throw RESP.ERROR.eng.MESSAGE_DELETED;
        }

        opts.message_id = messageData.id;
        opts.thread_muid = data.thread_muid;
        messageInfo.thread_muid = messageData.thread_muid;
        messageInfo.thread_owner_id = messageData.user_id;
        messageInfo.thread_owner_name = messageData.full_name;
        messageInfo.is_thread_message = data.is_thread_message;

        try {
          const threadMessage = yield conversationService.insertUserThreadMessage(logHandler, opts);
          response.thread_message_id = threadMessage.insertId;
          data.thread_message_id = threadMessage.insertId;
          if (userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.GUEST) {
            esClient.index({
              index: 'thread_user_messages',
              id: threadMessage.insertId,
              type: 'message',
              body: {
                thread_message_id: threadMessage.insertId,
                message_id: messageData.id,
                muid: messageData.muid,
                thread_muid: data.thread_muid,
                user_id: userInfo.user_id,
                image_url: data.image_url,
                thumbnail_url: data.thumbnail_url,
                message_type: opts.message_type,
                message: opts.searchable_message,
                channel_id: channelInfo.channel_id,
                date_time: new Date()
              }
            }, function (err, resp, status) {

            });
          }
        } catch (e) {
          if (e && e.code == 'ER_DUP_ENTRY') {
            logger.error(logHandler, 'ES DUPLICATE ENTRY ' + opts.muid);
            throw RESP.ERROR.eng.DUPLICATE_ENTRY;
          }
          logger.error(logHandler, 'Something went wrong');
          throw RESP.ERROR.eng.DEFAULT;
        }

        messageInfo.thread_message_id = opts.thread_message_id;

        let message = utils.jsonParse(messageData.message);
        data.user_unique_key = userInfo.user_unique_key;
        if (userInfo.image_set) {
          let userImageData = JSON.parse(userInfo.image_set);
          data.user_image = userImageData.image_100x100;
          data.user_image_50x50 = userImageData.image_50x50 ? userImageData.image_50x50 : "";
        }
        // insert or update thread message info
        io.sockets.in(channelInfo.channel_id).emit('thread_message', data);
        yield conversationService.insertOrUpdateUserToMessage(logHandler, { message_id: opts.message_id, user_id: userInfo.user_id, status: constants.status.ENABLE });
        yield conversationService.insertOwnerIntoUserToMessage(logHandler, { message_id: opts.message_id, user_id: messageInfo.thread_owner_id });

        if (!message.thread_message) {
          message.thread_message = true;
          message = utils.objectToJson(logHandler, message);
          yield conversationService.updateInfo(logHandler, { message_id: opts.message_id, message });
        }
      } else {
        let insertMessage = [];

        if (!data.button_action || data.button_action == constants.buttonActionTypes.MESSAGE_PUBLISH) {
          try {
            opts.status = constants.userConversationStatus.MESSAGE;
            data.message_type == constants.messageType.POLL ? opts.data.message = constants.pollMessageForOldApps : 0;
            insertMessage = yield conversationService.insertUsersConversation(logHandler, opts);
          } catch (e) {
            if (e && e.code == 'ER_DUP_ENTRY') {
              logger.error(logHandler, 'DUPLICATE ENTRY ' + opts.muid);
              throw RESP.ERROR.eng.DUPLICATE_ENTRY;
            }
            logger.error(logHandler, 'Something went wrong');
            throw RESP.ERROR.eng.DEFAULT;
          }

          if (userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.GUEST) {
            esClient.index({
              index: 'users_conversation',
              id: insertMessage.insertId,
              type: 'message',
              body: {
                id: insertMessage.insertId,
                muid: opts.muid,
                workspace_id: opts.workspace_id,
                message: opts.searchable_message,
                image_url: data.image_url,
                thumbnail_url: data.thumbnail_url,
                channel_id: channelInfo.channel_id,
                user_id: userInfo.user_id,
                message_type: opts.message_type,
                chat_type: channelInfo.chat_type,
                date_time: new Date()
              }
            }, function (err, resp, status) {

            });
          }
          opts.message_id = insertMessage.insertId;
          messageInfo.message_id = insertMessage.insertId;
          // update user message history
          channelService.insertOrUpdateChannelHistory(logHandler, {
            channel_id: channelInfo.channel_id,
            user_id: userInfo.user_id,
            message_id: insertMessage.insertId
          });
        }


        if (data.message_type == constants.messageType.POLL) {
          data.message = 'Created a poll.';
          data.message_poll = true;
          userMessagePoll(logHandler, userInfo, channelInfo, data);
        }


        // let mqMessageObject = rabbitMQBuilder.getObject(rabbitMQBuilder.mqMessageType.MESSAGE);
        // mqMessageObject.business_id = businessInfo.business_id;
        // mqMessageObject.channel_id = channelInfo.channel_id;
        // mqMessageObject.message = data.message;
        // mqMessageObject.user_id = userInfo.user_id;
        // mqMessageObject.user_type = userInfo.user_type;
        // mqMessageObject.date_time = new Date();
        // dispatcherService.archiveMessage(logHandler, mqMessageObject);
      }

      if ((userInfo.user_type == constants.userType.CUSTOMER || userInfo.user_type == constants.userType.GUEST)) {
        const otherUsers = yield channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: userInfo.user_id });
       if (!_.isEmpty(otherUsers)) {
         if (otherUsers[0].user_type == constants.userType.ATTENDANCE_BOT) {
            data.bot_message = opts.searchable_message;
            data.bot_user_id = otherUsers[0].user_id;
            setTimeout(() => {
              botController.attendanceBot(logHandler, data, channelInfo, userInfo, businessInfo);
            }, constants.timeOutForAttendanceInSeconds);
          } else if (otherUsers[0].user_type == constants.userType.FUGU_BOT) {
            data.bot_user_id = otherUsers[0].user_id;
            botController.fuguBot(logHandler, data, userInfo, channelInfo, businessInfo);
          } else if (otherUsers[0].user_type == constants.userType.SCRUM_BOT) {
            data.bot_user_id = otherUsers[0].user_id;
            botController.scrumBot(logHandler, data, userInfo, channelInfo, businessInfo);
          } else if (otherUsers[0].user_type == constants.userType.CONFERENCE_BOT) {
            data.bot_user_id = otherUsers[0].user_id;
            botController.conferenceBot(logHandler, data, userInfo, channelInfo, businessInfo);
          } else if (otherUsers[0].user_type == constants.userType.HRM_BOT) {
           data.bot_user_id = otherUsers[0].user_id;
           data.bot_message = opts.searchable_message;
           data.hrm_bot_type = otherUsers[0].user_type;
           hrmController.hrmBot(logHandler, data, channelInfo, userInfo, businessInfo);
         }
      }
    }
      messageInfo.message_id = opts.message_id;
      messageInfo.message_type = message_type;
      messageInfo.message = data.formatted_message || data.message;
      messageInfo.muid = data.muid;
      messageInfo.tagged_users = data.tagged_users;
      response.message_id = messageInfo.message_id;
      messageInfo.thread_muid = opts.thread_muid;
      messageInfo.tagged_all = data.tagged_all;
      messageInfo.image_url = data.image_url;
      messageInfo.thumbnail_url = data.thumbnail_url;
      messageInfo.question = data.question;
      messageInfo.comment = data.comment;
      messageInfo.multiple_select = data.multiple_select;
      messageInfo.expire_time = data.expire_time;
      messageInfo.poll_options = data.poll_options;
      messageInfo.url = data.url;
      messageInfo.file_size = data.file_size;
      messageInfo.custom_actions = data.custom_actions;
      messageInfo.default_text_field = data.default_text_field;
      messageInfo.file_name = data.file_name;
      messageInfo.document_type = data.document_type;
      messageInfo.is_web = data.is_web;
      messageInfo.is_video_conference = data.is_video_conference || false;
      messageInfo.invite_link = data.invite_link;
      messageInfo.is_audio_conference = data.is_audio_conference;
      messageInfo.caller_text = data.caller_text;
      messageInfo.image_width = data.image_width;
      messageInfo.image_height = data.image_height;
      messageInfo.image_url_100x100 = data.image_url_100x100;
      messageInfo.sender_user_id = data.sender_user_id;
      messageInfo.hrm_bot_type = data.hrm_bot_type || null;

      if (data.device_token) {
        const devicePayload = {};
        devicePayload.user_id = opts.user_id;
        devicePayload.device_id = data.device_payload.device_id;
        devicePayload.token = data.device_token;
        devicePayload.device_type = data.device_payload.device_type;

        data.device_payload.device_details = commonFunctions.isString(data.device_payload.device_details) ? commonFunctions.jsonParse(data.device_payload.device_details) : data.device_payload.device_details;
        devicePayload.device_details = utils.objectToJson(logHandler, data.device_payload.device_details);
        data.voip_token ? devicePayload.voip_token = data.voip_token : 0;
        userService.insertUserDeviceDetails(logHandler, devicePayload);
        // userService.updateDeviceInfo(logHandler, opts, userInfo);
      }
      handleChat.handleChat(userInfo, channelInfo, businessInfo, messageInfo, labelInfo);
      return response;
    }

    if (userReactionValidation(data)) {
      const redisHash = 1;
      const redisKey = data.muid + data.user_id;
      const redisResult = yield redis.get(redisKey);

      if (!redisResult) {
        yield redis.setex(redisKey, constants.redisExpireTime, redisHash);
      } else {
        throw RESP.ERROR.eng.TOO_MANY_ATTEMPTS;
      }

      if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
        try {
          redis.del(constants.promiseHash + channelInfo.channel_id);
        } catch (e) {
          console.error("ERROR WHILE REMOVING MESSAGE NEW HASH", channelInfo.channel_id, ">>>>>>", e)
        }
      }


      logger.debug(logHandler, 'userReactionValidation', { userReaction: data });

      // to save user reaction
      const messageData = yield conversationService.getMessageByMuid(logHandler, {
        channel_id: data.channel_id,
        muid: data.muid
      });

      if (_.isEmpty(messageData)) {
        logger.error(logHandler, 'INVALID MUID', data.muid);
        throw RESP.ERROR.eng.INVALID_MUID;
      }

      if (messageData[0].message_state == constants.status.DISABLE) {
        logger.error(logHandler, 'Cannot React');
        throw RESP.ERROR.eng.MESSAGE_DELETED;
      }

      const opts = {};
      if (data.is_thread_reaction) {
        const threadMessageData = yield conversationService.getThreadMessageByThreadMuid(logHandler, {
          thread_muid: data.thread_muid
        });

        if (_.isEmpty(threadMessageData)) {
          logger.error(logHandler, 'INVALID THREAD MUID', data.muid);
          throw RESP.ERROR.eng.INVALID_THREAD_MUID;
        }

        if (threadMessageData[0].message_state == constants.status.DISABLE) {
          logger.error(logHandler, 'Cannot React');
          throw RESP.ERROR.eng.MESSAGE_DELETED;
        }

        io.sockets.in(data.channel_id).emit('reaction', data);
        opts.user_id = data.user_id;
        opts.thread_message_id = threadMessageData[0].thread_message_id;
        opts.user_reaction_emoji = data.user_reaction_emoji;
        yield conversationService.insertOrUpdateUserThreadMessageReaction(logHandler, opts);
        return {};
      }

      io.sockets.in(data.channel_id).emit('reaction', data);

      opts.user_id = data.user_id;
      opts.message_id = messageData[0].id;
      opts.user_reaction = data.user_reaction_emoji;
      yield conversationService.insertOrUpdateUserMessageReaction(logHandler, opts);
      return {};
    }

    if (userMessagePollValidation(data)) {
      data.user_image = userInfo.user_image;
      yield userMessagePoll(logHandler, userInfo, channelInfo, data);
    }

    return {};
  })().then((data) => {
    callback(null, data);
  }, (error) => {
    // logger.error(logHandler, 'ERROR WHILE SENDING MESSAGE', error);
    callback(error);
  });
}

function isValidMessage(data) {
  if ((data.message == '') && (data.message_type == 1 || data.message_type == 3)) { return false; }
  if (utils.isString(data.message) && data.message.trim() == '' && (data.message_type == 1 || data.message_type == 3)) { return false; }
  if (data.user_reaction_emoji || data.user_reaction_emoji == '') { return false; }
  if (data.message_poll) { return false; }
  return true;
}


function userReactionValidation(data) {
  if (data.user_reaction_emoji == '') { return true; }

  if (data.user_reaction_emoji) {
    // let validEmojiExp = constants.emojiRegex;
    // return validEmojiExp.test(data.user_reaction_emoji);
    return true;
  }
  return false;
}

function userMessagePollValidation(data) {
  if (data.message_poll) {
    return true;
  }
  return false;
}

function userMessagePoll(logHandler, userInfo, channelInfo, data) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      logger.trace(logHandler, 'userMessagePoll', data);

      if ([constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP].includes(channelInfo.chat_type)) {
        try {
          redis.del(constants.promiseHash + channelInfo.channel_id);
        } catch (e) {
          console.error("ERROR WHILE REMOVING MESSAGE POLL HASH", channelInfo.channel_id, ">>>>>>", e)
        }
      }

      let messageData = yield conversationService.getMessageByMuid(logHandler, { channel_id: channelInfo.channel_id, muid: data.muid });

      if (_.isEmpty(messageData)) {
        logger.error(logHandler, 'INVALID MUID', data.muid);
        throw RESP.ERROR.eng.INVALID_MUID;
      }

      messageData = messageData[0];

      if (data.poll_options) {
        yield conversationService.insertMessagePollOptions(logHandler, { message_id: messageData.id, poll_options: data.poll_options });
      } else {
        utils.addAllKeyValues(utils.jsonToObject(logHandler, messageData.message), messageData);

        const options = {
          message_id: messageData.id,
          user_id: userInfo.user_id,
          puid: data.puid,
          is_voted: data.is_voted,
          multiple_select: messageData.multiple_select,
          is_expired: messageData.is_expired
        };

        const timeDifference = utils.getTimeDifference(messageData.created_at, new Date(), 'seconds');

        if (messageData.expire_time < timeDifference) {
          if (!messageData.is_expired) {
            conversationService.updatePollExpired(logHandler, { id: messageData.id, is_expired: true });
          }
          logger.error(logHandler, 'POLL EXPIRED', data);
          throw RESP.ERROR.eng.POLL_EXPIRED;
        }

        const redisHash = 1;
        const redisKey = data.muid + data.user_id;
        const redisResult = yield redis.get(redisKey);

        if (!redisResult) {
          yield redis.setex(redisKey, constants.redisExpireTime, redisHash);
        } else {
          throw RESP.ERROR.eng.TOO_MANY_ATTEMPTS;
        }

        io.sockets.in(channelInfo.channel_id).emit('poll', data);

        const userPollInfo = yield conversationService.getUserPollInfo(logHandler, options);


        if (_.isEmpty(userPollInfo) || messageData.multiple_select) {
          yield conversationService.insertUserMessagePoll(logHandler, options);
        } else {
          yield conversationService.updateUserMessagePoll(logHandler, options);
        }
      }
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

function onSocketConnectLastSeenEvent(user_id, socket_id) {
  if (!user_id || user_id < 1) {
    return;
  }
  updatePresenceTimeStamp({
    timestamp: +new Date(),
    user_id: +user_id
  });
  io.sockets.in(user_id).emit('presence', {
    user_id: +user_id,
    type: 'available'
  });

}

async function onSocketDisconnectLastSeenEvent(user_id) {
  // check if user is online on any other device, if not then send disconnect event
  const userOnline = await handleChat.getSocket({}, commonFunctions.encryptText(user_id));
  if (userOnline && !userOnline.length) {
    presenceDisconnectEvent(user_id);
  }
}

async function updatePresenceTimeStamp(data) {
  const logHandler = {
    uuid: UniversalFunc.generateRandomString(10),
    apiModule: 'chat',
    apiHandler: 'updateLastSeen'
  };
  userService.updateLastSeen(logHandler, data);
}

async function presenceDisconnectEvent(user_id) {
  const data = {
    user_id,
    timestamp: +(new Date())
  }
  io.sockets.in(user_id).emit('presence', {
    user_id,
    type: 'unavailable',
    timestamp: data.timestamp
  });
  updatePresenceTimeStamp(data);
  redis.setex(`lastSeen#${user_id}`, constants.lastSeenExpirationTime, data.timestamp);
}

async function getUserPresence(userId, logHandler) {
  if (!userId) {
    return;
  }
  try {
    const userOnline = await handleChat.getSocket(logHandler, commonFunctions.encryptText(userId));
    if (userOnline && userOnline.length) {
      io.sockets.in(userId).emit('presence', {
        user_id: +userId,
        type: 'available'
      });
    } else {
      const lastSeenRedisData = await redis.get(`lastSeen#${userId}`);
      if (lastSeenRedisData && lastSeenRedisData.length) {
        io.sockets.in(userId).emit('presence', {
          user_id: +userId,
          type: 'unavailable',
          timestamp: +lastSeenRedisData
        });
      } else {
        const logHandler = {
          uuid: UniversalFunc.generateRandomString(10),
          apiModule: 'chat',
          apiHandler: 'getLastSeen'
        };
        const result = await userService.getUserLastSeen(logHandler, { user_id: userId });

        if (result.length && result[0].last_seen) {
          redis.setex(`lastSeen#${userId}`, constants.lastSeenExpirationTime, result[0].last_seen);
          io.sockets.in(userId).emit('presence', {
            user_id: +userId,
            type: 'unavailable',
            timestamp: result[0].last_seen
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
