const saltRounds = 10;
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const _ = require('underscore');
const md5 = require('MD5');
const Promise = require('bluebird');
const moment = require('moment');
const async = require('async');
const cache = require('memory-cache');
const config = require('config');
const RESP = require('../Config/responseMessages');
const db = require('../database');
const logger = require('../Routes/logging');
const constants = require('../Utils/constants');
const UniversalFunc = require('../Utils/universalFunctions');
const workspaceService = require('../services/users');
const userService = require('../services/users.js');

const utilityService = require('../services/utility');
const { exec } = require('child_process');


exports.createNewScrum = createNewScrum;
exports.createBusiness = createBusiness;
exports.insertNewUser = insertNewUser;
exports.scrumCron = scrumCron;
exports.insertUserAnswers = insertUserAnswers;
exports.getScrumDetails = getScrumDetails;
exports.editScrumDetails = editScrumDetails;
exports.publishScrumAnswers = publishScrumAnswers;
exports.checkUserAvailability = checkUserAvailability;
exports.checkIfUserAnsweredAllQuestions = checkIfUserAnsweredAllQuestions;

async function checkIfUserAnsweredAllQuestions(logHandler, payload) {
  let userIds = []
  let totalQuestion = await userService.getQuestionCount(logHandler, { scrum_id: payload.scrum_id })
  let scrumDetails = await userService.getScrumDetails(logHandler, { scrum_id: payload.scrum_id })
  for (let user of payload.respondants) {
    let result = await userService.checkIfUserAnsweredAllQuestions(logHandler, { scrum_id: payload.scrum_id, user_id: user, run_now_id: scrumDetails[0].run_now_id })
    if (!(result[0].count == totalQuestion[0].count)) {
      userIds.push(user)
    }
  }
  return userIds
}




async function checkUserAvailability(logHandler, payload) {
  let userArray = [];
  let userData = await userService.getUserData(logHandler, payload);

  let userDetails = {}
  for (userInfo of userData) {
    userDetails[userInfo.user_id] = userInfo.scrum_user_id
  }
  for (let userId of payload.user_name) {
    payload.userId = userDetails[userId]
    let userAlreadyInAnotherScrum = await userService.checkUserAvailability(logHandler, payload)
    if (userAlreadyInAnotherScrum.length) {
      let userData = await userService.getInfo(logHandler, { user_name: userId })
      userData = userData[0];
      if (payload.scrum_id) {
        if (!(payload.scrum_id == userAlreadyInAnotherScrum[0].scrum_id)) {
          userArray.push(userData);
        }
      } else {
        userArray.push(userData);
      }
    }
  }
  return userArray;
}



async function createNewScrum(logHandler, payload) {

  let business_id = await userService.getBusinessInfo(logHandler, { business_token: payload.business_token });
  let manager_user_id = await userService.getInfo(logHandler, { user_name: payload.manager_fugu_user_id });
  if (manager_user_id.length) {
    payload.manager_user_id = manager_user_id[0].scrum_user_id;
    payload.business_id = business_id[0].business_id;
    payload.active_days = JSON.stringify(payload.active_days);
    payload.delivering_result_to_channels = JSON.stringify(payload.delivering_result_to_channels);
    let delivering_result_to_users =[]

    if(!_.isEmpty(payload.delivering_result_to_users)){
    delivering_result_to_users = await userService.getUserIds(logHandler, { user_names: payload.delivering_result_to_users })
    delivering_result_to_users = delivering_result_to_users.map(x => x["scrum_user_id"])
    }

    payload.delivering_result_to_users = JSON.stringify(delivering_result_to_users);

    let respondants = await userService.getUserIds(logHandler, { user_names: payload.respondants })
    respondants = respondants.map(x => x["scrum_user_id"])

    payload.respondants = JSON.stringify(respondants);

    let scrumDetails = await userService.insertNew(logHandler, payload);
    payload.scrum_id = scrumDetails.scrum_id;
    payload.newScrum = true;
    await userService.updateNewScrumNextDate(logHandler, payload)
    await userService.insertScrumQuestions(logHandler, payload);

    return scrumDetails;
  }
}


