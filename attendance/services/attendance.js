const Promise             = require('bluebird');
const _                   = require('underscore');
const dbHandler           = require('../database').dbHandler;
const constants           = require('../Utils/constants');
const commonFunctions     = require('../Utils/commonFunctions');
const AWS                           = require('aws-sdk')



exports.getBusinessInfo                = getBusinessInfo;
exports.getInfo                        = getInfo;
exports.getAdminOrHrInfo               = getAdminOrHrInfo;
exports.insertNew                      = insertNew;
exports.userAttendanceStatus           = userAttendanceStatus;
exports.attendancePunchIn              = attendancePunchIn;
exports.attendancePunchOut             = attendancePunchOut;
exports.attendanceReport               = attendanceReport;
exports.getTeamPunchStatus             = getTeamPunchStatus;
exports.getUserMonthlyReport           = getUserMonthlyReport;
exports.updateUserInfo                 = updateUserInfo;
exports.insertBulkUsers                = insertBulkUsers;
exports.getBusinessReport              = getBusinessReport;
exports.userSpecificDateStatus         = userSpecificDateStatus;
exports.insertUserLeaves               = insertUserLeaves;
exports.getUserLeaveStatus             = getUserLeaveStatus;
exports.updateLeaveStatus              = updateLeaveStatus;
exports.getUserLeaveBalance            = getUserLeaveBalance;
exports.insertUserLeaveRequest         = insertUserLeaveRequest;
exports.updateUserLeaves               = updateUserLeaves;
exports.getChangeManagerRequests       = getChangeManagerRequests;
exports.insertUserChangeManagerRequest = insertUserChangeManagerRequest;
exports.getLeaveBalance                = getLeaveBalance;
exports.getBusinessAllUsers            = getBusinessAllUsers;
exports.getUserAllLeaves               = getUserAllLeaves;
exports.getBusinessLeavesSynonym       = getBusinessLeavesSynonym;
exports.updateBusinessLeaveProperties  = updateBusinessLeaveProperties;
exports.insertOrUpdateUserLeaves       = insertOrUpdateUserLeaves;
exports.insertBusinessLeaveProperties  = insertBusinessLeaveProperties;
exports.getUserPendingLeaves           = getUserPendingLeaves;
exports.updateBusinessInfo             = updateBusinessInfo;
exports.getUserAttendaceStatus         = getUserAttendaceStatus;
exports.updateUserPunchStatus          = updateUserPunchStatus;
exports.getUsersWorkTimesheet          = getUsersWorkTimesheet;
exports.autoClockOutUser               = autoClockOutUser;
exports.getAllUsers                    = getAllUsers;
exports.getAutoClockOutUsers           = getAutoClockOutUsers;
exports.getTeamLeaveStatus             = getTeamLeaveStatus;
exports.matchFaces                     = matchFaces;
exports.uploadDefaultImage             = uploadDefaultImage;
exports.insertDefaultImageUrl          = insertDefaultImageUrl;
exports.geoFencingMessage              = geoFencingMessage;
exports.getUserLeaveStatusToday        = getUserLeaveStatusToday;
exports.getWebhooks                    = getWebhooks;
exports.getLeaveInfo                   = getLeaveInfo;
exports.reminderCron                   = reminderCron;
exports.insertNewBusiness              = insertNewBusiness;
exports.updateBulkUsers                = updateBulkUsers;
exports.updateWorkDays                 = updateWorkDays;
exports.getUsersOnLeaveDetails         = getUsersOnLeaveDetails;
exports.getMembersOnLeaveToday         = getMembersOnLeaveToday;
exports.insertBulkMembersOnLeave       = insertBulkMembersOnLeave;
exports.getAllUsersFugu                = getAllUsersFugu;
exports.getAutoClockOutUsersV1         = getAutoClockOutUsersV1;
exports.autoClockOutUserV1             = autoClockOutUserV1;
exports.getShiftStatus                 = getShiftStatus;
exports.getAllOnLeaveUsers             = getAllOnLeaveUsers;
exports.getUserOnLeave                 = getUserOnLeave;
exports.insertBulkLeaveBalance         = insertBulkLeaveBalance;

function getBusinessInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    let values = [];

    if(payload.business_id) {
      placeHolder = `  business_id = ?`;
      values = [payload.business_id];
    } else if(payload.business_token) {
      placeHolder = `  business_token = ?`;
      values = [payload.business_token];
    } else {
      placeHolder = ` auto_punch_out is not null`
    }

    let query = `SELECT * FROM business WHERE ${placeHolder}`;

    let queryObj = {
      query : query,
      args  : values,
      event : "savePasswordResetRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfo(logHandler, payload) {
    return new Promise((resolve, reject) => {
      let query = `select * from users where 1=1`;
      let values = [];

      if(payload.business_token) {
        query += " and business_id = ? and user_name = ?";
        values.push(payload.business_id, payload.user_name);
      } else if(payload.auth_id) {
        query += " and auth_id= ? ";
        values.push(commonFunctions.decryptText(payload.auth_id));
      } else if(payload.user_name) {
        query += " and user_name = ?";
        values.push(payload.user_name);
      } else if(payload.user_id) {
        query += " and user_id = ?";
        values.push(payload.user_id);
      }

      if (payload.business_id) {
        query += " AND business_id = ? "
        values.push(payload.business_id);

      }

      if (payload.emails) {
        query += ' AND email IN ? '
        values.push(payload.emails)
      }

      if (payload.user_names) {
        query += ' AND user_name IN ? '
        values.push(payload.user_names)
      }

      let queryObj = {
        query : query,
        args  : values,
        event : "getUserInfo"
      };

      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }


  function insertNew(logHandler, payload) {
    return new Promise((resolve, reject) => {
      let query = "INSERT INTO  users set ? ";
      let userInfo = {
        business_id    : payload.business_id,
        email          : payload.email,
        auth_id        : payload.auth_id || commonFunctions.generateRandomString(),
        password       : payload.password || commonFunctions.generateRandomString(),
        user_name      : payload.user_name || '',
      };
      let queryObj = {
        query : query,
        args  : [userInfo],
        event : "Inserting new user "
      };

      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        userInfo.userId = result.insertId;
        resolve(userInfo);
      }, (error) => {
        reject(error);
      });
    });
  }


