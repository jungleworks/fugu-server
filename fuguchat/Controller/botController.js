const _              = require('underscore');
const Promise        = require('bluebird');
const moment         = require('moment');
const Json2csvParser = require('json2csv').Parser;
const fs             = require('fs');
const md5            = require('MD5');
const Handlebars     = require('handlebars');





const config                  = require('config');
const RESP                    = require('../Config').responseMessages;
const db                      = require('../database');
const { logger }              = require('../libs/pino_logger');
const constants               = require('../Utils/constants');
const UniversalFunc           = require('../Utils/universalFunctions');
const workspaceService        = require('../services/workspace');
const userService             = require('../services/user');
const utils                   = require('../Utils/commonFunctions');
const sendEmail               = require('../Notification/email').sendEmailToUser;
const utilityService          = require('../services/utility');
const UserController          = require('../Controller/userController');
const botservice              = require('../services/bot');
const bot                     = require('../services/bot');
const channelService          = require('../services/channel');
const conversationService     = require('../services/conversation');
const commonFunctions         = require('../Utils/commonFunctions');
const pushNotificationBuilder = require('../Builder/pushNotification');
const notifierService         = require('../services/notifier');




const chathandler = require('../Routes/chathandler');

exports.getApps                                  = getApps;
exports.attendanceBot                            = attendanceBot;
exports.publishMessage                           = publishMessage;
exports.installApps                              = installApps;
exports.createWebhook                            = createWebhook;
exports.getWebhooks                              = getWebhooks;
exports.editWebhook                              = editWebhook;
exports.handleBot                                = handleBot;
exports.publishMessageOnFuguBot                  = publishMessageOnFuguBot;
exports.attendanceCron                           = attendanceCron;
exports.publishMessageOnAttendanceBot            = publishMessageOnAttendanceBot;
exports.fuguCronMessages                         = fuguCronMessages;
exports.fuguBot                                  = fuguBot;
exports.publishMessageOnScrumBot                 = publishMessageOnScrumBot;
exports.scrumBot                                 = scrumBot;
exports.publishMessageOnFuguBotChannel           = publishMessageOnFuguBotChannel;
exports.publishMeetingReminder                   = publishMeetingReminder;
exports.publishMessageOnFuguBotChannelForAndroid = publishMessageOnFuguBotChannelForAndroid;
exports.conferenceBot                            = conferenceBot;
exports.createSelfChat                           = createSelfChat;
exports.publishSecretSanta                       = publishSecretSanta;

