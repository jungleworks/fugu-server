/**
 * Created by gagandeep on 31/01/19.
 */

const Joi = require('joi');
const UniversalFunc = require('../Utils/universalFunctions');
const utils = require('../Controller/utils');
const logger = require('../Routes/logging');

Joi.string().hexColor = function () {
  let opts = {};
  return this._test('hexColor', opts, function (value, state, options) {
    if (utils.isHexaColor(value)) {
      return value;
    }
    return this.createError('string.hex', { value }, state, options);
  });
};


exports.createNewScrum = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "createNewScrum"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    business_token: Joi.string().optional(),
    scrum_name: Joi.string().optional(),
    manager_fugu_user_id: Joi.number().required(),
    start_day: Joi.string().optional(),
    time_zone: Joi.number().optional(),
    active_days: Joi.array().optional(),
    frequency: Joi.number().optional(),
    respondants: Joi.array().optional(),
    welcome_message: Joi.string().optional(),
    scrum_time: Joi.number().optional(),
    end_time_reminder: Joi.number().optional(),
    delivering_result_to_users: Joi.array().optional(),
    delivering_result_to_channels: Joi.array().optional(),
    questions: Joi.array().optional(),
    end_time_text: Joi.string().optional(),
    start_time: Joi.string().optional(),
    status: Joi.string().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};


exports.editScrumDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "editScrum"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    scrum_name: Joi.string().optional(),
    start_day: Joi.string().optional(),
    time_zone: Joi.number().optional(),
    active_days: Joi.array().optional(),
    frequency: Joi.number().optional(),
    respondants: Joi.array().optional(),
    welcome_message: Joi.string().optional(),
    scrum_time: Joi.number().optional(),
    end_time_reminder: Joi.number().optional(),
    delivering_result_to_users: Joi.array().optional(),
    delivering_result_to_channels: Joi.array().optional(),
    questions: Joi.array().optional(),
    end_time_text: Joi.string().optional(),
    start_time: Joi.string().optional(),
    scrum_id: Joi.number().optional(),
    scrum_status: Joi.string().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};


exports.createBusiness = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "createBusiness"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    business_token: Joi.string().optional(),
    business_name: Joi.string().optional(),
    time_zone: Joi.number().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if (validFields) {
    next();
  }
};


exports.scrumCron = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "scrumCron"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    scrum_id: Joi.number().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if (validFields) {
    next();
  }
};

exports.insertUserAnswers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "insertUserAnswer"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    user_name: Joi.string().optional(),
    message: Joi.string().optional(),

  });

  let validFields = validateSchema(req.query, res, schema);
  if (validFields) {
    next();
  }
};



exports.insertNewUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "insertNewUser"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const bulkUserSchema = Joi.object().keys({
    user_name: Joi.string().required(),
    password: Joi.string().optional(),
    full_name: Joi.string().required(),
    email: Joi.string().allow(null).allow('').optional(),
    role: Joi.string().optional(),
    manager_user_name: Joi.string().optional().allow(null)
  });
  const schema = Joi.object().keys({
    user_name: Joi.string().optional(),
    business_token: Joi.string().optional(),
    full_name: Joi.string().optional(),
    bulk_users: Joi.array().items(bulkUserSchema)
  });

  if (req.body.email) {
    return UniversalFunc.sendError(new Error("Invalid Information"), res);
  }

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.getScrumDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "createBusiness"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    user_name: Joi.string().optional(),
    scrum_id: Joi.number().optional(),
    business_token: Joi.string().optional(),
    user_role: Joi.string().optional()
  });
  req.query.user_name ? req.body.user_name = req.query.user_name : 0;
  req.query.scrum_id ? req.body.scrum_id = req.query.scrum_id : 0;
  req.query.business_token ? req.body.business_token = req.query.business_token : 0;

  let validFields = validateSchema(req.query, res, schema);
  if (validFields) {
    next();
  }
};

exports.checkUserAvailability = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "createBusiness"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  const schema = Joi.object().keys({
    user_id: Joi.array().optional(),
    start_day: Joi.string().optional(),
    time_zone: Joi.number().optional(),
    active_days: Joi.array().optional(),
    frequency: Joi.number().optional(),
    start_time: Joi.string().optional(),
    scrum_id: Joi.number().optional()
  });
  req.query.user_name ? req.body.user_name = req.query.user_name : 0;
  req.query.scrum_id ? req.body.scrum_id = req.query.scrum_id : 0;

  let validFields = validateSchema(req.query, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishScrumAnswers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "scrum",
    apiHandler: "createNewScrum"
  };
  next();
};

function validateSchema(req, res, schema) {
  const validation = Joi.validate(req, schema);
  if (validation.error) {
    let errorName = validation.error.name;
    let errorReason =
      validation.error.details !== undefined
        ? validation.error.details[0].message
        : 'Parameter missing or parameter type is wrong';
    UniversalFunc.sendError(new Error(errorName + ' ' + errorReason), res);
    return false;
  }
  return true;
}
