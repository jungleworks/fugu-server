

const cache                   = require('memory-cache');
const UniversalFunc           = require('../Utils/universalFunctions');
const RESP                    = require('../Config').responseMessages;
const logger                  = require('../Routes/logging');
const constants               = require('../Utils/constants');
const attendanceController    = require('../Controller/attendanceController')
const commonFunctions         = require('../Utils/commonFunctions');

//--------------------------------------------------------------
//                     EMAIL APIs
//--------------------------------------------------------------

exports.heapDump = function (req, res) {
  logger.error(req.logHandler, " request received for dump");
  const heapdump = require('heapdump');
  heapdump.writeSnapshot((err, filename) => {
    logger.error(req.logHandler, 'dump written to', filename);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, null, res);
  });
};

exports.logEdit = function (req, res) {
  let payload = req.body;
  let logPermission = cache.get(constants.cache.SERVER_LOGGING);
  if(logPermission[payload.module]) {
    logPermission[payload.module].loggingEnabled = true;
    if(commonFunctions.isDefined(logPermission[payload.module][payload.handler])) {
      logPermission[payload.module][payload.handler] = !logPermission[payload.module][payload.handler];
    } else {
      logger.error(req.logHandler, "handler not found");
    }
  } else {
    logger.error(req.logHandler, "module not found");
  }
  UniversalFunc.sendSuccess({}, null, res);
};

//--------------------------------------------------------------
//                     ATTENDANCE APIs
//--------------------------------------------------------------


exports.signup = function (req, res) {
  attendanceController.signup(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.SIGN_UP_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.clockOut = function (req, res) {
  attendanceController.clockOut(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.CLOCKED_OUT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.clockIn = function (req, res) {
  attendanceController.clockIn(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, "Clocked In Successfully", data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.CLOCKED_IN, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in getPublicInviteDetails", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.timesheet = function (req, res) {
  attendanceController.timesheet(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.CLOCKED_OUT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.teamPunchStatus = function (req, res) {
  attendanceController.teamPunchStatus(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.teamLeaveStatus = function (req, res) {
  attendanceController.teamLeaveStatus(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Team leave status", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.getMonthlyReport = function (req, res) {
  attendanceController.getMonthlyReport(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.editUserInfo = function (req, res) {
  attendanceController.editUserInfo(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_EDIT_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.getBusinessReport = function (req, res) {
  attendanceController.getBusinessReport(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE : data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Clock out", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.leave = function (req, res) {
  attendanceController.leave(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.changeManagerRequest = function (req, res) {
  attendanceController.changeManagerRequest(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.changeEmail = function (req, res) {
  attendanceController.changeEmail(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    });
};

exports.leaveBalance = function (req, res) {
  attendanceController.leaveBalance(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editBusinessLeave = function (req, res) {
  attendanceController.editBusinessLeave(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getBusinessLeaves = function (req, res) {
  attendanceController.getBusinessLeaves(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editUserLeaves = function (req, res) {
  attendanceController.editUserLeaves(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getMembers = function (req, res) {
  attendanceController.getMembers(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editBusinessInfo = function (req, res) {
  attendanceController.editBusinessInfo(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getBusinessInfo = function (req, res) {
  attendanceController.getBusinessInfo(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editUserPunchStatus = function (req, res) {
  attendanceController.editUserPunchStatus(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getUsersWorkTimesheet = function (req, res) {
  attendanceController.getUsersWorkTimesheet(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.autoClockOutUser = function (req, res) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "autoClockOutUser"
  };
  attendanceController.autoClockOutUser(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.autoClockOutUserV1 = function (req, res) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "attendance",
    apiHandler: "autoClockOutUserV1"
  };
  attendanceController.autoClockOutUserV1(req.logHandler, req.query).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in leave", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.uploadDefaultImage = function (req, res) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "autoClockOutUser"
  };
  attendanceController.uploadDefaultImage(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.IMAGE_UPLOADED, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in Default Image Uploading", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.createBusiness = function (req, res) {
  attendanceController.createBusiness(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.BUSINESS_ACTIVATION_SUCCESSFUL, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in Creating Business", error);
      UniversalFunc.sendError(error, res);
    }
  );
 };

exports.reminderCron = function (req, res) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "reminderCron"
  };
  attendanceController.reminderCron(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in cron", error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getMembersOnLeave = function (req, res) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "attendance",
    apiHandler : "getMembersOnLeave"
  };
  attendanceController.getMembersOnLeave(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in cron", error);
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.getAllMembers = function (req, res) {
    userController.getAllMembers(req.logHandler, req.body).then(
        (data) => {
            logger.trace(req.logHandler, data);
            UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
        },
        (error) => {
            logger.error(req.logHandler, "Error occurred in getAllMembers", error);
            UniversalFunc.sendError(error, res);
        }
    );
};
