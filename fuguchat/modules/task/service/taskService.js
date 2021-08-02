
const dbHandler                         = require('../../../database').dbHandler;
const slaveDbHandler                    = require('../../../database').slaveDbHandler;
const { logger }                        = require('../../../libs/pino_logger');
const _                                 = require('underscore');

exports.insertTaskDetails               = insertTaskDetails;
exports.getAssignedTask                 = getAssignedTask;
exports.insertStudentTaskMapping        = insertStudentTaskMapping;
exports.updateStudentTaskMappingDetails = updateStudentTaskMappingDetails;
exports.getStudentTaskMapping           = getStudentTaskMapping;
exports.getTaskDetails                  = getTaskDetails;
exports.getStudentDetails               = getStudentDetails;
exports.updateTaskDetails               = updateTaskDetails;

function insertTaskDetails (logHandler, opts) {
    return new Promise(async (resolve, reject)=> {
      let query  = "INSERT INTO tb_task_details SET ?";
      let queryObj = {
        query,
        args : [opts],
        event: "insertTaskDetails"
      };

      //console.log("insertTaskDetails: ", queryObj)
      try {
        const result = await dbHandler.executeQuery(logHandler, queryObj);
        return resolve(result)
      } catch(error) {
         return reject(error);
      }
    })
  }

function getAssignedTask (logHandler, opts) {
    return new Promise(async (resolve, reject)=> {
      let values = [];  
      let query  = `SELECT * FROM tb_task_details WHERE  1 = 1 AND is_deleted = 0`
      
      if(opts.task_id){
        query += ` AND task_id = ?`;
        values.push(opts.task_id);
      }
      if(opts.channel_id){
        query += ` AND channel_id = ?`;
        values.push(opts.channel_id)
      }
      if(opts.workspace_id){
        query += ` AND workspace_id = ?`;
        values.push(opts.workspace_id);
      }
      if(opts.assigner_user_id){
        query += ` AND assigner_user_id = ?`;
        values.push(opts.assigner_user_id);
      }
      if(opts.month){
        query += ` AND month(start_datetime) = ? `;
        values.push(opts.month);
      }
      if(opts.year){
        query += ` AND year(start_datetime) = ? `;
        values.push(opts.year);
      }
      if(opts.reminder_cron && opts.start_datetime && opts.end_datetime){
        query += ` AND reminder_datetime > ? AND reminder_datetime < ?`;
        values.push(opts.start_datetime, opts.end_datetime);
      }

      let queryObj = {
        query,
        args : values,
        event: "getAssignedTask"
      };
      try {
        //console.log("QUERY OBJ-------->", queryObj);
        const result = await slaveDbHandler.executeQuery(logHandler, queryObj);
        return resolve(result)
      } catch(error) {
        throw new Error(error);
      }
    })
  }  

