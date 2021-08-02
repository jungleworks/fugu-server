const config = require('config');
const RESP = require('../Config').responseMessages;

const { logger }          = require('../libs/pino_logger');
const constants           = require('../Utils/constants');
const UniversalFunc       = require('../Utils/universalFunctions');
const workspaceService    = require('../services/workspace');
const userService         = require('../services/user');
const utils               = require('../Utils/commonFunctions');
const sendEmail           = require('../Notification/email').sendEmailToUser;
const utilityService      = require('../services/utility');
const botservice          = require('../services/bot');
const bot                 = require('../services/bot');
const channelService      = require('../services/channel');
const conversationService = require('../services/conversation');
const commonFunctions     = require('../Utils/commonFunctions');
const businessService     = require('../services/business');

const _           = require('underscore');
const Promise     = require('bluebird');
const moment      = require('moment');
const chathandler = require('../Routes/chathandler');
const request     = require('request');
const cheerio     = require('cheerio');

exports.publishMessage = publishMessage;
exports.handleBot = handleBot;
exports.publishMessageOnAttendanceBot = publishMessageOnAttendanceBot;
exports.hrmBot = hrmBot;
exports.publishMessageOnHrmBot = publishMessageOnHrmBot;
exports.postMessage = postMessage;

function publishMessage(logHandler, payload, channel_id) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      return yield Promise.promisify(chathandler.handlePublish).call(null, { data: payload, channel: `/${  channel_id}`, is_socket_io: true });
    })().then((data) => {
      logger.trace(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
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
            logger.trace(logHandler, { SUCCESS: data });
            resolve(data);
        }, (error) => {
            logger.error(logHandler, { ERROR: error });
            reject(error);
        });ee
    });
}

