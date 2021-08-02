const moment                  = require('moment');
const _                       = require('underscore');

const UniversalFunc           = require('../../../Utils/universalFunctions');
const RESP                    = require('../../../Config').responseMessages;
const { logger }              = require('../../../libs/pino_logger');
const constants               = require('../../../Utils/constants');
const notifierService         = require('../../../services/notifier');
const channelService          = require('../../../services/channel');
const pushNotificationBuilder = require('../../../Builder/pushNotification');
const userService             = require('../../../services/user');
const workspaceService        = require('../../../services/workspace');
const taskService             = require('../service/taskService');
const commonFunctions         = require('../../../Utils/commonFunctions');
const handleChatService       = require('../../../services/handleChat');
const businessService         = require('../../../services/business');
const notificationService     = require('../../../services/notifier');

exports.assignTask       = assignTask;
exports.getAssignedTask  = getAssignedTask;
exports.submitTask       = submitTask;
exports.reminderCron     = reminderCron;
exports.getTaskDetails   = getTaskDetails;
exports.editTaskDetails  = editTaskDetails;

async function assignTask(req, res) {
  try {

        const now = moment().utc();

        if (moment(req.body.start_date).isBefore(now) || moment(req.body.end_datetime).isBefore(now)) {
          throw new Error(RESP.ERROR.eng.PAST_DATE_NOT_ALLOWED.customMessage);
        }

        let obj = req.body;
        obj.user_ids = commonFunctions.jsonToObject(req.logHandler, obj.user_ids || null);

        let task_data = {
          channel_id: obj.channel_id,
          assigner_user_id: obj.assigner_user_id,
          title: obj.title,
          description: obj.description,
          start_datetime: moment(obj.start_datetime).format('YYYY-MM-DD HH:mm:ss'),
          end_datetime: moment(obj.end_datetime).format('YYYY-MM-DD HH:mm:ss'),
          is_selected_all: obj.is_selected_all,
          reminder: obj.reminder,
          tagged_user: JSON.stringify(obj.user_ids),
          workspace_id: obj.workspace_id,
          reminder_datetime: req.body.reminder ? moment(req.body.end_datetime).subtract(req.body.reminder, "minutes").format('YYYY-MM-DD HH:mm:ss')
                                               : null
        }

        let taskInsert = await taskService.insertTaskDetails(req.logHandler, task_data);

        notifyUserAssignedTasks(req.logHandler,
                {
                        channel_id          : req.body.channel_id,
                        assigner_user_id    : req.body.assigner_user_id,
                        task_id             : taskInsert.insertId,
                        task_data           : task_data,
                        user_ids            : obj.user_ids,
                        type                : 'assign',
                        title               : obj.title
                    }
                )
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, {}, res);
  } catch(error) {
    logger.error(req.logHandler, {EVENT: 'assignTask'}, {error: error});
    error = (error.errorResponse) ? error.errorResponse : error;
    return UniversalFunc.sendError(error, res);
  }
}

async function getAssignedTask(req, res) {
  try {
    // let is_student = true;
    let total_task = [];
    let user_id = req.body.user_id;
    let tasks = await taskService.getAssignedTask(req.logHandler, req.body);

    for(let i = 0; i < tasks.length; i++) {
      if ((!req.body.is_completed || req.body.is_completed == 2)  && (tasks[i].assigner_user_id == user_id)){
        //  is_student = false;
        tasks[i].assigner = 1;
         total_task.push(tasks[i]);
      } else if ((req.body.is_completed != 2) && (tasks[i].is_selected_all || (tasks[i].tagged_user && JSON.parse(tasks[i].tagged_user.includes(user_id))))){
        total_task.push(tasks[i]);
      }
    }

    if(!total_task.length){
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, total_task, res);
    }
    //.log(JSON.stringify(total_task)+"******");

    total_task.forEach( key => {
        key.is_completed        = 0;
        key.submission_datetime = null;
    })

    if (req.body.is_completed != 2) {

        let result = [];

        let task_ids = total_task.map(x=> x["task_id"]);
        let getTaskDetails = await taskService.getStudentTaskMapping(req.logHandler, {task_ids, user_id, is_completed: req.body.is_completed});
        //console.log(JSON.stringify(getTaskDetails)+"----->");
        let taskIdsHash = {};
        if(!_.isEmpty(getTaskDetails)){
            taskIdsHash = _.indexBy(getTaskDetails,'task_id');

            total_task.forEach( key => {

                if (taskIdsHash[key.task_id]) {
                    key.is_completed        = taskIdsHash[key.task_id].is_completed;
                    key.submission_datetime = taskIdsHash[key.task_id].submission_datetime;
                }

                if (taskIdsHash[key.task_id] || key.assigner) {
                    result.push(key);
                }

            })
        }

        if (req.body.is_completed == 0 || req.body.is_completed == 1)
            total_task = result;

    }

    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, total_task, res);
  } catch(error) {
    logger.error(req.logHandler, {EVENT: 'getAssignedTask'}, {error: error});
    error = (error.errorResponse) ? error.errorResponse : error;
    return UniversalFunc.sendError(error, res);
  }
}