async function getScrumDetails(logHandler, payload) {
  let obj = {}
  let business_id = await userService.getBusinessInfo(logHandler, { business_token: payload.business_token });
  if (payload.user_name) {
    if (payload.role == "USER")
      obj.user_name = payload.user_name;
  } else if (payload.scrum_id) {
    obj.scrum_id = payload.scrum_id;
  };
  obj.business_id = business_id[0].business_id;
  let scrumDetails = await userService.getScrumDetails(logHandler, obj);
  if (scrumDetails.length) {
    let scrumIds = scrumDetails.map(x => x["scrum_id"]);
    let questions = await userService.getQuestions(logHandler, { scrum_ids: scrumIds });

    let scrumIdQuestionMapping = {}
    for (let question of questions) {
      if (!scrumIdQuestionMapping[question.scrum_id])
        scrumIdQuestionMapping[question.scrum_id] = [];
      let obj = {}
      obj.id = question.question_id;
      obj.question = question.question;
      obj.pos = question.question_position;
      scrumIdQuestionMapping[question.scrum_id].push(obj);
    }
    let userData = await userService.getUserData(logHandler, payload);

    let userDetails = {}
    for (userInfo of userData) {
      userDetails[userInfo.scrum_user_id] = userInfo
    }

    for (scrum of scrumDetails) {
      scrum['questions'] = scrumIdQuestionMapping[scrum.scrum_id];
      (scrum.active_days) ? scrum.active_days = JSON.parse(scrum.active_days) : 0;
      (scrum.delivering_result_to_channels) ? scrum.delivering_result_to_channels = JSON.parse(scrum.delivering_result_to_channels) : 0;
      if (scrum.delivering_result_to_users) {
        scrum.delivering_result_to_users = JSON.parse(scrum.delivering_result_to_users)
        let data = [];
        for (let users of scrum.delivering_result_to_users) {
          if (userDetails[users])
            data.push(userDetails[users])
        }
        scrum.delivering_result_to_users = data
      }
      if (scrum.respondants) {
        scrum.respondants = JSON.parse(scrum.respondants)
        let data = [];
        for (let users of scrum.respondants) {
          if (userDetails[users])
            data.push(userDetails[users])
        }
        scrum.respondants = data
      }
      scrum.start_day = moment(scrum.start_day).format('YYYY-MM-DD');
      scrum.manager_user_id = userDetails[scrum.manager_user_id]
    }
    return scrumDetails;
  }
  else {
    throw RESP.SUCCESS.USER_DATA_NOT_FOUND
  }
}


async function createBusiness(logHandler, payload) {
  let opts = {};
  opts.time_zone = payload.time_zone || 0;
  opts.business_token = payload.business_token;
  opts.business_name = payload.business_name;
  await userService.insertNewBusiness(logHandler, opts);
  return {}
}



async function insertNewUser(logHandler, payload) {
  payload.email ? payload.email = payload.email.trim().toLowerCase() : 0;
  if (payload.business_token) {
    let getBusinessInfo = await userService.getBusinessInfo(logHandler, { business_token: payload.business_token });
    if (!_.isEmpty(getBusinessInfo)) {
      await userService.insertBulkUsers(logHandler, payload.bulk_users, getBusinessInfo[0]);
    }
    for (let data of payload.bulk_users) {
      if (data.manager_user_name) {
        let managerInfo = await userService.getInfo(logHandler, { user_name: data.manager_user_name.split('fugu')[1] });
        if (!_.isEmpty(managerInfo)) {
          let y = await userService.updateUserInfo(logHandler, { manager_user_id: managerInfo[0].user_id }, { user_name: data.user_name });
        }
      }
    }
  }
  return {};
}


async function publishQuestion(logHandler, payload) {
  let scrumDetails = await userService.getScrumDetails(logHandler, { scrum_id: payload.scrum_id })
  let questionDetails = await userService.publishQuestion(logHandler, { question_id: payload.question_id })
  if (questionDetails.length) {
    let options = {
      url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_SCRUM_BOT,
      method: 'POST',
      json: {
        user_names: [payload.user_id],
        type: constants.scrumBot.PUBLISH_SCRUM_QUESTION,
        data: {
          "id": questionDetails[0].question_id,
          "question": questionDetails[0].question
        },
        scrum_name: scrumDetails[0].scrum_name
      }
    };
    let output = await utilityService.sendHttpRequest(logHandler, options);
  }
}

