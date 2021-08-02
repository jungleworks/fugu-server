/**
 * Created by harsh on 12/3/14.
 */

var zlib                                              = require('zlib');

var logging                                           = require('./logging');
var constants                                         = require('./constants');



exports.parameterMissingResponse                      = parameterMissingResponse;
exports.actionCompleteResponse                        = actionCompleteResponse;
exports.loginSuccessfully                             = loginSuccessfully;
exports.authenticationErrorResponse                   = authenticationErrorResponse;
exports.authenticateEmailNotExists                    = authenticateEmailNotExists;
exports.wrongPassword                                 = wrongPassword;
exports.sendError                                     = sendError;
exports.authenticationError                           = authenticationError;
exports.noDataFoundError                              = noDataFoundError;
exports.getInvalidAccessError                         = getInvalidAccessError;
exports.invalidAccessError                            = invalidAccessError;
exports.somethingWentWrongError                       = somethingWentWrongError;
exports.sendGzippedResponse                           = sendGzippedResponse;
exports.getErrorResponse                              = getErrorResponse;
exports.getParameterMissingResponse                   = getParameterMissingResponse;
exports.getActionCompleteResponse                     = getActionCompleteResponse;
exports.getAuthenticationErrorResponse                = getAuthenticationErrorResponse;
exports.getNoDataFoundError                           = getNoDataFoundError;
exports.usernameAlreadyExists                         = usernameAlreadyExists;
exports.emailAlreadyRegistered                        = emailAlreadyRegistered;
exports.sendResponse                                  = sendResponse;
exports.invalidApiKey                                 = invalidApiKey;
exports.invalidUserApiKey                             = invalidUserApiKey;
exports.sendCustomResponse                            = sendCustomResponse;
exports.somethingWentWrongError                       = somethingWentWrongError;
exports.emailAlreadyRegisteredWithAnotherOffering     = emailAlreadyRegisteredWithAnotherOffering;
exports.idAlreadyRegistered                           = idAlreadyRegistered;

function parameterMissingResponse(res, err, data) {
  var response = {
    message: err || constants.responseMessages.PARAMETER_MISSING,
    status : constants.responseFlags.PARAMETER_MISSING,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function actionCompleteResponse(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.ACTION_COMPLETE,
    status : constants.responseFlags.ACTION_COMPLETE,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function loginSuccessfully(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.LOGIN_SUCCESSFULLY,
    status : constants.responseFlags.LOGIN_SUCCESSFULLY,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function authenticationErrorResponse(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_ACCESS_TOKEN,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function authenticateEmailNotExists(res) {
  var response = {
    message: constants.responseMessages.EMAIL_NOT_EXISTS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function wrongPassword(res) {
  var response = {
    message: constants.responseMessages.WRONG_PASSWORD,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function sendError(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.ERROR_IN_EXECUTION,
    status : constants.responseFlags.ERROR_IN_EXECUTION,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function authenticationError(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.SHOW_ERROR_MESSAGE,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function noDataFoundError(res, data) {
  var response = {
    message: constants.responseMessages.NO_DATA_FOUND,
    status : constants.responseFlags.USER_NOT_FOUND,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function somethingWentWrongError(res) {
  var response = {
    message: constants.responseMessages.SOMETHING_WENT_WRONG,
    status : constants.responseFlags.INTERNAL_SERVER_ERROR,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function sendGzippedResponse(response, res) {
  zlib.gzip(JSON.stringify(response), function (err, zippedData) {
    if (err) {
      return res.send(response);
    }
    res.set({'Content-Encoding': 'gzip'});
    return res.send(zippedData);
  });
}

function getErrorResponse(msg) {
  return {
    message: msg || constants.responseMessages.ERROR_IN_EXECUTION,
    status : constants.responseFlags.ERROR_IN_EXECUTION,
    data   : {}
  };
}

function getParameterMissingResponse(msg) {
  return {
    message: msg || constants.responseMessages.PARAMETER_MISSING,
    status : constants.responseFlags.PARAMETER_MISSING,
    data   : {}
  };
}

function getActionCompleteResponse(data, msg) {
  return {
    message: msg || constants.responseMessages.ACTION_COMPLETE,
    status : constants.responseFlags.ACTION_COMPLETE,
    data   : data || {}
  };
}

function getAuthenticationErrorResponse(data) {
  return {
    message: constants.responseMessages.INVALID_ACCESS_TOKEN,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
}

function getNoDataFoundError(data) {
  return {
    message: constants.responseMessages.NO_DATA_FOUND,
    status : constants.responseFlags.NO_DATA_FOUND,
    data   : data || {}
  };
}

function usernameAlreadyExists(res, data) {
  var response = {
    message: constants.responseMessages.USERNAME_ALREADY_EXISTS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function emailAlreadyRegistered(res) {
  var response = {
    message: constants.responseMessages.EMAIL_REGISTERED_ALREADY,
    status : constants.responseFlags.ALREADY_EXIST,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function idAlreadyRegistered(res) {
  var response = {
    message: constants.responseMessages.ID_ALREADY_EXIST,
    status : constants.responseFlags.ALREADY_EXIST,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function emailAlreadyRegisteredWithAnotherOffering(res) {
  var response = {
    message: constants.responseMessages.EMAIL_REGISTERED_ALREADY_WITH_ANOTHER_OFFERING,
    status : constants.responseFlags.ALREADY_EXIST_IN_ANOTHER_OFFERING,
    data   : {}
  };
  res.send(JSON.stringify(response));
}

function sendResponse(res, msg, status, data) {
  var response = {
    message: msg,
    status : status,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function invalidApiKey(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_AUTH_KEY,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function invalidUserApiKey(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_USER_API_KEY,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.send(JSON.stringify(response));
}

function sendCustomResponse(res, message, code, data, apiReference) {
  var response = {
    message: message,
    status : code,
    data   : data || {}
  };
  if (apiReference) {
    logging.log(apiReference, {EVENT: "FINAL RESPONSE", RESPONSE: response});
  }
  res.send(JSON.stringify(response));
}

function invalidAccessError(res, data, msg) {
  res.send(JSON.stringify(getInvalidAccessError(data, msg)));
}

function getInvalidAccessError(data, msg) {
  return {
    message: msg || constants.responseMessages.INVALID_ACCESS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  }
}