async function submitTask(req, res) {
  try {
    let obj = req.body;

    let checkTaskExist = await taskService.getAssignedTask(req.logHandler, {task_id: obj.task_id});
    if(!checkTaskExist.length){
      throw new Error("Invalid Task");
    }
    let task_data = {
      task_id        : obj.task_id,
      student_user_id: obj.user_id,
      content        : obj.content,
      is_completed   : 1
    }
    if(obj.url){
      task_data.task_work = {
        url      : obj.url,
        file_size: obj.file_size,
        file_name: obj.file_name,
        muid     : obj.muid
      }
    }
    await taskService.updateStudentTaskMappingDetails(req.logHandler, task_data);
    return UniversalFunc.sendSuccess(RESP.SUCCESS.TASK_SUBMITTED, {}, res);
  } catch(error) {
    logger.error(req.logHandler, {EVENT: 'submitTask'}, {error: error});
    error = (error.errorResponse) ? error.errorResponse : error;
    return UniversalFunc.sendError(error, res);
  }
}


async function reminderCron(req, res){

  req.logHandler = {
    uuid      : req.uuid,
    apiModule : 'task',
    apiHandler: 'reminderCron'
  };

  res.send('ok');

  try {

    let start_datetime = moment(new Date().setSeconds(0)).subtract('1', "minutes").format('YYYY-MM-DD HH:mm:ss');
    let end_datetime   = moment(new Date().setSeconds(0)).add('1', 'minutes').format('YYYY-MM-DD HH:mm:ss');

    let getTaskDetails = await taskService.getAssignedTask(req.logHandler,{reminder_cron: true, start_datetime, end_datetime});

    let taskHashMap         = {};
    let userIdsHashMap      = {};
    let channelHashMap      = {};
    let workspaceHashMap    = {};
    let assignerUserHashMap = {};
    let taskDetailHashMap   = {};

    //console.log("getTaskDetails: ", {getTaskDetails: getTaskDetails})

    if ( getTaskDetails.length > 0 ) {

        let taskIds         = getTaskDetails.map(task => task["task_id"]);
        // const assignerUserIds = getTaskDetails.map(task => task["assigner_user_id"]);
        // const channelIds      = getTaskDetails.map(task => task["channel_id"]);
        // const workspaceIds    = getTaskDetails.map(task => task["workspace_id"]);

        //let taskIds         = [];
        let assignerUserIds = [];
        let channelIds      = [];
        let workspaceIds    = [];

        let getIncompleteTask = await taskService.getStudentTaskMapping(req.logHandler, {task_ids: taskIds, is_completed: 0});

        //console.log("getIncompleteTask: ", {getIncompleteTask: getIncompleteTask})

        const userIds        = getIncompleteTask.map(x => x["student_user_id"]);
        taskIds              = getIncompleteTask.map(x => x["task_id"]);
        taskIds              = _.unique(taskIds);

        // studentTaskIds.forEach( task => {
        //     studentTaskIdHashMap[task['task_id']] = 1;
        // })

        getIncompleteTask.forEach( task => {
            if (!taskHashMap[task['task_id']]) {
                taskHashMap[task['task_id']] = {assigner_user_id: null, userIds: [], userInfo: {}, businessInfo: {}, channelInfo: {}, userPushList: []};
            }

            //taskHashMap.task['task_id'].tasks.push(task);
            taskHashMap[task['task_id']].userIds.push(task["student_user_id"]);

            if (!userIdsHashMap[task['student_user_id']])
                userIdsHashMap[task['student_user_id']] = [];

            userIdsHashMap[task['student_user_id']].push(task['task_id']);
        })

        getTaskDetails.forEach( task => {

            if (taskHashMap[task['task_id']]) {
                if (!channelHashMap[task["channel_id"]])
                    channelHashMap[task["channel_id"]] = [];

                if (!workspaceHashMap[task["workspace_id"]])
                    workspaceHashMap[task["workspace_id"]] = [];

                if (!assignerUserHashMap[task["assigner_user_id"]])
                    assignerUserHashMap[task["assigner_user_id"]] = [];

                channelHashMap[task["channel_id"]].push(task["task_id"]);
                workspaceHashMap[task["workspace_id"]].push(task["task_id"]);
                assignerUserHashMap[task["assigner_user_id"]].push(task["task_id"]);

                //taskIds.push(task["task_id"]);
                channelIds.push(task["channel_id"]);
                workspaceIds.push(task["workspace_id"]);
                assignerUserIds.push(task["assigner_user_id"]);

                if (!taskDetailHashMap[task["task_id"]])
                    taskDetailHashMap[task["task_id"]] = {title: {}, end_datetime: {}};

                taskDetailHashMap[task["task_id"]].title        = task['title'];
                taskDetailHashMap[task["task_id"]].end_datetime = task['end_datetime'];

                taskHashMap[task['task_id']].assigner_user_id = task['assigner_user_id'];
            }

        })

        //console.log("initialized hashMap: " ,{channelHashMap: channelHashMap, workspaceHashMap: workspaceHashMap, assignerUserHashMap: assignerUserHashMap})

        //console.log("initialized var: " ,{taskIds: taskIds, channelIds: channelIds, workspaceIds: workspaceIds, assignerUserIds: assignerUserIds})

        let userInfo     = await userService.getUserDetail(req.logHandler, {user_id: _.uniq(assignerUserIds)});

        //console.log("userInfo info: ", userInfo);
        userInfo.forEach( user => {
            assignerUserHashMap[user.user_id].forEach( taskId  => {
                if (taskHashMap[taskId].assigner_user_id == user.user_id) taskHashMap[taskId].userInfo = user;
            })
        })

        let channelInfo  = await channelService.getInfo(req.logHandler, {channel_ids: _.uniq(channelIds)});

        //console.log("channel info: ", channelInfo);
        channelInfo.forEach( channel => {
            channelHashMap[channel.channel_id].forEach( taskId  => {
                taskHashMap[taskId].channelInfo = channel;
            })
        })

        let businessInfo =  await businessService.getInfoByWorkSpaceId(req.logHandler, {workspace_ids: _.uniq(workspaceIds)});

        //console.log("business info: ", businessInfo);
        businessInfo.forEach( business => {
            workspaceHashMap[business.workspace_id].forEach( taskId  => {
                taskHashMap[taskId].businessInfo = business;
            })
        })

        //let userPushList = await userService.getLatestUsersDeviceDetails(req.logHandler, {userIds: _.uniq(userIds)});
        let userPushList = await userService.getUsersUniqueDevices(req.logHandler, { user_unique_keys: payload.user_unique_keys, domain_id : payload.businessInfo.domain_id });


        //removing duplicate devices detail
        let userPushListHashMap = {};
        let filterUserPushList = [];

        userPushList.for( key => {
            if (!userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]]){
                userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]] = true;
                filterUserPushList.push(key);
            }
        })

        userPushList = filterUserPushList;

        //console.log("userPushList info: ", userPushList);
        userPushList.forEach( userPush => {
            userIdsHashMap[userPush.user_id].forEach( taskId => {
                taskHashMap[taskId].userPushList.push(userPush);
            })
        })

        //console.log("task hah map: ", {taskHashMap: taskHashMap}, taskHashMap)
        taskIds.forEach( taskId => {

            const pushPayload = {
                message: `You have a task (${taskDetailHashMap[taskId].title}) which you need to take care of !`,
                notificationType: pushNotificationBuilder.notificationType.ASSIGN_TASK,
                userIds: taskHashMap[taskId].userIds,
                messageType: 1
            };


            //removing duplicate devices detail
            let userPushListHashMap = {};
            let filterUserPushList = [];

            taskHashMap[taskId].userPushList.forEach( key => {
                if (!userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]]){
                    userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]] = true;
                    filterUserPushList.push(key);
                }
            })

            taskHashMap[taskId].userPushList = filterUserPushList;


            let options                        = {};
            options.domain                 = taskHashMap[taskId].businessInfo.domain;
            options.userPushList           = taskHashMap[taskId].userPushList;
            options.userIds                = _.uniq(taskHashMap[taskId].userIds);
            options.workspace              = taskHashMap[taskId].businessInfo.workspace;
            options.user_id                = taskHashMap[taskId].userInfo.user_id;
            options.user_unique_key        = taskHashMap[taskId].userInfo.user_unique_key;
            options.send_by                = taskHashMap[taskId].userInfo.user_id;
            options.last_sent_by_user_type = taskHashMap[taskId].userInfo.user_type;
            options.channel_id             = taskHashMap[taskId].channelInfo.channel_id;
            options.message                = pushPayload.message || "";
            options.noti_msg               = pushPayload.message || "";
            options.message_type           = 1;
            options.full_name              = taskHashMap[taskId].userInfo.full_name;
            options.business_id            = taskHashMap[taskId].workspace_id;
            options.chat_type              = taskHashMap[taskId].channelInfo.chat_type;
            options.channel_status         = taskHashMap[taskId].channelInfo.status;
            options.email                  = taskHashMap[taskId].userInfo.email || "";
            options.push_message           = pushPayload.message;
            options.label                  = taskHashMap[taskId].userInfo.full_name;
            options.notification_type      = pushPayload.notificationType;
            options.user_thumbnail_image   = taskHashMap[taskId].userInfo.user_thumbnail_image;
            options.ccMentionPushUsers     = {};
            options.followThreadUserIds    = {};
            options.business_name          = taskHashMap[taskId].businessInfo.workspace_name;
            options.app_secret_key         = taskHashMap[taskId].businessInfo.fugu_secret_key;
            options.title                  = "Task Reminder"
            options.userInfo               = taskHashMap[taskId].userInfo;
            options.pushFlag               = true
            options.usersUnreadNotificationCount = {};
            options.ccMentionPushUsers           = {};
            options.followThreadUserIds          = {};

            //notificationService.saveNotifications(req.logHandler, options);

            options.userPushList           = handleChatService.preparePushNotificationList(options);

            //console.log("Options for push: ", options)

            handleChatService.pushNotifications(req.logHandler, options);
        })

    }

  } catch(error) {
    logger.error(req.logHandler, {EVENT: 'cron'}, {error: error});
    error = (error.errorResponse) ? error.errorResponse : error;
    //console.log("Error: ", error)
    //return UniversalFunc.sendError(error, res);
  }
}


