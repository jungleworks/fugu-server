
const Joi              = require('joi');
const _                = require('underscore');
const Promise          = require('bluebird');
const config           = require('config');
const RESP             = require('../Config').responseMessages;
const Controller       = require('../Controller').userController;
const UniversalFunc    = require('../Utils/universalFunctions');
const commonFunctions  = require('../Utils/commonFunctions');
const { logger }       = require('../libs/pino_logger');
const constants        = require('../Utils/constants');
const userService      = require('../services/user');
const convService      = require('../services/conversation');
const workspaceService = require('../services/workspace');
const channelService   = require('../services/channel');
const bcrypt           = require('bcryptjs');
const utils            = require('../Utils/commonFunctions');
const bot              = require('../services/bot');
const jwt              = require('jsonwebtoken');
const helperUtility    = require('../Utils/helperUtility');

const saltRounds = 10;

/** @namespace Joi.string */
/** @namespace Joi.boolean */
/** @namespace Joi.number */
/** @namespace Joi.array */
/** @namespace Joi.validate */
/** @namespace Joi.object */
/** @namespace Promise.promisify */
/** @namespace Promise.coroutine */

// TODO : joi for valid phone number

const emptySchema = Joi.object().keys({}).unknown(true);
const joiObject = Joi.object().keys({
  app_version: Joi.string().required(),
  device_type: Joi.string().valid(constants.validDevices).required(),
  domain: Joi.string().optional()
}).unknown(true);

const joiDeviceVersionObject = Joi.object().keys({
  app_version: Joi.string().optional(),
  device_type: Joi.string().valid(constants.validDevices).optional(),
  domain: Joi.string().optional()
}).unknown(true);

const headerSchema = Joi.object().keys({
  app_version: Joi.string().required(),
  device_type: Joi.string().valid(constants.validDevices).required(),
  access_token: Joi.string().optional(),
  domain: Joi.string().optional()
}).unknown(true);

Joi.string().hexColor = function () {
  let opts = {};
  return this._test('hexColor', opts, function (value, state, options) {
    if (commonFunctions.isHexaColor(value)) {
      return value;
    }
    return this.createError('string.hex', { value }, state, options);
    // TODO : custom message
  });
};
//--------------------------------------------------------------
//                     USER APIs
//--------------------------------------------------------------

exports.sendFeedback = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "sendFeedback"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    feedback: Joi.string().optional(),
    workspace_id: Joi.number().optional(),
    extra_details: Joi.string().optional(),
    type: Joi.string().optional(),
    rating: Joi.number().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.setPassword = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "setPassword"
  };

  const schema = joiObject.keys({
    email_token: Joi.string().required(),
    password: Joi.string().trim().min(6).optional(),
    full_name: Joi.string().trim().optional(),
    workspace: Joi.string().required(),
    device_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.userLoginValidation = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "userLogin"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required().optional(),
    contact_number: Joi.string().optional(),
    password: Joi.string().trim().min(6).required(),
    country_code: Joi.string().optional(),
    device_id: Joi.string().optional(),
    username: Joi.string().optional(),
    domain: Joi.string().optional(),
    token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    device_details: emptySchema,
    time_zone     : Joi.number().optional()
  });

  if (!req.body.email && !req.body.contact_number && !req.body.username) {
    return UniversalFunc.sendError(new Error("Insufficient Information email/number"), res);
  }
  if (req.body.device_details && !commonFunctions.validStringifiedJson(req.logHandler, req.body.device_details)) {
    logger.error(req.logHandler, "Invalid device_details in userLoginValidation", req.body.device_details);
  }

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    req.body.user_agent = req.headers.app_version + ">>>" + req.headers["user-agent"]
    next();
  }
};

exports.userLoginValidationV2 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "userLoginV2"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required().optional(),
    contact_number: Joi.string().optional(),
    country_code: Joi.string().optional(),
    username: Joi.string().optional(),
    domain: Joi.string().optional(),
    device_details: emptySchema,
    time_zone     : Joi.number().optional()
  });

  if (!req.body.email && !req.body.contact_number && !req.body.username) {
    return UniversalFunc.sendError(new Error("Insufficient Information email/number"), res);
  }
  if (req.body.device_details && !commonFunctions.validStringifiedJson(req.logHandler, req.body.device_details)) {
    logger.error(req.logHandler, "Invalid device_details in userLoginValidation", req.body.device_details);
  }

  let validFields = validateFields(req, res, schema);
  try {
    req.body.ip = req.headers["x-forwarded-for"]
  } catch (e) {
    console.error(e)
  }
  if (validFields) {
    next();
  }
};

exports.userLoginValidationV1 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "userLogin"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    password: Joi.string().trim().min(6).required()
  });

  try {
    commonFunctions.jsonParse(req.body.device_details);
  } catch (e) {
    logger.error(req.logHandler, "ERROR", req.body.device_details, e);
  }
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.loginViaAccessToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "loginViaAccessToken"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    source: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessToken(req, res, req.logHandler, next);
  }
};

exports.loginViaAccessTokenV1 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "loginViaAccessToken"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    source: Joi.string().optional(),
    device_id: Joi.string().optional(),
    token: Joi.string().optional(),
    domain: Joi.string().optional(),
    workspace: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    user_workspace_ids: Joi.array().optional().items(Joi.number().optional()).optional(),
    device_details: emptySchema,
    old_dashboard: Joi.boolean().optional(),
    time_zone     : Joi.number().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    req.body.user_agent = req.headers.app_version + ">>>" + req.headers["user-agent"]
    next();
  }
};

exports.getBotConfiguration = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getBotConfiguration"
  };

  let invite_user_ids = req.body.invite_user_ids;
  req.body.invite_user_ids = utils.isString(invite_user_ids) ? utils.jsonParse(invite_user_ids) : invite_user_ids;

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.updateDeviceToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "updateDeviceToken"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    device_type: Joi.string().required(constants.validDeviceTypes),
    device_id: Joi.string().required(),
    token: Joi.string().required(),
    voip_token: Joi.string().optional(),
    domain: Joi.string().optional(),
    device_details: emptySchema,
    web_token_status: Joi.number().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.userLogoutValidation = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "userLogout"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    device_id: Joi.string().required(),
    token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getUsers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUsers"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getUserInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUserInfo"
  };


  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    token: Joi.string().optional(),
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    fugu_user_id: Joi.number().optional()
  });

  if (!req.query.email && !req.query.fugu_user_id) {
    return UniversalFunc.sendError(new Error("In-sufficient Information!"), res);
  }
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'user',
    apiHandler: 'getInfo'
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "editUserInfo"
  };

  let contacts = req.body.contacts;
  req.body.contacts = commonFunctions.isString(contacts) ? commonFunctions.jsonParse(contacts) : contacts;

  const phoneContactSchema = Joi.object().keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    contact_number: Joi.string().optional(),
    full_name: Joi.string().required()
  });

  let managerData = req.body.manager_data;
  req.body.manager_data = commonFunctions.isString(managerData) ? commonFunctions.jsonParse(managerData) : managerData;

  const managerSchema = Joi.object().keys({
    fugu_user_id: Joi.number().optional(),
    full_name: Joi.string().optional()
  });

  let gallery_media_visibility = req.body.gallery_media_visibility;
  req.body.gallery_media_visibility = commonFunctions.isString(gallery_media_visibility) ? commonFunctions.jsonParse(gallery_media_visibility) : gallery_media_visibility;

  let remove_profile_image = req.body.remove_profile_image;
  req.body.remove_profile_image = commonFunctions.isString(remove_profile_image) ? commonFunctions.jsonParse(remove_profile_image) : remove_profile_image;

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    location: Joi.string().optional(),
    full_name: Joi.string().optional(),
    status: Joi.string().valid("ENABLED", "DISABLED").optional(), // 0-inactive,1-active
    online_status: Joi.string().valid(constants.validOnlineStatuses).optional(),
    designation: Joi.string().optional(),
    department: Joi.string().optional(),
    contact_number: Joi.string().optional(),
    manager: Joi.string().optional(),
    remove_profile_image: Joi.boolean().optional(),
    manager_data: managerSchema,
    hide_email: Joi.boolean().optional(),
    hide_contact_number: Joi.boolean().optional(),
    role: Joi.string().optional().valid("USER", "ADMIN", "GUEST"),
    fugu_user_id: Joi.number().optional(),
    contacts: Joi.array().optional().items(phoneContactSchema),
    device_details: emptySchema,
    auto_download_level: Joi.string().valid(constants.validAutoDownloadLevel).optional(),
    gallery_media_visibility: Joi.number().valid(0, 1),
    notification_snooze_time: Joi.string().valid(Object.keys(constants.notificationSnoozeTime)).optional(),
    end_snooze: Joi.boolean().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (!validFields) {
    return;
  }

  if (req.files && req.files.length > 0) {
    let supportedFileTypes = new Set(constants.fileTypes.image);
    if (!supportedFileTypes.has(req.files[0].mimetype)) {
      return UniversalFunc.sendError(new Error("Invalid file type, file not supported " + req.files[0].mimetype), res);
    }
  }

  loginViaAccessTokenV1(req, res, req.logHandler, next);
};

exports.inviteUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "inviteUser"
  };

  let emails = req.body.emails;
  req.body.emails = commonFunctions.isString(emails) ? commonFunctions.jsonParse(emails) : emails;

  let user_ids_to_connect = req.body.user_ids_to_connect;
  req.body.user_ids_to_connect = commonFunctions.isString(user_ids_to_connect) ? commonFunctions.jsonParse(user_ids_to_connect) : user_ids_to_connect;

  let channel_ids_to_connect = req.body.channel_ids_to_connect;
  req.body.channel_ids_to_connect = commonFunctions.isString(channel_ids_to_connect) ? commonFunctions.jsonParse(channel_ids_to_connect) : channel_ids_to_connect;

  const contactSchema = Joi.object().keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  const schema = joiObject.keys({
    access_token          : Joi.string().required(),
    workspace_id          : Joi.number().required().positive(),
    contact_numbers       : Joi.array().optional().items(contactSchema).optional(),
    emails                : Joi.array().optional().items(Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional()),
    is_guest              : Joi.boolean().optional(),
    user_ids_to_connect   : Joi.array().items(Joi.number().positive().required()).optional(),
    channel_ids_to_connect: Joi.array().items(Joi.number().positive().required()).optional(),
    custom_label          : Joi.string().optional(),
    erp_token             : Joi.string().optional()
  });

  if (!req.body.emails && !req.body.contact_numbers) {
    return UniversalFunc.sendError(new Error("Insufficient Information"), res);
  }
  let is_guest = req.body.is_guest

  req.body.is_guest = commonFunctions.isString(is_guest) ? commonFunctions.jsonParse(is_guest) : is_guest;

  let contact_numbers = req.body.contact_numbers;
  req.body.contact_numbers = commonFunctions.isString(contact_numbers) ? commonFunctions.jsonParse(contact_numbers) : contact_numbers;
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.inviteUsers = async function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "inviteUser"
  };

  let emails = req.body.emails;
  req.body.emails = commonFunctions.isString(emails) ? commonFunctions.jsonParse(emails) : emails;

  const contactSchema = Joi.object().keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  const schema = joiDeviceVersionObject.keys({
    workspace_id: Joi.number().required().positive(),
    contact_numbers: Joi.array().optional().items(contactSchema).optional(),
    emails: Joi.array().optional().items(Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional()),
    token: Joi.string().required(),
    access_token: Joi.string().optional(),
    hrm_invite_token: Joi.string().opyional()
  });

  if (!req.body.emails && !req.body.contact_numbers) {
    return UniversalFunc.sendError(new Error("Insufficient Information"), res);
  }
  let contact_numbers = req.body.contact_numbers;
  req.body.contact_numbers = commonFunctions.isString(contact_numbers) ? commonFunctions.jsonParse(contact_numbers) : contact_numbers;
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    let userOwnerInfo = await userService.getUserInfo(req.logHandler, { role: constants.userRole.OWNER, workspace_id: req.body.workspace_id, status: constants.status.ENABLED });
    req.body.userInfo = userOwnerInfo[0];
    let workspaceDetails = await workspaceService.getUserBusinessesDetails(req.logHandler, { user_id: userOwnerInfo[0].user_id, workspace_id: req.body.workspace_id });

    req.body.workspaceInfo = workspaceDetails[0];
    next();
  } else {
    throw new Error("Invalid Token")
  }
};

