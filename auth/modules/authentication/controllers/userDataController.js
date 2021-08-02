const md5                                     = require('MD5');
const Promise                                 = require('bluebird');
const _                                       = require('underscore');

const logging                                 = require('./../../../routes/logging');
const commonFun                               = require('./../../../routes/commonFunction');
const commonFunPromise                        = require('./../../../routes/commonFunctionPromise');
const newResponses                            = require('./../../../routes/newResponses');
const constants                               = require('./../../../routes/constants');
const userService                             = require('./../services/userService');
const offeringService                         = require('./../services/offeringService');

let userFields                                = "first_name,last_name,company_name,access_token,user_id";

exports.jungleRegisterUser                    = jungleRegisterUser;
exports.jungleLogin                           = jungleLogin;

function jungleRegisterUser(req, res) {
  let verification_token = md5(req.body.email + new Date().getTime());
  if (!("verification_status" in req.body)) {
    req.body.verification_status = 1
  }
  req.body.setup_wizard_step = 1;
  req.body.layout_type = 1;
  req.body.dashboard_version = 1;
  req.body.verification_token = verification_token;
  req.body.internal_user = userService.isInternalUser(req.body.email) ? 1 : 0;
  req.body.registration_type = req.body.offering;
  req.body.custom_fields = req.body.custom_fields ? JSON.stringify(req.body.custom_fields) : null;
  req.body.fb_token = req.body.fb_token ? req.body.fb_token : 0;
  req.body.google_token = req.body.google_token ? req.body.google_token : 0;
  req.body.password = req.body.password ? req.body.password : null;
  req.body.access_token = req.body.access_token ? req.body.access_token : 0;
  req.body.fb_id = req.body.fb_id ? req.body.fb_id : 0;
  req.body.apple_user_identifier = req.body.apple_user_identifier ? req.body.apple_user_identifier : 0;
  req.body.google_id = req.body.google_id ? req.body.google_id : 0;
  req.body.is_dispatcher       = req.body.is_dispatcher?req.body.is_dispatcher:0;
  req.body.business_usecase    = req.body.business_usecase? req.body.business_usecase : null;
  Promise.coroutine(function *() {
    let all_offering_arr;
    let email_exist;
    try {
      //send message on Fugu
      email_exist = yield commonFunPromise.getUserWithEmail(req.body.email, req.apiReference);
      if (email_exist.length && email_exist[0].all_offering) {
        all_offering_arr = email_exist[0].all_offering.split(',');
      }
      if (email_exist.length && !email_exist[0].all_offering) {
        req.body.duplicate_type = "signup";
        offeringService.createUserOffering(req.apiReference, {
          user_id: email_exist[0].user_id,
          offerings: [req.body.offering]
        });
        return newResponses.emailAlreadyRegistered(res);
      }
      if (email_exist.length && all_offering_arr.indexOf(req.body.offering) > -1) {
        return newResponses.emailAlreadyRegistered(res);
      }

      if (req.body.key == constants.SOCIALWEBSITE.FACEBOOK) {
        let fb_id = req.body.fb_id;
        let id = yield userService.getUser(req.apiReference, {fb_id});

        if (!_.isEmpty(id) && req.body.fb_id && id[0].fb_id == req.body.fb_id) {
          return newResponses.idAlreadyRegistered(res);
        }
      }
      if (email_exist.length && all_offering_arr.indexOf(req.body.offering) == -1) {
        req.body.duplicate_type = "signup";
        return newResponses.emailAlreadyRegisteredWithAnotherOffering(res);
      }
      let user_id = yield userService.createUser(req.apiReference, req.body);
      yield offeringService.createUserOffering(req.apiReference, {user_id: user_id, offerings: [req.body.offering]});
      let response = {
        user_id: user_id,
        access_token: req.body.access_token
      };
      req.body.user_id = user_id;
      yield userService.insertUserDetails(req.apiReference, req.body);

      if (req.body.lead_allocation == 0) {
        response.leadResponse = "lead_allocation key failed.";
        return newResponses.actionCompleteResponse(res, response);
      }

      if(req.body.key==constants.SOCIALWEBSITE.APPLE){
        let userInfo = yield userService.getUser(req.apiReference, {email:req.body.email});
        userInfo[0].authentication_type=constants.SOCIAL_STATUS.REGISTER;
        return newResponses.actionCompleteResponse(res, userInfo);
      }
      return newResponses.actionCompleteResponse(res, response);

    } catch (e) {
      logging.logError(req.apiReference, {EVENT: "jungleRegisterUser CATCH BLOCK ERROR", ERROR: e});
      return newResponses.sendError(res, e);
    }
  })().catch(function (error) {
    logging.logError(req.apiReference, {EVENT: "jungleRegisterUser ERROR", ERROR: error});
    return newResponses.sendError(res, error);
  });
}

