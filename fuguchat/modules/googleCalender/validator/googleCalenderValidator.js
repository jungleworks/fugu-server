
const Joi       = require('joi');
const validator = require('../../../Routes/validator');


exports.getAuthorizeUrl     = getAuthorizeUrl;
exports.submitAuthorizeCode = submitAuthorizeCode;
exports.addCalendarEvent    = addCalendarEvent;


function getAuthorizeUrl(req, res, next){
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'googleCalender',
      apiHandler: 'getAuthroizeUrl'
    };
    const querySchema = validator.joiObject.keys({
      en_user_id  : Joi.string().required(),
      access_token: Joi.string().required(),
      workspace_id: Joi.number().optional(),
      domain      : Joi.string().required()
    });
  
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
     next();
    }
  };


function submitAuthorizeCode(req, res, next){
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'googleCalender',
      apiHandler: 'getAuthroizeUrl'
    };
  
    const querySchema = validator.joiObject.keys({
      auth_token     : Joi.string().required(),
      access_token   : Joi.strict().required(),
      workspace_id   : Joi.number().optional(),
      user_unique_key: Joi.string().required(),
      domain         : Joi.string().required()
    });
  
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
};

function addCalendarEvent(req, res, next){
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'googleCalender',
    apiHandler: 'getAuthroizeUrl'
  };

  const querySchema = validator.joiObject.keys({
    en_user_id     : Joi.string().required(),
    attendees      : Joi.array().optional(),
    description    : Joi.string().optional(),
    start_datetime : Joi.string().optional(),
    end_datetime   : Joi.string().optional(),
    summary        : Joi.string().optional(),
    access_token   : Joi.string().required(),
    timezone       : Joi.string().required(),
    is_scheduled   : Joi.number().valid(0,1).required(),
    user_id        : Joi.number().optional(),
    domain         : Joi.string().required()
  }).or('attendees', 'user_id');

  const validFields = validator.validateFields(req, res, querySchema);
  if (validFields) {
    next();
  }
}
  
