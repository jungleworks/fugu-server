/**
 * Created by ashishprasher on 05/03/18.
 */

var apiReferenceModule                      = "startup";

var Promise                                 = require('bluebird');
var http                                    = require('http');
var fs                                      = require('fs');

var constants                               = require('./../routes/constants');
var logging                                 = require('./../routes/logging');
var offeringService                         = require('./../modules/authentication/services/offeringService');
var currencyService                         = require('./../modules/billing/services/currencyService');

exports.loadEnvVariables                    = loadEnvVariables;
exports.initialize                          = initialize;


function initialize() {
  httpServer = http.createServer(app).listen(app.get('port'), function () {
    loadEnvVariables().then(result => {
      console.log('httpServer Server Running on Port : ' + app.get('port'));
    }).catch(error =>{
      console.error(error, error);
    });
  });
}


function loadEnvVariables() {
  var apiReference = {
    module : apiReferenceModule,
    api : "loadEnv"
  };
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      yield offeringService.initializeOfferings(apiReference,{});
      yield currencyService.initializeCurrencies(apiReference, {});
      logging.log(apiReference, {startupVariables});
    })().then((data) => {
      logging.log(apiReference, {EVENT: "loadEnvVariables Success", DATA: data});
      resolve(data);
    }, (error) => {
      logging.logError(apiReference, {EVENT: "loadEnvVariables Error", ERROR: error});
      reject(error);
    });
  });
}

//to log error
if(!('toJSON' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'toJSON', {
    value : function () {
      var error = "{}";
      if(this.stack) {
        var errStack = this.stack.split('\n');
        error = errStack[0] + errStack[1];
      } else if(this.message) {
        error = this.message;
      }
      return error;
    },
    configurable : true,
    writable     : true
  });
}

process.on('message', function (message) {
  console.log("Received signal : " + message);
  if (message === 'shutdown') {
    httpServer.close();
    setTimeout(function () {
      process.exit(0);
    }, 15000);
  }
});
