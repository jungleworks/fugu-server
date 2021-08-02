/**
 * Created by ashishprasher on 11/01/18.
 */

var Joi                                         = require('joi');
var _                                           = require('underscore');

var logging                                     = require('./../../../routes/logging');
var responses                                   = require('./../../../routes/responses');
var newResponses                                = require('./../../../routes/newResponses');
var validator                                   = require('./../../../validators/validator');

var apiReferenceModule                          = "auth";
var workSpaceRegex                              = /^[a-zA-Z0-9_-]*$/;
var workSpaceMinLength                          = 4;
var workSpaceMaxLength                          = 30;
var passwordMinLength                           = 6;
var passwordRegex                               = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*\?\<\>\,\.;\:\"\'\[\\-\_\+\=\{/(\\]\\}\\)\|\~\`])(?=.{8,})");
var ipConfig                                    = Joi.object().keys({
  country_code  : Joi.string().optional().allow(""),
  continent_code: Joi.string().optional().allow(""),
  region_code   : Joi.string().optional().allow("")
});

exports.authenticateUser                        = authenticateUser;
exports.authenticateAccessToken                 = authenticateAccessToken;
exports.getUserDetail                           = getUserDetail;
exports.updateUserDetail                        = updateUserDetail;
exports.jungleRegisterUser                      = jungleRegisterUser;
exports.jungleLogin                             = jungleLogin;
exports.verifyPassword                          = verifyPassword;


function authenticateUser(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "authenticateUser"
    };
    var schema =  validator.authJoiObject().keys({
        email               : Joi.string().email().required(),
        password            : Joi.string().required(),
        registration_type   : Joi.number().optional()
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        next();
    }
}

function authenticateAccessToken(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "authenticateAccessToken"
    };
    var schema =  validator.authJoiObject().keys({
        access_token        : Joi.string().required(),
        user_id             : Joi.number().positive().optional(),
        registration_type   : Joi.number().optional()
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        next();
    }
}

function getUserDetail(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "getUserDetail"
    };
    var schema =  validator.authJoiObject().keys({
        field_names         : Joi.string().required(),
        user_id             : Joi.number().positive().optional(),
        email               : Joi.string().email().optional(),
        email_array         : Joi.array().optional(),
        access_token        : Joi.string().optional(),
        registration_type   : Joi.number().optional(),
        dispatcher_user_id  : Joi.number().optional()
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        if(!req.body.user_id && !req.body.email && !req.body.access_token && !req.body.email_array && !req.body.dispatcher_user_id){
            return responses.parameterMissingResponse(res);
        }
        next();
    }
}

function updateUserDetail(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "updateUserDetail"
    };
    var schema =  validator.authJoiObject().keys({
        user_id          : Joi.number().positive().required(),
        updates          : Joi.object().required()
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        next();
    }
}

function jungleRegisterUser(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "jungleRegisterUser"
    };

  (req.body.source)     ?  req.body.source = req.body.source.toString() : 0;
  (req.body.medium)     ?  req.body.medium = req.body.medium.toString() : 0;

    var schema =  validator.authJoiObject().keys({
      email                : Joi.string().email({minDomainAtoms: validator.emailMinDomainAtoms}).trim().required(),
      username             : Joi.string().required(),
      first_name           : Joi.string().required(),
      last_name            : Joi.string().optional().allow(""),
      password             : Joi.string().min(passwordMinLength).required(),
      phone                : Joi.string().required(),
      timezone             : Joi.number().required(),
      country_phone_code   : Joi.string().required(),
      company_address      : Joi.string().required(),
      company_latitude     : Joi.string().required(),
      company_longitude    : Joi.string().required(),
      terms_and_conditions : Joi.number().optional().valid(0,1),
      language             : Joi.string().optional(),
      ipconfig             : ipConfig.required(),
      company_name         : Joi.string().optional().allow(""),
      source               : Joi.string().optional().allow(""),
      medium               : Joi.string().optional().allow(""),
      business_type        : Joi.number().optional().allow(""),
      previous_page        : Joi.string().optional().allow(""),
      referrer             : Joi.string().optional().allow(""),
      old_source           : Joi.string().optional().allow(""),
      old_medium           : Joi.string().optional().allow(""),
      incomplete           : Joi.string().optional().allow(""),
      vertical             : Joi.string().optional().allow(""),
      ad_campaign_name     : Joi.string().optional().allow(""),
      vertical_page        : Joi.string().optional().allow(""),
      gclid                : Joi.string().optional().allow(""),
      ctaType              : Joi.string().optional().allow(""),
      utm_term             : Joi.string().optional().allow(""), 
      lead_allocation      : Joi.number().optional().valid(0,1),
      utm_campaign         : Joi.string().optional().allow(""),
      web_referrer         : Joi.string().optional().allow(""),
      old_utm_campaign     : Joi.string().optional().allow(""),
      verification_status  : Joi.number().optional(),
      custom_fields        : Joi.any().optional(),
      dispatcher_user_id   : Joi.number().optional(),
      is_merchant          : Joi.number().optional(),
      message              : Joi.string().optional().allow(""),
      url                  : Joi.string().optional().allow(""),
      session_ip           : Joi.string().optional().allow(""),
      utm_source           : Joi.string().optional().allow(""),
      country_code         : Joi.string().optional().allow(""),
      continent_code       : Joi.string().optional().allow(""),
      region_code          : Joi.string().optional().allow(""),
      productname          : Joi.string().optional().allow(""),
      uber_for             : Joi.string().optional().allow(""),
      is_dispatcher        : Joi.number().optional(),
      utm_content          : Joi.string().optional().allow(""),
      utm_keyword          : Joi.string().optional().allow(""),
      utm_lead             : Joi.string().optional().allow(""),
      hippo_domain         : Joi.string().optional().allow(""),
      hippo_name           : Joi.string().optional().allow(""),
      device_type          : Joi.number().optional(),
      business_usecase     : Joi.string().optional().allow(""),
      user_view            : Joi.number().optional().default(0),
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        next();
    }
}

function jungleLogin(req, res, next) {
    req.apiReference = {
        module : apiReferenceModule,
        api : "jungleLogin"
    };
    var schema =  validator.authJoiObject().keys({
        email               : Joi.string().email().required(),
        password            : Joi.string().required()
    });

    var validFields = validator.validateFields(req.apiReference, req.body, res, schema);
    if(validFields){
        next();
    }
}

function verifyPassword(req, res, next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "verifyPassword"
  };
  var schema = validator.authJoiObject().keys({
            password: Joi.string().regex(passwordRegex).required()
  });

  var validFields = validator.validateFields(req.apiReference, req.body, res, schema, 'Password is not valid');
  if (validFields) {
    next();
  }
}
