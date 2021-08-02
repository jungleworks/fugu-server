/* eslint-disable no-unused-expressions */
const bot = require('../services/bot');
const dbHandler = require('../database').dbHandler;
const { logger } = require('../libs/pino_logger');
const utils = require('../Utils/commonFunctions');
const UniversalFunc = require('../Utils/universalFunctions');
const _ = require('underscore');
const moment = require('moment');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const ERROR = require('../Config').responseMessages.ERROR;
const jwt = require('jsonwebtoken');

const Promise = require('bluebird');

const config = require('config');
const constants = require('../Utils/constants');
const userService = require('../services/user');
const utilityService = require('../services/utility');
const businessService = require('../services/business');
const conversationService = require('../services/conversation');
const botController = require('../Controller/botController');
const channelService = require('../services/channel');
const workspaceService = require('../services/workspace');


exports.getLeaveBalance = getLeaveBalance;
exports.getBusinessLeaves = getBusinessLeaves;
exports.editBusinessLeave = editBusinessLeave;
exports.editUserLeaves = editUserLeaves;
exports.editUserInfoInAttendance = editUserInfoInAttendance;
exports.getMembers = getMembers;
exports.editBusinessInfoInAttendance = editBusinessInfoInAttendance;
exports.getBusinessInfo = getBusinessInfo;
exports.editUserPunchStatus = editUserPunchStatus;
exports.getUsersTimesheet = getUsersTimesheet;
exports.checkImageAndLocation = checkImageAndLocation;
exports.uploadDefaultImage = uploadDefaultImage;
exports.getBusinessReport = getBusinessReport;
exports.deleteExpiredLeaves = deleteExpiredLeaves;
exports.updateMembersOnLeave = updateMembersOnLeave;
exports.getToken = getToken;
exports.verifyAttendanceToken = verifyAttendanceToken;

async function getLeaveBalance(logHandler, payload) {
  const options = {
    url: config.get('attendanceUrl') + constants.API_END_POINT.USER_LEAVE_BALANCE + `?business_token=${payload.businessInfo.attendance_token}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}&users_count=${payload.users_count}`,
    method: 'GET',
    attendance: true
  };

  payload.start_date ? options.url += `&start_date=${payload.start_date}` : 0;
  payload.end_date ? options.url += `&end_date=${payload.end_date}` : 0;

  if (payload.users_count == constants.usersCount.USER) {
    options.url += `&user_name=${payload.user_name}`;
    options.url += `&action_by_user_name=fugu${payload.userInfo.user_id}`;
  } else {
    options.url += `&user_name=fugu${payload.userInfo.user_id}`;
  }

  let result = await utilityService.sendHttpRequest(logHandler, options);
  result = JSON.parse(result);

  if (result.statusCode == 400) {
    throw new Error(result.message);
  }

  return result.data;
}


