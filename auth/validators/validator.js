/**
 * Created by ashishprasher on 10/01/18.
 */

var Joi                                         = require('joi');
var _                                           = require('underscore');

var constants                                   = require('./../routes/constants');
var logging                                     = require('./../routes/logging');
var responses                                   = require('./../routes/responses');
var newResponses                                = require('./../routes/newResponses');
var utilityService                              = require('./../services/utilityService');

exports.validateFields                          = validateFields;
exports.authJoiObject                           = authJoiObject;
exports.trimFields                              = trimFields;
exports.emailMinDomainAtoms                     = 2;

function authJoiObject(){
  return Joi.object().keys ({
    auth_key   : Joi.string().required(),
    offering   : Joi.number().positive().required().valid(startupVariables.validOfferings)
  });
}

function validateFields(apiReference, req, res, schema, msg) {
    logging.log(apiReference, {REQUEST_BODY: req});
    var validation = Joi.validate(req, schema);
    if(validation.error) {
        var errorReason =
                validation.error.details !== undefined
                    ? (msg ? msg : validation.error.details[0].message)
                    : 'Parameter missing or parameter type is wrong';
        logging.log(apiReference, validation.error.details);
        if(utilityService.isEnvLive())
            newResponses.parameterMissingResponse(res, msg ? errorReason : '');
        else
            newResponses.parameterMissingResponse(res, errorReason);
        return false;
    }
    if(req.auth_key){
        if(!config.get('SECRET_API_KEY').includes(req.auth_key)){
            responses.invalidApiKey(res);
            return false;
        }
    }
    return true;
}

function trimFields(req, res, next) {
  logging.log(req.apiReference, {EVENT: "Trimming Validator", REQUEST_BODY: req});
  if (req.body.email) {
    req.body.email = req.body.email.trim();
  }
  next();
}