function hrmBot(logHandler, payload, channelInfo, userInfo, businessInfo) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      businessInfo.attendance_token = 'wfegr461f4rwfc'; // TODO
      if (!businessInfo.attendance_token) {
        return {};
      }

      let messageString;
      let defaultString = `I am afraid I did not understand. Please type 'help' to know more about me.`;

      logHandler = {
        uuid: logHandler.uuid,
        apiModule: "chathandler",
        apiHandler: "hrm"
      };
      logger.trace(logHandler, "attendance payload>", payload, userInfo, businessInfo);

      if (!(businessInfo.hrm_api_key && businessInfo.hrm_configuration)) {
        console.log("----------------RETURNING---------------");
        return {};
      } 
      businessInfo.hrm_configuration = JSON.parse(businessInfo.hrm_configuration);
      let baseUrl = businessInfo.hrm_configuration.base_url;
      let token = businessInfo.hrm_configuration.token;
      let content = {
        user_id: payload.bot_user_id,
        date_time: utils.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
        hrm_bot_type: payload.hrm_bot_type
      };

      let message = payload.message.toLowerCase();
      message = message.replace(/\//, '');


      if (message == constants.attendanceMetric.IN || message == constants.attendanceMetric.OUT) {
        return {};
      }

      if (message == constants.attendanceMetric.PAYSLIP) {
        let options = {
          url: baseUrl  + constants.API_END_POINT.HRM_PAY_SLIP,
          method: 'POST',
          json: {
            email: userInfo.emails
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": token
          }
        };
        let result = yield utilityService.sendHttpRequest(logHandler, options);
        try {
          if (result.message.data.length) {
            content.message_type = constants.messageType.BUTTON;
            messageString = "Your Payslips.";
            content.custom_actions = [];
            for (let data of result.message.data) {
              let actionObject = {};
              actionObject.title = data.label;
              actionObject.leave_id = data.name;
              actionObject.is_action_taken = false;
              actionObject.confirmation_type = constants.leaveState.GET_PAY_SLIPS;
              actionObject.buttons = [{
                label: constants.buttonsForLeave.DOWNLOAD, action: constants.buttonsForLeave.DOWNLOAD, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH
              }];
              content.custom_actions.push(actionObject);
            }
          } else {
            messageString = 'No payslips found';
          }
        } catch (error) {
          if(result.message){
            messageString = result.message.message;
          } else {
          messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
          }
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
        messageString = `https://${workspaceDetails[0].workspace}.${workspaceDetails[0].domain}/apps/attendance`;
        let role;
        try {
          apiResult = JSON.parse(apiResult);
          role = apiResult.data.user_info[0].role;
        } catch (err) {
          JSON.parse(JSON.parse(apiResult._server_messages)[0]).message;
        }
        if (role == constants.userRole.USER) {
          messageString += `/employee/fugu${userInfo.user_id}`;
        } else if (role == constants.userRole.MANAGER) {
          messageString += "/people";
        }
      } else if (message == constants.attendanceMetric.MY_LEAVE_BALANCE || message == constants.attendanceMetric.QUOTAS || message == constants.attendanceMetric.LEAVE_BALANCE) {
        let options = {
          url: baseUrl  + constants.API_END_POINT.HRM_LEAVE_BALANCE,
          method: 'POST',
          json: {
            email: userInfo.emails
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": token
          }
        };
        let result = yield utilityService.sendHttpRequest(logHandler, options);
        try {
          if (result.message.statusCode != 401) {
            if (result.message.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
              messageString = result.message;
            } else if (_.isEmpty(result.message.data)) {
              messageString = `No leaves for your business.`;
            } else {
              let leave_balance = result.message.data;
              messageString = "Your Leave Quotas:";
              content.custom_actions = [];
              content.message_type = constants.messageType.BUTTON;

              for (let data of result.message.data) {
                let actionObject = {};
                actionObject.title = `*${data.leave_type}* \nBalance: ${data.balance}`;
                content.custom_actions.push(actionObject);
              }
            }
          } else {
            messageString = result.message.message;
          }
        } catch (error) {
          messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
        }
      } else if (message == constants.attendanceMetric.REPORT) {
        let options = {
          url: baseUrl   + constants.API_END_POINT.HRM_MONTHLY_REPORT,
          method: 'POST',
          json: {
            email: userInfo.emails
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": token
          }
        };

        if (!_.isEmpty(payload.tagged_users)) {
          let result = yield bot.getTeamMembers(logHandler, { manager_fugu_user_id: userInfo.user_id });

          if (!_.isEmpty(result)) {
            let otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: payload.tagged_users[0] });
            options.json.email = otherUserInfo[0].email;
          } else {
            messageString = "You don't have access to view report.";
          }
        } else {
          options.json.email = userInfo.emails;
        }

        let result = yield utilityService.sendHttpRequest(logHandler, options);

        try {
          if (result.message.statusCode != 102) {
            if (result.message.data.report_url) {
              messageString = `Here is your timesheet report for current month --> \n` + result.message.data.report_url;

            } else {
              messageString = `No timesheet data for this month.`;
            }
          } else {
            messageString = result.message.message;
          }
        } catch (error) {
          messageString = JSON.parse(JSON.parse(apiResult._server_messages)[0]).message;
        }
      } else if ((message.includes(constants.attendanceMetric.CHANGE_MY_MANAGER))) {
        if (!businessInfo.is_demo) {
          if (_.isEmpty(payload.tagged_users)) {
            messageString = `Please give manager name to update(e.g. change my manager @username).`;
          } else {
            let options = {
              url:  baseUrl   + constants.API_END_POINT.HRM_CHANGE_MANAGER_REQUEST,
              method: 'POST',
              json: {
                employee_email: userInfo.emails,
                manager_email: managerInfo.emails
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization":token
              }
            };

            if (!_.isEmpty(userManagerInfo) && userManagerInfo[0].manager_fugu_user_id && userManagerInfo[0].manager_fugu_user_id == payload.tagged_users[0]) {
              messageString = `<a class=\"tagged-agent tagged-user\" href=\"mention://${managerInfo.user_id}\" data-id=\"${managerInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${managerInfo.full_name}</a> is already your manager.`;
            } else {
              let options = {
                url:  baseUrl   + constants.API_END_POINT.CHANGE_MANAGER_REQUEST,
                method: 'POST',
                json: {
                  employee_email: userInfo.emails,
                  manager_email: managerInfo.emails
                },
                headers: {
                  "Content-Type": "application/json",
                  "Authorization":token
                }
              };

              let result = yield utilityService.sendHttpRequest(logHandler, options);
              try {
                if (result.message.statusCode == 453 || result.message.statusCode == 101) {
                  messageString = result.message.message;
                } else {
                  let otherUserInfo;
                  let hr_roles = [];
                  if (!_.isEmpty(result.message.data.hr_roles)) {
                    for (let data of result.data.hr_roles) {
                      hr_roles.push(data);
                    }
                  } else {
                    let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                    hr_roles.push(ownerData[0].email);
                  }

                  if ((_.isEmpty(userManagerInfo) || !userManagerInfo[0].manager_fugu_user_id)) {
                    otherUserInfo = yield userService.getUserInfo(logHandler, { email: hr_roles });
                  } else {
                    otherUserInfo = yield userService.getUserDetail(logHandler, { user_id: userManagerInfo[0].manager_fugu_user_id });
                    if (_.isEmpty(otherUserInfo) || otherUserInfo[0].status == constants.status.DISABLE) {
                      otherUserInfo = yield userService.getUserDetails(logHandler, { email: hr_roles, workspace_id : businessInfo.workspace_id });
                    }
                  }
                  messageString = `We have sent this request for approval to your current and new manager. Once approved by both of them, I will update the records.`;

                  let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, otherUserInfo[0].user_id] });

                  let managerBotChannelId;
                  if (_.isEmpty(managerBotChannel)) {
                    let usersIds = [otherUserInfo[0].user_id, payload.bot_user_id];
                    let params = {};
                    params.chat_type = constants.chatType.FUGU_BOT;
                    params.channel_type = constants.channelType.FUGU_BOT;
                    params.workspace_id = businessInfo.workspace_id;
                    params.channel_name = "user_" + otherUserInfo[0].user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                    params.owner_id = otherUserInfo[0].user_id;
                    let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                    managerBotChannelId = response.insertId;
                    for (let i = 0; i < usersIds.length; i++) {
                      let updateObj = {};
                      updateObj.user_id = usersIds[i];
                      updateObj.channel_id = managerBotChannelId;
                      updateObj.status = constants.userStatus.ENABLE;
                      updateObj.role = constants.userRole.USER;
                      yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                    }
                  } else {
                    managerBotChannelId = managerBotChannel.channel_id;
                  }


                  let managerPayload = {
                    user_id: payload.bot_user_id,
                    date_time: utils.getCurrentTime(),
                    is_typing: 0,
                    message_type: 14,
                    server_push: 0,
                    is_thread_message: false,
                    is_web: true,
                    message: "Request for manager change",
                  };

                  let actionPayload = {
                    confirmation_type: constants.leaveState.MANAGER_CHANGE_CONFIRMATION,
                    tagged_user_id: userInfo.user_id,
                    leave_id: result.message.data.change_manager_request_id,   // Manager request id
                    title: `*<a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>* has requested for manager change. New Manager: <a class=\"tagged-agent tagged-user\" href=\"mention://${managerInfo.user_id}\" data-id=\"${managerInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${managerInfo.full_name}</a>`,
                    buttons: [{
                      label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
                    },
                    {
                      label: constants.buttonsForLeave.DENY, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
                    }]
                  };
                  manager_info = managerInfo.emails;
                  managerPayload.custom_actions = [actionPayload];
                  publishMessage(logHandler, managerPayload, managerBotChannelId);
                }
              } catch (error) {
                messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
              }
            }
          }
        } else {
          messageString = `This is Demo App, You cannot change your manager, for more information please contact <a href="mailto:hr@huskyhr.com">hr@huskyhr.com</a> / <a href="mailto:contact@huskyhr.com">contact@huskyhr.com</a>`;
        }
      } else if (message == constants.attendanceMetric.TEAM_REPORT) {
        let options = {
          url: baseUrl   + constants.API_END_POINT.HRM_TEAM_REPORT,
          method: 'POST',
          json: {
            email: userInfo.emails
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": token
          }
        };

        let result = yield utilityService.sendHttpRequest(logHandler, options);
        try {
          if (result.message && result.message.message && result.message.statusCode) {
            messageString = `Your team's punch status\n`;
            if (!_.isEmpty(result.message.data)) {
              let punchIn = ``;
              let punchOut = ``;
              let yetToArrive = ``;
              for (let row of result.message.data) {
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
          } else {
            messageString = result.message.message
          }
        } catch (error) {
          messageString = JSON.parse(JSON.parse(apiResult._server_messages)[0]).message;
        }
      } else if (message == constants.attendanceMetric.BUSINESS_REPORT) {
        let getUserRole = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
        if (_.isEmpty(getUserRole)) {
          messageString = defaultString;
        } else {
          let options = {
            url: baseUrl   + constants.API_END_POINT.HRM_BUSINESS_REPORT,
            method: 'POST',
            json: {
              email: userInfo.emails
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": token
            }
          };

          let result = yield utilityService.sendHttpRequest(logHandler, options);
          try {
            if (result.message.statusCode != 102) {
              if (result.message.statusCode != 200) {
                messageString = result.message ? result.message.message : 'Sorry No Results';
              } else if (!_.isEmpty(result)) {
                messageString = `Here is your business timesheet report for current month --> \n` + result.message.data;
              } else {
                messageString = `No data for your business till now.`;
              }
            } else {
              messageString = result.message.message;
            }
          }
          catch (error) {
            messageString = JSON.parse(JSON.parse(apiResult._server_messages)[0]).message;
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
      } else if (message.includes(constants.attendanceMetric.HOLIDAYS)) {
        content.message = ``;
        content.image_url = `https://fchat.s3.ap-south-1.amazonaws.com/default/JB7LtHC9GM.1567684639947.png`;
        content.thumbnail_url = `https://fchat.s3.ap-south-1.amazonaws.com/default/JB7LtHC9GM.1567684639947.png`;
        content.image_width = 752;
        content.image_height = 368;
        content.message_type = constants.messageType.IMAGE;
        publishMessage(logHandler, content, channelInfo.channel_id);
      } else if (message.includes(constants.attendanceMetric.DELETE) && message.includes(constants.attendanceMetric.LEAVE)) {

        let options = {
          url: baseUrl + constants.API_END_POINT.HRM_GET_LEAVE,
          method: 'POST',
          json: {
            email: userInfo.emails
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": token // 'token 84d4837832bee35:99110d88d49c4c1'
          }
        };

        let result = yield utilityService.sendHttpRequest(logHandler, options);
        try {
          if (result.message.statusCode != 401) {
            if (result.message.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
              messageString = result.message.message;
            } else if (!_.isEmpty(result.message.data)) {
              // let pendingApprovalForLeave = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.data, channel_id: channelInfo.channel_id });
              if (!_.isEmpty(result.message.data)) {
                content.message_type = constants.messageType.BUTTON;
                messageString = "Your leaves.";
                content.custom_actions = [];
                for (let data of result.message.data) {
                  let actionObject = {};
                  actionObject.title = data.title;
                  actionObject.leave_id = data.name;
                  actionObject.is_action_taken = false;
                  actionObject.confirmation_type = constants.leaveState.USER_DELETE_LEAVE_CONFIRMATION;
                  actionObject.buttons = [{
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
          } else {
            messageString = result.message.message;
          }
        } catch (error) {
          messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
        }
      } else if ((message.includes(constants.attendanceMetric.LEAVE) && payload.leave_start_date) || message.includes(constants.leaveMetricTypes.WORK_FROM_HOME)) {

        let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
        payload.leave_start_date = moment(payload.leave_start_date).format("YYYY-MM-DD HH:mm:ss")

        if (getUserRole.manager_fugu_user_id) {


          let options = {
            url: baseUrl + constants.API_END_POINT.HRM_LEAVE_APPLY,
            method: 'POST',
            json: {
              email: userInfo.emails,
              from_date: payload.leave_start_date,
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": token
            }
          };

          if (message.includes(constants.leaveMetricTypes.FIRST_HALF)) {
            options.json.half_day = 1;
            options.json.is_first_half = 1;
          } else if (message.includes(constants.leaveMetricTypes.SECOND_HALF)) {
            options.json.half_day = 1;
            options.json.is_first_half = 0;
          }

          payload.leave_end_date ? options.json.to_date = moment(payload.leave_end_date).format('YYYY-MM-DD') : 0;
          if (message.includes(constants.leaveMetricTypes.WORK_FROM_HOME)) {
            options.json.message += " wfh";
            options.json.day_time = constants.workFromHome;
            options.json.leave_type = 'Casual Leave';
          }
          let result = yield utilityService.sendHttpRequest(logHandler, options);
          try {
            if (result.message.statusCode != 404) {
              if (result.message.statusCode == 200) {
                let actionPayload = {
                  title: `*` + result.message.data.message + `*`,
                  confirmation_type: constants.leaveState.USER_LEAVE_CONFIRMATION,
                  leave_id: result.message.data.leave_id,
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
              } else if (result.message.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
                messageString = result.message;
              } else if (result.message.statusCode == 450) {
                // let [pendingApprovalForLeave] = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.data.leave_id, channel_id: channelInfo.channel_id });
                messageString = `You have a ${result.message.data.status} leave, whose leave period overlaps with the one that you are trying to apply. Please change your dates and try again.`;
                content.custom_actions = [{ title: '*Existing leave request*\n' + result.message.data.title.replace(/\"/g, '') }];
                content.message_type = constants.messageType.BUTTON;
              } else if (result.message.statusCode == 458) {
                content.message_type = constants.messageType.BUTTON;
                messageString = `Leave confirmation.`;
                content.custom_actions = [];
                let actionObject = {};
                actionObject.title = `*Please confirm your leave type.*`;
                actionObject.is_action_taken = false;
                actionObject.confirmation_type = constants.leaveState.LEAVE_TYPE_SELECT;
                
                let buttons = [];
                for (let data of result.message.data) {
                  buttons.push({
                    label: data.leave_type_id, action: data.leave_type_id, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, type_id: data.leave_type_id
                  });
                }
                actionObject.buttons = buttons;
                content.custom_actions.push(actionObject);
                content.start_time = result.message.leave_start_date;
                content.end_time = result.message.leave_end_date;
                content.message_content = result.message.title;
                content.half_day = options.json ? options.json.half_day : 0;
                content.is_first_half = options.json ? options.json.is_first_half : 0;
              } else {
                messageString = result.message;
              }
            } else {
              messageString = result.message.message;
            }
          } catch (error) {
            messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
            const parsedHtml = cheerio.parseHTML(messageString);
            messageString = parsedHtml[0] ? parsedHtml[0].data.replace(':','') : messageString;
            
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
              url: baseUrl  + constants.API_END_POINT.HRM_DELETE_LEAVE,
              method: 'POST',
              json: {
                name: payload.button_data.leave_id
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token // 'token 84d4837832bee35:99110d88d49c4c1'
              }
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            messageString = `Alright! I cancelled the request.`;
          } else if (payload.button_action == constants.buttonsForLeave.CONFIRM) {
            let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });

            if (getUserRole.manager_fugu_user_id) {
              let options = {
                url: baseUrl + constants.API_END_POINT.HRM_LEAVE_APPLY,
                method: 'POST',
                json: {
                  name : payload.button_data.leave_id,
                  reason : payload.button_data.comment
                },
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": token
                }
              };
              let result = yield utilityService.sendHttpRequest(logHandler, options);
              let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, getUserRole.manager_fugu_user_id] });

              let managerBotChannelId;
              if (_.isEmpty(managerBotChannel)) {
                let usersIds = [getUserRole.manager_fugu_user_id, payload.bot_user_id];
                let params = {};
                params.chat_type = constants.chatType.FUGU_BOT;
                params.channel_type = constants.channelType.FUGU_BOT;
                params.workspace_id = businessInfo.workspace_id;
                params.channel_name = "user_" + getUserRole.manager_fugu_user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                params.owner_id = getUserRole.manager_fugu_user_id;
                let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                managerBotChannelId = response.insertId;
                for (let i = 0; i < usersIds.length; i++) {
                  let updateObj = {};
                  updateObj.user_id = usersIds[i];
                  updateObj.channel_id = managerBotChannelId;
                  updateObj.status = constants.userStatus.ENABLE;
                  updateObj.role = constants.userRole.USER;
                  yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                }
              } else {
                managerBotChannelId = managerBotChannel.channel_id;
              }

              messageString = `I have sent your request to your manager for approval. Will update you on the status.`;

              let managerPayload = {
                user_id: payload.bot_user_id,
                date_time: utils.getCurrentTime(),
                is_typing: 0,
                message_type: 14,
                server_push: 0,
                is_thread_message: false,
                muid: UniversalFunc.getRandomString(),
                is_web: true,
                message: "Request for leave approval.",
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
              url: baseUrl   + constants.API_END_POINT.HRM_LEAVE_ACTION,
              method: 'POST',
              json: {
                email: userInfo.emails,
                leave_id: payload.button_data.leave_id,
                action:1,
                description : payload.button_data.comment
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);
            try{
              
            if (result.message.statusCode == 452) {
              messageString = `The leave requested by <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span> has already been dismissed.`;
            } else if(result.message.statusCode == 201) {
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
                message: `👍 Good News.\nYour request ${(payload.button_data.title).split("requested ")[1]} is approved.`
              };


              payload.button_data[constants.textFieldAction.REMARK] ? userPayload.message += `\n*Remarks* : ${payload.button_data.remark}` : 0;

              messageString += ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

              publishMessage(logHandler, userPayload, userBotChannel.channel_id);
              let hr_roles = [];

              if (!_.isEmpty(result.message.data.hr_roles)) {
                for (let data of result.message.data.hr_roles) {
                  hr_roles.push(data);
                }
              } else {
                let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                hr_roles.push(ownerData[0].email);
              }


              let hrPayload = {
                user_id: payload.bot_user_id,
                date_time: utils.getCurrentTime(),
                is_typing: 0,
                message_type: 1,
                server_push: 0,
                is_thread_message: false,
                is_web: true,
                message: ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a> is on  ${(payload.button_data.title).split("requested ")[1]}`
              };
              payload.button_data.comment ? hrPayload.message = hrPayload.message + "\n*Comment:* " + payload.button_data.comment : 0;


              let mailPayload = {
                title: result.message.data.title,
                email: taggedUserInfo.emails,
                approved_by: userInfo.full_name
              };
              if (result.message.data.employee_id) {
                mailPayload.employee_id = result.message.data.employee_id;
              } else {
                mailPayload.comment_start = `<!--`;
                mailPayload.comment_end = `-->`;
              }


              if (!_.isEmpty(hr_roles)) {
                let allHR = yield userService.getUserInfo(logHandler, { email: hr_roles, workspace_id: businessInfo.workspace_id});
                for (let data of allHR) {
                  let [hrBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, data.fugu_user_id] });

                  if (_.isEmpty(hrBotChannel)) {
                    let usersIds = [data.user_id, payload.bot_user_id];
                    let params = {};
                    params.chat_type = constants.chatType.FUGU_BOT;
                    params.channel_type = constants.channelType.FUGU_BOT;
                    params.workspace_id = businessInfo.workspace_id;
                    params.channel_name = "user_" + data.user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                    params.owner_id = data.user_id;
                    let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                    hrBotChannel = response.insertId;
                    for (let i = 0; i < usersIds.length; i++) {
                      let updateObj = {};
                      updateObj.user_id = usersIds[i];
                      updateObj.channel_id = hrBotChannel;
                      updateObj.status = constants.userStatus.ENABLE;
                      updateObj.role = constants.userRole.USER;
                      yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                    }
                  } else {
                    hrBotChannel = hrBotChannel.channel_id;
                  }

                  yield publishMessage(logHandler, hrPayload, hrBotChannel);
                  sendEmail(constants.emailType.LEAVE_MAIL, mailPayload, data.email, `${taggedUserInfo.full_name} is on leave.`);
                }
              }
              // if (result.data.leaveInfo) {
              //   bot.insertMembersOnLeave(logHandler, result.data.leaveInfo)
              // }
            } else if(result.message.statusCode == 404)
              messageString = `Thanks for response\n But leave ${(payload.button_data.title).split("requested ")[1]} has already been deleted.`
          }catch(error){
            messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
          }
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            let options = {
              url: baseUrl   + constants.API_END_POINT.HRM_LEAVE_ACTION,
              method: 'POST',
              json: {
                email: userInfo.emails,
                leave_id: payload.button_data.leave_id,
                action: 0,
                description: payload.button_data.comment
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            try{
            messageString += ` <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span>`;
            if (result.message.statusCode == 452) {
              messageString = `The leave requested by <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a><span class=\"new-text\">&nbsp;</span> has already been dismissed.`;
            } else if(result.message.statusCode == 201) {
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
                message: `🙁 Some Bad News.\nYour leave request ${(payload.button_data.title).split("requested ")[1]} is not approved.`,  // customized
              };

              payload.button_data[constants.textFieldAction.REMARK] ? userPayload.message += `\nCommented by <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> : ${payload.button_data[constants.textFieldAction.REMARK]}` : 0;

              yield publishMessage(logHandler, userPayload, userBotChannel.channel_id);
            } else if(result.message.statusCode == 404)
              messageString = `Thanks for response!\n But leave ${(payload.button_data.title).split("requested ")[1]} has already been deleted.`
          }catch(error){
           messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
          }
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.USER_DELETE_LEAVE_CONFIRMATION) {
          if (payload.button_action == constants.buttonsForLeave.DELETE) {
            let options = {
              url: baseUrl  + constants.API_END_POINT.HRM_DELETE_LEAVE,
              method: 'POST',
              json: {
                name: payload.button_data.leave_id
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            try {
              messageString = `Alright! I dismissed the request of leave`;
              let mailPayload = {
                message: `The leave request has been cancelled by ${userInfo.full_name}`,
                title: result.message.data.title,
                email: userInfo.email,
                approved_by_comment_start: '<!--',
                approved_by_comment_end: '-->'

              }
              if (result.message.data.employee_id) {
                mailPayload.employee_id = result.message.data.employee_id;
              } else {
                mailPayload.comment_start = `<!--`;
                mailPayload.comment_end = `-->`;
              }
              if (result.message.leave_status.toLowerCase == constants.leaveStatus.APPROVED.toLowerCase) {
                let [userManagerInfo] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });
                if (userManagerInfo.manager_fugu_user_id) {
                  let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, userManagerInfo.manager_fugu_user_id] });
                  if (managerBotChannel.channel_id) {
                    let managerPayload = {
                      user_id: payload.bot_user_id,
                      date_time: utils.getCurrentTime(),
                      is_typing: 0,
                      message_type: 1,
                      server_push: 0,
                      is_thread_message: false,
                      is_web: true,
                    };

                    managerPayload.message = `FYI - <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> has dismissed the leave request for ${payload.button_data.title} `;

                    publishMessage(logHandler, managerPayload, managerBotChannel.channel_id);
                  } else {
                    messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
                  }
                }

                let hr_roles = [];
                if (!_.isEmpty(result.message.data.hr_roles)) {
                  for (let data of result.message.data.hr_roles) {
                    hr_roles.push(data);
                  }
                } else {
                  let ownerData = yield bot.getTeamMembers(logHandler, { role: constants.userRole.OWNER, workspace_id: businessInfo.workspace_id });
                  hr_roles.push(ownerData[0].email);
                }

                let hrPayload = {
                  user_id: payload.bot_user_id,
                  date_time: utils.getCurrentTime(),
                  is_typing: 0,
                  message_type: 1,
                  server_push: 0,
                  is_thread_message: false,
                  is_web: true,
                  message: ` <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a> has dismissed ${payload.button_data.title}`
                };


                if (!_.isEmpty(hr_roles)) {
                  let allHR = yield userService.getUserInfo(logHandler, { email: hr_roles, workspace_id : businessInfo.workspace_id });
                  for (let data of allHR) {
                    let [hrBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, data.fugu_user_id] });

                    if (_.isEmpty(hrBotChannel)) {
                      let usersIds = [data.user_id, payload.bot_user_id];
                      let params = {};
                      params.chat_type = constants.chatType.FUGU_BOT;
                      params.channel_type = constants.channelType.FUGU_BOT;
                      params.workspace_id = businessInfo.workspace_id;
                      params.channel_name = "user_" + data.user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                      params.owner_id = data.user_id;
                      let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                      hrBotChannel = response.insertId;
                      for (let i = 0; i < usersIds.length; i++) {
                        let updateObj = {};
                        updateObj.user_id = usersIds[i];
                        updateObj.channel_id = hrBotChannel;
                        updateObj.status = constants.userStatus.ENABLE;
                        updateObj.role = constants.userRole.USER;
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
            } catch (error) {
              console.log(error);
              
              messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
            }
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.MANAGER_CHANGE_CONFIRMATION) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let options = {
              url: baseUrl   + constants.API_END_POINT.GET_NEW_MANAGER_EMAIL,
              method: 'POST',
              json: {
                email : taggedUserInfo.emails
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            let managerBotChannelId;

            let result = yield utilityService.sendHttpRequest(logHandler, options);
            try{
            if(result.message.data.manager_email) {
              let [newManagerID] = yield userService.getUserDetails(logHandler, { email: result.message.data.manager_email, workspace_id : businessInfo.workspace_id });
              let newManagerUserId = newManagerID.fugu_user_id;
              let [managerBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, newManagerUserId] });

              if (_.isEmpty(managerBotChannel)) {
                let usersIds = [newManagerUserId, payload.bot_user_id];
                let params = {};
                params.chat_type = constants.chatType.FUGU_BOT;
                params.channel_type = constants.channelType.FUGU_BOT;
                params.workspace_id = businessInfo.workspace_id;
                params.channel_name = "user_" + newManagerUserId + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
                params.owner_id = newManagerUserId;
                let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                managerBotChannelId = response.insertId;
                for (let i = 0; i < usersIds.length; i++) {
                  let updateObj = {};
                  updateObj.user_id = usersIds[i];
                  updateObj.channel_id = managerBotChannelId;
                  updateObj.status = constants.userStatus.ENABLE;
                  updateObj.role = constants.userRole.USER;
                  yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                }
              } else {
                managerBotChannelId = managerBotChannel.channel_id;
              }
            } 

            let managerPayload = {
              user_id: payload.bot_user_id,
              date_time: utils.getCurrentTime(),
              is_typing: 0,
              message_type: 14,
              server_push: 0,
              is_thread_message: false,
              muid: UniversalFunc.getRandomString(),
              is_web: true,
              message: "Request for manager change",
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
          }
          catch(error){
            messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
          }
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let options = {
              url: baseUrl   + constants.API_END_POINT.GET_NEW_MANAGER_EMAIL,
              method: 'POST',
              json: {
                email: taggedUserInfo.emails,
                'action' : 0
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            yield utilityService.sendHttpRequest(logHandler, options);
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
           // yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });

            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          }
        } else if (payload.button_data.confirmation_type == constants.managerChange.NEW_MANAGER_APPROVAL) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let options = {
              url: baseUrl  + constants.API_END_POINT.CHANGE_MANAGER,
              method: 'POST',
              json: {
                employee_email: taggedUserInfo.emails
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);
            if (!result._server_messages) {
              // yield bot.updateManagerInAttendance(logHandler, { id: payload.button_data.leave_id }); // leave id = request id for changing manager
              yield bot.updateUserManager(logHandler, { full_name: userInfo.full_name, manager_fugu_user_id: userInfo.user_id, user_id: payload.button_data.tagged_user_id });
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
                message: `Hi there, your manager change request has been approved. Your new manager is <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>. I have updated the records. Good Day!`
              };

              publishMessage(logHandler, userPayload, userBotChannel.channel_id);
            } else {
              messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
            }
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            messageString = `Thanks! I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`;

            let options = {
              url: baseUrl   + constants.API_END_POINT.GET_NEW_MANAGER_EMAIL,
              method: 'POST',
              json: {
                email: taggedUserInfo.emails,
                'action': 0
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            yield utilityService.sendHttpRequest(logHandler, options);

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
              message: `Your request for changing the manager has been rejected by your new manager <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>`
            };
            // yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });


            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          }
        } else if (payload.button_data.confirmation_type == constants.leaveState.LEAVE_TYPE_SELECT) {
          let [getUserRole] = yield bot.getTeamMembers(logHandler, { user_id: userInfo.user_id });

          if (getUserRole.manager_fugu_user_id) {

            let options = {
              url: baseUrl   + constants.API_END_POINT.HRM_LEAVE_APPLY,
              method: 'POST',
              json: {
                email: userInfo.emails,
                from_date: messageData.start_time
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token // 'token 84d4837832bee35:99110d88d49c4c1'
              }
            };

            if (payload.button_data.button) {
              let buttonObject = utils.isString(payload.button_data.button) ? utils.jsonParse(payload.button_data.button) : payload.button_data.button;
              options.json.leave_type = buttonObject.leave_type_id;
            } else {
              options.json.leave_type = payload.button_action;
            }
            // used to identify half day leaves
            const parsedMessage =JSON.parse(messageData.message);
            options.json.half_day = parsedMessage.half_day || 0;
            options.json.is_first_half = parsedMessage.is_first_half || 0;
            // if (messageData.message_content.includes(constants.leaveMetricTypes.FIRST_HALF)) {
            //   options.json.day_time = constants.halfDayTypes.FIRST_HALF;
            //   options.json.requested_leaves = constants.halfDayLeaveDeduction;
            // } else if (messageData.message_content.includes(constants.leaveMetricTypes.SECOND_HALF)) {
            //   options.json.day_time = constants.halfDayTypes.SECOND_HALF;
            //   options.json.requested_leaves = constants.halfDayLeaveDeduction;
            // } else if (messageData.message_content.includes(constants.leaveMetricTypes.WORK_FROM_HOME)) {
            //   options.json.message += " wfh";
            //   options.json.day_time = constants.workFromHome;
            // }

            messageData.end_time ? options.json.to_date = messageData.end_time : 0;
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            try {
              if (result.message.statusCode == 200) {
                let actionPayload = {
                  title: `*` + result.message.message + `*`,
                  confirmation_type: constants.leaveState.USER_LEAVE_CONFIRMATION,
                  leave_id: result.message.leave_id,
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
              } else if (result.message.statusCode == 450) {
                // let [pendingApprovalForLeave] = yield bot.getPendingUserApprovalForLeave(logHandler, { workspace_id: businessInfo.workspace_id, leave_id: result.message.leave_type_id, channel_id: channelInfo.channel_id });
                messageString = result.message.message;
                content.message_type = constants.messageType.BUTTON;
                content.custom_actions = [{ title: result.message.title }];
              } else if (result.statusCode == RESP.ERROR.eng.USER_DISABLED.statusCode) {
                messageString = result.message;
              } else {
                messageString = `Not able to take action.`;
              }
            } catch (error) {
              messageString = JSON.parse(JSON.parse(result._server_messages)[0]).message;
            }
          }
        } else if (payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING || payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_OUT_FENCING) {
          if (payload.button_action == constants.buttonsForLeave.CONFIRM) {
            let result = yield bot.getTeamMembers(logHandler, payload);
            let [businessInfo] = yield conversationService.getTokenFromUserId(logHandler, {user_id : payload.user_id})
            let botDetails = yield bot.getBotInfo(logHandler,{workspace_id: businessInfo.workspace_id, user_type: constants.userType.HRM_BOT});
            if(_.isEmpty(botDetails)){
              return reject(`HRM Bot Not Installed !!`);
            }
            let attendanceUsers = yield bot.getBotChannelId(logHandler, {attendance_user_id: botDetails[0].user_id, user_id: businessInfo.manager_fugu_user_id});
            if(_.isEmpty(attendanceUsers)){
              return reject(`Channel not found with HRM bot`);
            }
            let messagePayload = {
              user_id: attendanceUsers[0].bot_id,
              date_time: utils.getCurrentTime(),
              is_typing: 0,
              message_type: 14,
              server_push: 0,
              is_thread_message: false,
              is_web: true,
              muid: UniversalFunc.getRandomString(),
              message: "wrong punch-in location message"
            };

            let actionPayload = {
              tagged_user_id: result[0].fugu_user_id,
              title: `*<a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>* has Punched ${(payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING) ? "in" : "out"} from different location. Do you want to approve the location? <a class=\"tagged-agent tagged-user\" href=\"mention://${result[0].manager_fugu_user_id}\" data-id=\"${result[0].manager_fugu_user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\"></a>`,
              buttons: [{
                label: constants.buttonsForLeave.APPROVE, action: constants.buttonsForLeave.APPROVE, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1
              },
              {
                label: constants.buttonsForLeave.DENY, action: constants.buttonsForLeave.DENY, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2
              }]
            };
            payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING ? actionPayload.confirmation_type = constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION : actionPayload.confirmation_type = constants.punchState.MANAGER_PUNCH_OUT_CONFIRMATION;
            payload.button_data.confirmation_type == constants.punchState.GEO_PUNCH_IN_FENCING ? messagePayload.message = "Punch in request" : messagePayload.message = "Punch out request.";

            messagePayload.custom_actions = [actionPayload];
            yield publishMessage(logHandler, messagePayload, attendanceUsers[0].channel_id);
            messageString = "Okay I have sent request to your manager for approval."
          } else if (payload.button_action == constants.buttonsForLeave.CANCEL) {
            messageString = "Okay i cancelled your request.";
          }
        } else if (payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION || payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_OUT_CONFIRMATION) {
          let [taggedUserInfo] = yield userService.getUserDetail(logHandler, { user_id: payload.button_data.tagged_user_id });
          if (payload.button_action == constants.buttonsForLeave.APPROVE) {
            
            let jaggaurnautOptions = {
              url: baseUrl  + constants.API_END_POINT.HRM_CLOCK_IN,
              method: 'POST',
              json: {
                "disable_location_check": 1,
                email: taggedUserInfo.emails,
                attendance_authentication_level: constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION,
                workspace_id : channelInfo.workspace_id,
                disable_checks : 1
              },
              headers: {
              "Content-Type": "application/json",
              "Authorization": token
            }
            };
            payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION ? jaggaurnautOptions.json.clock_event = 'in' : jaggaurnautOptions.json.clock_event = 'out';

            let result = yield utilityService.sendHttpRequest(logHandler, jaggaurnautOptions);

            let [userBotChannel] = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [payload.bot_user_id, payload.button_data.tagged_user_id] });
            let userPayload = {
              user_id: payload.bot_user_id,
              date_time: utils.getCurrentTime(),
              is_typing: 0,
              message_type: 1,
              server_push: 0,
              is_thread_message: false,
              is_web: true,
              message: result.message.message
            };
            messageString = `Thanks I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>`
            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
          } else if (payload.button_action == constants.buttonsForLeave.DENY) {
            let punchState = (payload.button_data.confirmation_type == constants.punchState.MANAGER_PUNCH_IN_CONFIRMATION) ? "in" : "out"
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
              message: `Your request for punching ${punchState} from different location has been rejected by your  manager <a class=\"tagged-agent tagged-user\" href=\"mention://${userInfo.user_id}\" data-id=\"${userInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${userInfo.full_name}</a>`
            };
            yield bot.updateChangeManagerRequest(logHandler, { id: payload.button_data.leave_id });
            publishMessage(logHandler, userPayload, userBotChannel.channel_id);
            messageString = `Thanks I will update <a class=\"tagged-agent tagged-user\" href=\"mention://${taggedUserInfo.user_id}\" data-id=\"${taggedUserInfo.user_id}\" contenteditable=\"false\" style=\"color: rgb(0, 123, 255); text-decoration: none;\">@${taggedUserInfo.full_name}</a>.`
          }
        } 

        else if (payload.button_data.confirmation_type == constants.leaveState.GET_PAY_SLIPS ) {
          if (payload.button_action == constants.buttonsForLeave.DOWNLOAD) {

            let options = {
              url: baseUrl  + constants.API_END_POINT.DOWNLOAD_PAY_SLIP,
              method: 'POST',
              json: {
                name: payload.button_data.leave_id // name of payslip
              },
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              }
            };

            let result = yield utilityService.sendHttpRequest(logHandler, options);
            if(result.message.statusCode ==200 && result.message.data) {
              messageString = result.message.message + "\n" + baseUrl  + result.message.data;
            } else {
              messageString = 'Not able to download your payslip';
            }
          }
        } 
        else if (payload.button_data.confirmation_type == constants.hiringConstant.FORWARD) {
          if (payload.button_action == constants.buttonsForHiring.FORWARD) {
            messageString = `Forwarded By <a contenteditable="false" class="tagged-agent tagged-user" href="mention://${userInfo.user_id}" data-uid="4">@${userInfo.full_name}</a>`;
            let channel = yield channelService.getHrmBotChannelId(logHandler, { workspace_id: channelInfo.workspace_id, user_id: payload.tagged_users[0] });
            if (!channel || !channel.length) {
              const hrmBotUser = yield botservice.getBotInfo(logHandler, { workspace_id: channelInfo.workspace_id, user_type : constants.userType.HRM_BOT })
              let usersIds = [payload.tagged_users[0], hrmBotUser[0].user_id];
              let params = {};
              params.chat_type = constants.chatType.FUGU_BOT;
              params.channel_type = constants.channelType.FUGU_BOT;
              params.workspace_id = channelInfo.workspace_id;
              params.channel_name = "user_" + payload.tagged_users[0] + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
              params.owner_id = payload.tagged_users[0];

              let existingChannel = yield channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: usersIds });
              if (!existingChannel.length) {
                let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
                channelId = response.insertId;
                content.channelId = channelId

                for (let i = 0; i < usersIds.length; i++) {
                  let updateObj = {};
                  updateObj.user_id = usersIds[i];
                  updateObj.channel_id = channelId;
                  updateObj.status = constants.userStatus.ENABLE;
                  updateObj.role = constants.userRole.USER;
                  updateObj.business_id = businessInfo.business_id;
                  yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
                }
              }
              channelId = existingChannel.channel_id;
              content.channelId = existingChannel.channel_id;

            } else {
              channelId = channel[0].channel_id;
              content.channelId = channel[0].channel_id;
            }

            content.message_type = 14;
            content.is_forward = !_.isUndefined(messageData.custom_actions[0].is_forward) ? messageData.custom_actions[0].is_forward : 1;
            const custom_actions = {
              buttons : messageData.custom_actions[0].buttons,
              title: messageData.custom_actions[0].title,
              confirmation_type: messageData.custom_actions[0].confirmation_type,
              is_action_taken: false,
              default_text_field : messageData.custom_actions[0].default_text_field,
              comment: payload.button_data.comment
            }
            content.custom_actions = [custom_actions];

            //update on erp
            let postUrl = {};
            messageData.custom_actions[0].buttons.forEach(function (value) {
              if (value.action === payload.button_action) {
                postUrl = value;
              }
            });
            let userEmail = yield userService.getUserInfo(logHandler, { "user_id": payload.tagged_users[0], "workspace_id": channelInfo.workspace_id })
            const reqBody = Object.assign(postUrl.request_params, { next_assignee: userEmail[0].email });
            // user_id and email of receiver
            postUrl.request_params ? postUrl.request_params.receiver_id = userEmail[0].fugu_user_id : ''
            postUrl.request_params ? postUrl.request_params.receiver_name = userEmail[0].full_name : ''
            // user_id and email of sender
            postUrl.request_params ? postUrl.request_params.sender_id = userInfo.user_id : ''
            postUrl.request_params ? postUrl.request_params.sender_name = userInfo.full_name : ''

            postUrl.request_params ? postUrl.request_params.email = userInfo.emails: '';
            postUrl.request_params ? (payload.button_data.remark ? postUrl.request_params.comment = payload.button_data.remark : postUrl.request_params.comment = payload.button_data.comment)  : '';
            postUrl.request_params ? postUrl.request_params.is_forwarded = 1 : '';
            let options = {
              url: postUrl.post_url,
              method: postUrl.method,
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              },
              form: postUrl.request_params
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            const resultComment = yield addComment(logHandler, {
              baseUrl, token, referenceDoctype: 'Staffing Plan',
              referenceName: postUrl.request_params.staffing_plan_id, emails: userInfo.emails,
              comment: payload.button_data.remark ? payload.button_data.remark : payload.button_data.comment
            })
          } else if (payload.button_action == constants.buttonsForHiring.ACCEPT) {
            let postUrl = {};
            messageData.custom_actions[0].buttons.forEach(function (value) {
              if (value.action === payload.button_action) {
                postUrl = value;
              }
            });
            postUrl.request_params ? postUrl.request_params.email = userInfo.emails: '';
            let options = {
              url: postUrl.post_url,
              method: postUrl.method,
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              },
              form:  postUrl.request_params
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            const resultComment = yield addComment(logHandler, {
              baseUrl, token, referenceDoctype: 'Staffing Plan',
              referenceName: postUrl.request_params.staffing_plan_id, emails: userInfo.emails,
              comment: payload.button_data.remark ? payload.button_data.remark : payload.button_data.comment
            })
          } else if (payload.button_action == constants.buttonsForHiring.REJECT) {
            let postUrl = {};
            messageData.custom_actions[0].buttons.forEach(function (value) {
              if (value.action === payload.button_action) {
                postUrl = value;
              }
            });
            postUrl.request_params ? postUrl.request_params.email = userInfo.emails : '';
            let options = {
              url: postUrl.post_url,
              method: postUrl.method,
              headers: {
                "Content-Type": "application/json",
                "Authorization": token
              },
              form: postUrl.request_params
            };
            let result = yield utilityService.sendHttpRequest(logHandler, options);
            const resultComment = yield addComment(logHandler, {
              baseUrl, token, referenceDoctype: 'Staffing Plan',
              referenceName: postUrl.request_params.staffing_plan_id, emails: userInfo.emails,
              comment: payload.button_data.remark ? payload.button_data.remark : payload.button_data.comment
            })
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
      if (!messageString ) {
        return;
      }

      content.message = messageString;
      content.channel_id = channelInfo.channel_id;
      if (!content.channelId) {
        content.channelId = channelInfo.channel_id
      }
      
      if (!content.is_forward) {
        content.channel_id = content.channelId;
        publishMessage(logHandler, content, content.channelId);
      }
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      console.log(":::::::::::", error)
      logger.error(logHandler, { ERROR: error });
      resolve();
    });
  })
}

function publishMessageOnHrmBot(logHandler, payload) {
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
      logger.trace(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

async function publishAutoPuchOut(logHandler, payload) {
  let [businessInfo] = await conversationService.getTokenFromUserId(logHandler, {user_id : payload.user_id})
  let botDetails = await bot.getBotInfo(logHandler,{workspace_id: businessInfo.workspace_id, user_type: constants.userType.HRM_BOT});
  if(_.isEmpty(botDetails)){
    return reject(`HRM Bot Not Installed !!`);
  }
  let attendanceUsers = await bot.getBotChannelId(logHandler, {attendance_user_id: botDetails[0].user_id});
  if(_.isEmpty(attendanceUsers)){
    return reject(`Channel not found with HRM bot`);
  }

  let messagePayload = {
    date_time: utils.getCurrentTime(),
    is_typing: 0,
    message_type: 1,
    server_push: 0,
    is_thread_message: false,
    is_web: true,
    message: "Seems like you forgot to punch out today, so I am clocking you out for the day."
  };
  for (let data of attendanceUsers) {
    messagePayload.user_id = data.bot_id;
    messagePayload.workspace_id = businessInfo.workspace_id;
    await publishMessage(logHandler, messagePayload, data.channel_id);
  }
  return {};
}
function callGetMessages(options) {
  return new Promise((resolve, reject) => {
    var opts = {
      method: 'GET',
      url: `${config.get('hrmServerUrl')}/api/conversation/getMessages`,
      headers: {
        'Content-Type': 'application/json',
        device_type: 'WEB',
        app_version: '1.0.0',
      },
      qs: {
        channel_id: options.channel_id,
        en_user_id: commonFunctions.encryptText(options.user_to_workspace_user_id),
        page_start: 1,
        store_promise: true,
     },
      json: true
    };

    request(opts, function (error, response, body) {
      if (error) {
        return reject(error);
      }
      return resolve(body);
    });
  })
}
exports.getUserChannelMessages = function (logHandler, payload) {
  return new Promise((resolve, reject) => {
    return Promise.coroutine(function* () {
      const workspace = yield workspaceService.getWorkspaceDetails(logHandler, { workspace_id: payload.workspace_id, hrm_api_key: payload.api_key });
      if (!workspace || !workspace.length) {
        const errorObj = {
          message: 'Invalid Workspace',
          statusCode: '403',
          data: {}
        }
        return reject(errorObj)
      }

      const userChannel = yield channelService.getUserFromUserToChannel(logHandler, channel[0].owner_id, channel[0].channel_id);
      if (!userChannel || !userChannel.length) {
        const errorObj = {
          message: 'Invalid Workspace',
          statusCode: '403',
          data: {}
        }
        return resolve(errorObj)
      }
      const response = yield callGetMessages({ user_to_workspace_user_id: channel[0].owner_id, channel_id: channel[0].channel_id })
      return response.data;
    })().then((data) => {
      logger.trace(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}
function getOrCreateChannelId(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      const hrmBotUser = yield botservice.getBotInfo(logHandler, {
        workspace_id  : payload.workspace_id,
        user_type     : constants.userType.HRM_BOT
      });
      let hrmUser = yield botservice.getBotInfo(logHandler, {
        workspace_id  : payload.workspace_id,
        user_type     : constants.userType.HRM_BOT,
        email         : payload.email
      });
      if (!hrmUser.length) {
        return "Something went wrong";
      }
      let usersIds = [hrmUser[0].user_id, hrmBotUser[0].user_id];

      let params = {};
      params.chat_type = constants.chatType.FUGU_BOT;
      params.channel_type = constants.channelType.FUGU_BOT;
      params.workspace_id = payload.workspace_id;
      params.channel_name = "user_" + hrmUser[0].user_id + "_" + Math.round(parseFloat(Math.random() * 1000000)) + "";
      params.owner_id = hrmUser[0].user_id;

      let existingChannel = yield channelService.getChannelsHavingUsers(logHandler, {
        chat_type: constants.chatType.FUGU_BOT,
        userIds: usersIds
      });
      if (!existingChannel.length) {
        const businessInfo = yield businessService.getInfo(logHandler, { workspace_id: payload.workspace_id });
        let response = yield Promise.promisify(conversationService.insertIntoChannels).call(null, logHandler, params);
        channelId = response.insertId;

        for (let i = 0; i < usersIds.length; i++) {
          let updateObj = {};
          updateObj.user_id = usersIds[i];
          updateObj.channel_id = channelId;
          updateObj.status = constants.userStatus.ENABLE;
          updateObj.role = constants.userRole.USER;
          updateObj.business_id = businessInfo.business_id;
          yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);
        }
      } else {
        channelId = existingChannel[0].channel_id;
      }

      return {
        'channelId': channelId,
        'userIds': usersIds,
        'hrmBotUserId': hrmBotUser[0].user_id
      };
    })().then((data) => {
      logger.trace(logHandler, {
        SUCCESS: data
      });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, {
        ERROR: error
      });
      reject(error);
    });
  });
}

function postMessage(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      const channelIdArray = yield getOrCreateChannelId(logHandler,payload);

      const channelId = channelIdArray.channelId;
      let channelInfo = yield channelService.getInfo(logHandler, { channel_id: channelId });
      channelInfo = channelInfo[0];
      let otherUsers = yield channelService.getUsersFromUserToChannelExceptUserId(logHandler, { channel_id: channelInfo.channel_id, user_id: channelIdArray.userIds[1] });
      if(!otherUsers || !otherUsers.length){
        throw RESP.SUCCESS.NO_DATA_RECORD;
      }
      otherUsers = otherUsers[0];
      let content = {
        user_id: otherUsers.user_id,
        date_time: commonFunctions.getCurrentTime(),
        is_typing: 0,
        message_type: 1,
        server_push: 0,
        is_thread_message: false,
        muid: UniversalFunc.getRandomString(),
        is_web: true,
        message_type: payload.message_type || 1,
        custom_actions: payload.actions || [],
        message : payload.message || '',
        channel_id : channelId,
        message_type: payload.message_type,
        hrm_bot_type: constants.userType.HRM_BOT
      };
      !payload.message_type || payload.message_type != constants.messageType.BUTTON ? content.hrm_bot_type = undefined: ''
      publishMessage(logHandler, content, channelInfo.channel_id);
      return {};
    })().then((data) => {
      logger.trace(logHandler, { SUCCESS: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}
function addComment(logHandler, options) {
  return Promise.coroutine(function* () {
    let optionsComment = {
      url: options.baseUrl + constants.API_END_POINT.HRM_ADD_COMMENT, // todo
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": options.token
      },
      formData:
      {
        reference_doctype: options.referenceDoctype || 'Staffing Plan',
        reference_name: options.referenceName,
        comment_email: options.emails,
        content: options.comment
      }
    };
    resultComment = yield utilityService.sendHttpRequest(logHandler, optionsComment);
  })();
}
