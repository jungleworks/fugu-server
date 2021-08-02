const random = require('random-int');
const _ = require('underscore');
const zlib = require('zlib');
const constants = require('./constants');
const utils = require('../Controller/utils');
const ERROR = require('../Config/responseMessages').ERROR;
const SUCCESS = require('../Config/responseMessages').SUCCESS;

exports.isJsonObject = isJsonObject;
exports.checkForDefaultPhoneNumber = checkForDefaultPhoneNumber;

exports.sendError = function (err, res) {
    const errorMessage = err.customMessage || err.message || ERROR.eng.DEFAULT.customMessage;
    if (typeof err == 'object' && err.hasOwnProperty('statusCode') && err.hasOwnProperty('customMessage')) {
        //return err;
        // return res.status(err.statusCode).send(err);

        // return res.status(err.statusCode).send({ statusCode : err.statusCode , message :  errorMessage, type : err.type || ERROR.eng.DEFAULT.type });
        return res.status(400).send({ statusCode: err.statusCode || 400, message: errorMessage, type: err.type || ERROR.eng.DEFAULT.type });
    }
    return res.status(400).send({ statusCode: 400, message: errorMessage, type: err.type || ERROR.eng.DEFAULT.type });
};

exports.sendSuccess = function (successMsg, data, res, receivedResponseObj) {
    let statusCode = successMsg.statusCode || 200;
    let message = successMsg.customMessage || SUCCESS.DEFAULT.customMessage;
    let responseObj = receivedResponseObj ? receivedResponseObj : { statusCode: statusCode, message: message, data: data || {} };

    if (constants.enableZlibCompression && data && data.gzip && data.gzip == 1) {
        zlib.gzip(JSON.stringify(responseObj), (err, zippedData) => {
            delete data.gzip;
            if (err) {
                return res.status(statusCode).send(data);
            }
            res.set({ 'Content-Encoding': 'gzip' });
            return res.send(zippedData);
        });
    } else {
        return res.status(statusCode).send(responseObj);
    }
};

let generateRandomNumbers = function (numberLength, excludeList) {
    let arrayList = [];
    excludeList = excludeList || [];

    let minString = "0";
    let maxString = "9";

    for (let i = 1; i < numberLength; i++) {
        minString += "0";
        maxString += "9";
    }
    let minNumber = utils.parseInteger(minString);
    let maxNumber = utils.parseInteger(maxString);
    for (let i = minNumber; i < maxNumber; i++) {
        let digitToCheck = i.toString();
        if (digitToCheck.length < numberLength) {
            let diff = numberLength - digitToCheck.length;
            let zeros = '';
            for (let j = 0; j < diff; j++) {
                zeros += '0';
            }
            digitToCheck = zeros + digitToCheck;
        }
        if (digitToCheck < 1000) { if (excludeList.indexOf(digitToCheck) == -1) arrayList.push(digitToCheck); }
    }
    if (arrayList.length > 0) {
        arrayList = _.shuffle(arrayList);
        return arrayList[0];
    }
    return false;
};

exports.generateRandomString = function (length, isNumbersOnly) {
    let charsNumbers = '0123456789';
    let charsLower = 'abcdefghijklmnopqrstuvwxyz';
    let charsUpper = charsLower.toUpperCase();
    let chars;

    if (isNumbersOnly) { chars = charsNumbers; } else { chars = charsNumbers + charsLower + charsUpper; }

    if (!length) length = 32;

    let string = '';
    for (let i = 0; i < length; i++) {
        let randomNumber = random(0, chars.length);
        randomNumber = randomNumber || 1;
        string += chars.substring(randomNumber - 1, randomNumber);
    }
    return string;
};

exports.getRandomString = function () {
    return exports.generateRandomString(10) + "_" + (new Date()).getTime();
};

exports.getMuid = function () {
    return exports.generateRandomString(36) + "." + (new Date()).getTime();
};

function isJsonObject(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function checkForDefaultPhoneNumber(phoneNumber) {
    if (phoneNumber == constants.defaultPhoneNumber) {
        return '';
    } else {
        return phoneNumber;
    }
};