function fuguBot(logHandler, payload, userInfo, channelInfo, businessInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let result = [];
      let otherUserInfo = [];
      let content = '';
      let count = true;

      if (payload.button_action && (payload.button_action == constants.leaveState.VIDEO_CONFERENCE || payload.button_data.confirmation_type == constants.confirmationType.DISABLE_WORKSPACE)) {
        trueButtonAction(logHandler, payload, channelInfo);
        if (payload.button_data.confirmation_type == constants.confirmationType.DISABLE_WORKSPACE && payload.button_action == constants.buttonsForLeave.CONFIRM){
          let updatePayload = {
            where_clause: {
              workspace_id: businessInfo.workspace_id
            },
            status: constants.status.DISABLED
          };
          yield workspaceService.updateInfo(logHandler, updatePayload);

        }
        return {};
      }


      logHandler = {
        uuid: logHandler.uuid,
        apiModule: "chathandler",
        apiHandler: "bot"
      };
        // logger.debug(logHandler,">>>>>>>>>>>>>>>>>>",payload)
      let billingPayload = {
        user_id: payload.bot_user_id,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
      };
      payload.message = payload.message.replace(/\//, '');

      let botState = yield bot.getAppState(logHandler, { workspace_id: businessInfo.workspace_id, app_id: constants.AppIdCheck.VIDEO_CONFERENCE });

      if (payload.message.includes('disable workspace') && userInfo.role == constants.userRole.OWNER) {

        let actionPayload = {
          title: `*Are you sure you want to disable workspace?*`,
          confirmation_type: constants.confirmationType.DISABLE_WORKSPACE,
          leave_id: 1,
          is_action_taken: false,
          buttons: [{
            label: constants.buttonsForLeave.CONFIRM, action: constants.buttonsForLeave.CONFIRM, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH
          },
          {
            label: constants.buttonsForLeave.CANCEL, action: constants.buttonsForLeave.CANCEL, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2

        }]
        };

        billingPayload.message_type = constants.messageType.BUTTON,
          billingPayload.message = 'Disable Workspace'
        billingPayload.custom_actions = [actionPayload];
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if(payload.message.includes('salary') && !(userInfo.role == constants.userRole.ADMIN || userInfo.role == constants.userRole.OWNER || userInfo.role == constants.userRole.USER)) {
        billingPayload.message = `You're not authorized to perform this operation 😑`
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if(payload.message.includes('secret santa') && (userInfo.role == constants.userRole.ADMIN || userInfo.role == constants.userRole.OWNER)) {
        billingPayload.message = `https://${businessInfo.full_domain}/${businessInfo.workspace}/apps/details/14?santa=true`
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if (payload.message.includes('export chat') && (userInfo.role == constants.userRole.OWNER)) {
        let options = {
          url: config.get('socketBaseUrl') + constants.API_END_POINT.REQUEST_IMPORT,
          method: 'POST',
          json: {
            en_user_id: utils.encryptText(userInfo.user_id),
            workspace_id: businessInfo.workspace_id
          } ,
          headers: {
            'content-type': 'application/json',
            device_type: "WEB",
            app_version: 1
          },
        };
        if (payload.message.includes('1 month')) {
          options.json.start_date = new Date(new Date().setDate(new Date().getDate() - 31))
          options.json.end_date = new Date()
        }
        let exportRequestResult = yield utilityService.sendHttpRequest(logHandler, options);
        if(exportRequestResult.statusCode == 200) {
          billingPayload.message = `Thank you for reaching out to us!\nYour request for data backup is in the queue and will be sent back to you by ${exportRequestResult.data.expected_date}`
        } else {
          billingPayload.message = exportRequestResult.message
        }
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if (payload.message.includes('employee handbook') && [9,210].includes(businessInfo.business_id)) {
        billingPayload.message       = ``;
        billingPayload.url           = `https://s3.fugu.chat/default/23CDFEuBL0_1580894349081.pdf`;
        billingPayload.image_width   = 435;
        billingPayload.image_height  = 435;
        billingPayload.file_name     = "Employee Handbook.pdf"
        billingPayload.file_size     = "896.70 KB"
        billingPayload.document_type = "file"
        billingPayload.message_type  = constants.messageType.FILE_ATTACHMENT;
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if (payload.message.includes(constants.COVID_19_PDF.TAG_TYPE)) {
        billingPayload.message       = ``;
        billingPayload.url           = constants.COVID_19_PDF.PDF_LINK;
        billingPayload.image_width   = constants.COVID_19_PDF.WIDTH;
        billingPayload.image_height  = constants.COVID_19_PDF.HEIGHT;
        billingPayload.file_name     = constants.COVID_19_PDF.FILE_NAME
        billingPayload.file_size     = constants.COVID_19_PDF.SIZE
        billingPayload.document_type = constants.COVID_19_PDF.DOCUMENT_TYPE
        billingPayload.message_type  = constants.messageType.FILE_ATTACHMENT;
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }


      if (!_.isEmpty(payload.tagged_users) && constants.fuguBotMetric.has(payload.metric)) {
        otherUserInfo  = yield userService.getUserDetail(logHandler, { user_id: payload.tagged_users[0] });
        businessConfig = yield workspaceService.getConfiguration(logHandler, businessInfo.workspace_id);
        if (payload.metric == constants.fuguBotMetricConstant.CONTACT_NUMBER) {
          result = yield bot.getTeamMembers(logHandler, { user_id: payload.tagged_users[0] })
        } else {
          result = yield bot.fuguBot(logHandler, { fugu_user_id: payload.tagged_users[0], metric: payload.metric, workspace_id: businessInfo.workspace_id });
        }
      }

      let messageString = ``;
      if (constants.adminMetric.has(payload.metric)) {
        let workspaceOwner = yield botservice.getTeamMembers(logHandler, { workspace_id: businessInfo.workspace_id, role: constants.userRole.OWNER });
        let workspaceAdmins = yield botservice.getTeamMembers(logHandler, { workspace_id: businessInfo.workspace_id, role: constants.userRole.ADMIN });
        messageString = `_*Your workspace Admin*_\n` + workspaceOwner[0].full_name;
        if(workspaceAdmins.length) {
          for(let info of workspaceAdmins) {
            messageString += '\n' + info.full_name;
          }
        }
        billingPayload.message = messageString;
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      payload.message = payload.message.toLowerCase();
      payload.message = payload.message.replace(/\//, '');



      
        let meetingPayload = {
          user_id          : payload.bot_user_id,
          date_time        : utils.getCurrentTime(),
          is_typing        : 0,
          message_type     : 14,
          server_push      : 0,
          is_thread_message: false,
          is_web           : true,
          message          : `Notification issue:`
        };

        if (payload.button_action && payload.button_data && payload.button_data.confirmation_type == constants.confirmationType.NOTIFICATION_ISSUE) {
          const notificationIssueWebhook = process.env.notificationIssueWebhook || config.get('notificationIssueWebhook');
          let options = {
            url: notificationIssueWebhook,
            method: 'POST',
            json: {
              data: {
                message: `*Name* : ` + userInfo.full_name + '\n*User ID* : ' + userInfo.user_id + '\n*Workspace ID* : ' + businessInfo.workspace_id + '\n*Issue* : ' + payload.button_data.comment
              }
            }
          };
          utilityService.sendHttpRequest(logHandler, options);
          meetingPayload.message = `I will report this issue to our team right away! You will be contacted soon for a quick resolution of this issue.`
          yield publishMessage(logHandler, meetingPayload, channelInfo.channel_id);
          trueButtonAction(logHandler, payload, channelInfo);
          return {};
        }


        if (payload.button_action && payload.button_data && payload.button_data.confirmation_type == constants.confirmationType.DEVICE_TYPE) {
          if(payload.button_action == 'OTHERS') {
            let actionPayload = {
              title: `*Please elaborate your issue:*`,
              confirmation_type: constants.confirmationType.NOTIFICATION_ISSUE,
              leave_id: 1,
              is_action_taken: false,
              buttons: [{
                label: constants.buttonsForLeave.CONFIRM, action: constants.buttonsForLeave.CONFIRM, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
              },
              {
                label: constants.buttonsForLeave.CANCEL, action: constants.buttonsForLeave.CANCEL, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
              }]
            };

              meetingPayload.message_type = constants.messageType.BUTTON,
              actionPayload.default_text_field = {
                action: constants.buttonsForLeave.COMMENT, output: constants.textFieldAction.COMMENT, is_required: true, minimum_length: constants.defaultTextFieldCharacterLength, hint: constants.defaultTextFieldHint, id: 1
              };
            meetingPayload.message = 'Report issue:'
            meetingPayload.custom_actions = [actionPayload];
          } else {
            meetingPayload.message_type = 1
            meetingPayload.message = `Please follow the steps below to get a seamless experience with Fugu notifications :\n`  + constants.androidDevicesNotificationString[payload.button_action]
          }
          yield publishMessage(logHandler, meetingPayload, channelInfo.channel_id);
          trueButtonAction(logHandler, payload, channelInfo);
          return {};
        }

        if (payload.message.includes('notification issue')) {
          let actionPayload = {
            confirmation_type: constants.confirmationType.DEVICE_TYPE,
            is_action_taken: false,
            leave_id: 1,
            title: `*Please choose your device:*`
          };

          let buttons = [];
          for (let data of Object.keys(constants.androidDevices)) {
            buttons.push({
              label: constants.androidDevices[data], action: data, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, type_id: 1
            });
          }
          const notificationIssueWebhook = process.env.notificationIssueWebhook || config.get('notificationIssueWebhook');
          if(commonFunctions.isValidURL(notificationIssueWebhook)) {
            buttons.push({
              label: "Other device / issue", action: "OTHERS", style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, type_id: 1
            });
          }
          actionPayload.buttons = buttons
          meetingPayload.custom_actions = [actionPayload];
          publishMessage(logHandler, meetingPayload, channelInfo.channel_id);
          return {};
        }
      





      if (constants.adminMetric.has(payload.metric)) {
        let workspaceOwner = yield botservice.getTeamMembers(logHandler, { workspace_id: businessInfo.workspace_id, role: constants.userRole.OWNER });
        let workspaceAdmins = yield botservice.getTeamMembers(logHandler, { workspace_id: businessInfo.workspace_id, role: constants.userRole.ADMIN });
        messageString = `_*Your workspace Admin*_\n` + workspaceOwner[0].full_name;
        if (workspaceAdmins.length) {
          for (let info of workspaceAdmins) {
            messageString += '\n' + info.full_name;
          }
        }
        billingPayload.message = messageString;
        yield publishMessage(logHandler, billingPayload, channelInfo.channel_id);
        return {};
      }

      if (constants.fuguBotMetric.has(payload.metric)) {
        if (!_.isEmpty(result)) {
          if (result[0][payload.metric]) {
            messageString = `${otherUserInfo[0].full_name}'s ${payload.metric} is ${result[0][payload.metric]}`;
          } else {
            messageString = `I'm sorry, I am not able to find ${otherUserInfo[0].full_name}'s ${payload.metric}`;
          }
        } else {
          messageString = `I'm sorry, I am not able to find ${payload.metric_text || otherUserInfo[0].full_name}'s ${payload.metric}`;
        }
      } else {
        if(payload.message.includes('create workspace')) {
          let workspace_permission = yield workspaceService.getDomainDetails(logHandler, { domain: businessInfo.domain || config.get("baseDomain") });
          let properties = JSON.parse(workspace_permission[0].properties);
          if (!properties.is_create_workspace_enabled) {
            content = {
              is_web: true,
              is_typing: 0,
              server_push: 0,
              message_type: 1,
              is_thread_message: false
            }
            content.user_id = payload.bot_user_id
            content.date_time = utils.getCurrentTime()
            content.muid = UniversalFunc.getRandomString()
            content.channel_id = channelInfo.channel_id;
            content.message = "You're not allowed to create a workspace.😐";
            messageString = "You're not allowed to create a workspace.😐";
            let insertObj = {
              metric: payload.message
            };
            bot.insertBotResult(logHandler, {
              user_id: userInfo.user_id, full_name: userInfo.full_name, searched_content: JSON.stringify(insertObj), result: messageString
            });
            yield publishMessage(logHandler, content, channelInfo.channel_id);
            return {};
          }
        }
        let message_array = (payload.message).toLowerCase().trim().split(/[ ?!.\-_]/)
        message_array = message_array.filter(Boolean);
        let boolean = true;
        let userKeywords = yield bot.getFuguBotKeywords(logHandler, { message_array: message_array })
        let fuguKeywordsArray = [];
        if (userKeywords.length) {
          for (userkeyword of userKeywords) {
            fuguKeywordsArray.push(userkeyword.keyword)
          }
          if (fuguKeywordsArray.includes(constants.fugu_bot_messages.INVITE)) {
            let result = yield bot.getInviteMemberAuthority(logHandler, { workspace_id: payload.workspace_id })
            let userResult = yield bot.getTeamMembers(logHandler, { user_id: payload.user_id })
            {
              if (!result.length) {
                result = yield bot.getInviteMemberAuthority(logHandler, { workspace_id: 0 })
              }
              if (result[0].value == 0 && userResult[0].role != constants.userRole.ADMIN && userResult[0].role != constants.userRole.OWNER) {
                boolean = false;
              }
            }
          }
          if (!boolean) {
              messageString = "You are not allowed to invite members, Please Contact Workspace Admin!🙂";
          }
          else if (boolean) {
            // fuguKeywordsArray = JSON.stringify(fuguKeywordsArray)
            let FuguBotResponse = yield bot.getFuguBotResponse(logHandler, { message_array: JSON.stringify(fuguKeywordsArray) })
            if (FuguBotResponse.length) {
              let check = true;
              for (i in FuguBotResponse) {
                let keywordsArray = JSON.parse(FuguBotResponse[i].keywords);
                if (fuguKeywordsArray.length == keywordsArray.length) {
                  content         = JSON.parse(FuguBotResponse[i].response)
                  content.message = content.message.replace(/app_name/g, businessInfo.app_name);
                  if (content.message_type == constants.messageType.BUTTON) {
                    content.custom_actions[0].title = content.custom_actions[0].title.replace(/app_name/g, businessInfo.app_name);
                  }
                  check = false;
                }
              }
              if (check) {
                let random = Math.floor(Math.random() * FuguBotResponse.length)
                content = JSON.parse(FuguBotResponse[random].response)
              }
              count = false;
            }
            else {
              let temp              = fuguKeywordsArray[0];
                  fuguKeywordsArray = []; fuguKeywordsArray.push(temp)
              let FuguBotResponse   = yield bot.getFuguBotResponse(logHandler, { message_array: JSON.stringify(fuguKeywordsArray) })
              let random            = Math.floor(Math.random() * FuguBotResponse.length)
                  content           = JSON.parse(FuguBotResponse[random].response)
                  content.message   = content.message.replace(/app_name/g, businessInfo.app_name);
              if(content.message_type == constants.messageType.BUTTON) {
                content.custom_actions[0].title = content.custom_actions[0].title.replace(/app_name/g, businessInfo.app_name);
              }
              count = false;
            }
          }
        }
      }

      if (messageString || count) {
        content = {
          is_web           : true,
          is_typing        : 0,
          server_push      : 0,
          message_type     : 1,
          is_thread_message: false,
          message          : messageString
        }
        content.message = (messageString) ? messageString : "My Brain does not have a response for that.😑"
      } else {
        messageString = content.message
      }
          content.user_id    = payload.bot_user_id
          content.date_time  = utils.getCurrentTime()
          content.muid       = UniversalFunc.getRandomString()
          content.channel_id = channelInfo.channel_id;
      let insertObj          = {
        metric: payload.message
      };
      bot.insertBotResult(logHandler, {
        user_id: userInfo.user_id, full_name: userInfo.full_name, searched_content: JSON.stringify(insertObj), result: messageString
      });
      yield publishMessage(logHandler, content, channelInfo.channel_id);
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      console.error("Error--->", error);
      resolve();
    });
  });
}

async function handleBot(logHandler, payload) {
  let botData = await bot.getBotInformation(logHandler, { metric: payload.metric, bot_token: payload.bot_token });

  if (_.isEmpty(botData)) {
    throw new Error('no bot found');
  }
  botData = botData[0];
  const content = {
    full_name     : botData.full_name,
    user_id       : botData.user_id,
    date_time     : utils.getCurrentTime(),
    is_typing     : 0,
    message_type  : 1,
    user_type     : 3,
    message_status: 0,
    server_push   : 0,
    muid          : UniversalFunc.getRandomString(),
    is_web        : true
  };
  content.message = payload.message.message;
  await publishMessage(logHandler, content, botData.channel_id);
}

async function fuguCronMessages(logHandler, payload) {
  console.time("concatenation");
  let content = '';
  let userCreatedAt = await bot.getUserCreatedAt(logHandler);
  if (userCreatedAt.length) {
    let userIds = userCreatedAt.map(x => x["user_id"]);
    let channels = await bot.getChannelsWithFuguBotUser(logHandler, { status: true, user_ids: userIds })
    if (_.isEmpty(channels)) {
      return {}
    }
    let data = {}
    let userAppMap = {};
    let userAppDomain = {};
    let role = {}

    for (let value of userCreatedAt) {
      data         [value.user_id] = value.created_at
      userAppMap   [value.user_id] = value.app_name
      userAppDomain[value.user_id] = value.domain_id;
      role         [value.user_id] = value.role
    }

    let result = await bot.fuguCronMessages(logHandler, {});
    for (user of channels) {
      let startTime = moment(new Date()).subtract('5', "minutes");
          startTime = moment(startTime).format('HH:mm');
      let endTime   = moment(new Date()).add('5', 'minutes');
          endTime   = moment(endTime).format('HH:mm')
      let time      = moment(new Date(data[user.user_id])).add(result[user.message_journey_status].time_period, 'minutes')

      time = moment(new Date(time)).format('HH:mm')
      if (time > startTime && time < endTime) {
        (userIds.length) ? await bot.insertMessageStatus(logHandler, { user_id: user.user_id }) : '';
        if (role[user.user_id] == result[user.message_journey_status].role || result[user.message_journey_status].role == "BOTH") {
          content = JSON.parse(result[user.message_journey_status].response)
          content.message = content.message.replace(/app_name/g, userAppMap[user.user_id]);
          if (content.message_type == constants.messageType.BUTTON) {
            content.custom_actions[0].title = content.custom_actions[0].title.replace(/app_name/g, userAppMap[user.user_id]);
          }
          content.user_id    = user.bot_id
          content.date_time  = utils.getCurrentTime()
          content.muid       = UniversalFunc.getRandomString()
          content.channel_id = user.channel_id;
          await publishMessage(logHandler, content, user.channel_id);
        }
      }
    }
  }
  console.timeEnd("concatenation");
}

function publishMessageOnAttendanceBot(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      switch (payload.type) {
        case constants.publishMessageTypesOfAttendanceBot.AUTO_PUNCH_OUT:
          publishAutoPuchOut(logHandler, payload);
          break;
        case constants.publishMessageTypesOfAttendanceBot.AUTO_TEAM_REPORT:
          publishTeamReport(logHandler, payload);
          break;
        case constants.publishMessageTypesOfAttendanceBot.TEAM_LEAVE_STATUS:
          publishTeamLeaveStatus(logHandler, payload);
          break;
        case constants.publishMessageTypesOfAttendanceBot.ATTENDANCE_CREDENTIALS_CHECK:
          publishClockIn(logHandler, payload);
          break;
        case constants.publishMessageTypesOfAttendanceBot.DEFAULT_IMAGE_UPLOAD:
          publishDefaultImageUpload(logHandler, payload);
          break;
        case constants.publishMessageTypesOfAttendanceBot.PUNCH_REMINDER:
          publishPunchReminder(logHandler, payload);
          break;

      }
    })().then((data) => {
      // logger.debug(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

async function publishDefaultImageUpload(logHandler, payload) {
  let userIds = [];
  let attendanceChannelDetails;
  let attendanceChannelId;
  userIds.push(payload.data.user_id);

  let attendanceBotId = await bot.getAttendanceBotIdFromUserId(logHandler, payload.data.user_id);
  if(attendanceBotId){
    attendanceChannelDetails = await bot.getBotChannelId(logHandler, {user_id: payload.data.user_id, attendance_user_id: attendanceBotId});
    if(!_.isEmpty(attendanceChannelDetails)){
      attendanceChannelId = attendanceChannelDetails[0].channel_id;
    }
  }

  let messagePayload = {
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    server_push: 0,
    is_thread_message: false
  };

  messagePayload.user_id = attendanceBotId;
  messagePayload.message = payload.data.message;
  await publishMessage(logHandler, messagePayload, attendanceChannelId);
}

async function publishClockIn(logHandler, payload) {
  let userIds = [];
  let attendanceChannelId;
  let attendanceChannelDetails;

  userIds.push(payload.data.user_id);
  let attendanceBotId = await bot.getAttendanceBotIdFromUserId(logHandler, payload.data.user_id);
  if(attendanceBotId){
    attendanceChannelDetails = await bot.getBotChannelId(logHandler, {user_id: payload.data.user_id, attendance_user_id: attendanceBotId});
    if(!_.isEmpty(attendanceChannelDetails)){
      attendanceChannelId = attendanceChannelDetails[0].channel_id;
    }
  }
  let messagePayload = {
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    server_push: 0,
    is_thread_message: false
  };

  messagePayload.user_id = payload.data.user_id;
  messagePayload.message = payload.action;
  await publishMessage(logHandler, messagePayload, attendanceChannelId);

  if (payload.statusCode == 420) {
    messagePayload.user_id = attendanceBotId;
    messagePayload.message = payload.data.message;
    messagePayload.message_type = 14;
    let actionPayload = {
      is_action_taken: false,
      confirmation_type: constants.selfieForAttendance.CLICK_SELFIE,
      tagged_user_id: payload.data.user_id,
      title: `Please Click a Selfie`,
      buttons: [{
        label: constants.selfieForAttendance.CLICK_SELFIE_BUTTON, action: constants.selfieForAttendance.OPEN_CAMERA, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
      }]
    };
    messagePayload.custom_actions = [actionPayload];
  } else {
    messagePayload.user_id = attendanceBotId;
    messagePayload.message = payload.data.message;
  }
  await publishMessage(logHandler, messagePayload, attendanceChannelId);
}

async function publishTeamLeaveStatus(logHandler, payload) {
  let userIds = [];

  let messageObject = {};

  for (let index in payload.data) {
    let messageArrayForSingleLeaves    = [];
    let messageArrayForSingleWFH       = [];
    let messageStringForMultipleWFH    = "";
    let messageStringForMultipleLeaves = "";
    for (let data of payload.data[index]) {
      if (data.days == 1 && !data.is_clock_in_allowed) {
        messageArrayForSingleLeaves.push(`<a class=\"tagged-agent tagged-user\" href=\"mention://${data.user_name.split("fugu")[1]}\" data-id=\"${data.user_name.split("fugu")[1]}\" contenteditable=\"false\" >@${data.full_name}</a>`);
      }else if((data.days == 1 || data.days == 0.5) && data.is_clock_in_allowed){
        messageArrayForSingleWFH.push(`<a class=\"tagged-agent tagged-user\" href=\"mention://${data.user_name.split("fugu")[1]}\" data-id=\"${data.user_name.split("fugu")[1]}\" contenteditable=\"false\" >@${data.full_name}</a>`);
      }else if(data.days > 1 && data.is_clock_in_allowed){
        let on_wfh_from = new Date();
        let on_wfh_till = new Date();
        on_wfh_till.setDate(on_wfh_till.getDate() + data.days);
        on_wfh_from = on_wfh_from.getDate() + "-" + (on_wfh_from.getMonth() + 1) + "-" + on_wfh_from.getFullYear();
        on_wfh_till = on_wfh_till.getDate() + "-" + (on_wfh_till.getMonth() + 1) + "-" + on_wfh_till.getFullYear();
        messageStringForMultipleWFH += `<a class=\"tagged-agent tagged-user\" href=\"mention://${data.user_name.split("fugu")[1]}\" data-id=\"${data.user_name.split("fugu")[1]}\" contenteditable=\"false\" style=\"color: rgb(0,123,255); text-decoration: none;\">@${data.full_name}</a>` + " will be on *Work From Home* for " + data.days + ` days from today(${on_wfh_from} to ${on_wfh_till}).\n`;
      } else {
        let on_leave_from = new Date();
        let on_leave_till = new Date();
        on_leave_till.setDate(on_leave_till.getDate() + data.days);
        on_leave_from = on_leave_from.getDate() + "-" + (on_leave_from.getMonth() + 1) + "-" + on_leave_from.getFullYear();
        on_leave_till = on_leave_till.getDate() + "-" + (on_leave_till.getMonth() + 1) + "-" + on_leave_till.getFullYear();
        messageStringForMultipleLeaves += `<a class=\"tagged-agent tagged-user\" href=\"mention://${data.user_name.split("fugu")[1]}\" data-id=\"${data.user_name.split("fugu")[1]}\" contenteditable=\"false\" style=\"color: rgb(0,123,255); text-decoration: none;\">@${data.full_name}</a>` + " will be on *leave* for " + data.days + ` days from today(${on_leave_from} to ${on_leave_till}).\n`;
      }
    }
    let lengthOfSinglesDayLeaves = messageArrayForSingleLeaves.length;
    let messageStringForSingleLeaves = "";
    let messageStringForSingleWFH    = "";
    if (lengthOfSinglesDayLeaves) {
      for (let data in messageArrayForSingleLeaves) {
        if (data == 0) messageStringForSingleLeaves += messageArrayForSingleLeaves[data];
        else if (data == lengthOfSinglesDayLeaves - 1) messageStringForSingleLeaves += " and " + messageArrayForSingleLeaves[data];
        else messageStringForSingleLeaves += ", " + messageArrayForSingleLeaves[data];
      }
      if (lengthOfSinglesDayLeaves == 1) messageStringForSingleLeaves += " is on *leave* today\n";
      else messageStringForSingleLeaves += " are on *leave* today\n";
    }
    if(messageArrayForSingleWFH.length){
      for(let i = 0; i < messageArrayForSingleWFH.length; i++){
        if(i == 0)  messageStringForSingleWFH += messageArrayForSingleWFH[i];
        else if(i == messageArrayForSingleWFH.length - 1){
            messageStringForSingleWFH += " and " + messageArrayForSingleWFH[i];
        }else{
            messageStringForSingleWFH += ", " + messageArrayForSingleWFH[i];
        }
      }
      (messageArrayForSingleWFH.length == 1) ? messageStringForSingleWFH += " is on *work from home* today\n": messageStringForSingleWFH += " are on *work from home* today\n";
    }
    let message = `Hey,\n` + messageStringForSingleLeaves + messageStringForMultipleLeaves + messageStringForSingleWFH + messageStringForMultipleWFH;
    messageObject[index.split("fugu")[1]] = (message);
    userIds.push(index.split("fugu")[1]);
    message = null;
  }
  let attendance_token = payload.business_token;
  let getUserDetails = await conversationService.getUserDetails(logHandler,{attendance_token: attendance_token, join_workspace_details: true, user_type: constants.userType.ATTENDANCE_BOT});
  if(!getUserDetails.length){
    return {};
  }
  let attendance_user_id = getUserDetails[0].user_id;

  let channelsWithAttendanceBot = await bot.getBotChannelId(logHandler, {attendance_user_id: attendance_user_id, user_ids: userIds});

  let messagePayload = {
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : 1,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true,
  };

  for (let index of channelsWithAttendanceBot) {
    messagePayload.user_id = index.bot_id;
    messagePayload.message = messageObject[index.human_id];
    await publishMessage(logHandler, messagePayload, index.channel_id);
  }
  return {};
}
async function publishTeamReport(logHandler, payload) {
  let obj = {};
  let UserIdArray = [];
  for (index in payload.data) {
    UserIdArray.push(index.split("fugu")[1]);
    obj[index.split("fugu")[1]] = printTeamPunchStatus(payload.data[index]);
  }
  let channelsWithAttendanceBot = await bot.getChannelsWithAttendanceBotUser(logHandler, { usersId: UserIdArray });
  let content = {
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : 1,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true
  };
  for (let value of channelsWithAttendanceBot) {
    content.user_id      = value.bot_id;
    content.workspace_id = value.workspace_id;
    content.message      = obj[value.user_id];
    publishMessage(logHandler, content, value.channel_id);
  }
  return {};
}

function printTeamPunchStatus(getTeamPunchStatus) {
  let messageString1 = ''; let messageString2 = ''; let messageString = "Your team's punch status \n";
  for (let value of getTeamPunchStatus) {
    if (value.clocked_in) {
      messageString1
        += `<a class=\"tagged-agent tagged-user\" href=\"mention://${(value.user_name).split("fugu")[1]}\" data-id=\"${(value.user_name).split("fugu")[1]}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${value.full_name}</a>` + " - " + value.clocked_in + "\n";
    } else {
      messageString2
        += `<a class=\"tagged-agent tagged-user\" href=\"mention://${(value.user_name).split("fugu")[1]}\" data-id=\"${(value.user_name).split("fugu")[1]}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${value.full_name}</a>` + "\n";
    }
  }
  messageString1 = (messageString1) ? (" _*PUNCHED IN*_  \n " + messageString1) : "";
  messageString += (messageString2) ? messageString1 + "\n" + " _*NOT YET IN OFFICE*_ \n" + messageString2 : messageString1;
  return messageString;
}

async function publishAutoPuchOut(logHandler, payload) {
  let userIds = [];

  for (let user_id of payload.user_names) {
    userIds.push(user_id.split('fugu')[1]);
  }
  let attendance_token = payload.business_token;

  let getUserDetails = await conversationService.getUserDetails(logHandler,{attendance_token: attendance_token, join_workspace_details: true, user_type: constants.userType.ATTENDANCE_BOT});
  if(!getUserDetails.length){
    return {};
  }
  let attendance_user_id = getUserDetails[0].user_id;

  let attendanceUsers = await bot.getBotChannelId(logHandler, {attendance_user_id: attendance_user_id, user_ids: userIds});

  let messagePayload = {
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : 1,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true,
    message          : "Seems like you forgot to punch out today, so I am clocking you out for the day."
  };

  for (let data of attendanceUsers) {
    messagePayload.user_id = data.bot_id;
    messagePayload.workspace_id = getUserDetails[0].workspace_id;
    await publishMessage(logHandler, messagePayload, data.channel_id);
  }
  return {};
}


async function publishPunchReminder(logHandler, payload) {
  let userIds = [];

  for (let user_id of payload.user_names) {
    userIds.push(user_id.split("fugu")[1]);
  }
  let attendance_token = payload.business_token;
  let getUserDetails = await conversationService.getUserDetails(logHandler,{attendance_token: attendance_token, join_workspace_details: true, user_type: constants.userType.ATTENDANCE_BOT});
  if(!getUserDetails.length){
    return {};
  }
  let attendance_user_id = getUserDetails[0].user_id;
  let attendanceUsers = await bot.getBotChannelId(logHandler, {attendance_user_id: attendance_user_id, user_ids: userIds});

  let messagePayload = {
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : 1,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true
  };

  if (payload.clock_out) {
    messagePayload.message = "Seems like you are working late today. if not, mark yourself out of office.";
  } else {
    messagePayload.message = "Still not in office or forgot to punch in? either ways, you have stuff to take care of.";
  }

  for (let data of attendanceUsers) {
    messagePayload.user_id = data.bot_id;
    publishMessage(logHandler, messagePayload, data.channel_id);
  }
  return {};
}

async function publishMessageOnFuguBot(logHandler, payload) {
  if (payload.userInfo.role == constants.userRole.USER) {
    throw new Error("You are not authorized")
  }

  payload.user_ids ? payload.user_ids = JSON.parse(payload.user_ids) : '';
  let userData = await userService.getAllBusinessUsers(logHandler, { workspace_id: payload.businessInfo.workspace_id, broadcast_user_type: payload.broadcast_user_type, user_ids: payload.user_ids });
  let userIds = []
  if(!userData.length) {
    throw new Error("Users does not belong to this workspace")
  }
  if (payload.broadcast_user_type == constants.broadcast_user_type.ALL) {
    userIds = userData.map(x => x["user_id"]);
  }
  const chunkSize = 100;
  let channelsWithFuguBot = [];
  if (userIds.length > chunkSize) {
    const chunks = Math.ceil(userIds.length / chunkSize);
    for (let i = 0; i < chunks; i++) {
      let userChunk = userIds.slice(i * chunkSize, (i * chunkSize) + chunkSize);
      const channelData = await bot.getChannelsWithFuguBotUser(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_ids: (userChunk.length) ? userChunk : payload.user_ids, broadcast_user_type: payload.broadcast_user_type });
      channelsWithFuguBot = [...channelsWithFuguBot, ...channelData];
    }
  } else {
    channelsWithFuguBot = await bot.getChannelsWithFuguBotUser(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_ids: (userIds.length) ? userIds : payload.user_ids, broadcast_user_type: payload.broadcast_user_type });
  }

  let botInfo = await bot.getBotInfo(logHandler, { user_type: constants.userType.FUGU_BOT, workspace_id: payload.businessInfo.workspace_id })


  let channelUserMap = {};

  for (let data of channelsWithFuguBot) {
    if (!channelUserMap[data.channel_id]) {
      channelUserMap[data.user_id] = data.channel_id;
    }
  }
  let channelUsers = [];
  for (let data of userData) {
    //  if(!(payload.userInfo.user_id == data.user_id)){
    let messageObject = {};
    messageObject.full_name = data.full_name;
    if (channelUserMap[data.user_id]) {
      messageObject.channel_id = channelUserMap[data.user_id];
    } else {
      let usersIds                 = [data.user_id, botInfo[0].user_id];
      let params                   = {};
          params.chat_type         = constants.chatType.FUGU_BOT;
          params.channel_type      = constants.channelType.FUGU_BOT;
          params.workspace_id      = payload.businessInfo.workspace_id;
          params.owner_id          = data.user_id;
      let response                 = await channelService.insertIntoChannels(logHandler, params);
          messageObject.channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj                      = {};
            updateObj.user_id              = usersIds[i];
            updateObj.channel_id           = response.insertId;
            updateObj.status               = constants.userStatus.ENABLE;
            updateObj.last_read_message_id = '0';
            updateObj.role                 = constants.userRole.USER;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
    }
    channelUsers.push(messageObject);
    //   }
  }
  let content = {
    user_id          : botInfo[0].user_id,
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : payload.message_type,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true
  };

  payload.message ? content.message = payload.message : '';
  if (!(payload.message_type == constants.messageType.MESSAGE)) {
    let file_url = await utilityService.uploadFileV2(logHandler, { file: payload.file, file_name: payload.file.originalname, message_type: payload.message_type });
    if (file_url) {
      content.url = file_url.url;
      content.thumbnail_url = file_url.thumbnail_url;
      content.image_url = file_url.image_url
      content.file_name = payload.file_name || payload.file.originalname
      content.file_size = payload.file_size
      content.image_size ? content.image_size = file_url.image_size : '';
      content.image_url_100x100 = file_url.blur_image_url;
      payload.image_width   ? content.image_width   = payload.image_width   : ''
      payload.image_height  ? content.image_height  = payload.image_height  : ''
      payload.document_type ? content.document_type = payload.document_type : ''
      payload.width         ? content.width         = payload.width         : ''
      payload.height        ? content.height        = payload.height        : ''
    }
  }

  for (let data of channelUsers) {
    publishMessage(logHandler, content, data.channel_id);
  }
  if (payload.broadcast_user_type) {
    return RESP.SUCCESS.MESSAGE_BROADCAST
  }
}

async function attendanceCron(logHandler, payload) {
  let botData = await bot.getBotInfo(logHandler, { workspace_id: payload.business_id, user_type: constants.userType.ATTENDANCE_BOT });

  if (_.isEmpty(botData)) {
    throw new Error('no bot found');
  }

  let attendanceUsers = await bot.getAttendanceUser(logHandler, payload);

  if (_.isEmpty(attendanceUsers)) {
    return {};
  }

  botData = botData[0];
  let content = {
    user_id          : botData.user_id,
    date_time        : utils.getCurrentTime(),
    is_typing        : 0,
    message_type     : 1,
    server_push      : 0,
    is_thread_message: false,
    is_web           : true
  };

  if (payload.clock_out) {
    content.message = "Seems like you are working late today. if not, mark yourself out of office.";
  } else {
    content.message = "Still not in office or forgot to punch in? either ways, you have stuff to take care of.";
  }
  for (let i = 0; i < attendanceUsers.length; i++) {
    publishMessage(logHandler, content, attendanceUsers[i].channel_id);
  }
}

async function getWebhooks(logHandler, payload) {
  const userRole = await userService.getUserInfo(logHandler, { user_id: payload.userInfo.user_id, workspace_id: payload.businessInfo.workspace_id });
  if (_.isEmpty(userRole) || userRole[0].role == constants.userRole.USER) {
    payload.user_role = true;
  }
  const result = await bot.getWebhooks(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, webhook_id: payload.webhook_id, created_by_user_id: payload.userInfo.user_id, user_role: payload.user_role });

  if (_.isEmpty(result)) {
    return [];
  }
  let unamedChannelsInfo = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: result[0].channel_id, user_id: payload.userInfo.user_id });
  let channelsLabelInfo = unamedChannelsInfo.channelLabelMap || {};
  let channelsUserInfo = unamedChannelsInfo.channelUserMap || {};

  if (!result[0].label) {
    if ((result[0].chat_type != constants.chatType.O20_CHAT) && !result[0].label) {
      let label = channelsLabelInfo[result[0].channel_id];
      let channelUserData = channelsUserInfo[result[0].channel_id] || [];
      if (channelUserData.length < constants.unamedGroupMemberLength) {
        label = label ? label + ", " + payload.userInfo.full_name.split(' ')[0] : payload.userInfo.full_name.split(' ')[0];
      }
      result[0].label = label;
    }
  }
  return result;
}