function insertStudentTaskMapping(logHandler, obj){
    return new Promise((resolve, reject)=> {
       let values = [];  
        let placeHolders = new Array(obj.user_ids.length).fill("(?,?)").join(', ');
        for (let i = 0; i < obj.user_ids.length; i++) {
          values = values.concat([obj.user_ids[i], obj.task_id]);
        }
      let query = `INSERT INTO tb_task_mapping (student_user_id,task_id) VALUES  ${placeHolders}`;
      let queryObj = {
        query: query,
        args: values,
        event: "insertStudentTaskMapping"
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    })
}  

function updateStudentTaskMappingDetails(logHandler, opts){
    return new Promise((resolve, reject)=> {
       let obj = {};
       let query = `UPDATE tb_task_mapping  SET ? WHERE task_id = ? AND student_user_id = ?`;
       
       opts.content         ? obj.content       = opts.content : 0;
       opts.task_work       ? obj.task_work     = JSON.stringify(opts.task_work) : 0;
       opts.is_completed    ? obj.is_completed  = opts.is_completed : 0;
       opts.muid            ? obj.muid          = opts.muid : 0;
      
       let queryObj = {
         query: query,
         args: [obj, opts.task_id, opts.student_user_id],
         event: "updateStudentTaskMapping"
       };
       dbHandler.executeQuery(logHandler, queryObj).then((result) => {
         resolve(result);
       }, (error) => {
         reject(error);
       });
     })
}

function getStudentTaskMapping(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let values = [];
    let sql = `SELECT task_id, student_user_id, content, task_work, is_completed, creation_datetime, updation_datetime as submission_datetime
                FROM tb_task_mapping WHERE 1`;

    if(opts.task_ids){
      sql += ` AND task_id IN (?)`;
      values.push(opts.task_ids);
    }
    if(opts.task_id){
      sql += ` AND task_id = ?`;
      values.push(opts.task_id);
    }
    if(opts.user_id){
      sql += ` AND student_user_id = ?`;
      values.push(opts.user_id);
    }
    if(opts.is_completed == 0 || opts.is_completed == 1){
      sql += ` AND is_completed = ?`;
      values.push(opts.is_completed);
    }
    let queryObj = {
      query: sql,
      args: values,
      event: "getStudentTaskMapping"
    };
    //console.log("QUERY OBJ-------->", queryObj);
      slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}


function getTaskDetails(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `SELECT 
                td.task_id,
                td.channel_id,
                td.assigner_user_id,
                td.title,
                td.description,
                td.start_datetime,
                td.end_datetime,
                td.reminder,
                stm.content,
                stm.task_work,
                ifnull(stm.is_completed, 0) AS is_completed,
                stm.updation_datetime AS submission_datetime
              FROM 
                tb_task_details td 
              LEFT JOIN 
                tb_task_mapping stm
              ON
                td.task_id = stm.task_id AND stm.student_user_id = ?
              WHERE 
                td.task_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.user_id, opts.task_id],
      event: "getTaskDetails"
    };
      slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function getStudentDetails(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let values = [opts.task_id];
     let sql = `SELECT 
                  utc.full_name,
                  utc.emails AS email, 
                  utc.user_thumbnail_image,
                  stm.student_user_id AS user_id, 
                  IFNULL(stm.is_completed, 0) AS is_completed
                FROM 
                  tb_task_mapping stm 
                INNER JOIN 
                  user_to_workspace utc  
                ON 
                  utc.user_id = stm.student_user_id 
                WHERE 
                  stm.task_id = ? `

     if(opts.student_user_id){
       sql += ` AND stm.student_user_id = ? `;
       values.push(opts.student_user_id);
     }             
     sql += `ORDER BY stm.is_completed`;
    let queryObj = {
      query: sql,
      args: values,
      event: "getTaskDetails"
    };
       slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });               
   })
}

async function updateTaskDetails(logHandler, opts) {
  try {

      let SQL = `UPDATE tb_task_details SET ? WHERE task_id = ? AND assigner_user_id = ?`;

      let updateObj = {};

      opts.hasOwnProperty('title')              ? updateObj.title               = opts.title              : 'NA';
      opts.hasOwnProperty('description')        ? updateObj.description         = opts.description        : 'NA';
      opts.hasOwnProperty('start_datetime')     ? updateObj.start_datetime      = opts.start_datetime     : 'NA';
      opts.hasOwnProperty('end_datetime')       ? updateObj.end_datetime        = opts.end_datetime       : 'NA';
      opts.hasOwnProperty('reminder')           ? updateObj.reminder            = opts.reminder           : 10;
      opts.hasOwnProperty('is_deleted')         ? updateObj.is_deleted          = opts.is_deleted         : 0;

      if (!opts.task_id || !opts.assigner_user_id || _.isEmpty(updateObj)) {
        return {valid: false}
      }

      let queryObj = {
        query: SQL,
        args: [updateObj, opts.task_id, opts.assigner_user_id],
        event: "updateTaskDetails"
      };

      await dbHandler.executeQuery(logHandler, queryObj);
      return {valid: true}
  }catch (error) {
    logger.error(logHandler, {EVENT: 'updateTaskDetails'}, {error: error});
    return {valid: false}
  }
}