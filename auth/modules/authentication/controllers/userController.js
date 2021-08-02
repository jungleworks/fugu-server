var md5                                     = require('MD5');
var Promise                                 = require('bluebird');
var _                                       = require('underscore');

var logging                                 = require('./../../../routes/logging');
var commonFun                               = require('./../../../routes/commonFunction');
var commonFunPromise                        = require('./../../../routes/commonFunctionPromise');
var responses                               = require('./../../../routes/responses');
var newResponses                            = require('./../../../routes/newResponses');
var constants                               = require('./../../../routes/constants');
var userService                             = require('./../services/userService');
var textUtility                             = require('./../../../utilities/textUtility');
const userDataController                    = require('./userDataController');
const utilityService                        = require('./../../../services/utilityService');

exports.authenticateUser                    = authenticateUser;
exports.authenticateAccessToken             = authenticateAccessToken;
exports.getUserDetail                       = getUserDetail;
exports.updateUserDetail                    = updateUserDetail;
exports.jungleRegisterUser                  = jungleRegisterUser;
exports.jungleLogin                         = jungleLogin;
exports.verifyPassword                      = verifyPassword;


var userFields                              = "first_name,last_name,company_name,access_token,user_id";



function authenticateUser(req, res) {
  req.endResponse="authenticateAccessToken";
  userDataController.jungleLogin(req, res);
}

function authenticateAccessToken(req, res) {
  req.endResponse="authenticateAccessToken";
  userDataController.jungleLogin(req, res);
}


function getUserDetail(req, res) {
  var field_arr;
  var field_names         = req.body.field_names;
  var user_id             = req.body.user_id;
  var email               = req.body.email;
  var email_array         = req.body.email_array;
  var access_token        = req.body.access_token;
  let dispatcher_user_id  = req.body.dispatcher_user_id;
  
  try {
    field_arr = field_names.split(',');
  } catch (e) {
    field_arr = [];
  }
  if (!field_arr.constructor === Array || !field_arr.length || (!user_id && !email && !access_token && !email_array && !dispatcher_user_id)) {
    logging.log(req.apiReference, {
      EVENT    : "User Field array is empty OR USER | Email Empty",
      field_arr: field_arr, EMAIL: email, USERID: user_id
    });
    return responses.parameterMissingResponse(res);
  }

  Promise.coroutine(function *() {
    try {
      var fields;
      var column_arr = [];

      for (var i = 0; i < field_arr.length; i++) {
        if (field_arr[i]) {
          column_arr.push('`' + field_arr[i].trim() + '`');
        }
      }
      column_arr.push("user_id");
      if (column_arr.length) {
        fields = column_arr.join(',');
      }

      var opts = {
        fields             : fields,
        user_id            : user_id,
        email              : email,
        email_array        : email_array,
        access_token       : access_token,
        dispatcher_user_id : dispatcher_user_id
      };

      var userInfo = yield userService.getUser(req.apiReference, opts);
      if (_.isEmpty(userInfo)) {
        return responses.noDataFoundError(res);
      }
      return responses.actionCompleteResponse(res, userInfo);
    } catch (e) {
      logging.logError(req.apiReference, {EVENT: "getUserDetail ERROR", ERROR: e});
      return newResponses.sendError(res, e);
    }
  })().catch(function (error) {
    logging.logError(req.apiReference, {EVENT: "getUserDetail ERROR", ERROR: error});
    return newResponses.sendError(res, error);
  });
}

async function updateUserDetail(req, res) {
  var update_fields;

  var user_id = req.body.user_id;
  var updates = req.body.updates;
  try {
    update_fields = JSON.parse(updates);
  } catch (e) {
    update_fields = updates;
  }

  update_fields.verification_token = textUtility.generateAccessToken(user_id, 'verification_token');
  userService.updateUser(req.apiReference, {user_id: user_id}, update_fields).then(result => {
    return responses.actionCompleteResponse(res);
  }).catch(error => {
    logging.logError(req.apiReference, {EVENT: "updateUserDetail ERROR", ERROR: error});
    return responses.sendError(res, error);
  });
}

function jungleRegisterUser(req, res) {
  let access_token             = textUtility.generateAccessToken(req.body.password);
  req.body.password            = md5(req.body.password);
  req.body.access_token        = access_token;
  userDataController.jungleRegisterUser(req,res);
}

function jungleLogin(req, res) {
  req.endResponse="jungleLogin";
  userDataController.jungleLogin(req,res);
}


function verifyPassword(req, res) {
  return responses.actionCompleteResponse(res);
}