async function insertUserAnswers(logHandler, payload) {

  payload.question = payload.question.replace(/[*]/g, "")
  let scrumId = await userService.getScrumId(logHandler, payload)
  let userData = await userService.getInfo(logHandler, payload)

  let scrumDetails = await userService.getScrumDetails(logHandler, { scrum_id: scrumId[0].scrum_id })
  let obj = { scrum_id: scrumId[0].scrum_id, user_id: userData[0].scrum_user_id, answer: payload.message, question_id: payload.question_id }
  if (scrumDetails[0].run_now_id) {
    obj.run_now_id = scrumDetails[0].run_now_id
  }

  let result = await userService.checkIfUserAlreadyAnsweredQuestion(logHandler, { scrum_user_id: userData[0].scrum_user_id, question_id: payload.question_id })
  if (result.length) {
    return {}
  }


  await userService.insertUserAnswer(logHandler, obj)
  publishQuestion(logHandler, { scrum_id: scrumId[0].scrum_id, question_id: payload.question_id, user_id: payload.user_name })

}

async function publishScrumQuestions(logHandler, scrum) {
  console.log("@@@@@@@!!!!!!!!!!!!!###############PUBLISH_QUESTION_CALLED",scrum)
  scrum.respondants = JSON.parse(scrum.respondants)
  if (scrum.scrum_status == "RUNNING") {
    return {}
  }
  await userService.updateScrumDetails(logHandler, { scrum_status: "RUNNING" }, { scrum_id: scrum.scrum_id });
  let userIds = await userService.getFuguUserId(logHandler, { userIds: scrum.respondants })
  userIds = userIds.map(x => x["user_id"]);
  let questionDetails = await userService.getQuestions(logHandler, { scrum_ids: scrum.scrum_id })
  let options = {
    url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_SCRUM_BOT,
    method: 'POST',
    json: {
      user_names: userIds,
      type: constants.scrumBot.PUBLISH_SCRUM_QUESTION,
      data: {
        "id": questionDetails[0].question_id,
        "question": questionDetails[0].question,
        "welcome_message": scrum.welcome_message,
        "scrum_name": scrum.scrum_name
      }
    }
  };
  await utilityService.sendHttpRequest(logHandler, options);
}

async function publishScrumEndTimeText(logHandler, scrum) {
  scrum.respondants = JSON.parse(scrum.respondants)
  let notAnsweredUserIds = await checkIfUserAnsweredAllQuestions(logHandler, { respondants: scrum.respondants, scrum_id: scrum.scrum_id })
  if (notAnsweredUserIds.length) {
    let userIds = await userService.getFuguUserId(logHandler, { userIds: notAnsweredUserIds })
    userIds = userIds.map(x => x["user_id"]);
    let options = {
      url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_SCRUM_BOT,
      method: 'POST',
      json: {
        user_names: userIds,
        type: constants.scrumBot.PUBLISH_END_TIME_TEXT,
        data: {
          "end_time_text": scrum.end_time_text
        }
      }
    };
    await utilityService.sendHttpRequest(logHandler, options);
  }
}

async function publishScrumAnswersOnFugu(logHandler, scrum) {
  scrum.respondants = JSON.parse(scrum.respondants)
  await userService.updateScrumDetails(logHandler, { scrum_status: "ACTIVE" }, { scrum_id: scrum.scrum_id });
  await publishScrumAnswers(logHandler, scrum)
}



