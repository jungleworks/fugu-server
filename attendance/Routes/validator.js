
const Joi                           = require('joi');
const _                             = require('underscore');
const Promise                       = require('bluebird');
const RESP                          = require('../Config').responseMessages;
const UniversalFunc                 = require('../Utils/universalFunctions');
const commonFunctions               = require('../Utils/commonFunctions');
const logger                        = require('../Routes/logging');
const constants                     = require('../Utils/constants');
const userService                   = require('../services/user');
const attendanceService             = require('../services/attendance');

/** @namespace Joi.string */
/** @namespace Joi.boolean */
/** @namespace Joi.number */
/** @namespace Joi.array */
/** @namespace Joi.validate */
/** @namespace Joi.object */
/** @namespace Promise.promisify */
/** @namespace Promise.coroutine */


const joiObject = Joi.object().keys({
  app_version : Joi.string().optional(),
  device_type : Joi.string().valid(constants.validDeviceTypes).optional()
});

Joi.string().hexColor =  function () {
  let opts = {};
  return this._test('hexColor', opts, function (value, state, options) {
    if(commonFunctions.isHexaColor(value)) {
      return value;
    }
    // TODO : custom message
    return this.createError('string.hex', { value }, state, options);
  });
};

exports.getAllMembers = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "workspace",
    apiHandler : "getAllMembers"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  if(req.query.user_api_token) {
    req.body.user_api_token = req.query.user_api_token;
  }

  const schema = joiObject.keys({
    access_token      : Joi.string().required(),
    workspace_id      : Joi.number().required().positive(),
    user_status       : Joi.string().optional(constants.allowedUserStatus),
    user_type         : Joi.string().optional(constants.allowedMembersType)
  });

  let validFields = validateFields(req, res, schema);
  if(validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.signup = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "signup"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const bulkUserSchema = Joi.object().keys({
    user_name         : Joi.string().required(),
    password          : Joi.string().optional(),
    full_name         : Joi.string().required(),
    email             : Joi.string().optional(),
    role              : Joi.string().optional(),
    manager_user_name : Joi.string().optional().allow(null)
  });
  const schema = Joi.object().keys({
    email          : Joi.string().trim().email({ minDomainAtoms : constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    user_name      : Joi.string().optional(),
    password       : Joi.string().optional(),
    secret_key     : Joi.string().optional(),
    business_token : Joi.string().optional(),
    full_name      : Joi.string().optional(),
    bulk_users     : Joi.array().items(bulkUserSchema)
  });

  if(req.body.email) {
    return UniversalFunc.sendError(new Error("Invalid Information"), res);
  }

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    next();
  }
};

exports.clockOut = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "clockOut"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    email           : Joi.string().optional(),
    auth_id         : Joi.string().optional(),
    user_name       : Joi.string().optional(),
    business_token  : Joi.string().optional(),
    full_name       : Joi.string().optional(),
    manager_user_name : Joi.string().optional()
  }).unknown(true);

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.clockIn = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "clockIn"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const lat_long = Joi.object().keys({
    longitude      : Joi.string().optional(),
    latitude       : Joi.string().optional()
  })

  const schema =  Joi.object().keys({
    auth_id           : Joi.string().optional(),
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
    manager_user_name : Joi.string().optional(),
    location          : lat_long,
    authentication_level : Joi.string().optional()
  }).unknown(true);


  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
   loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.timesheet = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "timesheet"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    email           : Joi.string().optional(),
    auth_id         : Joi.string().optional(),
    business_token  : Joi.string().optional(),
    user_name       : Joi.string().optional(),
    full_name       : Joi.string().optional(),
    manager_user_name : Joi.string().optional()
  })

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.teamPunchStatus = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "teamPunchStatus"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    auth_id         : Joi.string().optional(),
    business_token  : Joi.string().optional(),
    email           : Joi.string().optional(),
    user_name       : Joi.string().optional(),
    full_name       : Joi.string().optional(),
    manager_user_name : Joi.string().optional(),
    user_count      : Joi.string().optional(),

  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.teamLeaveStatus = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "teamLeaveStatus"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  next();
};

