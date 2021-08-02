

const dbHandler            = require('../../../database').dbHandler;
const slaveDbHandler       = require('../../../database').slaveDbHandler;

exports.insertMeetingDetails    = insertMeetingDetails;
exports.getMeetings             = getMeetings;
exports.updateMeetingDetails    = updateMeetingDetails;
exports.getMeetingsForWeekDays  = getMeetingsForWeekDays;


function insertMeetingDetails (logHandler, opts) {
    return new Promise(async (resolve, reject)=> {
      let query  = "INSERT INTO tb_schedule_meetings SET ?";
      let queryObj = {
        query,
        args : [opts],
        event: "insertMeetingDetails"
      };
      try {
        const result = await dbHandler.executeQuery(logHandler, queryObj);
        return resolve(result)
      } catch(error) {
         return reject(error);
      }
    })
  }

function getMeetings(logHandler, opts){
  return new Promise(async(resolve, reject)=> {
    let values = [];
    let sql = `SELECT meet_id AS meet_id,user_id,workspace_id,title,room_id,start_datetime,end_datetime,reminder_time,meet_type,frequency,active_days,attendees,status 
               FROM tb_schedule_meetings WHERE 1 = 1 AND is_deleted = 0 `;

    if(opts.meet_id){
      sql += ` AND meet_id = ? `;
      values.push(parseInt(opts.meet_id));
    }

    if(opts.user_id){
      sql += ` AND ( JSON_CONTAINS(attendees, '?') OR user_id = ? )`;
      values.push(parseInt(opts.user_id));
      values.push(parseInt(opts.user_id));
    }
    if(opts.start_datetime){
      sql += ` AND end_datetime >= ?`;
      values.push(opts.start_datetime);
    }
    
    if(opts.reminder_cron && opts.start_datetime && opts.end_datetime){
      sql += ` AND reminder_datetime > ? AND reminder_datetime < ?`;
      values.push(opts.start_datetime, opts.end_datetime);
    }

    if(opts.order_by){
      sql += ` ORDER BY start_datetime ASC`;
    }

    let queryObj = {
      query: sql,
      args : values,
      event: "getMeetings"
    };

    //console.log("getMeetings: ", {queryObj: queryObj})

    try {
      const result = await slaveDbHandler.executeQuery(logHandler, queryObj);
      return resolve(result)
    } catch(error) {
       return reject(error);
    }
  })
}  




function getMeetingsForWeekDays(logHandler, opts){
  return new Promise(async(resolve, reject)=> {
    let values = [];
    let sql = `SELECT meet_id AS meet_id,user_id,workspace_id,title,room_id,start_datetime,end_datetime,reminder_time,meet_type,frequency,active_days,attendees,status 
               FROM tb_schedule_meetings WHERE 1 = 1 AND is_deleted = 0 AND frequency IN(2,3,4) `;

    if(opts.meet_id){
      sql += ` AND meet_id = ? `;
      values.push(parseInt(opts.meet_id));
    }

    if(opts.user_id){
      sql += ` AND ( JSON_CONTAINS(attendees, '?') OR user_id = ? )`;
      values.push(parseInt(opts.user_id));
      values.push(parseInt(opts.user_id));
    }
    if(opts.start_datetime){
      sql += ` AND end_datetime < ?`;
      values.push(opts.start_datetime);
    }

    if(opts.reminder_cron && opts.start_datetime && opts.end_datetime){
      sql += ` AND reminder_datetime > ? AND reminder_datetime < ?`;
      values.push(opts.start_datetime, opts.end_datetime);
    }

    if(opts.order_by){
      sql += ` ORDER BY start_datetime ASC`;
    }

    let queryObj = {
      query: sql,
      args : values,
      event: "getMeetings"
    };

    //console.log("getMeetings: ", {queryObj: queryObj})

    try {
      const result = await slaveDbHandler.executeQuery(logHandler, queryObj);
      return resolve(result)
    } catch(error) {
       return reject(error);
    }
  })
}  

function updateMeetingDetails(logHandler, opts){
  try{
    let meet_id = opts.meet_id;
    delete opts.meet_id;
    let query = "UPDATE tb_schedule_meetings SET ? WHERE meet_id = ?";
    let queryObj = {
      query,
      args : [opts, meet_id],
      event: "updateMeetingDetails"
    };

    //console.log("updateMeetingDetails obj: ", queryObj)

    dbHandler.executeQuery(logHandler, queryObj);
  }catch(error){
    throw error
  }
}