async function editWebhook(logHandler, payload) {
  if (payload.app_id == constants.AppIdCheck.TRELLO_BOT_APP_ID) {

    let result = await bot.getWebhooks(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, webhook_id: payload.webhook_id, created_by_user_id: payload.userInfo.user_id, user_role: payload.user_role });
    let options = {
      url: "https://api.trello.com/1/webhooks/" + result[0].webhook_id + "/",
      json: {
        token: result[0].token
      }
    };

    switch (payload.webhook_status) {
      case constants.webhookStatus.DELETE:
        options.url += "?key=" + config.get('trelloApiKey');
        options.method = 'DELETE';
        break;
      case constants.webhookStatus.DISABLE:
        options.url += '?active=' + constants.trelloMessage.FALSE;
        options.json.key = config.get('trelloApiKey');
        options.method = 'PUT';
        break;
      case constants.webhookStatus.ENABLE:
        options.url += "?active=" + constants.trelloMessage.TRUE
        options.json.key = config.get('trelloApiKey')
        options.method = 'PUT';
        break;
      default:
        let text = (payload.callbackURL) ? "?callbackURL=" + payload.callbackURL : (payload.id_model) ? "?idModel=" + payload.id_model : (payload.description) ? "?description=" + payload.description : '';
        options.url += text;
        options.json.key = config.get('trelloApiKey')
        options.method = 'PUT';
    }
    utilityService.sendHttpRequest(logHandler, options)
  }
  await bot.editWebhook(logHandler, payload, payload.webhook_id);
  return {};
}

async function getApps(logHandler, payload) {
  try {
    if(!payload.workspaceInfo) {
      throw new Error("Invalid workspace")
    }
    let userRole = await bot.getUserRole(logHandler, { user_id: payload.workspaceInfo.fugu_user_id, workspace_id: payload.workspace_id });
    let is_user = false;
    if (_.isEmpty(userRole) || userRole[0].role == constants.userRole.USER) {
      is_user = true;
    }
    const data = await bot.getApps(logHandler, { workspace_id: payload.workspace_id, app_id: payload.app_id, is_user: is_user });
    // logger.debug(logHandler, { SUCCESS: data });

    //Replacing app's description
    const  variablesData = {
      app_name : payload.workspaceInfo.app_name,
    }
    data.forEach( key => {
      key.description = key.description ?  Handlebars.compile(key.description)(variablesData) : key.description;
      key.name        = key.name ? Handlebars.compile(key.name)(variablesData) : key.name;
    })


    return data;
  } catch (error) {
    logger.error(logHandler, { ERROR: error });
    throw error;
  }
}

async function createWebhook(logHandler, payload) {
  let app_details = await bot.getApps(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id });
  if (_.isEmpty(app_details) || !app_details[0].status) {
    throw new Error("You cannot create webhook.")
  }

  let insertObj                 = {};
      insertObj.workspace_id    = payload.businessInfo.workspace_id;
      insertObj.full_name       = (payload.full_name) ? utils.toTitleCase(payload.full_name) : app_details[0].name;
      insertObj.user_name       = "user" + Math.round(parseFloat(Math.random() * 10000)) + "";
      insertObj.status          = constants.userStatus.ENABLE;
      insertObj.user_type       = constants.userType.BOT;
      insertObj.user_unique_key = commonFunctions.generateUserId();
      insertObj.device_key      = UniversalFunc.generateRandomString(20);

  let userInfo = await userService.insertUserDetails(logHandler, insertObj);
  let hash = utils.encryptText(UniversalFunc.generateRandomString(10, false) + new Date().getTime());
  let webhook_link = config.get("ocBaseUrl") + `/api/webhook?`;
  if (payload.app_id == constants.tookanBotAppId) {
    webhook_link += `task_history=1&`;
  }

  webhook_link += "token=" + hash;

  let updateObj = {};
  updateObj.user_id = userInfo.insertId;
  updateObj.channel_id = payload.channel_id;
  updateObj.status = constants.userStatus.ENABLE;
  updateObj.role = constants.userRole.USER;
  await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
  let insertWebhook = await bot.insertWebhook(logHandler, { user_id: userInfo.insertId, channel_id: payload.channel_id, installed_app_id: app_details[0].id, webhook_link: webhook_link, created_by_user_id: payload.userInfo.user_id, hash: hash });

  if (payload.app_id == constants.AppIdCheck.TRELLO_BOT_APP_ID) {

    let options = {
      url: "https://api.trello.com/1/tokens/" + payload.token + "/" + constants.trelloMessage.WEBHOOK + "/",
      method: 'POST',
      json: {
        key        : config.get('trelloApiKey'),
        callbackURL: webhook_link,
        idModel    : payload.id_model,
        description: "Registering webhook"
      }
    };
    let result = await utilityService.sendHttpRequest(logHandler, options)

    let insertToken = await bot.insertToken(logHandler, { installed_app_id: app_details[0].id, token: payload.token, idModel: payload.id_model, id: result.id })
  }
  return { webhook_link: webhook_link, webhook_id: insertWebhook.insertId };
}



