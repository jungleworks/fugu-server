const saltRounds                    = 10;
const bcrypt                        = require('bcryptjs');
const _                             = require('underscore');
const md5                           = require('MD5');
const Promise                       = require('bluebird');
const config                        = require('config');
const RESP                          = require('../Config').responseMessages;
const constants                     = require('../Utils/constants');
const UniversalFunc                 = require('../Utils/universalFunctions');
const userService                   = require('../services/user');
const attendanceService             = require('../services/attendance');
const utilityService                = require('../services/utility');
const utils                         = require('../Utils/commonFunctions');

exports.signup                   = signup;
exports.changeEmail              = changeEmail;
exports.clockIn                  = clockIn;
exports.clockOut                 = clockOut;
exports.timesheet                = timesheet;
exports.teamPunchStatus          = teamPunchStatus;
exports.getMonthlyReport         = getMonthlyReport;
exports.editUserInfo             = editUserInfo;
exports.getBusinessReport        = getBusinessReport;
exports.leave                    = leave;
exports.changeManagerRequest     = changeManagerRequest;
exports.leaveBalance             = leaveBalance;
exports.editBusinessLeave        = editBusinessLeave;
exports.getBusinessLeaves        = getBusinessLeaves;
exports.editUserLeaves           = editUserLeaves;
exports.getMembers               = getMembers;
exports.editBusinessInfo         = editBusinessInfo;
exports.getBusinessInfo          = getBusinessInfo;
exports.editUserPunchStatus      = editUserPunchStatus;
exports.getUsersWorkTimesheet    = getUsersWorkTimesheet;
exports.autoClockOutUser         = autoClockOutUser;
exports.teamLeaveStatus          = teamLeaveStatus;
exports.uploadDefaultImage       = uploadDefaultImage;
exports.reminderCron             = reminderCron;
exports.createBusiness           = createBusiness;
exports.getMembersOnLeave        = getMembersOnLeave;
exports.autoClockOutUserV1       = autoClockOutUserV1;

function signup(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      payload.email ? payload.email = payload.email.trim().toLowerCase() : 0;

      if(payload.business_token) {
        let getBusinessInfo = yield attendanceService.getBusinessInfo(logHandler, { business_token : payload.business_token });
        if(!_.isEmpty(getBusinessInfo)) {
          yield attendanceService.insertBulkUsers(logHandler, payload.bulk_users, getBusinessInfo[0]);
        }

        for(let data of payload.bulk_users) {
          if(data.manager_user_name) {
            let managerInfo = yield attendanceService.getInfo(logHandler, { user_name : data.manager_user_name });
            if(!_.isEmpty(managerInfo)) {
              yield attendanceService.updateUserInfo(logHandler, { manager_user_id : managerInfo[0].user_id}, { action_user_name : data.user_name });
            }
          }
        }

        insertLeaveBalanceHelper(logHandler, {payload: payload, getBusinessInfo: getBusinessInfo});


      } else {
        let checkIfAlreadyRegister = yield userService.getUserInfo(logHandler, { user_name : payload.user_name });
        if(checkIfAlreadyRegister.length) {
          throw new Error("user already registered.")
        }

        let insertNewUser = {
          email          : payload.email,
          password       : md5(payload.password),
          user_name      : payload.user_name,
          access_token   :  bcrypt.hashSync(payload.email, saltRounds)
        };

       yield userService.insertNew(logHandler, insertNewUser);
      }

      return {};
    })().then(
      (data) => { resolve(data) },
      (error) => { reject(error) }
    );
  });
}

async function insertLeaveBalanceHelper(logHandler, opts) {
  try {

    //To insert initial leave balance.
    let emails    = [];
    let userNames = [];
    opts.payload.bulk_users.forEach( user => {
      emails.push(user.email)
      userNames.push(user.user_name)
    })

    //console.log("insertLeaveBalanceHelper: ", opts, emails, userNames)

    const userData = await attendanceService.getInfo(logHandler, {business_id: opts.getBusinessInfo[0].business_id, emails: [emails], user_names: [userNames]})

    //console.log("insertLeaveBalanceHelper userData: ", userData, {business_id: opts.getBusinessInfo[0].business_id, emails: [emails], user_names: [userNames]})
    let userIds  = userData.map( key => key.user_id);

    const leaveData = await attendanceService.getBusinessLeavesSynonym(logHandler, {business_id: opts.getBusinessInfo[0].business_id, NOT_EQUAL: {annual_count: -1}});``
    //console.log("insertLeaveBalanceHelper leaveData: ", leaveData, {business_id: opts.getBusinessInfo[0].business_id, NOT_EQUAL: {annual_count: -1}})

    let bulkLeaveData = [];
    userIds.forEach( userId => {
      leaveData.forEach(leave => {
        bulkLeaveData.push([userId, leave.leave_type_id, leave.initial_leave_balance])
      })
    })

    //console.log("bulkLeaveData: ", bulkLeaveData)
    await attendanceService.insertBulkLeaveBalance(logHandler, {bulkLeaveData: bulkLeaveData});
  } catch (error) {
      return false;
  }
}

// function clockIn(logHandler, payload, res) {
//   return new Promise((resolve, reject) => {
//     Promise.coroutine(function* () {
//       if(payload.userInfo.status == constants.status.DISABLED) {
//         throw RESP.ERROR.eng.USER_DISABLED;
//       }
//       let errorObj = new Error();

//       let userAttendanceStatus = yield attendanceService.userAttendanceStatus(logHandler, { user_id : payload.userInfo.user_id });

//       if(!_.isEmpty(userAttendanceStatus) && !userAttendanceStatus[0].clocked_out) {
//         errorObj = RESP.ERROR.eng.ALREADY_CLOCKED_IN;
//         throw errorObj;
//       } else {
//         yield attendanceService.attendancePunchIn(logHandler, { user_id : payload.userInfo.user_id });
//       }
//       return {};
//     })().then((data) => {
//       resolve(data);
//     }, (error) => {
//       reject(error);
//     });
//   })
// }


