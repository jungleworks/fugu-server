const { URL }                               = require('url');
const jwt                                   = require('jsonwebtoken');
const fs                                    = require('fs');

const userDataController                    = require('./../../authentication/controllers/userDataController');
const constants                             = require('./../../../routes/constants');
const appleService                          = require('./../services/appleService');
const newResponses                          = require('./../../../routes/newResponses');
const logging                               = require('./../../../routes/logging');
const textUtility                           = require('./../../../utilities/textUtility');
const userService                           = require('./../../authentication/services/userService')

exports.jungleAppleConnect                      = jungleAppleConnect;

const ENDPOINT_URL          = 'https://appleid.apple.com';
const TOKEN_ISSUER          = 'https://appleid.apple.com';

async function jungleAppleConnect(req,res) {
  try {
    let bundle_id = config.get('apple.bundle_id')
    const unverifiedPayload = jwt.decode(req.body.apple_id_token, { complete: true });
    const kid = unverifiedPayload.header.kid;
    const applePublicKey = await appleService.getApplePublicKey(req.apiReference,kid);
    let jwtClaims=jwt.verify(req.body.apple_id_token, applePublicKey, {algorithms: 'RS256'});
    if(jwtClaims.iss !== TOKEN_ISSUER)
      return newResponses.sendError(res, {}, 'id token not issued by correct OpenID provider - expected: ' + TOKEN_ISSUER + ' | from: ' + jwtClaims.iss);
    if(bundle_id !== undefined && !bundle_id.includes(jwtClaims.aud))
      return newResponses.sendError(res, {}, 'aud parameter does not include this client - is: ' + jwtClaims.aud + '| expected: ' + bundle_id);
    if(jwtClaims.exp < (Date.now() / 1000))
      return newResponses.sendError(res, {}, 'id token has expired');
    
    req.body.key      = constants.SOCIALWEBSITE.APPLE;
    req.body.access_token = textUtility.generateAccessToken(req.body.apple_id_token);
    if (req.body.email && jwtClaims.email && jwtClaims.email != req.body.email) {
      logging.log(req.apiReference, {EVENT: "Not valid email or email not matched in apple connect", RESULT: jwtClaims});
      return newResponses.sendError(res, {}, constants.responseMessages.NOT_VALID_EMAIL);
    }
    else if(jwtClaims.hasOwnProperty('email')) {
      req.body.email = jwtClaims.email;
      let userDetail = await userService.getUser(req.apiReference, {email: req.body.email});
      (userDetail.length != 0) ? req.body.status = constants.SOCIAL_STATUS.LOGIN : req.body.status = constants.SOCIAL_STATUS.REGISTER;
    }
    else {
      let userDetail = await userService.getUser(req.apiReference, {apple_user_identifier: req.body.apple_user_identifier});
      (userDetail.length != 0) ? req.body.status = constants.SOCIAL_STATUS.LOGIN : req.body.status = constants.SOCIAL_STATUS.REGISTER;
      switch(+req.body.offering) {
        case constants.OFFERING.FUGU:
          req.body.email = jwtClaims.sub + "@fugu.com";
          break;
        case constants.OFFERING.YELO:
          req.body.email = jwtClaims.sub + "@yelo.com";
          break;
        case constants.OFFERING.BULBUL:
          req.body.email = jwtClaims.sub + "@bulbul.com";
          break;
        default :
          req.body.email = jwtClaims.sub + "@others.com";
      }
    }
    (!req.body.apple_user_identifier)?req.body.apple_user_identifier=jwtClaims.sub:0;
    if (req.body.status == constants.SOCIAL_STATUS.LOGIN) {
      userDataController.jungleLogin(req, res);
    }
    else if (req.body.status == constants.SOCIAL_STATUS.REGISTER) {
      userDataController.jungleRegisterUser(req, res);
    }
  }
  catch(error) {
    logging.log(req.apiReference, {EVENT: "Error in jungleAppleConnect catch", ERROR: error});
    if(String(error).includes('TokenExpiredError')){
      return newResponses.sendError(res,constants.responseMessages.APPLE_TOKEN_EXPIRED);
    }
    if(String(error).includes('header')){
      return newResponses.sendError(res,constants.responseMessages.INVALID_APPLE_TOKEN);
    }
    return newResponses.sendError(res,error);
  }
}
