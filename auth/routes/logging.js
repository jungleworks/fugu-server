var utilityService                            = require('./../services/utilityService');


exports.logDatabaseQueryError                 = logDatabaseQueryError;
exports.consolelog                            = consolelog;
exports.log                                   = log;
exports.logError                              = logError;

var debugging_enabled = true;
var moment = require('moment');
var new_debugging_enabled = true;
if (utilityService.isEnvLive()) {
    debugging_enabled = false;
    new_debugging_enabled = false;
}

function logDatabaseQueryError(eventFired, error, result) {
  if (debugging_enabled) {
    console.error(error);
    process.stderr.write("Event: " + eventFired);
    process.stderr.write("\tError: " + JSON.stringify(error));
    process.stderr.write("\tResult: " + JSON.stringify(result));
  }
}

function consolelog(eventFired, error, result) {
  if (debugging_enabled) {
    console.log(eventFired, error, result)
  }
}

var fileSwitches = {
  auth               : true,
  billing            : true,
  offering           : true,
  continent          : true,
  country            : true,
  businessOwner      : true,
  marketing          : true,
  startup            : true,
  social             : true,
};

var modules = {
  auth         : {
    authenticateUser         : true,
    registerUser             : true,
    getUserDetail            : true,
    updateUserDetail         : true,
    jungleRegisterUser       : true,
    jungleLogin              : true,
    verifyPassword           : true,
  },
  billing      : {
    makeUserPayment        : true,
    addUserCard            : true,
    getUserCard            : true,
    setupIntent            : true,
  },
  offering     : {
    getOfferings             : true,
    createUserOffering       : true,
    getDefaultOfferings      : true,
  },
  continent    : {
    getContinents: true,
    addContinent : true
  },
  country      : {
    getCountries: true,
    addCountry  : true
  },
  marketing    : {
    addUser      : true,
    replicateUser: true
  },
  startup      : {
    loadEnv: true
  },
  social: {
    jungleRegisterUserUsingApple           : true,
    jungleLoginUsingApple                  : true,
  }
};

function log(apiReference, log) {
  if (new_debugging_enabled
    && apiReference
    && apiReference.module
    && apiReference.api
    && fileSwitches
    && fileSwitches[apiReference.module] == true
    && modules
    && modules[apiReference.module]
    && modules[apiReference.module][apiReference.api] == true) {

    try {
      log = JSON.stringify(log);
    }
    catch (exception) {
    }
    console.log("-->" + moment(new Date()).format('YYYY-MM-DD hh:mm:ss.SSS') + " :----: " +
      apiReference.module + " :=: " + apiReference.api + " :=: " + log);
  }
}

function logError(apiReference, log) {
  if (apiReference
    && apiReference.module
    && apiReference.api) {

    try {
      log = JSON.stringify(log);
    }
    catch (exception) {
    }
    console.error("-->" + apiReference.module + " :=: " + apiReference.api + " :=: " + log);
  }
}