exports.resendInvitation = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "resendInvitation"
  };

  req.body.contact_info = commonFunctions.isString(req.body.contact_info) ? commonFunctions.jsonParse(req.body.contact_info) : req.body.contact_info;

  const contactSchema = Joi.object().keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    contact_info: contactSchema,
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional()
  });

  if (req.body.contact_info) {
    let contact_details = req.body.contact_info;
    if (!commonFunctions.isValidNumber(contact_details.contact_number, contact_details.country_code)) {
      throw new Error("Number is not valid");
    }
  }

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.revokeInvitation = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "revokeInvitation"
  };

  const contactSchema = Joi.object().keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    contact_info: contactSchema,
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional()
  });

  req.body.contact_info = commonFunctions.isString(req.body.contact_info) ? commonFunctions.jsonParse(req.body.contact_info) : req.body.contact_info;

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.verifyToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "verifyToken"
  };

  const schema = joiDeviceVersionObject.keys({
    email_token: Joi.string().optional(),
    contact_token: Joi.string().optional(),
    password_reset_token: Joi.string().optional(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.verifyPasswordResetToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "verifyPasswordResetToken"
  };
  logger.trace(req.logHandler, { REQUEST_QUERY: req.query, REQUEST_BODY: req.body, REQUEST_HEADER: req.headers });

  const schema = joiDeviceVersionObject.keys({
    reset_password_token: Joi.string().optional(),
    domain              : Joi.string().optional(),
    workspace           : Joi.string().optional(),
    access_token        : Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.verifySignUpToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "verifySignUpToken"
  };

  const schema = joiObject.keys({
    signup_token: Joi.string().required(),
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    domain: Joi.string().optional(),
    workspace: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.registerUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "registerUser"
  };

  const schema = joiObject.keys({
    email_token: Joi.string().required(),
    invited_user_email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    password: Joi.string().trim().min(6).required(),
    full_name: Joi.string().required(),
    device_id: Joi.string().required(),
    token: Joi.string().required(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.resetPasswordRequest = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "resetPasswordRequest"
  };

  const schema = joiObject.keys({
    email         : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    contact_number: Joi.string().optional(),
    country_code  : Joi.string().optional(),
    workspace     : Joi.string().optional(),
    domain        : Joi.string().optional(),
    access_token  : Joi.string().optional(),
  });

  if (!req.body.email && !req.body.contact_number && !req.body.country_code) {
    return UniversalFunc.sendError(new Error("Invalid Information"), res);
  }

  if (req.body.contact_number) {
    if (!commonFunctions.isValidNumber(req.body.contact_number, req.body.country_code)) {
      return UniversalFunc.sendError(new Error("Invalid Contact Number!"), res);
    }
  }

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.changeContactNumberRequest = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "changeContactNumberRequest"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    if (!commonFunctions.isValidNumber(req.body.contact_number, req.body.country_code)) {
      return UniversalFunc.sendError(new Error("Invalid Contact Number!"), res);
    }
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.changeContactNumber = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "changeContactNumber"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    otp: Joi.string().max(constants.business.OTP_LENGTH).required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getUserInvites = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUserInvites"
  };

  if (req.query.user_api_token) {
    req.body.user_api_token = req.query.user_api_token;
  }
  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    user_api_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.resetPassword = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "resetPassword"
  };

  const schema = Joi.object().keys({
    reset_password_token: Joi.string().required(),
    email: Joi.string().optional().allow(''),
    password: Joi.string().trim().min(6).required(),
    domain: Joi.string().optional(),
    workspace: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.changePassword = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "changePassword"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    old_password: Joi.string().required(),
    new_password: Joi.string().trim().min(6).required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.submitGdprQuery = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "submitGdprQuery"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required(),
    reason: Joi.string().required(),
    query: Joi.string().required().valid(constants.validGdprQueries)
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.manageUserRole = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "manageUserRole"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required(),
    role: Joi.string().required(),
    fugu_user_id: Joi.number().required(),
    password: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.deletePendingRequests = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "deletePendingRequests"
  };

  const schema = joiDeviceVersionObject.keys({
    string: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.verifyInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "verifyInfo"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getUserContacts = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUserContacts"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    domain: Joi.string().optional(),
    contact_type: Joi.string().required(constants.allowedContactTypes)
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.verifyAndRegisterGoogleUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "checkIfGoogleUserAlreadyRegistered"
  };

  const schema = joiObject.keys({
    email: Joi.string().optional(),
    contact_number: Joi.string().optional(),
    country_code: Joi.string().optional(),
    otp: Joi.string().required(),
    signup_source: Joi.string().optional(),
    device_id: Joi.string().optional(),
    token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next()
  }
};

exports.registerPhoneNumber = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "registerPhoneNumber"
  };

  const schema = joiObject.keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next()
  }
};

exports.checkInvitedContacts = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "checkInvitedContacts"
  };

  const contactSchema = Joi.object().keys({
    contact_number: Joi.string().required(),
    country_code: Joi.string().required()
  });

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    contact_numbers: Joi.array().optional().items(contactSchema).optional(),
  });

  if (!req.body.emails && !req.body.contact_numbers) {
    return UniversalFunc.sendError(new Error("Insufficient Information"), res);
  }

  let contact_numbers = req.body.contact_numbers;
  req.body.contact_numbers = commonFunctions.isString(contact_numbers) ? commonFunctions.jsonParse(contact_numbers) : contact_numbers;

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.testPushNotification = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "testPushNotification"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "editInfo"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  const bodySchema = joiObject.keys({
    mute_channel_id: Joi.number().positive().optional(),
    unmute_channel_id: Joi.number().positive().optional(),
    notification_level: Joi.string().valid(constants.validPushNotificationLevels).optional(),
    channel_id: Joi.number().optional(),
    notification: Joi.string().valid(constants.validChannelNotification).optional(),
    user_properties: emptySchema,
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    web_theme: Joi.object().keys({ "theme_id": Joi.number().required() }).optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.sendMessageEmail = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "sendMessageEmail"
  };
  logger.trace(req.logHandler, { REQUEST: req.body });
  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    user_ids: Joi.array().required().items(Joi.number().required()),
    channel_id: Joi.number().required(),
    muid: Joi.string().optional(),
    thread_muid: Joi.string().optional(),
    workspace_domain_name: Joi.string().optional(),
    access_token: Joi.string().optional(),
    custom_label: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
    req.body.channelInfo = channelInfo[0];
    getUserAndSpaceDetails(req, next);
  }
};

exports.getUserChannelsInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUserChannelsInfo"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getPushNotifications = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getPushNotifications"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    device_id: Joi.string().required(),
    last_notification_id: Joi.number().required(),
    domain: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
}
//--------------------------------------------------------------
//                     New workspace apis validation
//--------------------------------------------------------------

exports.checkEmail = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "checkEmail"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    access_token: Joi.string().optional(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};