function attendanceBot(logHandler, payload, channelInfo, userInfo, businessInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (!businessInfo.attendance_token) {
        return {};
      }

      let messageString;
      let defaultString = `I am afraid I did not understand. Please type 'help' to know more about me.`;

      logHandler = {
        uuid: logHandler.uuid,
        apiModule: "chathandler",
        apiHandler: "bot"
      };
      // logger.debug(logHandler, "attendance payload>", payload);

      let content = {
        user_id          : payload.bot_user_id,
        date_time        : utils.getCurrentTime(),
        is_typing        : 0,
        message_type     : 1,
        server_push      : 0,
        is_thread_message: false,
        muid             : UniversalFunc.getRandomString(),
        is_web           : true,
      };

      let message = payload.bot_message.toLowerCase();
      message = message.replace(/\//, '');
      if(payload.leave_start_date){
        let dateObj=UniversalFunc.getDateRange(payload.bot_message);
        if (dateObj.dates.length == 0) {
          payload.leave_start_date= moment(moment(new Date()).add(payload.time_zone).startOf('day')).format('YYYY-MM-DD[T]HH:mm:SS.SSS[Z]');
        }
        else if (dateObj.dates.length == 1) {
          payload.leave_start_date=moment(moment(dateObj.dates[0]).startOf('day')).format('YYYY-MM-DD[T]HH:mm:SS.SSS[Z]');
      } else if (dateObj.dates.length == 2) {
          payload.leave_start_date=moment(moment(dateObj.dates[0]).startOf('day')).format('YYYY-MM-DD[T]HH:mm:SS.SSS[Z]');
          payload.leave_end_date=moment(moment(dateObj.dates[1]).startOf('day')).format('YYYY-MM-DD[T]HH:mm:SS.SSS[Z]');
        }
      }
      // let botState = yield bot.getAppState(logHandler, { business_id: businessInfo.business_id, app_id: constants.AppIdCheck.ATTENDANCE_BOT_APP_ID });

      // if (botState[0].days >= constants.maxAttendanceFreeTrial && botState[0].app_state == constants.appState.TRIAL && !payload.faye_publish) {
      //   bot.editApps(logHandler, { business_id: businessInfo.business_id, app_id: constants.AppIdCheck.ATTENDANCE_BOT_APP_ID, app_state: constants.appState.EXPIRED, status: constants.status.DISABLE });
      //   messageString = `Trial Expired. Please buy a plan to continue.`
      // } else if (message == "billing" && !payload.faye_publish) {
      //   if (botState[0].app_state == constants.appState.EXPIRED || botState[0].app_state == constants.appState.TRIAL) {
      //     let getUserRole = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
      //     if (getUserRole[0].role == constants.userRole.USER) {
      //       messageString = `You are not authorized to perform this action.`
      //     } else {
      //       let workspaceDetails = yield businessService.getBusinessDetails(logHandler, { app_secret_key: businessInfo.app_secret_key });
      //       messageString = `https://${workspaceDetails[0].workspace}.${workspaceDetails[0].domain}/billing/${constants.AppIdCheck.ATTENDANCE_BOT_APP_ID}`;
      //     }
      //   } else {
      //     messageString = "You have valid active plan."
      //   }
      // } else if (botState[0].app_state == constants.appState.EXPIRED && !payload.faye_publish) {
      //   messageString = "Plan Expired. please contact owner."
      // } else
      if(message == constants.attendanceMetric.EMPLOYEE_CODE) {
        let userAttendaceInfo = yield bot.getAttendanceUserInfo(logHandler, { user_name: "fugu" + userInfo.user_id });
        if(userAttendaceInfo.length && userAttendaceInfo[0].employee_id) {
          messageString = `Your employee code is ${userAttendaceInfo[0].employee_id}`;
        } else {
          messageString = `Please contact with HR for employee code.`
        }
      } else if (message == constants.attendanceMetric.IN) {
        if (payload.faye_publish) {
          return;
        }
        let businessConfig = yield businessService.getConfiguration(logHandler, { business_id: businessInfo.business_id });

        if (businessConfig.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE) {
          let options = {
            url: config.get('attendanceUrl') + constants.API_END_POINT.ATTENDANCE_CLOCK_IN,
            method: 'POST',
            attendance: true,
            json: {
              user_name     : "fugu" + userInfo.user_id,
              full_name     : userInfo.full_name,
              email         : userInfo.email,
              business_token: businessInfo.attendance_token
            }
          };
          let result = yield utilityService.sendHttpRequest(logHandler, options);
          messageString = result.message;
        } else {
          messageString = "Your workspace owner has changed your attendance bot settings. *Please update your app to punch in.*"
        }

      } else if (message == constants.attendanceMetric.OUT) {
        if (payload.faye_publish) {
          return;
        }
        let businessConfig = yield businessService.getConfiguration(logHandler, { business_id: businessInfo.business_id });
        if (businessConfig.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE) {
          let options = {
            url: config.get('attendanceUrl') + constants.API_END_POINT.ATTENDANCE_CLOCK_OUT,
            method: 'POST',
            attendance: true,
            json: {
              user_name     : "fugu" + userInfo.user_id,
              full_name     : userInfo.full_name,
              email         : userInfo.email,
              business_token: businessInfo.attendance_token
            }
          };
          let result = yield utilityService.sendHttpRequest(logHandler, options);
          messageString = result.message;
        } else {
          messageString = "Your workspace owner has changed your attendance bot settings. *Please update your app to punch out.*"
        }
      } else if (message.includes(constants.attendanceMetric.SETTING)) {
        let userAttendaceInfo = yield userService.getUserDetail(logHandler, { user_id: userInfo.user_id });
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS + `?business_token=${businessInfo.attendance_token}&full_name=${userAttendaceInfo[0].full_name}&email=${userAttendaceInfo[0].email}&user_name=fugu${userAttendaceInfo[0].user_id}&user_count=${constants.usersCount.USER}`,
          method: 'GET',
          attendance: true
        };
        let apiResult = yield utilityService.sendHttpRequest(logHandler, options);
        let workspaceDetails = yield bot.getBusinessDetails(logHandler, { app_secret_key: businessInfo.app_secret_key });
        messageString = `https://${workspaceDetails[0].full_domain}/${workspaceDetails[0].workspace}/apps/attendance`;
        let role;
        try {
          apiResult = JSON.parse(apiResult);
          role = apiResult.data.user_info[0].role;
        } catch (err) {
          console.error("attendace error", err)
        }
        if (role == constants.userRole.USER) {
          messageString += `/employee/fugu${userInfo.user_id}`;
        } else if (role == constants.userRole.MANAGER) {
          messageString += "/people";
        }
      } else if (message == constants.attendanceMetric.MY_LEAVE_BALANCE || message == constants.attendanceMetric.QUOTAS || message == constants.attendanceMetric.LEAVE_BALANCE) {
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.USER_LEAVE_BALANCE + `?business_token=${businessInfo.attendance_token}&full_name=${userInfo.full_name}&email=${userInfo.email}&users_count=USER&user_name=fugu${userInfo.user_id}`,
          method: 'GET',
          attendance: true
        };
        let result = yield utilityService.sendHttpRequest(logHandler, options);
        result = JSON.parse(result);
        if (result.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
          messageString = result.message;
        } else if (_.isEmpty(result.data.business_leaves)) {
          messageString = `No leaves for your business.`;
        } else {
          let leave_balance = result.data.user_data[0].leave_balance;
          messageString = "Your Leave Quotas:";
          content.custom_actions = [];
          content.message_type = constants.messageType.BUTTON;

          for (let data of result.data.business_leaves) {
            if (data.status == 1) {
              let actionObject = {};
              actionObject.title = `*${data.header}* \nBalance: ${data.is_negative_leave_allowed ? "Unlimited" : leave_balance[data.field]}`;
              content.custom_actions.push(actionObject);
            }
          }
        }
      } else if (message == constants.attendanceMetric.REPORT) {
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.ATTENDANCE_MONTHLY_REPORT,
          method: 'POST',
          attendance: true,
          json: {
            business_token: businessInfo.attendance_token
          }
        };

        if (!_.isEmpty(payload.tagged_users)) {
          let result = yield bot.getTeamMembers(logHandler, { manager_fugu_user_id: userInfo.user_id });

          if (!_.isEmpty(result)) {
            let otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: payload.tagged_users[0] });
            options.json.user_name = "fugu" + payload.tagged_users[0];
            options.json.full_name = otherUserInfo[0].full_name,
              options.json.email = otherUserInfo[0].email;
          } else {
            messageString = "You don't have access to view report.";
          }
        } else {
          options.json.user_name = "fugu" + userInfo.user_id;
          options.json.full_name = userInfo.full_name,
            options.json.email = userInfo.email;
        }

        let result = yield utilityService.sendHttpRequest(logHandler, options);

        let csvData = [];
        if (!_.isEmpty(result.data)) {
          for (let row of result.data) {
            if (new Date(row.timeIn).toLocaleDateString() == new Date(row.timeOut).toLocaleDateString()) {
              row.duration = moment(utils.getTimeDifference(row.timeIn, row.timeOut)).format("HH:mm");
            } else {
              let clonedObject = utils.cloneObject(row);
              let currentDate = new Date(row.timeIn);
              currentDate.setUTCHours(0, 0, 0, 0);
              let e = currentDate.setDate(currentDate.getDate() + 1);
              row.timeOut = new Date(e);
              row.duration = moment(utils.getTimeDifference(row.timeIn, row.timeOut)).format("HH:mm");

              if (clonedObject.timeOut) {
                let timeDate = new Date(clonedObject.timeOut);
                timeDate.setUTCHours(0, 0, 0, 0);
                clonedObject.timeIn = timeDate;
                clonedObject.duration = moment(utils.getTimeDifference(timeDate, clonedObject.timeOut)).format("HH:mm");
                clonedObject.timeIn = moment(clonedObject.timeIn).format('YYYY-MM-DD HH:mm:ss');
                clonedObject.timeOut = moment(clonedObject.timeOut).format('YYYY-MM-DD HH:mm:ss');
                csvData.push(clonedObject);
              }
            }
            row.timeIn = moment(row.timeIn).format('YYYY-MM-DD HH:mm:ss');
            row.timeOut = moment(row.timeOut).format('YYYY-MM-DD HH:mm:ss');
            csvData.push(row);
          }
          let fileName = "./uploads/" + UniversalFunc.getRandomString() + ".csv";
          const json2csvParser = new Json2csvParser(constants.attendanceCsvFields);
          const csv = json2csvParser.parse(csvData);

          fs.writeFileSync(fileName, csv);

          let obj = {
            originalname: fileName,
            path: fileName
          };

          let csvFile = yield utilityService.uploadFile(logHandler, { file: obj });

          messageString = `Here is your timesheet report for current month --> \n` + utils.getMaskedUrl(logHandler, {url: csvFile.url});
//          fs.unlinkSync(fileName);
        } else {
          messageString = `No timesheet data for this month.`;
        }
      } else if ((message.includes(constants.attendanceMetric.CHANGE_MY_MANAGER))) {
        if (_.isEmpty(payload.tagged_users)) {
          messageString = `Please give manager name to update(e.g. change my manager @username).`;
        } else {
          let userManagerInfo = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
          let [managerInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.tagged_users[0] });

          if (!_.isEmpty(userManagerInfo) && userManagerInfo[0].manager_fugu_user_id && userManagerInfo[0].manager_fugu_user_id == payload.tagged_users[0]) {
            messageString = `<a class=\"tagged-agent tagged-user\" href=\"mention://${managerInfo.user_id}\" data-id=\"${managerInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${managerInfo.full_name}</a> is already your manager.`;
          } else {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.CHANGE_MANAGER_REQUEST,
              method: 'POST',
              attendance: true,
              json: {
                user_name        : "fugu" + userInfo.user_id,
                full_name        : userInfo.full_name,
                email            : userInfo.email,
                business_token   : businessInfo.attendance_token,
                manager_user_name: "fugu" + payload.tagged_users[0],
                manager_full_name: managerInfo.full_name,
                manager_email    : managerInfo.email
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);

            if (result.statusCode == 453) {
              messageString = `Already requested to change the manager.`;
            } else {
              let otherUserInfo;
              let hr_roles = [];
              result.data.hr_roles = result.data.hr_roles;
              if (!_.isEmpty(result.data.hr_roles)) {
                for (let data of result.data.hr_roles) {
                  data.user_id = data.user_name.split("fugu")[1];
                  hr_roles.push(data);
                }
              } else {
                let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                hr_roles.push({ user_id: ownerData[0].fugu_user_id, email: ownerData[0].email });
              }

              if ((_.isEmpty(userManagerInfo) || !userManagerInfo[0].manager_fugu_user_id)) {
                otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: hr_roles[0].user_id });
              } else {
                otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: userManagerInfo[0].manager_fugu_user_id });
                if (_.isEmpty(otherUserInfo) || otherUserInfo[0].status == constants.status.DISABLE) {
                  otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: hr_roles[0].user_id });
                }
              }
              messageString = `We have sent this request for approval to your current and new manager. Once approved by both of them, I will update the records.`;

              let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, otherUserInfo[0].user_id] });

              let managerBotChannelId;
              if (_.isEmpty(managerBotChannel)) {
                let usersIds            = [otherUserInfo[0].user_id, payload.bot_user_id];
                let params              = {};
                    params.chat_type    = constants.chatType.FUGU_BOT;
                    params.channel_type = constants.channelType.FUGU_BOT;
                    params.business_id  = businessInfo.business_id;
                    params.channel_name = "user_" + otherUserInfo[0].user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                    params.owner_id     = otherUserInfo[0].user_id;
                let response            = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                    managerBotChannelId = response.insertId;
                for (let i = 0; i < usersIds.length; i++) {
                  let updateObj            = {};
                      updateObj.user_id    = usersIds[i];
                      updateObj.channel_id = managerBotChannelId;
                      updateObj.status     = constants.userStatus.ENABLE;
                      updateObj.role       = constants.userRole.USER;
                  yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                }
              } else {
                managerBotChannelId = managerBotChannel.channel_id;
              }


              let managerPayload = {
                user_id          : payload.bot_user_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 14,
                server_push      : 0,
                is_thread_message: false,
                is_web           : true,
                message          : "Request for manager change",
              };


              let actionPayload = {
                confirmation_type: constants.leaveState.MANAGER_CHANGE_CONFIRMATION,
                tagged_user_id   : userInfo.user_id,
                leave_id         : result.data.change_manager_request_id,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 // Manager request id
                title            : `*<a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>* has requested for manager change. New Manager: <a class=\"tagged-agent tagged-user\" href=\"mention://${managerInfo.user_id}\" data-id=\"${managerInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${managerInfo.full_name}</a>`,
                buttons          : [{
                  label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
                },
                {
                  label: constants.buttonsForLeave.DENY, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
                }]
              };

              managerPayload.custom_actions = [actionPayload];
              publishMessage(logHandler, managerPayload, managerBotChannelId);
            }
          }
        }
      } else if (!(message.includes(constants.attendanceMetric.CHANGE_MY_MANAGER)) && (message == constants.attendanceMetric.TIMESHEET || !_.isEmpty(payload.tagged_users))) {
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.ATTENDANCE_TIMESHEET,
          method: 'POST',
          attendance: true,
          json: {
            business_token: businessInfo.attendance_token
          }
        };

        if (!_.isEmpty(payload.tagged_users)) {
          let otherUserInfo                  = yield bot.getTeamMembers(logHandler, { user_id: payload.tagged_users[0] });
              options.json.user_name         = "fugu" + payload.tagged_users[0];
              options.json.full_name         = otherUserInfo[0].full_name;
              options.json.email             = otherUserInfo[0].email;
              options.json.manager_user_name = "fugu" + userInfo.user_id;
        } else {
          options.json.user_name = "fugu" + userInfo.user_id;
          options.json.full_name = userInfo.full_name,
            options.json.email = userInfo.email;
        }

        if (options.json.user_name) {
          let result = yield utilityService.sendHttpRequest(logHandler, options);
          let total_time = 0;

          messageString = `Punch Log for `;
          if (result.statusCode != 200) {
            messageString = result.message;
          }
          else if (!_.isEmpty(result.data.timesheet)) {
            messageString = messageString + result.data.timesheet[0].today + `\n`;
            for (let row of result.data.timesheet) {
              messageString += `${row.time_in} In\n`;
              if (row.time_out) {
                messageString += `${row.time_out} Out\n`;
                total_time += row.clocked_out_time;
              } else {
                total_time += row.last_clocked_in;
              }
            }
            messageString += `Total Time : ${(moment.utc(total_time * 1000).format('HH:mm'))}`;
          } else if (!_.isEmpty(result.data.last_clocked_in_status) && !result.data.last_clocked_in_status[0].clocked_out && result.data.last_clocked_in_status[0].clocked_in) {
            messageString = messageString + result.data.last_clocked_in_status[0].today + `\n`;
            let currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0);
            currentDate.setDate(currentDate.getDate() - 1);
            messageString += `${(new Date(currentDate)).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} In\n`;
            messageString += `Total Time : ${moment(utils.getTimeDifference(currentDate, moment(new Date()).add(result.data.last_clocked_in_status[0].time_zone, 'm').toDate())).format("HH:mm")}`;
          } else if (!_.isEmpty(result.data.yesterday_status) && new Date(result.data.yesterday_status[0].clocked_out).getDate() != new Date(result.data.yesterday_status[0].clocked_in).getDate()) {
            messageString = messageString + result.data.last_clocked_in_status[0].today + `\n`;
            let currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0);
            currentDate.setDate(currentDate.getDate() - 1);

            messageString += `${(new Date(currentDate)).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} In\n`;
            currentDate.setMinutes(result.data.yesterday_status[0].time_zone);
            messageString += `${result.data.last_clocked_in_status[0].time_out} Out\n`;
            messageString += `Total Time : ${moment(utils.getTimeDifference(currentDate, moment(new Date(result.data.yesterday_status[0].clocked_out)).add(result.data.yesterday_status[0].time_zone, 'm').toDate())).format("HH:mm")}`;
          } else {
            messageString = `No in/out data for you for  ${result.data.last_clocked_in_status[0].today}.`;
          }
        }
      } else if (message == constants.attendanceMetric.TEAM_REPORT) {
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.ATTENDANCE_TEAM_REPORT,
          method: 'POST',
          attendance: true,
          json: {
            user_name     : "fugu" + userInfo.user_id,
            full_name     : userInfo.full_name,
            email         : userInfo.email,
            business_token: businessInfo.attendance_token,
            user_count    : "SINGLE_USER"
          }
        };

        let result = yield utilityService.sendHttpRequest(logHandler, options);
        messageString = `Your team's punch status\n`;
        if (!_.isEmpty(result.data)) {
          let punchIn = ``;
          let punchOut = ``;
          let yetToArrive = ``;
          for (let row of result.data) {
            if (row.time_out) {
              punchOut = punchOut + "- " + row.full_name + " - " + row.time_out + `\n`;
            } else if (row.time_in) {
              punchIn = punchIn + "- " + row.full_name + " - " + row.time_in + `\n`;
            } else {
              yetToArrive = yetToArrive + "- " + row.full_name + '\n';
            }
          }
          if (punchIn) messageString = messageString + "Punched In:\n" + punchIn + "\n";
          if (punchOut) messageString = messageString + "Punched Out:\n" + punchOut + "\n";
          if (yetToArrive) messageString = messageString + "Yet to arrive:\n" + yetToArrive + "\n";
        } else {
          messageString = `You do not have any reportees.`;
        }
      } else if (message == constants.attendanceMetric.BUSINESS_REPORT) {
        let getUserRole = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
        if (_.isEmpty(getUserRole)) {
          messageString = defaultString;
        } else if (getUserRole[0].role == constants.userRole.USER) {
          messageString = `You don't have access to download business report.`;
        } else {
          let options = {
            url: config.get('attendanceUrl') + constants.API_END_POINT.BUSINESS_REPORT + `?business_token=${businessInfo.attendance_token}&user_name=fugu` + userInfo.user_id,
            method: 'GET',
            attendance: true
          };

          let result = yield utilityService.sendHttpRequest(logHandler, options);
          result = JSON.parse(result);
          if (result.statusCode != 200) {
            messageString = result.message;
          } else if (!_.isEmpty(result)) {
            let csvData = result;
            let fileName = "./uploads/" + UniversalFunc.getRandomString() + ".csv";
            const json2csvParser = new Json2csvParser(constants.attendanceCsvFields);
            const csv = json2csvParser.parse(csvData.data);

            fs.writeFileSync(fileName, csv);

            let obj = {
              originalname: fileName,
              path: fileName
            };

            let csvFile = yield utilityService.uploadFile(logHandler, { file: obj });

            messageString = `Here is your business timesheet report for current month --> \n` + utils.getMaskedUrl(logHandler, {url: csvFile.url});
           // fs.unlinkSync(fileName);
          } else {
            messageString = `No data for your business till now.`;
          }
        }
      } else if (message == constants.attendanceMetric.HELP) {
        let getUserRole = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
        if (_.isEmpty(getUserRole)) {
          messageString = defaultString;
        } else if (getUserRole[0].role == constants.userRole.USER) {
          messageString = constants.messageForNewAttendanceBotChannel;
        } else {
          messageString = constants.messageForNewAttendanceBotChannel + constants.extraAttendanceFeatureForAdmin;
        }
      } else if (message == constants.attendanceMetric.MY_MANAGER) {
        let getUserRole = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
        if (_.isEmpty(getUserRole) || !getUserRole[0].manager_fugu_user_id) {
          messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
        } else {
          let managerInfo = yield userService.getUserDetail(logHandler, { user_id: getUserRole[0].manager_fugu_user_id });
          if (!_.isEmpty(managerInfo)) {
            messageString = `Your current Manager is <a class=\"tagged-agent tagged-user\" href=\"mention://${managerInfo[0].user_id}\" data-id=\"${managerInfo[0].user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${managerInfo[0].full_name}</a>`;
          } else {
            messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
          }
        }
      } else if (message == constants.attendanceMetric.OK) {
        messageString = "👍";
      } else if (message.includes(constants.attendanceMetric.HOLIDAYS) && [9,210].includes(businessInfo.workspace_id)) {
        content.message = ``;

        content.image_url = `https://fchat.s3.ap-south-1.amazonaws.com/default/VdpCESKXTL.1612013075044.png`;
        content.thumbnail_url = `https://fchat.s3.ap-south-1.amazonaws.com/default/VdpCESKXTL.1612013075044.png`;
        content.image_width = 672;
        content.image_height = 672;


        content.message_type = constants.messageType.IMAGE;
        publishMessage(logHandler, content, channelInfo.channel_id);
      } else if (message.includes(constants.attendanceMetric.DELETE) && message.includes(constants.attendanceMetric.LEAVE)) {
        let options = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
          method: 'POST',
          attendance: true,
          json: {
            user_name     : "fugu" + userInfo.user_id,
            full_name     : userInfo.full_name,
            email         : userInfo.email,
            business_token: businessInfo.attendance_token
          }
        };

        let result = yield utilityService.sendHttpRequest(logHandler, options);
        if (result.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
          messageString = result.message;
        } else if (!_.isEmpty(result.data)) {
          let pendingApprovalForLeave = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.data, channel_id: channelInfo.channel_id });
          if (!_.isEmpty(pendingApprovalForLeave)) {
            content.message_type = constants.messageType.BUTTON;
            messageString = "Your leaves.";
            content.custom_actions = [];
            for (let data of pendingApprovalForLeave) {
              let actionObject                   = {};
                  actionObject.title             = data.title.replace(/\"/g, '');
                  actionObject.leave_id          = data.leave_id;
                  actionObject.is_action_taken   = false;
                  actionObject.confirmation_type = constants.leaveState.USER_DELETE_LEAVE_CONFIRMATION;
                  actionObject.buttons           = [{
                label: constants.buttonsForLeave.DELETE, action: constants.buttonsForLeave.DELETE, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH
              }];
              content.custom_actions.push(actionObject);
            }
          } else {
            messageString = "❗You don't have any upcoming leaves.";
          }
        } else {
          messageString = `❗You don't have any upcoming leaves.`;
        }
      } else if ((message.includes(constants.attendanceMetric.LEAVE) && payload.leave_start_date) || (message.includes(constants.leaveMetricTypes.WORK_FROM_HOME) && payload.leave_start_date)) {
        let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });

        if (getUserRole.manager_fugu_user_id) {
          let options = {
            url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
            method: 'POST',
            attendance: true,
            json: {
              user_name       : "fugu" + userInfo.user_id,
              full_name       : userInfo.full_name,
              email           : userInfo.email,
              business_token  : businessInfo.attendance_token,
              leave_start_date: payload.leave_start_date,
              status          : constants.leaveStatus.REQUESTED,
              leave_type      : payload.leave_type || constants.leaveTypes.CASUAL,
              message         : message    ,
              timezone        : payload.time_zone
            }
          };


          if (message.includes(constants.leaveMetricTypes.FIRST_HALF)) {
            options.json.day_time = constants.halfDayTypes.FIRST_HALF;
            options.json.requested_leaves = constants.halfDayLeaveDeduction;
          } else if (message.includes(constants.leaveMetricTypes.SECOND_HALF)) {
            options.json.day_time = constants.halfDayTypes.SECOND_HALF;
            options.json.requested_leaves = constants.halfDayLeaveDeduction;
          } else if (message.includes(constants.leaveMetricTypes.WORK_FROM_HOME)) {
            options.json.message += " wfh";
            options.json.day_time = constants.workFromHome;
          }

          payload.leave_end_date ? options.json.leave_end_date = payload.leave_end_date : 0;
          let result = yield utilityService.sendHttpRequest(logHandler, options);

          if (result.statusCode == 200) {
            let actionPayload = {
              title            : `*` + result.data.message + `*`,
              confirmation_type: constants.leaveState.USER_LEAVE_CONFIRMATION,
              leave_id         : result.data.leave_id,
              tagged_user_id   : userInfo.user_id,
              is_action_taken  : false,
              buttons          : [{
                label: constants.buttonsForLeave.CONFIRM, action: constants.buttonsForLeave.CONFIRM, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
              },
              {
                label: constants.buttonsForLeave.CANCEL, action: constants.buttonsForLeave.CANCEL, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
              }]
            };

            messageString = `Please Confirm`,

              content.message_type = constants.messageType.BUTTON,
              actionPayload.default_text_field = {
                action: constants.buttonsForLeave.COMMENT, output: constants.textFieldAction.COMMENT, is_required: true, minimum_length: constants.defaultTextFieldCharacterLength, hint: constants.defaultTextFieldHint, id: 1
              };
            content.custom_actions = [actionPayload];
          } else if (result.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
            messageString = result.message;
          } else if (result.statusCode == 450) {
            let [pendingApprovalForLeave] = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.data.leave_id, channel_id: channelInfo.channel_id });
            messageString = `You have an ${result.data.status.toLowerCase()} leave, whose leave period overlaps with the one that you are trying to apply. Please change your dates and try again.`;
            content.custom_actions = [{ title: '*Existing leave request*\n' + pendingApprovalForLeave.title.replace(/\"/g, '') }];
            content.message_type = constants.messageType.BUTTON;
          } else if (result.statusCode == 458) {
                content.message_type           = constants.messageType.BUTTON;
                messageString                  = `Leave confirmation.`;
                content.custom_actions         = [];
            let actionObject                   = {};
                actionObject.title             = `*Please confirm your leave type.*`;
                actionObject.is_action_taken   = false;
                actionObject.confirmation_type = constants.leaveState.LEAVE_TYPE_SELECT;

            let buttons = [];
            for (let data of result.data) {
              buttons.push({
                label: data.title, action: data.title, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, type_id: data.leave_type_id
              });
            }
            actionObject.buttons = buttons;
            content.custom_actions.push(actionObject);
            content.start_time      = result.data[0].leave_start_date;
            content.end_time        = result.data[0].leave_end_date;
            content.message_content = result.data[0].message;
          } else {
            messageString = result.message;
          }
        } else {
          messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
        }
      } else if (payload.button_action && payload.button_data) {
        let [messageData] = yield conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: channelInfo.channel_id });
        utils.addAllKeyValues(utils.jsonToObject(logHandler, messageData.message), messageData);
        if (payload.button_data.confirmation_type == constants.leaveState.USER_LEAVE_CONFIRMATION) {
          if (payload.button_action == constants.buttonsForLeave.CANCEL) {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
              method: 'POST',
              attendance: true,
              json: {
                user_name     : "fugu" + userInfo.user_id,
                full_name     : userInfo.full_name,
                email         : userInfo.email,
                business_token: businessInfo.attendance_token,
                leave_id      : payload.button_data.leave_id,
                status        : constants.leaveStatus.CANCELLED
              }
            };
            yield utilityService.sendHttpRequest(logHandler, options);
            messageString = `Alright! I cancelled the request.`;
          } else if (payload.button_action == constants.buttonsForLeave.CONFIRM) {
            let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });

            if (getUserRole.manager_fugu_user_id) {
              let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, getUserRole.manager_fugu_user_id] });

              let managerBotChannelId;
              if (_.isEmpty(managerBotChannel)) {
                let usersIds            = [getUserRole.manager_fugu_user_id, payload.bot_user_id];
                let params              = {};
                    params.chat_type    = constants.chatType.FUGU_BOT;
                    params.channel_type = constants.channelType.FUGU_BOT;
                    params.business_id  = businessInfo.business_id;
                    params.channel_name = "user_" + getUserRole.manager_fugu_user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                    params.owner_id     = getUserRole.manager_fugu_user_id;
                let response            = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                    managerBotChannelId = response.insertId;
                for (let i = 0; i < usersIds.length; i++) {
                  let updateObj            = {};
                      updateObj.user_id    = usersIds[i];
                      updateObj.channel_id = managerBotChannelId;
                      updateObj.status     = constants.userStatus.ENABLE;
                      updateObj.role       = constants.userRole.USER;
                  yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                }
              } else {
                managerBotChannelId = managerBotChannel.channel_id;
              }

              messageString = `I have sent your request to your manager for approval. Will update you on the status.`;

              let managerPayload = {
                user_id          : payload.bot_user_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 14,
                server_push      : 0,
                is_thread_message: false,
                muid             : UniversalFunc.getRandomString(),
                is_web           : true,
                message          : "Request for approval.",
              };

              let actionPayload = {
                confirmation_type: constants.leaveState.MANAGER_LEAVE_APPROVAL,
                leave_id: payload.button_data.leave_id,
                tagged_user_id: userInfo.user_id,
                title: `*<a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>* has requested ${(payload.button_data.title).split("*").join("")}`
              };

              payload.button_data.comment ? actionPayload.comment = payload.button_data.comment : 0;

              actionPayload.buttons = [{
                label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
              },
              {
                label: constants.buttonsForLeave.NOT_APPROVED, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
              },
              {
                label: constants.buttonsForLeave.REMARK, action: constants.buttonsForLeave.REMARK, style: constants.buttonStyles.DEFAULT, action_type: constants.buttonActionTypes.TEXT_FIELD, output: constants.textFieldAction.REMARK, id: 3
              }];

              managerPayload.custom_actions = [actionPayload];

              publishMessage(logHandler, managerPayload, managerBotChannelId);
            } else {
              messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
            }
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.MANAGER_LEAVE_APPROVAL) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          messageString = `Thanks! I will update`;

          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
              method: 'POST',
              attendance: true,
              json: {
                user_name     : "fugu" + userInfo.user_id,
                full_name     : userInfo.full_name,
                email         : userInfo.email,
                business_token: businessInfo.attendance_token,
                leave_id      : payload.button_data.leave_id,
                leave_type    : constants.leaveTypes.CASUAL,
                status        : constants.leaveStatus.APPROVED
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);

            if (result.statusCode == 452) {
              messageString = `The leave requested by <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span> has already been dismissed.`;
            } else if (result.statusCode == 409) {
              messageString = `This leave has already been approved.`
            } else {
              let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
              let userPayload = {
                user_id          : payload.bot_user_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 1,
                server_push      : 0,
                is_thread_message: false,
                muid             : UniversalFunc.getRandomString(),
                is_web           : true,
                message          : `👍 Good News.\nYour request for ${(payload.button_data.title).split("requested ")[1]} is approved.`
              };


              payload.button_data[constants.textFieldAction.REMARK] ? userPayload.message += `\n*Remarks* : ${payload.button_data.remark}` : 0;

              messageString += ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

              publishMessage(logHandler, userPayload, userBotChannel.channel_id);
              let hr_roles = [];

              result.data.hr_roles = result.data.hr_roles;
              if (!_.isEmpty(result.data.hr_roles)) {
                for (let data of result.data.hr_roles) {
                  data.user_id = data.user_name.split("fugu")[1];
                  hr_roles.push(data);
                }
              } else {
                let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                hr_roles.push({ user_id: ownerData[0].fugu_user_id, email: ownerData[0].email });
              }


              let hrPayload = {
                user_id          : payload.bot_user_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 1,
                server_push      : 0,
                is_thread_message: false,
                is_web           : true,
                message          : ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a> is on  ${(payload.button_data.title).split("requested ")[1]}`
              };
              payload.button_data.comment ? hrPayload.message = hrPayload.message + "\n*Comment:* " + payload.button_data.comment : 0;


              let mailPayload = {
                title            : (payload.button_data.title).split("requested ")[1] + `(${moment(result.data.leave_day).format('Do MMMM YYYY')})`,
                email            : taggedUserInfo.emails,
                approved_by      : userInfo.full_name,
                domain_id        : businessInfo.domain_id,
                email_credentials: businessInfo.email_credentials
              };
              if (result.data.userInfo[0].employee_id) {
                mailPayload.employee_id = result.data.userInfo[0].employee_id;
              } else {
                mailPayload.comment_start = `<!--`;
                mailPayload.comment_end = `-->`;
              }


              if (!_.isEmpty(hr_roles)) {
                for (let data of hr_roles) {
                  let [hrBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, data.user_id] });

                  if (_.isEmpty(hrBotChannel)) {
                    let usersIds            = [data.user_id, payload.bot_user_id];
                    let params              = {};
                        params.chat_type    = constants.chatType.FUGU_BOT;
                        params.channel_type = constants.channelType.FUGU_BOT;
                        params.business_id  = businessInfo.business_id;
                        params.channel_name = "user_" + data.user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                        params.owner_id     = data.user_id;
                    let response            = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                        hrBotChannel        = response.insertId;
                    for (let i = 0; i < usersIds.length; i++) {
                      let updateObj            = {};
                          updateObj.user_id    = usersIds[i];
                          updateObj.channel_id = hrBotChannel;
                          updateObj.status     = constants.userStatus.ENABLE;
                          updateObj.role       = constants.userRole.USER;
                      yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                    }
                  } else {
                    hrBotChannel = hrBotChannel.channel_id;
                  }

                  yield publishMessage(logHandler, hrPayload, hrBotChannel);
                  sendEmail(constants.emailType.LEAVE_MAIL, mailPayload, data.email, `${taggedUserInfo.full_name} is on leave.`);
                }
              }
              if (result.data.leaveInfo) {
                bot.insertMembersOnLeave(logHandler, result.data.leaveInfo)
              }
            }
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
              method: 'POST',
              attendance: true,
              json: {
                user_name     : "fugu" + userInfo.user_id,
                full_name     : userInfo.full_name,
                email         : userInfo.email,
                business_token: businessInfo.attendance_token,
                leave_id      : payload.button_data.leave_id,
                status        : constants.leaveStatus.REJECTED
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);

            messageString += ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span>`;

            if (result.statusCode == 452) {
              messageString = `The leave requested by <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span> has already been dismissed.`;
            } else {
              let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
              let userPayload = {
                user_id          : payload.bot_user_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 1,
                server_push      : 0,
                is_thread_message: false,
                muid             : UniversalFunc.getRandomString(),
                is_web           : true,
                message          : `🙁 Some Bad News.\nYour request for ${(payload.button_data.title).split("requested ")[1]} is not approved.`,
              };

              payload.button_data[constants.textFieldAction.REMARK] ? userPayload.message += `\nCommented by <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> : ${payload.button_data[constants.textFieldAction.REMARK]}` : 0;

              yield publishMessage(logHandler, userPayload, userBotChannel.channel_id);
            }
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.USER_DELETE_LEAVE_CONFIRMATION) {
          if (payload.button_action == constants.buttonsForLeave.DELETE) {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
              method: 'POST',
              attendance: true,
              json: {
                user_name     : "fugu" + userInfo.user_id,
                full_name     : userInfo.full_name,
                email         : userInfo.email,
                business_token: businessInfo.attendance_token,
                leave_id      : payload.button_data.leave_id,
                status        : constants.leaveStatus.DISMISSED
              }
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            if (result.statusCode == 409) {
              messageString = `This leave has already been deleted.`
            } else if (result.statusCode == 408) {
              messageString = `Not allowed to delete this leave.`
            } else {
              if (result.data.leaveInfo) {
                bot.removeDismissedLeaves(logHandler, result.data.leaveInfo)
              }

              messageString = `Alright! I dismissed the request of ${payload.button_data.title.replace(/\*/g, '')}`;
              let mailPayload = {
                message: `The leave request has been cancelled by ${userInfo.full_name}`,
                title: payload.button_data.title.replace(/\*/g, '') + `(${moment(result.data.leave_day).format('Do MMMM YYYY')})`,
                email: userInfo.email,
                approved_by_comment_start: '<!--',
                approved_by_comment_end: '-->',
                domain_id: businessInfo.domain_id,
                email_credentials: businessInfo.email_credentials
              };
              if (result.data.userInfo[0].employee_id) {
                mailPayload.employee_id = result.data.userInfo[0].employee_id;
              } else {
                mailPayload.comment_start = `<!--`;
                mailPayload.comment_end = `-->`;
              }
              if (result.data.leave_status == constants.leaveStatus.APPROVED) {
                let [userManagerInfo] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
                if (userManagerInfo.manager_fugu_user_id) {
                  let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, userManagerInfo.manager_fugu_user_id] });
                  if (managerBotChannel.channel_id) {
                    let managerPayload = {
                      user_id          : payload.bot_user_id,
                      date_time        : utils.getCurrentTime(),
                      is_typing        : 0,
                      message_type     : 1,
                      server_push      : 0,
                      is_thread_message: false,
                      is_web           : true,
                    };

                    let display_date= (payload.button_data.title.includes('Tomorrow') || payload.button_data.title.includes('Today'))?`(${moment(result.data.leave_day).format('Do MMMM YYYY')})`:``;
                    managerPayload.message = `FYI - <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> has dismissed the request for ${payload.button_data.title} ${display_date}`;

                    publishMessage(logHandler, managerPayload, managerBotChannel.channel_id);
                  } else {
                    messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
                  }
                }

                let hr_roles = [];
                result.data.hr_roles = result.data.hr_roles;
                if (!_.isEmpty(result.data.hr_roles)) {
                  for (let data of result.data.hr_roles) {
                    data.user_id = data.user_name.split("fugu")[1];
                    hr_roles.push(data);
                  }
                } else {
                  let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                  hr_roles.push({ user_id: ownerData[0].fugu_user_id, email: ownerData[0].email });
                }
                let display_date= (payload.button_data.title.includes('Tomorrow') || payload.button_data.title.includes('Today'))?`(${moment(result.data.leave_day).format('Do MMMM YYYY')})`:``;
                let hrPayload = {
                  user_id          : payload.bot_user_id,
                  date_time        : utils.getCurrentTime(),
                  is_typing        : 0,
                  message_type     : 1,
                  server_push      : 0,
                  is_thread_message: false,
                  is_web           : true,
                  message          : ` <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> has dismissed ${payload.button_data.title.replace(/\*/g, '')} ${display_date}`
                };


                if (!_.isEmpty(hr_roles)) {
                  for (let data of hr_roles) {
                    let [hrBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, data.user_id] });

                    if (_.isEmpty(hrBotChannel)) {
                      let usersIds            = [data.user_id, payload.bot_user_id];
                      let params              = {};
                          params.chat_type    = constants.chatType.FUGU_BOT;
                          params.channel_type = constants.channelType.FUGU_BOT;
                          params.business_id  = businessInfo.business_id;
                          params.channel_name = "user_" + data.user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                          params.owner_id     = data.user_id;
                      let response            = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                          hrBotChannel        = response.insertId;
                      for (let i = 0; i < usersIds.length; i++) {
                        let updateObj            = {};
                            updateObj.user_id    = usersIds[i];
                            updateObj.channel_id = hrBotChannel;
                            updateObj.status     = constants.userStatus.ENABLE;
                            updateObj.role       = constants.userRole.USER;
                        yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                      }
                    } else {
                      hrBotChannel = hrBotChannel.channel_id;
                    }

                    yield publishMessage(logHandler, hrPayload, hrBotChannel);
                    sendEmail(constants.emailType.LEAVE_MAIL, mailPayload, data.email, `${userInfo.full_name} cancelled the leave.`);
                  }
                }
            }
            }
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.MANAGER_CHANGE_CONFIRMATION) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let [newManagerID] = yield bot.getNewManagerId(logHandler, { id: payload.button_data.leave_id });
            let newManagerUserId = newManagerID.user_name.split("fugu")[1];

            let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, newManagerUserId] });

            let managerBotChannelId;
            if (_.isEmpty(managerBotChannel)) {
              let usersIds            = [newManagerUserId, payload.bot_user_id];
              let params              = {};
                  params.chat_type    = constants.chatType.FUGU_BOT;
                  params.channel_type = constants.channelType.FUGU_BOT;
                  params.business_id  = businessInfo.business_id;
                  params.channel_name = "user_" + newManagerUserId + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                  params.owner_id     = newManagerUserId;
              let response            = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                  managerBotChannelId = response.insertId;
              for (let i = 0; i < usersIds.length; i++) {
                let updateObj            = {};
                    updateObj.user_id    = usersIds[i];
                    updateObj.channel_id = managerBotChannelId;
                    updateObj.status     = constants.userStatus.ENABLE;
                    updateObj.role       = constants.userRole.USER;
                yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
              }
            } else {
              managerBotChannelId = managerBotChannel.channel_id;
            }

            let managerPayload = {
              user_id          : payload.bot_user_id,
              date_time        : utils.getCurrentTime(),
              is_typing        : 0,
              message_type     : 14,
              server_push      : 0,
              is_thread_message: false,
              muid             : UniversalFunc.getRandomString(),
              is_web           : true,
              message          : "Request for manager change",
            };

            let actionPayload = {
              confirmation_type: constants.managerChange.NEW_MANAGER_APPROVAL,
              leave_id: payload.button_data.leave_id,
              tagged_user_id: payload.button_data.tagged_user_id,
              title: `*<a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>* has requested you to be his/her new manager, kindly approve so that I can update my records.`
            };

            actionPayload.buttons = [{
              label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
            },
            {
              label: constants.buttonsForLeave.DENY, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
            }];

            managerPayload.custom_actions = [actionPayload];

            publishMessage(logHandler, managerPayload, managerBotChannelId);
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            let userPayload = {
              user_id: payload.bot_user_id,
              date_time: utils.getCurrentTime(),
              is_typing: 0,
              message_type: 1,
              server_push: 0,
              is_thread_message: false,
              muid: UniversalFunc.getRandomString(),
              is_web: true,
              message: `Your request for changing the manager has been rejected by your current manager <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>`
            };
            yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });

            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          }
        } else if (payload.button_data.confirmation_type == constants.managerChange.NEW_MANAGER_APPROVAL) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            yield bot.updateManagerInAttendance(logHandler, { id: payload.button_data.leave_id }); // leave id = request id for changing manager
            yield bot.updateUserManager(logHandler, { full_name: userInfo.full_name, manager_fugu_user_id: userInfo.user_id, user_id: payload.button_data.tagged_user_id });
            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            

            let userPayload = {
              user_id          : payload.bot_user_id,
              date_time        : utils.getCurrentTime(),
              is_typing        : 0,
              message_type     : 1,
              server_push      : 0,
              is_thread_message: false,
              muid             : UniversalFunc.getRandomString(),
              is_web           : true,
              message          : `Hi there, your manager change request has been approved. Your new manager is <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>. I have updated the records. Good Day!`
            };

            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            let userPayload = {
              user_id          : payload.bot_user_id,
              date_time        : utils.getCurrentTime(),
              is_typing        : 0,
              message_type     : 1,
              server_push      : 0,
              is_thread_message: false,
              muid             : UniversalFunc.getRandomString(),
              is_web           : true,
              message          : `Your request for changing the manager has been rejected by your new manager <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>`
            };
            yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });


            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.LEAVE_TYPE_SELECT) {
          let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });

          if (getUserRole.manager_fugu_user_id) {
            let options = {
              url: config.get('attendanceUrl') + constants.API_END_POINT.LEAVE,
              method: 'POST',
              attendance: true,
              json: {
                user_name       : "fugu" + userInfo.user_id,
                full_name       : userInfo.full_name,
                email           : userInfo.email,
                business_token  : businessInfo.attendance_token,
                leave_start_date: messageData.start_time,
                status          : constants.leaveStatus.REQUESTED,
                leave_type      : payload.leave_type || constants.leaveTypes.CASUAL,
                message         : messageData.message_content,
                timezone        : payload.time_zone
              }
            };

            if (payload.button_data.button) {
              let buttonObject = utils.isString(payload.button_data.button) ? utils.jsonParse(payload.button_data.button) : payload.button_data.button;
              options.json.leave_type_id = buttonObject.leave_type_id;
            } else {
              options.json.title = payload.button_action;
            }

            if (messageData.message_content.includes(constants.leaveMetricTypes.FIRST_HALF)) {
              options.json.day_time = constants.halfDayTypes.FIRST_HALF;
              options.json.requested_leaves = constants.halfDayLeaveDeduction;
            } else if (messageData.message_content.includes(constants.leaveMetricTypes.SECOND_HALF)) {
              options.json.day_time = constants.halfDayTypes.SECOND_HALF;
              options.json.requested_leaves = constants.halfDayLeaveDeduction;
            } else if (messageData.message_content.includes(constants.leaveMetricTypes.WORK_FROM_HOME)) {
              options.json.message += " wfh";
              options.json.day_time = constants.workFromHome;
            }

            messageData.end_time ? options.json.leave_end_date = messageData.end_time : 0;
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            if (result.statusCode == 200) {
              let actionPayload = {
                title: `*` + result.data.message + `*`,
                confirmation_type: constants.leaveState.USER_LEAVE_CONFIRMATION,
                leave_id: result.data.leave_id,
                tagged_user_id: userInfo.user_id,
                is_action_taken: false,
                buttons: [{
                  label: constants.buttonsForLeave.CONFIRM, action: constants.buttonsForLeave.CONFIRM, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
                },
                {
                  label: constants.buttonsForLeave.CANCEL, action: constants.buttonsForLeave.CANCEL, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
                }]
              };

              messageString = `Please Confirm`,

                content.message_type = constants.messageType.BUTTON,
                actionPayload.default_text_field = {
                  action: constants.buttonsForLeave.COMMENT, output: constants.textFieldAction.COMMENT, is_required: true, minimum_length: constants.defaultTextFieldCharacterLength, hint: constants.defaultTextFieldHint, id: 1
                };
              content.custom_actions = [actionPayload];
            } else if (result.statusCode == 450) {
              let [pendingApprovalForLeave] = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.data.leave_id, channel_id: channelInfo.channel_id });
              messageString = `You have an ${result.data.status.toLowerCase()} leave, whose leave period overlaps with the one that you are trying to apply. Please change your dates and try again.`;
              content.custom_actions = [{ title: '*Existing leave request*\n' + pendingApprovalForLeave.title.replace(/\"/g, '') }];
              content.message_type = constants.messageType.BUTTON;
            } else if (result.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
              messageString = result.message;
            } else {
              messageString = `Not able to take action.`;
            }
          }
        } else if (payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING || payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_OUT_FENCING) {
          if (payload.button_action == constants.buttonsForLeave.CONFIRM) {
            let hrIds = [];
            let result = yield bot.getTeamMembers(logHandler, payload);
            let checkSendMessageToHr = yield workspaceService.getBusinessPropertyValue(logHandler,{workspace_id: businessInfo.workspace_id, property: 'send_punch_in_confirm_hr'});
            if(!_.isEmpty(checkSendMessageToHr) && checkSendMessageToHr[0].value == 1){
            let getHrForAttendanceBot = yield bot.getHrForAttendanceBot(logHandler, {business_token: businessInfo.attendance_token, role: 'HR', workspace_name: businessInfo.workspace_name});
              if(!_.isEmpty(getHrForAttendanceBot)){
                hrIds = _.pluck(getHrForAttendanceBot, 'user_id');
              }
            }
            hrIds.push(result[0].manager_fugu_user_id);// inserting manager user id
            let attendanceUsers = yield bot.getChannelsWithAttendanceBotUser(logHandler, { usersId: hrIds});
            for(let i =0; i < attendanceUsers.length; i++){
              let messagePayload = {
                user_id          : attendanceUsers[i].bot_id,
                business_id      : attendanceUsers[i].business_id,
                date_time        : utils.getCurrentTime(),
                is_typing        : 0,
                message_type     : 14,
                server_push      : 0,
                is_thread_message: false,
                is_web           : true,
                muid             : UniversalFunc.getRandomString(),
                message          : "wrong punch-in location message",
                start_time       : messageData.start_time
              };

              let actionPayload = {
                tagged_user_id: result[0].fugu_user_id,
                title: `*<a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>* has Punched In from different location. Do you want to approve the location? <a class=\"tagged-agent tagged-user\" href=\"mention://${result[0].manager_fugu_user_id}\" data-id=\"${result[0].manager_fugu_user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\"></a>`,
                buttons: [{
                  label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
                },
                {
                  label: constants.buttonsForLeave.DENY, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
                }]
              };
              payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING ? actionPayload.confirmation_type = constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION : actionPayload.confirmation_type = constants.punchState.MANAGER_PUNCH_OUT_CONFIRMATION;
              payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING ? messagePayload.message = "Punch in request"  : messagePayload.message = "Punch out request.";
              if(payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_OUT_FENCING){
                 actionPayload.title = actionPayload.title.replace("Punched In", "Punched Out")
              }
              messageData.link ? actionPayload.title += `\n${messageData.link}` : 0
              messagePayload.custom_actions = [actionPayload];
              yield publishMessage(logHandler, messagePayload, attendanceUsers[i].channel_id);
            }

          } else if (payload.button_action == constants.buttonsForLeave.CANCEL) {
            messageString = "Okay i cancelled your request.";
          }
        } else if (payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION || payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_OUT_CONFIRMATION) {
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });

            let options = {
              url: config.get('attendanceUrl'),
              method: 'POST',
              attendance: true,
              json: {
                user_name           : "fugu" + payload.button_data.tagged_user_id,
                full_name           : taggedUserInfo.full_name,
                email               : taggedUserInfo.email,
                business_token      : businessInfo.attendance_token,
                in_time             : messageData.start_time,
                authentication_level: constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE
              }
            };
            payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION ? options.url += constants.API_END_POINT.ATTENDANCE_CLOCK_IN : options.url += constants.API_END_POINT.ATTENDANCE_CLOCK_OUT;

            let result = yield utilityService.sendHttpRequest(logHandler, options);

            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            let userPayload = {
              user_id: payload.bot_user_id,
              date_time: utils.getCurrentTime(),
              is_typing: 0,
              message_type: 1,
              server_push: 0,
              is_thread_message: false,
              is_web: true,
              message: result.message
            };
            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            let sendMessageToUser = true;
            let punchRequest = "in";
            let deny_by = 'manager';
            let checkSendMessageToHr = yield workspaceService.getBusinessPropertyValue(logHandler,{workspace_id: businessInfo.workspace_id, property: constants.WORKSPACE_PROPERTY.SEND_MESSAGE_TO_HR});
            if(!_.isEmpty(checkSendMessageToHr) && checkSendMessageToHr[0].value == 1){
              let checkUserAlreadyClockIn = yield bot.checkUserAttendanceFromUserId(logHandler, {user_id: payload.button_data.tagged_user_id});
              if(!_.isEmpty(checkUserAlreadyClockIn)){
                let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, userInfo.user_id] });
                let userPayload = {
                  user_id          : payload.bot_user_id,
                  date_time        : utils.getCurrentTime(),
                  is_typing        : 0,
                  message_type     : 1,
                  server_push      : 0,
                  is_thread_message: false,
                  muid             : UniversalFunc.getRandomString(),
                  is_web           : true,
                  message          : `You Can't deny the request`
                };
                publishMessage(logHandler, userPayload, userBotChannel.channel_id);
                sendMessageToUser = false;
              }else{
                let checkApprovedByHrOrNot = yield botservice.getAttendanceUserInfo(logHandler,{user_name:'fugu' + userInfo.user_id});
               if(!_.isEmpty(checkApprovedByHrOrNot) && checkApprovedByHrOrNot[0].role == 'HR'){
                 deny_by = 'HR';
               }
              }
            }
            if(sendMessageToUser){
            payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION ? punchRequest = "in": punchRequest = "out";

            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            let userPayload = {
              user_id          : payload.bot_user_id,
              date_time        : utils.getCurrentTime(),
              is_typing        : 0,
              message_type     : 1,
              server_push      : 0,
              is_thread_message: false,
              muid             : UniversalFunc.getRandomString(),
              is_web           : true,
              message          : `Your request for punching ${punchRequest} from different location has been rejected by your  ${deny_by} <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>`
            };

            yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });

            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          }
         }
        }
        else {
          messageString = `Not able to take action.`;
        }

        for (let data of messageData.custom_actions) {
          if (data.leave_id == payload.button_data.leave_id) {
            if ((!data.comment && payload.button_data.comment) || payload.button_action == constants.buttonsForLeave.COMMENT) {
              data.comment = payload.button_data.comment;
            } else if ((!data.remark && payload.button_data.remark) || payload.button_action == constants.buttonsForLeave.REMARK) {
              data.remark ? data.remark = data.remark + "\n" + payload.button_data.remark : data.remark = payload.button_data.remark;
            }
            if (payload.button_action != constants.buttonsForLeave.COMMENT && payload.button_action != constants.buttonsForLeave.REMARK) {
              data.is_action_taken = true;
            }
          }
        }
        yield conversationService.updateInfo(logHandler, { message_id: messageData.id, message: JSON.stringify(messageData) });

        if (payload.button_action == constants.buttonsForLeave.COMMENT || payload.button_action == constants.buttonsForLeave.REMARK) {
          return {};
        }
      } else {
        messageString = defaultString;
      }

      if (!messageString) {
        return;
      }

      content.message = messageString;
      content.channel_id = channelInfo.channel_id;
      publishMessage(logHandler, content, channelInfo.channel_id);
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      console.error(":::::::::::", error)
      logger.error(logHandler, { ERROR: error });
      resolve();
    });
  });
}