function getBusinessLeaves(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.GET_BUSINESS_LEAVES,
        method: 'POST',
        attendance: true,
        json: {
          user_name: "fugu" + payload.userInfo.user_id,
          full_name: payload.userInfo.full_name,
          email: payload.userInfo.email,
          business_token: payload.businessInfo.attendance_token,
          users_count: payload.users_count
        }
      };

      let result = yield utilityService.sendHttpRequest(logHandler, options);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function editBusinessLeave(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.EDIT_BUSINESS_LEAVE,
        method: 'POST',
        attendance: true,
        json: {
          user_name: "fugu" + payload.userInfo.user_id,
          full_name: payload.userInfo.full_name,
          email: payload.userInfo.email,
          business_token: payload.businessInfo.attendance_token
        }
      };

      payload.leave_title ? options.json.leave_title = payload.leave_title : 0;
      payload.leave_synonyms ? options.json.leave_synonyms = payload.leave_synonyms : 0;
      payload.annual_count ? options.json.annual_count = payload.annual_count : 0;
      payload.leave_type_id ? options.json.leave_type_id = payload.leave_type_id : 0;
      payload.accrual_interval ? options.json.accrual_interval = payload.accrual_interval : 0;
      payload.max_annual_rollover ? options.json.max_annual_rollover = payload.max_annual_rollover : 0;
      payload.status || payload.status == "0" ? options.json.status = payload.status : 0;
      payload.is_negative_leave_allowed || payload.is_negative_leave_allowed == "0" ? options.json.is_negative_leave_allowed = payload.is_negative_leave_allowed : 0;
      payload.is_clock_in_allowed || payload.is_clock_in_allowed == "0" ? options.json.is_clock_in_allowed = payload.is_clock_in_allowed : 0;


      let result = yield utilityService.sendHttpRequest(logHandler, options);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      if (!payload.leave_type_id && result.statusCode == 200) {
        return { leave_type_id: result.data.insertId };
      } else if (result.statusCode == ERROR.eng.SYNONYM_ALREADY_EXIST.statusCode) {
        throw ERROR.eng.SYNONYM_ALREADY_EXIST;
      } else if (result.statusCode == ERROR.eng.TITLE_ALREADY_EXIST.statusCode) {
        throw ERROR.eng.TITLE_ALREADY_EXIST;
      }

      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function editUserLeaves(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.EDIT_USER_LEAVES,
        method: 'POST',
        attendance: true,
        json: {
          user_name: payload.user_name,
          business_token: payload.businessInfo.attendance_token,
          leave_count: payload.leave_count,
          leave_type_id: payload.leave_type_id
        }
      };

      let result = yield utilityService.sendHttpRequest(logHandler, options);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function editUserInfoInAttendance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.EDIT_USER_INFO,
        method: 'POST',
        attendance: true,
        json: {
          user_name: "fugu" + payload.userInfo.user_id,
          full_name: payload.userInfo.full_name,
          email: payload.userInfo.email,
          business_token: payload.businessInfo.attendance_token,
          action_user_name: payload.action_user_name
        }
      };
      payload.status || payload.status == 0 ? options.json.status = payload.status : 0;
      payload.shift_start_time ? options.json.shift_start_time = payload.shift_start_time : 0;
      payload.work_hours ? options.json.work_hours = payload.work_hours : 0;
      payload.time_zone ? options.json.time_zone = payload.time_zone : 0;
      payload.employee_id ? options.json.employee_id = payload.employee_id : 0;
      payload.joining_date ? options.json.joining_date = payload.joining_date : 0;
      payload.birth_date ? options.json.birth_date = payload.birth_date : 0;
      payload.work_days ? options.json.work_days = payload.work_days : 0;
      payload.hasOwnProperty('user_punch_image') ? options.json.user_punch_image = payload.user_punch_image : 0;
      payload.config ? options.json.config = payload.config : 0;

      let result = yield utilityService.sendHttpRequest(logHandler, options);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;

    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS + `?business_token=${payload.businessInfo.attendance_token}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}&user_name=fugu${payload.userInfo.user_id}`,
        method: 'GET',
        attendance: true
      };
      payload.user_count ? options.url += `&user_count=${payload.user_count}` : 0;
      payload.start_date ? options.url += `&start_date=${payload.start_date}` : 0;
      payload.end_date ? options.url += `&end_date=${payload.end_date}` : 0;

      let result = yield utilityService.sendHttpRequest(logHandler, options);
      result = JSON.parse(result);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function editBusinessInfoInAttendance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.EDIT_BUSINESS_INFO,
        method: 'PATCH',
        attendance: true,
        json: {
          user_name: "fugu" + payload.userInfo.user_id,
          business_token: payload.businessInfo.attendance_token,
          full_name: payload.userInfo.full_name,
          email: payload.userInfo.email
        }
      };

      payload.session_start ? options.json.session_start = payload.session_start : 0;
      payload.session_end ? options.json.session_end = payload.session_end : 0;
      payload.auto_punch_out ? options.json.auto_punch_out = payload.auto_punch_out : 0;
      payload.admin_roles ? options.json.admin_roles = payload.admin_roles : 0;
      payload.work_days ? options.json.work_days = payload.work_days : 0;
      payload.work_start_time ? options.json.work_start_time = payload.work_start_time : 0;
      payload.work_hours ? options.json.work_hours = payload.work_hours : 0;
      payload.lunch_duration ? options.json.lunch_duration = payload.lunch_duration : 0;
      payload.punch_in_reminder_time ? options.json.punch_in_reminder_time = payload.punch_in_reminder_time : 0;
      payload.punch_out_reminder_time ? options.json.punch_out_reminder_time = payload.punch_out_reminder_time : 0;
      payload.hr_roles ? options.json.hr_roles = payload.hr_roles : 0;
      payload.business_area ? options.json.business_area = payload.business_area : 0;
      payload.config ? options.json.config = payload.config : 0;
      payload.hasOwnProperty('keep_user_data') ? options.json.keep_user_data = payload.keep_user_data : 0;
      payload.admin_ids_remove ? options.json.admin_ids_remove = payload.admin_ids_remove : 0;
      payload.hr_ids_remove ? options.json.hr_ids_remove = payload.hr_ids_remove : 0;

      let result = yield utilityService.sendHttpRequest(logHandler, options);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function getBusinessInfo(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.GET_BUSINESS_INFO + `?business_token=${payload.businessInfo.attendance_token}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}&user_name=fugu${payload.userInfo.user_id}`,
        method: 'GET',
        attendance: true
      };

      let result = yield utilityService.sendHttpRequest(logHandler, options);
      result = JSON.parse(result);

      if (result.statusCode == 400) {
        throw new Error(result.message);
      }

      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function editUserPunchStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.EDIT_USER_PUNCH_STATUS,
        method: 'PATCH',
        attendance: true,
        json: {
          user_name: "fugu" + payload.userInfo.user_id,
          business_token: payload.businessInfo.attendance_token,
          full_name: payload.userInfo.full_name,
          email: payload.userInfo.email
        }
      };

      payload.punch_in_time ? options.json.punch_in_time = payload.punch_in_time : 0;
      payload.punch_out_time ? options.json.punch_out_time = payload.punch_out_time : 0;
      payload.punch_id ? options.json.punch_id = payload.punch_id : 0;


      let result = yield utilityService.sendHttpRequest(logHandler, options);
      if (result.statusCode == 400) {
        throw new Error(result.message);
      }
      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersTimesheet(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.GET_USERS_WORK_TIMESHEET + `?business_token=${payload.businessInfo.attendance_token}&user_name=${"fugu" + payload.userInfo.user_id}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}`,
        method: 'GET',
        attendance: true
      };

      payload.start_date ? options.url += `&start_date=${payload.start_date}` : 0;
      payload.end_date ? options.url += `&end_date=${payload.end_date}` : 0;
      payload.search_text ? options.url += `&search_text=${payload.search_text}` : 0;
      payload.page_start ? options.url += `&page_start=${payload.page_start}` : 0;
      payload.page_end ? options.url += `&page_end=${payload.page_end}` : 0;


      let result = yield utilityService.sendHttpRequest(logHandler, options);
      result = JSON.parse(result);
      if (result.statusCode == 400) {
        throw new Error(result.message);
      }
      return result.data;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function checkImageAndLocation(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let appId    = constants.AppIdCheck.ATTENDANCE_BOT_APP_ID;
      let userType = constants.userType.ATTENDANCE_BOT;
      let botName  = "Attendance";
      
      if(payload.is_hrm_bot == 'true' || payload.is_hrm_bot == true){
        appId    = constants.AppIdCheck.HRM_APP_ID;
        userType = constants.userType.HRM_BOT;
        botName  = "HRM"; 
      }
      let botState   = yield bot.getAppState(logHandler, { workspace_id: payload.businessInfo.workspace_id, app_id: appId });
      let botDetails = yield bot.getBotInfo(logHandler,{workspace_id: payload.businessInfo.workspace_id, user_type: userType});
      if(_.isEmpty(botDetails)){
        return reject(`${botName} Bot Not Installed !!`);
      }
      let attendanceChannelDetails = yield bot.getBotChannelId(logHandler, {attendance_user_id: botDetails[0].user_id, user_id: payload.userInfo.user_id});
      if(_.isEmpty(attendanceChannelDetails)){
        return reject(`Channel not found with ${botName} bot`);
      }
      let content = {
        date_time        : utils.getCurrentTime(),
        is_typing        : 0,
        message_type     : 1,
        user_type        : 3,
        message_status   : 3,
        server_push      : 0,
        is_thread_message: false
      };

      let options = {
        url   : ``,
        method: 'POST',
        json  : {
          business_token                 : payload.businessInfo.attendance_token,
          user_name                      : "fugu" + payload.userInfo.user_id,
          full_name                      : payload.userInfo.full_name,
          email                          : payload.userInfo.email
        }
      };

      payload.file     ? options.json.image    = fs.readFileSync(payload.file.path) : 0;
      payload.location ? options.json.location = payload.location                   : 0,
      payload.authentication_level ? options.json.authentication_level = constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH : 0;

      if (userType == constants.userType.HRM_BOT) {
        payload.businessInfo.hrm_configuration = JSON.parse(payload.businessInfo.hrm_configuration);
        options.url = payload.businessInfo.hrm_configuration.base_url + constants.API_END_POINT.HRM_CLOCK_IN;
        options.json.workspace_id = payload.businessInfo.workspace_id;
        options.headers = {
          "Content-Type": "application/json",
          "Authorization": payload.businessInfo.hrm_configuration.token
        }
        options.json.clock_event = (payload.action == constants.attendanceMetric.IN) ? "in" : "out" 
      } else {
        options.url = config.get('attendanceUrl') + ((payload.action == constants.attendanceMetric.IN) ? constants.API_END_POINT.ATTENDANCE_CLOCK_IN : constants.API_END_POINT.ATTENDANCE_CLOCK_OUT )
      }

      let clonedObject              = utils.cloneObject(content);
          clonedObject.message      = payload.action;
          clonedObject.user_id      = payload.userInfo.user_id;
          clonedObject.faye_publish = true;
     
      yield botController.publishMessage(logHandler, clonedObject, attendanceChannelDetails[0].channel_id);

      
      if (_.isEmpty(botState) || botState[0].app_state == constants.appState.EXPIRED) {
        content.message      = "Plan Expired. Please contact owner.";
        content.user_id      = botDetails[0].user_id;
        content.faye_publish = true;
        yield botController.publishMessage(logHandler, content, attendanceChannelDetails[0].channel_id);
        return {};
      }
      let result = yield utilityService.sendHttpRequest(logHandler, options);
      let resultCode, resultMessage, apiResult; 
      /*
        If user_type is ATTENDANCE_BOT -> result json = result
        If user_type is HRM_BOT -> result json = result.message
      */
      if (userType == constants.userType.ATTENDANCE_BOT) {
        resultCode    = result.statusCode;
        resultMessage = result.message;
        apiResult     = result;
      } else {
        // try block to handle 500 response from HRM Server.
        try {
          resultCode    = result.message.statusCode;
          resultMessage = result.message.message
          apiResult     = result.message;
        } catch (error) {
          resultMessage   = JSON.parse(JSON.parse(result._server_messages)[0]).message;       // Getting error message
          content.message = resultMessage;
        }
      }
      
      if (resultCode == 400) {
        content.message = resultMessage;
        content.user_id = botDetails[0].user_id;
      } else if (resultCode == 412) {
        content.message = "It seems like your business owner has change your attendance configuration, so we have updated it for you. Try to punch in/out again.";
        content.user_id = botDetails[0].user_id;
        botController.publishMessage(logHandler, content, attendanceChannelDetails[0].channel_id);
        throw apiResult;
      } else if (resultCode == 420) {
        content.user_id = botDetails[0].user_id;
        content.message = resultMessage;
        content.message_type = constants.messageType.BUTTON;
        let actionPayload = {
          is_action_taken  : false,
          confirmation_type: constants.selfieForAttendance.CLICK_SELFIE,
          title            : `Can you please click a selfie for me?`,
          buttons          : [{ label: constants.selfieForAttendance.CLICK_SELFIE_BUTTON, action: constants.selfieForAttendance.OPEN_CAMERA, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1 }]
        };
        content.custom_actions = [actionPayload];
      } else if (resultCode == 460) {
            content.message      = resultMessage;
            content.user_id      = botDetails[0].user_id;
            content.message_type = constants.messageType.BUTTON;
            content.start_time   = new Date()
            content.link         = (result.data && result.data.link) ? result.data.link : `http://www.google.com/maps/place/${payload.location.latitude},${payload.location.longitude}`
        let actionPayload        = {
          tagged_user_id: payload.user_id,
          title: `You have punched from a different location. Do you want to confirm it with your manager?`,
          buttons: [{ label: constants.buttonsForLeave.CONFIRM, action: payload.button_action = constants.buttonsForLeave.CONFIRM, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1 },
          { label: constants.buttonsForLeave.CANCEL, action: payload.button_action = constants.buttonsForLeave.CANCEL, style: constants.buttonStyles.DANGER, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 2 }]
        };
        content.link ? actionPayload.title += " \n" + content.link : 0;

        payload.action == constants.attendanceMetric.IN ? actionPayload.confirmation_type = constants.punchState.GEO_PUNCH_IN_FENCING : actionPayload.confirmation_type = constants.punchState.GEO_PUNCH_OUT_FENCING;
        payload.action == constants.attendanceMetric.IN ? content.message = "Oops! you got wrong punch in location." : content.message = "Oops! you got wrong punch out location.";
        content.custom_actions = [actionPayload];
      } else {
        content.message = resultMessage;
        content.user_id = botDetails[0].user_id;
      }
      setTimeout(function () {
        botController.publishMessage(logHandler, content, attendanceChannelDetails[0].channel_id);
      }, constants.timeOutForAttendanceInSeconds);

      return;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function uploadDefaultImage(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let [messageData] = yield conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: payload.channel_id });
      let message = JSON.parse(messageData.message);
      message.custom_actions[0].is_action_taken = true;
      yield conversationService.updateInfo(logHandler, { message_id: messageData.id, message: JSON.stringify(message) });

      let options = {
        url: '',
        method: 'POST',
        json: {
          image: fs.readFileSync(payload.file.path),
          email: payload.userInfo.email,
        }
      };

      let userType = constants.userType.ATTENDANCE_BOT
      let botName = "Attendance";
      if(payload.is_hrm_bot == 'true' || payload.is_hrm_bot == true){
        userType = constants.userType.HRM_BOT;
        botName  = "HRM"
      }


      let botDetails = yield bot.getBotInfo(logHandler,{workspace_id: payload.businessInfo.workspace_id, user_type: userType});
      if(_.isEmpty(botDetails)){
        return reject(`${botName} BOt Not Installed !!`);
      }
      let attendanceChannelDetails = yield bot.getBotChannelId(logHandler, {attendance_user_id: botDetails[0].user_id, user_id: payload.userInfo.user_id});
      if(_.isEmpty(attendanceChannelDetails)){
        return reject(`Channel not found with ${botName} bot`);
      }

      if (userType == constants.userType.HRM_BOT) {
        payload.businessInfo.hrm_configuration = JSON.parse(payload.businessInfo.hrm_configuration);
        options.url = payload.businessInfo.hrm_configuration.base_url + constants.API_END_POINT.HRM_UPLOAD_IMAGE;
        options.headers = {
          "Content-Type": "application/json",
          "Authorization": payload.businessInfo.hrm_configuration.token
        };
      } else {
        options.url = config.get('attendanceUrl') + constants.API_END_POINT.UPLOAD_DEFAULT_IMAGE;
        options.json.user_name = "fugu" + payload.userInfo.user_id;
        options.json.business_token = payload.businessInfo.attendance_token;
      }
     
      result = yield utilityService.sendHttpRequest(logHandler,options);
      let content = {
        user_id          : botDetails[0].user_id,
        date_time        : utils.getCurrentTime(),
        is_typing        : 0,
        message_type     : 1,
        user_type        : 3,
        message_status   : 3,
        server_push      : 0,
        is_thread_message: false
      };

      let resultCode;
      let resultMessage;
      if (userType == constants.userType.ATTENDANCE_BOT) {
        resultCode = result.statusCode;
        resultMessage = result.message;
      } else {
        resultCode = result.message.statusCode;
        resultMessage = result.message.message;
      }

      if (resultCode == 400) {
        content.message = resultMessage;
        content.message_type = constants.messageType.BUTTON;
        let actionPayload = {
          is_action_taken: false,
          confirmation_type: constants.selfieForAttendance.CLICK_SELFIE,
          title: `Can you please click a selfie for me?`,
          buttons: [{ label: constants.selfieForAttendance.CLICK_selfieForAttendance_BUTTON, action: constants.selfieForAttendance.OPEN_CAMERA, style: constants.buttonStyles.SUCCESS, action_type: constants.buttonActionTypes.ACTION_PUBLISH, id: 1 }]
        };
        content.custom_actions = [actionPayload];
      } else {
        content.message = resultMessage;
      }
      botController.publishMessage(logHandler, content, attendanceChannelDetails[0].channel_id);

      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