function clockIn(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if(payload.userInfo.status == constants.status.DISABLED) {
        throw RESP.ERROR.eng.USER_DISABLED;
      }

      let userLeaveStatusToday = yield attendanceService.getUserLeaveStatusToday(logHandler, { user_id : payload.userInfo.user_id })
      if(!_.isEmpty(userLeaveStatusToday)){
        if (userLeaveStatusToday[0].leave_phase != constants.vacationType.FULL_DAY) {
          let getLeaveDetails = yield attendanceService.getShiftStatus(logHandler, { user_id : payload.userInfo.user_id});
          if ((userLeaveStatusToday[0].leave_phase == constants.vacationType.FIRST_HALF && getLeaveDetails[0].first_half) || (userLeaveStatusToday[0].leave_phase == constants.vacationType.SECOND_HALF && getLeaveDetails[0].second_half)){
        } else {
            throw ({ message: RESP.ERROR.eng.ON_LEAVE_TODAY.customMessage });
        }
      } else {
        throw ({ message : RESP.ERROR.eng.ON_LEAVE_TODAY.customMessage});
      }
    }

      let userAttendanceStatus = yield attendanceService.userAttendanceStatus(logHandler, { user_id : payload.userInfo.user_id });
      let auth_level ;
      payload.authentication_level ? auth_level = payload.authentication_level : auth_level = JSON.parse(payload.userInfo.config);

      if(!_.isEmpty(userAttendanceStatus) && !userAttendanceStatus[0].clocked_out) {
        throw ({ message : RESP.ERROR.eng.ALREADY_CLOCKED_IN.customMessage});
      } else {
        if(auth_level.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA || auth_level.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH ) {
          if(!payload.image) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 412;
            error.obj.customMessage = "It seems like your business owner has change your attendance configuration, so we have updated it for you. Try to punch in/out again.";
            error.obj.data = { user_attendance_config : auth_level };
            throw error.obj;
          }
          if(!payload.userInfo.auth_user_image_url) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 420;
            error.obj.customMessage =  RESP.ERROR.eng.NO_IMAGE.customMessage;
            error.obj.data={}
            throw error.obj;
          }
          let faceRecognized = yield attendanceService.matchFaces(payload.image,payload.userInfo.auth_user_image_url	);

          if(!faceRecognized.matched) {
            throw RESP.ERROR.eng.FACE_NOT_MATCHED.customMessage
          }
        }
       if(auth_level.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH || auth_level.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION) {
        if(!payload.location) {
          let error = new Error();
          error.obj = {}
          error.obj.statusCode = 412;
          error.obj.customMessage = "It seems like your business owner has change your attendance configuration, so we have updated it for you. Try to punch in/out again.";
          error.obj.data = { user_attendance_config : auth_level };
          throw error.obj;
        }
        let userLocation = yield attendanceService.geoFencingMessage(logHandler, payload);
          if(_.isEmpty(userLocation)) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 460;
            error.obj.customMessage = `Not in area.`;
            error.obj.data = {
              link : `http://www.google.com/maps/place/${payload.location.latitude},${payload.location.longitude}`
            };
            throw error.obj;
          }
        }
      }
      if (payload.in_time && userAttendanceStatus.length && new Date(payload.in_time) < new Date(userAttendanceStatus[0].created_at)) {
        throw ({ message: `Your manager tried approving older punch in request for *${new Date().toDateString()}* which is not possible. Please request for a new one if needed.` });
      }
      yield attendanceService.attendancePunchIn(logHandler, { user_id: payload.userInfo.user_id, in_time: payload.in_time || new Date()});
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}

function clockOut(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      if(payload.userInfo.status == constants.status.DISABLED) {
        throw RESP.ERROR.eng.USER_DISABLED;
      }


      let userAttendanceStatus = yield attendanceService.userAttendanceStatus(logHandler, { user_id : payload.userInfo.user_id });

      if(_.isEmpty(userAttendanceStatus)) {
        throw new Error("You haven't clocked in yet." )
      }

      payload.authentication_level ? auth_level = payload.authentication_level : auth_level = JSON.parse(payload.userInfo.config);
      if(!_.isEmpty(userAttendanceStatus) && userAttendanceStatus[0].clocked_out) {
        throw ({message:RESP.ERROR.eng.ALREADY_CLOCKED_OUT.customMessage})
      } else {
        if(auth_level.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA || auth_level.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH) {

          if(!payload.image) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 412;
            error.obj.customMessage = "It seems like your business owner has change your attendance configuration, so we have updated it for you. Try to punch in/out again.";
            error.obj.data = { user_attendance_config : auth_level };
            throw error.obj;
          }

          if(!payload.userInfo.auth_user_image_url) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 420;
            error.obj.customMessage = RESP.ERROR.eng.NO_IMAGE.customMessage;
            error.obj.data={}
            throw error.obj;
          }
          let faceRecognized = yield attendanceService.matchFaces(payload.image,payload.userInfo.auth_user_image_url	);

          if(!faceRecognized.matched) {
            throw RESP.ERROR.eng.FACE_NOT_MATCHED.customMessage
          };
        }
         if(auth_level.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION  || auth_level.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH) {
          if(!payload.location) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 412;
            error.obj.customMessage = "It seems like your business owner has change your attendance configuration, so we have updated it for you. Try to punch in/out again.";
            error.obj.data = { user_attendance_config : auth_level };
            throw error.obj;
          }
          let userLocation = yield attendanceService.geoFencingMessage(logHandler, payload);
          if(_.isEmpty(userLocation)) {
            let error = new Error();
            error.obj = {}
            error.obj.statusCode = 460;
            error.obj.customMessage = "Not in area.";
            error.obj.data = {
              link: `http://www.google.com/maps/place/${payload.location.latitude},${payload.location.longitude}`
            };
            throw error.obj;
          }
        }
      }
      yield attendanceService.attendancePunchOut(logHandler, { id : userAttendanceStatus[0].id });

    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}
function timesheet(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if(payload.manager_user_name){
        let  userDetail = yield attendanceService.getInfo(logHandler , { user_name :payload.manager_user_name})
         if( payload.userInfo.manager_user_id != userDetail[0].user_id && userDetail[0].role == constants.userRole.USER){
        throw new Error("You don't have access to view timesheet.")
        }
      }
      let result = {};
      result.timesheet = yield attendanceService.attendanceReport(logHandler, { user_id : payload.userInfo.user_id});

      result.last_clocked_in_status =  yield attendanceService.userSpecificDateStatus(logHandler, { user_id : payload.userInfo.user_id });

      result.yesterday_status =  yield attendanceService.userSpecificDateStatus(logHandler, { user_id : payload.userInfo.user_id, yesterday_status : true });

      return result;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}