function publishMessage(logHandler, payload, channel_id) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      return yield Promise.promisify(chathandler.handlePublish).call(null, { data: payload, channel: "/" + channel_id, is_socket_io: true });
    })().then((data) => {
      // logger.debug(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

async function installApps(logHandler, payload) {
  if (payload.status || payload.status == "0") {
    let userRole = await bot.getTeamMembers(logHandler, { user_id: payload.userInfo.user_id });
    if (_.isEmpty(userRole) || userRole[0].role == constants.userRole.USER) {
      throw new Error("You are not authorized")
    }
  }

  if(payload.workspace_id) {
    if(payload.workspace_id != payload.userInfo.workspace_id) {
      throw new Error("Invaid Workspace")
    }
  }
  
  if (payload.app_state) {
    bot.updateAppState(logHandler, { app_state: payload.app_state, workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, status: payload.status });
    return {};
  }

  if (payload.app_id == constants.AppIdCheck.ATTENDANCE_BOT_APP_ID || payload.app_id == constants.AppIdCheck.VIDEO_CONFERENCE || payload.app_id == constants.AppIdCheck.HRM_APP_ID) {
    payload.app_state = constants.appState.ACTIVE
  }
  let appDetails = await bot.getApps(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id });
  if (appDetails[0].app_state == constants.appState.EXPIRED) {
    throw new Error("Unauthorized.")
  }

  await bot.insertOrUpdateApp(logHandler, {
    workspace_id: payload.workspace_id, app_id: payload.app_id, status: typeof payload.status == 'undefined' ? 1 : payload.status, app_state: payload.app_state
  })
  if(payload.app_id == constants.AppIdCheck.FUGU_LIVE){
    let getData = await workspaceService.getWorkspaceConfiguration(logHandler, payload.workspace_id, constants.WORKSPACE_PROPERTY.LIVE_STREAM_PERMISSION);
    if(_.isEmpty(getData)){
      await workspaceService.insertWorkspacePropertyOnInstallApp(logHandler,{ workspace_id: payload.workspace_id, property: constants.WORKSPACE_PROPERTY.LIVE_STREAM_PERMISSION, values: JSON.stringify(["ADMIN", "OWNER"])});
    }
  }
  if (appDetails[0].bot_user_type == constants.userType.ATTENDANCE_BOT) {
    if (payload.hasOwnProperty("status")) {
      bot.updateAppState(logHandler, { app_state: payload.app_state, workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, status: payload.status });
      return {};
    }
    let business_token = md5(payload.businessInfo.app_secret_key + Math.random())
    let options = {
      url: config.get('attendanceUrl') + constants.API_END_POINT.CREATE_BUSINESS,
      method: 'POST',
      attendance: true,
      json: {
        business_token: business_token,
        business_name: payload.businessInfo.workspace_name,
        time_zone: payload.time_zone || 0
      }
    };
    let result = await utilityService.sendHttpRequest(logHandler, options);

    if (result.statusCode == 400) {
      throw new Error("Invalid Business");
    }
    await workspaceService.updateInfo(logHandler, { attendance_token: business_token, where_clause: { workspace_id: payload.businessInfo.workspace_id } });

    let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let user_ids = userDetails.map(x => x["user_id"]);

    let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: appDetails[0].name, user_type: constants.userType.ATTENDANCE_BOT, user_unique_key: appDetails[0].bot_user_id, user_image: constants.attendanceBotImageUrl, original_image: constants.attendanceBotImageUrl })

    // API
    //let workspaceDetails = yield businessService.getBusinessDetails(logHandler, { app_secret_key: payload.businessInfo.app_secret_key });
    //yield bot.insertBotUserDetails(logHandler, { user_id: appDetails[0].bot_user_id, full_name: appDetails[0].name, workspace_id: workspaceDetails[0].workspace_id, user_image: appDetails[0].icon, user_thumbnail_image: appDetails[0].icon, fugu_user_id: insertBotUser.user_id, status: "DISABLED", accepted_policies: "YES" })
    let attendanceBotId = await bot.getBotInfo(logHandler,{workspace_id: payload.businessInfo.workspace_id, user_type: constants.userType.ATTENDANCE_BOT});
    let channelsWithAttendanceBot = await bot.getBotChannelId(logHandler, {attendance_user_id: attendanceBotId[0]["user_id"], user_ids: user_ids});


    let usersAlreadyHavingChannel = channelsWithAttendanceBot.map(x => x["human_id"]);
    user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));

    for (let user_id of user_ids) {
      let usersIds = [user_id, insertBotUser.insertId];

      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = usersIds[0];
      let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
      let channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = channel_id;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        updateObj.business_id = payload.businessInfo.business_id;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
      let channel = await channelService.getInfo(logHandler, { channel_id: channel_id });
      channel = channel[0];

      let content = {
        user_id          : insertBotUser.insertId,
        date_time        : utils.getCurrentTime(),
        is_typing        : 0,
        message_type     : 1,
        server_push      : 0,
        is_thread_message: false,
        muid             : UniversalFunc.getRandomString(),
        is_web           : true,
        message          : constants.messageForNewAttendanceBotChannel,
        business_id      : payload.businessInfo.business_id
      };
      publishMessage(logHandler, content, channel.channel_id);
    }

    let allMembers = await bot.getAllMembers(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let bulkSignUp = {
      url: config.get('attendanceUrl') + constants.API_END_POINT.SIGN_UP,
      method: 'POST',
      attendance: true,
      json: {
        bulk_users: allMembers,
        business_token: business_token
      }
    };

    await utilityService.sendHttpRequest(logHandler, bulkSignUp);

  } else if (appDetails[0].bot_user_type == constants.userType.SCRUM_BOT) {
    if (payload.hasOwnProperty("status")) {
      bot.updateAppState(logHandler, { app_state: payload.app_state, workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, status: payload.status });
      return {};
    }
    let business_token = md5(payload.businessInfo.app_secret_key + Math.random())
    let options = {
      url: config.get('scrumUrl') + constants.API_END_POINT.CREATE_SCRUM_BUSINESS,
      method: 'POST',
      attendance: true,
      json: {
        business_token: business_token,
        business_name: payload.businessInfo.workspace_name
      }
    };
    let result = await utilityService.sendHttpRequest(logHandler, options);
    if (result.statusCode == 400) {
      throw new Error("Invalid Business");
    }
    await workspaceService.updateInfo(logHandler, { scrum_token: business_token, where_clause: { workspace_id: payload.businessInfo.workspace_id } });
    let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.businessInfo.workspace_id });
    let user_ids = userDetails.map(x => x["user_id"]);
    let data = {}
    for (let value of userDetails) {
      data[value.user_id] = value.role
    }

    let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: appDetails[0].name, user_type: constants.userType.SCRUM_BOT, user_unique_key: appDetails[0].bot_user_id, user_image: constants.scrumBotImageUrl, original_image: constants.scrumBotImageUrl })
    let channelsWithScrumBot = await bot.getChannelsWithScrumBot(logHandler, user_ids);
    let usersAlreadyHavingChannel = channelsWithScrumBot.map(x => x["user_id"]);
    user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));
    for (let user_id of user_ids) {
      let usersIds = [user_id, insertBotUser.insertId];

      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = usersIds[0];
      let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
      let channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = channel_id;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        updateObj.last_read_message_id = '0';
        updateObj.business_id = payload.businessInfo.business_id;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
      let channel = await channelService.getInfo(logHandler, { channel_id: channel_id });
      channel = channel[0];
      let content = {
        user_id: insertBotUser.insertId,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
        message: constants.userMessageForScrumBot,
        business_id: payload.businessInfo.business_id
      };
      (data[user_id] == constants.userRole.ADMIN || data[user_id] == constants.userRole.OWNER ) ? content.message += constants.adminMessageForScrumBot : '' ;
      let checkUserRole = await userService.checkIfUserIsManager(logHandler, { fugu_user_id: user_id });
      if (checkUserRole[0].count > 0 && (data[user_id] == constants.userRole.USER )) {
        content.message = constants.managerMessageForScrumBot
      }
      content.message = content.message.replace('app_name', payload.businessInfo.app_name);
      publishMessage(logHandler, content, channel.channel_id);
    }

    let allMembers = await bot.getAllMembers(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let bulkSignUp = {
      url: config.get('scrumUrl') + constants.API_END_POINT.INSERT_NEW_USER,
      method: 'POST',
      attendance: true,
      json: {
        bulk_users: allMembers,
        business_token: business_token
      }
    };

    await utilityService.sendHttpRequest(logHandler, bulkSignUp);

  } else if (appDetails[0].bot_user_type == constants.userType.CONFERENCE_BOT) {
    if (payload.status || payload.status == "0") {
      return {};
    }

    let botData = await bot.getBotInfo(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_type: constants.userType.CONFERENCE_BOT })
    if (!_.isEmpty(botData)) {
      return {}
    }
    let getData = await workspaceService.getWorkspaceConfiguration(logHandler, payload.businessInfo.workspace_id, constants.WORKSPACE_PROPERTY.CONFERENCE_ROLE);
    if(_.isEmpty(getData)){
      await workspaceService.insertWorkspacePropertyOnInstallApp(logHandler,{ workspace_id: payload.workspace_id, property: constants.WORKSPACE_PROPERTY.CONFERENCE_ROLE, values: JSON.stringify(["ADMIN", "OWNER"])});
  }
    let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let user_ids = userDetails.map(x => x["user_id"]);
    let full_name = 'Conference Bot';
    

    let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: full_name, user_type: constants.userType.CONFERENCE_BOT, user_unique_key: appDetails[0].bot_user_id, user_image: appDetails[0].icon, original_image: appDetails[0].icon })

    let channelsWithAttendanceBot = await bot.getChannelsWithVideoConferenceBot(logHandler, user_ids);

    let usersAlreadyHavingChannel = channelsWithAttendanceBot.map(x => x["human_id"]);;

    user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));

    for (let user_id of user_ids) {
      let usersIds = [user_id, insertBotUser.insertId];
      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = usersIds[0];
      let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
      let channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = channel_id;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        updateObj.last_read_message_id = '0';
        updateObj.business_id = payload.businessInfo.business_id;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
        let content = {
          user_id: insertBotUser.insertId,
          date_time: utils.getCurrentTime(),
          is_typing: 0,
          message_type: 1,
          server_push: 0,
          is_thread_message: false,
          muid: UniversalFunc.getRandomString(),
          is_web: true,
          message: constants.defaltConferenceMessage,
          business_id: payload.businessInfo.workspace_id
        };
        publishMessage(logHandler, content, channel_id);
      
    }
  } else if (appDetails[0].bot_user_type == constants.userType.FUGU_BOT) {
    if (payload.status || payload.status == "0") {
      return {};
    }

    let botData = await bot.getBotInfo(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_type: constants.userType.FUGU_BOT })
    if (!_.isEmpty(botData)) {
      return {}
    }
    let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let user_ids = userDetails.map(x => x["user_id"]);

    let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: "Fugu Bot", user_type: constants.userType.FUGU_BOT, user_unique_key: appDetails[0].bot_user_id, user_image: constants.fuguBotImageURL, original_image: constants.fuguBotImageURL })

    let channelsWithAttendanceBot = await bot.getChannelsWithFuguBotUser(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_ids: user_ids});

    let usersAlreadyHavingChannel = channelsWithAttendanceBot.map(x => x["human_id"]);;

    user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));

    for (let user_id of user_ids) {
      let usersIds = [user_id, insertBotUser.insertId];
      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = usersIds[0];
      let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
      let channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = channel_id;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        updateObj.last_read_message_id = '0';
        updateObj.workspace_id = payload.businessInfo.business_id;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }

      let content = {
        user_id: insertBotUser.insertId,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
        message: `Hi! 😀 I am your personal Bot.`,
        business_id: payload.businessInfo.workspace_id
      };
      publishMessage(logHandler, content, channel_id);
    }
  } else if (appDetails[0].bot_user_type == constants.userType.HRM_BOT) {
    if (payload.status || payload.status == "0") {
      bot.updateAppState(logHandler, { app_state: payload.app_state, workspace_id: payload.businessInfo.workspace_id, app_id: payload.app_id, status: payload.status });
      return {};
    }

   if(payload.is_install_hrm_bot){
    let hrm_url = payload.hrm_url.trim();
    if(!hrm_url.includes('http')){
      hrm_url = 'https://'+ hrm_url;
    }
    if(hrm_url.endsWith("/")){
      hrm_url += 'api/method/';
    }else{
      hrm_url += '/api/method/';
    }
    let hrm_configuration = {
      base_url: hrm_url,
      token   : payload.auth_token
    }
    await workspaceService.updateInfo(logHandler,{hrm_configuration, where_clause: {workspace_id: payload.businessInfo.workspace_id}});
   }
    // await workspaceService.updateInfo(logHandler, { attendance_token: business_token, where_clause: { workspace_id: payload.businessInfo.workspace_id } });

    let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.businessInfo.workspace_id });

    let user_ids = userDetails.map(x => x["user_id"]);

    let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.businessInfo.workspace_id, full_name: appDetails[0].name, user_type: constants.userType.HRM_BOT, user_unique_key: appDetails[0].bot_user_id, user_image: constants.hrmImageUrl, original_image: constants.hrmImageUrl })

    let channelsWithHrmBot = await bot.getBotChannelId(logHandler, {attendance_user_id: insertBotUser.insertId, user_ids: user_ids});

    let usersAlreadyHavingChannel = channelsWithHrmBot.map(x => x["human_id"]);

    user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));

    for (let user_id of user_ids) {
      let usersIds = [user_id, insertBotUser.insertId];

      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = usersIds[0];
      let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
      let channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = channel_id;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        updateObj.business_id = payload.businessInfo.business_id;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
      let channel = await channelService.getInfo(logHandler, { channel_id: channel_id });
      channel = channel[0];

      let content = {
        user_id: insertBotUser.insertId,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
        message: constants.messageForNewAttendanceBotChannel,
        business_id: payload.businessInfo.business_id
      };
      publishMessage(logHandler, content, channel.channel_id);
    }
  }
  return {};

}



