
const UniversalFunc          = require('../../../Utils/universalFunctions');
const RESP                   = require('../../../Config').responseMessages;
const { logger }             = require('../../../libs/pino_logger');
const calenderService        = require('../services/googleCalenderService');
const workspaceService       = require('../../../services/workspace');
const commonFunctions        = require('../../../Utils/commonFunctions');
const googleDaoService       = require('../services/googleDaoService');

exports.getAuthorizeUrl       = getAuthorizeUrl;
exports.submitAuthorizeCode   = submitAuthorizeCode;
exports.addEvent              = addEvent;


async function getAuthorizeUrl(req, res){
    try{
       let domain = req.body.domain;
       let domainCredentials = await workspaceService.getDomainDetails(req.logHandler, {domain: domain});
       if(!domainCredentials.length){
           throw new Error("Invalid Domain");
       }
       let getAuthorizeUrl = await calenderService.getAuthorizationUrl(req.logHandler, req.body, domainCredentials[0]); 
       UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, getAuthorizeUrl, res);  
    }catch(error){
        logger.error(req.logHandler, { EVENT: 'getAuthorizeUrl' }, { error: error });
        error = (error.errorResponse) ? error.errorResponse : error;
        UniversalFunc.sendError(error, res);
    }
}


async function submitAuthorizeCode(req, res){
    try{
       let domain = req.body.domain;
       let domainCredentials = await workspaceService.getDomainDetails(req.logHandler, {domain: domain});
       if(!domainCredentials.length){
        throw new Error("Invalid Domain");
       }
       let token = await calenderService.getToken(req.logHandler, req.body, domainCredentials[0]); 
       await googleDaoService.insertGoogleTokenDetails(req.logHandler,{user_unique_key: req.body.user_unique_key, token: JSON.stringify(token)} )
       UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, {}, res);  
    }catch(error){
        logger.error(req.logHandler, { EVENT: 'submitAuthorizeCode' }, { error: error });
        error = (error.errorResponse) ? error.errorResponse : error;
        UniversalFunc.sendError(error, res);
    }
}



async function addEvent(req, res){
    try{
        let userInfo = req.body.userInfo;
        let domain   = req.body.domain;
        let tokenDetails = await googleDaoService.getGoogleTokenDetails(req.logHandler,{user_unique_key: userInfo.user_id});
        if(!tokenDetails.length){
            throw new Error("Google Calendar is not linked with your account");
        }
        let token = JSON.parse(tokenDetails[0].token);
       
        let domainCredentials = await workspaceService.getDomainDetails(req.logHandler, {domain: domain});
        if(!domainCredentials.length){
            throw new Error("Invalid Domain");
        }
       let oAuthInstance = calenderService.getOAuthInstance(token, req.body, domainCredentials[0]); 
       let event = await calenderService.addEvent(req.logHandler, oAuthInstance, req.body);
       if(!Number(req.body.is_scheduled)){
        let oAuthInstance = calenderService.getOAuthInstance(token, req.body, domainCredentials[0]);  
          calenderService.deleteEvent(req.logHandler,{event_id: event.id}, oAuthInstance);
       }
       UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, event, res);  
    }catch(error){
        logger.error(req.logHandler, { EVENT: 'addGoogleEvent' }, { error: error });
        error = (error.errorResponse) ? error.errorResponse : error;
        UniversalFunc.sendError(error, res);
    }
}
