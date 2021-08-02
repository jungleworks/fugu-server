



const Joi                       = require('joi');
const validator                 = require('../../../Routes/validator');
const constants                 = require('../../../Utils/constants');

exports.scheduleMeeting    = scheduleMeeting;
exports.getMeetings        = getMeetings;
exports.editMeeting        = editMeeting;

function scheduleMeeting(req, res, next) {
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'meeting',
      apiHandler: 'scheduleMeeting'
    };
    const querySchema =  validator.joiObject.keys({
      domain              : Joi.string().optional(),
      user_id             : Joi.number().required(),
      title               : Joi.string().required(),
      start_datetime      : Joi.string().required(),
      end_datetime        : Joi.string().required(),
      frequency           : Joi.number().valid(constants.validFrequency).optional(),
      reminder_time       : Joi.number().required(),
      attendees           : Joi.array().items(Joi.number().required()).required(),
      access_token        : Joi.string().required(),
      workspace_id        : Joi.number().required(),
      room_id             : Joi.string().required(),
      meet_type           : Joi.string().valid(constants.meetType).optional(),
      scheduled_by        : Joi.string().optional()
    });
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
};

function getMeetings(req, res, next){
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'meeting',
    apiHandler: 'getMeetings'
  };
  const querySchema =  validator.joiObject.keys({
    user_id             : Joi.number().required(),
    start_datetime      : Joi.string().optional(),
    access_token        : Joi.string().required(),
    workspace_id        : Joi.number().required()
  });
  const validFields = validator.validateFields(req, res, querySchema);
  if (validFields) {
    next();
  }
}

function editMeeting(req, res, next){
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'meeting',
    apiHandler: 'editMeeting'
  };
  const querySchema =  validator.joiObject.keys({
    meet_id             : Joi.number().required(),
    user_id             : Joi.number().optional(),
    title               : Joi.string().optional(),
    start_datetime      : Joi.string().optional(),
    end_datetime        : Joi.string().optional(),
    frequency           : Joi.number().valid(constants.validFrequency).optional(),
    reminder_time       : Joi.number().optional(),
    attendees           : Joi.array().items(Joi.number().required()).optional(),
    access_token        : Joi.string().required(),
    workspace_id        : Joi.number().required(),
    room_id             : Joi.string().optional(),
    meet_type           : Joi.string().valid(constants.meetType).optional(),
    is_deleted          : Joi.number().optional()
  });
  const validFields = validator.validateFields(req, res, querySchema);
  if (validFields) {
    next();
  }
}