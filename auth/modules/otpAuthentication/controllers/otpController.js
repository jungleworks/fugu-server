const _                                     = require('underscore');
const moment                                = require('moment');

const constants                             = require('./../../../routes/constants');
const responses                             = require('./../../../routes/newResponses');
const logging                               = require('./../../../routes/logging');
const otpService                            = require('./../services/otpService');
const httpService                           = require('./../../../services/httpService');
const bumblService                          = require('./../../products/services/bumblService');

exports.sendOtp     =   sendOtp;
exports.verifyOtp   =   verifyOtp;

async function sendOtp(req,res){
    try {
        let phone=req.body.phone;
        let message_text = req.body.message_text;
        let otp_count=0;
        let otpResult=await otpService.getOtp(req.apiReference,{phone:phone,is_verified:0});
        if(!_.isEmpty(otpResult)){
            if(otpResult[0].attempt>=constants.OTP_PROPERTIES.MAX_ATTEMPT || otpResult[0].otp_count>=constants.OTP_PROPERTIES.MAX_OTP_COUNT) {
                let alertValue={
                    phone:phone,
                    otp_count:otpResult[0].otp_count,
                    otp_attempt:otpResult[0].attempt
                };
                return responses.sendCustomResponse(res, constants.responseMessages.PHONE_NUMBER_BLOCKED, constants.responseFlags.USER_BLOCKED);
            }
            otp_count=otpResult[0].otp_count;
        }
        let randomOTP=otpService.generateRandomNumber();
        let opts={
            message:`Your ${startupVariables.offeringIdToOfferingName[req.body.offering]} verification code is ${randomOTP}`,
            phone:req.body.phone,
            email:{
                to      : req.body.email,
                content : otpService.getOtpText(req.apiReference,randomOTP),
                subject : "OTP VERIFICATION"
            },
            offering: req.body.offering
        };
        if(req.body.offering == constants.offerings.YELO && req.body.app_type == "ANDROID"){
            opts.message = `<#> Your 6 digit verification code for Yelo is ${randomOTP} tUT78H3FFZM`
        }
        if(message_text){
            opts.message = message_text +  randomOTP;
        }
        let response=await bumblService.sendSMSToBumbl(req.apiReference,opts);
        if(response.status==constants.responseFlags.ACTION_COMPLETE && response.data.count==0){
            let otpBody={
                otp         : randomOTP,
                phone       : phone,
                otp_count   : otp_count+1,
                email       : req.body.email,
                is_verified : 0
            };
            let otpResponse=await otpService.getOtp(req.apiReference,{phone:phone});
            if(_.isEmpty(otpResponse))
                await otpService.insertOtpStatus(req.apiReference,otpBody);
            else
                await otpService.updateOtpStatus(req.apiReference,otpBody);
            return responses.actionCompleteResponse(res)
        }
        else {
            return responses.sendCustomResponse(res,constants.responseMessages.INVALID_PHONE_NUMBER,constants.responseFlags.INVALID_PHONE_NUMBER);
        }
    }
    catch (error) {
        logging.logError(req.apiReference, {EVENT: "sendOtp", error: error, response: res});
        return responses.sendError(res, error);
    }
}


async function verifyOtp(req,res) {
    try {
        let otpResult=await otpService.getOtp(req.apiReference,{phone:req.body.phone,is_verified:0});
        if(_.isEmpty(otpResult))
            return responses.invalidAccessError(res,constants.responseMessages.INVALID_OTP);
        let time=moment(new Date()).diff(moment(otpResult[0].update_datetime),'minutes');
        if(otpResult[0].otp==req.body.otp && time<constants.OTP_PROPERTIES.OTP_TIME_LIMIT){
            let newresult;
            let userDetail=await otpService.getUserDetail(req.apiReference,req.body);
            if(_.isEmpty(userDetail)) {
                let result = await otpService.processRegister(req.apiReference, req.body);
                newresult  = JSON.parse(result);
                newresult.otp_validation_type=constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP;
            }
            else {
                newresult = {
                    message : constants.responseMessages.ACTION_COMPLETE,
                    status  : constants.responseFlags.ACTION_COMPLETE,
                    data    : userDetail,
                    otp_validation_type : constants.AUTH_OTP_VALIDATION_TYPE.LOGIN};
            }
            req.body.attempt=0;
            req.body.otp_count=0;
            req.body.is_verified=1;
            await otpService.updateOtpAttempt(req.apiReference,req.body);
            return res.send(newresult);
        }
        else{
            await otpService.updateOtpAttempt(req.apiReference,{phone:req.body.phone});
            return responses.invalidAccessError(res, {}, constants.responseMessages.INVALID_OTP);
        }
    }
    catch (e) {
        logging.logError(req.apiReference, {EVENT: "verifyUser", error: e, response: res});
        responses.sendError(res, e);
    }
}