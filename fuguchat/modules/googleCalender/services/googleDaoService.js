const dbHandler         = require('../../../database').dbHandler;
const slaveDbHandler    = require('../../../database').slaveDbHandler;

exports.insertGoogleTokenDetails     = insertGoogleTokenDetails;
exports.getGoogleTokenDetails        = getGoogleTokenDetails;
exports.insertGoogleCalendarLogs     = insertGoogleCalendarLogs;
exports.insertGoogleCalendarMeetings = insertGoogleCalendarMeetings;


function insertGoogleTokenDetails(logHandler, opts){
    return new Promise((resolve, reject)=> {
        let sql = `INSERT INTO google_access_token(user_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?`;

       let queryObj = {
        query  : sql,
        args   : [opts.user_unique_key, opts.token, opts.token],
        event  : "insertGoogleTokenDetails"
      }  
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
       return resolve(result);
      }, (error) => {
        return reject(error);
      });         
    })
}


function getGoogleTokenDetails(logHandler, opts){
    return new Promise((resolve, reject)=> {
        let sql = `SELECT * FROM google_access_token WHERE user_id = ?`;

       let queryObj = {
        query  : sql,
        args   : [opts.user_unique_key],
        event  : "getGoogleTokenDetails"
      }
        slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
       return resolve(result);
      }, (error) => {
        return reject(error);
      });         
    })
}


function insertGoogleCalendarLogs(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `INSERT INTO google_calender_logs(user_id, request, response, event) VALUES(?, ?, ?, ?)`;

   let queryObj = {
    query  : sql,
    args   : [opts.user_id, opts.request, opts.response, opts.event],
    event  : "insertGoogleCalendarLogs"
  }  
  dbHandler.executeQuery(logHandler, queryObj).then((result) => {
   return resolve(result);
  }, (error) => {
    return resolve(error);
  });         
})
}

function insertGoogleCalendarMeetings(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let sql = `INSERT INTO google_calendar_meetings(user_id, event_id, start_datetime, end_datetime, attendees, is_scheduled)
                 VALUES(?, ?, ?, ?, ?, ?)`;
    let queryObj = {
     query  : sql,
     args   : [opts.user_id, opts.event_id, opts.start_datetime, opts.end_datetime, opts.attendees, opts.is_scheduled],
     event  : "insertGoogleCalendarMeetings"
   } 
   dbHandler.executeQuery(logHandler, queryObj).then((result) => {
    return resolve(result);
   }, (error) => {
     return reject(error);
   });                   
 })
}