async function scrumCron(logHandler, payload) {
  if (payload.scrum_id) {
    console.log("<<<<<<<@@@@@@@@@@@@@@@######INSIDE_RUN_NOW",payload.scrum_id);
    let scrumDetails = await userService.getScrumDetails(logHandler, payload)
    if (!_.isEmpty(scrumDetails)) {
      scrumDetails = scrumDetails[0];
      if (scrumDetails.scrum_status == "RUNNING") {
        throw new Error("Scrum is Already Running")
      }
      let date = moment(Date.now()).format('HH:mm')
      let result = await userService.checkIfUserAlreadyPresentInRunningScrum(logHandler, {
        respondants: JSON.parse(scrumDetails.respondants)
      })
      if (!_.isEmpty(result)) {
        throw new Error("Members of scrum are already part of some other scrums at the same time.")
      }
      let run_now_id = await userService.insertRunTime(logHandler, { scrum_id: payload.scrum_id, date: date })
      await userService.updateScrumDetails(logHandler, { run_now_id: run_now_id.insertId }, { scrum_id: payload.scrum_id })
      scrum_status = scrumDetails.scrum_status
     await publishScrumQuestions(logHandler, scrumDetails)
    } else {
      throw new Error("Scrum id not valid")
    }
    return { scrum_status: scrum_status }
  }

  let scrumDetails = await userService.checkActiveScrums(logHandler, payload)
  let checkNonREcurrentScrums = await userService.checkNonREcurrentScrums(logHandler, payload)
  let startTime = moment(new Date()).subtract('1', "minutes");
  startTime = moment(startTime).format('HH:mm');
  let endTime = moment(new Date()).add('1', 'minutes');
  endTime = moment(endTime).format('HH:mm')

  console.log("<<CURRENT TIME : ", moment(new Date()).format("HH:mm"), "START TIME : ", startTime, "END TIME:", endTime  )

  if (scrumDetails.length) {
    for (scrum of scrumDetails) {
      console.log("<<CURRENT TIME : ", moment(new Date()).format("HH:mm"), "START TIME : ", startTime, "END TIME:", endTime , "start iso time" , moment(new Date(scrum.start_ISO_time)).format("HH:mm") , "end_text_time " , moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') , "end_timeeeeeeee" , moment(new Date(scrum.scrum_end_time)).format('HH:mm') )
      if (moment(new Date(scrum.start_ISO_time)).format("HH:mm") > startTime && moment(new Date(scrum.start_ISO_time)).format("HH:mm") < endTime) {
        console.log("<<<START_TIME_CPMPARISON", moment(new Date(scrum.start_ISO_time)).format("HH:mm") > startTime && moment(new Date(scrum.start_ISO_time)).format("HH:mm") < endTime)
        await publishScrumQuestions(logHandler, scrum)
      }
      if (moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') < endTime) {
        if (scrum.end_time_text){
          console.log("<<<<<<<<<END_TEXT_TIME_COMPARISON", moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') < endTime)
          await publishScrumEndTimeText(logHandler, scrum)
        }
      }
      if (moment(new Date(scrum.scrum_end_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_time)).format('HH:mm') < endTime) {
        console.log(">>>>>>>>>>>>ANSWER_TIME_COMPARISION",moment(new Date(scrum.scrum_end_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_time)).format('HH:mm') < endTime)
          await publishScrumAnswersOnFugu(logHandler, scrum)
      }
      let runNowScrumTimming = await userService.runNowScrumTimmings(logHandler, { scrum_id: scrum.scrum_id })
      if (runNowScrumTimming.length) {
        if (moment(new Date(runNowScrumTimming[0].scrum_end_text_time)).format('HH:mm') > startTime && moment(new Date(runNowScrumTimming[0].scrum_end_text_time)).format('HH:mm') < endTime) {
          if (scrum.end_time_text)
            await publishScrumEndTimeText(logHandler, scrum)
        }
        if (moment(new Date(runNowScrumTimming[0].scrum_end_time)).format('HH:mm') > startTime && moment(new Date(runNowScrumTimming[0].scrum_end_time)).format('HH:mm') < endTime) {
          await publishScrumAnswersOnFugu(logHandler, scrum)
        }
      }
    }
  }

  if (checkNonREcurrentScrums.length) {
    for (let scrum of checkNonREcurrentScrums) {
      console.log("<<<<<<<<<||||||||INSIDE_NON_RECURRENT_FUNCTION",scrum);
      if (moment(new Date(scrum.start_ISO_time)).format("HH:mm") > startTime && moment(new Date(scrum.start_ISO_time)).format("HH:mm") < endTime) {
        console.log("<!!!!!!!!!!PUBLISH_SCRUM_QUESTION_CALLED", moment(new Date(scrum.start_ISO_time)).format("HH:mm") , moment(new Date(scrum.start_ISO_time)).format("HH:mm") , endTime , startTime );
        await publishScrumQuestions(logHandler, scrum)
      }
      if (moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_text_time)).format('HH:mm') < endTime) {
        if (scrum.end_time_text)
          await publishScrumEndTimeText(logHandler, scrum)
      }
      if (moment(new Date(scrum.scrum_end_time)).format('HH:mm') > startTime && moment(new Date(scrum.scrum_end_time)).format('HH:mm') < endTime) {
        await publishScrumAnswersOnFugu(logHandler, scrum)
      }
      let runNowScrumTimming = await userService.runNowScrumTimmings(logHandler, { scrum_id: scrum.scrum_id })
      if (runNowScrumTimming.length) {
        if (moment(new Date(runNowScrumTimming[0].scrum_end_text_time)).format('HH:mm') > startTime && moment(new Date(runNowScrumTimming[0].scrum_end_text_time)).format('HH:mm') < endTime) {
          if (scrum.end_time_text)
            await publishScrumEndTimeText(logHandler, scrum)
        }
        if (moment(new Date(runNowScrumTimming[0].scrum_end_time)).format('HH:mm') > startTime && moment(new Date(runNowScrumTimming[0].scrum_end_time)).format('HH:mm') < endTime) {
          await publishScrumAnswersOnFugu(logHandler, scrum)
        }
      }
    }
  }

  //let date = moment(new Date()).format('YYYY-MM-DD HH:mm');
  let date = new Date()
  if (date.getDay() == 6) {
    let time = '17:40';
    let beforeTime = moment(new Date()).subtract('1', "minutes");
    beforeTime = moment(beforeTime).format('HH:mm');
    let afterTime = moment(new Date()).add('1', 'minutes');
    afterTime = moment(afterTime).format('HH:mm');
    if (time > beforeTime && time < afterTime) {
      let scrumDetails = await userService.getPresentWeekScrum(logHandler, payload)
      let scrumIds = scrumDetails.map(x => x["scrum_id"]);
      if (scrumIds.length) {
        let obj = {};
        obj.scrum_ids = scrumIds;
        await userService.updateScrumNextDate(logHandler, obj)
      }
    }
  }
}





