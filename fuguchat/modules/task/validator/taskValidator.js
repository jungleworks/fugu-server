

const Joi                       = require('joi');
const validator                 = require('../../../Routes/validator');
const constants                 = require('../../../Utils/constants');

exports.assignTask              = assignTask;
exports.submitTask              = submitTask;
exports.getAssignedTask         = getAssignedTask;
exports.getTaskDetails          = getTaskDetails;
exports.editTaskDetails         = editTaskDetails

function assignTask(req, res, next) {
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'task',
      apiHandler: 'assignTask'
    };
    const querySchema =  validator.joiObject.keys({
      channel_id          : Joi.number().required(),
      assigner_user_id    : Joi.number().required(),
      title               : Joi.string().required(),
      description         : Joi.string().required(),
      start_datetime      : Joi.string().required(),
      end_datetime        : Joi.string().required(),
      is_selected_all     : Joi.number().required(),
      reminder            : Joi.number().valid(constants.validReminder).optional(),
      user_ids            : Joi.array().when('is_selected_all', { is: 0, then: Joi.required(), otherwise: Joi.optional()}),
      access_token        : Joi.string().required(),
      workspace_id        : Joi.number().required()
    });
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
};

  
function getAssignedTask(req, res, next) {
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'task',
      apiHandler: 'getAssignedTask'
    };
    const querySchema =  validator.joiObject.keys({
      channel_id     : Joi.number().optional(),
      user_id        : Joi.number().required(),
      access_token   : Joi.string().required(),
      month          : Joi.number().optional(),
      year           : Joi.number().optional(),
      workspace_id   : Joi.number().optional(),
      is_completed   : Joi.number().optional()
    });
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
  };
  
  
function submitTask(req, res, next) {
    req.logHandler = {
      uuid      : req.uuid,
      apiModule : 'task',
      apiHandler: 'submitTask'
    };
    const querySchema =  validator.joiObject.keys({
      access_token    : Joi.string().required(),
      user_id         : Joi.number().required(),
      task_id         : Joi.number().required(),
      content         : Joi.string().optional(),
      url             : Joi.string().optional(),
      file_size       : Joi.strict().optional(),
      file_name       : Joi.string().optional(),
      muid            : Joi.string().optional()
    });
  
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
  };
  

function getTaskDetails(req, res, next) {
    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'task',
      apiHandler: 'getTaskSubmitDetails'
    };
    const querySchema =  validator.joiObject.keys({
      user_id        : Joi.number().required(),
      access_token   : Joi.string().required(),
      task_id        : Joi.number().required()
    });
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
      next();
    }
  };

function editTaskDetails(req, res, next) {
    req.logHandler = {
        uuid: req.uuid,
        apiModule: 'task',
        apiHandler: 'editTaskDetails'
    };
    const querySchema =  validator.joiObject.keys({
        is_deleted          : Joi.number().optional(),
        access_token        : Joi.string().required(),
        task_id             : Joi.number().required(),
        channel_id          : Joi.number().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        workspace_id        : Joi.number().optional(),
        assigner_user_id    : Joi.number().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        title               : Joi.string().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        description         : Joi.string().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        start_datetime      : Joi.string().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        end_datetime        : Joi.string().when('is_deleted',{is : Joi.exist(), then : Joi.optional(), otherwise : Joi.required()}),
        reminder            : Joi.number().valid(constants.validReminder).optional(),
    });
    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
        next();
    }
};