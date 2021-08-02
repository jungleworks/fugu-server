/**
 * Created by gagandeep on 31/01/19.
 */


let winston         = require('winston');
let WinstonRotate   = require('winston-daily-rotate-file');
let path            = require('path');
let utils           = require('../Controller/utils');
let logger          = require('../Routes/logging');

let Logger          = {};

Logger.options = {
    name          : 'scrum-logs',
    filename      : path.join(__dirname, '..', 'scrum_logs/scrum.log'),
    datePattern   : '.dd-MM-yyyy',
    maxDays       : 4,
    zippedArchive : true
};
Logger.requestFormat = {
    statusCode   : ':statusCode',
    method       : ':method',
    url          : ':url[pathname]',
    responseTime : ':responseTime ms',
    ip           : ':ip',
    userAgent    : ':userAgent',
    data         : ':data',
    response     : ':response'
};
Logger.winstonRotateObj = new WinstonRotate(Logger.options);
Logger.transports       = [Logger.winstonRotateObj];
Logger.winstonLogger    = new winston.Logger({ level : 'debug', transports : Logger.transports });

const enableWinstonLogger = true;

function log(loggingLevel, loggingParameters) {
    if(!enableWinstonLogger) {
        return;
    }
    let winstonLogger = Logger.winstonLogger;

    let handlingInfo = loggingParameters[0];
    let apiModule    = handlingInfo.apiModule;
    let apiHandler   = handlingInfo.apiHandler;


    let requestId = handlingInfo.uuid ? ' - ' + handlingInfo.uuid + ' ' : '';
    let loggingTime = '[ ' + utils.getLoggingTime() + requestId + ' ] ';
    for (let i = 1; i < loggingParameters.length; i++) {
        winstonLogger.log(logger.levelToWinstonLevel[loggingLevel], loggingTime + apiModule + ' ::: ' + apiHandler + ' ::: ' + JSON.stringify(loggingParameters[i]) + '\n');
    }
}

exports.log  = log;
