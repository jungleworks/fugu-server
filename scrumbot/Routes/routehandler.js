/**
 * Created by gagandeep on 31/01/19.
 */


const cache = require('memory-cache');
const UniversalFunc = require('../Utils/universalFunctions');
const RESP = require('../Config/responseMessages');
const logger = require('../Routes/logging');
const constants = require('../Utils/constants');
const utils = require('../Controller/utils');
const cacheBuilder = require('../cachebuilder');
const scrumController = require('../Controller/scrumController')


exports.createNewScrum = function (req, res) {
  scrumController.createNewScrum(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.getScrumAnswers = function (req, res) {
  scrumController.getScrumAnswers(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.SIGN_UP_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.createBusiness = function (req, res) {
  scrumController.createBusiness(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, data);
      UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Error occurred in Creating Business", error);
      UniversalFunc.sendError(error, res);
    }
  );
};


exports.insertNewUser = function (req, res) {
  scrumController.insertNewUser(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.insertNewUser = function (req, res) {
  scrumController.insertNewUser(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.insertUserAnswers = function (req, res) {
  scrumController.insertUserAnswers(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.getScrumDetails = function (req, res) {
  scrumController.getScrumDetails(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.publishScrumAnswers = function (req, res) {
  scrumController.publishScrumAnswers(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

exports.editScrumDetails = function (req, res) {
  scrumController.editScrumDetails(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
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
  scrumController.scrumCron(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};



exports.checkUserAvailability = function (req, res) {
  scrumController.checkUserAvailability(req.logHandler, req.body).then(
    (data) => {
      logger.trace(req.logHandler, { RESPONSE: data });
      return UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(req.logHandler, "Workspace Signup", error);
      error = (error.errorResponse) ? error.errorResponse : error;
      return UniversalFunc.sendError(error, res);
    }
  );
};