async function editScrumDetails(logHandler, payload) {
  let scrumDetails = await userService.getScrumDetails(logHandler, { scrum_id: payload.scrum_id })
  if (_.isEmpty(scrumDetails)) {
    throw new Error("Scrum id not valid")
  } if (scrumDetails[0].scrum_status == "RUNNING") {
    throw new Error("Scrum is Running.")
  }

  let updateObj = {};

  payload.start_day ? updateObj.start_day = payload.start_day : 0;
  payload.time_zone ? updateObj.time_zone = payload.time_zone : 0;
  payload.start_time ? updateObj.start_time = payload.start_time : 0;
  payload.active_days ? updateObj.active_days = JSON.stringify(payload.active_days) : 0;
  (payload.frequency || payload.frequency == 0)? updateObj.frequency = payload.frequency : 0;
  payload.scrum_name ? updateObj.scrum_name = payload.scrum_name : 0;

  if (payload.respondants) {
    let respondants = await userService.getUserIds(logHandler, { user_names: payload.respondants })
    respondants = respondants.map(x => x["scrum_user_id"])
    updateObj.respondants = JSON.stringify(respondants)
  }
  if (payload.delivering_result_to_users) {
    if(payload.delivering_result_to_users.length){
    let delivering_result_to_users = await userService.getUserIds(logHandler, { user_names: payload.delivering_result_to_users })
    delivering_result_to_users = delivering_result_to_users.map(x => x["scrum_user_id"])
    updateObj.delivering_result_to_users = JSON.stringify(delivering_result_to_users);
    } else {
      updateObj.delivering_result_to_users = '[]'
    }
  }

  payload.welcome_message ? updateObj.welcome_message = payload.welcome_message : 0;
  payload.scrum_time ? updateObj.scrum_time = payload.scrum_time : 0;
  (payload.end_time_reminder || payload.end_time_reminder == 0) ? updateObj.end_time_reminder = payload.end_time_reminder : 0;
  payload.delivering_result_to_channels ? updateObj.delivering_result_to_channels = JSON.stringify(payload.delivering_result_to_channels) : 0;
  payload.scrum_status ? updateObj.scrum_status = payload.scrum_status : 0;
  payload.end_time_text ? updateObj.end_time_text = payload.end_time_text : 0;


  if (_.isEmpty(updateObj) && !payload.questions) {
    throw new Error("Please provide something to update.")
  }


  if (payload.questions) {
    for (let question of payload.questions) {
      let updateObj = {}
      if (question.id == -2) {
        await userService.insertScrumQuestions(logHandler, { questions: [{ question: question.question, pos: question.pos }], scrum_id: payload.scrum_id })
      } else if (question.isDeleted) {
        updateObj.question_status = 0
        await userService.updateQusetion(logHandler, updateObj, { question_id: question.id })
      } else if (question.pos_changed) {
        updateObj.question = question.question
        updateObj.question_position = question.pos
        await userService.updateQusetion(logHandler, updateObj, { question_id: question.id })
      } else {
        updateObj.question = question.question
        await userService.updateQusetion(logHandler, updateObj, { question_id: question.id })
      }
    }
  }
  await userService.updateScrumDetails(logHandler, updateObj, { scrum_id: payload.scrum_id });

  return { scrum_status: scrumDetails[0].scrum_status };
}