exports.setWorkspacePasswordV1 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "setWorkspacePassword"
  };

  const schema = joiObject.keys({
    otp              : Joi.string().trim().required(),
    email            : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    password         : Joi.string().trim().min(6).required(),
    full_name        : Joi.string().trim().required(),
    device_id        : Joi.string().required(),
    token            : Joi.string().optional(),
    voip_token       : Joi.string().optional(),
    contact_number   : Joi.string().optional(),
    country_code     : Joi.string().optional(),
    access_token     : Joi.string().optional(),
    domain           : Joi.string().optional(),
    device_details   : emptySchema
  });

  try {
    commonFunctions.jsonParse(req.body.device_details);
  } catch (e) {
    logger.error(req.logHandler, "ERROR", req.body.device_details, e);
  }

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.signup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "signup"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    workspace: Joi.string().required().min(3).max(30).trim().regex(/^[a-zA-Z0-9-]+$/),
    workspace_name: Joi.string().required().trim()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.signupV1 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "signup"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    contact_number: Joi.string().optional(),
    country_code: Joi.string().optional(),
    user_id: Joi.number().optional(),
    domain: Joi.string().optional(),
    workspace: Joi.string().optional()
  });

  if (!req.body.contact_number && !req.body.email) {
    return UniversalFunc.sendError(new Error("Invalid Information"), res);
  }

  if (req.body.contact_number) {
    if (!commonFunctions.isValidNumber(req.body.contact_number, req.body.country_code)) {
      return UniversalFunc.sendError(new Error("Provided Number is not valid " + req.body.contact_number), res);
    }
  }
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.signupV2 = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "signupV2"
  };

  const schema = Joi.object().keys({
    email           : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    phone           : Joi.string().optional(),
    name            : Joi.string().optional(),
    password        : Joi.string().required(),
    business_usecase: Joi.string().optional(),
    productname     : Joi.string().optional(),
    ipconfig        : Joi.object().optional()
  }).unknown(true);

  if (!req.body.phone && !req.body.email) {
    return UniversalFunc.sendError(new Error("Invalid Information"), res);
  }

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.googleSignup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "googleSignup"
  };

  const schema = joiObject.keys({
    authorized_code: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.syncGoogleContacts = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "syncGoogleContacts"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    authorized_code: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.verifyOtp = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "verifyOtp"
  };

  const schema = joiObject.keys({
    email         : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    otp           : Joi.string().required(),
    contact_number: Joi.string().optional(),
    country_code  : Joi.string().optional(),
    device_id     : Joi.string().optional(),
    token         : Joi.string().optional(),
    voip_token    : Joi.string().optional(),
    signup_source : Joi.string().optional(),
    device_details: emptySchema,
    domain        : Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.editConfiguration = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "editConfiguration"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required()
  }).unknown(true);
  logger.trace(req.logHandler, "CALLED", { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getConfiguration = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getConfiguration"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getPublicInviteDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getPublicInviteDetails"
  };

  const schema = joiDeviceVersionObject.keys({
    workspace: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.getWorkspaceInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getWorkspaceInfo"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.switchWorkspace = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "switchWorkspace"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    device_id: Joi.string().required(),
    token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    device_details: emptySchema
  });

  try {
    commonFunctions.jsonParse(req.body.device_details);
  } catch (e) {
    logger.error(req.logHandler, "ERROR", req.body.device_details, e);
  }
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.editWorkspaceInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "editWorkspaceInfo"
  };

  const schema = joiObject.keys({
    password                    : Joi.string().optional(),
    access_token                : Joi.string().required(),
    workspace_name              : Joi.string().optional(),
    workspace_id                : Joi.number().required().positive(),
    status                      : Joi.string().optional(),
    workspace_image_url         : Joi.string().optional(),
    workspace_thumbnail_url     : Joi.string().optional(),
    remove_workspace_image      : Joi.boolean().optional(),
    default_manager_fugu_user_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getWorkspaceDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getWorkspaceDetails"
  };

  const schema = joiObject.keys({
    domain      : Joi.string().optional(),
    workspace   : Joi.string().optional(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().optional(),
    hrm_api_key : Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.sendDomainsToEmail = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "sendDomainsToEmail"
  };

  const schema = joiObject.keys({
    email: Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.createWorkspace = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "createWorkspace"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace: Joi.string().optional().min(3).max(30).trim(),
    workspace_name: Joi.string().required().min(3).max(30).trim(),
    device_id: Joi.string().required(),
    tookan_user_id: Joi.number().optional(),
    token: Joi.string().optional(),
    domain: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    device_details: emptySchema,
    utm_source: Joi.string().optional().allow(""),
    utm_medium: Joi.string().optional().allow(""),
    utm_campaign: Joi.string().optional().allow(""),
    utm_previous_page: Joi.string().optional().allow(""),
    utm_referrer: Joi.string().optional().allow(""),
    utm_old_source: Joi.string().optional().allow(""),
    utm_old_medium: Joi.string().optional().allow(""),
    utm_incomplete: Joi.string().optional().allow(""),
    utm_vertical: Joi.string().optional().allow(""),
    utm_ad_campaign_name: Joi.string().optional().allow(""),
    utm_vertical_page: Joi.string().optional().allow(""),
    utm_gclid: Joi.string().optional().allow(""),
    utm_term: Joi.string().optional().allow(""),
    utm_web_referrer: Joi.string().optional().allow(""),
    utm_continent_code: Joi.string().optional().allow(""),
    country_code: Joi.string().optional().allow(""),
    utm_old_campaign: Joi.string().optional().allow(""),
    is_signup: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.addPublicEmailDomain = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "addPublicEmailDomain"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    email_domain: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.editPublicEmailDomain = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "editPublicEmailDomain"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    add_email_domains: Joi.array().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getPublicInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getPublicInfo"
  };

  const schema = joiDeviceVersionObject.keys({
    workspace      : Joi.string().required(),
    access_token   : Joi.string().optional(),
    user_unique_key: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.publicInvite = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "publicInvite"
  };

  const schema = joiDeviceVersionObject.keys({
    workspace: Joi.string().required(),
    email: Joi.string().trim().email().optional(),
    invitation_type: Joi.string().required().valid(constants.allowedInviationTypeEnum),
    access_token: Joi.string().optional(),
    contact_number: Joi.string().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.getPublicEmailDomains = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getPublicEmailDomains"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive()
  });

  let validFields = validateFields(req, res, schema);

  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getOpenAndInvited = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getOpenAndInvited"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);

  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.joinWorkspace = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "join"
  };

  if (req.query.user_api_token) {
    req.body.user_api_token = req.query.user_api_token;
  }
  const schema = joiObject.keys({
    invitation_type: Joi.string().required(constants.allowedInviationTypeEnum),
    access_token: Joi.string().required(),
    email_token: Joi.string().optional(),
    workspace_id: Joi.number().optional().positive(),
    device_id: Joi.string().required(),
    token: Joi.string().optional(),
    device_details: emptySchema,
    voip_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getAllMembers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getAllMembers"
  };

  if (req.query.user_api_token) {
    req.body.user_api_token = req.query.user_api_token;
  }

  if (req.query.all_guest_included) {
    req.body.all_guest_included = commonFunctions.isString(req.query.all_guest_included) ? commonFunctions.jsonParse(req.query.all_guest_included) : req.querry.all_guest_included;
  }
  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
    user_status: Joi.string().optional(constants.allowedUserStatus),
    invitation_status: Joi.string().optional(constants.allowedInvitationStatus),
    user_type: Joi.string().optional(constants.allowedMembersType),
    invitation_type: Joi.string().optional(),
    all_guest_included: Joi.boolean().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getInvitedUsers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getInvitedUsers"
  };

  const schema = joiObject.keys({
    workspace_id: Joi.number().required().positive(),
    access_token: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.leave = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "leaveOpenSpace"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required().positive(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.insertScrumDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };


  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    business_id: Joi.number().optional(),
    manager_user_id: Joi.number().required(),
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
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

//--------------------------------------------------------------
//                  BILLING API
//--------------------------------------------------------------

exports.getPaymentDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "billing",
    apiHandler: "getPaymentDetails"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required(),
    app_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.addUserCards = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "billing",
    apiHandler: "addUserCards"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required(),
    payment_method: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getIntentToken = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "billing",
    apiHandler: "getIntentToken"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.buyPlan = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "billing",
    apiHandler: "buyPlan"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required(),
    plan_id: Joi.number().required()

  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.deactivateUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deactivateUser"
  }
  const schema = joiObject.keys({
    email: Joi.string().optional(),
    contact_number: Joi.string().optional(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

//--------------------------------------------------------------
//                     CHAT API VALIDATOR
//--------------------------------------------------------------

exports.groupChatSearch = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "groupChatSearch"
  };

  const schema = joiObject.keys({
    search_text: Joi.string().required().min(2),
    en_user_id: Joi.string().required(),
    user_role: Joi.string().optional(),
    include_all_users: Joi.string().optional(),
    access_token: Joi.string().optional(),
    searchOnlyGroupsAndBots: Joi.boolean().optional(),
    search_deactivated_member: Joi.boolean().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.pendingAndAcceptedUserSearch = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "groupChatSearch"
  };

  const schema = joiObject.keys({
    search_text: Joi.string().required().min(2),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    user_role: Joi.string().optional(),
    user_type: Joi.string().optional(),
    //include_all_users : Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.createGroupChat = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "createGroupChat"
  };

  const schema = joiObject.keys({
    user_ids_to_add: Joi.array().items(Joi.number().positive().required()).required(),
    custom_label: Joi.string().optional(),
    intro_message: Joi.string().optional(),
    chat_type: Joi.number().valid([constants.chatType.PRIVATE_GROUP, constants.chatType.PUBLIC_GROUP]).optional(),
    en_user_id: Joi.string().required(),
    no_admin_group: Joi.boolean().optional(),
    access_token: Joi.string().optional(),
    api_key: Joi.boolean().optional(),
    admin_user_ids: Joi.array().items(Joi.number().positive().required()).optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getChatGroupInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "getGroupInfo"
  };

  req.query.message_type = req.query.message_type && utils.isString(req.query.message_type) ? utils.jsonParse(req.query.message_type) : req.query.message_type;

  const querySchema = joiObject.keys({
    user_id: Joi.number().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    get_data_type: Joi.string().required().valid(constants.validGetGroupInfoDataType),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    api_key: Joi.boolean().optional(),
    message_type: Joi.array().items(Joi.number().positive().required()).optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.userSearch = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "userSearch"
  };

  const querySchema = joiObject.keys({
    search_text: Joi.string().required().min(2),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().optional(),
    accepted_members: Joi.boolean().optional(),
    no_guest_users: Joi.boolean().optional(),
    include_current_user: Joi.boolean().optional(),
    tagging : Joi.boolean().optional()
  });
  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getChatGroups = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "getChatGroups"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_type: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.clearChatHistory = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "clearChatHistory"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    muid: Joi.string().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.deleteMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "deleteMessage"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    muid: Joi.string().optional(),
    thread_muid: Joi.string().optional(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  if (!req.body.muid && !req.body.thread_muid) {
    return UniversalFunc.sendError(new Error("Missing Parameters!"), res);
  }

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.changeFollowingStatus = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "changeFollowingStatus"
  }

  const bodySchema = joiObject.keys({
    muid: Joi.string().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    following_status: Joi.any(),
    channel_id: Joi.number().positive().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.changeGroupInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "changeGroupInfo"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_ids_to_add: Joi.array().optional().items(Joi.number().required()),
    channel_ids_to_remove: Joi.array().optional().items(Joi.number().required())
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.editChatInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "editChatInfo"
  };

  let user_ids_to_make_admin = req.body.user_ids_to_make_admin;
  req.body.user_ids_to_make_admin = utils.isString(user_ids_to_make_admin) ? utils.jsonParse(user_ids_to_make_admin) : user_ids_to_make_admin;

  let user_ids_to_remove_admin = req.body.user_ids_to_remove_admin;
  req.body.user_ids_to_remove_admin = utils.isString(user_ids_to_remove_admin) ? utils.jsonParse(user_ids_to_remove_admin) : user_ids_to_remove_admin;

  req.body.only_admin_can_message = utils.isString(req.body.only_admin_can_message) ? utils.jsonParse(req.body.only_admin_can_message) : req.body.only_admin_can_message;

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    channel_image: Joi.any().optional(),
    custom_label: Joi.string().optional(),
    user_ids_to_make_admin: Joi.array().optional().items(Joi.number().required()),
    user_ids_to_remove_admin: Joi.array().optional().items(Joi.number().required()),
    chat_type: Joi.number().optional().valid(3, 4),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    status: Joi.number().optional(),
    api_key: Joi.string().optional(),
    only_admin_can_message: Joi.boolean().valid([true, false]).optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.getChannelInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "getChannelInfo"
  };

  const schema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.editMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "editMessage"
  };

  let tagged_users = req.body.tagged_users;
  req.body.tagged_users = utils.isString(tagged_users) ? utils.jsonParse(tagged_users) : tagged_users;

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    muid: Joi.string().optional(),
    access_token: Joi.string().optional(),
    thread_muid: Joi.string().optional(),
    channel_id: Joi.number().required(),
    message: Joi.string().required(),
    tagged_users: Joi.array().items(Joi.number().optional()).optional(),
    tagged_all: Joi.boolean().optional(),
    formatted_message: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.deleteFromChannel = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "deleteFromChannel"
  };

  const bodySchema = joiObject.keys({
    user_ids_to_remove: Joi.array().items(Joi.number().positive().required()).optional(),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    delete_channel: Joi.boolean().optional(),
    api_key: Joi.boolean().optional()
  });

  if (!req.body.user_ids_to_remove && !req.body.delete_channel) {
    return UniversalFunc.sendError(new Error("Missing Parameters!"), res);
  }

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.updateGuest = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "updateGuest"
  };

  const bodySchema = joiObject.keys({
    user_ids_to_connect: Joi.array().items(Joi.number().positive().required()).optional(),
    channel_ids_to_connect: Joi.array().items(Joi.number().positive().required()).optional(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    guest_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getGuestChannels = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "getGuestChannels"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    guest_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getMessageSeenBy = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "getMessageSeenBy"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    muid: Joi.string().optional(),
    thread_muid: Joi.string().optional(),
    channel_id: Joi.number().required(),
    page_start: Joi.number().required(),
    page_end: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.requestMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "requestMessage"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    domain: Joi.string().optional(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().required(),
    message: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};
//--------------------------------------------------------------
//                     BOT API
//--------------------------------------------------------------
exports.createUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "createUser"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);
  const groupSchema = Joi.object().keys({
    email: Joi.string().optional(),
    username: Joi.string().optional(),
    password: Joi.string().optional(),
    full_name: Joi.string().optional()
  });

  const schema = Joi.object().keys({
    csv: Joi.string().optional(),
    workspace_id: Joi.number().required(),
    user_data: Joi.array().items(groupSchema).optional(),
    token: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.createGroup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "createGroup"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);
  const groupSchema = Joi.object().keys({
    email: Joi.string().optional(),
    username: Joi.string().optional()
  });

  const schema = joiDeviceVersionObject.keys({
    csv: Joi.string().optional(),
    token: Joi.string().required(),
    user_data: Joi.array().items(groupSchema),
    is_private: Joi.boolean().optional(),
    workspace_id: Joi.number().required(),
    group_name: Joi.string().optional(),
    access_token: Joi.string().optional(),
    admin_usernames: Joi.array().items(Joi.string().required()).optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.addMemberInGroup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "addMemberInGroup"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);

  const groupSchema = Joi.object().keys({
    email: Joi.string().optional(),
    username: Joi.string().optional(),
  });

  const schema = joiDeviceVersionObject.keys({
    csv: Joi.string().optional(),
    token: Joi.string().required(),
    channel_id: Joi.number().required(),
    access_token: Joi.string().optional(),
    user_data: Joi.array().items(groupSchema),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.disableUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "disableUser"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);

  const groupSchema = Joi.object().keys({
    email: Joi.string().optional(),
    username: Joi.string().optional()
  });

  const schema = joiDeviceVersionObject.keys({
    token: Joi.string().required(),
    user_data: Joi.array().items(groupSchema),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.removeMemberFromGroup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "removeMemberFromGroup"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);

  const groupSchema = Joi.object().keys({
    email: Joi.string().optional(),
    username: Joi.string().optional()
  });

  const schema = joiDeviceVersionObject.keys({
    token: Joi.string().required(),
    channel_id: Joi.number().required(),
    user_data: Joi.array().items(groupSchema),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.renameGroup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "renameGroup"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);

  const schema = joiDeviceVersionObject.keys({
    channel_id: Joi.number().required(),
    custom_label: Joi.string().required(),
    token: Joi.string().required(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required(),
    email: Joi.string().optional(),
    username: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.getGroupInfo = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getGroupInfo"
  };

  req.query.workspace_id = commonFunctions.decryptText(req.query.token);

  const schema = joiDeviceVersionObject.keys({
    channel_id: Joi.number().required(),
    token: Joi.string().required(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.getAllUserUnreadCount = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getAllUserUnreadCount"
  };

  req.query.workspace_id = commonFunctions.decryptText(req.query.token);

  const schema = joiDeviceVersionObject.keys({
    token: Joi.string().required(),
    username: Joi.string().required(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.deleteGroup = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };

  req.body.workspace_id = commonFunctions.decryptText(req.body.token);

  const schema = joiDeviceVersionObject.keys({
    channel_id: Joi.number().positive().required(),
    token: Joi.string().required(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

//--------------------------------------------------------------
//                     TOOKAN USER VALIDATIONS
//--------------------------------------------------------------

exports.onBoardUser = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "onBoardUser"
  };

  const schema = Joi.object().keys({
    email: Joi.string().required(),
    api_key: Joi.string().required(),
    business_name: Joi.string().required(),
    full_name: Joi.string().required(),
    user_id: Joi.number().required(),
    phone: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.editWorkspace = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "editWorkspace"
  };

  const schema = joiDeviceVersionObject.keys({
    user_id: Joi.number().required(),
    access_token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
};

exports.whatsNewFeature = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "getGroupInfo"
  };

  const schema = joiDeviceVersionObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),

  }).unknown(true);

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getApps = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
    apiHandler: "getApps"
  };

  //

  const schema = joiDeviceVersionObject.keys({
    access_token: Joi.string().required(),
    workspace_id: Joi.number().optional(),
    app_id: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.updateDeviceTokenWeb = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "updateDeviceToken"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    user_id: Joi.number().required(),
    device_id: Joi.string().required(),
    token: Joi.string().required(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
}

/*
  Conversation Validators
*/
exports.uploadFileValidation = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "uploadFile"
  };

  const bodySchema = joiObject.keys({
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    message_type: Joi.number().optional(),
    access_token: Joi.string().optional(),
    muid: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (!validFields) {
    return;
  }

  if (!req.files && !req.files.length) {
    return UniversalFunc.sendError(new Error("Invalid file type, no file found"), res);
  }

  // check file size
  if (req.files[0].size > constants.maxUploadFileSize) {
    return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
  }
  next();
};

exports.getThreadMessages = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getThreadMessages",
    discard_logs: true
  };

  const querySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    access_token: Joi.string().optional(),
    muid: Joi.string().required(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.getLatestThreadMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getLatestThreadMessage"
  };

  let muids = req.query.muids;
  req.query.muids = commonFunctions.isString(muids) ? commonFunctions.jsonParse(muids) : muids;

  const querySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    muids: Joi.array().required().items(Joi.string().trim().required()),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.starMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "starMessage"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    muid: Joi.string().optional(),
    channel_id: Joi.number().optional(),
    is_starred: Joi.number().optional().valid(1, 0),
    unstar_all: Joi.boolean().optional(),
    thread_muid: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getStarredMessages = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getStarredMessages"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    start_message_id: Joi.number().optional(),
    end_message_id: Joi.number().optional(),
    channel_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.inviteToConference = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "inviteToConference"
  };

  let invite_user_ids = req.body.invite_user_ids;
  req.body.invite_user_ids = utils.isString(invite_user_ids) ? utils.jsonParse(invite_user_ids) : invite_user_ids;

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    invite_user_ids: Joi.array().required().items(Joi.number().required()),
    invite_link: Joi.string().required(),
    is_audio_conference: Joi.boolean().optional(),
    channel_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.verifyTurnCreds = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "verifyTurnCreds"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    username: Joi.string().required(),
    credentials: Joi.string().required(),
    turn_api_key: Joi.string().required()
      });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.updateStatus = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "updateStatus"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().required(),
    conversation_status: Joi.string().valid(Object.keys(constants.conversationStatus)).optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
}

exports.updateConferenceCall = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "updateConferenceCall"
  };

  const bodySchema = joiObject.keys({
    calling_link: Joi.string().required(),
    access_token: Joi.string().optional(),
    user_id_in_call: Joi.number().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    next()
  }
};

exports.createO2OChat = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "createO2OChat"
  };

  const bodySchema = joiObject.keys({
    chat_with_user_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.addChatMember = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "addChatMember"
  };

  let user_ids_to_add = req.body.user_ids_to_add;
  req.body.user_ids_to_add = utils.isString(user_ids_to_add) ? utils.jsonParse(user_ids_to_add) : user_ids_to_add;

  const bodySchema = joiObject.keys({
    user_id: Joi.number().optional(),
    user_ids_to_add: Joi.array().items(Joi.number().positive().required()).required(),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    api_key: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.removeChatMember = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "removeChatMember"
  };

  const bodySchema = joiObject.keys({
    user_id_to_remove: Joi.number().positive().required(),
    user_id: Joi.number().optional(),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    api_key: Joi.boolean().optional()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.joinChat = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "joinChat"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.leaveChat = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "leaveChat"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.exportData = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "export",
    apiHandler: "exportData"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().optional(),
    access_token: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  next()

};

exports.requestExport = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "export",
    apiHandler: "requestExport"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    workspace_id: Joi.number().required(),
    access_token: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getExportData = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "export",
    apiHandler: "getExportData"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    workspace_id: Joi.number().required()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

//--------------------------------------------------------------
//                     SOCKET DATA
//--------------------------------------------------------------

exports.socketData = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "socketData"
  };

  const schema = Joi.object().keys({
    channel_id: Joi.number().optional()
  }).unknown(true);

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
}

//--------------------------------------------------------------
//                     BOT API's
//--------------------------------------------------------------

exports.attendanceCron = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "attendanceCron"
  };

  const schema = Joi.object().keys({
    business_id: Joi.number().optional(),
    clock_out: Joi.boolean().optional(),
    start_time_interval: Joi.string().optional(),
    end_time_interval: Joi.string().optional(),
    attendance_business_id: Joi.number().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnAttendanceBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnAttendanceBot"
  };

  const schema = Joi.object().keys({
    user_names: Joi.array().optional(),
    type: Joi.string().optional(),
    data: Joi.object().optional(),
    business_token : Joi.string().optional(),
    clock_out: Joi.boolean().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnFuguBotChannel = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnFuguBotChannel"
  };

  const schema = Joi.object().keys({
    user_names: Joi.array().optional(),
    type: Joi.string().optional(),
    data: Joi.array().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnHrmBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnHrmBot"
  };

  const schema = Joi.object().keys({
    emails      : Joi.array().optional(),
    type        : Joi.string().optional(),
    workspace_id: Joi.number().optional(),
    data        : Joi.object().optional(),
    clock_out   : Joi.boolean().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnScrumBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnAttendanceBot"
  };

  const schema = Joi.object().keys({
    user_names: Joi.array().optional(),
    respondants: Joi.array().optional(),
    type: Joi.string().optional(),
    answers: Joi.array().optional(),
    channel_ids: Joi.array().optional(),
    data: Joi.object().optional(),
    scrum_name: Joi.string().optional(),
    scrum_name: Joi.string().optional(),
    business_token: Joi.string().optional(),
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnFuguBot = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnFuguBot"
  };

  const bodySchema = joiObject.keys({
    users_data: Joi.array().optional(),
    message: Joi.string().optional(),
    message_type: Joi.number().optional(),
    user_ids: Joi.array().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    broadcast_user_type: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (!(req.body.message_type == constants.messageType.MESSAGE)) {
    if (req.files[0].size > constants.maxUploadFileSize) {
      return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
    }
  }

  (req.body.message_type) ? req.body.message_type = JSON.parse(req.body.message_type) : '';

  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.publishMessageOnFuguBotChannelForAndroid = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnFuguBotChannelForAndroid"
  };

  const bodySchema = joiObject.keys({
    users_data: Joi.array().optional(),
    message: Joi.string().optional(),
    message_type: Joi.number().optional(),
    user_ids: Joi.array().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    broadcast_user_type: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);

  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.publishSecretSanta = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishSecretSanta"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    users_data: Joi.array().required(),
    message: Joi.string().optional(),
    broadcast_user_type: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.handleBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "handleBot"
  };
  const messageSchema = Joi.object().keys({
    message: Joi.string().required()
  });
  const schema = joiObject.keys({
    bot_token: Joi.string().required(),
    channel_id: Joi.string().required(),
    metric: Joi.string().required(),
    message: messageSchema
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.installApps = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
    apiHandler: "installApp"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    app_id: Joi.number().required(),
    status: Joi.number().optional(),
    workspace_id: Joi.number().optional(),
    time_zone: Joi.number().optional(),
    app_state: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getApps = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
    apiHandler: "getApps"
  };

  const querySchema = joiDeviceVersionObject.keys({
    workspace_id: Joi.number().optional(),
    access_token: Joi.string().optional(),
    app_id: Joi.string().optional()
  }).unknown(true);

  let validFields = validateKeys(req, res, null, querySchema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.createWebhook = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "createWebhook"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().required(),
    full_name: Joi.string().optional(),
    app_id: Joi.number().required(),
    id_model: Joi.string().optional(),
    token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getWebhooks = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "getWebhooks"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    app_id: Joi.number().required(),
    webhook_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editWebhook = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "editWebhook"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    webhook_id: Joi.number().required(),
    full_name: Joi.string().optional(),
    webhook_status: Joi.number().optional(),
    channel_id: Joi.number().optional(),
    app_id: Joi.number().optional(),
    id_model: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

//--------------------------------------------------------------
//                    ATTENDACE  APIs
//--------------------------------------------------------------

exports.getLeaveBalance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getLeaveBalance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    users_count: Joi.string().optional(constants.allowedUsersCount),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    user_name: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getBusinessLeaves = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getBusinessLeaves"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editBusinessLeave = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editBusinessLeave"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    leave_title: Joi.string().optional(),
    leave_synonyms: Joi.array().items(Joi.string().optional()).optional(),
    annual_count: Joi.number().optional(),
    accrual_interval: Joi.string().optional(),
    leave_type_id: Joi.number().optional(),
    status: Joi.number().optional(),
    max_annual_rollover: Joi.string().optional(),
    is_negative_leave_allowed: Joi.number().optional(),
    is_clock_in_allowed: Joi.number().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserLeaves = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserLeaves"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    leave_count: Joi.string().required(),
    leave_type_id: Joi.number().required(),
    user_name: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserInfoInAttendance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserInfoInAttendance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    manager_user_name: Joi.string().optional(),
    status: Joi.number().optional(),
    shift_start_time: Joi.string().optional(),
    work_hours: Joi.number().optional(),
    work_days: Joi.array().optional(),
    time_zone: Joi.number().optional(),
    employee_id: Joi.string().optional(),
    status: Joi.number().optional(),
    joining_date: Joi.string().optional(),
    birth_date: Joi.string().optional(),
    action_user_name: Joi.string().required(),
    user_punch_image: Joi.string().allow(null).optional(),
    config: Joi.object().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getMembers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getMembers"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    user_count: Joi.string().required(),
    user_name: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.deleteExpiredLeaves = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "updateMembersOnLeaveToday"
  };
  const schema = Joi.object().keys({
    data: Joi.object().optional(),
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.updateMembersOnLeave = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "updateMembersOnLeaveToday"
  };
  const schema = Joi.object().keys({
    data: Joi.array().optional(),
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.editBusinessInfoInAttendance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editBusinessInfoInAttendance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    session_start: Joi.string().optional(),
    session_end: Joi.string().optional(),
    end_date: Joi.string().optional(),
    admin_roles: Joi.array().optional(),
    hr_roles: Joi.array().optional(),
    auto_punch_out: Joi.number().optional(),
    work_days: Joi.array().optional(),
    work_start_time: Joi.string().optional(),
    work_hours: Joi.number().optional(),
    lunch_duration: Joi.number().optional(),
    punch_in_reminder_time: Joi.number().optional(),
    punch_out_reminder_time: Joi.number().optional(),
    business_area: Joi.array().optional(),
    config: Joi.object().optional(),
    keep_user_data: Joi.boolean().optional(),
    admin_ids_remove: Joi.array().optional(),
    hr_ids_remove: Joi.array().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getBusinessReport = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getBusinessReport"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    start_date: Joi.string().required(),
    end_date: Joi.string().required(),
    include_deactivated_users: Joi.boolean().optional(),
    action_user_name: Joi.string().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getBusinessInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getBusinessInfo"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserPunchStatus = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserPunchStatus"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    punch_in_time: Joi.string().optional(),
    punch_out_time: Joi.string().optional(),
    punch_id: Joi.number().optional(),
    user_name: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getUsersTimesheet = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getUsersTimesheet"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    search_text: Joi.string().optional()

  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.verifyAttendanceCredentials = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "verifyAttendanceCredentials"
  };

  let user_location = req.body.location;
  req.body.location = utils.isString(user_location) ? utils.jsonParse(user_location) : user_location;

  const lat_long = Joi.object().keys({
    longitude: Joi.string().optional(),
    latitude: Joi.string().optional()
  })

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    message_type: Joi.number().optional(),
    action: Joi.string().required(),
    location: lat_long,
    channel_id: Joi.number().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.uploadDefaultImage = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "uploadDefaultImage"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    message_type: Joi.number().optional(),
    action: Joi.string().optional(),
    channel_id: Joi.number().optional()
  }).unknown(true);

  if (!req.files && req.files.length < 0) {
    return UniversalFunc.sendError(new Error("Invalid file type, no file found"), res);
  }

  // check file size
  if (req.files[0].size > constants.maxUploadFileSize) {
    return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
  }

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getToken = async function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getToken"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      let validFields = validateFields(req, res, querySchema);
      if (validFields) {
        getUserAndSpaceDetails(req, next);
      }
    } catch (error) {
      console.error(error);
    }
  }
};

exports.verifyAttendanceToken = async function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "verifyAttendanceToken"
  };

  const querySchema = Joi.object().keys({
    token: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    next();
  }
};
//--------------------------------------------------------------
//                    Notifications
//-------------------------------------------------------------

exports.markReadAll = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "markReadAll"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getNotifications = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "getNotifications"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    page_start: Joi.number().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getUnreadNotifications = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "getUnreadNotifications"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.notifyUsers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "notifyUsers"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    notification_type: Joi.string().required(),
    access_token: Joi.string().optional(),
    domain: Joi.string().optional(),
    user_unique_keys: Joi.array().required().items(Joi.string().required()),
    notification_title: Joi.string().optional(),
    push_message: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

//--------------------------------------------------------------
//                     GENERIC VALIDATIONS
//--------------------------------------------------------------

//   let validFields = validateFields(req, res, schema);
//   if (validFields) {
//     loginViaAccessTokenV1(req, res, req.logHandler, next);
//   }
// }

/*
  Conversation Validators
*/
exports.uploadFileValidation = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "uploadFile"
  };

  const bodySchema = joiObject.keys({
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    access_token: Joi.string().optional(),
    message_type: Joi.number().optional(),
    muid: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (!validFields) {
    return;
  }

  if (!req.files && !req.files.length) {
    return UniversalFunc.sendError(new Error("Invalid file type, no file found"), res);
  }

  // check file size
  if (req.files[0].size > constants.maxUploadFileSize) {
    return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
  }
  next();
};

exports.getMessages = async function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getMessages",
    discard_logs: true
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  req.query.device_details = commonFunctions.isString(req.query.device_details) ? commonFunctions.jsonParse(req.query.device_details) : req.query.device_details;

  const querySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    en_user_id: Joi.string().required(),
    device_id: Joi.string().optional(),
    device_token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    access_token: Joi.string().optional(),
    devisce_details: emptySchema,
    device_details: emptySchema,
    store_promise : Joi.any().optional(),
    old_dashboard: Joi.any().optional()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next, res);
    } catch (error) {
      console.error(error);
    }
  }
  // if (validFields) {
  //   loginViaAccessTokenV1(req, res, req.logHandler, next);
  // }
};

exports.getConversations = async function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getConversations",
    discard_logs: true
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  req.query.device_details = commonFunctions.isString(req.query.device_details) ? commonFunctions.jsonParse(req.query.device_details) : req.query.device_details;

  const querySchema = joiObject.keys({
    // user_id        : Joi.number().positive().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    en_user_id: Joi.string().required(),
    device_id: Joi.string().optional(),
    device_token: Joi.string().optional(),
    voip_token: Joi.string().optional(),
    access_token: Joi.string().optional(),
    device_details: emptySchema,
    old_dashboard : Joi.any().optional(),
    is_hrm : Joi.any().optional(),
    is_bots : Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
}

exports.getThreadMessages = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getThreadMessages",
    discard_logs: true
  };

  const querySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    muid: Joi.string().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.getLatestThreadMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "getLatestThreadMessage"
  };

  let muids = req.query.muids;
  req.query.muids = commonFunctions.isString(muids) ? commonFunctions.jsonParse(muids) : muids;

  const querySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    muids: Joi.array().required().items(Joi.string().trim().required()),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, querySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.conversationSendMessage = async function (req, res, next) {

  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "sendMessage"
  };

  req.body.data = utils.isString(req.body.data) ? utils.jsonParse(req.body.data) : req.body.data;
  if (req.query.token && req.body.is_hippo_message) {
    let decrypt_token = utils.decryptText(req.query.token);
    let data = decrypt_token.split("_");
    req.headers.app_secret_key = data[0];
    req.headers.device_type = "WEB";
    req.headers.app_version = "1.1"
    req.body.token = req.query.token;
    req.body.en_user_id = utils.encryptText(parseInt(data[1]));
    req.body.channel_id = parseInt(data[2]);
    // let str=req.body.user_id+'';
    //req.body.userId = str.split("_")[0];
    delete req.body.access_token
  } else if (req.query.token) {
    let webhookResult = await bot.getWebhookDetails(req.logHandler, { hash: req.query.token });
    if (!webhookResult.length) {
      throw new Error("Webhook is Disabled")
    }
    req.headers.app_secret_key = webhookResult[0].app_secret_key;
    req.headers.device_type = "WEB";
    req.headers.app_version = "1.1"
    req.body.token = req.query.token;
    req.body.user_id = webhookResult[0].user_id;
    req.body.en_user_id = utils.encryptText(webhookResult[0].user_id)
    req.body.channel_id = webhookResult[0].channel_id;
  }

  const dataSchema = Joi.object().keys({
    message: Joi.string().optional().allow("")
  }).unknown(true);

  const bodySchema = joiObject.keys({
    user_id: Joi.number().positive().optional(),
    channel_id: Joi.number().positive().optional(),
    data: dataSchema,
    en_user_id: Joi.string().optional(),
    access_token: Joi.string().optional(),
    token: Joi.string().optional()
  }).unknown(true);

  //if(req.body.data.is_hippo_message) {
  //req.body = req.body.data
  // }

  let validFields = validateFields(req, res, bodySchema);

  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.searchMessages = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "searchMessages",
    discard_logs: true
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    search_text: Joi.string().required(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    channel_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.starMessage = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "starMessage"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    muid: Joi.string().optional(),
    channel_id: Joi.number().optional(),
    is_starred: Joi.number().optional().valid(1, 0),
    unstar_all: Joi.boolean().optional(),
    thread_muid: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.inviteToConference = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "inviteToConference"
  };

  let invite_user_ids = req.body.invite_user_ids;
  req.body.invite_user_ids = utils.isString(invite_user_ids) ? utils.jsonParse(invite_user_ids) : invite_user_ids;

  const bodySchema = joiObject.keys({
    en_user_id               : Joi.string().required(),
    access_token             : Joi.string().optional(),
    invite_user_ids          : Joi.array().required().items(Joi.number().required()),
    invite_link              : Joi.string().required(),
    is_google_meet_conference: Joi.boolean().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.createO2OChat = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "createO2OChat"
  };

  const bodySchema = joiObject.keys({
    chat_with_user_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.addChatMember = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "addChatMember"
  };

  let user_ids_to_add = req.body.user_ids_to_add;
  req.body.user_ids_to_add = utils.isString(user_ids_to_add) ? utils.jsonParse(user_ids_to_add) : user_ids_to_add;

  const bodySchema = joiObject.keys({
    user_id: Joi.number().optional(),
    user_ids_to_add: Joi.array().items(Joi.number().positive().required()).required(),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    api_key: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.removeChatMember = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "removeChatMember"
  };

  const bodySchema = joiObject.keys({
    user_id_to_remove: Joi.number().positive().required(),
    user_id: Joi.number().optional(),
    channel_id: Joi.number().positive().required(),
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    api_key: Joi.boolean().optional()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.joinChat = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "joinChat"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

exports.leaveChat = async (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "leaveChat"
  };

  const bodySchema = joiObject.keys({
    channel_id: Joi.number().positive().required(),
    access_token: Joi.string().optional(),
    en_user_id: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema, null);
  if (validFields) {
    try {
      const channelInfo = await channelService.getInfo(req.logHandler, { channel_id: req.body.channel_id });
      req.body.channelInfo = channelInfo[0];
      getUserAndSpaceDetails(req, next);
    } catch (error) {
      console.error(error);
    }
  }
};

//--------------------------------------------------------------
//                     SOCKET DATA
//--------------------------------------------------------------

exports.socketData = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "chat",
    apiHandler: "socketData"
  };

  const schema = Joi.object().keys({
    channel_id: Joi.number().optional()
  }).unknown(true);

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
}

//--------------------------------------------------------------
//                     BOT API's
//--------------------------------------------------------------

exports.attendanceCron = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "attendanceCron"
  };

  const schema = Joi.object().keys({
    business_id: Joi.number().optional(),
    clock_out: Joi.boolean().optional(),
    start_time_interval: Joi.string().optional(),
    end_time_interval: Joi.string().optional(),
    attendance_business_id: Joi.number().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnAttendanceBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnAttendanceBot"
  };

  const schema = Joi.object().keys({
    user_names: Joi.array().optional(),
    type: Joi.string().optional(),
    data: Joi.object().optional(),
    business_token: Joi.string().optional(),
    clock_out: Joi.boolean().optional()
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.publishMessageOnFuguBot = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "publishMessageOnFuguBot"
  };

  const bodySchema = joiObject.keys({
    users_data: Joi.array().optional(),
    message: Joi.string().optional(),
    message_type: Joi.number().optional(),
    user_ids: Joi.array().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    broadcast_user_type: Joi.string().optional()
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (!(req.body.message_type == constants.messageType.MESSAGE)) {
    if (req.files[0].size > constants.maxUploadFileSize) {
      return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
    }
  }

  (req.body.message_type) ? req.body.message_type = JSON.parse(req.body.message_type) : '';

  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.handleBot = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "bot",
    apiHandler: "handleBot"
  };

  const messageSchema = Joi.object().keys({
    message: Joi.string().required()
  });
  const schema = joiObject.keys({
    bot_token: Joi.string().required(),
    channel_id: Joi.string().required(),
    metric: Joi.string().required(),
    message: messageSchema
  });

  let validFields = validateSchema(req.body, res, schema);
  if (validFields) {
    next();
  }
};

exports.installApps = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
    apiHandler: "installApp"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    app_id: Joi.number().required(),
    status: Joi.number().optional(),
    workspace_id: Joi.number().optional(),
    time_zone: Joi.number().optional(),
    app_state: Joi.string().optional(),
    is_install_hrm_bot: Joi.number().optional(),
    hrm_url  : Joi.string().when('is_install_hrm_bot', { is: 1, then: Joi.required(), otherwise: Joi.optional()}),
    auth_token: Joi.string().when('is_install_hrm_bot', { is: 1, then: Joi.required(), otherwise: Joi.optional()}),
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getApps = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
    apiHandler: "getApps"
  };

  const querySchema = joiDeviceVersionObject.keys({
    workspace_id: Joi.number().optional(),
    access_token: Joi.string().optional(),
    app_id: Joi.string().optional()
  }).unknown(true);

  let validFields = validateKeys(req, res, null, querySchema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.createWebhook = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "createWebhook"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    channel_id: Joi.number().required(),
    full_name: Joi.string().optional(),
    app_id: Joi.number().required(),
    id_model: Joi.string().optional(),
    token: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getWebhooks = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "getWebhooks"
  };

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    app_id: Joi.number().required(),
    webhook_id: Joi.number().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editWebhook = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "webhook",
    apiHandler: "editWebhook"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    webhook_id: Joi.number().required(),
    full_name: Joi.string().optional(),
    webhook_status: Joi.number().optional(),
    channel_id: Joi.number().optional(),
    app_id: Joi.number().optional(),
    id_model: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editScrumDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };

  const schema = joiObject.keys({
    business_id: Joi.number().required(),
    access_token: Joi.string().required(),
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
    scrum_status: Joi.string().optional(),
    scrum_name: Joi.string().optional(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.getScrumDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };

  const schema = joiObject.keys({
    access_token: Joi.string().required(),
    user_name: Joi.string().optional(),
    scrum_id: Joi.number().optional(),
    business_id: Joi.number().optional(),
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
};

exports.scrumCron = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };

  const schema = Joi.object().keys({
    scrum_id: Joi.string().optional()
  });

  req.query.scrum_id ? req.body.scrum_id = req.query.scrum_id : 0;

  let validFields = validateFields(req.query, res, schema);
  if (validFields) {
    next();
  }
};

exports.checkUserAvailability = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "deleteGroup"
  };

  const schema = joiDeviceVersionObject.keys({
    user_id: Joi.array().optional(),
    business_id: Joi.number().required(),
    access_token: Joi.string().optional(),
    start_day: Joi.string().optional(),
    time_zone: Joi.number().optional(),
    active_days: Joi.array().optional(),
    frequency: Joi.number().optional(),
    start_time: Joi.string().optional(),
    scrum_id: Joi.string().optional()
  });
  req.query.user_name ? req.body.user_name = req.query.user_name : 0;
  req.query.scrum_id ? req.body.scrum_id = req.query.scrum_id : 0;

  let validFields = validateFields(req.query, res, schema);
  if (validFields) {
    next();
  }
};


//--------------------------------------------------------------
//                    ATTENDACE  APIs
//--------------------------------------------------------------

exports.getLeaveBalance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getLeaveBalance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    users_count: Joi.string().optional(constants.allowedUsersCount),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    user_name: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getBusinessLeaves = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getBusinessLeaves"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editBusinessLeave = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editBusinessLeave"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    leave_title: Joi.string().optional(),
    leave_synonyms: Joi.array().items(Joi.string().optional()).optional(),
    annual_count: Joi.number().optional(),
    accrual_interval: Joi.string().optional(),
    leave_type_id: Joi.number().optional(),
    status: Joi.number().optional(),
    max_annual_rollover: Joi.string().optional(),
    is_negative_leave_allowed: Joi.number().optional(),
    is_clock_in_allowed: Joi.number().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserLeaves = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserLeaves"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    leave_count: Joi.string().required(),
    leave_type_id: Joi.number().required(),
    user_name: Joi.string().required()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserInfoInAttendance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserInfoInAttendance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    manager_user_name: Joi.string().optional(),
    status: Joi.number().optional(),
    shift_start_time: Joi.string().optional(),
    work_hours: Joi.number().optional(),
    work_days: Joi.array().optional(),
    time_zone: Joi.number().optional(),
    employee_id: Joi.string().optional(),
    status: Joi.number().optional(),
    joining_date: Joi.string().optional(),
    birth_date: Joi.string().optional(),
    action_user_name: Joi.string().required(),
    user_punch_image: Joi.string().allow(null).optional(),
    config: Joi.object().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getMembers = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getMembers"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    user_count: Joi.string().required(),
    user_name: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional()
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editBusinessInfoInAttendance = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editBusinessInfoInAttendance"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    session_start: Joi.string().optional(),
    session_end: Joi.string().optional(),
    end_date: Joi.string().optional(),
    admin_roles: Joi.array().optional(),
    hr_roles: Joi.array().optional(),
    auto_punch_out: Joi.number().optional(),
    work_days: Joi.array().optional(),
    work_start_time: Joi.string().optional(),
    work_hours: Joi.number().optional(),
    lunch_duration: Joi.number().optional(),
    punch_in_reminder_time: Joi.number().optional(),
    punch_out_reminder_time: Joi.number().optional(),
    business_area: Joi.array().optional(),
    config: Joi.object().optional(),
    keep_user_data: Joi.boolean().optional(),
    admin_ids_remove: Joi.array().optional(),
    hr_ids_remove: Joi.array().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getBusinessInfo = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getBusinessInfo"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema
  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.editUserPunchStatus = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "editUserPunchStatus"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    punch_in_time: Joi.string().optional(),
    punch_out_time: Joi.string().optional(),
    punch_id: Joi.number().optional(),
    user_name: Joi.string().optional()
  });

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getUsersTimesheet = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "getUsersTimesheet"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);

  const querySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    device_id: Joi.string().optional(),
    device_details: emptySchema,
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional(),
    page_start: Joi.number().optional(),
    page_end: Joi.number().optional(),
    search_text: Joi.string().optional()

  });

  let validFields = validateFields(req, res, querySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.verifyAttendanceCredentials = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "verifyAttendanceCredentials"
  };

  let user_location = req.body.location;
  req.body.location = utils.isString(user_location) ? utils.jsonParse(user_location) : user_location;

  const lat_long = Joi.object().keys({
    longitude: Joi.string().optional(),
    latitude: Joi.string().optional()
  })

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    message_type: Joi.number().optional(),
    action: Joi.string().required(),
    is_hrm_bot: Joi.any().optional(),
    location: lat_long,
  }).unknown(true);

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.uploadDefaultImage = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "uploadDefaultImage"
  };

  const bodySchema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    file_type: Joi.string().optional(),
    file_name: Joi.string().optional(),
    message_type: Joi.number().optional(),
    action: Joi.string().optional(),
    is_hrm_bot: Joi.any().optional()
  }).unknown(true);

  if (!req.files && req.files.length < 0) {
    return UniversalFunc.sendError(new Error("Invalid file type, no file found"), res);
  }

  // check file size
  if (req.files[0].size > constants.maxUploadFileSize) {
    return UniversalFunc.sendError(new Error("File size cannot be greater than 100 MB"), res);
  }

  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

//--------------------------------------------------------------
//                    Notifications
//-------------------------------------------------------------

exports.markReadAll = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "markReadAll"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getNotifications = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "getNotifications"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional(),
    page_start: Joi.number().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.getUnreadNotifications = (req, res, next) => {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "notification",
    apiHandler: "getUnreadNotifications"
  };

  const schema = joiObject.keys({
    en_user_id: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    getUserAndSpaceDetails(req, next);
  }
};

exports.logException = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "logException"
  };

  const emptySchema = Joi.object().keys({}).unknown(true);
  const bodySchema = joiObject.keys({
    device_details: emptySchema,
    error: emptySchema,
  }).unknown(true);

  if (_.isEmpty(req.body.device_details) || _.isEmpty(req.body.error)) {
    return UniversalFunc.sendError(new Error("invalid device details or error "), res);
  }
  if (utils.isString(req.body.device_details)) {
    if (!utils.validStringifiedJson(req.logHandler, req.body.device_details)) {
      return UniversalFunc.sendError(new Error("Invalid device details"), res);
    }
    req.body.device_details = utils.jsonParse(req.body.device_details);
  }
  if (utils.isString(req.body.error)) {
    if (!utils.validStringifiedJson(req.logHandler, req.body.error)) {
      return UniversalFunc.sendError(new Error("Invalid error"), res);
    }
    req.body.error = utils.jsonParse(req.body.error);
  }
  next();
};

//--------------------------------------------------------------
//                     GENERIC VALIDATIONS
//--------------------------------------------------------------

exports.empty = function (req, res, next) {
  version.is_force = 0;

  req.body.version = version;
  next();
};

const validateFields = async function (req, res, schema) {
  if (req.body) {
    // req.body.access_token ? delete req.body.access_token : 0;
    req.body.app_version ? delete req.body.app_version : 0;
    req.body.device_type ? delete req.body.device_type : 0;
  }

  if (req.headers) {
    req.headers.access_token ? req.body.access_token = req.headers.access_token : 0;
    req.headers.app_version ? req.body.app_version = req.headers.app_version : 0;
    req.headers.device_type ? req.body.device_type = req.headers.device_type : 0;
    req.headers.user_name ? req.body.user_name = req.headers.user_name : 0;
    req.headers.searchOnlyGroupsAndBots ? req.body.searchOnlyGroupsAndBots = req.headers.searchOnlyGroupsAndBots : 0;
    req.headers.auth_token ? req.body.auth_token = req.headers.auth_token : 0;
    req.headers.domain ? req.body.domain = req.headers.domain : 0;
  }

  if (req.query) {
    req.body = Object.assign(req.body, req.query);
    // req.query.email ? req.body.email = req.query.email : 0;
    // req.query.workspace_id ? req.body.workspace_id = req.query.workspace_id : 0;
    // req.query.email_token ? req.body.email_token = req.query.email_token : 0;
    // req.query.fugu_user_id ? req.body.fugu_user_id = req.query.fugu_user_id : 0;
    // req.query.workspace ? req.body.workspace = req.query.workspace : 0;
    // req.query.contact_type ? req.body.contact_type = req.query.contact_type : 0;
    // req.query.user_status ? req.body.user_status = req.query.user_status : 0;
    // req.query.invitation_status ? req.body.invitation_status = req.query.invitation_status : 0;
    // req.query.user_type ? req.body.user_type = req.query.user_type : 0;
    // req.query.metric ? req.body.metric = req.query.metric : 0;
    // req.query.bot_user_id ? req.body.bot_user_id = req.query.bot_user_id : 0;
    // req.query.channel_id ? req.body.channel_id = req.query.channel_id : 0;
    // req.query.metric_text ? req.body.metric_text = req.query.metric_text : 0;
    // req.query.domain ? req.body.domain = req.query.domain : 0;
    // req.query.token ? req.body.token = req.query.token : 0;
    // req.query.page_start ? req.body.page_start = req.query.page_start : 0;
    // req.query.app_id ? req.body.app_id  = req.query.app_id : 0;
    // req.query.invitation_type ? req.body.invitation_type = req.query.invitation_type : 0;
    // req.query.en_user_id ? req.body.en_user_id = req.query.en_user_id : 0;
    req.query.email ? req.body.email = req.query.email : 0;
    req.query.workspace_id ? req.body.workspace_id = req.query.workspace_id : 0;
    req.query.email_token ? req.body.email_token = req.query.email_token : 0;
    req.query.fugu_user_id ? req.body.fugu_user_id = req.query.fugu_user_id : 0;
    req.query.workspace ? req.body.workspace = req.query.workspace : 0;
    req.query.contact_type ? req.body.contact_type = req.query.contact_type : 0;
    req.query.user_status ? req.body.user_status = req.query.user_status : 0;
    req.query.invitation_status ? req.body.invitation_status = req.query.invitation_status : 0;
    req.query.user_type ? req.body.user_type = req.query.user_type : 0;
    req.query.metric ? req.body.metric = req.query.metric : 0;
    req.query.bot_user_id ? req.body.bot_user_id = req.query.bot_user_id : 0;
    req.query.channel_id ? req.body.channel_id = req.query.channel_id : 0;
    req.query.metric_text ? req.body.metric_text = req.query.metric_text : 0;
    req.query.domain ? req.body.domain = req.query.domain : 0;
    req.query.token ? req.body.token = req.query.token : 0;
    req.query.page_start ? req.body.page_start = req.query.page_start : 0;
    req.query.page_end ? req.body.page_end = req.query.page_end : 0;
    req.query.app_id ? req.body.app_id = req.query.app_id : 0;
    req.query.invitation_type ? req.body.invitation_type = req.query.invitation_type : 0;
    req.query.user_name ? req.body.user_name = req.query.user_name : 0;
    req.query.scrum_id ? req.body.scrum_id = req.query.scrum_id : 0;
    req.query.business_id ? req.body.business_id = req.query.business_id : 0;
  }

  if (req.body.domain && (!req.logHandler || !req.logHandler.apiHandler.includes('userLogout'))) {
    let domainDetails = await workspaceService.getDomainDetails(req.logHandler ? req.logHandler : null, {domain: req.body.domain});
    if (!_.isEmpty(domainDetails)) {
      if(!domainDetails[0].status){
        UniversalFunc.sendError(new Error('Domain invalid or expired.'), res);
        return false;
      }
    }
  }

  const validation = Joi.validate(req.body, schema);
  if (validation.error) {
    let errorName = validation.error.name;
    let errorReason = validation.error.details !== undefined ? validation.error.details[0].message : 'Parameter missing or parameter type is wrong';
    UniversalFunc.sendError(new Error(errorName + ' ' + errorReason), res);
    return false;
  }
  return true;
};

const loginViaAccessToken = function (req, res, logHandler, next) {
  Promise.coroutine(function* () {
    req.body.app_update_message = constants.appUpdateMessage.DEFAULT;
    let error;
    let obj = { access_token: req.body.access_token };
    if (req.body.workspace_id) {
      obj.workspace_id = req.body.workspace_id;
    }

    /*
    if(req.body.source && req.body.source == 'branchio') {
      let access_token = bcrypt.hashSync(req.body.access_token, saltRounds);
      yield userService.replaceAccessToken(logHandler, { old_access_token : req.body.access_token, new_access_token : access_token });
      obj.access_token = access_token;
    }
    */
    let userInfo = yield userService.getUserDetails(logHandler, obj);
    if (_.isEmpty(userInfo)) {
      error = new Error("Session expired! Please login again");
      error.errorResponse = RESP.ERROR.eng.INVALID_ACCESS_TOKEN;
      throw error;
    }

    if (req.body.workspace_id && userInfo[0].status == constants.userStatus.DISABLED) {
      error = new Error("You have been deactivated from this business!");
      error.errorResponse = RESP.ERROR.eng.USER_BLOCKED;
      throw error;
    }

    // version  control check
    commonFunctions.checkAppVersion(logHandler, req.body);

    // TODO remove app_update_message and change data type
    for (let user of userInfo) {
      let businessPropertyValue = yield workspaceService.getConfiguration(logHandler, user.workspace_id);
      user.config = {};
      commonFunctions.addAllKeyValues(businessPropertyValue, user.config);
      user.is_admin = true;
      user.attributes = commonFunctions.jsonParse(user.attributes);
      user.app_update_message = req.body.app_update_message;
      user.app_update_config = {
        app_update_message: req.body.app_update_message,
        app_link: constants.appUpdateLink[req.body.device_type],
        app_update_text: constants.appUpdateText[req.body.device_type]
      };
    }
    logger.trace(logHandler, "FINAL GOING FORWARD", userInfo);
    req.body.userInfo = userInfo;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    next();
  }, (error) => {
    logger.error(logHandler, { EVENT: "loginViaAccessToken" }, { MESSAGE: error.message });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
};

const loginViaAccessTokenV1 = function (req, res, logHandler, next) {
  Promise.coroutine(function* () {
    req.body = Object.assign(req.body, req.query);
    req.body = Object.assign(req.body, req.headers);
    let error;
    let userInfo = yield userService.getInfo(logHandler, { access_token: req.body.access_token });
    if (_.isEmpty(userInfo)) {
      error = new Error("Session expired! Please login again");
      error.errorResponse = RESP.ERROR.eng.INVALID_ACCESS_TOKEN;
      throw error;
    }
    let workspaceInfo = {};
    if (req.body.workspace_id) {
      let workspaceDetails = yield workspaceService.getUserBusinessesDetails(logHandler, { user_id: userInfo[0].user_id, workspace_id: req.body.workspace_id });
      // check if workspace is disabled
      if (!_.isEmpty(workspaceDetails) && workspaceDetails[0].workspace_status == constants.businessStatus.DISABLED) {
        error = new Error("Workspace has been disabled!");
        error.errorResponse = RESP.ERROR.eng.WORKSPACE_DEACTIVATED;
        throw error;
      }

      // check if user is deactivated from workspace
      if (!_.isEmpty(workspaceDetails) && workspaceDetails[0].user_status == constants.userStatus.DISABLED) {
        error = new Error("You have been deactivated from this Workspace");
        error.errorResponse = RESP.ERROR.eng.USER_BLOCKED;
        throw error;
      }

      // get workspace property value open invitations or not by default anyone can in any workspace
      if (!_.isEmpty(workspaceDetails)) {
        let workspacePropertyValue = yield workspaceService.getConfiguration(logHandler, workspaceDetails[0].workspace_id);
        workspaceDetails[0].config = {};
        commonFunctions.addAllKeyValues(workspacePropertyValue, workspaceDetails[0].config);
      }
      workspaceInfo = workspaceDetails ? workspaceDetails[0] : workspaceInfo;
    }
    req.body.userInfo = userInfo[0];
    req.body.workspaceInfo = workspaceInfo;
    logger.trace(logHandler, "FINAL GOING FORWARD", req.body.userInfo, req.body.workspaceInfo);
  })().then((data) => {
    logger.trace(logHandler, { loginViaAccessTokenV1: data });
    next();
  }, (error) => {
    logger.error(logHandler, { EVENT: "loginViaAccessToken" }, { MESSAGE: error.message });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
};

function validateKeys(req, res, bodySchema, querySchema) {
  if (validateSchema(req.headers, res, headerSchema)) {
    if (bodySchema) {
      return validateSchema(req.body, res, bodySchema);
    } else {
      return validateSchema(req.query, res, querySchema);
    }
  }
}

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

async function getUserAndSpaceDetails(req, next, res) {
  if (!req.body.en_user_id) {
    throw new Error('User id is required.')
  }
  const user_id = commonFunctions.decryptText(req.body.en_user_id);
  if (!user_id) {
    throw new Error("Invalid parameter en_user_id");
  }
  const payload = {
    user_id
  };
  try {
    const userInfo = await convService.getTokenFromUserId(req.logHandler, payload);
    if (userInfo[0].status == constants.userStatus.DISABLED) {
      throw new Error('User is Disabled')
    }
    const businessInfo = await workspaceService.getSpaceDetailsById(req.logHandler, { workspace_id: userInfo[0].workspace_id });
    req.body.userInfo = userInfo[0];
    req.body.businessInfo = businessInfo[0];
    if (req.body.businessInfo.status == constants.status.DISABLED) {
      return res.status(400).send({ statusCode: 400, message: "Workspace Disabled" });
    }
    next();
  } catch (error) {
    console.error(error);
  }
}

async function getSpaceDetails(req, next) {
  if (!req.body.en_user_id) {
    throw new Error('User id is required.')
  }
  const user_id = commonFunctions.decryptText(req.body.en_user_id);
  if (!user_id) {
    throw new Error("Invalid parameter en_user_id");
  }
  const payload = {
    user_id
  };
  try {
    const userInfo = await convService.getUserDetails(req.logHandler, payload);
    const businessInfo = await workspaceService.getSpaceDetailsById(req.logHandler, { workspace_id: userInfo[0].workspace_id });
    req.body.userInfo = userInfo[0];
    req.body.businessInfo = businessInfo[0];
    next();
  } catch (error) {
    console.error(error);
  }
}

exports.meetCount = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "workspace",
    apiHandler: "meetCount"
  };
  logger.debug(req.logHandler, { REQUEST_BODY: req.body, REQUEST_QUERY: req.query, REQUEST_HEADERS: req.headers });

  const schema = joiDeviceVersionObject.keys({
    domain: Joi.string().required(),
    access_token: Joi.string().optional()
  });

  const validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.updateUserDetails = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "updateUserDetails"
  };

  const schema = joiObject.keys({
    full_name           : Joi.string().required(),
    access_token        : Joi.string().required(),
    device_id           : Joi.string().required(),
    email               : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    contact_number      : Joi.string().optional(),
    phone_number        : Joi.string().optional(),
    workspace           : Joi.string().optional().min(3).max(30).trim(),
    workspace_name      : Joi.string().optional().min(3).max(30).trim(),
    tookan_user_id      : Joi.number().optional(),
    token               : Joi.string().optional(),
    domain              : Joi.string().optional(),
    voip_token          : Joi.string().optional(),
    device_details      : emptySchema,
    utm_source          : Joi.string().optional().allow(""),
    utm_medium          : Joi.string().optional().allow(""),
    utm_campaign        : Joi.string().optional().allow(""),
    utm_previous_page   : Joi.string().optional().allow(""),
    utm_referrer        : Joi.string().optional().allow(""),
    utm_old_source      : Joi.string().optional().allow(""),
    utm_old_medium      : Joi.string().optional().allow(""),
    utm_incomplete      : Joi.string().optional().allow(""),
    utm_vertical        : Joi.string().optional().allow(""),
    utm_ad_campaign_name: Joi.string().optional().allow(""),
    utm_vertical_page   : Joi.string().optional().allow(""),
    utm_gclid           : Joi.string().optional().allow(""),
    utm_term            : Joi.string().optional().allow(""),
    utm_web_referrer    : Joi.string().optional().allow(""),
    utm_continent_code  : Joi.string().optional().allow(""),
    country_code        : Joi.string().optional().allow(""),
    utm_old_campaign    : Joi.string().optional().allow("")
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
}

exports.getLoginOtp = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getLoginOtp"
  };

  let schema = joiObject.keys({
    contact_number : Joi.string().optional(),
    email          : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    app_type       : Joi.string().optional(),
    resend_otp     : Joi.number().optional(),
    domain         : Joi.string().optional()
  }).or('email', 'contact_number');
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.validateLogInOtp = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "validateLoginOtp"
  };

  let schema;
  if (req.body.contact_number) {
    schema = joiObject.keys({
      contact_number: Joi.string().required(),
      otp           : Joi.number().required(),
      signup_source : Joi.string().optional(),
      domain        : Joi.string().optional(),
      app_version   : Joi.string().optional(),
      device_id     : Joi.string().optional(),
      device_type   : Joi.string().valid(constants.validDevices).optional(),
      token         : Joi.string().optional(),
      voip_token    : Joi.string().optional(),
      device_details: emptySchema,
      time_zone     : Joi.number().optional()
    });
  } else {
    schema = joiObject.keys({
      email             : Joi.string().trim().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
      verification_token: Joi.string().required(),
      signup_source     : Joi.string().optional(),
      domain            : Joi.string().optional(),
      app_version       : Joi.string().optional(),
      device_id         : Joi.string().optional(),
      device_type       : Joi.string().valid(constants.validDevices).optional(),
      token             : Joi.string().optional(),
      voip_token        : Joi.string().optional(),
      device_details    : emptySchema,
      time_zone     : Joi.number().optional()
    })
  }
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.calculateInvitePrice = (req, res, next)=>{
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "calculateInvitePrice"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });
  let schema = joiObject.keys({
     access_token   : Joi.string().required(),
     user_count     : Joi.number().required(),
     en_user_id     : Joi.string().required(),
     price_type     : Joi.number().valid(1,2).required(),
     domain         : Joi.string().optional(),
     workspace_id   : Joi.number().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
}

exports.initiatePayment = (req, res, next)=>{
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "initiatePayment"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });
  let schema = joiObject.keys({
     access_token   : Joi.string().required(),
     amount         : Joi.string().required(),
     en_user_id     : Joi.string().required(),
     currency       : Joi.string().required(),
     user_count     : Joi.number().required(),
     price_type     : Joi.number().valid(1,2).required(),
     domain         : Joi.string().optional(),
     workspace_id   : Joi.number().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    loginViaAccessTokenV1(req, res, req.logHandler, next);
  }
}


exports.razorpayPaymentWebhook = (req, res, next)=> {
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "razorpayPaymentWebhook"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });
  let schema = Joi.object().keys({
     amount              : Joi.number().required(),
     user_id             : Joi.number().required(),
     invoice_id          : Joi.string().required(),
     metaData            : Joi.string().required(),
     transaction_complete: Joi.number().required(),
     payment_method      : Joi.number().optional(),
     currency            : Joi.string().optional()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.getAccessToken = (req, res, next)=> {
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "getAccessToken"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  let schema = joiObject.keys({
    auth_token: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.getWhiteLabelDomain = (req, res, next)=> {
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "getWhiteLabelDomain"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  let schema = Joi.object().keys({
    access_token: Joi.string().required()
  });

  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.getPlanExpiry = (req, res, next)=> {
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "getPlanExpiry"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });

  let schema = Joi.object().keys({
    access_token: Joi.string().required()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.appleSignIn = (req, res, next)=> {
  req.logHandler = {
    uuid      : req.uuid,
    apiModule : "users",
    apiHandler: "appleSignin"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_HEADER: req.headers, REQUEST_QUERY: req.query });
  let schema =  joiObject.keys({
    email                : Joi.string().email({ minDomainAtoms: constants.MIN_DOTAT }).max(constants.EMAIL_MAX_SIZE).optional(),
    apple_id_token       : Joi.string().required(),
    apple_user_identifier: Joi.string().required(),
    name                 : Joi.string().optional()
  });
  let validFields = validateFields(req, res, schema);
  if (validFields) {
    next();
  }
}

exports.getUserChannelMessages = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "getUserChannelMessages"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_QUERY: req.query, REQUEST_HEADERS: req.headers });
  const bodySchema = joiObject.keys({
    workspace_id: Joi.string().required(),
    api_key     : Joi.string().required()
  }).unknown(true);
  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    next();
  }
};

exports.postMessage = function (req, res, next) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "postMessage"
  };
  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_QUERY: req.query, REQUEST_HEADERS: req.headers });
  const bodySchema = joiObject.keys({
    muid        : Joi.string().optional(),
    workspace_id: Joi.string().required(),
    email       : Joi.string().email().required(),
    message     : Joi.string().required(),
    actions     : Joi.array().items(Joi.object().keys({
    buttons     : Joi.array().items(Joi.object().keys({
        id    : Joi.number().optional(),
        label : Joi.string().required(),
        action: Joi.string().required(),
        style : Joi.string().required().valid([
          constants.buttonStyles.SUCCESS,
          constants.buttonStyles.DANGER,
          constants.buttonStyles.DEFAULT
        ]),
        action_type: Joi.string().required().valid([
          constants.buttonActionTypes.TEXT_FIELD,
          constants.buttonActionTypes.ACTION_PUBLISH,
          constants.buttonActionTypes.MESSAGE_PUBLISH
        ]),
        post_url      : Joi.string().required(),
        request_body  : Joi.string().required(),
        method        : Joi.string().required(),
        request_params: Joi.object(),
        output        : Joi.string().optional()
      })),
      confirmation_type : Joi.string().optional(),
      is_action_taken   : Joi.boolean().optional().valid([true, false]),
      title             : Joi.string().required(),
      default_text_field: Joi.object().keys({
        action        : Joi.string().required(),
        hint          : Joi.string().required(),
        id            : Joi.number().required().default(0),
        is_required   : Joi.boolean().required().valid([true, false]),
        minimum_length: Joi.number().required(),
        output        : Joi.string().required()
      }).unknown(true)
    }).unknown(true))
  })
  let validFields = validateFields(req, res, bodySchema);
  if (validFields) {
    next();
  }
}


exports.getUserAndSpaceDetails = getUserAndSpaceDetails;
exports.validateFields         = validateFields;
exports.joiObject              = joiObject;
