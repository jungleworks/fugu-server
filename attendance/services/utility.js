const Promise                 = require('bluebird');
const request                 = require('request');
const logger                  = require('../Routes/logging');

exports.sendHttpRequest             = sendHttpRequest;

function sendHttpRequest(logHandler, options) {
  return new Promise((resolve, reject) => {
    options.gzip =  true;
    logger.trace(logHandler, { HTTP_REQUEST : options });
    request(options, (error, response, body) => {
      if(error) {
        logger.error(
          logHandler, { EVENT : 'Error from external server' },
          { OPTIONS : options }, { ERROR : error }, { RESPONSE : response }, { BODY : body }
        );
        return reject(error);
      }
      if(response == undefined) {
        error = new Error('No response from external server');
        return reject(error);
      }

      logger.trace(
        logHandler, { EVENT : 'Response from external server', OPTIONS : options, ERROR : error },
        { RESPONSE : response }, { BODY : body }
      );

      resolve(body);
    });
  });
}
