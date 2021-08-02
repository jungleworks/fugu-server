/**
 * Created by gagandeep on 31/01/19.
 */

/**
 * @module logging
 */
/*
 *
 *   LOGGING HANDLER FOR THE APIs
 *
 *   All the logging calls will be routed through this module
 *   to handle selective logging depending upon the module
 *   and the particular handler generating the log
 */
const    cache          = require('memory-cache');
const constants         = require('../Utils/constants');
const _                 = require('underscore');
const    utils          = require('../Controller/utils');
const winstonLogger     = require('../libs/winston_logger');

var levels = {
    trace : 0,
    debug : 1,
    info  : 2,
    warn  : 3,
    error : 4
};

var levelToWinstonLevel = {
    0 : 'verbose',
    1 : 'debug',
    2 : 'info',
    3 : 'warn',
    4 : 'error',
};

// pick this property from
const debuggingPermissions = {
    loggingEnabled      : true,
    globalLoggingLevel  : levels.info,
    defaultLoggingLevel : levels.trace,

    user : {
        loggingEnabled      : true,
        defaultLoggingLevel : levels.trace,

    },
    cache : {
        loggingEnabled      : true,
        defaultLoggingLevel : levels.trace,

    },
    mqHandler : {
        loggingEnabled      : true,
        defaultLoggingLevel : levels.trace,

        handleMqMessage : false
    },
    scrum : {
        loggingEnabled      : true,
        defaultLoggingLevel : levels.trace,

        createBusiness : true,
        createNewScrum : true
    },
    server : {
        loggingEnabled      : true,
        defaultLoggingLevel : levels.trace,
        
        logger  : false
      }
};



exports.levels           = levels;
exports.levelToWinstonLevel = levelToWinstonLevel;
exports.trace            = trace;
exports.debug            = debug;
exports.info             = info;
exports.warn             = warn;
exports.error            = error;
exports.logDatabaseQuery = logDatabaseQuery;
exports.logFileWrite     = logFileWrite;
exports.logFileRead      = logFileRead;
exports.logRequest       = logRequest;
exports.logResponse      = logResponse;
exports.logErrorResponse = logErrorResponse;
exports.logError         = logError;




// A variadic function to log the stuff
function log(loggingLevel, loggingParameters) {
    let handlingInfo = loggingParameters[0];
    let apiModule    = handlingInfo.apiModule;
    let apiHandler   = handlingInfo.apiHandler;

    // winston logging
    winstonLogger.log(loggingLevel, loggingParameters);


    // rest of the logging
    let defaultLoggingLevel = debuggingPermissions[apiModule].defaultLoggingLevel;
    if(loggingLevel !== levels.error && loggingLevel < debuggingPermissions.globalLoggingLevel && (!isLoggingEnabled(apiModule, apiHandler))) {
        return;
    }

    let stream = process.stdout;
    if(loggingLevel === levels.error) {
        stream = process.stderr;
    }
    let requestId = handlingInfo.uuid ? ' - ' + handlingInfo.uuid : '';
    let loggingTime = '[ ' + utils.getLoggingTime() + requestId + ' ] ';
    for (let i = 1; i < loggingParameters.length; i++) {
        stream.write(loggingTime + apiModule + ' ::: ' + apiHandler + ' ::: ' + JSON.stringify(loggingParameters[i]) + '\n');
    }
}


function trace(/* arguments */) {
    log(levels.trace, arguments);
}

function debug(/* arguments */) {
    log(levels.debug, arguments);
}

function info(/* arguments */) {
    log(levels.info, arguments);
}

function warn(/* arguments */) {
    log(levels.warn, arguments);
}

function error(/* arguments */) {
    log(levels.error, arguments);
}

// use this once execution
function logError(logHandler, message, error) {
    const stream = process.stderr;
    let data = "";
    data += ' ::: ' + '\t' + JSON.stringify(logHandler) + '\t';
    data += ' ::: ' + '\t' + JSON.stringify({ ERROR : message }) + '\t';
    data += ' ::: ' + '\t' + JSON.stringify(error) + '\n';
    data += ' ::: ' + '\t' + " Stack trace : [" + error.stack + ' ] \n';

    stream.write(data);
}

function logDatabaseQuery(message, query, result, error) {
    if(!arguments[0].apiModule) {
        console.error("handler not passed ", new Error("handler not passed ").stack);
        return;
    }
    let logHandler = arguments[0];
    message = arguments[1];
    query = arguments[2];
    result = arguments[3];
    error = arguments[4];

    if((typeof error !== 'undefined') && (error != null)) {
        module.exports.error(logHandler, {
            event        : message, error        : error, query        : query,  query_result : result
        });
    } else {
        module.exports.trace(logHandler, { event : message, query : query,  query_result : result });
    }
}



// function logSendingEmail(logHandler, mailOptions, error, response)

function logFileWrite(logHandler, filename, error) {
    if(error) {
        module.exports.error(logHandler, { FILENAME : filename }, { ERROR : error });
    } else {
        module.exports.trace(logHandler, { FILENAME : filename }, { ERROR : error });
    }
}

function logFileRead(logHandler, filename, error, data) {
    if(error) {
        module.exports.error(logHandler, { FILENAME : filename }, { ERROR : error });
    } else {
        module.exports.trace(logHandler, { FILENAME : filename }, { ERROR : error });
    }
}

function logRequest(logHandler, request) {
    module.exports.trace(logHandler, { REQUEST : request });
}

function logResponse(logHandler, response) {
    module.exports.trace(logHandler, { RESPONSE : response });
}

function logErrorResponse(logHandler, response) {
    module.exports.error(logHandler, { RESPONSE : response });
}



function isLoggingEnabled(module, handler) {
    // Check if the logging has been enabled
    if(!debuggingPermissions.loggingEnabled) {
        return false;
    }

    // Check if the logging has been enabled for the complete module
    if(!debuggingPermissions[module].loggingEnabled) {
        return false;
    }

    // Check if the logging has been enabled for the particular handler function for the module
    if(!debuggingPermissions[module][handler]) {
        return false;
    }

    return true;
}



