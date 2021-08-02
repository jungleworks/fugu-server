const Promise             = require('bluebird');
const _                   = require('underscore');
const dbHandler           = require('../database').dbHandler;

exports.insertNew                         = insertNew;
exports.getInfo                           = getInfo;
exports.updateEmail                       = updateEmail;

function getInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select * from users where 1=1`;
    let values = [];
    if(payload.email) {
      query += " and email= ? ";
      values.push(payload.email);
    }

    if(payload.user_id) {
      query += " and user_id= ? ";
      values.push(payload.user_id);
    }

    if(payload.access_token) {
      query += " and access_token= ? ";
      values.push(payload.access_token);
    }

    if(payload.contact_number) {
      query += " and contact_number= ? ";
      values.push(payload.contact_number);
    }

    if(payload.emails) {
      query += " and email IN (?) ";
      values.push(payload.emails);
    }

    if(payload.contact_numbers) {
      query += " and contact_number IN (?) ";
      values.push(payload.contact_numbers);
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
    let userInfo = {};
      payload.email ? userInfo.email = payload.email : 0;
      payload.access_token ? userInfo.access_token =  payload.access_token : 0;
      payload.user_name ? userInfo.user_name =  payload.user_name : 0;
      payload.password ? userInfo.password = payload.password : 0;
      payload.business_id ? userInfo.business_id = payload.business_id : 0;
      payload.full_name ? userInfo.full_name = payload.full_name : 0;
      payload.time_zone ? userInfo.time_zone = payload.time_zone : 0;
      payload.manager_user_id ? userInfo.manager_user_id = payload.manager_user_id : 0;
      payload.businessInfo.work_start_time ? userInfo.shift_start_time = payload.businessInfo.work_start_time : 0;
      payload.businessInfo.work_hours ? userInfo.work_hours = payload.businessInfo.work_hours : 0;
      payload.businessInfo.work_days ?  userInfo.work_days = payload.businessInfo.work_days : 0;
      payload.businessInfo.config ? userInfo.config = payload.businessInfo.config : 0;

    let queryObj = {
      query : query,
      args  : [userInfo],
      event : "Inserting new user"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      userInfo.userId = result.insertId;
      resolve(userInfo);
    }, (error) => {
      reject(error);
    });
  });
}

function updateEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` Update users set ? where email = ?`;
    let updateObj = {};
    payload.new_email               ? updateObj.email = payload.new_email : 0;

    updateObj.updated_at = new Date();
    let queryObj = {
      query : query,
      args  : [updateObj, payload.old_email],
      event : "updating user info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
