/**
 * Created by ashishprasher on 12/02/18.
 */

var Promise                                     = require('bluebird');
var request                                     = require('request');
const _                                         = require('underscore');
var dbHandler                                   = require('./../../../routes/mysqlLib');
var logging                                     = require('./../../../routes/logging');
var constants                                   = require('./../../../routes/constants');
const userService                               = require("../../authentication/services/userService")
const newResponses                              = require('../../../routes/newResponses')

exports.insertMarketingUser                     = insertMarketingUser;
exports.getMarketingUser                        = getMarketingUser;



function insertMarketingUser(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var setObj = {};

    setObj.internal_user      = opts.internal_user;
    setObj.registration_type  = opts.registration_type;
    setObj.layout_type        = opts.layout_type || 0;
    setObj.business_type      = opts.business_type || 1;
    setObj.dashboard_version  = opts.dashboard_version || 0;
    setObj.marketing_user     = 1;

    (opts.source)             ? setObj.source = opts.source : 0;
    (opts.medium)             ? setObj.medium = opts.medium : 0;
    (opts.first_name)         ? setObj.first_name = opts.first_name : 0;
    (opts.last_name)          ? setObj.last_name = opts.last_name : 0;
    (opts.country_phone_code) ? setObj.country_phone_code = opts.country_phone_code : 0;
    (opts.company_address)    ? setObj.company_address = opts.company_address : 0;
    (opts.setup_wizard_step)  ? setObj.setup_wizard_step = opts.setup_wizard_step : 0;
    (opts.phone)              ? setObj.phone = opts.phone : 0;
    (opts.username)           ? setObj.username = opts.username : 0;
    (opts.company_name)       ? setObj.company_name = opts.company_name : 0;
    (opts.access_token)       ? setObj.access_token = opts.access_token : 0;
    (opts.email)              ? setObj.email = opts.email : 0;
    (opts.password)           ? setObj.password = opts.password : 0;
    (opts.verification_token) ? setObj.verification_token = opts.verification_token : 0;
    (opts.verification_status)? setObj.verification_status = opts.verification_status : 0;
    (opts.timezone)           ? setObj.timezone = opts.timezone : 0;
    (opts.company_latitude)   ? setObj.company_latitude = opts.company_latitude : 0;
    (opts.company_longitude)  ? setObj.company_longitude = opts.company_longitude : 0;
    (opts.message)            ? setObj.message = opts.message : 0;
    (opts.url)                ? setObj.url = opts.url : 0;
    (opts.session_ip)         ? setObj.session_ip = opts.session_ip : 0;
    (opts.utm_campaign)       ? setObj.utm_campaign = opts.utm_campaign : 0;
    (opts.utm_source)         ? setObj.utm_source = opts.utm_source : 0;
    (opts.utm_medium)         ? setObj.utm_medium = opts.utm_medium : 0;
    (opts.utm_term)           ? setObj.utm_term = opts.utm_term : 0;
    (opts.utm_lead)           ? setObj.utm_lead = opts.utm_lead : 0;
    (opts.utm_content)        ? setObj.utm_content = opts.utm_content : 0;
    (opts.utm_keyword)        ? setObj.utm_keyword = opts.utm_keyword : 0;
    (opts.web_referrer)       ? setObj.web_referrer = opts.web_referrer : 0;
    (opts.referrer)           ? setObj.referrer = opts.referrer : 0;
    (opts.old_source)         ? setObj.old_source = opts.old_source : 0;
    (opts.old_medium)         ? setObj.old_medium = opts.old_medium : 0;
    (opts.gclid)              ? setObj.gclid = opts.gclid : 0;
    (opts.previous_page)      ? setObj.previous_page = opts.previous_page : 0;
    (opts.vertical_page)      ? setObj.vertical_page = opts.vertical_page : 0;
    (opts.ctaType)            ? setObj.cta_type = opts.ctaType : 0;
    (opts.main_user_id)       ? setObj.main_user_id = opts.main_user_id : 0;
    (opts.country_code)       ? setObj.country_code = opts.country_code : 0;
    (opts.continent_code)     ? setObj.continent_code = opts.continent_code : 0;
    (opts.region_code)        ? setObj.region_code = opts.region_code : 0;
    (opts.productname)        ? setObj.productname = opts.productname : 0;
    (opts.uber_for)           ? setObj.uber_for = opts.uber_for : 0;
    (opts.old_utm_campaign)   ? setObj.old_utm_campaign = opts.old_utm_campaign : 0;
    (opts.designation)        ? setObj.designation = opts.designation : 0;
    (opts.employee_count)     ? setObj.employee_count = opts.employee_count : 0;
    (opts.language)           ? setObj.language = opts.language : 0;
    (opts.custom_fields)      ? setObj.custom_fields = opts.custom_fields : 0;
    (opts.is_dispatcher)      ? setObj.is_dispatcher = opts.is_dispatcher : 0;

    var query = "INSERT INTO tb_marketing_users SET ?, last_login_datetime=NOW()";
    var values= [setObj];
    dbHandler.mysqlQueryPromise(apiReference, "insertMarketingUser", query, values).then((result) => {
      resolve(result.insertId);
    }, (error) => {
      reject(error);
    });
  });
}

function getMarketingUser(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [];
    var query = "SELECT ";
    if(opts.fields){
      query += opts.fields;
    } else
    {
      query += "*"
    }
    query += " FROM tb_marketing_users WHERE 1=1 ";

    if(opts.user_id){
      query += " AND user_id = ? ";
      values.push(opts.user_id);
    }
    if(opts.access_token){
      query += " AND access_token = ? ";
      values.push(opts.access_token);
    }
    if(opts.email){
      query += " AND email = ? ";
      values.push(opts.email);
    }
    if(opts.verification_token){
      query += " AND verification_token = ? ";
      values.push(opts.verification_token);
    }
    if(opts.workspace){
      query += " AND workspace = ? ";
      values.push(opts.workspace);
    }

    query += " LIMIT 1";
    dbHandler.mysqlQueryPromise(apiReference, "getMarketingUser" , query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}