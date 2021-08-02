
const _                = require('underscore');
const Promise          = require('bluebird');

const UniversalFunc    = require('../Utils/universalFunctions');
const workspaceService = require('../services/workspace');
const userService      = require('../services/user');
const commonFunctions  = require('../Utils/commonFunctions');
const constants        = require('../Utils/constants');
const { logger }       = require('../libs/pino_logger');
const RESP             = require('../Config').responseMessages;

exports.getUserDataFromAccessToken = getUserDataFromAccessToken;


function  getUserDataFromAccessToken (req, res, next) {
    let logHandler = {
        apiModule: 'middleware',
        apiHandler: 'getUserDataFromAccessToken'
    }
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