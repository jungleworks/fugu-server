
const _                      = require('underscore');

const UniversalFunc          = require('../../../Utils/universalFunctions');
const RESP                   = require('../../../Config').responseMessages;
const { logger }             = require('../../../libs/pino_logger');
const openApiService         = require('../../../services/openApiService');
const commonFunctions        = require('../../../Utils/commonFunctions');
const openApiDaoService      = require('../services/openApiDaoService');
const constants              = require('../../../Utils/constants');
const utility         = require('../../../services/utility');

const getMeetUrl = async (req, res) => {
    try {

       const domainData = req.body.domain_data ? req.body.domain_data : null;

       if(!domainData || !domainData.domain){
           throw new Error(RESP.ERROR.eng.INVALID_API_KEY.customMessage);
       }

       const meetUrl = 'https://' + constants.baseMeetUrl + domainData.domain + '/' + utility.genrateRandomString();

       UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, meetUrl, res);
    }catch(error){
        logger.error(req.logHandler, { EVENT: 'getMeetUrl' }, { error: error });
        error = (error.errorResponse) ? error.errorResponse : error;
        UniversalFunc.sendError(error, res);
    }
}

module.exports = {
    getMeetUrl
}