function jungleLogin(req, res) {
  let opts = {};
  let fields = userFields + ",is_merchant, is_dispatcher, phone, password";
  Promise.coroutine(function* () {
    try {
      switch (req.body.key) {
        case constants.SOCIALWEBSITE.FACEBOOK:
          opts = {
            fb_id: req.body.fb_id
          };
          break;
        case constants.SOCIALWEBSITE.GOOGLE:
          opts = {
            google_id: req.body.google_id
          };
          break;
        default:
          if(req.body.email) {
            opts = {
              email: req.body.email
            };
          }
          if(req.body.access_token && req.body.key!=constants.SOCIALWEBSITE.APPLE) {
            opts = {
              access_token: req.body.access_token
            }
          }
      }
      if(req.endResponse == "jungleLogin") {
        opts.fields = fields;
      }
      let userInfo = yield userService.getUser(req.apiReference, opts);
      if(_.isEmpty(userInfo) && !opts.hasOwnProperty('email') && !opts.hasOwnProperty('access_token')) {
        if(req.body.email){
          userInfo = yield userService.getUser(req.apiReference, {email: req.body.email, fields: fields,is_dispatcher:0,is_merchant:0});
        }
        if(!_.isEmpty(userInfo)) {
          let setObj = {};
          (opts.fb_id) ? setObj.fb_id = opts.fb_id : 0;
          (opts.google_id) ? setObj.google_id =  opts.google_id: 0;
          if (!_.isEmpty(setObj) && req.body.email) {
            yield userService.updateUser(req.apiReference, { email: req.body.email }, setObj);
          }
        }
      }
      if (_.isEmpty(userInfo)) {
        logging.log(req.apiReference, {EVENT: "USER NOT FOUND"});
        return newResponses.authenticateEmailNotExists(res);
      }
      if (req.body.user_id && req.body.user_id != userInfo[0].user_id) {
        logging.log(req.apiReference, {EVENT: "USER_ID NOT MATCHED"});
        return newResponses.authenticationErrorResponse(res);
      }
      if (req.body.password && md5(req.body.password) != userInfo[0].password) {
        logging.log(req.apiReference, {EVENT: "WRONG PASSWORD"});
        return newResponses.wrongPassword(res);
      }
      userInfo = userInfo[0];
      userService.updateUser(req.apiReference, {user_id: userInfo.user_id}, {last_login_datetime: ""});
      let offeringExists = yield offeringService.getUserOfferings(req.apiReference, {
        user_id: userInfo.user_id,
        offering: req.body.offering
      });
      if (_.isEmpty(offeringExists)) {
        if (!userInfo.is_merchant && !userInfo.is_dispatcher) {
          if (req.body.hasOwnProperty('email') || req.body.hasOwnProperty('fb_id') || req.body.hasOwnProperty('google_id')) {
            req.body.duplicate_type = "login";
          }
          else if (req.body.access_token) {
            req.body.duplicate_type = "access_token";
          }

          req.body.email          = userInfo.email;
          req.body.first_name     = userInfo.first_name;
          req.body.last_name      = userInfo.last_name;
          req.body.phone          = userInfo.phone;
        }
      }
      offeringService.createUserOffering(req.apiReference, {user_id: userInfo.user_id, offerings: [req.body.offering]});
      if(req.body.password )
        delete userInfo.password;
      if(req.endResponse=="jungleLogin") {
        var response = {
          user_info: userInfo,
          offerings: offeringExists
        };
        return newResponses.actionCompleteResponse(res, response);
      }
      if(req.body.key==constants.SOCIALWEBSITE.APPLE){
        let userInfo = yield userService.getUser(req.apiReference, {email:req.body.email});
        userInfo[0].authentication_type=constants.SOCIAL_STATUS.LOGIN;
        return newResponses.actionCompleteResponse(res, userInfo);
      }
      return newResponses.actionCompleteResponse(res, [userInfo]);
    }
    catch(error){
      logging.logError(req.apiReference, {EVENT: "jungleLogin ERROR CATCH BLOCK", ERROR: error});
      return newResponses.sendError(res, error);
    }
  })().catch(function (error) {
    logging.logError(req.apiReference, {EVENT: "jungleLogin ERROR", ERROR: error});
    return newResponses.sendError(res, error, error);
  });
}