async function getTaskDetails(req, res){
  try {
        let task_id = req.body.task_id;
        let user_id = req.body.user_id;
        // let student_user_id;

        let taskDetails = await taskService.getTaskDetails(req.logHandler, {task_id, user_id});
        if(!taskDetails.length){
          throw new Error("Invalid Task");
        }

        await updateWithStudentDetails(req.logHandler,taskDetails,user_id);

        taskDetails[0].task_work = taskDetails[0].task_work ? JSON.parse(taskDetails[0].task_work) : null;

        return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, taskDetails[0], res);

  }catch(error){
        logger.error(req.logHandler, {EVENT: 'submitTask'}, {error: error});
        error = (error.errorResponse) ? error.errorResponse : error;
        return UniversalFunc.sendError(error, res);
  }
}


async function editTaskDetails(req, res) {

    try {

        const now              = moment().utc().format('YYYY-MM-DD HH:mm:ss');

        if ((req.body.start_date &&  moment(req.body.start_date).isBefore(now))
                || (req.body.end_datetime &&  moment(req.body.end_datetime).isBefore(now))) {
            throw new Error(RESP.ERROR.eng.PAST_DATE_NOT_ALLOWED.customMessage);
        }

        let taskOpts = {
            task_id          : req.body.task_id,
        }
        if(req.body.channel_id){
          taskOpts.channel_id = req.body.channel_id;
        }
        if(req.body.workspace_id){
          taskOpts.workspace_id = req.body.workspace_id;
        }
        if(req.body.assigner_user_id){
          taskOpts.assigner_user_id = req.body.assigner_user_id;
        }

        let taskDetails = await taskService.getAssignedTask(req.logHandler, taskOpts);

        if (!taskDetails.length) {
            throw new Error("Task does not exist.");
        }

        if(req.body.title){
          taskOpts.title = req.body.title;
          taskDetails[0].title = req.body.title;
        }
        if(req.body.description){
          taskOpts.description        = req.body.description;
          taskDetails[0].description = req.body.description;
        }
        if(req.body.start_datetime){
          taskOpts.start_datetime     = moment(req.body.start_datetime).format('YYYY-MM-DD HH:mm:ss');
          taskDetails[0].start_datetime = moment(req.body.start_datetime).format('YYYY-MM-DD HH:mm:ss');
        }
        else{
          taskDetails[0].start_datetime = moment(taskDetails[0].start_datetime).format('YYYY-MM-DD HH:mm:ss');
        }
        if(req.body.end_datetime){
          taskOpts.end_datetime       = moment(req.body.end_datetime).format('YYYY-MM-DD HH:mm:ss');
          taskDetails[0].end_datetime = moment(req.body.end_datetime).format('YYYY-MM-DD HH:mm:ss');
        }
        else{
          taskDetails[0].end_datetime = moment(taskDetails[0].end_datetime).format('YYYY-MM-DD HH:mm:ss');
        }

        if(req.body.reminder && req.body.end_datetime) {
            taskOpts.reminder                   = req.body.reminder;
            taskOpts.reminder_datetime          = moment(req.body.end_datetime).subtract(req.body.reminder, "minutes").format('YYYY-MM-DD HH:mm:ss');
            taskDetails[0].reminder             = req.body.reminder;
            taskDetails[0].reminder_datetime    = moment(req.body.end_datetime).subtract(req.body.reminder, "minutes").format('YYYY-MM-DD HH:mm:ss');
        }

        if(req.body.hasOwnProperty('is_deleted')){
          taskOpts.is_deleted         = req.body.is_deleted;
          taskDetails[0].is_deleted   = req.body.is_deleted;
        }  
        const result = await taskService.updateTaskDetails(req.logHandler, taskOpts);

        if (result && !result.valid) {
            throw new Error("Task could not be updated.");
        }

        await updateWithStudentDetails(taskDetails,req.body.assigner_user_id);

        //Returning taskDetails to save extra getTaskDetails after editing
        await updateWithStudentDetails(req.logHandler,taskDetails, taskOpts.assigner_user_id);

        if (req.body.channel_id && req.body.assigner_user_id && req.body.task_id)
            notifyUserAssignedTasks(req.logHandler,
                {channel_id: req.body.channel_id, assigner_user_id: req.body.assigner_user_id, task_id: req.body.task_id, type: req.body.is_deleted ? 'delete' : 'update'}
                )

        return UniversalFunc.sendSuccess(RESP.SUCCESS.TASK_UPDATED, taskDetails[0], res);
    } catch(error) {
        logger.error(logHandler, {EVENT: 'assignTask'}, {error: error});
        error = (error.errorResponse) ? error.errorResponse : error;
        return UniversalFunc.sendError(error, res);
    }
}

