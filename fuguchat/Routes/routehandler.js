
const UniversalFunc          = require('../Utils/universalFunctions');
const RESP                   = require('../Config').responseMessages;
const { logger }             = require('../libs/pino_logger');
const constants              = require('../Utils/constants');
const UserController         = require('../Controller/userController');
const WorkspaceController    = require('../Controller/workspace');
const chatController         = require('../Controller/chatController');
const botController          = require('../Controller/botController');
const notificationController = require('../Controller/notification');
const {SUCCESS}              = require('../Config').responseMessages;
const conversationController = require('../Controller/conversationController');
const attendanceController   = require('../Controller/attendanceController')
const chatHandler            = require('../Routes/chathandler');
const paymentController      = require('../Controller/paymentController');
const redisUtility           = require('../Utils/redisUtility');
const hrmController          = require('../Controller/hrmController');
const appleController        = require('../Controller/appleController');

//--------------------------------------------------------------
//                     USER APIs
//--------------------------------------------------------------

exports.userLogout = function (req, res) {
  UserController.userLogout(req.logHandler, req.body, res);
};

exports.getUsers = function (req, res) {
  UserController.getUsers(req.logHandler, req.body, res);
};

exports.setPassword = function (req, res) {
  UserController.setPassword(req.logHandler, req.body, res);
};

exports.userLogin = function (req, res) {
  UserController.userLogin(req.logHandler, req.body, res);
};

exports.userLoginV1 = function (req, res) {
  UserController.userLoginV1(req.logHandler, req.body, res);
};

exports.loginViaAccessToken = function (req, res) {
  UserController.loginViaAccessToken(req.logHandler, req.body, res);
};

exports.loginViaAccessTokenV1 = function (req, res) {
  UserController.loginViaAccessTokenV1(req.logHandler, req.body, res);
};