function userAttendanceStatus(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];

    if(opts.punch_id) {
      placeHolder = `  id = ?`;
      values.push(opts.punch_id);
    } else {
      placeHolder = `  user_id = ?`;
      values.push(opts.user_id);
    }

    let query = `select * from user_attendance where ${placeHolder} ORDER BY created_at DESC LIMIT 1`;
    let queryObj = {
      query : query,
      args  : values,
      event : "userAttendanceStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function attendancePunchIn(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `INSERT INTO user_attendance (user_id, created_at) VALUES (?,?)`;
    let queryObj = {
      query : query,
      args: [opts.user_id, opts.in_time],
      event : "attendancePunchIn"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function attendancePunchOut(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_attendance SET clocked_out = ? where id = ?`;
    let queryObj = {
      query : query,
      args  : [new Date(), opts.id],
      event : "attendancePunchOut"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function attendanceReport(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.user_id];

    if(payload.start_date) {
      placeHolder = ` AND date(ua.created_at) between date(?) AND (?)`;
      values.push(payload.start_date, payload.end_date);
    } else {
      placeHolder = `  AND DATE(ua.created_at + INTERVAL u.time_zone MINUTE) = DATE(NOW() + INTERVAL u.time_zone MINUTE)`
    }

    let query = `SELECT
                  ua.id,
                  TIMESTAMPDIFF(SECOND,ua.created_at,ua.clocked_out) AS clocked_out_time,
                  TIMESTAMPDIFF(SECOND, ua.created_at, NOW()) AS last_clocked_in,
                  DATE_FORMAT(ua.created_at + INTERVAL u.time_zone MINUTE,"%I:%i %p") AS time_in,
                  DATE_FORMAT(ua.clocked_out + INTERVAL u.time_zone MINUTE,"%I:%i %p") AS time_out,
                  ua.created_at  AS punch_in,
                  ua.clocked_out  AS punch_out,
                  DATE_FORMAT(NOW() + INTERVAL u.time_zone MINUTE,"%W, %b %d %Y") AS today
                  FROM
                  user_attendance ua
                  JOIN users u ON
                  u.user_id = ua.user_id
                  WHERE
                  ua.user_id = ? ${placeHolder} ORDER BY ua.id DESC`;

    let queryObj = {
      query : query,
      args  : values,
      event : "attendancePunchOut"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function getTeamPunchStatus(logHandler, payload) {
return new Promise((resolve, reject) => {
  let placeHolder=''
  let values = [];
  if(payload.user_count == constants.enumTeamReport.ALL_USER){
    placeHolder = ' AND DATE_FORMAT(users.shift_start_time + INTERVAL 2 HOUR,"%k:%i") > DATE_FORMAT(now()- INTERVAL 5 MINUTE,"%k:%i") AND DATE_FORMAT(users.shift_start_time + INTERVAL 2 HOUR,"%k:%i") <= DATE_FORMAT(now(),"%k:%i")'
  }
  else if(payload.user_count == constants.enumTeamReport.SINGLE_USER){
    placeHolder = ' AND u.manager_user_id = ? '
    values.push(payload.user_id);
  }
  if (payload.user_ids.length) {
    placeHolder += ` AND u.user_id NOT IN (?)`
    values.push(payload.user_ids);
  }
  values.push(payload.user_ids);
    let query =
    `SELECT
    distinct(u.user_id),
    u.user_name,
    u.full_name,
    u.manager_user_id muid,
    users.user_name as manager_user_name,
    DATE_FORMAT(ua.created_at + INTERVAL users.time_zone MINUTE,"%I:%i %p") AS clocked_in,
    DATE_FORMAT(ua.created_at + INTERVAL users.time_zone MINUTE,"%I:%i %p") AS time_in,
    DATE_FORMAT(ua.clocked_out + INTERVAL users.time_zone MINUTE,"%I:%i %p") AS time_out
    FROM
    user_attendance ua
    INNER JOIN
    user_last_punchin ulp
    ON
    ua.created_at = ulp.punchin_time
    RIGHT JOIN users u ON
    ua.user_id = u.user_id AND date(ulp.punchin_time)= DATE(NOW()) 
    AND u.status =1
    JOIN users ON
    users.user_id = u.manager_user_id
    WHERE u.status = 1 ${placeHolder} ` ;
    let queryObj = {
      query : query,
      args  : values,
      event : "getTeamPunchStatus"
    };
dbHandler.executeQuery(logHandler, queryObj).then((result) =>
    {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function getTeamLeaveStatus(logHandler) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                  users.business_id,
                  u.full_name,
                  u.user_name,
                  ulr.days,
                  u.manager_user_id,
                  users.user_name manager_user_name,
                  users.full_name manager_full_name,
                  blp.is_clock_in_allowed,
                  b.business_token
              FROM
                  user_leave_requests ulr
              LEFT JOIN 
                  users u ON
                  u.user_id = ulr.user_id
              JOIN business b ON
                 b.business_id = u.business_id    
              JOIN users ON
                  users.user_id = u.manager_user_id
              LEFT JOIN business_leave_properties blp ON   
                 blp.id = ulr.leave_type_id
              WHERE
                  ulr.status= "APPROVED" 
              AND
                  DATE(ulr.start_date + INTERVAL u.time_zone MINUTE) = 
                  DATE(NOW() + INTERVAL u.time_zone MINUTE ) 
              ORDER BY ulr.days`;
    let queryObj = {
      query : query,
      event : "getTeamLeaveStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserMonthlyReport(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
              u.email,
              u.full_name,
              (ua.created_at + INTERVAL u.time_zone MINUTE ) AS timeIn,
              (ua.clocked_out + INTERVAL u.time_zone MINUTE) AS timeOut
          FROM
              user_attendance ua
          JOIN users u ON
              ua.user_id = u.user_id
          WHERE ua.user_id = ? AND MONTH(ua.created_at + INTERVAL u.time_zone MINUTE) = MONTH(now() + INTERVAL u.time_zone MINUTE) AND YEAR(ua.created_at)  = YEAR(NOW()) ORDER BY timeIn DESC`;
    let queryObj = {
      query : query,
      args  : [payload.user_id],
      event : "getUserMonthlyReport"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserInfo(logHandler, updateObj, payload) {
  return new Promise((resolve, reject) => {

    let updateConfig = ``;
    let values = [];
    let setPlceholder = `?`;
    let placeHolder = ``;

    if(!_.isEmpty(updateObj)) {
      values = [updateObj];
    }

    if(payload.action_user_name) {
      placeHolder = ` user_name  IN ( ? )`;
      values.push(payload.action_user_name);
    } else if(payload.action_user_id) {
      placeHolder = ` user_id  IN ( ? )`;
      values.push(payload.action_user_id);
    } else if(payload.business_id) {
      placeHolder = ` business_id = ?`;
      values.push(payload.business_id);
    }

    if(payload.keep_user_data) {
      updateConfig += 'config = CASE ';
      if(payload.new_config.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}' THEN JSON_REPLACE(config,'$.punch_in_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_in_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}') ELSE config END, config = CASE `
      } else if(payload.new_config.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}' THEN JSON_REPLACE(config,'$.punch_in_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_in_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}') ELSE config END, config = CASE `
      } else if(payload.new_config.punch_in_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE && payload.new_config.punch_out_permission != constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}' OR JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}' OR JSON_EXTRACT(config,'$.punch_in_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_in_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') ELSE config END, config = CASE `
      }

      if(payload.new_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}' THEN JSON_REPLACE(config,'$.punch_out_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') WHEN JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_out_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}') ELSE config END, config = CASE `
      } else if(payload.new_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}' THEN JSON_REPLACE(config,'$.punch_out_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') WHEN JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_out_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}') ELSE config END, config = CASE `
      } else if(payload.new_config.punch_out_permission == constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE && payload.new_config.punch_in_permission != constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE) {
        updateConfig += `WHEN JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.CAMERA}' OR JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.LOCATION}' OR JSON_EXTRACT(config,'$.punch_out_permission') = '${constants.ATTENDANCE_AUTHENTICATION_LEVEL.BOTH}' THEN JSON_REPLACE(config,'$.punch_out_permission','${constants.ATTENDANCE_AUTHENTICATION_LEVEL.NONE}') ELSE config END, config = CASE `
      }
        updateConfig +=`WHEN JSON_EXTRACT(config,'$.punch_in_permission') = '${payload.old_config.punch_in_permission}' AND JSON_EXTRACT(config,'$.punch_out_permission') = '${payload.old_config.punch_out_permission}' THEN '${JSON.stringify(payload.new_config)}' ELSE config END`
        setPlceholder = updateConfig;
    }

    let query = `Update users SET ${setPlceholder} where ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "updateUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBulkUsers(logHandler, payload, businessInfo) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeHolders = new Array(payload.length).fill("(?,?,?,?,?,?,?,?,?,?)").join(', ');
    for (let i = 0; i < payload.length; i++) {
      values = values.concat([businessInfo.business_id, payload[i].user_name, payload[i].full_name, payload[i].email, businessInfo.time_zone, businessInfo.config, businessInfo.work_start_time, businessInfo.work_hours, payload[i].role, businessInfo.work_days || null ]);
    }

    let query = `INSERT INTO  users  (business_id, user_name, full_name, email, time_zone, config, shift_start_time, work_hours, role, work_days) VALUES  ${placeHolders} `;

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


