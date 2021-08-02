


const { google }     = require('googleapis');
const CALENDAR_SCOPE = ['https://www.googleapis.com/auth/calendar'];

const constants            = require('../../../Utils/constants');
const calendarDao          = require('./googleDaoService');
const universalFunctions   = require('../../../Utils/universalFunctions');
const userService          = require('../../../services/user');
const commonFunctions      = require('../../../Utils/commonFunctions');

exports.getAuthorizationUrl = getAuthorizationUrl;
exports.getToken            = getToken;
exports.addEvent            = addEvent;
exports.getOAuthInstance    = getOAuthInstance;
exports.deleteEvent         = deleteEvent;


/**
 * Get Authorization Url from google for authenticating user's calendar
 * @param {Object} logHandler {module, api} refernce to module and api
 * @param {Object} credentials 
 * {installed {client_id,project_id,auth_uri,token_uri,auth_provider_x509_cert_url,client_secret,redirect_uris}}
 * An authorized OAuth2 client.
 **/
async function getAuthorizationUrl(logHandler, payload, domain_details) {
  try {
    let creds = JSON.parse(domain_details.google_creds);
    let client_id = creds.googleWebClientId;
    let client_secret = creds.client_secret;
    let redirect_uris = creds.app_redirect_url;
    if (payload.device_type == constants.enumDeviceType.WEB) {
      redirect_uris = config.get("frontEndUrl") + "/oauth_sucess";
    }
    const oAuth2Client    = new google.auth.OAuth2(client_id, client_secret, redirect_uris);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope      : CALENDAR_SCOPE,
      prompt     : "consent"
    });
    return authUrl;
  } catch (error) {
    throw error;
  }
}





/**
 * Get token from google for furthur accessing user's calendar
 * @param {Object} logHandler {module, api} Refernce to module and api
 * @param {Object} credentials {installed {client_id,project_id,auth_uri,token_uri,auth_provider_x509_cert_url,client_secret,redirect_uris}} An authorized OAuth2 client.
 * @param {string} code Code obtained after authenticating from google
 **/
async function getToken(logHandler, payload, credentials) {
  return new Promise((resolve, reject) => {
    let code = payload.auth_token;
    try {
      let creds = JSON.parse(credentials.google_creds);
      let client_id = creds.googleWebClientId;
    let client_secret = creds.client_secret;
    let redirect_uris = creds.app_redirect_url;
    if (payload.device_type == constants.enumDeviceType.WEB) {
      redirect_uris = config.get("frontEndUrl") + "/oauth_sucess";
    }
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
  
      oAuth2Client.getToken(code, (err, token) => {
        calendarDao.insertGoogleCalendarLogs(logHandler, {
          event     : constants.GOOGLE_CALENDAR_EVENTS.SUBMIT_CODE,
          request   : JSON.stringify({code}),
          response  : err ? JSON.stringify(err): JSON.stringify(token),
          user_id   : payload.userInfo.user_id
        });
        if (err) {
          return reject(err);
        }
        return resolve(token);
      });
    } catch (error) {
      return reject(error);
    }
  });
}



/**
 * Adds an event to the calendar
 * @param {Object} logHandler {module, api} refernce to module and api
 * @param {Object} auth {google.auth.OAuth2} An authorized OAuth2 client.
 * @param {Object} data {location, description, start_time, end_time, customer_email, calendar_id, summary, timeZone}
 * timeZone       => timezone in string like 'Pacific/Midway'
 * calendar_id    => calendar id from event to be fetched "primary" by default
 * description    => description of event tot be added
 * start_time     => start time of event, should be in local time
 * end_time       => end time of event,   should be in local time
 * customer_email => email of attendees.
 * summary        => summary of event must be string
 **/