async function publishMessageOnScrumBot(logHandler, payload) {
  let channelsWithScrumBot = []
  let channelIds =  [];
  let businessInfo = []
  let botData = []
   if( payload.user_names.length ){
     channelsWithScrumBot = await bot.getChannelsWithScrumBot(logHandler, { usersId: payload.user_names });
  }  if (payload.business_token ){
    businessInfo = await workspaceService.getInfo(logHandler , {scrum_token : payload.business_token})
    botData = await bot.getBotInfo(logHandler, { workspace_id: businessInfo[0].workspace_id, user_type: constants.userType.SCRUM_BOT });
  }
  if (payload.type == constants.scrumBot.PUBLISH_SCRUM_ANSWERS) {
    let messagePayload = {
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      is_web: true
    };
    if(channelsWithScrumBot.length){
      messagePayload.user_id = channelsWithScrumBot[0].bot_id
    } else {
      messagePayload.user_id = botData[0].user_id;
    }
    if( channelsWithScrumBot.length){
       channelIds = channelsWithScrumBot.map(x => x["channel_id"]);
    }
    if (payload.channel_ids) {
      for (let channel of payload.channel_ids) {
        channelIds.push(channel);
      }
    }

    let defaultString = `_*HERE ARE THE RESULTS OF ${payload.scrum_name} report from ${moment().format("MMM Do YY")}*_ `;
    for (let data of channelIds) {
        messagePayload.channel_id = data,
        messagePayload.message = defaultString,
        await publishMessage(logHandler, messagePayload, data)
      for (questionAnswer of payload.answers) {
        messagePayload.message = questionAnswer.question;

        let messageId = await publishMessage(logHandler, messagePayload, data);
        let messageData = await conversationService.getMessageByMuid(logHandler, { message_id: messageId.message_id })

        questionAnswer.messageId = messageId.message_id
        questionAnswer.muid = messageData[0].muid
      }
      for (questionAnswer of payload.answers) {
        if (!(questionAnswer.answers == null)) {
          for (let answer of questionAnswer.answers) {
            let params = {}
            params.date_time = utils.getCurrentTime(),
            params.user_id = answer.user_name
            params.muid = questionAnswer.muid
            params.message_id = questionAnswer.messageId
            params.thread_muid = UniversalFunc.generateRandomString(10)
            params.data = { message: answer.answer + "" }
            params.message = (answer.answer) ? (answer.answer) + "" : "No Answer";
            params.message_type = constants.messageType.MESSAGE;
            params.channel_id = data;
            params.created_at = answer.created_at || moment(new Date()).format('YYYY-MM-DD[T]HH:mm:SS.SSS[Z]');
            params.is_thread_message = true
            io.sockets.in(data).emit('thread_message', params);
            await conversationService.insertUserThreadMessageAndCreatedAt(logHandler, params);
            let message = {}
            message.thread_message = true;
            message = utils.objectToJson(logHandler, message);
            await conversationService.updateInfo(logHandler, { message_id: questionAnswer.messageId, message: message });
          }
        }
      }
    }
    if (payload.respondants) {
      let scrumBotChannels = await bot.getChannelsWithScrumBot(logHandler, { usersId: payload.respondants });
      for (let data of scrumBotChannels) {
        let muid = await bot.getMessageByChannelId(logHandler, data)
        for (let message of muid) {
          let [messageData] = await conversationService.getMessageByMuid(logHandler, { muid: message.muid, channel_id: data.channel_id });
          utils.addAllKeyValues(utils.jsonToObject(logHandler, messageData.message), messageData);
          if (!_.isEmpty(messageData)) {
            if (messageData.custom_actions) {
              messageData.custom_actions[0].is_action_taken = true;
              await conversationService.updateInfo(logHandler, { message_id: message.id, message: JSON.stringify(messageData) });
            }
          }
        }
      }
    }
  }
  else if (payload.type == constants.scrumBot.PUBLISH_SCRUM_QUESTION) {
    let messagePayload = {
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      is_web: true,
    };

    let defaultString = (payload.data.welcome_message) ? payload.data.welcome_message : payload.scrum_name;

    let actionPayload = {
      title: `*` + payload.data.question + `*`,
      confirmation_type: constants.scrumBot.SCRUM_QUESTION,
      question_id: payload.data.id,
      is_action_taken: false,
      buttons: [{
        label: constants.scrumBot.SUBMIT, action: constants.scrumBot.SUBMIT, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
      }
      ]
    };
    messagePayload.message_type = constants.messageType.BUTTON,
      actionPayload.default_text_field = {
        action: constants.buttonsForLeave.COMMENT, output: constants.textFieldAction.COMMENT, is_required: true, minimum_length: constants.defaultScrumLength, hint: constants.defaultScrumText, id: 1
      };
    messagePayload.custom_actions = [actionPayload];

    for (let data of channelsWithScrumBot) {
      messagePayload.user_id = data.bot_id;
      messagePayload.business_id = data.business_id;
      messagePayload.message = defaultString;
      await publishMessage(logHandler, messagePayload, data.channel_id);
    }
  } else if (payload.type == constants.scrumBot.PUBLISH_END_TIME_TEXT) {

    let messagePayload = {
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      is_web: true,
    }
    for (let data of channelsWithScrumBot) {
      messagePayload.user_id = data.bot_id
      messagePayload.business_id = data.business_id,
        messagePayload.message = payload.data.end_time_text
      await publishMessage(logHandler, messagePayload, data.channel_id)
    }
  }
}


