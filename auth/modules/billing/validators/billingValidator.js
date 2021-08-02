const Joi                                         = require('joi');

const logging                                     = require('./../../../routes/logging');
const validator                                   = require('./../../../validators/validator');
const constants                                 = require('./../../../routes/constants');

const apiReferenceModule                          = "billing";


exports.makeUserPayment                         = makeUserPayment;
exports.addUserCardV2                           = addUserCardV2;
exports.getUserCard                             = getUserCard;
exports.setupIntent                             = setupIntent;

function makeUserPayment(req, res, next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "makeUserPayment"
  };
  let schema       = validator.authJoiObject().keys({
    access_token   : Joi.string().required(),
    billing_amount : Joi.number().positive().required(),
    user_id        : Joi.number().positive().required(),
    currency_id    : Joi.number().positive().optional().valid(startupVariables.validCurrencies),
    payment_gateway: Joi.number().positive().optional().valid(Object.values(constants.PAYMENT_GATEWAYS)),
    description    : Joi.string().optional().allow(""),
    is_on_session  : Joi.boolean().optional()
  });
  let validFields  = validator.validateFields(req.apiReference, req.body, res, schema);
  if (validFields) {
    next();
  }
}

function addUserCardV2(req, res, next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "addUserCard"
  };
  let schema       = validator.authJoiObject().keys({
    access_token   : Joi.string().required(),
    user_id        : Joi.number().required(),
    payment_method : Joi.string().required(),
    source         : Joi.number().optional()
  });
  let validFields  = validator.validateFields(req.apiReference, req.body, res, schema);
  if (validFields) {
    next();
  }
}

function getUserCard(req, res, next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "getUserCard"
  };
  let schema       = validator.authJoiObject().keys({
    access_token: Joi.string().required(),
    user_id     : Joi.number().positive().required()
  });
  let validFields  = validator.validateFields(req.apiReference, req.body, res, schema);
  if (validFields) {
    next();
  }
}

function setupIntent(req, res, next) {
  req.apiReference = {
    module: apiReferenceModule,
    api   : "setupIntent"
  };
  let schema       = validator.authJoiObject().keys({
    access_token: Joi.string().required(),
  });
  let validFields  = validator.validateFields(req.apiReference, req.body, res, schema);
  if (validFields) {
    next();
  }
}