async function updateWithStudentDetails(logHandler, taskDetails,user_id){
  try{
    // if(taskDetails[0].task)
    // taskDetails[0].task_work = JSON.parse(taskDetails[0].task_work);
    if(taskDetails[0].assigner_user_id == user_id){
     let taskMappingDetails = await taskService.getStudentDetails(logHandler, {task_id: taskDetails[0].task_id});
     taskDetails[0].user_data = taskMappingDetails;
    }
  }catch(error){
      logger.error(logHandler, {EVENT: 'assignTask'}, {error: error});
      return false;
  }
}


async function notifyUserAssignedTasks(logHandler, obj) {
    try {

        if (!obj.task_data) {
            obj.task_data = await taskService.getAssignedTask(logHandler, {task_id: obj.task_id});

            if (!obj.task_data || !obj.task_data.length) return false;

            obj.user_ids  = obj.task_data[0].tagged_user ? commonFunctions.jsonToObject(obj.task_data[0].tagged_user) : [];
            obj.title     = obj.task_data[0].title;
            obj.task_data = obj.task_data[0];

        }

        let channelDetails      = await channelService.getInfo(logHandler, {channel_id: obj.channel_id});
        if(!channelDetails.length){
            throw new Error("Invalid Channel Id");
        }
        let channelInfo  = channelDetails[0];
        let userInfo     = await userService.getUserDetail(logHandler, {user_id: obj.assigner_user_id});
        if(!userInfo.length){
            throw new Error("Invalid Assigner User Id");
        }

        let businessInfo = await workspaceService.getSpaceDetailsById(logHandler, {workspace_id: userInfo[0].workspace_id});
        businessInfo     = businessInfo[0];
        let users_participated = [];
        let user_uniqueArr = [];

        if(obj.task_data.is_selected_all) {
            let users = await channelService.getUsersParticipatedInChannel(logHandler, {channel_id: channelInfo.channel_id, remove_self: true, user_id: obj.assigner_user_id, include_invited_user: true});
            for(let i = 0; i < users.length; i++){
                users_participated.push(users[i].user_id);
                user_uniqueArr.push(users[i].user_unique_key);
            }
        }
        else {
            let users  = await channelService.getUsersParticipatedInChannel(logHandler, {channel_id: channelInfo.channel_id, user_ids: obj.user_ids, include_invited_user: true});
            for(let i = 0; i < users.length; i++){
                user_uniqueArr.push(users[i].user_unique_key);
            }
            users_participated = obj.user_ids;
        }

        users_participated = users_participated.filter(item => !(obj.assigner_user_id === item));

        await taskService.insertStudentTaskMapping(logHandler,{user_ids: users_participated, task_id: obj.task_id});
        user_uniqueArr = [...new Set(user_uniqueArr)];

        let options = {

            channelInfo,
            businessInfo                : businessInfo,
            userInfo                    : userInfo[0],
            notificationType            : pushNotificationBuilder.notificationType.ASSIGN_TASK,
            usersUnreadNotificationCount: {},
            isSilent                    : false,
            userIds                     : users_participated,
            update_notification_count   : true,
            messageType                 : 1,
            muid                        :  UniversalFunc.getRandomString(),
            title                       : 'Task Assignment:',
        };

        switch (obj.type) {
            case 'assign': {
                options.notification_title    = ` has assigned to you a Task(${obj.title})`;
                options.message               = ` ${userInfo[0].full_name} has assigned to you a Task(${obj.title})`;
                options.pushMessage           = ` ${userInfo[0].full_name} has assigned to you a Task(${obj.title})`;
                break;
            }
            case 'update': {
                options.notification_title    = ` has updated the Task(${obj.title}) assigned to you`;
                options.message               = ` ${userInfo[0].full_name} has updated the Task(${obj.title}) assigned to you`;
                options.pushMessage           = ` ${userInfo[0].full_name} has updated the Task(${obj.title}) assigned to you`;
                break;
            }
            case 'delete': {
                options.notification_title    = ` has deleted the Task(${obj.title}) assigned to you`;
                options.message               = ` ${userInfo[0].full_name} has deleted the Task(${obj.title}) assigned to you`;
                options.pushMessage           = ` ${userInfo[0].full_name} has deleted the Task(${obj.title}) assigned to you`;
                break;
            }
            default:
                options.notification_title     = ` has assigned to you a Task`;
                options.message                = ` ${userInfo[0].full_name} has assigned to you a Task`;
                options.pushMessage            = ` ${userInfo[0].full_name} has assigned to you a Task`;
                break
        }

        let usersUnreadNotifications = await userService.getUsersNotificationUnreadCount(logHandler, { fugu_user_id: users_participated, user_unique_key: user_uniqueArr, domain_id:1 });
        for (let row of usersUnreadNotifications) {
            if (!options.usersUnreadNotificationCount[row.user_unique_key]) {
                options.usersUnreadNotificationCount[row.user_unique_key] = {};
            }
            options.usersUnreadNotificationCount[row.user_unique_key].count = row.unread_notification_count + 1;
        }

        notifierService.notifyUsers(logHandler, options);
        return true;
    } catch(error) {
        logger.error(logHandler, {EVENT: 'notifyUserAssignedTasks'}, {error: error});
        return false;
    }
}