exports.getMonthlyReport = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getMonthlyReport"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    auth_id         : Joi.string().optional(),
    business_token  : Joi.string().optional(),
    email           : Joi.string().optional(),
    user_name       : Joi.string().optional(),
    full_name       : Joi.string().optional(),
    manager_user_name : Joi.string().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.editUserInfo = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "editUserInfo"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    auth_id           : Joi.string().optional(),
    business_token    : Joi.string().optional(),
    secret_key        : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    manager_user_name : Joi.string().optional(),
    status            : Joi.number().optional(),
    shift_start_time  : Joi.string().optional(),
    work_hours        : Joi.number().optional(),
    time_zone         : Joi.number().optional(),
    employee_id       : Joi.string().optional(),
    action_user_name  : Joi.string().required(),
    joining_date      : Joi.string().optional(),
    birth_date        : Joi.string().optional(),
    status            : Joi.number().optional(),
    work_days         : Joi.array().optional(),
    user_punch_image  : Joi.string().allow(null).optional(),
    config            : Joi.object().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.getBusinessReport = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getBusinessReport"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    start_date        : Joi.string().optional(),
    end_date          : Joi.string().optional(),
    action_user_name  : Joi.string().optional(),
    include_deactivated_users: Joi.boolean().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.query, res, req.logHandler, next);
  }
};

exports.leave = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "leave"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    timezone         : Joi.number().optional(),
    business_token   : Joi.string().optional(),
    user_name        : Joi.string().optional(),
    full_name        : Joi.string().optional(),
    email            : Joi.string().optional(),
    leave_start_date : Joi.string().optional(),
    leave_end_date   : Joi.string().optional(),
    leave_id         : Joi.number().optional(),
    leave_type       : Joi.string().optional(),
    status           : Joi.string().optional().valid(constants.allowedLeaveStatusEnum),
    requested_leaves : Joi.number().optional(),
    day_time         : Joi.string().optional(),
    message          : Joi.string().optional(),
    leave_type_id    : Joi.number().optional(),
    title            : Joi.string().optional(),
    manager_user_name : Joi.string().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.changeManagerRequest = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "changeManagerRequest"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
    manager_user_name : Joi.string().optional(),
    manager_full_name : Joi.string().optional(),
    manager_email     : Joi.string().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.changeEmail = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "changeEmail"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    old_email         : Joi.string().required(),
    new_email         : Joi.string().required()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    next();
  }
};

exports.leaveBalance = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "leaveBalance"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token      : Joi.string().optional(),
    user_name           : Joi.string().optional(),
    full_name           : Joi.string().optional(),
    email               : Joi.string().optional(),
    page_start          : Joi.number().optional(),
    page_end            : Joi.number().optional(),
    users_count         : Joi.string().optional(),
    start_date          : Joi.string().optional(),
    end_date            : Joi.string().optional(),
    manager_user_name   : Joi.string().optional(),
    action_by_user_name : Joi.string().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.query, res, req.logHandler, next);
  }
};

exports.editBusinessLeave = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "editBusinessLeave"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token            : Joi.string().optional(),
    user_name                 : Joi.string().optional(),
    full_name                 : Joi.string().optional(),
    email                     : Joi.string().optional(),
    leave_title               : Joi.string().optional(),
    leave_synonyms            : Joi.array().items(Joi.string().optional()).optional(),
    annual_count              : Joi.number().optional(),
    accrual_interval          : Joi.string().optional(),
    leave_type_id             : Joi.number().optional(),
    status                    : Joi.number().optional(),
    max_annual_rollover       : Joi.number().optional(),
    is_negative_leave_allowed : Joi.number().optional(),
    is_clock_in_allowed       : Joi.number().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.getBusinessLeaves = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getBusinessLeaves"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.editUserLeaves = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "editUserLeaves"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
    leave_count       : Joi.string().required(),
    leave_type_id     : Joi.number().required()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.getMembers = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getMembers"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
    user_count        : Joi.string().required(),
    start_date        : Joi.string().optional(),
    end_date          : Joi.string().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.query, res, req.logHandler, next);
  }
};

