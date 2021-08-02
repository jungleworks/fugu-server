
const moment                  = require('moment');
const _                       = require('underscore');
const UniversalFunc           = require('../../../Utils/universalFunctions');
const RESP                    = require('../../../Config').responseMessages;
const { logger }              = require('../../../libs/pino_logger');
const pushNotificationBuilder = require('../../../Builder/pushNotification');
const userService             = require('../../../services/user');
const meetingService          = require('../service/meetingService');
const constants               = require('../../../Utils/constants');
const handleChatService       = require('../../../services/handleChat');
const businessService         = require('../../../services/business');
const fuguService             = require('../../../services/fugu');
const conversationService     = require('./../../../services/conversation');
const notificationService     = require('../../../services/notifier');
const parserUtility           = require('../../../Utils/parserUtility');
const sendEmail               = require('../../../Notification/email').sendEmailToUser;



exports.scheduleMeeting = scheduleMeeting;
exports.getMeetings     = getMeetings;
exports.editMeeting     = editMeeting;
exports.reminderCron    = reminderCron;

async function scheduleMeeting(req, res){
    try{
      let frequency = req.body.frequency ? parseInt(req.body.frequency) : 0;
      let start_date = req.body.start_datetime;

      const currentDate = moment(start_date);
      const now         = moment().utc();

      if (currentDate.isBefore(now)) {
          throw new Error(RESP.ERROR.eng.PAST_DATE_NOT_ALLOWED.customMessage);
      }

      const dayId = currentDate.day();

      if (_.isNull(dayId) || _.isUndefined(dayId)) {
          throw new Error(RESP.ERROR.eng.INVALID_DATETIME.customMessage);
      }

      let active_days = [];

      if(frequency === constants.MEET_FREQUENCY.WEEKLY){
        active_days = [dayId];
      }else if(frequency === constants.MEET_FREQUENCY.WEEKDAYS){
          active_days = [1,2,3,4,5];
      } else if (frequency === constants.MEET_FREQUENCY.MONTHLY) {
          active_days = [dayId];
      } else {
          active_days = [dayId];
      }

      let obj = {
          user_id           : req.body.user_id,
          attendees         : parserUtility.parseIntegerArray(req.logHandler, req.body.attendees),
          start_datetime    : moment(req.body.start_datetime).format('YYYY-MM-DD HH:mm:ss'),
          end_datetime      : moment(req.body.end_datetime).format('YYYY-MM-DD HH:mm:ss'),
          reminder_time     : req.body.reminder_time,
          title             : req.body.title,
          active_days       : JSON.stringify(active_days),
          frequency         : frequency,
          workspace_id      : req.body.workspace_id,
          room_id           : req.body.room_id,
          reminder_datetime : moment(req.body.start_datetime).subtract(req.body.reminder_time, "minutes").format('YYYY-MM-DD HH:mm:ss')
      }

      if(req.body.meet_type){
        obj.meet_type = req.body.meet_type;
      }

      await meetingService.insertMeetingDetails(req.logHandler, obj);

      let attendees  = typeof req.body.attendees == 'string' ? JSON.parse(req.body.attendees) : req.body.attendees;
      let userDetailsOfCurrentUser = await userService.getUserInfo(req.logHandler,{fugu_user_id: [req.body.user_id], workspace_id: req.body.workspace_id});
      let userDetails = await userService.getUserInfo(req.logHandler,{fugu_user_id: attendees, workspace_id: req.body.workspace_id});

      let user_ids = userDetails.map(x => x["user_id"]);

      if (!req.body.workspaceInfo)
          req.body.workspaceInfo = {};

      if (!user_ids && !user_ids.length)
          throw new Error('No user_ids found')

      req.body.workspaceInfo.fugu_user_id = req.body.user_id;
      req.body.notification_type = constants.NOTIFICATION_EVENT.SCHEDULE_MEETING;

      req.body.pushMessage         = ` has invited you to join a meeting (${req.body.title}) `;
      req.body.notificationTitle   = ` has invited you to join a meeting (${req.body.title}) `;

      fuguService.notifyUser(req.logHandler, user_ids, req.body);

      if (!_.isEmpty(req.body.workspaceInfo)) {
          for(let element of userDetails) {
              let emailObj ={
                  senderMail        : userDetailsOfCurrentUser[0].email,
                  attendeesemails   : element.full_name,
                  start_datetime    : moment(new Date(req.body.start_datetime)).add(element.timezone || 330 ,'m').format('DD-MM-YYYY hh:mm A'),
                  end_datetime      : moment(new Date(req.body.end_datetime)).add(element.timezone || 330,'m').format('DD-MM-YYYY hh:mm A'),
                  title             : req.body.title,
                  link              : JSON.parse(req.body.workspaceInfo.properties).conference_link+"/"+req.body.room_id,
                  appName           : req.body.workspaceInfo.app_name,
                  logo              : req.body.workspaceInfo.logo,
                  domain_id         : req.body.workspaceInfo.domain_id,
                  email_credentials : req.body.workspaceInfo.email_credentials
              }
              if(!(element.email).startsWith("+")){
                  sendEmail(constants.emailType.SCHEDULE_EMAIL, emailObj, element.email, `Schedule Meeting`);
              }
          }
      }

      return UniversalFunc.sendSuccess(RESP.SUCCESS.MEETING_SCHEDULED, {}, res);
    }catch(error){
      logger.error(req.logHandler, {EVENT: 'scheduleMeeting'}, {error: error});
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
}

async function getMeetings(req, res){

    try {

       let opts = req.body;
       opts.order_by = 1;
       opts.start_datetime = req.start_datetime ? moment(req.body.start_datetime).format('YYYY-MM-DD HH:mm:ss')
                                                : moment().utc().format('YYYY-MM-DD HH:mm:ss');

       let meetingDetails = await meetingService.getMeetings(req.logHandler, opts);
      const currentDate = moment(req.body.start_datetime);
      const dayId = currentDate.day();
      let start_datetime=req.body.start_datetime;
      let meetingDetailsForWeekDays = await meetingService.getMeetingsForWeekDays(req.logHandler, opts);
      meetingDetailsForWeekDays.forEach(element=>{
        // if(JSON.parse(element.active_days).includes(dayId)) {
          let myDate = moment(start_datetime)

          let startDateTime = moment(element.start_datetime).weekday(dayId);
          let endDateTime = moment(element.end_datetime).weekday(dayId);
          let yearDifference=myDate.year()-startDateTime.year();
          if(yearDifference>=1){
            yearDifference=1;
          }
          else{
            yearDifference=0;
          }
          startDateTime.date(myDate.date() + ((11 - myDate.date()) % 7 || 7) + 7);
          startDateTime.month(myDate.month()+yearDifference);
          startDateTime.year(myDate.year());
          endDateTime.date(myDate.date() + ((11 - myDate.date()) % 7 || 7) + 7);
          endDateTime.month(myDate.month()+yearDifference);
          endDateTime.year(myDate.year());
          element.start_datetime = startDateTime;
          element.end_datetime   = endDateTime;
          meetingDetails.push(element);
        // }
      })
       let userArray=[],userDetails;


       meetingDetails.forEach(meeting => {
          userArray = [...new Set(userArray.concat(JSON.parse(meeting.attendees)))];
          userArray.push(meeting['user_id']);
       });

       if(!_.isEmpty(userArray)){
          userDetails = await conversationService.getUserDetails(req.logHandler, {user_ids: userArray});
       }
       userDetails = _.groupBy(userDetails,'user_id');
       meetingDetails.forEach(meeting => {
        let attendeesArray = JSON.parse(meeting.attendees);
        attendeesArray.push(parseInt(meeting.user_id));
         meeting.attendees = [];
         attendeesArray.forEach(user => {
          meeting.attendees.push({
            user_id              : userDetails[user][0].user_id || "",
            full_name            : userDetails[user][0].full_name || "",
            email                : userDetails[user][0].email || "",
            user_thumbnail_image : userDetails[user][0].user_thumbnail_image || "",
            assignee             : meeting.user_id == userDetails[user][0].user_id ? true : false,
            self_assignee        : parseInt(opts.user_id) == meeting.user_id && meeting.user_id == userDetails[user][0].user_id ? true : false,
          });
         });

       });

       return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, meetingDetails, res);
    }catch(error){
      console.log(error);
      logger.error(req.logHandler, {EVENT: 'getMeeting'}, {error: error});
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
}

async function editMeeting(req, res){
    try{

      let frequency = req.body.frequency ? parseInt(req.body.frequency) : 0;

      //push notification after edit of meetings.
      let meetingDetails = await meetingService.getMeetings(req.logHandler, {meet_id: req.body.meet_id});

      if (!meetingDetails.length) {
          return UniversalFunc.sendSuccess(RESP.SUCCESS.MEETING_DOES_NOT_EXIST, {}, res);
       }

      let active_days = [];
      if(req.body.start_datetime){
        let start_date = req.body.start_datetime;
        const currentDate = moment(start_date);
        const dayId = currentDate.day();

        if (_.isNull(dayId) || _.isUndefined(dayId)) {
            throw new Error(RESP.ERROR.eng.INVALID_DATETIME.customMessage);
        }

        if (frequency == constants.MEET_FREQUENCY.WEEKDAYS){
            active_days = [1,2,3,4,5];
        }else {
            active_days = [dayId];
        }
      }
      let obj = {};
      if(req.body.user_id){
        obj.user_id = req.body.user_id;
      }
      if(req.body.title){
        obj.title = req.body.title;
      }
      if(req.body.start_datetime){
        obj.start_datetime = moment(req.body.start_datetime).format('YYYY-MM-DD HH:mm:ss');
      }
      if(req.body.end_datetime){
        obj.end_datetime = moment(req.body.end_datetime).format('YYYY-MM-DD HH:mm:ss');
      }
      if(req.body.frequency){
        obj.frequency = req.body.frequency;
      }
      if(req.body.reminder_time && req.body.start_datetime){
        obj.reminder_time    = req.body.reminder_time;
        obj.reminder_datetime = moment(req.body.start_datetime).subtract(req.body.reminder_time, "minutes").format('YYYY-MM-DD HH:mm:ss')
      }
      if(req.body.attendees){
        obj.attendees = parserUtility.parseIntegerArray(req.logHandler, req.body.attendees);
      }
      if(!_.isEmpty(active_days)){
        obj.active_days = JSON.stringify(active_days);
      }
      if(req.body.workspace_id){
        obj.workspace_id = req.body.workspace_id;
      }
      if(req.body.room_id){
        obj.room_id = req.body.room_id;
      }
      if(req.body.meet_type){
        obj.meet_type = req.body.meet_type;
      }

      if(req.body.is_deleted){
        obj.is_deleted = req.body.is_deleted;
      }

      if(!_.isEmpty(obj)){
        obj.meet_id = req.body.meet_id;
        await meetingService.updateMeetingDetails(req.logHandler,obj);
      }

      editMeetingHelper(req.logHandler, {
              meetingDetails    : meetingDetails[0],
              obj               : {attendees: obj.attendees},
              user_id           : req.body.user_id,
              workspace_id      : req.body.workspace_id,
              workspaceInfo     : req.body.workspaceInfo,
              start_datetime    : req.body.start_datetime,
              end_datetime      : req.body.end_datetime ,
              title             : req.body.title || meetingDetails[0].title,
              is_deleted        : req.body.is_deleted,
              app_version       : req.body.app_version
          })

       return UniversalFunc.sendSuccess(RESP.SUCCESS.MEETING_SCHEDULED_UPDATED, {}, res);
    }catch(error){
        //console.log(error);
        logger.error(req.logHandler, {EVENT: 'getMeeting'}, {error: error});
        error = (error.errorResponse) ? error.errorResponse : error;
        return UniversalFunc.sendError(error, res);
    }
}

async function editMeetingHelper(logHandler, opts) {
    try {

        //console.log("editMeetingHelper method called: ", logHandler, opts);;

        let attendees = [];

        if (!_.isEmpty(opts.obj.attendees)) {
            attendees = JSON.parse(opts.obj.attendees);
        } else if (opts.meetingDetails.attendees) {
            attendees = JSON.parse(opts.meetingDetails.attendees);
        }

        //console.log("attendees: ", opts.obj.attendees, opts.meetingDetails.attendees, attendees);

        let newAttendees = [];

        if (!_.isEmpty(opts.obj.attendees)) {

            let editAttendees = {};

            let parsedAttendees = JSON.parse(opts.meetingDetails.attendees);

            parsedAttendees.forEach( attendee => {
                editAttendees[attendee] = true;
            })

            attendees.forEach( attendee => {
                if (!editAttendees[attendee])
                    newAttendees.push(attendee);
            })
        }

        //console.log("newAttendees: ", newAttendees);

        let allAttendees = attendees;

        if (!_.isEmpty(newAttendees)) {
            allAttendees.push(opts.user_id);
        }

        //console.log("allAttendees: ", allAttendees, "user_id: ", opts.user_id);

        let userDetails  = await userService.getUserInfo(logHandler,{fugu_user_id: allAttendees, workspace_id: opts.workspace_id});

        //console.log("userDetails from db: ", userDetails);

        let emailUserDetails    = [];
        let newAttendeesHashMap = {};
        let senderDetail = {}

        //new email user details.
        if (!_.isEmpty(newAttendees)) {

            newAttendees.forEach( attendee => {
                newAttendeesHashMap[attendee] = true;
            })

            userDetails.forEach( userDetail => {
                if (newAttendeesHashMap[userDetail.fugu_user_id]) {
                    emailUserDetails.push(userDetail);
                }

                if (parseInt(userDetail.fugu_user_id) === parseInt(opts.user_id)) {
                    senderDetail = userDetail;
                }
            })
        }

        //console.log("emailUserDetails: ", emailUserDetails, "newAttendeesHashMap: ", newAttendeesHashMap, "senderDetail: ", senderDetail);

        //filter userDetails
        if (!_.isEmpty(newAttendees)) {
            let filterUserDetails = [];
            userDetails.forEach( userDetail => {
                if (parseInt(userDetail.fugu_user_id) !== parseInt(opts.user_id)) {
                    filterUserDetails.push(userDetail);
                }
            })
            userDetails       = filterUserDetails;
            filterUserDetails = [];

            userDetails.forEach( userDetail => {
                if (!newAttendeesHashMap[userDetail.fugu_user_id]) {
                    filterUserDetails.push(userDetail);
                }
            })

            userDetails = filterUserDetails;
        }

        //console.log("filtered userDetails: ", userDetails);

        if (!_.isEmpty(newAttendees) && !_.isEmpty(senderDetail) && !_.isEmpty(opts.workspaceInfo)) {
            for(let element of emailUserDetails) {
                let emailObj = {
                    senderMail        : senderDetail.email,
                    attendeesemails   : element.full_name,
                    start_datetime    : moment(new Date(opts.start_datetime)).add(element.timezone || 330 ,'m').format('DD-MM-YYYY hh:mm A'),
                    end_datetime      : moment(new Date(opts.end_datetime)).add(element.timezone || 330,'m').format('DD-MM-YYYY hh:mm A'),
                    title             : opts.title,
                    link              : JSON.parse(opts.workspaceInfo.properties).conference_link+"/"+opts.meetingDetails.room_id,
                    appName           : opts.workspaceInfo.app_name,
                    logo              : opts.workspaceInfo.logo,
                    domain_id         : opts.workspaceInfo.domain_id,
                    email_credentials : opts.workspaceInfo.email_credentials
                }
                if(!(element.email).startsWith("+")){
                    sendEmail(constants.emailType.SCHEDULE_EMAIL, emailObj, element.email, `Schedule Meeting`);
                }
            }

            let user_ids = emailUserDetails.map(x => x['user_id'])

            opts.pushMessage         = ` has invited you to join a meeting (${opts.title}) `;
            opts.notificationTitle   = ` has invited you to join a meeting (${opts.title}) `;

            if (!_.isEmpty(user_ids)) {
                opts.notification_type          = constants.NOTIFICATION_EVENT.SCHEDULE_MEETING;
                opts.workspaceInfo.fugu_user_id = opts.user_id;
                fuguService.notifyUser(logHandler, user_ids, opts);
            }

        }

        if (!_.isEmpty(opts.workspaceInfo)) {

            let user_ids = userDetails.map(x => x["user_id"]);

            if (opts.start_datetime ) {
                opts.pushMessage         = ` has rescheduled meeting (${opts.title}) `
                opts.notificationTitle   = ` has rescheduled meeting (${opts.title}) `
            } else if (opts.is_deleted) {
                opts.pushMessage         = ` has cancelled meeting (${opts.title}) `
                opts.notificationTitle   = ` has cancelled meeting (${opts.title}) `
            }

            if (!_.isEmpty(user_ids) && !_.isEmpty(opts.workspaceInfo) && (opts.start_datetime || opts.is_deleted)) {
                opts.notification_type          = constants.NOTIFICATION_EVENT.SCHEDULE_MEETING;
                opts.workspaceInfo.fugu_user_id = opts.user_id;
                fuguService.notifyUser(logHandler, user_ids, opts);
            }
        }

        return true;
    } catch (error) {
        //console.log("editMeetingHelper: ", error);
        logger.error(logHandler, {EVENT: 'editMeetingHelper'}, {error: error});
        error = (error.errorResponse) ? error.errorResponse : error;
        return false
        //return UniversalFunc.sendError(error, res);
    }
}


async function reminderCron(req, res){

    req.logHandler = {
        uuid      : req.uuid,
        apiModule : 'meeting',
        apiHandler: 'reminderCron'
    };

    res.send('ok');
    try {

        let start_datetime = moment(new Date().setSeconds(0)).subtract('1', "seconds").format('YYYY-MM-DD HH:mm:ss');
        let end_datetime   = moment(new Date().setSeconds(0)).add('1', 'minutes').format('YYYY-MM-DD HH:mm:ss');

        let getMeetingsDetails = await meetingService.getMeetings(req.logHandler,{reminder_cron: true, start_datetime, end_datetime});

        let meetHashMap         = {};
        let workspaceHashMap    = {};
        let assignerUserHashMap = {};

        //console.log("getMeetingsDetails: ", {getTaskDetails: getMeetingsDetails})

        if ( getMeetingsDetails.length > 0 ) {

            let meetIds         = [];
            let workspaceIds    = [];
            let userIds         = [];


            const attendees = getMeetingsDetails.map(meet => meet['attendees']);

            attendees.forEach( attendee => {
                userIds = userIds.concat(JSON.parse(attendee));
            });

            getMeetingsDetails.forEach( meet => {
                if (!meetHashMap[meet['meet_id']]) {
                    meetHashMap[meet['meet_id']] = {userIds: [], userInfo: {}, businessInfo: {},
                        channelInfo: {}, userPushList: [], title: {}, reminder_time: {}};
                }

                if (!workspaceHashMap[meet["workspace_id"]])
                    workspaceHashMap[meet["workspace_id"]] = [];

                workspaceHashMap[meet["workspace_id"]].push(meet['meet_id']);

                let attendessObj = meet['attendees'];

                attendessObj = attendessObj ?  JSON.parse(meet['attendees']) : [];

                if (!assignerUserHashMap[meet["user_id"]])
                    assignerUserHashMap[meet["user_id"]] = [];

                assignerUserHashMap[meet["user_id"]].push(meet['meet_id']);

                attendessObj.forEach( attendee => {

                    if (!assignerUserHashMap[attendee])
                        assignerUserHashMap[attendee] = [];

                    assignerUserHashMap[attendee].push(meet['meet_id']);
                })

                //taskHashMap.task['task_id'].tasks.push(task);
                if (meet['attendees'])
                    meetHashMap[meet['meet_id']].userIds = meetHashMap[meet['meet_id']].userIds.concat(attendessObj);

                meetHashMap[meet['meet_id']].userIds.push(meet['user_id']);

                meetHashMap[meet['meet_id']].userIds = _.unique(meetHashMap[meet['meet_id']].userIds);

                meetHashMap[meet['meet_id']].title          = meet['title'];
                meetHashMap[meet['meet_id']].reminder_time  = meet['reminder_time'];

                workspaceIds.push(meet["workspace_id"]);

                userIds.push(meet["user_id"]);
                meetIds.push(meet['meet_id']);
            })


            //console.log("hashMap: ", meetHashMap, {workspaceIds: workspaceIds}, {assignerUserHashMap: assignerUserHashMap}, {userIds: userIds})

            let userInfo     = await userService.getUserDetail(req.logHandler, {user_id: _.uniq(userIds)});

            //console.log("userInfo info: ", userInfo);
            userInfo.forEach( user => {
                assignerUserHashMap[user.user_id].forEach( meetId  => {
                    meetHashMap[meetId].userInfo = user;
                })
            })

            //console.log("Initialized hashMap: " ,{workspaceHashMap: workspaceHashMap, assignerUserHashMap: assignerUserHashMap})

            //console.log("Initialized Var: " ,{meetIds: meetIds, workspaceIds: workspaceIds, assignerUserIds: userIds})

            let businessInfo =  await businessService.getInfoByWorkSpaceId(req.logHandler, {workspace_ids: _.uniq(workspaceIds)});

            //console.log("business info: ", businessInfo);
            businessInfo.forEach( business => {
                workspaceHashMap[business.workspace_id].forEach( meetId  => {
                    meetHashMap[meetId].businessInfo = business;
                })
            })

            let userPushList = await userService.getLatestUsersDeviceDetails(req.logHandler, {userIds: _.uniq(userIds)});

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
                assignerUserHashMap[userPush.user_id].forEach( meetId => {
                    meetHashMap[meetId].userPushList.push(userPush);
                })
            })

            //console.log("meet task hah map: ", {meetHashMap: meetHashMap}, {meetIds: meetIds}, {len: meetIds.length})
            for (let i=0; i<meetIds.length; i++) {

                let meetId = meetIds[i];

                if (!meetHashMap[meetId])
                    continue;

                const pushPayload = {
                    message: `Reminder: Meeting (${meetHashMap[meetId].title}) starts in ${meetHashMap[meetId].reminder_time} minutes.`,
                    notificationType: pushNotificationBuilder.notificationType.SCHEDULE_MEETING,
                    userIds: meetHashMap[meetId].userIds,
                    messageType: 1,
                    // user_thumbnail_image: userInfo[0].user_image,
                };

                meetHashMap[meetId].userIds = meetHashMap[meetId].userIds.map(x => parseInt(x));

                //removing duplicate devices detail
                let userPushListHashMap = {};
                let filterUserPushList = [];

                meetHashMap[meetId].userPushList.forEach( key => {
                    if (!userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]]){
                        userPushListHashMap[[key.user_unique_key, key.device_id, key.device_type]] = true;
                        filterUserPushList.push(key);
                    }
                })

                meetHashMap[meetId].userPushList = filterUserPushList;

                let options                        = {};
                options.domain                 = meetHashMap[meetId].businessInfo.domain;
                options.userPushList           = meetHashMap[meetId].userPushList;
                options.userIds                = _.uniq(meetHashMap[meetId].userIds);
                options.workspace              = meetHashMap[meetId].businessInfo.workspace;
                options.user_id                = meetHashMap[meetId].userInfo.user_id;
                options.user_unique_key        = meetHashMap[meetId].userInfo.user_unique_key;
                options.send_by                = meetHashMap[meetId].userInfo.user_id;
                options.last_sent_by_user_type = meetHashMap[meetId].userInfo.user_type;
                //options.channel_id             = constants.collapse_key;
                options.message                = pushPayload.message || "";
                options.noti_msg               = pushPayload.message || "";
                options.message_type           = 1;
                options.full_name              = meetHashMap[meetId].userInfo.full_name;
                options.business_id            = meetHashMap[meetId].workspace_id;
                //options.chat_type              = 3;
                //options.channel_status         = meetHashMap[meetId].channelInfo.status;
                options.email                  = meetHashMap[meetId].userInfo.email || "";
                options.push_message           = pushPayload.message;
                options.label                  = meetHashMap[meetId].userInfo.full_name;
                options.notification_type      = pushPayload.notificationType;
                options.user_thumbnail_image   = meetHashMap[meetId].userInfo.user_thumbnail_image;
                options.ccMentionPushUsers     = {};
                options.followThreadUserIds    = {};
                options.business_name          = meetHashMap[meetId].businessInfo.workspace_name;
                options.app_secret_key         = meetHashMap[meetId].businessInfo.fugu_secret_key;
                options.title                  = "Meeting Reminder"
                options.userInfo               = meetHashMap[meetId].userInfo;
                options.pushFlag               = true
                options.usersUnreadNotificationCount = {};
                options.ccMentionPushUsers           = {};
                options.followThreadUserIds          = {};
                options.userPushList           = handleChatService.preparePushNotificationList(options);

                //notificationService.saveNotifications(req.logHandler, options);

                //console.log("Options for push: ", options)

                handleChatService.pushNotifications(req.logHandler, options);
            }

        }
    }catch(error){
        logger.error(req.logHandler, {EVENT: 'cron'}, {error: error});
        error = (error.errorResponse) ? error.errorResponse : error;
        //console.log("Error: ", error)
        //return UniversalFunc.sendError(error, res);
    }
}