async function getBusinessReport(logHandler, payload) {
    let response = {}
    let getUserRole = await bot.getTeamMembers(logHandler, { user_id: payload.userInfo.user_id });
    if (_.isEmpty(getUserRole)) {
       throw new Error("User does not Exist")
    } else {
      let options = {
        url: config.get('attendanceUrl') + constants.API_END_POINT.BUSINESS_REPORT + `?business_token=${payload.businessInfo.attendance_token}&user_name=fugu` + payload.userInfo.user_id+ `&start_date=${payload.start_date}&end_date=${payload.end_date}`,
        method: 'GET',
        attendance: true
      };

      payload.action_user_name ? options.url += `&action_user_name=${payload.action_user_name}` : 0;
      payload.include_deactivated_users ? options.url += `&include_deactivated_users=true` : 0;
      let result = await utilityService.sendHttpRequest(logHandler, options);

      

      result = JSON.parse(result);

      if (result.statusCode != 200) {
        messageString = result.message;
      } else if (!_.isEmpty(result.data)) {
        let csvData = result;
        let fileName = "./uploads/" + UniversalFunc.getRandomString() + ".csv";
        const json2csvParser = new Json2csvParser(constants.attendanceCsvFields);
        const csv = json2csvParser.parse(csvData.data);
        fs.writeFileSync(fileName, csv);
        let obj = {
          originalname: fileName,
          path: fileName
        };
        let csvFile = await utilityService.uploadFile(logHandler, { file: obj });

        let [botInfo] = await bot.getBotInfo(logHandler, { user_type: constants.userType.ATTENDANCE_BOT, workspace_id : payload.businessInfo.workspace_id });
        let [userBotChannel] = await channelService.getChannelsHavingUsers(logHandler, { chat_type: constants.chatType.FUGU_BOT, userIds: [botInfo.user_id, payload.userInfo.user_id] });
        if (userBotChannel.channel_id) {
          let managerPayload = {
            user_id: botInfo.user_id,
            date_time: utils.getCurrentTime(),
            is_typing: 0,
            message_type: 1,
            server_push: 0,
            is_thread_message: false,
            is_web: true,
          };

          managerPayload.message = `Here is your business timesheet report for current month --> \n` + csvFile.url;
          botController.publishMessage(logHandler, managerPayload, userBotChannel.channel_id);
        } else {
          messageString = `It seems like you have not been assigned any manager yet, Please contact HR for the same.`;
        }

        fs.unlinkSync(fileName);
      } else {
        throw new Error(`No data for your business till now.`);
      }
    }
    return response;
}