function teamPunchStatus(logHandler, payload, res){
  return new Promise((resolve, reject) => {
  Promise.coroutine(function* () {
  let membersOnLeave = yield attendanceService.getUserOnLeave(logHandler);
  let user_ids =  membersOnLeave.map(x => x["user_id"]);
  let getTeamPunchStatus = yield attendanceService.getTeamPunchStatus(logHandler, { user_id : payload.userInfo.user_id, user_count: payload.user_count, user_ids: user_ids});

  if(payload.user_count == constants.enumTeamReport.SINGLE_USER) {
    return getTeamPunchStatus;}
  else if((payload.user_count==constants.enumTeamReport.ALL_USER)&&(!_.isEmpty(getTeamPunchStatus))){
    let data={};
    for(let value of getTeamPunchStatus)
    {
      if(data[value.manager_user_name]==null)
      data[value.manager_user_name]=[];
      data[value.manager_user_name].push(value)
    }
  let options ={
      url : config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_ATTENDANCE_BOT,
      method : 'POST',
      json : {
      type : constants.TYPE_OF_MESSAGES_ATTENDANCE_BOT.AUTO_TEAM_REPORT,
      data : data
      }};
      yield utilityService.sendHttpRequest(logHandler, options);

    }
    return {}
})().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}


function teamLeaveStatus(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let getTeamLeaveStatus = yield attendanceService.getTeamLeaveStatus(logHandler);

      if(getTeamLeaveStatus.length)
      {

       let data = {};

       for(let result of getTeamLeaveStatus){
       if(!data[result.business_token]){
         data[result.business_token] = {};
       }
         if(!data[result.business_token][result.manager_user_name]){
           data[result.business_token][result.manager_user_name] =[];
         }
         data[result.business_token][result.manager_user_name].push(result);
       }
      for(let key in data){
        let options = {
          url    : config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_ATTENDANCE_BOT,
          method : 'POST',
          json   : {
            type          : constants.TYPE_OF_MESSAGES_ATTENDANCE_BOT.TEAM_LEAVE_STATUS,
            data          : data[key],
            business_token: key
          }
        };
        utilityService.sendHttpRequest(logHandler, options);
      }
    }
    return;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}


function getMonthlyReport(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      return getMonthlyReport = yield attendanceService.getUserMonthlyReport(logHandler, { user_id : payload.userInfo.user_id});

    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}


function editUserInfo(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let updateObj = {};
      if(payload.manager_user_name) {
        let managerInfo = yield attendanceService.getInfo(logHandler, { user_name : payload.manager_user_name });
        if(!_.isEmpty(managerInfo)) {
          updateObj.manager_user_id = managerInfo[0].user_id
        }
      }

      if(payload.userInfo.role == constants.userRole.USER) {
        let managerInfo = yield userService.getUserInfo(logHandler,{user_name : payload.action_user_name});
        if(managerInfo[0].manager_user_id != payload.userInfo.user_id){
          throw new Error("You are not authorized to perform this action.")
        }
      }

      payload.status || payload.status == 0 ? updateObj.status      = payload.status            : 0;
      payload.shift_start_time      ? updateObj.shift_start_time    = payload.shift_start_time  : 0;
      payload.shift_end_time        ? updateObj.shift_end_time      = payload.shift_end_time    : 0;
      payload.time_zone             ? updateObj.time_zone           = payload.time_zone         : 0;
      payload.employee_id           ? updateObj.employee_id         = payload.employee_id       : 0;
      payload.joining_date          ? updateObj.joining_date        = payload.joining_date      : 0;
      payload.birth_date            ? updateObj.birth_date          = payload.birth_date        : 0;
      payload.work_days             ? updateObj.work_days           = JSON.stringify(payload.work_days)         : 0;
      payload.work_hours            ? updateObj.work_hours          = payload.work_hours        : 0;
      payload.hasOwnProperty('user_punch_image') ? updateObj.auth_user_image_url = payload.user_punch_image : 0;
      payload.config                ? updateObj.config              = JSON.stringify(payload.config) : 0

      if(payload.config){
        let old_config = JSON.parse(payload.businessInfo.config);
        if(old_config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA   && (payload.config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION || payload.config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH)
        || old_config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION && (payload.config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA   || payload.config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH)
        || old_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA   && (payload.config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION || payload.config.punch_out_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH)
        || old_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION && (payload.config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA   || payload.config.punch_out_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH)
        || old_config.punch_in_permission  == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE     &&  payload.config.punch_in_permission  != constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE
        || old_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE     &&  payload.config.punch_out_permission != constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE){
          throw new Error("Invalid Permissions.")
        }
      }

      if(_.isEmpty(updateObj)) {
        throw new Error("Please provide something to update.")
      }

      yield attendanceService.updateUserInfo(logHandler, updateObj, payload);
      return {};

    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}

function getBusinessReport(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let businessInfo = yield attendanceService.getBusinessInfo(logHandler, { business_token : payload.business_token });
      if (payload.userInfo.role == constants.userRole.USER && !payload.start_date ) {
         throw new Error("You don't have access to download business report.")
      }
      if(!_.isEmpty(businessInfo)) {

        let opts = {
          business_id: businessInfo[0].business_id,
          start_date: payload.start_date,
          end_date: payload.end_date ,
          include_deactivated_users: payload.include_deactivated_users
        }


          if(payload.action_user_name) {
            let actionUserInfo = yield attendanceService.getInfo(logHandler, { user_name : payload.action_user_name});
            if(!actionUserInfo.length) {
              throw new Error("User not found.")
            } else {
              opts.user_id = actionUserInfo[0].user_id
            }
          }
        return yield attendanceService.getBusinessReport(logHandler, opts);
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  })
}

async function leave(logHandler, payload) {
  if(payload.userInfo.status == constants.status.DISABLED && (payload.status == constants.leaveStatus.REQUESTED || !payload.status)) {
    throw RESP.ERROR.eng.USER_DISABLED;
  }
  let opts = {};
  opts.leave_start_date     = new Date(payload.leave_start_date)
  opts.user_id              = payload.userInfo.user_id;
  opts.time_zone            = payload.timezone || payload.userInfo.time_zone;
  let userLeaveInfo         = '';
  let checkIfAlreadyApplied = await attendanceService.getUserLeaveStatus(logHandler, payload);

  if(!payload.status) {
    let leave_ids = checkIfAlreadyApplied.map(x => x["id"]);
    return leave_ids;
  }
  if(payload.status == constants.leaveStatus.REQUESTED) {
    let leave_type_id_wfh, leave_type_title;
    let businessLeavesProperties = await attendanceService.getBusinessLeavesSynonym(logHandler, {
      business_id: payload.business_id,
      id         : payload.leave_type_id || 0,
      title      : payload.title || 0
    });
    if(!_.isEmpty(checkIfAlreadyApplied)) {

      for(let properties of businessLeavesProperties) {
        if(properties.synonyms.includes('wfh')) {
          leave_type_id_wfh = properties.leave_type_id;
          leave_type_title  = properties.title;
        }
      }
    }
    if(!_.isEmpty(checkIfAlreadyApplied)) {
      if(!((checkIfAlreadyApplied[0].leave_type_id == leave_type_id_wfh || leave_type_id_wfh == undefined) && payload.message.includes('leave') && payload.title != leave_type_title)) {
        let error               = new Error();
        error.obj               = {}
        error.obj.statusCode    = 450;
        error.obj.customMessage = "Already applied for leaves";
        error.obj.data          = {leave_id: checkIfAlreadyApplied[0].id, status: checkIfAlreadyApplied[0].status};
        throw error.obj;
      }
    }
    let leave_type_id = 0;
    if(!payload.leave_type_id && !payload.title) {
      let message = payload.message.split(" ");
      for(let data of businessLeavesProperties) {
        if(data.synonyms) {
          data.synonyms = JSON.parse(data.synonyms);
          for(let messageString of message) {
            if(data.synonyms.includes(messageString)) {
              leave_type_id                  = data.leave_type_id;
              opts.title                     = data.title;
              opts.is_negative_leave_allowed = data.is_negative_leave_allowed;
              opts.is_clock_in_allowed       = data.is_clock_in_allowed;
              break
            }
          }
          if(leave_type_id) {
            break;
          }
        }
      }
    } else {
      leave_type_id                  = businessLeavesProperties[0].leave_type_id;
      opts.title                     = businessLeavesProperties[0].title;
      opts.is_negative_leave_allowed = businessLeavesProperties[0].is_negative_leave_allowed;
      opts.is_clock_in_allowed       = businessLeavesProperties[0].is_clock_in_allowed;
    }
    if(!payload.requested_leaves) {
      if(payload.leave_end_date) {
        opts.leave_end_date   = payload.leave_end_date;
        opts.requested_leaves = Math.round((new Date(payload.leave_end_date) - opts.leave_start_date) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        opts.requested_leaves = 1;
      }
    } else {
      opts.requested_leaves = payload.requested_leaves;
      if(payload.day_time == constants.vacationType.SECOND_HALF) {
        opts.half_day = `Second half`;
      } else if(payload.day_time == constants.vacationType.FIRST_HALF) {
        opts.half_day = `First half`;
      } else {
        opts.half_day = `Half day`;
      }
    }
    opts.day_time = payload.day_time

    if(!leave_type_id) {
      let userLeaves = await attendanceService.getUserPendingLeaves(logHandler, { user_id: payload.userInfo.user_id, business_id: payload.businessInfo.business_id });
       if(!_.isEmpty(userLeaves)) {
         let leaveArray = []
         for(let data of userLeaves) {
           if(data.count >= opts.requested_leaves || data.is_negative_leave_allowed) {
             leaveArray.push({
               title                    : data.title,
               is_clock_in_allowed      : data.is_clock_in_allowed,
               is_negative_leave_allowed: data.is_negative_leave_allowed,
               leave_type_id            : data.leave_type_id,
               leave_start_date         : opts.leave_start_date,
               leave_end_date           : payload.leave_end_date || 0,
               message                  : payload.message
             });
            }
          }
          if(!_.isEmpty(leaveArray)) {
            if(leaveArray.length == 1) {
              leave_type_id = leaveArray[0].leave_type_id,
              opts.title = leaveArray[0].title
              opts.is_negative_leave_allowed = leaveArray[0].is_negative_leave_allowed
              opts.is_clock_in_allowed       = leaveArray[0].is_clock_in_allowed;
            } else {
              let unknownSynonuym = new Error();
              unknownSynonuym.obj = {}
              unknownSynonuym.obj.statusCode = 458;
              unknownSynonuym.obj.customMessage = "Please try different leave.";
              unknownSynonuym.obj.data = leaveArray;
              throw unknownSynonuym.obj;
            }
          }
        }

      if(!leave_type_id) {
        let unlimitedBusinessLeaves = await attendanceService.getBusinessLeavesSynonym(logHandler, {
          business_id              : payload.business_id,
          is_negative_leave_allowed: true
        });

        let leaveArray = []
          if(_.isEmpty(unlimitedBusinessLeaves)) {
            let notEnoughLeavesError = new Error();
            notEnoughLeavesError.obj = {}
            notEnoughLeavesError.obj.statusCode = 457;
            notEnoughLeavesError.obj.customMessage = "You have exhausted your quota. Please try applying using a different leave type. Type *`Quotas`* to know more.";
            notEnoughLeavesError.obj.data = {};
            throw notEnoughLeavesError.obj;
          } else {
          for(let data of unlimitedBusinessLeaves) {
            leaveArray.push({
              is_negative_leave_allowed: true,
              title                    : data.title,
              leave_type_id            : data.leave_type_id,
              leave_start_date         : opts.leave_start_date,
              leave_end_date           : payload.leave_end_date || 0,
              message                  : payload.message
            });
          }
          if(unlimitedBusinessLeaves.length == 1) {
            leave_type_id                  = unlimitedBusinessLeaves[0].leave_type_id;
            opts.is_negative_leave_allowed = unlimitedBusinessLeaves[0].is_negative_leave_allowed;
            opts.title                     = unlimitedBusinessLeaves[0].title;
            opts.is_clock_in_allowed       = unlimitedBusinessLeaves[0].is_clock_in_allowed;
          } else {
            let unknownSynonuym               = new Error();
            unknownSynonuym.obj               = {}
            unknownSynonuym.obj.statusCode    = 458;
            unknownSynonuym.obj.customMessage = "Please try different leave.";
            unknownSynonuym.obj.data          = leaveArray;
            throw unknownSynonuym.obj;
          }
        }
      }
    }

    let balanceLeaves = await attendanceService.getUserLeaveBalance(logHandler, {
      user_id      : opts.user_id,
      leave_type_id: leave_type_id
    });
    if(_.isEmpty(balanceLeaves)) {
      await attendanceService.insertUserLeaves(logHandler, {user_id: opts.user_id, leave_type_id: leave_type_id});
      opts.count = 0;
      if(!opts.is_negative_leave_allowed) {
        let notEnoughLeavesError               = new Error();
        notEnoughLeavesError.obj               = {}
        notEnoughLeavesError.obj.statusCode    = 457;
        notEnoughLeavesError.obj.customMessage = `You have exhausted your quota for ${opts.title}. Please try applying using a different leave type. Type *'Quotas'* to know more.`;
        notEnoughLeavesError.obj.data          = {};
        throw notEnoughLeavesError.obj;
      }
    } else {
      opts.count = balanceLeaves[0].count;
    }

    if(opts.count < opts.requested_leaves && !opts.is_negative_leave_allowed) {
      let notEnoughLeavesError               = new Error();
      notEnoughLeavesError.obj               = {}
      notEnoughLeavesError.obj.statusCode    = 457;
      notEnoughLeavesError.obj.customMessage = `You have exhausted your quota for ${opts.title}. Please try applying using a different leave type. Type *'Quotas'* to know more.`;
      notEnoughLeavesError.obj.data          = {};
      throw notEnoughLeavesError.obj;
    }

    opts.leave_type_id = leave_type_id;

    let leaveDetails = await attendanceService.insertUserLeaveRequest(logHandler, opts);
    let message      = UniversalFunc.getLeaveDateString(opts);
    return {leave_id: leaveDetails.insertId, message: message};
  } else {
    let updatePayload = {
      leave_id : payload.leave_id,
      status   : payload.status
    }
    if(payload.status == constants.leaveStatus.APPROVED || payload.status == constants.leaveStatus.REJECTED) {
      if(checkIfAlreadyApplied[0].status == constants.leaveStatus.DISMISSED) {
        let error = new Error();
        error.obj = {}
        error.obj.statusCode = 452;
        error.obj.customMessage = "Already cancelled by user.";
        error.obj.data = { leave_id : checkIfAlreadyApplied[0].id, status : checkIfAlreadyApplied[0].status };
        throw error.obj;
      } else {
        updatePayload.approved_by = opts.user_id;
      }
    }

    if(payload.status == constants.leaveStatus.APPROVED || payload.status == constants.leaveStatus.DISMISSED) {
      let leaveDetails = await attendanceService.getLeaveInfo(logHandler, { leave_id: payload.leave_id })

      if (leaveDetails.length) {
        if ((payload.status == constants.leaveStatus.DISMISSED && leaveDetails[0].status != constants.leaveStatus.DISMISSED && !leaveDetails[0].leave_date)) {
          let error = new Error();
          error.obj = {}
          error.obj.statusCode = 408;
          error.obj.customMessage = "Cannot delete leave";
          error.obj.data = {};
          throw error.obj;
        }
        if ((payload.status == constants.leaveStatus.APPROVED && leaveDetails[0].status == constants.leaveStatus.APPROVED) || (payload.status == constants.leaveStatus.DISMISSED && leaveDetails[0].status == constants.leaveStatus.DISMISSED)) {
          let error = new Error();
          error.obj = {}
          error.obj.statusCode = 409;
          error.obj.customMessage = "Already action performed";
          error.obj.data = {};
          throw error.obj;
        }
      }

      await attendanceService.updateUserLeaves(logHandler, { leave_id : payload.leave_id, status : payload.status, current_status: leaveDetails[0].status });
      if (leaveDetails.length && payload.status == constants.leaveStatus.APPROVED) {
        let result = await attendanceService.getUsersOnLeaveDetails(logHandler, { user_id: leaveDetails[0].user_id, leave_type_id: leaveDetails[0].leave_type_id })
        userLeaveInfo = leaveDetails[0]
        userLeaveInfo.user_id = (result[0].user_name).split("fugu")[1]
        if (result[0].is_clock_in_allowed) {
          userLeaveInfo.leave_type = constants.userPresentStatus.WORK_FROM_HOME
        } else {
          userLeaveInfo.leave_type = constants.userPresentStatus.ABSENT
        }
      } else {
        userLeaveInfo = leaveDetails[0];
      }
    }

    if(payload.status == constants.leaveStatus.APPROVED || payload.status == constants.leaveStatus.DISMISSED || payload.status == constants.leaveStatus.REJECTED)
    {
        webhook_type =  constants.webhookEnumLeave[payload.status]

        let webhooks = await attendanceService.getWebhooks(logHandler, { business_id : payload.business_id , webhook_type : webhook_type});
      if(!_.isEmpty(webhooks)){

        let [leaveInfo] = await attendanceService.getLeaveInfo(logHandler, { leave_id : payload.leave_id});

        let options = {
          method : 'POST',
          json   : {
            full_name               :  leaveInfo.full_name,
            user_employee_id        :  leaveInfo.employee_id,
            user_email              :  leaveInfo.email,
            leave_start_date        :  leaveInfo.start_date,
            manager_full_name       :  leaveInfo.manager_full_name,
            manager_email           :  leaveInfo.manager_email,
            manager_employee_id     :  leaveInfo.manager_employee_id,
            type                    :  webhook_type
          }
        };
        if(leaveInfo.days == 0) {
          options.json.leave_type   = constants.vacationType.WORK_FROM_HOME
        }else if(leaveInfo.days == 0.5){
          options.json.leave_type   = constants.vacationType.HALF_DAY
        }else{
          options.json.days         = leaveInfo.days
        }

        for(data of webhooks){
            options.url = data.link;
            try {
              utilityService.sendHttpRequest(logHandler, options);
            } catch (error) {
              console.log("INVALID WEBHOOK ON LEAVE_"+error);
            }
        }
      }
    }
    await attendanceService.updateLeaveStatus(logHandler, updatePayload);
  }
  let hr_roles = await attendanceService.getAdminOrHrInfo(logHandler, { role : constants.userRole.HR, business_id : payload.businessInfo.business_id })
  let responseObject = {
    userInfo: await attendanceService.getInfo(logHandler, { user_id: checkIfAlreadyApplied[0].user_id }),
    leave_status: checkIfAlreadyApplied[0].status,
    leave_day: checkIfAlreadyApplied[0].start_date,
    hr_roles: hr_roles
  };
  (userLeaveInfo) ? responseObject.leaveInfo = userLeaveInfo : 0;
  return responseObject
 }


async function changeManagerRequest(logHandler, payload) {
  let alreadyRequestedForManagerChange = await attendanceService.getChangeManagerRequests(logHandler, { user_id : payload.userInfo.user_id });

  if(!_.isEmpty(alreadyRequestedForManagerChange)) {
    let error = new Error();
    error.obj = {}
    error.obj.statusCode = 453;
    error.obj.customMessage = "Already requested for changing manager.";
    throw error.obj;
  } else {
    let opts = {
      user_id                 : payload.userInfo.user_id,
      current_manager_user_id : payload.userInfo.manager_user_id,
    }

    let newManagerInfo = await attendanceService.getInfo(logHandler, { user_name : payload.manager_user_name});
    if(_.isEmpty(newManagerInfo)) {
      let newUser  = await userService.insertNew(logHandler, { user_name : payload.manager_user_name, full_name : payload.manager_full_name, email :payload.manager_email, business_id : payload.business_id });
      opts.new_manager_user_id = newUser.userId;
    } else {
      opts.new_manager_user_id = newManagerInfo[0].user_id
    }


    let managerRequestDetails = await attendanceService.insertUserChangeManagerRequest(logHandler, opts);
    let hr_roles = await attendanceService.getAdminOrHrInfo(logHandler, { role : constants.userRole.HR, business_id : payload.businessInfo.business_id })

    return { change_manager_request_id : managerRequestDetails.insertId, hr_roles : hr_roles };
  }
}



async function leaveBalance(logHandler, payload) {
  if(payload.userInfo.status == constants.status.DISABLED) {
    throw RESP.ERROR.eng.USER_DISABLED;
  }
  let opts = {
    business_id  : payload.business_id,
    users_count  : payload.users_count,
    user_id      : payload.userInfo.user_id
  }

  let users;

  if(payload.userInfo.role == constants.userRole.USER && opts.users_count != constants.usersCount.USER) {
    users = await attendanceService.getAllUsers(logHandler, { business_id  : payload.business_id, manager_user_id : payload.userInfo.user_id });
    opts.user_ids = users.map(x => x["user_id"]);
  } else {
    actionUserInfo = await attendanceService.getInfo( logHandler, { business_id  : payload.business_id, user_name : payload.user_name } )
    users = await attendanceService.getBusinessAllUsers(logHandler, opts);
    opts.user_ids = users.map(x => x["user_id"]);
    if(users[0].user_id != actionUserInfo[0].user_id && users[0].manager_user_id != actionUserInfo[0].user_id && actionUserInfo[0].role == constants.userRole.USER) {
      throw new Error("You are not authorized to perform this action.")
    }
  }

  let result = await attendanceService.getLeaveBalance(logHandler, opts);

  let userLeaveMap = {};
  let businessDefinedLeaves = [];
  let businessLeavesMap = {};

  for(let data of result) {
    if(!userLeaveMap[data.user_id]) {
      userLeaveMap[data.user_id] = {};
    }
    userLeaveMap[data.user_id][data.id] = data.leave_count;
    if(!businessLeavesMap[data.id]) {
      businessLeavesMap[data.id] = true;
      let leaveObject = {};
      leaveObject.is_negative_leave_allowed = data.is_negative_leave_allowed;
      leaveObject.header = data.title;
      leaveObject.field  = data.id;
      leaveObject.total_count = data.annual_count;
      leaveObject.status = data.status;
      leaveObject.accrual_interval = data.accrual_interval;
      leaveObject.is_negative_leave_allowed = data.is_negative_leave_allowed;
      leaveObject.status = data.status;
      businessDefinedLeaves.push(leaveObject);
    }
  }

  for(let data of users) {
    if(userLeaveMap[data.user_id]) {
      data.leave_balance = userLeaveMap[data.user_id];
    }
    data.work_days = JSON.parse(data.work_days);
    data.config = JSON.parse(data.config);
  }

  let response = {
    user_data       : users,
    business_leaves : businessDefinedLeaves
  }

  if(opts.users_count == constants.usersCount.USER) {
    response.user_leaves_status = await attendanceService.getUserAllLeaves(logHandler, { user_id : opts.user_id });
    response.punchings = await attendanceService.attendanceReport(logHandler, { user_id : payload.userInfo.user_id, start_date : payload.start_date, end_date : payload.end_date });
  }
  return response;
}


async function editBusinessLeave(logHandler, payload) {
  if(payload.userInfo.role == constants.userRole.USER) {
    throw new Error("You are not authorized to perform this action.")
  }
  let businessLeavesSynonym = await attendanceService.getBusinessLeavesSynonym(logHandler, { business_id : payload.business_id, leave_type_id : payload.leave_type_id });
  let updateObj = {};

  if(payload.leave_synonyms){
    if(!_.isEmpty(businessLeavesSynonym)) {
      for(let data of businessLeavesSynonym) {
        if(data.synonyms) {
          let leaveSynonyms = JSON.parse(data.synonyms);
          for(let synonym of payload.leave_synonyms) {
            if(leaveSynonyms.includes(synonym)) {
              let error = new Error();
              error.obj = {}
              error.obj.statusCode = 454;
              error.obj.customMessage = "Synonym already exist.";
              throw error.obj;
            }
          }
        }
      }
    }
    updateObj.synonyms = JSON.stringify(payload.leave_synonyms);
  }

  if(payload.leave_title) {
    if(!_.isEmpty(businessLeavesSynonym)) {
      for(let data of businessLeavesSynonym) {
        if(data.title == payload.leave_title) {
          let error = new Error();
          error.obj = {}
          error.obj.statusCode = 455;
          error.obj.customMessage = "Title already exist.";
          throw error.obj;
        }
      }
    }
    updateObj.title = payload.leave_title;
  }

  if(payload.annual_count) {
    updateObj.annual_count = payload.annual_count ;
    updateObj.is_negative_leave_allowed = payload.is_negative_leave_allowed;
  }

  if(payload.accrual_interval) {
    updateObj.accrual_interval = payload.accrual_interval;
    updateObj.accrual_months = constants.accrualInterval[payload.accrual_interval];
  }

  if(payload.status || payload.status == "0") {
    updateObj.status = payload.status;
  }

  if(payload.max_annual_rollover) {
    updateObj.max_annual_rollover = payload.max_annual_rollover ;
  }

  if(payload.is_clock_in_allowed  || payload.is_clock_in_allowed == "0"){
    updateObj.is_clock_in_allowed = payload.is_clock_in_allowed ;
  }

  if(payload.leave_type_id ) {
    await attendanceService.updateBusinessLeaveProperties(logHandler, { update_fields : updateObj, business_id : payload.business_id,  leave_type_id : payload.leave_type_id });
  } else {
    updateObj.business_id = payload.business_id;
   return await attendanceService.insertBusinessLeaveProperties(logHandler, { insert_fields : updateObj, business_id : payload.business_id });
  }
    return {};
}



async function getBusinessLeaves(logHandler, payload) {
  if(payload.userInfo.role == constants.userRole.USER) {
    throw new Error("You are not authorized to perform this action.")
  }
  let businessLeavesProperties =  await attendanceService.getBusinessLeavesSynonym(logHandler, { business_id : payload.business_id });
  for (let data of businessLeavesProperties) {
    if(data.synonyms) {
      data.synonyms = JSON.parse(data.synonyms);
    }
  }
  return businessLeavesProperties;
}

async function editUserLeaves(logHandler, payload) {

 await attendanceService.insertOrUpdateUserLeaves(logHandler, { user_id : payload.userInfo.user_id, leave_count : payload.leave_count, leave_type_id : payload.leave_type_id });
}



async function getMembers(logHandler, payload) {
  let response = {};
  if(payload.user_count == constants.usersCount.ALL_USERS){
    if(payload.userInfo.role == constants.userRole.USER ) {
      response.all_users_details = await attendanceService.getAllUsers(logHandler, { business_id : payload.business_id, manager_user_id : payload.userInfo.user_id });
    } else {
      response.all_users_details = await attendanceService.getAllUsersFugu(logHandler, { business_id : payload.business_id });
    }
  } else if (payload.user_count) {
    response.user_info = await attendanceService.getInfo(logHandler, { business_id : payload.business_id, user_name : payload.userInfo.user_name });
    if(response.user_info[0].role == constants.userRole.USER) {
      response.all_users_details = await attendanceService.getAllUsers(logHandler, { business_id : payload.business_id, manager_user_id : payload.userInfo.user_id });
      if(response.all_users_details.length > 1) {
        response.user_info[0].role = constants.userRole.MANAGER;
      }
    }
  }
  return response;
}


async function editBusinessInfo(logHandler, payload) {
  if(payload.userInfo.role == constants.userRole.USER){
    throw new Error("You are not authorized to perform this action.")
  }
  let updateObj = {};

  payload.session_start                    ? updateObj.session_start                 = payload.session_start                : 0;
  payload.session_end                      ? updateObj.session_end                   = payload.session_end                  : 0;
  payload.auto_punch_out                   ? updateObj.auto_punch_out                = payload.auto_punch_out               : 0;
  payload.work_days                        ? updateObj.work_days                     = JSON.stringify(payload.work_days)    : 0;
  payload.work_start_time                  ? updateObj.work_start_time               = payload.work_start_time              : 0;
  payload.work_hours                       ? updateObj.work_hours                    = payload.work_hours                   : 0;
  payload.lunch_duration                   ? updateObj.lunch_duration                = payload.lunch_duration               : 0;
  payload.punch_in_reminder_time           ? updateObj.punch_in_reminder_time        = payload.punch_in_reminder_time       : 0;
  payload.punch_out_reminder_time          ? updateObj.punch_out_reminder_time       = payload.punch_out_reminder_time      : 0;

  if(payload.work_days && _.isEmpty(payload.work_days)) {
    updateObj.work_days = null;
  }

  if(_.isEmpty(updateObj) && !payload.config && !payload.hr_roles && !payload.admin_roles && !payload.hr_ids_remove && !payload.admin_ids_remove && !payload.business_area) {
    throw new Error("Please provide something to update.")
  }

  if(payload.work_days) {
    console.log("WORK DAYS CHANGE----------")
    if(payload.businessInfo.work_days == null) {
      await attendanceService.updateBulkUsers(logHandler, { column : "work_days", value : JSON.stringify(payload.work_days), business_id : payload.businessInfo.business_id, previousValue : payload.businessInfo.work_days });
    } else {
      await attendanceService.updateWorkDays(logHandler, { work_days : updateObj.work_days, business_id : payload.businessInfo.business_id });
    }
  }

  if(payload.work_hours   && payload.work_hours != payload.businessInfo.work_hours) {
    console.log("WORK HOURS CHANGE----------")
    await attendanceService.updateBulkUsers(logHandler, { column : "work_hours", value : payload.work_hours, business_id : payload.businessInfo.business_id, previousValue : payload.businessInfo.work_hours });
  }

  if(payload.work_start_time   && payload.work_start_time != payload.businessInfo.work_start_time) {
    console.log("WORK START TIME CHANGE----------")
    await attendanceService.updateBulkUsers(logHandler, { column : "shift_start_time", value : payload.work_start_time, business_id : payload.businessInfo.business_id, previousValue : payload.businessInfo.work_start_time });
  }


  if(payload.config) {
    if(payload.keep_user_data && payload.config.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE && payload.config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE) {
       payload.keep_user_data = false;
    }
    if(!payload.keep_user_data) {
      payload.config                           ? updateObj.config                        = JSON.stringify(payload.config)       : 0;
    }
    await attendanceService.updateUserInfo(logHandler, updateObj, { business_id : payload.business_id, old_config : JSON.parse(payload.businessInfo.config), new_config : payload.config, keep_user_data : payload.keep_user_data});
  }

  payload.config  && !updateObj.config         ? updateObj.config                        = JSON.stringify(payload.config)       : 0;

  if(!_.isEmpty(payload.hr_roles) || !_.isEmpty(payload.admin_roles)) {
    updateObj = {};
    let updateUserName;
    if(!_.isEmpty(payload.hr_roles))
    {
      updateUserName = payload.hr_roles.map(x => x["user_name"]);
      attendanceService.updateUserInfo(logHandler, { role : constants.userRole.HR }, { action_user_name : updateUserName, business_id : payload.business_id });
    }
    if(!_.isEmpty(payload.admin_roles))
    {
      updateUserName = payload.admin_roles.map(x => x["user_name"]);
      attendanceService.updateUserInfo(logHandler, { role : constants.userRole.ADMIN }, { action_user_name : updateUserName, business_id : payload.business_id });
    }
  }

  if(!_.isEmpty(payload.admin_ids_remove)   || !_.isEmpty(payload.hr_ids_remove)) {
    let updateUserId = payload.admin_ids_remove.concat(payload.hr_ids_remove);
    attendanceService.updateUserInfo(logHandler, { role : constants.userRole.USER }, { action_user_id : updateUserId, business_id : payload.business_id });
  }

  if(!_.isEmpty(payload.business_area) || !_.isEmpty(updateObj)) {
   await attendanceService.updateBusinessInfo(logHandler, updateObj, { business_id : payload.business_id, business_area : payload.business_area});
  }
  return {};
}


async function getBusinessInfo(logHandler, payload) {
  if(payload.userInfo.role == constants.userRole.USER) {
    throw new Error("You are not authorized to perform this action.")
  }
  let [result] = await attendanceService.getBusinessInfo( logHandler, { business_id : payload.business_id });
  let admin_roles = await attendanceService.getAdminOrHrInfo( logHandler, {role : constants.userRole.ADMIN, business_id :payload.business_id });
  let hr_roles = await attendanceService.getAdminOrHrInfo( logHandler, {role : constants.userRole.HR, business_id :payload.business_id });
  result.hr_roles = hr_roles;
  result.admin_roles = admin_roles;
  result.admin ? result.admin  = JSON.parse(result.admin) : 0;
  result.work_days ? result.work_days  = JSON.parse(result.work_days) : 0;
  result.config ? result.config  = JSON.parse(result.config) : 0;
  result.business_area ? result.business_area = result.business_area[0] : 0;
  return result;

}


async function editUserPunchStatus(logHandler, payload) {
  let [userAttendanceStatus] = await attendanceService.userAttendanceStatus(logHandler, { user_id : payload.userInfo.user_id, punch_id : payload.punch_id });
  let updateObj = {};
  if(payload.punch_in_time) {
    let last_clocked_in_status = await attendanceService.getUserAttendaceStatus(logHandler, { user_id : userAttendanceStatus.user_id, punch_in_time : new Date(userAttendanceStatus.created_at), punch_id : payload.punch_id });
    if(!_.isEmpty(last_clocked_in_status)) {
      if(!((!userAttendanceStatus.clocked_out || new Date(userAttendanceStatus.clocked_out) > new Date(payload.punch_in_time))  && new Date(last_clocked_in_status[0].clocked_out) < new Date(payload.punch_in_time))) {
        throw new Error("Invalid punch in date")
      }
    }
    updateObj.created_at = payload.punch_in_time;
  }

  if(payload.punch_out_time) {
    let next_clocked_in_status = await attendanceService.getUserAttendaceStatus(logHandler, { user_id : payload.userInfo.user_id, punch_out_time : new Date(userAttendanceStatus.clocked_out), punch_id : payload.punch_id });
    if(!_.isEmpty(next_clocked_in_status)) {
      if(!( new Date(next_clocked_in_status[0].created_at) > new Date(payload.punch_out_time) && (new Date(userAttendanceStatus.created_at) < new Date(payload.punch_out_time) )  )) {
        throw new Error("Invalid Punch out date.")
      }
    } else if(!(new Date(userAttendanceStatus.created_at) < new Date(payload.punch_out_time))) {
      throw new Error("Invalid Punch out date.")
    }
    updateObj.clocked_out = payload.punch_out_time;
  }

  if(_.isEmpty(updateObj)) {
    throw new Error("Please provide something to update.");
  }
  await attendanceService.updateUserPunchStatus(logHandler, updateObj, { id : payload.punch_id });
  return {};
}


async function getUsersWorkTimesheet(logHandler, payload) {
  if(payload.userInfo.role == constants.userRole.USER) {
    throw new Error("You are not authorized to perform this action.")
  }
  let userDataTimesheet = await attendanceService.getUsersWorkTimesheet(logHandler, { business_id : payload.business_id, start_date : payload.start_date, end_date : payload.end_date || new Date(), search_text : payload.search_text, page_start : payload.page_start });

  if(_.isEmpty(userDataTimesheet)) {
    throw new Error("No timesheet found.")
  }
  let userAttendanceMap = {}
  for(let data of userDataTimesheet) {
    if(!userAttendanceMap[data.user_id]) {
      userAttendanceMap[data.user_id] = [];
    }
    userAttendanceMap[data.user_id].push(data)
  }

  let response = []

  _.each(userAttendanceMap, (value, key) => {
    let punchingsObject = {};
    punchingsObject.punchings = value;
    punchingsObject.full_name = value[0].full_name;
    punchingsObject.user_id = value[0].user_id;
    response.push(punchingsObject);
  })

  let allUsers = await attendanceService.getInfo(logHandler, { business_id : payload.businessInfo.business_id });

  return { users_timesheet : response, total_users_count : allUsers.length, page_size : constants.getUsersWorkTimesheet };
}

async function autoClockOutUser(logHandler, payload) {
  let auto_clock_out_users = await attendanceService.getAutoClockOutUsers(logHandler);
  if(!_.isEmpty(auto_clock_out_users)) {
    let user_names = auto_clock_out_users.map(x => x["user_name"]);
    await attendanceService.autoClockOutUser(logHandler, null);

    let options = {
      url    : config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_ATTENDANCE_BOT,
      method : 'POST',
      json   : {
          type       : constants.TYPE_OF_MESSAGES_ATTENDANCE_BOT.AUTO_PUNCH_OUT,
          user_names : user_names
       }
     };
    await utilityService.sendHttpRequest(logHandler, options);
  }
  return {};
}


async function uploadDefaultImage(logHandler, payload) {
  if(utils.isEnv("test")) {
    payload.userInfo.user_id = "test/"+ payload.userInfo.user_id;
  }
  let imageUploaded = await attendanceService.uploadDefaultImage(logHandler, payload.image, payload.userInfo.user_id);

  if(imageUploaded.uploaded) {
    await attendanceService.updateUserInfo(logHandler, { auth_user_image_url : payload.userInfo.user_id + ".jpg" }, { action_user_name : payload.userInfo.user_name})
    return {};
  }else {
    throw(imageUploaded.message)
  }
}

async function createBusiness(logHandler, payload) {
  let opts = {};
  opts.business_token = payload.business_token;
  opts.business_name = payload.business_name;
  opts.time_zone  = payload.time_zone || 0 ;
  opts.config = JSON.stringify({ punch_in_permission : "NONE", punch_out_permission : "NONE" });
  let newBusiness = await attendanceService.insertNewBusiness(logHandler, opts);

  let leaveObject = {
    synonyms : JSON.stringify(["casual"]),
    title    : "Casual",
    business_id : newBusiness.insertId
  }
  return await attendanceService.insertBusinessLeaveProperties(logHandler, { insert_fields : leaveObject, business_id : newBusiness.insertId });

}

async function reminderCron(logHandler, payload) {
  let usersOnleave = await attendanceService.getAllOnLeaveUsers(logHandler)
  let usersOnleaveUserIds = [];
  let business_map = {};
  if(usersOnleave.length) {
    usersOnleaveUserIds = usersOnleave.map(x => x["user_id"]);
  }
  let result = await attendanceService.reminderCron(logHandler, { users_on_leave_user_ids: usersOnleaveUserIds, clock_out: payload.clock_out})

  if (!_.isEmpty(result)) {
    for(let i = 0; i < result.length; i++){
      if(business_map[result[i].business_token]){
        business_map[result[i].business_token].push(result[i].user_name);
      }else{
        business_map[result[i].business_token] = [result[i].user_name];
      }
    }
    for(let key in business_map){
      let options = {
        url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_ATTENDANCE_BOT,
        method: 'POST',
        json: {
          type          : constants.TYPE_OF_MESSAGES_ATTENDANCE_BOT.PUNCH_REMINDER,
          user_names    : business_map[key],
          clock_out     : payload.clock_out || false,
          business_token: key
        }
      };
      payload.clock_out ? options.json.clock_out = payload.clock_out : 0;
       utilityService.sendHttpRequest(logHandler, options);
  }
 }
  return result;
}

async function getMembersOnLeave(logHandler, payload, res) {
  let OnLeaveMembers = await attendanceService.getMembersOnLeaveToday(logHandler);
  if(OnLeaveMembers.length) {

    for (let result of OnLeaveMembers) {
      result.user_id = (result.user_name).split("fugu")[1]
       if (result.is_clock_in_allowed) {
       result.leave_type = constants.userPresentStatus.WORK_FROM_HOME
      } else {
        result.leave_type = constants.userPresentStatus.ABSENT
      }
    }

    await attendanceService.insertBulkMembersOnLeave(logHandler,OnLeaveMembers)
  }
}


async function autoClockOutUserV1(logHandler, payload) {
  let auto_clock_out_users = await attendanceService.getAutoClockOutUsersV1(logHandler);
  let business_map = {};
  if (!_.isEmpty(auto_clock_out_users)) {
    let user_names = auto_clock_out_users.map(x => x["user_name"]);
    for(let i = 0; i < auto_clock_out_users.length; i++){
      if(business_map[auto_clock_out_users[i].business_token]){
        business_map[auto_clock_out_users[i].business_token].push(auto_clock_out_users[i].user_name);
      }else{
        business_map[auto_clock_out_users[i].business_token] = [auto_clock_out_users[i].user_name];
      }
    }
    await attendanceService.autoClockOutUserV1(logHandler, { usernames : user_names});
   for(let key in business_map){
    let options = {
      url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_ATTENDANCE_BOT,
      method: 'POST',
      json: {
        type: constants.TYPE_OF_MESSAGES_ATTENDANCE_BOT.AUTO_PUNCH_OUT,
        user_names: business_map[key],
        business_token: key
      }
    };
     utilityService.sendHttpRequest(logHandler, options);
   }
  }
  return {};
}

function changeEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      yield userService.updateEmail(logHandler, { new_email: payload.new_email, old_email: payload.old_email });
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
