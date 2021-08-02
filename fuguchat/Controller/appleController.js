
const md5                 = require('MD5');
const bcrypt              = require('bcryptjs');
const saltRounds          = 10;

const userService         = require('../services/user');
const constants           = require('../Utils/constants');
const utilityService      = require('../services/utility');
const commonFunctions     = require('../Utils/commonFunctions');

exports.appleSignin       = appleSignin;


async function appleSignin(logHandler, payload){
    try{
      let response              = {valid: false};
      let apple_id_token        = payload.apple_id_token;
      let apple_user_identifier = payload.apple_user_identifier;
      let full_name             = payload.name;
      let resultObj;
      let options = {
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.APPLE_CONNECT,
        method: 'POST',
        json: {
          offering             : 15,
          auth_key             : config.get("authKey"),
          apple_id_token       : apple_id_token,
          apple_user_identifier: apple_user_identifier
        }
      };
      let result = await utilityService.sendHttpRequest(logHandler, options);
      userService.insertAuthLogs(logHandler,{request: options, response: result, type: 'APPLE_SIGNIN', signup_login_source: apple_id_token});
      if(result.status != 200){
        response.message = result.message;
        return response;
      };
      if(result && result.data && result.data.length){
        resultObj = result.data[0];
      };
      let checkUserExist = await userService.getInfo(logHandler,{apple_user_identifier: apple_user_identifier, apple_email: resultObj.email});
      if(checkUserExist.length){
        response.valid = true;
        response.access_token = checkUserExist[0].access_token;
        if(!checkUserExist[0].apple_user_identifier){
          await userService.updateInfo(logHandler,{apple_user_identifier: apple_user_identifier, user_id: checkUserExist[0].user_id});
        }
        return response;
      }
      let accessToken = bcrypt.hashSync(resultObj.email, saltRounds);
      let insertObj = {
        user_id              : commonFunctions.generateUserId(),
        email                : resultObj.email,
        access_token         : accessToken,
        auth_user_id         : resultObj.user_id,
        onboard_source       : 'APPLE',
        password             : md5(resultObj.email),
        full_name            : full_name || resultObj.email,
        apple_user_identifier: apple_user_identifier,
        user_status          : constants.UserStatus.REGISTERED
      };
      await userService.insertNew(logHandler, insertObj); 
      response.valid = true;
      response.access_token = accessToken;
      return response;
    }catch(error){
      throw(error);
    }
}