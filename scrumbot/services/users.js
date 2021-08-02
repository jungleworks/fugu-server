/**
 * Created by Humanshi on 18/6/19.
 */

const Promise = require('bluebird');
const md5 = require('MD5');
const _ = require('underscore');
const dbHandler = require('../database').dbHandler;
const logger = require('../Routes/logging');
const constants = require('../Utils/constants');
//const sendEmail                     = require('../Notification/email').sendEmailToUser;
const userService = require('./users.js');
//const commonFunctions               = require('../Utils/commonFunctions');
//const utilityService                = require('./utility');


exports.insertNew = insertNew;
exports.insertScrumQuestions = insertScrumQuestions;
exports.getScrumAnswers = getScrumAnswers;
exports.insertNewBusiness = insertNewBusiness;
exports.getBusinessInfo = getBusinessInfo;
exports.insertBulkUsers = insertBulkUsers;
exports.updateUserInfo = updateUserInfo;
exports.getInfo = getInfo;
exports.checkActiveScrums = checkActiveScrums;
exports.getQuestions = getQuestions;
exports.getInfoByUserId = getInfoByUserId;
exports.getUserNameQusetionMapping = getUserNameQusetionMapping;
exports.insertUserAnswer = insertUserAnswer;
exports.getScrumIdByUserName = getScrumIdByUserName;
exports.getQuestionId = getQuestionId;
exports.getScrumDetails = getScrumDetails;
exports.updateScrumDetails = updateScrumDetails;
exports.getUserData = getUserData;
exports.updateQusetion = updateQusetion;
exports.publishQuestion = publishQuestion;
exports.getScrumId = getScrumId;
exports.checkUserAvailability = checkUserAvailability;
exports.getUserIds = getUserIds;
exports.getFuguUserId = getFuguUserId;
exports.checkEndingScrums = checkEndingScrums;
exports.updateScrumNextDate = updateScrumNextDate;
exports.getPresentWeekScrum = getPresentWeekScrum;
exports.updateNewScrumNextDate = updateNewScrumNextDate;
exports.checkNonREcurrentScrums = checkNonREcurrentScrums;
exports.justEndedScrums = justEndedScrums;
exports.insertRunNowTime = insertRunNowTime;
exports.insertRunTime = insertRunTime;
exports.runNowScrumTimmings = runNowScrumTimmings;
exports.checkIfUserAnsweredAllQuestions = checkIfUserAnsweredAllQuestions;
exports.getQuestionCount = getQuestionCount;
exports.checkIfUserAlreadyAnsweredQuestion = checkIfUserAlreadyAnsweredQuestion;
exports.checkIfUserAlreadyPresentInRunningScrum = checkIfUserAlreadyPresentInRunningScrum;
exports.getBusinessToken = getBusinessToken;