exports.getBotConfiguration = async (req, res) => {
  conversationController.getBotConfiguration(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.updateDeviceToken = function (req, res) {
  UserController.updateDeviceToken(req.logHandler, req.body, res);
};

exports.updateDeviceTokenWeb = async function (req, res) {
  try {
    const data = await UserController.insertUserDeviceDetails(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.WEB_TOKEN_ADD, data, res);
  } catch (error) {
    logger.error(req.logHandler, 'Error occurred in updating device token', error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getUsers = function (req, res) {
  UserController.getUsers(req.logHandler, req.body, res);
};

exports.inviteUser = function (req, res) {
  UserController.inviteUser(req.logHandler, req.body).then(
    (data) => {
      if(data.statusCode == 402){
        return UniversalFunc.sendError(data, res);
      }
      UniversalFunc.sendSuccess(RESP.SUCCESS.INVITATION_SENT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in getPublicInviteDetails', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.resendInvitation = function (req, res) {
  UserController.resendInvitation(req.logHandler, req.body, res);
};

exports.revokeInvitation = function (req, res) {
  UserController.revokeInvitation(req.logHandler, req.body, res);
};

exports.verifyToken = function (req, res) {
  UserController.verifyToken(req.logHandler, req.query, res);
};

exports.verifyPasswordResetToken = function (req, res) {
  UserController.verifyPasswordResetToken(req.logHandler, req.query, res);
};

exports.verifySignUpToken = function (req, res) {
  UserController.verifySignUpToken(req.logHandler, req.body, res);
};

exports.otpLogin = function (req, res) {
  UserController.otpLogin(req.logHandler, req.query, res);
};

exports.editUserInfo = function (req, res) {
  req.body.files = req.files;
  UserController.editUserInfo(req.logHandler, req.body, res);
};

exports.getUserInfo = function (req, res) {
  UserController.getUserInfo(req.logHandler, req.body, res);
};

exports.resetPasswordRequest = function (req, res) {
  UserController.resetPasswordRequest(req.logHandler, req.body, res);
};

exports.getUserInvites = function (req, res) {
  UserController.getUserInvites(req.logHandler, req.body, res);
};

exports.resetPassword = function (req, res) {
  UserController.resetPassword(req.logHandler, req.body, res);
};

exports.changePassword = function (req, res) {
  UserController.changePassword(req.logHandler, req.body, res);
};

exports.changeContactNumberRequest = function (req, res) {
  UserController.changeContactNumberRequest(req.logHandler, req.body, res);
};

exports.changeContactNumber = function (req, res) {
  UserController.changeContactNumber(req.logHandler, req.body, res);
};

exports.sendFeedback = function (req, res) {
  UserController.sendFeedback(req.logHandler, req.body, res);
};

exports.submitGdprQuery = function (req, res) {
  UserController.submitGdprQuery(req.logHandler, req.body, res);
};

exports.manageUserRole = function (req, res) {
  UserController.manageUserRole(req.logHandler, req.body , res );
};

exports.deletePendingRequests = function (req, res) {
  UserController.deletePendingRequests(req.logHandler, req.body, res);
};

exports.verifyInfo = function (req, res) {
  UserController.verifyInfo(req.logHandler, req.body, res);
};

exports.getUserContacts = function (req, res) {
  UserController.getUserContacts(req.logHandler, req.body, res);
};

exports.userLoginV2 = function (req, res) {
  UserController.userLoginV2(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.whatsNewFeature = function (req, res) {
  UserController.whatsNewFeature(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.notifyUsers = function (req, res) {
  UserController.notifyUsers(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
    console.error("Error---->",error)
    UniversalFunc.sendError(error, res);
    }
  );
};

exports.getInfo = async (req, res) => {
  try {
    const data = await UserController.getInfo(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

exports.testPushNotification = async (req, res) => {
  try {
    const data = await UserController.testPushNotification(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

exports.editInfo = async (req, res) => {
  try {
    req.body.files = req.files;
    const data = await UserController.editInfo(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_EDIT_SUCCESSFULLY, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};
exports.editFuguUserInfo = async (req, res) => {
  try {
    const data = await UserController.editFuguUserInfo(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.NOTIFICATION_CHANGED, data, res);
  } catch (error) {
    logger.error(req.logHandler, { EVENT: 'EDIT USER DETAILS ERROR' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  }
};

exports.sendMessageEmail = async (req, res) => {
  try {
    const data = await UserController.sendMessageEmail(req.logHandler, req.body, res);
   UniversalFunc.sendSuccess(RESP.SUCCESS.SEND_EMAIL, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getUserChannelsInfo = async (req, res) => {
  try {
    const data = await UserController.getUserChannelsInfo(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getPushNotifications = async (req, res) => {
  try {
    const data = await UserController.getPushNotifications(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

//--------------------------------------------------------------
//                     work place apis
//--------------------------------------------------------------

exports.checkEmail = function (req, res) {
  WorkspaceController.checkEmail(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Check Email verification', error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.setWorkspacePasswordV1 = function (req, res) {
  WorkspaceController.setWorkspacePasswordV1(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.signup = function (req, res) {
  WorkspaceController.signup(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.BUSINESS_SIGNUP_SUCCESSFULL, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Workspace Signup', error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.signupV1 = function (req, res) {
  WorkspaceController.signupV1(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.BUSINESS_SIGNUP_SUCCESSFULL, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Workspace Signup', error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.signupV2 = function (req, res) {
  WorkspaceController.signupV2(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.googleSignup = function (req, res) {
  WorkspaceController.googleSignup(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};


exports.verifyAndRegisterGoogleUser = function (req, res) {
  WorkspaceController.verifyAndRegisterGoogleUser(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.registerPhoneNumber = function (req, res) {
  WorkspaceController.registerPhoneNumber(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};


exports.syncGoogleContacts = function (req, res) {
  WorkspaceController.syncGoogleContacts(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.verifyOtp = function (req, res) {
  WorkspaceController.verifyOtp(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.OTP_TOKEN_VERIFIED, data, res);
    },
    (error) => {
      logger.error(req.logHandler, { EVENT: 'WORKSPACE OTP VALIDATION ' }, { MESSAGE: error.message });
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.verifyOtpV1 = function (req, res) {
  WorkspaceController.verifyOtpV1(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.OTP_TOKEN_VERIFIED, data, res);
    },
    (error) => {
      logger.error(req.logHandler, { EVENT: 'WORKSPACE OTP VALIDATION ' }, { MESSAGE: error.message });
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};


exports.checkInvitedContacts = function (req, res) {
  WorkspaceController.checkInvitedContacts(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.getConfiguration = function (req, res) {
  WorkspaceController.getConfiguration(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred while getConfiguration', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getPublicInviteDetails = function (req, res) {
  WorkspaceController.getPublicInviteDetails(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, 'Data fetched successfully', data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in getPublicInviteDetails', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editConfiguration = function (req, res) {
  WorkspaceController.editConfiguration(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.UPDATED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred while editConfiguration', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getWorkspaceInfo = function (req, res) {
  WorkspaceController.getWorkspaceInfo(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  }, (error) => {
    logger.error(req.logHandler, { ERROR: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.getDomains = function (req, res) {
  const {logHandler} = req;
  WorkspaceController.getDomains(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(logHandler, { EVENT: 'GET DOMAINS INFO' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
};

exports.editWorkspaceInfo = function (req, res) {
  WorkspaceController.editWorkspaceInfo(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.BUSINESS_INFO_UPDATE_SUCCESSFUL, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
};


exports.getWorkspaceDetails = function (req, res) {
  WorkspaceController.getWorkspaceDetails(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.BUSINESS_INFO_UPDATE_SUCCESSFUL, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
};

exports.switchWorkspace = function (req, res) {
  const {logHandler} = req;
  WorkspaceController.switchWorkspace(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(logHandler, { EVENT: 'Cannot switch workspace' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
};


exports.createWorkspace = function (req, res) {
  const {logHandler} = req;
  WorkspaceController.createWorkspace(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.WORKSPACE_CREATED_SUCCESSFULLY, data, res);
  }, (error) => {
    console.error(">>>>>>>>>>>>",error)
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
};

exports.addPublicEmailDomain = function (req, res) {
  WorkspaceController.addPublicEmailDomain(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred while addAllowedWorkspace', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editPublicEmailDomain = function (req, res) {
  WorkspaceController.editPublicEmailDomain(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.UPDATED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred while editAllowedWorkspace', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getPublicEmailDomains = function (req, res) {
  WorkspaceController.getPublicEmailDomains(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred while getAllowedWorkspace', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getOpenAndInvited = function (req, res) {
  WorkspaceController.getOpenAndInvited(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error get open and invited workspace', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getPublicInfo = function (req, res) {
  WorkspaceController.getPublicInfo(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in getPublicInfo', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.publicInvite = function (req, res) {
  WorkspaceController.publicInvite(req.logHandler, req.body).then(
    (data) => {
      if(data.email){
       return UniversalFunc.sendSuccess(RESP.SUCCESS.INVITATION_SENT_SUCCESSFULLY, data, res);
      }
      UniversalFunc.sendSuccess(RESP.SUCCESS.INVITATION_SENT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in publicInvite', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getAllMembers = function (req, res) {
  WorkspaceController.getAllMembers(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.joinWorkspace = function (req, res) {
  WorkspaceController.joinWorkspace(req.logHandler, req.body, res);
};

exports.getInvitedUsers = function (req, res) {
  WorkspaceController.getInvitedUsers(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in getInvitedUsers', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.leave = function (req, res) {
  WorkspaceController.leave(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in leave', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.deactivateUser = function (req, res) {
  WorkspaceController.deactivateUser(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: "EDIT WORKSPACE INFO ERROR" }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

//--------------------------------------------------------------
//                     EMAIL APIs
//--------------------------------------------------------------

exports.logException = function (req, res) {
  UserController.logException(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: "LOG EXCEPTION" }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};
exports.heapDump = function (req, res) {
  logger.error(req.logHandler, ' request received for dump');
  const heapdump = require('heapdump');
  heapdump.writeSnapshot((err, filename) => {
    logger.error(req.logHandler, 'dump written to', filename);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, null, res);
  });
};



//--------------------------------------------------------------
//                     OPEN APIs
//------------------------------------------------------------

exports.createUser = function (req, res) {
  UserController.createUser(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.createGroup = function (req, res) {
  UserController.createGroup(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.addMemberInGroup = function (req, res) {
  UserController.addMemberInGroup(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.disableUser = function (req, res) {
  UserController.disableUser(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.publishMessageOnScrumBot = function (req, res) {
  botController.publishMessageOnScrumBot(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error(">>>>>>>>>>>>>>>>>>",error)
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.updateAuthUser = function (req, res) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'workspace',
    apiHandler: 'disableUser'
  };
  WorkspaceController.updateAuthUser(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

//--------------------------------------------------------------
//                     TOOKAN APIs
//------------------------------------------------------------

exports.onBoardUser = function (req, res) {
  UserController.onBoardUser(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    const responseObj = { statusCode: 200, message: SUCCESS.DEFAULT.customMessage, data: data || {} };
    return res.status(200).send(responseObj);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'TOOKAN ON BOARD  ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.editWorkspace = function (req, res) {
  UserController.editWorkspace(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    const responseObj = { statusCode: 200, message: SUCCESS.DEFAULT.customMessage, data: data || {} };
    return res.status(200).send(responseObj);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE TOOKAN INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.removeMemberFromGroup = function (req, res) {
  UserController.removeMemberFromGroup(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.getAllUserUnreadCount = function (req, res) {
  UserController.getAllUserUnreadCount(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};


exports.renameGroup = function (req, res) {
  UserController.renameGroup(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.getGroupInfo = function (req, res) {
  UserController.getGroupInfo(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.deleteGroup = function (req, res) {
  UserController.deleteGroup(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.createSelfChat = function (req, res) {
    req.logHandler = {
    uuid: req.uuid,
    apiModule: "apps",
      apiHandler: "createSelfChat"
  };
  botController.createSelfChat(req.logHandler, req.body).then((data) => {
    logger.trace(req.logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'EDIT WORKSPACE INFO ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

//--------------------------------------------------------------
//                     BILLING APIs
//--------------------------------------------------------------

exports.getPaymentDetails = function (req, res) {
  WorkspaceController.getPaymentDetails(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in leave', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getIntentToken = async (req, res) => {
  try {
    const data = await WorkspaceController.getIntentToken(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.addUserCards = function (req, res) {
  WorkspaceController.addUserCards(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, 'Error occurred in leave', error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.authorizePayment = function (req, res) {
    req.logHandler = {
    uuid: req.uuid,
    apiModule: "billing",
    apiHandler: "authorizePayment"
  };
  WorkspaceController.authorizePayment(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error(">>>>>>>>>>>>>", error)
      UniversalFunc.sendError(error, res);
    }
  );};

exports.buyPlan = function (req, res) {
  WorkspaceController.buyPlan(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error(">>>>>>>>>>>>>",error)
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.updatePlan = function (req, res) {
  req.logHandler = {
    uuid       : req.uuid,
    apiModule  : "billing",
    apiHandler : "updatePlan"
  };
  WorkspaceController.updatePlan(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error(">>>>>>>>>>>>",error);
      UniversalFunc.sendError(error, res);
    }
  );
};


//--------------------------------------------------------------
//                     CHAT APIs
//--------------------------------------------------------------



exports.pendingAndAcceptedUserSearch = (req, res) => {
  chatController.pendingAndAcceptedUserSearch(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.userSearch = async (req, res) => {
  try {
    const data = await chatController.userSearch(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};



/*
  Conversation methods
*/

exports.uploadFile = async (req, res) => {
  const data = req.body;
  [data.file] = req.files;
  data.file_name = req.body.file_name;
  try {
    const result = await conversationController.uploadFile(req.logHandler, data);
    return UniversalFunc.sendSuccess(RESP.SUCCESS.UPLOADED_SUCCESSFULLY, result, res);
  } catch (error) {
    logger.error(req.logHandler, 'Error occurred while uploadFile', error);
    return UniversalFunc.sendError(error, res);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const data = await conversationController.getMessages(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};

exports.map = async (req, res) => {
  try {
    const data = await conversationController.map(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getConversations = (req, res) => {
  conversationController.getConversations(req.logHandler, req.body).then(
    (data) => {
      // logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      console.error("--------->",error)
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getThreadMessages = (req, res) => {
  conversationController.getThreadMessages(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      console.error("ERROR--->", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getLatestThreadMessage = (req, res) => {
  conversationController.getLatestThreadMessage(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.conversationSendMessage = (req, res) => {
  if(req.headers['x-discourse-instance']){
    req.body.isDiscourseEvent = true;
    req.body.discourseURL = req.headers['x-discourse-instance'];
    req.body.discourseEvent = req.headers['x-discourse-event'];
    req.body.discourseEventType = req.headers['x-discourse-event-type'];
  }
  conversationController.conversationSendMessage(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_RECEIVED, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.searchMessages = async (req, res) => {
  conversationController.searchMessages(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error(error)
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.starMessage = async (req, res) => {
  try {
    await conversationController.starMessage(req.logHandler, req.body, res);
  } catch (error) {
    logger.error(req.logHandler, error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getStarredMessages = async (req, res) => {
  conversationController.getStarredMessages(req.logHandler, req.body, res);
};

exports.inviteToConference = async (req, res) => {
  conversationController.inviteToConference(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.verifyTurnCreds = async (req, res) => {
  conversationController.verifyTurnCreds(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.updateStatus = async (req, res) => {
  conversationController.updateStatus(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};
exports.updateConferenceCall = async (req, res) => {
  conversationController.updateConferenceCall(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

//--------------------------------------------------------------
//                     CHAT APIs
//--------------------------------------------------------------

exports.groupChatSearch = (req, res) => {
  chatController.groupChatSearch(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.createGroupChat = (req, res) => {
  req.body.channel_image = req.files && req.files.length ? req.files[0] : false;
  chatController.createGroupChat(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.GROUP_CREATED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.createO2OChat = async (req, res) => {
  try {
    const data = await chatController.createO2OChat(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_ADDED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.addChatMember = async (req, res) => {
  try {
    const data = await chatController.addChatMember(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.USER_ADDED, data, res);
  } catch (error) {
    console.error(">>>>>>>>>>",error)
    UniversalFunc.sendError(error, res);
  }
};

exports.removeChatMember = async (req, res) => {
  try {
    const data = await chatController.removeChatMember(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.USER_REMOVED, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.joinChat = async (req, res) => {
  try {
    const data = await chatController.joinChat(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_ADDED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.leaveChat = async (req, res) => {
  try {
    const data = await chatController.leaveChat(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.getChatGroupInfo = async (req, res) => {
  try {
    const data = await chatController.getGroupInfo(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.getChatGroups = async (req, res) => {
  try {
    const data = await chatController.getChatGroups(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.clearChatHistory = async (req, res) => {
  try {
    const data = await chatController.clearChatHistory(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.CHAT_DELETED, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const data = await chatController.deleteMessage(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_DELETED, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.changeFollowingStatus = async (req, res) => {
  try {
    const data = await chatController.changeFollowingStatus(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.changeGroupInfo = async (req, res) => {
  try {
    const data = await chatController.changeGroupInfo(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.editChatInfo = async (req, res) => {
  try {
    req.body.channel_image = req.files ? req.files[0] : null;
    const data = await chatController.editInfo(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_EDIT_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.getChannelInfo = async (req, res) => {
  try {
    const data = await chatController.getChannelInfo(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};
exports.editMessage = async (req, res) => {
  try {
    const data = await chatController.editMessage(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_UPDATED, data, res);
  } catch (error) {
  console.error(">>>>>>>>>>>>>",error)
    UniversalFunc.sendError(error, res);
  }
};

exports.deleteFromChannel = async (req, res) => {
  try {
    const data = await chatController.deleteFromChannel(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.USER_REMOVED, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};

exports.getGuestChannels = async (req, res) => {
  try {
    const data = await chatController.getGuestChannels(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};


exports.getMessageSeenBy = async (req, res) => {
  try {
    const data = await chatController.getMessageSeenBy(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR----------->",error);
    UniversalFunc.sendError(error, res);
  }
};

exports.requestMessage = async (req, res) => {
  try {
    const data = await chatController.requestMessage(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR----------->", error);
    UniversalFunc.sendError(error, res);
  }
};
//--------------------------------------------------------------
//                     GUEST APIs
//--------------------------------------------------------------

exports.updateGuest = async (req, res) => {
  try {
    const data = await chatController.updateGuest(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    UniversalFunc.sendError(error, res);
  }
};
//--------------------------------------------------------------
//                     SOCKET APIs
//--------------------------------------------------------------

exports.socketData = function (req, res) {
  chatHandler.handlePublish(req.body, (err, data) => {
    if(err) {
      UniversalFunc.sendError(err, res);
    } else {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    }
  });
};


//--------------------------------------------------------------
//                     BOT APIs
//--------------------------------------------------------------

exports.installApps = function (req, res) {
  botController.installApps(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      console.error("Error::",error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.installApps1 = function (req, res) {
  UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, {}, res);
};

exports.getApps = (req, res) => {
  botController.getApps(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.createWebhook = function (req, res) {
  botController.createWebhook(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.getWebhooks = function (req, res) {
  botController.getWebhooks(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.editWebhook = function (req, res) {
  botController.editWebhook(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

//--------------------------------------------------------------
//                    Notifications
//-------------------------------------------------------------


exports.markReadAll = async (req, res) => {
  try {
    const data = await notificationController.markReadAll(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, { EVENT: 'markReadAll' }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const data = await notificationController.getNotifications(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, { EVENT: 'getNotifications' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  }
};

exports.getUnreadNotifications = async (req, res) => {
  try {
    const data = await notificationController.getUnreadNotifications(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    logger.error(req.logHandler, { EVENT: 'getUnreadNotifications' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  }
};

exports.handleBot = function (req, res) {
  botController.handleBot(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.publishMessageOnFuguBot = function (req, res) {
  req.body.file = req.files ? req.files[0] : null;
  botController.publishMessageOnFuguBot(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.attendanceCron = function (req, res) {
  botController.attendanceCron(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.MESSAGE_SENT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.publishMessageOnAttendanceBot = function (req, res) {
  botController.publishMessageOnAttendanceBot(req.logHandler, req.body).then(
    (data) => {
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.publishMessageOnFuguBotChannelForAndroid = function (req, res) {
  botController.publishMessageOnFuguBotChannelForAndroid(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.publishSecretSanta = function (req, res) {
  botController.publishSecretSanta(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
  }

exports.publishMessageOnHrmBot = function (req, res) {
  hrmController.publishMessageOnHrmBot(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.publishMessageOnFuguBotChannel = function (req, res) {
  botController.publishMessageOnFuguBotChannel(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};

exports.fuguCronMessages = function (req, res) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: 'webhook',
    apiHandler: 'editWebhook'
  };

  logger.trace(req.logHandler, { REQUEST_BODY: req.body, REQUEST_QUERY: req.query, REQUEST_HEADERS: req.headers });
  botController.fuguCronMessages(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, error);
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
    }
  );
};


//--------------------------------------------------------------
//                     Attendance
//-------------------------------------------------------------

exports.getLeaveBalance = function (req, res) {
  attendanceController.getLeaveBalance(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'getLeaveBalance' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.getBusinessLeaves = function (req, res) {
  attendanceController.getBusinessLeaves(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'getBusinessLeaves' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.editBusinessLeave = function (req, res) {
  attendanceController.editBusinessLeave(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'editBusinessLeave' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.editUserLeaves = function (req, res) {
  attendanceController.editUserLeaves(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'editUserLeaves' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.editUserInfoInAttendance = function (req, res) {
  attendanceController.editUserInfoInAttendance(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'editUserInfoInAttendance' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.getMembers = function (req, res) {
  attendanceController.getMembers(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'getMembersAttendance' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.editBusinessInfoInAttendance = function (req, res) {
  attendanceController.editBusinessInfoInAttendance(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'editBusinessConfigurationInAttendance' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.getBusinessInfo = function (req, res) {
  attendanceController.getBusinessInfo(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error("--------->>",error)
    return UniversalFunc.sendError(error, res);
  });
};

exports.getBusinessReport = function (req, res) {
  attendanceController.getBusinessReport(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.REPORT_FETCHED_SUCCESS, data, res);
  }, (error) => {
    console.error("--------->>",error)
    return UniversalFunc.sendError(error, res);
  });
};

exports.deleteExpiredLeaves = function (req, res) {
  attendanceController.deleteExpiredLeaves(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.REPORT_FETCHED_SUCCESS, data, res);
  }, (error) => {
    return UniversalFunc.sendError(error, res);
  });
};

exports.updateMembersOnLeave= function (req, res) {
  attendanceController.updateMembersOnLeave(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.REPORT_FETCHED_SUCCESS, data, res);
  }, (error) => {
    return UniversalFunc.sendError(error, res);
  });
};

exports.editUserPunchStatus = function (req, res) {
  attendanceController.editUserPunchStatus(req.logHandler, req.body).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'getUnreadNotifications' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.getUsersTimesheet = function (req, res) {
  attendanceController.getUsersTimesheet(req.logHandler, req.query).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'getUnreadNotifications' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.verifyAttendanceCredentials = function (req, res) {
  const data = req.body;
  if (req.files != undefined) {
    data.file = req.files[0];
  }
  attendanceController.checkImageAndLocation(req.logHandler, data).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.FACE_MATCHED, data, res);
  }, (error) => {
    console.error("Error---->",error)
    return UniversalFunc.sendError(error, res);
  });
};

exports.uploadDefaultImage = function (req, res) {
  const data = req.body;
  data.file = req.files[0];
  attendanceController.uploadDefaultImage(req.logHandler, data).then((data) => {
    return UniversalFunc.sendSuccess(RESP.SUCCESS.FACE_MATCHED, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'verifyAttendanceCredentials' }, { MESSAGE: error });
    return UniversalFunc.sendError(error, res);
  });
};

exports.getToken = async (req, res) => {
  try {
    const data = await attendanceController.getToken(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};

exports.verifyAttendanceToken = async (req, res) => {
  try {
    const data = await attendanceController.verifyAttendanceToken(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};


exports.insertScrumDetails = function (req, res) {
  WorkspaceController.insertScrumDetails(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT : "EDIT WORKSPACE INFO ERROR" }, { MESSAGE : error });
    UniversalFunc.sendError(error, res);
  });
};



exports.editScrumDetails = function (req, res) {
  WorkspaceController.editScrumDetails(req.logHandler, req.body).then((data) => {
    data.customMessage = data.message;
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT : "EDIT WORKSPACE INFO ERROR" }, { MESSAGE : error });
    UniversalFunc.sendError(error, res);
  });
};


exports.getScrumDetails = function (req, res) {
  WorkspaceController.getScrumDetails(req.logHandler, req.body).then((data) => {
   if(data.statusCode == RESP.SUCCESS.NO_DATA_RECORD.statusCode){
     data.statusCode = 206;//do this because with 204 status front end cant listen to our response. hence he not get the response
   };
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT : "EDIT WORKSPACE INFO ERROR" }, { MESSAGE : error });
    UniversalFunc.sendError(error, res);
  });
};


exports.checkUserAvailability = function (req, res) {
      WorkspaceController.checkUserAvailability(req.logHandler, req.body).then(
    (data) => {
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.scrumCron = function (req, res) {
  WorkspaceController.scrumCron(req.logHandler, req.body).then(
(data) => {
  return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
},
(error) => {
  logger.error(req.logHandler, "Workspace Signup", error);
  error = (error.errorResponse) ? error.errorResponse : error;
  return UniversalFunc.sendError(error, res);
}
);
};



exports.insertElasticMessages = async (req, res) => {

  req.logHandler = {
    uuid: req.uuid,
    apiModule: "conversation",
    apiHandler: "insertElasticMessages"
  };

  conversationController.insertElasticMessages(req.logHandler, req.body).then(
    (data) => {
      //logger.trace(req.logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
console.error(error)
      UniversalFunc.sendError(error, res);
    }
  );
};

//--------------------------------------------------------------
//                     EXPORTS
//-------------------------------------------------------------




exports.exportData = async function (req, res) {
  try {
    const data = await conversationController.exportData(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
}

exports.requestExport = async function (req, res) {
  try {
    const data = await conversationController.requestExport(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};

exports.getExportData = async function (req, res) {
  try {
    const data = await conversationController.getExportData(req.logHandler, req.body, res);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  } catch (error) {
    console.error("ERROR--->", error);
    UniversalFunc.sendError(error, res);
  }
};


//--------------------------------------------------------------
//                     CRONS
//-------------------------------------------------------------


exports.endSnooze = function (req, res) {
  req.logHandler = {
    uuid: req.uuid,
    apiModule: "user",
    apiHandler: "endSnooze"
  };

  UserController.endSnooze(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    console.error(error);
    logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
};

exports.getUserChannelMessages = function (req, res) {
  hrmController.getUserChannelMessages(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'GET USER CHANNEL MESSAGE ERROR' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
}

exports.meetCount = async(req, res)=> {
    try{
      let result = await WorkspaceController.meetCount(req.logHandler, req.body);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);

    }catch(error){
      logger.error(req.logHandler, { EVENT: 'SIGN UP ERROR' }, { MESSAGE: error });
      UniversalFunc.sendError(error, res);
    }
}

exports.updateUserDetails = async function(req, res){
  try{
    let result = await UserController.updateUserDetails(req.logHandler, req.body);
    if(result){
      UniversalFunc.sendSuccess(RESP.SUCCESS.UPDATED_SUCCESSFULLY, result, res);
    }
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'Update user details' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.getLoginOtp = async function(req, res){
  try{
   let getOtp = await UserController.getLoginOtp(req.logHandler, req.body);
   if(getOtp.valid){
     if(req.body.contact_number){
      return UniversalFunc.sendSuccess(RESP.SUCCESS.OTP_SENT_SUCCESSFULLY, {}, res);
     }else{
      return UniversalFunc.sendSuccess(RESP.SUCCESS.VERIFICATION_LINK_SENT, {}, res);
     }
    }
     throw(getOtp);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'getLoginOtp' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}


exports.validateOtpOrToken = async function(req, res){
   try{
     let result = await UserController.validateOtpOrToken(req.logHandler,req.body);
     if(!result.valid){
       throw result;
     }
     if(result.valid && result.signup_type == constants.AUTH_OTP_VALIDATION_TYPE.LOGIN){
     return await UserController.loginResponse(req.logHandler, req.body, res);
     }
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
   }catch(error){
    logger.error(req.logHandler, { EVENT: 'validateLoginOtp' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
   }
}

exports.calculateInvitePrice = async(req, res)=> {
  try{
    let result = await paymentController.calculateInvitePrice(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'calculateInvitePrice' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.initiatePayment = async(req, res)=> {
   try{
     let result = await paymentController.initiatePayment(req.logHandler, req.body);
     UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
   }catch(error){
    logger.error(req.logHandler, { EVENT: 'calculateInvitePrice' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
   }
}

exports.razorpayPaymentWebhook = async(req, res)=> {
  try{
    let result = await paymentController.razorpayPaymentWebhook(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'razorpayPaymentWebhook' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.getAccessToken = async(req, res)=> {
  try{
    let result = await UserController.getAccessToken(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'getAccessToken' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.getPlanExpiry = async(req, res)=> {
  try{
    let result = await UserController.getPlanExpiry(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'getWhiteLabelDomain' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.getWhiteLabelDomain = async(req, res)=> {
  try{
    let result = await UserController.getWhiteLabelDomain(req.logHandler, req.body);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'getWhiteLabelDomain' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
};
exports.postMessage = function (req, res) {
  hrmController.postMessage(req.logHandler, req.body).then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
  }, (error) => {
    logger.error(req.logHandler, { EVENT: 'POST MESSAGE TO BOT CHANNEL' }, { MESSAGE: error });
    UniversalFunc.sendError(error, res);
  });
}

exports.getApiCountFromRedis = async(req, res)=>{
  try{
    req.logHandler = {
      apiModule: "redis",
      apiHandler: "getApiCountFromRedis"
    }
    let result = await redisUtility.getApiCountFromRedis(req.logHandler);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'getApiCountFromRedis' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.deleteApiCountFromRedis = async(req, res)=>{
  try{
    req.logHandler = {
      apiModule: "redis",
      apiHandler: "deleteApiCountFromRedis"
    }
    let result = await redisUtility.deleteApiCountFromRedis(req.logHandler);
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
  }catch(error){
    logger.error(req.logHandler, { EVENT: 'deleteApiCountFromRedis' }, { error: error });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  }
}

exports.appleSignIn = async (req, res) => {
   try{
     let result = await appleController.appleSignin(req.logHandler, req.body);
     if(!result.valid){
      throw result;
     }
     UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, result, res);
   }catch(error){
      logger.error(req.logHandler, { EVENT: 'razorpayPaymentWebhook' }, { error: error });
      error = (error.errorResponse) ? error.errorResponse : error;
      UniversalFunc.sendError(error, res);
   }
}