function scrumBot(logHandler, payload, userInfo, channelInfo, businessInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (payload.message.includes(constants.attendanceMetric.SETTING)) {
        let messageString = '';
        let checkUserRole = yield userService.checkIfUserIsManager(logHandler, { fugu_user_id: userInfo.user_id });
        if (checkUserRole[0].count > 0 || (userInfo.role != constants.userRole.USER )) {
          let workspaceDetails = yield bot.getBusinessDetails(logHandler, { app_secret_key: businessInfo.app_secret_key });
          messageString = `https://${workspaceDetails[0].full_domain}/${workspaceDetails[0].workspace}/scrum-bot`;
        } else {
          messageString = "You don't have rights to make scrums."
        }
        let messagePayload = {
          date_time: utils.getCurrentTime(),
          is_typing: 0,
          message_type: 1,
          server_push: 0,
          is_thread_message: false
        };
        messagePayload.user_id = payload.bot_user_id;
        messagePayload.message = messageString;
        yield publishMessage(logHandler, messagePayload, payload.channel_id);
        return {}
      } else if (payload.message.includes(constants.scrumMetric.HELP)){
        let messageString = constants.userMessageForScrumBot
        let messagePayload = {
          date_time: utils.getCurrentTime(),
          is_typing: 0,
          message_type: 1,
          server_push: 0,
          is_thread_message: false
        };
        messagePayload.user_id = payload.bot_user_id;
        let checkUserRole = yield userService.checkIfUserIsManager(logHandler, { fugu_user_id: userInfo.user_id });
        if (checkUserRole[0].count > 0 || (userInfo.role != constants.userRole.USER )) {
        messagePayload.message = messageString + constants.adminMessageForScrumBot
        } else {
          messagePayload.message = messageString
        }
        yield publishMessage(logHandler, messagePayload, payload.channel_id);
        return {}
      }

      let [messageData] = yield conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: channelInfo.channel_id });
      utils.addAllKeyValues(utils.jsonToObject(logHandler, messageData.message), messageData);
      messageData.custom_actions[0].is_action_taken = true;


      if ((!messageData.custom_actions[0].comment && payload.button_data.comment) || payload.button_action == constants.scrumBot.SUBMIT) {
        messageData.custom_actions[0].comment = payload.button_data.comment;
      }

      yield conversationService.updateInfo(logHandler, { message_id: messageData.id, message: JSON.stringify(messageData) });

      if (payload.button_data.confirmation_type == constants.scrumBot.SCRUM_QUESTION) {
        let insertUserAnswer = {
          url: config.get('scrumUrl') + constants.API_END_POINT.INSERT_USER_ANSWER,
          method: 'GET',
          json: {
            user_name: payload.user_id,
            question: payload.button_data.title,
            message: payload.button_data.comment,
            question_id: messageData.custom_actions[0].question_id
          }
        };
        yield utilityService.sendHttpRequest(logHandler, insertUserAnswer);
      }
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      resolve();
    });
  });
}


