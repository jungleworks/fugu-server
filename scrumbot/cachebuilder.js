/**
 * Created by gagandeep on 31/01/19.
 */

'use_strict';

const logger           = require('./Routes/logging');
const cache            = require('memory-cache');
const constants        = require('./Utils/constants');
const async            = require('async');
const _                = require('underscore');
//const dbquery          = require('./DAOManager/query');


let logHandler = {
    apiModule  : "cache",
    apiHandler : "buildcache"
};

let validCacheKeys = [];
_.each(constants.cache, (value, key) => {
    validCacheKeys.push(value);
});
let validCacheKeysSet = new Set(validCacheKeys);
logger.info(logHandler, "Valid Cache Keys", validCacheKeys);



exports.buildcache = function (callback) {
    exports.invalidateCache();
    logger.trace(logHandler, "Cache build successful ", cache.exportJson());
    return callback();
};


exports.invalidateCache = function (key) {
    if(key) {
        if(validCacheKeysSet.has(key)) {
            cache.put(key, {});
            logger.info(logHandler, "Cache Invalidated with key", key);
        } else {
            logger.error(logHandler, "Invalidated Cache key ", key);
        }
        return;
    }
    cache.put(constants.cache.BUSINESS_DEVICE_MAPPINGS, {});
    cache.put(constants.cache.BUSINESS_PROPERTY, {});
    cache.put(constants.cache.SERVER_LOGGING, {});
    cache.put(constants.cache.BROADCAST_SERVICE, {});
    logger.info(logHandler, "Full Cache Invalidated");
};
