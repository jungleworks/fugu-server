/**
 * Created by gagandeep on 31/01/19.
 */

const zlib          = require('zlib');

exports.getLoggingTime                      = getLoggingTime;
exports.parseInteger                        = parseInteger;
exports.zlibDeCompress                      = zlibDeCompress;
exports.cloneObject                         = cloneObject;

function getLoggingTime() {
    let date = new Date();
    return  pad(date.getUTCMonth() + 1)
        + '-' + pad(date.getUTCDate())
        + ' ' + pad(date.getUTCHours())
        + ':' + pad(date.getUTCMinutes())
        + ':' + pad(date.getUTCSeconds())
        + '.' + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5);
}

function pad(number) {
    var r = String(number);
    if(r.length === 1) {
        r = '0' + r;
    }
    return r;
}

function parseInteger(string, radix) {
    return parseInt(string, radix);
}

function zlibDeCompress(chunk, compressed, cb) {
    if(!compressed) {
        return cb(null, chunk);
    }
    zlib.gunzip(chunk, (err, dezipped) => {
        if(err) {
            console.error("Error while decompression ", err);
            return cb(err);
        }
        cb(null, dezipped.toString());
    });
}

function cloneObject(data) {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        return {};
    }
}
