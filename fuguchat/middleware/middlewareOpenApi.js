
const _                = require('underscore');

const UniversalFunc    = require('../Utils/universalFunctions');
const openApiService   = require('../services/openApiService');
const { logger }       = require('../libs/pino_logger');
const RESP             = require('../Config').responseMessages;

const  getUserDataBySecretApiKey = async (req, res, next) => {

    let logHandler = {
        apiModule: 'middleware',
        apiHandler: 'getUserDataFromAccessToken'
    }

    try {

        req.body = Object.assign(req.body, req.query);
        req.body = Object.assign(req.body, req.headers);

        let domainData = await openApiService.getDomainInfoBySecretApiKey(logHandler, { secret_open_api_key: req.body.secret_api_key });

        logger.trace(logHandler, "getDomainInfoBySecretApiKey", {body: { secret_open_api_key: req.body.secret_api_key }, result: domainData});
        if (_.isEmpty(domainData)) {
            throw new Error(RESP.ERROR.eng.INVALID_API_KEY.customMessage);
        }

        req.body.domain_data = domainData[0];

        logger.trace(logHandler, {EVENT: "getUserDataBySecretApiKey going forward"}, {body: req.body});
        next();
    } catch (error) {
        logger.error(logHandler, { EVENT: "getUserDataBySecretApiKey" }, { MESSAGE: error.message });
        error = (error.errorResponse) ? error.errorResponse : error;
        UniversalFunc.sendError(error, res);
    }
};

module.exports = {
    getUserDataBySecretApiKey
}