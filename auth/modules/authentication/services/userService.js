/**
 * Created by ashishprasher on 12/01/18.
 */

var Promise                                     = require('bluebird');
var _                                           = require('underscore');
const request                                   = require("request");

var dbHandler                                   = require('./../../../routes/mysqlLib');
var logging                                     = require('./../../../routes/logging');
var constants                                   = require('./../../../routes/constants');
const httpService                               = require("../../../services/httpService");
var marketingService                            = require('./../../marketing/services/marketingService');


exports.createUser                              = createUser;
exports.getUser                                 = getUser;
exports.updateUser                              = updateUser;
exports.isInternalUser                          = isInternalUser;
exports.isTestUser                              = isTestUser;
exports.insertUserDetails                       = insertUserDetails;

function insertUserDetails(apiReference, opts) {
  return new Promise((resolve, reject)=>{
    var setObj = {};
    (opts.device_type)                        ? setObj.device_type = opts.device_type : 0;
    (opts.hippo_name)                         ? setObj.hippo_name = opts.hippo_name : null;
    (opts.hippo_domain)                       ? setObj.hippo_domain = opts.hippo_domain : null;

    if(_.isEmpty(setObj)) {
      return resolve();
    }
    setObj.user_id = opts.user_id;

    var query = "INSERT INTO tb_user_details SET ?";
    var values= [setObj];
    dbHandler.mysqlQueryPromise(apiReference, "insertUserDetails", query, values).then((result) => {
      resolve(result.insertId);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUser(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var setObj = {};

    setObj.internal_user      = opts.internal_user;
    setObj.registration_type  = opts.registration_type || 2;
    setObj.layout_type        = opts.layout_type || 0;
    setObj.business_type      = opts.business_type || 1;
    setObj.dashboard_version  = opts.dashboard_version || 2;

    (opts.source)                        ? setObj.source = opts.source : 0;
    (opts.medium)                        ? setObj.medium = opts.medium : 0;
    (opts.first_name)                    ? setObj.first_name = opts.first_name : 0;
    (opts.last_name)                     ? setObj.last_name = opts.last_name : 0;
    (opts.country_phone_code)            ? setObj.country_phone_code = opts.country_phone_code : 0;
    (opts.company_address)               ? setObj.company_address = opts.company_address : 0;
    (opts.setup_wizard_step)             ? setObj.setup_wizard_step = opts.setup_wizard_step : 0;
    (opts.phone)                         ? setObj.phone = opts.phone : 0;
    (opts.username)                      ? setObj.username = opts.username : 0;
    (opts.company_name)                  ? setObj.company_name = opts.company_name : 0;
    (opts.access_token)                  ? setObj.access_token = opts.access_token : 0;
    (opts.email)                         ? setObj.email = opts.email : 0;
    (opts.password)                      ? setObj.password = opts.password : 0;
    (opts.verification_token)            ? setObj.verification_token = opts.verification_token : 0;
    ("verification_status" in opts)      ? setObj.verification_status = opts.verification_status : 0;
    ("is_merchant" in opts)              ? setObj.is_merchant = opts.is_merchant : 0;
    (opts.timezone)                      ? setObj.timezone = opts.timezone : 0;
    (opts.company_latitude)              ? setObj.company_latitude = opts.company_latitude : 0;
    (opts.company_longitude)             ? setObj.company_longitude = opts.company_longitude : 0;
    (opts.workspace)                     ? setObj.workspace = opts.workspace : 0;
    (opts.terms_and_conditions)          ? setObj.terms_and_conditions = opts.terms_and_conditions : 0;
    (opts.language)                      ? setObj.language = opts.language : 0;
    (opts.custom_fields)                 ? setObj.custom_fields = opts.custom_fields : 0;
    (opts.dispatcher_user_id)            ? setObj.dispatcher_user_id = opts.dispatcher_user_id : 0;
    (opts.fb_id)                         ? setObj.fb_id = opts.fb_id : 0;
    (opts.google_id)                     ? setObj.google_id = opts.google_id : 0;
    (opts.is_dispatcher)                 ? setObj.is_dispatcher = opts.is_dispatcher : 0;
    (opts.apple_user_identifier)         ? setObj.apple_user_identifier = opts.apple_user_identifier :0;
    (opts.user_view)                     ? setObj.user_view = opts.user_view : 0;
    var query = "INSERT INTO tb_users SET ?, last_login_datetime=NOW()";
    var values= [setObj];
    dbHandler.mysqlQueryPromise(apiReference, "insertUser", query, values).then((result) => {
      resolve(result.insertId);
    }, (error) => {
      reject(error);
    });
  });
}

function createUser(apiReference, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      var user_id = yield insertUser(apiReference, opts);
      opts.main_user_id   = user_id;
      opts.marketing_user = 0;
      var marketingUser = yield marketingService.getMarketingUser(apiReference, {email: opts.email});
      if(_.isEmpty(marketingUser)){
        yield marketingService.insertMarketingUser(apiReference, opts);
      }
      return user_id;
    })().then((data) => {
      logging.log(apiReference, {EVENT: "createUser Success", DATA: data});
      resolve(data);
    }, (error) => {
      logging.logError(apiReference, {EVENT: "createUser Error", ERROR: error});
      reject(error);
    });
  });
}