function getBusinessToken(logHandler,payload){
  return new Promise((resolve, reject) => {

    let query = `SELECT * FROM business WHERE  business_id = ? `;

    let queryObj = {
      query: query,
      args: [payload.business_id],
      event: "savePasswordResetRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function checkIfUserAlreadyPresentInRunningScrum(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ''
    for (let index in payload.respondants) {
      if (index == 0) {
        placeHolder += `JSON_CONTAINS(respondants,'${payload.respondants[index]}')`
      } else {
        placeHolder += `OR JSON_CONTAINS(respondants,'${payload.respondants[index]}')`
      }
    }
    let query = ` SELECT scrum_id FROM scrum_details WHERE (${placeHolder}) and scrum_status = "RUNNING"`
    let queryObj = {
      query: query,
      args: [payload.scrum_id, payload.user_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function checkIfUserAnsweredAllQuestions(logHandler, payload) {
  return new Promise((resolve, reject) => {

    payload.run_now_id = (payload.run_now_id) ? (payload.run_now_id) : 0;
    let query = `SELECT COUNT(*) as count FROM  (SELECT answer FROM answer WHERE question_id in ( SELECT question_id FROM question WHERE scrum_id = ?) AND scrum_user_id = ? AND date(created_at) = date(now()) AND run_now_id = ?) as sub`
    let queryObj = {
      query: query,
      args: [payload.scrum_id, payload.user_id, payload.run_now_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function checkIfUserAlreadyAnsweredQuestion(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT answer FROM answer WHERE scrum_user_id = ? AND question_id = ? AND run_now_id = ? AND date(created_at)=date(now())`
    let queryObj = {
      query: query,
      args: [payload.scrum_user_id, payload.question_id, payload.run_now_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function getQuestionCount(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT COUNT(*) as count FROM (SELECT question_id FROM question WHERE scrum_id = ?) as question`
    let queryObj = {
      query: query,
      args: [payload.scrum_id, payload.user_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function runNowScrumTimmings(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT scrum_details.scrum_time,scrum_details.end_time_reminder,run_now_time,DATE_FORMAT( run_now_time + INTERVAL scrum_time MINUTE ,"%Y-%m-%dT%TZ") as scrum_end_time ,
    DATE_FORMAT( run_now_time + INTERVAL scrum_time MINUTE - INTERVAL end_time_reminder MINUTE ,"%Y-%m-%dT%TZ") as scrum_end_text_time FROM run_now_timings
LEFT JOIN scrum_details ON scrum_details.scrum_id = run_now_timings.scrum_id 
WHERE date(run_now_timings.created_at) = date(now()) AND run_now_timings.scrum_id = ? ORDER BY run_now_timings.created_at DESC LIMIT 1 `;

    let queryObj = {
      query: query,
      args: [payload.scrum_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function insertRunTime(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `INSERT INTO run_now_timings ( scrum_id , run_now_time ) VALUES  (?,?)`;

    let queryObj = {
      query: query,
      args: [payload.scrum_id, payload.date],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function checkNonREcurrentScrums(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT scrum_details.*, DATE_FORMAT( start_time  , "%Y-%m-%dT%TZ") as start_ISO_time,
    DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE  ,"%Y-%m-%dT%TZ") as scrum_end_time ,
   DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE - INTERVAL end_time_reminder MINUTE  ,"%Y-%m-%dT%TZ") as scrum_end_text_time FROM scrum_details 
   WHERE (scrum_status = "RUNNING" AND frequency = 0) OR ((week(next_scrum_date) = week(now()) || week(start_day) = week(now()) ) AND date(now()) >= start_day AND date(now()) <= next_scrum_date 
   AND JSON_CONTAINS(active_days, cast(DAYOFWEEK(now()) as CHAR(50))) AND 
  DATE_FORMAT( start_time , "%k:%i") <= DATE_FORMAT( now()  ,"%k:%i") AND
  DATE_FORMAT(cast(now() as time )  ,"%k:%i") <= DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%k:%i") AND frequency = 0) AND scrum_status IN ('ACTIVE','RUNNING')`;

    let values = [];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertRunNowTime(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE scrum_details  
    SET     run_now_time =  CASE  
    WHEN run_now_time = null THEN '["${payload.date}"]'
    ELSE JSON_ARRAY_APPEND(run_now_time, '$', now())
    END 
    WHERE scrum_id = 130`;

    let queryObj = {
      query: query,
      args: [payload.scrum_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function updateScrumNextDate(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE scrum_details SET next_scrum_date =
    DATE_ADD( next_scrum_date , INTERVAL (1-DAYOFWEEK(next_scrum_date) + 7*frequency)  DAY) WHERE scrum_id IN (?)`;

    let queryObj = {
      query: query,
      args: [payload.scrum_ids],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateNewScrumNextDate(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE scrum_details SET next_scrum_date = CASE frequency
    WHEN  0 THEN
    DATE_ADD( start_day , INTERVAL 7  DAY)
    ELSE
    DATE_ADD( start_day , INTERVAL (1-DAYOFWEEK(start_day) + 7*frequency)  DAY)
    END where scrum_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.scrum_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getPresentWeekScrum(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT * FROM scrum_details  WHERE week(next_scrum_date) = week(now()) AND frequency > 0 `;

    let queryObj = {
      query: query,
      args: [payload.scrum_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}





function checkEndingScrums(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT 
    DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE - INTERVAL end_time_reminder MINUTE  ,"%Y-%m-%dT%TZ") as time , scrum_details.*
      FROM scrum_details WHERE  (week(next_scrum_date) = week(now())  || week(start_day) = week(now()))
     AND JSON_CONTAINS(active_days, cast(DAYOFWEEK(now()) as CHAR(50))) AND end_time_reminder != 0`;

    let queryObj = {
      query: query,
      args: [payload.userIds],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getFuguUserId(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` select user_id from users where scrum_user_id in (?) and status = 1`;

    let queryObj = {
      query: query,
      args: [payload.userIds],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserIds(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` select scrum_user_id from users where user_id in (?)`;

    let queryObj = {
      query: query,
      args: [payload.user_names],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}







function publishQuestion(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT question.question , question.question_position ,question.question_id
     FROM question JOIN ( SELECT * FROM question WHERE question_id = ? ) as sub
    ON question.scrum_id = sub.scrum_id AND question.question_status = 1 AND question.question_position = sub.question_position + 1`;

    let queryObj = {
      query: query,
      args: [payload.question_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function checkUserAvailability(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = '';
    if (!payload.active_days) {
      throw new Error("Please provide active days")
    }
    for (let index in payload.active_days) {
      if (index == 0) {
        placeHolder += `JSON_CONTAINS(active_days,'${payload.active_days[index]}')`
      } else {
        placeHolder += `OR JSON_CONTAINS(active_days,'${payload.active_days[index]}')`
      }
    }

    let query = `SELECT * FROM scrum_details WHERE  ? >= start_time AND cast('${payload.start_time}' AS time) <= (start_time + INTERVAL scrum_time MINUTE) AND JSON_CONTAINS(respondants , '${payload.userId}' )
    AND (${placeHolder})  AND scrum_status IN ('ACTIVE','RUNNING')`;

    let queryObj = {
      query: query,
      args: [payload.start_time, payload.start_time],
      event: "insertQuestionIntoTable"
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
    let query = "INSERT  INTO scrum_details set ? ";
    let scrumDetails = {
      business_id: payload.business_id,
      manager_user_id: payload.manager_user_id,
      start_day: payload.start_day,
      time_zone: payload.time_zone,
      start_time: payload.start_time,
      active_days: payload.active_days,
      frequency: payload.frequency,
      respondants: payload.respondants,
      welcome_message: payload.welcome_message,
      scrum_time: payload.scrum_time,
      end_time_reminder: payload.end_time_reminder,
      delivering_result_to_users: payload.delivering_result_to_users,
      delivering_result_to_channels: payload.delivering_result_to_channels,
      end_time_text: payload.end_time_text,
      scrum_name: payload.scrum_name,
      next_scrum_date: payload.start_day
    };

    let queryObj = {
      query: query,
      args: [scrumDetails],
      event: "Inserting new workspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      payload.scrum_id = result.insertId;
      resolve(payload);
    }, (error) => {
      reject(error);
    });
  });
}


function insertScrumQuestions(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeHolders = new Array(payload.questions.length).fill("( ? , ? , ?)").join(', ');
    for (let i = 0; i < payload.questions.length; i++) {
      values = values.concat([payload.scrum_id, payload.questions[i].question, payload.questions[i].pos]);
    }

    let query = `INSERT IGNORE INTO question ( scrum_id , question ,question_position) VALUES  ${placeHolders} `;

    let queryObj = {
      query: query,
      args: values,
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getScrumAnswers(logHandler, payload) {
  return new Promise((resolve, reject) => {

    payload.run_now_id = (payload.run_now_id) ? payload.run_now_id : 0;
    let query = ` SELECT user_id,sub.* FROM users JOIN 
    (SELECT * FROM answer WHERE question_id in (?) AND DATE(created_at) = DATE( now()) and run_now_id = ${payload.run_now_id}) as sub
    ON sub.scrum_user_id = users.scrum_user_id 
     `;

    let queryObj = {
      query: query,
      args: [payload.question_ids],
      event: "insertQuestionIntoTable"
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
      query: query,
      args: [opts],
      event: "insertNewBusiness"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT * FROM business WHERE  business_token = ? `;

    let queryObj = {
      query: query,
      args: [payload.business_token],
      event: "savePasswordResetRequest"
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
    let placeHolders = new Array(payload.length).fill("(?,?,?,?,?)").join(', ');
    for (let i = 0; i < payload.length; i++) {
      payload[i].user_name = payload[i].user_name.split("fugu")[1]
      values = values.concat([businessInfo.business_id, payload[i].user_name, payload[i].full_name, payload[i].email, payload[i].role]);
    }

    let query = `INSERT INTO  users  (business_id, user_id, full_name, email, role) VALUES  ${placeHolders} `;

    let queryObj = {
      query: query,
      args: values,
      event: "insertUserToMessage"
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

    let query = `Update users SET manager_user_id = ? where user_id = ?`;
    let queryObj = {
      query: query,
      args: [updateObj.manager_user_id, payload.user_name],
      event: "updateUserInfo"
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
    let query = `select * from users where user_id in (?)`;
    let values = [payload.user_name];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function checkActiveScrums(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT scrum_details.*, DATE_FORMAT( start_time   , "%Y-%m-%dT%TZ") as start_ISO_time ,
    DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%Y-%m-%dT%TZ") as scrum_end_time ,
    DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE - INTERVAL end_time_reminder MINUTE  ,"%Y-%m-%dT%TZ") as scrum_end_text_time 
    FROM scrum_details 
    WHERE (scrum_status = "RUNNING" AND frequency > 0) OR (( week(next_scrum_date) = week(now()) || week(start_day) = week(now()) ) 
    AND JSON_CONTAINS(active_days, cast(DAYOFWEEK(now()) as CHAR(50))) AND 
   DATE_FORMAT( start_time , "%k:%i")  <= DATE_FORMAT( now()  ,"%k:%i") AND
   DATE_FORMAT(cast(now() as time )  ,"%k:%i") <= DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%k:%i") AND frequency > 0) AND scrum_status IN ('ACTIVE','RUNNING')`;

    let values = [];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function getUserData(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `  SELECT scrum_user_id,manager_user_id,full_name,email,user_id,role FROM users where user_id >=1 `;
    let values = [];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}





function getQuestions(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` select * from question where scrum_id in (?) and question_status = 1 ORDER BY question_position`;
    let values = [payload.scrum_ids];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoByUserId(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select * from users where scrum_user_id in (?)`;
    let values = [payload.user_ids];

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserNameQusetionMapping(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT user_id,scrum_user_id,sub.question , sub.question_id  FROM users 
    JOIN
     ( SELECT question_id, question.scrum_id,manager_user_id,question 
      FROM question 
      LEFT JOIN 
      scrum_details 
      ON question.scrum_id = scrum_details.scrum_id ) sub 
      ON sub.manager_user_id = users.scrum_user_id `;
    let values = [];

    let queryObj = {
      query: query,
      args: [],
      event: "getUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function getScrumIdByUserName(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT scrum_id,sub.scrum_user_id 
    FROM scrum_details 
    JOIN 
     (SELECT scrum_user_id,user_id,IFNULL(manager_user_id,scrum_user_id) as manager_user_id FROM users WHERE user_id = ?) sub
      ON sub.manager_user_id = scrum_details.manager_user_id
    `;

    let queryObj = {
      query: query,
      args: [payload.user_name],
      event: "insertQuestionIntoTable"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function insertUserAnswer(logHandler, payload) {
  return new Promise((resolve, reject) => {

    payload.run_now_id = (payload.run_now_id) ? payload.run_now_id : 0;

    let query = `INSERT INTO answer (  scrum_user_id , answer , question_id ,run_now_id ) VALUES  (?,?,?,?) `;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.answer, payload.question_id, payload.run_now_id],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getQuestionId(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT question_id , question FROM question JOIN (SELECT scrum_id,sub.scrum_user_id 
      FROM scrum_details 
      JOIN 
      (SELECT scrum_user_id,user_id,IFNULL(manager_user_id,scrum_user_id) as manager_user_id FROM users WHERE user_id = ?) sub
      ON sub.manager_user_id = scrum_details.manager_user_id) scrum_details on question.scrum_id = scrum_details.scrum_id AND
      question = ?
    `;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.question],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getScrumId(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Select * from question where question_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.question_id],
      event: "insertQuestionIntoTable"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

// SELECT question,scrum_details.* FROM question
//     JOIN (SELECT * FROM scrum_details
//     JOIN (SELECT user_id FROM users WHERE user_name = ? )
//     AS sub on sub.user_id = scrum_details.manager_user_id) AS scrum_details ON question.scrum_id = scrum_details.scrum_id


function getScrumDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT * FROM scrum_details  `;
    let values = []

    if (payload.user_name) {
      query += `JOIN (SELECT scrum_user_id FROM users WHERE user_id = ? ) AS sub on sub.scrum_user_id = scrum_details.manager_user_id and`
      values = [payload.user_name]
    }
    if (payload.scrum_id) {
      query += `where scrum_id = ? and`
      values = [payload.scrum_id]
    }
    if (!payload.scrum_id && !payload.user_name) {
      query += 'where'
    }

    query += `  scrum_status IN ('ACTIVE','PAUSED','RUNNING') `

    if( payload.business_id ){
      query+= `AND business_id = ${payload.business_id}`
    }

    let queryObj = {
      query: query,
      args: values,
      event: "insertQuestionIntoTable"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateScrumDetails(logHandler, updateObj, payload) {
  return new Promise((resolve, reject) => {

    let query = `Update scrum_details set ? where scrum_id = ?`;
    let queryObj = {
      query: query,
      args: [updateObj, payload.scrum_id],
      event: "updateScrumInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateQusetion(logHandler, updateObj, payload) {
  return new Promise((resolve, reject) => {

    let query = `Update question set ? where question_id = ?`;
    let queryObj = {
      query: query,
      args: [updateObj, payload.question_id],
      event: "updateScrumInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function justEndedScrums(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT 
    DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%Y-%m-%dT%TZ") as time , scrum_details.*
      FROM scrum_details WHERE ( week(next_scrum_date) = week(now()) || week(start_day) = week(now()))
     AND JSON_CONTAINS(active_days, cast(DAYOFWEEK(now()) as CHAR(50))) AND end_time_reminder != 0
     AND 
     DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%k:%i") > DATE_FORMAT(now()- INTERVAL 2 MINUTE,"%k:%i") AND DATE_FORMAT( start_time + INTERVAL scrum_time MINUTE ,"%k:%i") <= DATE_FORMAT(now(),"%k:%i")
     UNION
     SELECT
     DATE_FORMAT( rnt.date + INTERVAL scrum_time MINUTE ,"%Y-%m-%dT%TZ") as time , scrum_details.*
     FROM scrum_details 
     LEFT JOIN run_now_timings rnt ON scrum_details.scrum_id=rnt.scrum_id 
     WHERE 
     DATE_FORMAT(rnt.date + INTERVAL scrum_time MINUTE ,"%k:%i") > DATE_FORMAT(now()- INTERVAL 2 MINUTE,"%k:%i") AND DATE_FORMAT(rnt.date + INTERVAL scrum_time MINUTE ,"%k:%i") <= DATE_FORMAT(now(),"%k:%i")`;

    let queryObj = {
      query: query,
      args: [payload.userIds],
      event: "insertQuestionIntoTable"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