function trueButtonAction(logHandler, payload, channelInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let [messageData] = yield conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: channelInfo.channel_id, message_id : payload.message_id });
      utils.addAllKeyValues(utils.jsonToObject(logHandler, messageData.message), messageData);

      for (let data of messageData.custom_actions) {
        if(payload.update_message) {
          let updatedTitle = "*Video"
          if (data.buttons[0].is_audio_conference) {
            updatedTitle = "*Audio"
          }
          data.title = updatedTitle + ` conference has ended.*`
        }
        if (data.leave_id == payload.button_data.leave_id) {
          if ((!data.comment && payload.button_data.comment) || payload.button_action == constants.buttonsForLeave.COMMENT) {
            data.comment = payload.button_data.comment;
          } else if ((!data.remark && payload.button_data.remark) || payload.button_action == constants.buttonsForLeave.REMARK) {
            data.remark ? data.remark = data.remark + "\n" + payload.button_data.remark : data.remark = payload.button_data.remark;
          }
          if (payload.button_action != constants.buttonsForLeave.COMMENT && payload.button_action != constants.buttonsForLeave.REMARK) {
            data.is_action_taken = true;
          }
        }

      }
      yield conversationService.updateInfo(logHandler, { message_id: messageData.id, message: JSON.stringify(messageData) });
      return {};
    })().then((data) => {
      // logger.debug(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function publishMessageOnFuguBotChannel(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      switch (payload.type) {
        case constants.publishMessageTypesOfFugueBot.MEETING_REMINDER:
          publishMeetingReminder(logHandler, payload);
          break;
      }
    })().then((data) => {
      // logger.debug(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

async function publishMeetingReminder(logHandler, payload) {
  let userIds = [];
  let userMessage = {};
  for (let data of payload.data) {
    let fuguUserId = data.username.split('fugu')[1];
    userIds.push(fuguUserId);
    userMessage[fuguUserId] = data.message;
  }

  let attendanceUsers = await bot.getAllChannelsWithFugueBotUser(logHandler, { usersId: userIds });

  let messagePayload = {
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    server_push: 0,
    is_thread_message: false,
    is_web: true,
  };

  for (let data of attendanceUsers) {
    messagePayload.message = userMessage[data.user_id];
    messagePayload.user_id = data.bot_id;
    messagePayload.workspace_id = data.workspace_id;
    await publishMessage(logHandler, messagePayload, data.channel_id);
  }
  return {};
}







async function publishMessageOnFuguBotChannelForAndroid(logHandler, payload) {
  let userData = await userService.getAllBusinessUsers(logHandler, { workspace_id: payload.businessInfo.workspace_id, broadcast_user_type: payload.broadcast_user_type, user_ids: payload.user_ids });
  let userIds = []
  userIds = userData.map(x => x["user_id"]);

  let userPushList = await userService.getUsersDeviceDetails(logHandler, { userIds : userIds, android_only : true});
  userIds = userPushList.map(x => x["user_id"]);

  userIds = Array.from(new Set(userIds));

  let channelsWithFuguBot = await bot.getChannelsWithFuguBotUser(logHandler, { workspace_id: payload.businessInfo.workspace_id, user_ids: (userIds.length) ? userIds : payload.user_ids, broadcast_user_type: payload.broadcast_user_type });

  let channelUserMap = {};

  for (let data of channelsWithFuguBot) {
    if (!channelUserMap[data.channel_id]) {
      channelUserMap[data.user_id] = data.channel_id;
    }
  }
  let channelUsers = [];
  for (let data of userData) {
    //  if(!(payload.userInfo.user_id == data.user_id)){
    let messageObject = {};
    messageObject.full_name = data.full_name;
    if (channelUserMap[data.user_id]) {
      messageObject.channel_id = channelUserMap[data.user_id];
      channelUsers.push(messageObject);
    }
    // else {
    //   let usersIds = [data.user_id, channelsWithFuguBot[0].bot_id];
    //   let params = {};
    //   params.chat_type = constants.chatType.FUGU_BOT;
    //   params.channel_type = constants.channelType.FUGU_BOT;
    //   params.workspace_id = payload.businessInfo.workspace_id;
    //   params.owner_id = data.user_id;
    //   let response = await channelService.insertIntoChannels(logHandler, params);
    //   messageObject.channel_id = response.insertId;
    //   for (let i = 0; i < usersIds.length; i++) {
    //     let updateObj = {};
    //     updateObj.user_id = usersIds[i];
    //     updateObj.channel_id = response.insertId;
    //     updateObj.status = constants.userStatus.ENABLE;
    //     updateObj.role = constants.userRole.USER;
    //     await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    //   }
    //}
    //   }
  }
  let content = {
    user_id: channelsWithFuguBot[0].bot_id,
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    server_push: 0,
    is_thread_message: false,
    is_web: true,
    message: "Facing notifications issue in your android device?\nType */notification issue* in this chat and follow up!"
  };

  for (let data of channelUsers) {
    publishMessage(logHandler, content, data.channel_id);
  }

  return {};
}

async function conferenceBot(logHandler, data, userInfo, channelInfo, businessInfo) {
  data.tagged_users ? data.tagged_users.push(userInfo.user_id) : data.tagged_users = [userInfo.user_id]

  if (data.button_action && data.button_action == constants.videoConferenceAction.END) {
    let [messageInfo] = await conversationService.getMessageByMuid(logHandler, { muid: data.muid, channel_id: channelInfo.channel_id });
    utils.addAllKeyValues(utils.jsonToObject(logHandler, messageInfo.message), messageInfo);
    if(messageInfo.custom_actions[0].tagged_users.length) {
    const options = {
      channelInfo,
      businessInfo,
      userInfo,
      notificationType: pushNotificationBuilder.notificationType.VIDEO_CONFERENCE_HUNG_UP,
      isSilent: true,
      muid: data.muid,
      message_id: messageInfo.id,
      userIds: messageInfo.custom_actions[0].tagged_users,
      usersUnreadNotificationCount : {}
    };

    if (channelInfo.channel_properties) {
      channelInfo.channel_properties = JSON.parse(channelInfo.channel_properties);
      options.only_admin_can_message = channelInfo.channel_properties.only_admin_can_message;
    }

      let channelsWithAttendanceBot = await bot.getChannelsWithVideoConferenceBot(logHandler,  {usersId :   messageInfo.custom_actions[0].tagged_users});

      for(let user of channelsWithAttendanceBot) {
        options.channelInfo = { channel_id: user.channel_id}
        options.userIds = user.user_id
       await notifierService.notifyUsers(logHandler, options);
      }

      data.update_message = true
    trueButtonAction(logHandler, data, channelInfo)

      if (messageInfo.custom_actions[0].message_ids.length) {
        for (let message_id of messageInfo.custom_actions[0].message_ids) {
          trueButtonAction(logHandler, { message_id: message_id, update_message: true, button_data : {}}, channelInfo)
        }
    }
    }
return{}
  }

  if (data.message.includes(constants.conferenceMetric.AUDIO_CONF)) {
    data.is_audio_conference = true;
  } else if (data.message.includes(constants.conferenceMetric.VIDEO_CONF)) {
    data.is_audio_conference = false;
  } else {
    return {};
  }

  let conference = JSON.parse(businessInfo.properties)
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
      invite_link: conference.conference_link  + "/" + UniversalFunc.generateRandomString(16),
      en_user_id: utils.encryptText(userInfo.user_id),
      invite_user_ids: data.tagged_users,
      is_audio_conference: data.is_audio_conference,
      channel_id : channelInfo.channel_id
    }
  };
  utilityService.sendHttpRequest(logHandler, options);

}



async function createSelfChat(logHandler, payload) {
  if(!payload.workspace_id) {
    let workspace = await bot.getWorkspace(logHandler)
    payload.workspace_id = workspace[0].workspace_id
    bot.deleteWorkspace(logHandler, { workspace_id : payload.workspace_id });
  }
  let botData = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.SELF_BOT })
  if (!_.isEmpty(botData)) {
    return {}
  }
  let userDetails = await userService.getActiveUsersOfBusiness(logHandler, { workspace_id: payload.workspace_id });

  let user_ids = userDetails.map(x => x["user_id"]);

  let insertBotUser = await userService.insertUserDetails(logHandler, { workspace_id: payload.workspace_id, full_name: "Self Bot", user_type: constants.userType.SELF_BOT, user_unique_key: "imfaFIU2407", user_image: "https://fuguchat.s3.ap-south-1.amazonaws.com/test/image/B4bkKEmzgN_1535969596640.png", original_image: "https://fuguchat.s3.ap-south-1.amazonaws.com/test/image/B4bkKEmzgN_1535969596640.png" })

  let channelsWithAttendanceBot = await bot.getChannelsWithSelfBot(logHandler, user_ids);

  let usersAlreadyHavingChannel = channelsWithAttendanceBot.map(x => x["user_id"]);;

  user_ids = user_ids.filter(id => !usersAlreadyHavingChannel.includes(id));

  for (let user_id of user_ids) {
    let usersIds = [user_id, insertBotUser.insertId];
    let params = {};
    params.chat_type = constants.chatType.FUGU_BOT;
    params.channel_type = constants.channelType.FUGU_BOT;
    params.workspace_id = payload.workspace_id;
    params.channel_name = "user_" + usersIds[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
    params.owner_id = usersIds[0];
    let response = await Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
    let channel_id = response.insertId;
    for (let i = 0; i < usersIds.length; i++) {
      let updateObj = {};
      updateObj.user_id = usersIds[i];
      updateObj.channel_id = channel_id;
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.role = constants.userRole.USER;
      updateObj.last_read_message_id = '0';
      updateObj.business_id = payload.workspace_id;
      await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    }

    let content = {
      user_id: insertBotUser.insertId,
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      muid: UniversalFunc.getRandomString(),
      is_web: true,
      message: constants.selfBotDefaultMessage,
      business_id: payload.workspace_id
    };
    publishMessage(logHandler, content, channel_id);
  }
}

async function publishSecretSanta(logHandler, payload) {

  const secretSantaBot = await bot.getApps(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: 14 });

  if (!secretSantaBot.length || secretSantaBot[0].status != 1 ) {
    throw new Error('Install the secret santa app first.')
  }

  if (payload.userInfo.role != constants.userRole.ADMIN && payload.userInfo.role != constants.userRole.OWNER) {
    throw new Error("You are not authorized.")
  }
  let shuffleUsers = UniversalFunc.shuffle(payload.users_data);
  shuffleUsers.push(shuffleUsers[0]);
  let userIds = [];
  for(let users of payload.users_data) {
    userIds.push(users.user_id);
  }

  let userData = await userService.getAllBusinessUsers(logHandler, { workspace_id: payload.businessInfo.workspace_id, broadcast_user_type: constants.broadcast_user_type.ONLY, user_ids: userIds });

  if(!userData.length) {
    throw new Error("Users does not belong to this workspace")
  }

  userIds = [];
  for (let users of userData) {
    userIds.push(users.user_id);
  }

  let channelsWithFuguBot = await bot.getAllChannelsWithFugueBotUser(logHandler, { workspace_id: payload.businessInfo.workspace_id, usersId: userIds  });

  let channelUserMap = {};

  for (let data of channelsWithFuguBot) {
    if (!channelUserMap[data.channel_id]) {
      channelUserMap[data.user_id] = data.channel_id;
    }
  }

  let channelUsers = [];
  for (i = 0; i < shuffleUsers.length - 1; i++) {
    let userSantaObject = {};

    userSantaObject.sender_user_id = shuffleUsers[i].user_id;
    userSantaObject.sender_name = shuffleUsers[i].full_name;
    userSantaObject.receiver_user_id = shuffleUsers[i + 1].user_id;
    userSantaObject.receiver_full_name = shuffleUsers[i + 1].full_name;
    if (channelUserMap[shuffleUsers[i].user_id]) {
      userSantaObject.channel_id = channelUserMap[shuffleUsers[i].user_id];
    } else {
      let usersIds = [shuffleUsers[i].user_id, channelsWithFuguBot[0].bot_id];
      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.businessInfo.workspace_id;
      params.channel_name = "user_" + shuffleUsers[i].user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = shuffleUsers[i].user_id;
      let response = await channelService.insertIntoChannels(logHandler, params);
      userSantaObject.channel_id = response.insertId;
      for (let i = 0; i < usersIds.length; i++) {
        let updateObj = {};
        updateObj.user_id = usersIds[i];
        updateObj.channel_id = response.insertId;
        updateObj.status = constants.userStatus.ENABLE;
        updateObj.role = constants.userRole.USER;
        await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
      }
    }
    channelUsers.push(userSantaObject);
  }

  let allSecretSantas = ``;
  for (let data of channelUsers) {
    let content = {
      user_id: channelsWithFuguBot[0].bot_id,
      date_time: utils.getCurrentTime(),
      is_typing: 0,
      message_type: 1,
      server_push: 0,
      is_thread_message: false,
      is_web: true
    };


    allSecretSantas += `${data.sender_name} must gift to ${data.receiver_full_name}\n`;
    let message = `Hi ${data.sender_name.split(' ')[0]},\nSecret Santa 🎅 is back again this year!\n\n*You have been chosen to gift\n🎁<a class=\"tagged-agent tagged-user\" href=\"mention://${data.receiver_user_id}\" data-id=\"${data.receiver_user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${data.receiver_full_name}</a>🎁\nsomething he/she would like to receive! This is a secret only shared with you!*\n\nSomeone has also been chosen to get you a gift.`;

    if (payload.message) {
      message += `Here is a message from the Secret Santa admin: \n*_${payload.message}_*\n`;
    }

    message += `For any info/query contact your Secret Santa admin: <a class=\"tagged-agent tagged-user\" href=\"mention://${payload.userInfo.user_id}\" data-id=\"${payload.userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${payload.userInfo.full_name}</a>`;

    content.message = message;
    publishMessage(logHandler, content, data.channel_id);
  }

  let opts = {
    workspace_id: payload.businessInfo.workspace_id,
    user_id: payload.userInfo.user_id,
    message: allSecretSantas
  };
  // logger.debug(logHandler, ">>SECRET SANTA MESSAGE>>>>>>>>>>", allSecretSantas)
   bot.insertFuguAppMessages(logHandler, opts);
  return {};
}
