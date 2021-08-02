/**
 * Created by puneetKumar on 25/01/18.
 */

const request                         = require('request');
const needle                          = require('needle');
const Promise                         = require('bluebird');

const { logger }                          = require('../libs/pino_logger');
const constants                       = require('../Utils/constants');

exports.getZoneId                   = getZoneId;
exports.getDnsRecord                = getDnsRecord;
exports.checkDomainAvailability     = checkDomainAvailability;
exports.createDomain                = createDomain;
exports.deleteDomain                = deleteDomain;



function getZoneId(logHandler, opts) {
  logger.trace(logHandler, { EVENT : "get zone ID", OPTIONS : opts });
  return new Promise((resolve, reject) => {
    let options = {
		  headers : {
        'X-Auth-Email' : opts.email,
        'X-Auth-Key'   : opts.key
		  }
    };
    needle.get(
	  'https://api.cloudflare.com/client/v4/zones?name=' + opts.base_domain
	  + '&status=active&page=1&per_page=20&order=status&direction=desc&match=all',
	  options, (err, resp) => {
        logger.trace(logHandler, { EVENT : "Get zone ID response", ERROR : err, RESPONSE : resp && resp.body });
        if(err) {
          logger.error(logHandler, { EVENT : "Error in getZoneid", ERROR : err });
          return reject(err);
        }
        if(resp && resp.body && resp.body.success && resp.body.result.length) {
          return resolve(resp.body.result[0].id);
        }
        return reject('error');
      }
    );
  });
}

function getDnsRecord(logHandler, opts, callback) {
  return new Promise((resolve, reject) => {
    let options = {
	  headers : {
        'X-Auth-Email' : opts.email,
        'X-Auth-Key'   : opts.key
	  }
    };
    needle.get('https://api.cloudflare.com/client/v4/zones/' +
		opts.zone_id + '/dns_records?type=A&name=' + opts.domain_name +
		'&page=1&per_page=20&order=type&direction=desc&match=all', options, (err, resp) => {
	  if(err) {
        logger.error(logHandler, err);
        return reject(err);
	  }
	  if(resp.body.success) {
        if('result' in resp.body && resp.body.result.length) {
		  return resolve(resp.body.result[0].id);
        }
        logger.error(logHandler, resp.body);
        return reject("Something went Wrong Please try with some other Credentials to Signup");
	  }
	  return reject("Something went Wrong Please try Again");
  	});
  });
}

function checkDomainAvailability(logHandler, opts, callback) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
	  opts.zone_id = yield getZoneId(logHandler, opts);

	  yield getDnsRecord(logHandler, opts);
    })().then((data) => {
	  resolve(data);
    }, (error) => {
	  reject(error);
    });
  });
}

function createDomain(logHandler, opts) {
  logger.trace(logHandler, { EVENT : "creating domain", OPTIONS : opts });

  return new Promise((resolve, reject) => {
    let options = {
		  method  : 'POST',
		  url     : 'https://api.cloudflare.com/client/v4/zones/' + opts.zone_id + '/dns_records',
		  headers : {
        'cache-control' : 'no-cache',
        'content-type'  : 'application/json',
        'X-Auth-Email'  : opts.email,
        'X-Auth-Key'    : opts.key
		  },
		  body : {
        type    : "A",
        name    : opts.workspace,
        content : opts.ip,
        ttl     : 1
		  },
		  json : true
    };
    request(options, (error, response, body) => {
      logger.trace(logHandler, { EVENT : "Creating domain response", ERROR : error, RESPONSE : body });
      if(error) {
        logger.error(logHandler, { EVENT : "ERROR IN creating domain", ERROR : error });
        return reject("ERROR IN creating domain");
      }
      if(body && body.success) {
        return resolve(true);
      }
      return reject("Something went wrong Please try with other credentials");
    });
  });
}

function deleteDomain(logHandler, opts, callback) {
  getZoneId(logHandler, opts, (err, zone_id) => {
    if(err) {
	  logger.error(logHandler, err);
	  return callback(err);
    }
    opts.zone_id = zone_id;
    getDnsRecord(logHandler, opts, (err, data) => {
      if(err) {
	  return callback(err);
      }
      if(!data) {
        return callback(null);
      }
      let options = {
        headers : {
	  'X-Auth-Email' : email || config.get('cloudFlareDetails.EMAIL'),
	  'X-Auth-Key'   : key || config.get('cloudFlareDetails.KEY'),
	  'Content-Type' : 'application/json'
        }
      };
      needle.delete(
	  'https://api.cloudflare.com/client/v4/zones/' + zone_id + '/dns_records/' + record, null,
	  options, (err, resp) => {
          if(err) {
	  logger.error(logHandler, err);
	  return callback(err);
          }
          if(resp && resp.body.success == true) {
            return callback(null);
          }
          return callback('failure');
        }
      );
    });
  });
}