exports.editBusinessInfo = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "editBusinessInfo"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token           : Joi.string().optional(),
    user_name                : Joi.string().optional(),
    full_name                : Joi.string().optional(),
    email                    : Joi.string().optional(),
    session_start            : Joi.string().optional(),
    session_end              : Joi.string().optional(),
    end_date                 : Joi.string().optional(),
    admin_roles              : Joi.array().optional(),
    hr_roles                 : Joi.array().optional(),
    auto_punch_out           : Joi.number().optional(),
    work_days                : Joi.array().optional(),
    work_start_time          : Joi.string().optional(),
    work_hours               : Joi.number().optional(),
    lunch_duration           : Joi.number().optional(),
    punch_in_reminder_time   : Joi.number().optional(),
    punch_out_reminder_time  : Joi.number().optional(),
    business_area            : Joi.array().optional(),
    config                   : Joi.object().optional(),
    keep_user_data           : Joi.boolean().optional(),
    admin_ids_remove         : Joi.array().optional(),
    hr_ids_remove            : Joi.array().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.getBusinessInfo = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getBusinessInfo"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email             : Joi.string().optional(),
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.query, res, req.logHandler, next);
  }
};

exports.editUserPunchStatus = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "editUserPunchStatus"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token           : Joi.string().optional(),
    user_name                : Joi.string().optional(),
    punch_in_time            : Joi.string().optional(),
    punch_out_time           : Joi.string().optional(),
    user_name                : Joi.string().optional(),
    full_name                : Joi.string().optional(),
    email                    : Joi.string().optional(),
    punch_id                 : Joi.number().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.getUsersWorkTimesheet = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getUsersWorkTimesheet"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token    : Joi.string().optional(),
    user_name         : Joi.string().optional(),
    full_name         : Joi.string().optional(),
    email         : Joi.string().optional(),
    start_date        : Joi.string().optional(),
    end_date          : Joi.string().optional(),
    page_start        : Joi.number().optional(),
    page_end          : Joi.number().optional(),
    search_text       : Joi.string().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.query, res, req.logHandler, next);
  }
};

exports.createBusiness = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "createBusiness"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    business_token      : Joi.string().optional(),
    business_name       : Joi.string().optional(),
    time_zone           : Joi.number().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    next();
  }
};

exports.uploadDefaultImage = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "uploadDefaultImage"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    image           : Joi.object().optional(),
    email           : Joi.string().optional(),
    auth_id         : Joi.string().optional(),
    user_name       : Joi.string().optional(),
    business_token  : Joi.string().optional(),
    full_name       : Joi.string().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    loginViaAuthIdOrSecretKey(req.body, res, req.logHandler, next);
  }
};

exports.reminderCron = function (req, res, next) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "reminderCron"
  };
  logger.trace(req.logHandler, { REQUEST_BODY : req.body, REQUEST_HEADER : req.headers, REQUEST_QUERY : req.query });

  const schema =  Joi.object().keys({
    clock_out           : Joi.boolean().optional()
  });

  let validFields = validateSchema(req.query, res, schema);
  if(validFields) {
    next();
  }
};

//--------------------------------------------------------------
//                     GENERIC VALIDATIONS
//--------------------------------------------------------------


exports.empty = function (req, res, next) {
  version.is_force          = 0;
  logger.trace(logHandler, { EVENT : "empty", VERSION : version });
  req.body.version = version;
  next();
};


