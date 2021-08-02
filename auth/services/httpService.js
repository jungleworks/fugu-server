/**
 * Created by ashishprasher on 01/02/18.
 */

var Promise                                     = require('bluebird');
var request                                     = require('request');
var _                                           = require('underscore');

var logging                                     = require('./../routes/logging');
var constants                                   = require('./../routes/constants');


exports.sendHttpRequest                         = sendHttpRequest;

function sendHttpRequest(apiReference, options) {
  return new Promise((resolve, reject) => {
    options.gzip = true;
    logging.log(apiReference, {HTTP_REQUEST: options});
    request(options, (error, response, body) => {
      if (error) {
        logging.logError(apiReference, {
            EVENT : 'Error from external server', OPTIONS : options, ERROR: error,
            RESPONSE : response, BODY: body
          }
        );
        return reject(error);
      }
      if (response == undefined) {
        error = new Error('No response from external server');
        return reject(error);
      }
      if (response.statusCode < '200' || response.statusCode > '299') {
        error      = new Error('Couldn\'t request with external server ');
        error.code = response.statusCode;
        error.body = body;
        logging.logError(apiReference, {
            EVENT : 'Error from external server', OPTIONS : options, ERROR: error,
            RESPONSE : response, BODY : body
          }
        );
        return reject(error);
      }
      logging.log(apiReference, {
          EVENT : 'Response from external server', OPTIONS: options, ERROR: error,
          RESPONSE : response, BODY : body
        }
      );
      return resolve(body);
    });
  });
}