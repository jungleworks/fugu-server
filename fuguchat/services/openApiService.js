/**
 * Created by Mohit on August 19, 2020.
 */
const _                                     = require('underscore');
const dbHandler                             = require('../database').dbHandler;
const { logger }                            = require('../libs/pino_logger');
const RESP                                  = require('../Config').responseMessages;

const  getDomainInfoBySecretApiKey = async (logHandler, opts) => {
    try {

        let values = [];

        let sql = ' SELECT domain, full_domain FROM domain_credentials where 1=1 ';

        if (opts.secret_open_api_key) {
            sql += ' AND secret_open_api_key = ? '
            values.push(opts.secret_open_api_key)
        }

        if (opts.limit) {
            sql += ' LIMIT 1 '
        }

        let queryObj = {
            query: sql,
            args: values,
            event: "getDomainInfoBySecretApiKey"
        }

        if (_.isEmpty(values)) {
            logger.error(logHandler, {EVENT: 'getDomainInfoBySecretApiKey'}, {queryObj: queryObj});
            throw new Error(RESP.ERROR.eng.INVALID_API_KEY.customMessage);
        }

        logger.trace(logHandler, {EVENT: 'getDomainInfoBySecretApiKey'}, {queryObj: queryObj});
        return await dbHandler.executeQuery(logHandler, queryObj);

    } catch (error) {
        logger.error(logHandler, { EVENT: "getDomainInfoBySecretApiKey" }, { MESSAGE: error.message });
        throw error
    }
}

module.exports = {
    getDomainInfoBySecretApiKey
}