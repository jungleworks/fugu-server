
const Joi                                       = require('joi');
const validator                                 = require('./../../../validators/validator');
const constants                                 = require('./../../../routes/constants');

var apiReferenceModule                          = "otpAuthentication";

exports.sendOtp                                = sendOtp;
exports.verifyOtp                              = verifyOtp;


const ipConfig                                    = Joi.object().keys({
    country_code  : Joi.string().optional().allow(""),
    continent_code: Joi.string().optional().allow(""),
    region_code   : Joi.string().optional().allow("")
});



function sendOtp(req,res,next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "sendOtp"
  };
  (req.body.source) ? req.body.source = req.body.source.toString() : 0;
  (req.body.medium) ? req.body.medium = req.body.medium.toString() : 0;
  let schema      = validator.authJoiObject().keys({
    phone       : Joi.string(),
    email       : Joi.string(),
    app_type    : Joi.string().optional(),
    message_text: Joi.string().optional()
  }).or('phone', 'email');
  let validFields = validator.validateFields(req.apiReference, req.body, res, schema);
  if(validFields) {
    next();
  }
}



function verifyOtp(req,res,next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "verifyOtp"
  };
  let schema       = validator.authJoiObject().keys({
    phone                : Joi.string(),
    email                : Joi.string(),
    otp                  : Joi.number().required(),
    country_phone_code   : Joi.string().required(),
    timezone             : Joi.number().required(),
    ipconfig             : ipConfig.required(),
    last_name            : Joi.string().optional().allow(""),
    terms_and_conditions : Joi.number().optional().valid(0,1),
    language             : Joi.string().optional(),
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
    company_address      : Joi.string().optional(),
    company_latitude     : Joi.string().optional(),
    company_longitude    : Joi.string().optional(),
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
    utm_lead             : Joi.string().optional().allow("")
  }).or('phone', 'email');
  let validFields  = validator.validateFields(req.apiReference, req.body, res, schema);
  if(validFields) {
    next();
  }
}