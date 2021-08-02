/**
 * Created by ashishprasher on 18/01/18.
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
exports.domainAlreadyExists                           = domainAlreadyExists;
exports.invalidVerificationToken                      = invalidVerificationToken;
exports.domainAlreadyRegistered                       = domainAlreadyRegistered;
exports.offeringNotBought                             = offeringNotBought;
exports.passwordUpdatedSuccessFully                   = passwordUpdatedSuccessFully;
exports.incorrectOldPassword                          = incorrectOldPassword;
exports.sameNewPassword                               = sameNewPassword;
exports.nameAlreadyExists                             = nameAlreadyExists;
exports.dataNotFound                                  = dataNotFound;
exports.emailAlreadyRegisteredWithAnotherOffering     = emailAlreadyRegisteredWithAnotherOffering;
exports.idAlreadyRegistered                           = idAlreadyRegistered;
exports.invalidUserId                                 = invalidUserId;



function parameterMissingResponse(res, err, data) {
  var response = {
    message: err || constants.responseMessages.PARAMETER_MISSING,
    status : constants.responseFlags.PARAMETER_MISSING,
    data   : data || {}
  };
  res.status(constants.responseFlags.BAD_REQUEST).send(JSON.stringify(response));
}

function actionCompleteResponse(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.ACTION_COMPLETE,
    status : constants.responseFlags.ACTION_COMPLETE,
    data   : data || {}
  };
  res.status(constants.responseFlags.ACTION_COMPLETE).send(JSON.stringify(response));
}

function loginSuccessfully(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.LOGIN_SUCCESSFULLY,
    status : constants.responseFlags.LOGIN_SUCCESSFULLY,
    data   : data || {}
  };
  res.status(constants.responseFlags.LOGIN_SUCCESSFULLY).send(JSON.stringify(response));
}

function authenticationErrorResponse(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_ACCESS_TOKEN,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function authenticateEmailNotExists(res) {
  var response = {
    message: constants.responseMessages.EMAIL_NOT_EXISTS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function wrongPassword(res) {
  var response = {
    message: constants.responseMessages.WRONG_PASSWORD,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function sendError(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.ERROR_IN_EXECUTION,
    status : constants.responseFlags.ERROR_IN_EXECUTION,
    data   : data || {}
  };
  res.status(constants.responseFlags.INTERNAL_SERVER_ERROR).send(JSON.stringify(response));
}

function authenticationError(res, data, msg) {
  var response = {
    message: msg || constants.responseMessages.SHOW_ERROR_MESSAGE,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function noDataFoundError(res, data) {
  var response = {
    message: constants.responseMessages.NO_DATA_FOUND,
    status : constants.responseFlags.USER_NOT_FOUND,
    data   : data || {}
  };
  res.status(constants.responseFlags.USER_NOT_FOUND).send(JSON.stringify(response));
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
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function emailAlreadyRegistered(res) {
  var response = {
    message: constants.responseMessages.EMAIL_REGISTERED_ALREADY,
    status : constants.responseFlags.ALREADY_EXIST,
    data   : {}
  };
  res.status(constants.responseFlags.ALREADY_EXIST).send(JSON.stringify(response));
}

function sendResponse(res, msg, status, data) {
  var response = {
    message: msg,
    status : status,
    data   : data || {}
  };
  res.status(status).send(JSON.stringify(response));
}

function invalidApiKey(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_AUTH_KEY,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function invalidUserApiKey(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_USER_ID,
    status : constants.responseFlags.INVALID_ACCESS_TOKEN,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}
function invalidUserId(data) {
  return {
    message: constants.responseMessages.INVALID_USER_ID,
    status : constants.responseFlags.INVALID_USER_ID,
    data   : data || {}
  };
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
  res.status(code || 200).send(JSON.stringify(response));
}

function invalidAccessError(res, data, msg) {
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(getInvalidAccessError(data, msg)));
}

function getInvalidAccessError(data, msg) {
  return {
    message: msg || constants.responseMessages.INVALID_ACCESS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
}

function somethingWentWrongError(res) {
  var response = {
    message: constants.responseMessages.SOMETHING_WENT_WRONG,
    status : constants.responseFlags.INTERNAL_SERVER_ERROR,
    data   : {}
  };
  res.status(response.status).send(JSON.stringify(response));

}

function domainAlreadyExists(res, data) {
  var response = {
    message: constants.responseMessages.DOMAIN_ALREADY_EXISTS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function invalidVerificationToken(res, data) {
  var response = {
    message: constants.responseMessages.INVALID_VERIFICATION_TOKEN,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function domainAlreadyRegistered(res, data, domain) {
  var response = {
    message: constants.responseMessages.DOMAIN_ALREADY_REGISTERED + domain,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function offeringNotBought(res, data) {
  var response = {
    message: constants.responseMessages.OFFERING_NOT_BOUGHT,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : data || {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function passwordUpdatedSuccessFully(res, data) {
  var response = {
    message: constants.responseMessages.PASSWORD_UPDATED,
    status : constants.responseFlags.ACTION_COMPLETE,
    data   : data || {}
  };
  res.status(constants.responseFlags.ACTION_COMPLETE).send(JSON.stringify(response));
}

function incorrectOldPassword(res) {
  var response = {
    message: constants.responseMessages.INCORRECT_OLD_PASSWORD,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function sameNewPassword(res) {
  var response = {
    message: constants.responseMessages.SAME_NEW_PASSWORD,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function nameAlreadyExists(res) {
  var response = {
    message: constants.responseMessages.NAME_ALREADY_EXISTS,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function dataNotFound(res) {
  var response = {
    message: constants.responseMessages.NO_DATA_FOUND,
    status : constants.responseFlags.SHOW_ERROR_MESSAGE,
    data   : {}
  };
  res.status(constants.responseFlags.CLIENT_ERROR).send(JSON.stringify(response));
}

function idAlreadyRegistered(res) {
  var response = {
    message: constants.responseMessages.ID_ALREADY_EXIST,
    status : constants.responseFlags.ALREADY_EXIST,
    data   : {}
  };
  res.status(constants.responseFlags.ALREADY_EXISTS).send(JSON.stringify(response));
}

function emailAlreadyRegisteredWithAnotherOffering(res) {
  var response = {
    message: constants.responseMessages.EMAIL_REGISTERED_ALREADY_WITH_ANOTHER_OFFERING,
    status : constants.responseFlags.ALREADY_EXIST_IN_ANOTHER_OFFERING,
    data   : {}
  };
  res.status(constants.responseFlags.ALREADY_EXISTS).send(JSON.stringify(response));
}