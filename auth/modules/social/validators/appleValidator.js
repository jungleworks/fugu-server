
const Joi                                         = require('joi');
const validator                                   = require('./../../../validators/validator');

const apiReferenceModule                          = "social";
const constants                                   = require('./../../../routes/constants');


exports.jungleAppleConnect         = jungleAppleConnect;

const passwordMinLength                           = 6;

const ipConfig                                    = Joi.object().keys({
  country_code  : Joi.string().optional().allow(""),
  continent_code: Joi.string().optional().allow(""),
  region_code   : Joi.string().optional().allow("")
});



function jungleAppleConnect(req, res, next) {
  let apple_status=req.body.status || constants.SOCIAL_STATUS.LOGIN;
  let opts={};
  if(apple_status==constants.SOCIAL_STATUS.REGISTER)
  {
    req.apiReference = {
      module : apiReferenceModule,
      api    : "jungleRegisterUserUsingApple"
    };
    (req.body.source)     ?  req.body.source = req.body.source.toString() : 0;
    (req.body.medium)     ?  req.body.medium = req.body.medium.toString() : 0;

    opts={
      status          : Joi.number().optional(),
      email                : Joi.string().optional({minDomainAtoms: validator.emailMinDomainAtoms}).trim().optional(),
      username             : Joi.string().optional(),
      first_name           : Joi.string().optional(),
      last_name            : Joi.string().optional().allow(""),
      password             : Joi.string().min(passwordMinLength).optional(),
      phone                : Joi.string().optional().allow(""),
      timezone             : Joi.number().optional(),
      country_phone_code   : Joi.string().optional(),
      company_address      : Joi.string().optional(),
      company_latitude     : Joi.string().optional(),
      company_longitude    : Joi.string().optional(),
      terms_and_conditions : Joi.number().optional().valid(0,1),
      language             : Joi.string().optional(),
      ipconfig             : ipConfig.optional(),
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
      productname          : Joi.string().optional().allow(""),
      utm_content          : Joi.string().optional().allow(""),
      utm_keyword          : Joi.string().optional().allow(""),
      utm_lead             : Joi.string().optional().allow(""),
      business_usecase     : Joi.string().optional().allow(""),
      apple_id_token         : Joi.string().required(),
      apple_user_identifier : Joi.string().optional()
    };
  }
  else if (apple_status==constants.SOCIAL_STATUS.LOGIN)
  {
    req.apiReference = {
      module : apiReferenceModule,
      api : "jungleLoginUsingApple"
    };
    opts={
      status              : Joi.number().optional(),
      email               : Joi.string().email().optional(),
      password            : Joi.string().optional(),
      workspace           : Joi.string().optional(),
      apple_id_token         : Joi.string().required(),
      apple_user_identifier : Joi.string().optional()
    };
  }
  let schema =  validator.authJoiObject().keys(opts);
  let validFields = validator.validateFields(req.apiReference, req.body, res, schema);
  if(validFields){
    next();
  }
}