async function publishScrumAnswers(logHandler, payload) {

  let scrumDetails = await userService.getScrumDetails(logHandler, { scrum_id: payload.scrum_id })
  let businessToken = await userService.getBusinessToken(logHandler , {business_id : scrumDetails[0].business_id })
  let questions = await userService.getQuestions(logHandler, { scrum_ids: payload.scrum_id })
  let questionIds = questions.map(x => x["question_id"])
  let obj = { question_ids: questionIds }
  if (scrumDetails[0].run_now_id) {
    obj.run_now_id = scrumDetails[0].run_now_id
    await userService.updateScrumDetails(logHandler, { run_now_id: 0 }, { scrum_id: payload.scrum_id })
  }
  let answers = await userService.getScrumAnswers(logHandler, obj)


  let userNameAnswerMapping = {}
  for (let answer of answers) {
    if (userNameAnswerMapping[answer.question_id] == null)
      userNameAnswerMapping[answer.question_id] = []
    let obj = {}
    obj.user_name = answer.user_id;
    obj.answer = answer.answer;
    obj.created_at = answer.created_at;
    userNameAnswerMapping[answer.question_id].push(obj)
  }

  let userNameQuestionAnswerMap = {}
  for (let question of questions) {
    let questionAnswerObj = {}
    questionAnswerObj["question"] = question.question;
    questionAnswerObj["answers"] = [];
    questionAnswerObj["answers"] = (userNameAnswerMapping[question.question_id]) ? userNameAnswerMapping[question.question_id] : [];
    if (userNameQuestionAnswerMap[question.scrum_id] == null)
      userNameQuestionAnswerMap[question.scrum_id] = []
    userNameQuestionAnswerMap[question.scrum_id].push(questionAnswerObj)
  }


  //payload.respondants = JSON.parse(scrum.respondants)
  let userIds = await userService.getFuguUserId(logHandler, { userIds: payload.respondants })
  let respondants = userIds.map(x => x["user_id"])

  for (user of respondants) {
    let answerCount = 0
    for (let data of userNameQuestionAnswerMap[payload.scrum_id]) {
      answerCount = 0
      for (let answerArray of data.answers) {
        if (user == answerArray.user_name) {
          break;
        }
        else {
          answerCount++;
        }
      }
      if (answerCount == data.answers.length) {
        let obj = {}
        obj.user_name = user;
        obj.answer = "*No answer*";
        data.answers.push(obj);
      }
    }
  }
  payload.delivering_result_to_users = JSON.parse(payload.delivering_result_to_users)
  if (!_.isEmpty(payload.delivering_result_to_users)){
  let users = await userService.getFuguUserId(logHandler, { userIds: payload.delivering_result_to_users });
  userIds = users.map(x => x["user_id"]);
  } else {
    userIds = [];
  }
  (payload.delivering_result_to_channels.length) ? payload.delivering_result_to_channels = JSON.parse(payload.delivering_result_to_channels) : 0;
  let options = {
    url: config.get('fuguEndPoint') + constants.API_END_POINT.PUBLISH_MESSAGE_ON_SCRUM_BOT,
    method: 'POST',
    json: {
      type: constants.PUBLISH_MESSAGE_TYPE.PUBLISH_SCRUM_ANSWERS,
      user_names: userIds,
      business_token : businessToken[0].business_token,
      respondants: respondants,
      answers: userNameQuestionAnswerMap[payload.scrum_id],
      "scrum_name": payload.scrum_name
    }
  };

  (payload.delivering_result_to_channels.length) ? options.json.channel_ids = payload.delivering_result_to_channels : 0;
  await utilityService.sendHttpRequest(logHandler, options);

}