async function deleteExpiredLeaves(logHandler, payload) {
  await bot.deleteExpiredLeaves(logHandler,payload)
}

async function updateMembersOnLeave(logHandler, payload) {
  await bot.insertBulkMembersOnLeave(logHandler,payload.data)
}

async function getToken(logHandler, payload) {
  const options = {
    url: `${config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS}?business_token=${payload.businessInfo.attendance_token}&full_name=${payload.userInfo.full_name}&email=${payload.userInfo.email}&user_name=fugu${payload.userInfo.user_id}&user_count=${constants.usersCount.USER}`,
    method: 'GET',
    attendance: true
  };
  let apiResult = await utilityService.sendHttpRequest(logHandler, options);
  apiResult = JSON.parse(apiResult);

  if (apiResult.data.user_info[0].role == constants.userRole.USER) {
    throw new Error('Not Authorized');
  } 
  let [userAllInfo] = await userService.getInfo(logHandler, { user_id : payload.userInfo.user_unique_key});

  let token = jwt.sign({
    workspace_id: payload.userInfo.workspace_id,
    fugu_user_id: payload.userInfo.user_id,
    access_token: userAllInfo.access_token
  }, 'secret', { expiresIn: 60 * 60 });
  return { token : token }
}

async function verifyAttendanceToken(logHandler, payload) {
  let decoded = await jwt.verify(payload.token, 'secret')
  if(decoded) {
    let userInfo = await userService.getUserInfo(logHandler, { token : decoded.access_token, user_ids: decoded.fugu_user_id, workspace_id : decoded.workspace_id});

    const [businessInfo] = await workspaceService.getSpaceDetailsById(logHandler, { workspace_id: decoded.workspace_id });

    const options = {
      url: `${config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS}?business_token=${businessInfo.attendance_token}&full_name=${userInfo[0].full_name}&email=${userInfo[0].email}&user_name=fugu${userInfo[0].fugu_user_id}&user_count=${constants.usersCount.USER}`,
      method: 'GET',
      attendance: true
    };
    let apiResult = await utilityService.sendHttpRequest(logHandler, options);
    apiResult = JSON.parse(apiResult);

    if (apiResult.statusCode != 200) {
      throw new Error('User not registered');
    }

    if (apiResult.data.user_info[0].role == constants.userRole.USER) {
      throw new Error('Not Authorized');
    } 

    if(_.isEmpty(userInfo)) {
      throw new Error('Un-authorized');
    } 

    userInfo[0].role = apiResult.data.user_info[0].role;

    return userInfo;
  } else {
    throw new Error("Un-authorized")
  }
}