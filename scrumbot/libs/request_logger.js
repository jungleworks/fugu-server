/**
 * Created by gagandeep on 31/01/19.
 */

// This module is based on winston-request-logger


var url             = require('url');
var useragent       = require('useragent');
var winston         = require('winston');
var WinstonRotate   = require('winston-daily-rotate-file');
var path            = require('path');
var utils           = require('../Controller/utils');

var Logger          = {};

Logger.options = {
    name          : 'scrum-requests',
    filename      : path.join(__dirname, '..', 'logs/scrum-requests.log'),
    datePattern   : '.dd-MM-yyyy',
    maxDays       : 14,
    zippedArchive : true
};
Logger.requestFormat = {
    statusCode   : ':statusCode',
    method       : ':method',
    url          : ':url[pathname]',
    responseTime : ':responseTime ms',
    ip           : ':ip',
    userAgent    : ':userAgent',
    request      : ':request',
    ruid         : ':ruid',
    response     : ':response'
};
Logger.winstonRotateObj = new WinstonRotate(Logger.options);
Logger.transports       = [Logger.winstonRotateObj];
Logger.winstonLogger    = new winston.Logger({ transports : Logger.transports });
Logger.removeRequestKeys = new Set(['businessInfo', 'channelInfo', 'userInfo']);

const logHandler = {
    apiModule  : "server",
    apiHandler : "winstonLogger"
};

Logger.create = function () {
    return function (req, res, next) {
        let logger = Logger.winstonLogger;
        let format = Logger.requestFormat;

        var requestEnd = res.end,
            requestedUrl = url.parse(req.originalUrl),
            startTime = new Date();

        // Proxy the real end function
        res.end = function (chunk, encoding) {
            var compressed = (res._headers && res._headers['content-encoding'] == 'gzip');
            utils.zlibDeCompress(chunk, compressed, (err, decompressedChunk) => {
                // Our format argument above contains key-value pairs for the output
                // object we send to Winston. Let's use this to format our results:
                var data = {};
                var tokens = {
                    ':date'              : startTime.toISOString(),
                    ':statusCode'        : res.statusCode,
                    ':method'            : req.method,
                    ':responseTime'      : (new Date() - startTime),
                    ':url\\[([a-z]+)\\]' : function (str, segment) { return requestedUrl[segment]; },
                    ':ip'                : req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress,
                    ':userAgent'         : useragent.parse(req.headers['user-agent']).toString(),
                    ':request'           : getRequest(req),
                    ':ruid'              : req.uuid || '',
                    ':response'          : decompressedChunk
                };


                // Do the work expected
                res.end = requestEnd;
                res.end(chunk, encoding);



                for (const key in format) {
                    data[key] = format[key];
                    for (const token in tokens) {
                        data[key] = data[key].replace(new RegExp(token), tokens[token]);
                    }
                }

                logger.info(logHandler, data);
            });
        };

        next();
    };
};

function getRequest(req) {
    let request = utils.cloneObject((req.body || req.query));
    for (const key in request) {
        if(Logger.removeRequestKeys.has(key)) {
            delete request[key];
        }
    }
    return JSON.stringify(request);
}

module.exports  = Logger;
