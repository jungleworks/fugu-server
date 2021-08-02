/**
 * Created by sumeet on 24/04/19.
 */

var Promise                                     = require('bluebird');
var request                                     = require('request');
var _                                           = require('underscore');

var logging                                     = require('./../../../routes/logging');
var constants                                   = require('./../../../routes/constants');
var httpService                                 = require('./../../../services/httpService');
const utilityService                            = require('./../../../services/utilityService');
const mailservice                               = require('./../../../services/mailingService');
const otpService                                = require('./../../otpAuthentication/services/otpService')


exports.sendSMSToBumbl                           = sendSMSToBumbl;


function sendSMSToBumbl(apiReference, opts) {
  return new Promise(async (resolve, reject) => {
    let body={
      sms:opts.message,
      user_id:constants.BUMBL.USER_ID,
      api_key:constants.BUMBL.API_KEY,
      offering: opts.offering || constants.BUMBL.OFFERING,
      phoneno:opts.phone
    };
    let options = {
      uri     : constants.BUMBL.SEND_SMS,
      method  : 'POST',
      body    : body,
      json    : true,
      timeout : 10000,
      rejectUnauthorized : false,
      headers : {
        'Content-Type' : 'application/json; charset=utf-8'
      }
    };
    if(opts.email.to!=undefined) {
      await mailservice.sendMail({to:opts.email.to},opts.email.subject,otpService.getOtpText(apiReference,opts.email.content),config.get('emailCredentials.senderEmail'));
    }
    if(utilityService.isEnvLiveOrBeta()) {
      response = await httpService.sendHttpRequest(apiReference, options);
    }
    else{
      response={
        status:constants.responseFlags.ACTION_COMPLETE,
        data  :{count:0}
      }
      if(opts.phone.length<=5)
        response.data.count=1;
    }
    resolve(response);
  });
}
