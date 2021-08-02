/**
 * Created by ashishprasher on 18/01/18.
 */

var Promise                                     = require('bluebird');
var _                                           = require('underscore');

var logging                                     = require('./../../../routes/logging');
var commonFun                                   = require('./../../../routes/commonFunction');
var responses                                   = require('./../../../routes/responses');
var newResponses                                = require('./../../../routes/newResponses');
var constants                                   = require('./../../../routes/constants');
var userService                                 = require('./../services/userService');
var offeringService                             = require('./../services/offeringService');


exports.createUserOffering                      = createUserOffering;

function createUserOffering(req, res) {
  var user_id = req.body.user_id;
  var offering = req.body.offering;

  offeringService.createUserOffering(req.apiReference, { user_id: user_id, offerings: [offering] }).then(result => {
    return responses.actionCompleteResponse(res, {});
  }).catch(error => {
    logging.logError(req.apiReference, { EVENT: "createUserOffering ERROR", ERROR: error });
    return responses.sendError(res, error);
  });
}