function getUser(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [];
    var query  = "SELECT ";
    if (opts.fields) {
      query += opts.fields;
    } else {
      query += "*"
    }
    query += " FROM tb_users WHERE 1=1 ";

    if (opts.user_id) {
      query += " AND user_id = ? ";
      values.push(opts.user_id);
    }
    if (opts.access_token) {
      query += " AND access_token = ? ";
      values.push(opts.access_token);
    }
    if (opts.email) {
      query += " AND email = ? ";
      values.push(opts.email);
    }
    if (opts.email_array) {
      query += " AND email IN (?) ";
      values.push(opts.email_array);
    }
    if (opts.verification_token) {
      query += " AND verification_token = ? ";
      values.push(opts.verification_token);
    }
    if (opts.lead_id) {
      query += " AND lead_id = ? ";
      values.push(opts.lead_id);
    }
    if(opts.fb_id) {
      query += " AND fb_id = ? ";
      values.push(opts.fb_id);
    }
    if(opts.apple_user_identifier) {
      query += " AND apple_user_identifier = ? ";
      values.push(opts.apple_user_identifier);
    }
    if(opts.google_id) {
      query += " AND google_id = ? ";
      values.push(opts.google_id);
    }
    if(opts.hasOwnProperty('is_dispatcher'))
    {
      query += " AND is_dispatcher = ? ";
      values.push(opts.is_dispatcher);
    }
    if(opts.hasOwnProperty('is_merchant'))
    {
      query += " AND is_merchant = ? ";
      values.push(opts.is_merchant);
    }
    if(opts.dispatcher_user_id)
    {
      query += " AND dispatcher_user_id = ? ";
      values.push(opts.dispatcher_user_id);
    }
    if(!opts.email_array && !opts.dispatcher_user_id){
      query += " LIMIT 1";
    }
    dbHandler.mysqlQueryPromise(apiReference, "getUser", query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUser(apiReference, whereClause, update_fields) {
  return new Promise((resolve, reject) => {
    var length;
    var object_keys;
    var columns = [];
    var values  = [];
    var query   = "UPDATE tb_users SET ";
    object_keys = Object.keys(update_fields);
    length      = object_keys.length;
    for (var i = 0; i < length; i++) {
      if (object_keys[i] == 'last_login_datetime') {
        columns.push("`" + object_keys[i] + "` = NOW() ");
      } else if (object_keys[i] == 'password') {
        columns.push("`" + object_keys[i].trim() + "` = ? ");
        values.push(update_fields[object_keys[i]]);
      } else if (object_keys[i] == 'clear_social_id') {
        columns.push("`" + "fb_id" + "` = ? ");
        columns.push("`" + "google_id" + "` = ? ");
        values.push(null);
        values.push(null);
      } else if (object_keys[i]) {
        columns.push("`" + object_keys[i].trim() + "` = ? ");
        values.push(update_fields[object_keys[i]]);
      }
    }
    query += " " + columns.join(", ") + "";
    query += " WHERE 1=1 ";

    if (whereClause.user_id) {
      query += " AND user_id = ? ";
      values.push(whereClause.user_id);
    }
    if (whereClause.access_token) {
      query += " AND access_token = ? ";
      values.push(whereClause.access_token);
    }
    if (whereClause.email) {
      query += " AND email = ? ";
      values.push(whereClause.email);
    }

    query += " LIMIT 1";
    dbHandler.mysqlQueryPromise(apiReference, "updateUser", query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function isInternalUser(email) {
  if(!email){
    return false;
  }
  var flag = false;
  constants.internalEmailDomains.forEach(function (value) {
    if (email.indexOf(value) != -1) {
      flag = true;
      return;
    }
  });
  return flag;
}

function isTestUser(email) {
  if(!email){
    return false;
  }
  var flag = false;
  constants.testEmailDomains.forEach(function (value) {
    if (email.indexOf(value) != -1) {
      flag = true;
      return;
    }
  });
  return flag;
}