function addEvent(logHandler, auth, data) {
  return new Promise(async(resolve, reject) => {
    try {
      data.is_scheduled = Number(data.is_scheduled);
      data.timezone     = Number(data.timezone);
      let description    = data.description || "Invited to a new meeting ";
      let start_time, end_time;
      let user_ids; 
      if(data.user_id){
        user_ids = data.user_id;
      }else{
        user_ids = commonFunctions.jsonToObject(logHandler,data.attendees);
      }
      if(data.is_scheduled){
      let attendeesDetails = await userService.getUsersWithIds(logHandler,{userIds: user_ids});
      if(!attendeesDetails.length){
         throw new Error("Invalid Attendees Data!!");
      }
       start_time = new Date(Number(data.start_datetime));
       end_time   = new Date(Number(data.end_datetime));
    }else{
        start_time = new Date();
        end_time   = new Date();
      }
       start_time = universalFunctions.convertUtcDateToLocalDate(start_time, data.timezone );
       end_time   = universalFunctions.convertUtcDateToLocalDate(end_time, data.is_scheduled ? data.timezone: data.timezone);

      let summary        = data.summary || "New Meeting";
      let timeZone       = data.timezone;
     
      let attendessArr = [];
      if(!data.is_scheduled){
          attendessArr.push({"email": "fugu.chat@yopmail.com"});
      }else{
        for(let i = 0; i < attendeesDetails.length; i++){
          let obj = {"email": attendeesDetails[i].emails};
          attendessArr.push(obj); 
        }
      }
      var request = {
        'summary'    : summary,
        'location'   : "",
        'description': description,
        'start'      : {
          'dateTime': start_time,
          'timeZone': "Asia/Calcutta",
        },
        'end': {
          'dateTime': end_time,
          'timeZone': "Asia/Calcutta",
        },
        "conferenceData": {
          "createRequest": {
            "requestId": Math.random().toString(36).substring(2)
          }
        },
        'attendees': attendessArr,
      };
      const calendar = google.calendar({ version: 'v3', auth });
      calendar.events.insert({
        auth      : auth,
        calendarId: 'primary',
        conferenceDataVersion: 1,
        resource  : request
      },async function (err, event) {
        calendarDao.insertGoogleCalendarLogs(logHandler, {
          event     : constants.GOOGLE_CALENDAR_EVENTS.ADD_EVENT,
          request   : JSON.stringify(request),
          response  : err ? JSON.stringify(err): JSON.stringify(event.data),
          user_id   : data.userInfo.user_id
        });
        if (err) {
          return reject(err);
        }
        await calendarDao.insertGoogleCalendarMeetings(logHandler,{
          user_id       : data.userInfo.user_id,
          event_id      : event.data.id,
          is_scheduled  : data.is_scheduled,
          start_datetime: start_time,
          end_datetime  : end_time,
          attendees     : JSON.stringify(attendessArr)
        })
        return resolve(event.data);
      });
    } catch (error) {
      return reject(error);
    }
  })
}


/**
 * @param {Object} credentials 
 * @param {Object} token 
 */
function getOAuthInstance(token, payload, credentials) {
  try{
    let creds = JSON.parse(credentials.google_creds);
    let client_id = creds.googleWebClientId;
    let client_secret = creds.client_secret;

    let redirect_uris =  creds.app_redirect_url;
    if (payload.device_type == constants.enumDeviceType.WEB) {
      redirect_uris = config.get("frontEndUrl") + "/oauth_sucess";
    }
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }catch(error){
    throw error;
  }
}

/**
 * delete an event from user's calendar.
 * @param {Object} logHandler {module, api} refernce to module and api
 * @param {Object} auth {google.auth.OAuth2} An authorized OAuth2 client.
 * @param {Object} data {calendar_id, event_id} An object containing variables
 * event_id    => id of event to be deleted
 * calendar_id => calendar id from event to be fetched "primary" by default
 **/
function deleteEvent(logHandler, data, auth) {
  return new Promise(async (resolve, reject) => {
    try {
      let calendar_id =  "primary";
      let event_id    = data.event_id;
      const params = {
        calendarId: calendar_id,
        eventId   : event_id,
      };
      const calendar = google.calendar({ version: 'v3', auth });
      let  result   = await calendar.events.delete(params);
      return resolve(result);
    } catch (error) {
      return resolve(error);
    }
  });
}