function getBusinessReport(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    if(payload.start_date) {
      placeHolder = `DATE_FORMAT(DATE,'%Y-%m-%d') BETWEEN DATE_FORMAT(date('${payload.start_date}'),'%Y-%m-%d') AND DATE_FORMAT(date('${payload.end_date}'),'%Y-%m-%d'))`;
    } else {
      placeHolder = `DATE_FORMAT(DATE,'%Y-%m') = DATE_FORMAT(date(now()),'%Y-%m'))`;
    }

    let userPlaceHolder = ``;
    if(payload.user_id) {
      userPlaceHolder = ` AND user_id = ${payload.user_id}`;
    } else if (!payload.include_deactivated_users){
      userPlaceHolder = ` AND status = 1`
    }
    let query = `SELECT 
    DATE_FORMAT(t1.date,'%d-%m-%Y') as "Date",name as "Name",employee_id as "Employee ID", time(t) as  "shift timing",
    email as "Email",manager_name as "Manager Name", DATE_FORMAT(clocked_in,'%h:%i:%s %p') as "Clocked In",DATE_FORMAT(clocked_out,'%h:%i:%s %p') as "Clocked Out", leave_status as "Leave Status",is_working_day as "Is Working Day" FROM 
    (SELECT date, user_id,manager_user_id, full_name as name, email, employee_id,t FROM dates 
    JOIN 
    (SELECT 
    user_id , full_name ,employee_id, manager_user_id, email , shift_start_time + INTERVAL time_zone minute as t
    FROM users 
    WHERE business_id = ? ${userPlaceHolder}) AS t3 
    WHERE ${placeHolder} AS t1 
    LEFT JOIN 
    (SELECT * FROM 
    (SELECT um.full_name as 'manager_name',um.user_id 
    FROM users um  
    JOIN users u ON um.user_id = u.manager_user_id WHERE u.business_id = ? 
    GROUP BY um.user_id ) as a) AS t5 ON 
    t5.user_id = t1.manager_user_id 
    JOIN 
    (SELECT work_days,business_id,is_working_day,date FROM 
    (SELECT work_days,business_id,d.date, 
    CASE 
    WHEN JSON_CONTAINS(b.work_days, cast(DAYOFWEEK(d.date) - 1 as CHAR(50))) = 1 THEN "YES" 
    ELSE "NO" 
    END 
    AS 'is_working_day' 
    from business b 
    JOIN dates d ON b.business_id = ? ) as a ) AS t6 
    ON t6.date = t1.date 
    LEFT JOIN 
    (SELECT user, clocked_in, clocked_out FROM 
    (SELECT ua.user_id as user, 
    max(ua.clocked_out + INTERVAL u.time_zone MINUTE ) as clocked_out, 
    max(ua.created_at + INTERVAL u.time_zone MINUTE) as clocked_in 
    FROM user_attendance ua 
    JOIN users u ON ua.user_id = u.user_id WHERE u.business_id = ? GROUP by  ua.user_id, ua.created_at) 
    as a) AS t2 ON 
    DATE(t2.clocked_in) = t1.date AND t2.user = t1.user_id 
    LEFT JOIN 
    (SELECT * FROM 
    (SELECT ulr.user_id as userLeave, 
    ulr.days, 
    ulr.start_date, 
    CASE 
    WHEN ulr.status = "REQUESTED" THEN "LEAVE_APPLIED"
    WHEN days >= 1 THEN "ON_LEAVE" 
    WHEN days < 1 THEN "ON_HALF_DAY_LEAVE" 
    WHEN days = 0 THEN "WORKING_FROM_HOME" 
    ELSE null 
    END 
    AS 'leave_status' 
    FROM user_leave_requests ulr 
    JOIN users u ON ulr.user_id = u.user_id AND  ( ulr.status = 'APPROVED' or ulr.status = 'REQUESTED')  WHERE u.business_id = ?
    GROUP BY date(ulr.start_date), u.user_id ) as a) AS t3 ON 
    DATE_FORMAT(t1.date,'%Y-%m-%d') BETWEEN DATE_FORMAT(t3.start_date,'%Y-%m-%d') AND DATE_FORMAT(t3.start_date + INTERVAL days-1 DAY,'%Y-%m-%d') 
    AND t3.userLeave = t1.user_id 
    ORDER by t1.date,name`;
    let queryObj = {
      query : query,
      args : [payload.business_id,payload.business_id,payload.business_id,payload.business_id,payload.business_id],
      event : "getBusinessReport"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function userSpecificDateStatus(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolders = ``;
    if(opts.yesterday_status) {
      placeHolders =  ` AND DATE(ua.created_at +  INTERVAL u.time_zone MINUTE) = DATE(NOW() +  INTERVAL u.time_zone MINUTE -  INTERVAL 1 DAY) `;
    }

    let query = `SELECT 
    ua.id, u.time_zone,
    (ua.created_at + INTERVAL u.time_zone MINUTE) AS clocked_in,
    (ua.clocked_out + INTERVAL u.time_zone MINUTE) AS clocked_out,
    TIMESTAMPDIFF(SECOND,ua.created_at,ua.clocked_out) AS clocked_out_time,
    TIMESTAMPDIFF(SECOND, ua.created_at, NOW()) AS last_clocked_in,
    DATE_FORMAT(ua.created_at + INTERVAL u.time_zone MINUTE,"%I:%i %p") AS time_in,
    DATE_FORMAT(ua.clocked_out + INTERVAL u.time_zone MINUTE,"%I:%i %p") AS time_out,
    DATE_FORMAT(NOW() + INTERVAL u.time_zone MINUTE,"%W, %b %d %Y") AS today 
    FROM users u
     LEFT JOIN user_attendance ua 
     on u.user_id = ua.user_id 
     WHERE
      u.user_id = ? ${placeHolders} ORDER BY ua.created_at DESC LIMIT 1`;
    let queryObj = {
      query : query,
      args  : [opts.user_id],
      event : "userAttendanceStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertUserLeaveRequest(logHandler, opts) {
  return new Promise((resolve, reject) => {
// SAFE SIDE CHECK
    if (opts.day_time == constants.vacationType.SECOND_HALF || opts.day_time == constants.vacationType.FIRST_HALF) {
      console.log(opts.day_time)
    } else {
      opts.day_time = "FULL_DAY"
    }
    let query = `INSERT INTO user_leave_requests (user_id, start_date, days, leave_type_id, leave_phase) values (?,?,?,?,?)`;

    let queryObj = {
      query : query,
      args: [opts.user_id, opts.leave_start_date, opts.requested_leaves, opts.leave_type_id, opts.day_time],
      event : "insertUserLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserLeaveStatus(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolders = ``;
    let values = [];

    if(opts.leave_id) {
      placeHolders = ` id = ?`;
      values = [opts.leave_id];
    } else if (opts.day_time == constants.vacationType.FIRST_HALF || opts.day_time == constants.vacationType.SECOND_HALF) {
      placeHolders = ` user_id = ? AND status IN ("APPROVED","REQUESTED") AND DATE( ? ) = DATE(start_date )`;
      values = [opts.userInfo.user_id, opts.leave_start_date, opts.userInfo.time_zone, opts.leave_start_date, opts.userInfo.time_zone];
    } else if (opts.leave_start_date) {
      placeHolders = ` user_id = ? AND status IN ("APPROVED","REQUESTED") AND DATE( ?) >= DATE(start_date) AND DATE(? ) < DATE(start_date + INTERVAL days DAY)`;
      values = [opts.userInfo.user_id, opts.leave_start_date ,opts.leave_start_date];
    } else if(opts.users_count == constants.usersCount.USER) {
      placeHolders = ` user_id = ? ORDER BY created_at DESC`;
      values.push(opts.user_id);
    } else {
      placeHolders = ` user_id = ? AND status IN("APPROVED", "REQUESTED") AND DATE(start_date) >= DATE(now() + INTERVAL ? MINUTE) `;
      values = [opts.userInfo.user_id, opts.userInfo.time_zone];
    }

    let query = `SELECT
            *
        FROM
            user_leave_requests
        WHERE
            ${placeHolders}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getUserLeaveStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateLeaveStatus(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let updateObj = {
      status : opts.status
    }
    opts.approved_by ? updateObj.approved_by = opts.approved_by : 0;
    let query = `update user_leave_requests set ? where id = ?`;

    let queryObj = {
      query : query,
      args  : [updateObj, opts.leave_id],
      event : "updateLeaveStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserLeaveBalance(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM user_leaves WHERE user_id = ? AND leave_type_id = ?`;

    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.leave_type_id],
      event : "getUserLeaveBalance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserLeaves(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO user_leaves (user_id, leave_type_id) VALUES (?,?) `;

    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.leave_type_id],
      event : "insertUserLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserLeaves(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;

    if(opts.status == constants.leaveStatus.APPROVED) {
      placeHolder = `, ul.count = ul.count - ulr.days `;
    } else if(opts.current_status == constants.leaveStatus.APPROVED && opts.status == constants.leaveStatus.DISMISSED){
      placeHolder = `, ul.count = ul.count + ulr.days `;
    }

    let query = `UPDATE 
          user_leave_requests ulr 
          JOIN user_leaves ul ON 
          ulr.user_id = ul.user_id AND ulr.leave_type_id = ul.leave_type_id
          SET 
          ulr.status = ? ${placeHolder}
          WHERE ulr.id = ?`;

    let queryObj = {
      query : query,
      args  : [opts.status, opts.leave_id],
      event : "updateUserLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getChangeManagerRequests(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM change_manager_request where user_id = ? AND status = "REQUESTED"` ;
    let queryObj = {
      query : query,
      args  : [opts.user_id],
      event : "getChangeManagerRequests"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserChangeManagerRequest(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO change_manager_request (user_id, current_manager_user_id, new_manager_user_id) VALUES (?,?,?)` ;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.current_manager_user_id, opts.new_manager_user_id],
      event : "insertUserChangeManagerRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getLeaveBalance(logHandler, opts) {
  let placeHolders = ``;
  let values = [opts.business_id];
  if(opts.user_ids) {
    placeHolders = ` AND u.user_id IN (?) `;
    values.push(opts.user_ids);
  }

  return new Promise((resolve, reject) => {
    let query = `SELECT
              b.business_id,
              u.user_id,
              u.full_name,
              u.shift_start_time,
              u.work_days,
              u.work_hours,
              b.title,
              b.annual_count,
              b.accrual_interval,
              IFNULL(ul.count, 0) AS leave_count,
              b.status,
              b.id,
              b.is_negative_leave_allowed
          FROM
              business_leave_properties b
          LEFT JOIN users u ON
              b.business_id = u.business_id
          LEFT JOIN user_leaves ul ON
              b.id = ul.leave_type_id AND u.user_id = ul.user_id
          WHERE
              b.business_id = ?  ${placeHolders}` ;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertUserChangeManagerRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessAllUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [opts.business_id];
    if(opts.users_count == constants.usersCount.USER){
      placeHolder = " AND u.user_id = ?";
      values.push(opts.user_id);
    }
    if(opts.manager_user_id){
      placeHolder = " AND mu.user_id = ?";
      values.push(opts.manager_user_id);
    }

    let query = `SELECT
                    u.user_id,
                    u.full_name,
                    mu.full_name as manager_name,
                    u.manager_user_id,
                    u.joining_date,
                    u.birth_date,
                    u.shift_start_time,
                    u.work_hours,
                    u.employee_id,
                    u.work_days,
                    u.user_name,
                    CONCAT("https://${AWSSettings.bucket}.s3.${AWSSettings.region}.amazonaws.com/",u.auth_user_image_url) AS user_punch_image,
                    u.email,
                    u.config
                FROM
                    users u 
             LEFT JOIN users mu ON
                  u.manager_user_id = mu.user_id  
                WHERE
                   u.business_id = ? AND u.status = 1 ${placeHolder}
                ORDER BY
                    u.full_name ASC` ;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertUserChangeManagerRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserAllLeaves(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `
        SELECT 
        ulr.status,
        DATE_FORMAT(ulr.created_at + INTERVAL u.time_zone MINUTE,"%M %d, %Y %I:%i %p") AS applied_at,
        DATE_FORMAT(ulr.start_date + INTERVAL u.time_zone MINUTE,"%m-%d-%Y") AS start_date,
        ulr.days,
        ulr.leave_type_id,
        ulr.user_id
        FROM user_leave_requests ulr JOIN users u ON ulr.user_id = u.user_id WHERE ulr.user_id = ? ORDER BY ulr.created_at DESC` ;
    let queryObj = {
      query : query,
      args  : [opts.user_id],
      event : "insertUserChangeManagerRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getBusinessLeavesSynonym(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    let values = [opts.business_id];


    if(opts.leave_type_id) {
      placeHolder = ` AND id != ?`;
      values.push(opts.leave_type_id);
    } else if (opts.is_negative_leave_allowed) {
      placeHolder = ` AND is_negative_leave_allowed = 1`
    } else if(opts.id) {
      placeHolder = ` AND id = ?`;
      values.push(opts.id);
    } else if (opts.title) {
      placeHolder = ` AND title = ?`;
      values.push(opts.title);
    }

    if (opts.NOT_EQUAL) {
      placeHolder += ' AND annual_count != ? ';
      values.push(opts.NOT_EQUAL.annual_count)
    }

    let query = `SELECT id as leave_type_id, initial_leave_balance, business_id,last_increamented, title , annual_count, accrual_interval, synonyms, max_annual_rollover, status, is_negative_leave_allowed, is_clock_in_allowed FROM business_leave_properties  WHERE business_id = ?  ${placeHolder} and status = 1` ;

    let queryObj = {
      query : query,
      args  : values,
      event : "getBusinessLeavesSynonym"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBusinessLeaveProperties(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE business_leave_properties SET ? WHERE business_id = ? and id = ?` ;
    let queryObj = {
      query : query,
      args  : [opts.update_fields, opts.business_id, opts.leave_type_id],
      event : "updateBusinessLeaveProperties"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertOrUpdateUserLeaves(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `insert into user_leaves (user_id,leave_type_id,count) VALUES (?,?,?) ON DUPLICATE KEY UPDATE count = ?` ;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.leave_type_id,opts.leave_count,opts.leave_count],
      event : "insertOrUpdateUserLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBusinessLeaveProperties(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `INSERT INTO business_leave_properties SET ?` ;
    let queryObj = {
      query : query,
      args  : [opts.insert_fields],
      event : "insertBusinessLeaveProperties"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserPendingLeaves(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
            ul.count,
            blp.title,
            ul.leave_type_id,
            blp.is_negative_leave_allowed,
            blp.is_clock_in_allowed
        FROM
            user_leaves ul
        JOIN business_leave_properties blp ON
            ul.leave_type_id = blp.id
        WHERE
            ul.user_id = ? and blp.business_id = ? and blp.status = 1`;
    let queryObj = {
      query : query,
      args: [opts.user_id, opts.business_id],
      event : "getUserPendingLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBusinessInfo(logHandler, updateObj, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = '?';
    if(payload.business_area) {
      placeHolder += ` , business_area = ST_GEOMFROMTEXT('MULTIPOLYGON((${payload.business_area}))')`
    }
    let query = `Update business set ${placeHolder} where business_id = ?`;
    let queryObj = {
      query : query,
      args  : [updateObj, payload.business_id],
      event : "updateBusinessInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserAttendaceStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.user_id];

    if(payload.punch_in_time) {
      placeHolder = ` AND id < ?  ORDER BY created_at DESC`;
      values.push(payload.punch_id)
    } else {
      placeHolder = ` AND id > ?  ORDER BY created_at ASC`;
      values.push(payload.punch_id);
    }

    let query = `select * from user_attendance where user_id = ? ${placeHolder}  LIMIT 1`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getUserAttendaceStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserPunchStatus(logHandler, updateObj, payload) {
  return new Promise((resolve, reject) => {

    let query = `Update user_attendance set ? where id = ?`;
    let queryObj = {
      query : query,
      args  : [updateObj, payload.id],
      event : "updateUserPunchStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersWorkTimesheet(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    let values = [opts.business_id];

    if(opts.search_text) {
      placeHolder = ` AND full_name like ?`;
      values.push("%"+opts.search_text+"%");
    }
    if(opts.page_start)  {
      placeHolder += ` LIMIT ? , ?`;
      values.push(parseInt(opts.page_start));
      opts.page_end ? values.push(parseInt(opts.page_end - opts.page_start + 1)) : values.push(parseInt(opts.page_start) + constants.getUsersWorkTimesheet - 1);
    }

    values.push(opts.start_date, opts.end_date, opts.business_id);

    let query = `SELECT * FROM 
    (SELECT date, user_id, full_name FROM dates JOIN 
        (SELECT 
            user_id , full_name 
              FROM users 
             WHERE business_id = ? ${placeHolder}) AS t3 
          WHERE DATE BETWEEN ? AND ?) AS t1 
                       LEFT JOIN 
              (SELECT user, clocked_out , clocked_in, work_time,  over_time, (work_time + over_time) as total_work_time FROM 
       (SELECT ua.user_id as user, 
         max(ua.clocked_out) as clocked_out,
         max(ua.created_at) as clocked_in,
        
        SUM( CASE 
            WHEN u.shift_start_time + INTERVAL u.work_hours MINUTE < u.shift_start_time THEN 
              (CASE 
                WHEN ua.clocked_out IS NULL THEN TIMEDIFF(TIME("23:59:59"),TIME(ua.created_at)) 
                WHEN DATE(ua.clocked_out) != DATE(ua.created_at)  THEN TIMEDIFF(TIME("23:59:59"),TIME(ua.created_at)) 
                ELSE TIMEDIFF(ua.clocked_out, ua.created_at) END )
            
            WHEN ua.clocked_out IS NULL THEN TIMEDIFF(TIME(now()),TIME(ua.created_at)) 
           WHEN DATE(ua.clocked_out) != DATE(ua.created_at) THEN TIMEDIFF(TIME("23:59:59"),TIME(ua.created_at)) 
           WHEN TIME(ua.clocked_out) <  u.shift_start_time + INTERVAL u.work_hours MINUTE and DATE(ua.clocked_out) = DATE(ua.created_at) THEN            TIMEDIFF(TIME(ua.clocked_out),TIME(ua.created_at)) 
           ELSE TIMEDIFF( u.shift_start_time + INTERVAL u.work_hours MINUTE, TIME(ua.created_at)) END ) AS work_time, 
        
      SUM( CASE 
      WHEN ua.clocked_out IS null AND time(now()) > time(u.shift_start_time + INTERVAL u.work_hours minute) THEN TIMEDIFF(time(now()), time(u.shift_start_time + INTERVAL u.work_hours minute)) 
      WHEN ua.clocked_out >  u.shift_start_time + INTERVAL u.work_hours MINUTE < u.shift_start_time 
       THEN TIME(ua.clocked_out) - TIME( u.shift_start_time + INTERVAL u.work_hours MINUTE < u.shift_start_time 
      ) 
      ELSE 0 END ) AS over_time 
      FROM user_attendance ua 
      JOIN users u ON ua.user_id = u.user_id WHERE u.business_id = ?
      GROUP BY date(ua.created_at), u.user_id ) as a) AS t2 ON 
      DATE(t2.clocked_in) = t1.date AND t2.user = t1.user_id`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getUsersWorkTimesheet"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function autoClockOutUser(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE
    users ud
JOIN business b ON
    ud.business_id = b.business_id
JOIN user_attendance ua ON
    ud.user_id = ua.user_id
INNER JOIN
 user_last_punchin ulp
ON
    ua.user_id = ulp.user_id AND ua.created_at = ulp.punchin_time
SET
    ua.clocked_out = NOW()
WHERE
    ud.status = 1 AND b.auto_punch_out IS NOT NULL 
    AND ua.clocked_out IS NULL 
    AND ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE   > time(now()) - INTERVAL 5  minute AND ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE < TIME(now())`;
    let queryObj = {
      query : query,
      args  : [],
      event : "autoClockOutUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let placeHolder = '';
    let values = [opts.business_id];
    if(opts.manager_user_id) {
      placeHolder = ' AND u.manager_user_id = ? or u.user_id = ? ';
      values.push(opts.manager_user_id, opts.manager_user_id);
    }

    let query = `SELECT
                   u.full_name,
                   m.full_name AS manager_name,
                   u.user_name,
                   u.user_id,
                   u.status, 
                   u.email,
                   u.work_days,
                   u.employee_id,
                   u.config,
                   u.joining_date,
                   u.birth_date,
                   CONCAT("https://${AWSSettings.bucket}.s3.${AWSSettings.region}.amazonaws.com/",u.auth_user_image_url) AS user_punch_image
               FROM
                   users u
              LEFT JOIN users m ON
                   u.manager_user_id = m.user_id
               WHERE
                   u.business_id = ? AND u.status = 1 ${placeHolder} ORDER BY full_name  ASC`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getAllUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAutoClockOutUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT ud.user_name, ud.user_id FROM
               users ud
           JOIN business b ON
               ud.business_id = b.business_id
           JOIN user_attendance ua ON
               ud.user_id = ua.user_id
           INNER JOIN  user_last_punchin ulp
            ON
            ua.user_id = ulp.user_id AND ua.created_at = ulp.punchin_time
           WHERE
               ud.status = 1 AND b.auto_punch_out IS NOT NULL 
               AND ua.clocked_out IS NULL 
               AND ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE   > time(now()) - INTERVAL 5 minute AND ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE < TIME(now())`;
    let queryObj = {
      query : query,
      args  : [],
      event : "getAutoClockOutUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertDefaultImageUrl(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = "UPDATE users set aws_bucket_url= ?  where user_id = ?";
    let values =[payload+".jpg" , payload]
    let queryObj = {
      query : query,
      args  : values,
      event : "Inserting default image url"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function geoFencingMessage(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
              user_name,
              user_id
          FROM
              users u
          JOIN business b ON
              u.business_id = b.business_id
          WHERE
              CONTAINS(
                  b.business_area,
                  POINT(?,?)) AND u.user_id = ?`
    let queryObj = {
      query : query,
      args  : [opts.location.latitude, opts.location.longitude, opts.userInfo.user_id],
      event : "getAutoClockOutUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function matchFaces(image,bucketUrl) {
  return new Promise((resolve, reject) => {
    if (AWSSettings.accessKey && AWSSettings.secretKey) {
      AWS.config.update({
        region: AWSSettings.region,
        accessKeyId: AWSSettings.accessKey,
        secretAccessKey: AWSSettings.secretKey
      });
    } else {
      AWS.config.update({
        region: AWSSettings.region
      });
    }
    const bufferOne = new Buffer.from(image, 'base64')

    let rekognition = new AWS.Rekognition();
    let params = {
      SimilarityThreshold: 80,
      SourceImage:
      {
        S3Object: {
          Bucket: AWSSettings.bucket,
          Name: bucketUrl
        }
      },
      TargetImage: {
          Bytes : bufferOne
      }
    };
    rekognition.compareFaces(params, function (err, data) {
      if(err) {
        if(err.code=="InvalidParameterException") {
          reject({message:"No Face Detected in Given Image"})
        } else {
          reject(err)
        }
      }
      else {
        if(data.FaceMatches.length>0) {
          resolve({"matched":true})
        } else {
          reject({message:"Cannot Recognize You",data:{"matched":false}})
        }
      }
    });
  });
}

function uploadDefaultImage(logHandler,image,bucketUrl) {
  return new Promise((resolve, reject) => {
    if (AWSSettings.accessKey && AWSSettings.secretKey) {
      AWS.config.update({
        region: AWSSettings.region,
        accessKeyId: AWSSettings.accessKey,
        secretAccessKey: AWSSettings.secretKey
      });
    } else {
      AWS.config.update({
        region: AWSSettings.region
      });
    }
        const bufferOne = new Buffer.from(image, 'base64')

        let rekognition = new AWS.Rekognition();
          var params = {
            Image: {
              Bytes : bufferOne
            }
           };
           rekognition.detectFaces(params, function(err, data) {
             if (err)    reject(err)
             else {
                if(data.FaceDetails.length == 1) {
                  var s3 = new AWS.S3()
                  var params = {
                  Bucket: AWSSettings.bucket,
                  Key :bucketUrl+".jpg",
                  Body: bufferOne,
                  ACL: 'public-read'
                };
                s3.putObject(params, function (err, pres) {
                  if (err) {
                    reject(err)
                  } else {
                    resolve({ uploaded : true})
                  }
                  });
               }
               else {
                reject({message :"Please click an image that shows your face clearly."})
               }
             }
           });
  });
}

function getUserLeaveStatusToday(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
    user_id,
    leave_phase
    FROM
    user_leave_requests LEFT JOIN business_leave_properties on user_leave_requests.leave_type_id=business_leave_properties.id
    WHERE user_leave_requests.status = "APPROVED" AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days - 1 DAY)  AND user_id = ?   AND is_clock_in_allowed = 0`;
    let queryObj = {
      query : query,
      args  : payload.user_id,
      event : "getUserLeaveStatusToday"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWebhooks(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [opts.business_id , opts.webhook_type];

    let sql = `SELECT *
          FROM
              webhooks 
          WHERE
              business_id = ?
          AND 
              type = ?    `;
    let queryObj = {
      query : sql,
      args  : values,
      event : "updateUserLeaves"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getLeaveInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT ulr.start_date ,ulr.user_id , ulr.leave_type_id ,
     ulr.id, ulr.days,
      u.employee_id,
      u.full_name,
      u.email , 
      date(ulr.start_date) >= date(now()) as leave_date,
      ulr.status,
      um.full_name manager_full_name,
      um.email manager_email, um.employee_id manager_employee_id
    FROM 
      users u 
    JOIN 
      user_leave_requests ulr	
    ON 
      u.user_id = ulr.user_id
    JOIN 
      users um  
    ON
      um.user_id = u.manager_user_id 
    WHERE 
      ulr.id = ?`;

    let queryObj = {
      query : query,
      args  : payload.leave_id,
      event : "getLeaveInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function reminderCron(logHandler,opts) {
  return new Promise((resolve, reject) => {
    let values= []
    let placeHolder = ``;
    let punchPlaceHolder = ``;
    let reminderPlaceHolder = ``;
    if (!opts.clock_out) {
      placeHolder = ` NOT`;
      punchPlaceHolder = `  b.punch_in_reminder_time IS NOT NULL AND `;
      reminderPlaceHolder = `  - INTERVAL b.punch_in_reminder_time MINUTE`;
    } else {
      punchPlaceHolder = `  b.punch_out_reminder_time IS NOT NULL AND `;
      reminderPlaceHolder = `+ INTERVAL u.work_hours MINUTE - INTERVAL b.punch_out_reminder_time MINUTE`;
    }

    let userLeavePlaceHolder = ``;
    if (opts.users_on_leave_user_ids.length) {
      userLeavePlaceHolder = ` AND u.user_id not IN (?)`
      values.push(opts.users_on_leave_user_ids)
    }

    let query = `SELECT
    u.user_name,
    ua.clocked_out,
    u.full_name,
    b.business_token
    FROM
    user_attendance ua
    JOIN users u ON
    ua.user_id = u.user_id ${userLeavePlaceHolder}
    JOIN business b
    ON u.business_id = b.business_id
    INNER JOIN 
     user_last_punchin ulp
    ON
    ua.user_id = ulp.user_id AND ua.created_at = ulp.punchin_time
    WHERE ${punchPlaceHolder}
    u.status = 1 AND
    JSON_CONTAINS(u.work_days, cast(DAYOFWEEK(now()) -1 as CHAR(50))) AND
    ua.clocked_out IS ${placeHolder} NULL AND
     DATE_FORMAT(u.shift_start_time ${reminderPlaceHolder}, "%k:%i") > DATE_FORMAT(now()- INTERVAL 5 MINUTE,"%k:%i") AND
      DATE_FORMAT(u.shift_start_time ${reminderPlaceHolder}, "%k:%i") <= DATE_FORMAT(now(),"%k:%i")
    GROUP BY
    u.user_name`
    let queryObj = {
      query: query,
      args: values,
      event: "reminderCron"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertNewBusiness(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `INSERT INTO business SET ?`;
    let queryObj = {
      query : query,
      args  : [opts],
      event : "insertNewBusiness"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAdminOrHrInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select email, user_id, full_name, user_name from users where 1=1 and business_id = ? and role = ? `;
    let values = [payload.business_id, payload.role];

    let queryObj = {
      query : query,
      args  : values,
      event : "getAdminOrHrInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBulkUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let equalPlaceHolder = ""
    if(payload.previousValue == null) {
      equalPlaceHolder = " IS NULL";
    } else {
      equalPlaceHolder = " = ?";
    }

    let query = `UPDATE users SET ${payload.column} =  ? where business_id = ? AND ${payload.column} ${equalPlaceHolder} `;
    let queryObj = {
      query : query,
      args  :  [payload.value, payload.business_id, payload.previousValue],
      event : "updateBulkUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateWorkDays(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE
               users u
           JOIN business b ON
               u.business_id = b.business_id AND u.work_days = b.work_days
           SET
               u.work_days = ?
           WHERE
               u.business_id = ?`;
    let queryObj = {
      query : query,
      args  :  [payload.work_days, payload.business_id],
      event : "updateWorkDays"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getMembersOnLeaveToday(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
    u.business_id,
    u.full_name,
    u.user_name,
    ulr.days,
    blp.title,
    ulr.start_date,
    ulr.leave_type_id,
    ulr.id,
    blp.is_clock_in_allowed,
    u.manager_user_id
FROM
    user_leave_requests ulr
LEFT JOIN 
    users u ON
    u.user_id = ulr.user_id 
LEFT JOIN
	business_leave_properties blp ON
    blp.id = ulr.leave_type_id
  WHERE ulr.status = "APPROVED" AND DATE(NOW()) <= DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1`;
    let queryObj = {
      query: query,
      args: [],
      event: "updateWorkDays"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersOnLeaveDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
    u.business_id,
      u.full_name,
      u.user_name,
      u.manager_user_id,
      blp.is_clock_in_allowed 
  FROM
  (SELECT is_clock_in_allowed FROM business_leave_properties WHERE id = ? ) blp ,
      users u where user_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.leave_type_id, payload.user_id],
      event: "updateWorkDays"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBulkMembersOnLeave(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeHolders = new Array(opts.length).fill("(?,?,?,?,?)").join(', ');
    for (let data of opts) {
      values = values.concat([data.id, data.user_id, data.start_date, data.days, data.leave_type]);
    }
    let databaseName = commonFunctions.isEnv("test") ? `fugu_chat_test` : `office_chat_prod`;
    let sql = `INSERT INTO ${databaseName}.user_present_day_status ( leave_id , fugu_user_id , start_date , days , leave_type ) VALUES  ${placeHolders}`;

    let queryObj = {
      query: sql,
      args: values,
      event: "updateUserOnAttendance"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getAllUsersFugu(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `fugu_chat_test` : `office_chat_prod`;

    let query = `SELECT
                   u.full_name,
                   m.full_name AS manager_name,
                   u.user_name,
                   u.user_id,
                   u.status, 
                   u.email,
                   u.work_days,
                   u.config,
                   u.joining_date,
                   u.birth_date
               FROM
                   users u
              LEFT JOIN users m ON
                   u.manager_user_id = m.user_id
                   LEFT JOIN ${databaseName}.user_to_workspace utw
                   ON u.user_name = concat("fugu",utw.user_id)
               WHERE
                   u.business_id = ? AND utw.status = "ENABLED"  ORDER BY u.full_name  ASC`;
    let queryObj = {
      query: query,
      args: [opts.business_id],
      event: "getAllUsersFugu"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getAutoClockOutUsersV1(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT ud.user_name, ud.user_id ,b.business_token,
            (case WHEn ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE > time("23:59:59") THEN
            ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE - INTERVAL 1439 MINUTE
                    ELSE ud.shift_start_time + INTERVAL ud.work_hours MINUTE + INTERVAL b.auto_punch_out MINUTE

            END ) as times
            FROM
            users ud
            JOIN business b ON
            ud.business_id = b.business_id
            JOIN user_attendance ua ON
            ud.user_id = ua.user_id
            INNER JOIN
            user_last_punchin ulp
            ON
            ua.user_id = ulp.user_id AND ua.created_at = ulp.punchin_time
            WHERE
            ud.status = 1 AND b.auto_punch_out IS NOT NULL
            AND ua.clocked_out IS NULL
            having times > time(now()) - INTERVAL 5 minute AND times < TIME(now())`;
    let queryObj = {
      query: query,
      args: [],
      event: "getAutoClockOutUsersV1"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function autoClockOutUserV1(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE
    users ud
JOIN business b ON
    ud.business_id = b.business_id
JOIN user_attendance ua ON
    ud.user_id = ua.user_id
INNER JOIN
  user_last_punchin ulp
ON
    ua.user_id = ulp.user_id AND ua.created_at = ulp.punchin_time
SET
    ua.clocked_out = NOW()
WHERE
    ud.status = 1 AND b.auto_punch_out IS NOT NULL 
    AND ua.clocked_out IS NULL 
    AND ud.user_name IN (?)`;
    let queryObj = {
      query: query,
      args: [opts.usernames],
      event: "autoClockOutUserV1"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getShiftStatus(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
                TIME(shift_start_time) + INTERVAL work_hours / 2 MINUTE <= TIME(NOW()) AS first_half,
                TIME(shift_start_time) + INTERVAL work_hours / 2 MINUTE >= TIME(NOW()) AS second_half
            FROM
                users
            WHERE
                user_id = ?`;
    let queryObj = {
      query: query,
      args: [opts.user_id],
      event: "getShiftStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getAllOnLeaveUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `SELECT user_id 
    FROM 
    user_leave_requests 
    JOIN
     business_leave_properties on 
     user_leave_requests.leave_type_id=business_leave_properties.id 
     WHERE user_leave_requests.status = "APPROVED" 
     AND DATE(NOW()) BETWEEN DATE(start_date) 
     AND DATE(start_date + INTERVAL days - 1 DAY) 
     AND is_clock_in_allowed = 0 
     AND user_leave_requests.leave_phase != "SECOND_HALF"
`;
    let queryObj = {
      query: query,
      args: [],
      event: "getAllOnLeaveUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserOnLeave(logHandler){
   return new Promise((resolve, reject)=>{
     let sql =
       `SELECT
          user_id
        FROM
          user_leave_requests ulr
        JOIN 
          business_leave_properties blp
        ON
          ulr.leave_type_id = blp.id
        WHERE
         ulr.status = "APPROVED" AND blp.is_clock_in_allowed = 0 AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1`;

    let queryObj = {
      query: sql,
      args: [],
      event: "getAllOnLeaveUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
   })
}

function insertBulkLeaveBalance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = "INSERT INTO  user_leaves (user_id, leave_type_id, count) VALUES ? ";

    if (!payload || !payload.bulkLeaveData || !payload.bulkLeaveData .length) {
        return reject("Invalid arguments")
    }

    let queryObj = {
      query : query,
      args  : [payload.bulkLeaveData],
      event : "insertBulkLeaveBalance "
    };

    //console.log("insertBulkLeaveBalance queryObj: ", queryObj)
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