const validateFields = function (req, res, schema) {
  if(req.body) {
    req.body.access_token   ? delete req.body.access_token : 0;
    req.body.app_version    ? delete req.body.app_version : 0;
    req.body.device_type    ? delete req.body.device_type : 0;
  }

  if(req.headers) {
    req.headers.access_token  ? req.body.access_token = req.headers.access_token : 0;
    req.headers.app_version   ? req.body.app_version = req.headers.app_version : 0;
    req.headers.device_type   ? req.body.device_type = req.headers.device_type : 0;
  }

  if(req.query) {
    req.query.email ? req.body.email = req.query.email : 0;
    req.query.workspace_id ? req.body.workspace_id = req.query.workspace_id : 0;
    req.query.email_token ? req.body.email_token = req.query.email_token : 0;
    req.query.fugu_user_id ? req.body.fugu_user_id = req.query.fugu_user_id : 0;
    req.query.workspace ? req.body.workspace = req.query.workspace : 0;
    req.query.contact_type ? req.body.contact_type = req.query.contact_type : 0;
    req.query.user_status ? req.body.user_status = req.query.user_status : 0;
    req.query.invitation_status ? req.body.invitation_status = req.query.invitation_status : 0;
    req.query.user_type ? req.body.user_type = req.query.user_type : 0;
  }
  const validation = Joi.validate(req.body, schema);
  if(validation.error) {
    let errorName = validation.error.name;
    let errorReason =
        validation.error.details !== undefined
          ? validation.error.details[0].message
          : 'Parameter missing or parameter type is wrong';
    UniversalFunc.sendError(new Error(errorName + ' ' + errorReason), res);
    return false;
  }
  return true;
};

const loginViaAccessTokenV1 = function (req, res, logHandler, next) {
  Promise.coroutine(function* () {
    let error;
    let userInfo = yield userService.getInfo(logHandler, { access_token : req.body.access_token });
    if(_.isEmpty(userInfo)) {
      error = new Error("Session expired! Please login again");
      error.errorResponse = RESP.ERROR.eng.INVALID_ACCESS_TOKEN;
      throw error;
    }
    req.body.userInfo = userInfo[0];
    logger.trace(logHandler, "FINAL GOING FORWARD", req.body.userInfo, req.body.workspaceInfo);
  })().then((data) => {
    logger.trace(logHandler, { loginViaAccessTokenV1 : data });
    next();
  }, (error) => {
    logger.error(logHandler, { EVENT : "loginViaAccessToken" }, { MESSAGE : error.message });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
};

const loginViaAuthIdOrSecretKey = function (req, res, logHandler, next) {
  Promise.coroutine(function* () {
    let error;

    if(!req.auth_id && !req.business_token) {
      throw new Error("Session expired. Please login again.")
    }

    if(req.business_token) {
      let getBusinessInfo = yield attendanceService.getBusinessInfo(logHandler, { business_token : req.business_token });
      if(!_.isEmpty(getBusinessInfo)) {
        req.business_id = getBusinessInfo[0].business_id;
        req.time_zone   = getBusinessInfo[0].time_zone;
        req.businessInfo = getBusinessInfo[0];
      }
    }
  logger.info(logHandler,">>>>>>>>>>>.",req.businessInfo)
    let userInfo = yield attendanceService.getInfo(logHandler, req);
    if(!_.isEmpty(userInfo)) {
      if(req.timezone && userInfo[0].time_zone != (+req.timezone)){
        yield attendanceService.updateUserInfo(logHandler, { time_zone: (+req.timezone) }, { action_user_id : userInfo[0].user_id, business_id : userInfo[0].business_id });
      }
      return req.userInfo = userInfo[0];
    } else {
      if(req.business_token) {
        if(req.manager_user_name) {
          let [managerInfo] = yield attendanceService.getInfo(logHandler, { user_name : req.manager_user_name });
          req.manager_user_id = managerInfo.user_id;
        }
        yield userService.insertNew(logHandler, req);
        userInfo = yield attendanceService.getInfo(logHandler, req);
        return req.userInfo = userInfo[0];
      } else {
        throw new Error("Session expired. Please login again.")
      }
    }
  })().then((data) => {
    logger.trace(logHandler, { loginViaAccessTokenV1 : data });
    next();
  }, (error) => {
    logger.error(logHandler, { EVENT : "loginViaAuthIdOrSecretKey" }, { MESSAGE : error.message });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
};

function validateSchema(req, res, schema) {
  const validation = Joi.validate(req, schema);
  if(validation.error) {
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
