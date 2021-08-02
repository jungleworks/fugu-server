
const Boom              = require('boom');
const random            = require('random-int');
const moment            = require('moment');
const zlib              = require('zlib');
const constants         = require('./constants');
const ERROR             = require('../Config').responseMessages.ERROR;
const SUCCESS           = require('../Config').responseMessages.SUCCESS;

/*-------------------------------------------------------------------------------
 * send error
 * -----------------------------------------------------------------------------*/
// TODO : remove boom if not needed and refactor
exports.sendErrorDeprecated = function (data) {
  let error;
  if(typeof data == 'object' && data.hasOwnProperty('statusCode') && data.hasOwnProperty('customMessage')) {
    error =  Boom.create(data.statusCode, data.customMessage);
    if(data.hasOwnProperty('type')) {
      error.output.payload.type = data.type;
      return error.output.payload;
    }
  } else {
    let errorToSend = '';
    let type = '';
    if(typeof data == 'object') {
      if(data.response) {
        errorToSend = data.response.message;
      } else if(data.message) {
        errorToSend = data.message;
      }
    } else {
      errorToSend = data;
      type = ERROR.DEFAULT.type;
    }

    let customErrorMessage = errorToSend;
    if(typeof errorToSend == 'string') {
      if(errorToSend.indexOf("[") > -1) {
        customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
      } else {
        customErrorMessage = errorToSend;
      }
      customErrorMessage = customErrorMessage.replace(/"/g, '');
      customErrorMessage = customErrorMessage.replace('[', '');
      customErrorMessage = customErrorMessage.replace(']', '');
    }
    error =  Boom.create(400, customErrorMessage);
    error.output.payload.type = type;
    return error.output.payload;
  }
};




exports.sendError = function (err, res) {
  const errorMessage = err.customMessage || err.message || ERROR.eng.DEFAULT.customMessage;
  if(typeof err == 'object' && err.hasOwnProperty('statusCode') && err.hasOwnProperty('customMessage')) {
    return res.status(err.statusCode).send({ statusCode : err.statusCode, message : errorMessage, type : err.type || ERROR.eng.DEFAULT.type, data : err.data || {} });
  }

  return res.status(400).send({ statusCode : 400, message : errorMessage, type : err.type || ERROR.eng.DEFAULT.type });
};

exports.sendErrorWithCause = function (errorMessage, error, res) {
  let errStack = error.stack || "";
  let cause = errStack.split("\n")[0];
  if(typeof errorMessage == 'object' && errorMessage.hasOwnProperty('statusCode') && errorMessage.hasOwnProperty('customMessage')) {
    return res.status(errorMessage.statusCode).send({
      statusCode : errorMessage.statusCode,
      message    : errorMessage.customMessage,
      type       : errorMessage.type || ERROR.eng.DEFAULT.type,
      cause      : cause
    });
  }
  return res.status(400).send({
    statusCode : 400, message    : errorMessage, type       : ERROR.eng.DEFAULT.type, cause      : cause
  });
};

exports.sendSuccess = function (successMsg, data, res) {
  let statusCode   = successMsg.statusCode || 200;
  let message      = successMsg.customMessage || SUCCESS.DEFAULT.customMessage;
  let responseObj  = { statusCode : statusCode, message : message, data : data || {} };

  if(constants.enableZlibCompression) {
    zlib.gzip(JSON.stringify(responseObj), (err, zippedData) => {
      if(err) {
        return res.status(statusCode).send(data);
      }
      res.set({ 'Content-Encoding' : 'gzip' });
      return res.send(zippedData);
    });
  } else {
    return res.status(statusCode).send(responseObj);
  }
};

exports.sendSuccessWithFile = function (successMsg, data, res) {
  res.send(data);
};

exports.getLeaveDateString = function(payload) {
  let tomorrowDate = moment(new Date()).add(1, 'd').add(payload.time_zone,'m');
  let leaveStartDate = moment(payload.leave_start_date).add(payload.time_zone,'m');
  let nowDate = moment(new Date()).add(payload.time_zone - 2,'m')
  let serverDate = moment(new Date()).add(payload.time_zone ,'m')
  let leaveEndDate = '';

  if(payload.leave_end_date) {
    leaveEndDate = moment(payload.leave_end_date).add(payload.time_zone,'m');
  }

  let titlePlaceHolder = ``;
  let message = `Leave `;
  if(payload.requested_leaves == 0 || payload.is_clock_in_allowed) {
    message = `Work from home `
  } else {
    titlePlaceHolder = payload.title + " ";
  }

  if(new Date(tomorrowDate) >= new Date(leaveStartDate) && new Date(nowDate) < new Date(leaveStartDate)) {
    if(leaveEndDate) {
      message = titlePlaceHolder + message + `for ${payload.requested_leaves} days starting ${(leaveStartDate.calendar().split(" at"))[0]} to ${moment(leaveEndDate).format('Do MMMM YYYY')}`;
    }  else if(payload.requested_leaves && payload.requested_leaves < 1 && !payload.is_clock_in_allowed) {
      message = `${payload.half_day} Leave ${(getDay(leaveStartDate.startOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),serverDate.startOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')))}`;
    } else if(payload.requested_leaves && payload.requested_leaves < 1 && payload.is_clock_in_allowed) {
      message = `${payload.half_day} Work from Home ${(leaveStartDate.calendar().split(" at"))[0]}`;
    } else {
      message = titlePlaceHolder + message + `${(leaveStartDate.calendar().split(" at"))[0]}`;
    }
  } else {
    if(leaveEndDate) {
      message = titlePlaceHolder +  message + `for ${payload.requested_leaves} days starting ${moment(leaveStartDate).format('Do MMMM YYYY')} to ${moment(leaveEndDate).format('Do MMMM YYYY')}`;
    } else if(payload.requested_leaves && payload.requested_leaves < 1 && !payload.is_clock_in_allowed) {
      message = `${payload.half_day} Leave on ${moment(leaveStartDate).format('Do MMMM YYYY')}`;
    }
    else if(payload.requested_leaves && payload.requested_leaves < 1 && payload.is_clock_in_allowed){
      message = `${payload.half_day} Work from Home on ${moment(leaveStartDate).format('Do MMMM YYYY')}`;
    } else {
     message = titlePlaceHolder +  message + `on ${moment(leaveStartDate).format('Do MMMM YYYY')}`;
    }
  }
  return message;
}



/*-------------------------------------------------------------------------------
 * Joi error handle
 * -----------------------------------------------------------------------------*/

let failActionFunction = function (request, reply, source, error) {
  if(error.isBoom) {
    delete error.output.payload.validation;
    if(error.output.payload.message.indexOf("authorization") !== -1) {
      error.output.statusCode = ERROR.UNAUTHORIZED.statusCode;
      return reply(error);
    }
    let details = error.data.details[0];
    if(details.message.indexOf("pattern") > -1 && details.message.indexOf("required") > -1 && details.message.indexOf("fails") > -1) {
      error.output.payload.message = "Invalid " + details.path;
      return reply(error);
    }
  }
  let customErrorMessage = '';
  if(error.output.payload.message.indexOf("[") > -1) {
    customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
  } else {
    customErrorMessage = error.output.payload.message;
  }
  customErrorMessage = customErrorMessage.replace(/"/g, '');
  customErrorMessage = customErrorMessage.replace('[', '');
  customErrorMessage = customErrorMessage.replace(']', '');
  error.output.payload.message = customErrorMessage.capitalize();
  delete error.output.payload.validation;
  return reply(error);
};

/*-------------------------------------------------------------------------------
 * Capital First Letter
 * -----------------------------------------------------------------------------*/

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};


/*-------------------------------------------------------------------------------
 * date time format conversion functions
 * -----------------------------------------------------------------------------*/

let getTimestamp = function (inDate) {
  if(inDate) { return new Date(); }

  return new Date().toISOString();
};

let getTodayDateInFormat = function (format) {
  if(format) { return moment().format(format); }

  return  moment().format('YYYY-MM-DD');
};

let getDateTime = function (offset) {
  if(offset) { return moment(new Date()).utcOffset(offset).format('YYYY-MM-DD/HH:mm'); }

  return moment(new Date()).format('YYYY-MM-DD/HH:mm');
};

let getDateTimeWithOffset = function (date, offset, format) {
  return moment(new Date(date)).utcOffset(offset).format(format);
};

let getDateInFormat = function (date, format) {
  if(format) { return moment(date).format(format); }

  return moment(date).format('YYYY-MM-DD');
};

function getTimeSlot(time) {
  let slotTime = time.split(':');
  slotTime = (parseInt(slotTime[0]) * 60) + parseInt(slotTime[1]);
  return slotTime;
}

function addDaysToDate(Date, days) {
  let newDate = moment(Date).add(days, 'days').format('YYYY-MM-DD');
  return newDate;
}

function addTimeToDate(Date, time, timeUnit, format) {
  let newDate;
  if(format) { newDate = moment(Date).add(time, timeUnit).format(format); } else { newDate = moment(Date).add(time, timeUnit); }
  return newDate;
}

function getMinutesFromTime(time) {
  let timeAry = time.split(':');
  let hours = timeAry[0];
  let minutes = timeAry[1].split(' ')[0];
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  minutes += hours * 60;
  if(timeAry[1].split(" ")[1] == "PM") {
    if(hours == 12) minutes = minutes;
    else minutes += 12 * 60;
  } else if(timeAry[1].split(" ")[1] == "AM") minutes -= hours * 60;
  return minutes;
}


function getDurationInFormat(startDate, timeOffset, diff, format) {
  let d = "";
  let myMeridian = moment(new Date(startDate)).add(timeOffset, 'm').format('A');
  let finalDate = moment(new Date(startDate)).add(timeOffset, 'm');
  let jsonDate = {};
  let slotMeridian;
  let hours = diff / 60;
  hours = Math.floor(hours);
  if(diff > 720) {
    hours -= 12;
  }
  if(hours == 0) {
    hours = 12;
  }
  let mins = diff % 60;
  if(mins == 0) {
    mins = "00";
  }
  if(hours < 10) {
    hours = "0" + hours;
  }
  d = hours + ":" + mins + " ";
  if(diff >= 720) {
    d += "PM";
    slotMeridian = "PM";
  } else {
    d += "AM";
    slotMeridian = "AM";
  }
  jsonDate.timeSlot = d;
  if(slotMeridian == myMeridian) {
    jsonDate.date = finalDate;
  } else if(slotMeridian == 'AM' && myMeridian == 'PM') {
    jsonDate.date = finalDate.add('d', 1);
  } else if(slotMeridian == 'PM' && myMeridian == 'AM') {
    jsonDate.date = finalDate.subtract(1, 'd');
  }
  jsonDate.date = jsonDate.date.toISOString().split('T')[0];
  return jsonDate;
}


let getDifference = function (date, duration, unit) {
  return new Date(moment(date).subtract(duration, unit));
};


function isEmpty(obj) {
  if(obj == null) return true;
  if(obj.length && obj.length > 0)    return false;
  if(obj.length === 0)  return true;

  for (let key in obj) {
    if(hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}


exports.generateRandomNumbers = function (numberLength, excludeList) {
  let arrayList = [];
  excludeList = excludeList || [];

  let minString = "0";
  let maxString = "9";

  for (let i = 1; i < numberLength; i++) {
    minString += "0";
    maxString +=  "9";
  }
  let minNumber = parseInt(minString);
  let maxNumber = parseInt(maxString);
  return random(minNumber, maxNumber);
};

exports.generateRandomString = function (length, isNumbersOnly) {
  let charsNumbers = '0123456789';
  let charsLower = 'abcdefghijklmnopqrstuvwxyz';
  let charsUpper = charsLower.toUpperCase();
  let chars;

  if(isNumbersOnly) { chars = charsNumbers; } else { chars = charsNumbers + charsLower + charsUpper; }

  if(!length) length = 32;

  let string = '';
  for (let i = 0; i < length; i++) {
    let randomNumber = random(0, chars.length);
    randomNumber = randomNumber || 1;
    string += chars.substring(randomNumber - 1, randomNumber);
  }
  return string;
};

function getRange(startDate, endDate, diffIn) {
  let dr = moment.range(startDate, endDate);
  if(!diffIn) { diffIn = 'minutes'; }
  if(diffIn == "milli") { return dr.diff(); }

  return dr.diff(diffIn);
}

function createHashFromObjectArray(data, key) {
  let len = data.length;
  let map = {};
  for (let i = 0; i < len; i++) {
    map[data[i][key]] = 1;
  }
  return map;
}

function joinJSON(obj1, obj2) {
  return absorb(obj1, obj2);
}

function createHashFromArray(data) {
  let len = data.length;
  let map = {};
  for (let i = 0; i < len; i++) {
    map[data[i]] = 1;
  }
  return map;
}

function createObjectHashFromObjectArray(data, key, keyName) {
  let len = data.length;
  let map = {};
  for (let i = 0; i < len; i++) {
    let temp = {};
    for (let j = 0; j < keyName.length; j++) {
      temp[keyName[j]] =  data[i][keyName[j]];
    }
    map[data[i][key]] = temp;
  }
  return map;
}

let createArray = function (List, keyName) {
  let IdArray = [];
  for (let key in List) {
    if(List.hasOwnProperty(key)) {
      IdArray.push(List[key][keyName]);
    }
  }
  return IdArray;
};

let validateString = function (str, pattern) {
  return str.match(pattern);
};

let validateLatLongValues = function (lat, long) {
  let valid = true;
  if(lat < -90 || lat > 90) {
    valid = false;
  }
  if(long < -180 || long > 180) {
    valid = false;
  }
  return valid;
};

let getUnique = function (string) {
  let num = 0;
  if(string.length) {
    for (let i = 0; i < string.length; i++) {
      if(string.lastIndexOf(string[i]) == string.length - 1 - string.lastIndexOf(string[i])) {
        num++;
      }
    }
  } else {
    num = 0;
  }
  return num;
};

let getMinutesFromStart = function (time, offset) {
  let temp = new Date(time);
  let start = new Date(temp.setHours(0, 0, 0, 0));
  return (Math.round(((time - start) / 1000) / 60));
};

function getDay(date,nowDate){
  const date1 = new Date(date);
  const date2 = new Date(nowDate);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if(diffDays==0){
    return "Today";
  }
  else{
    return "Tomorrow";
  }
}


function capitalizeFirstLetterstr(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function checkAppVersion(type, appType, version, callbackRoute) {
  let query = {
    type                   : type,
    appType                : appType,
    currentCriticalVersion : { $gt : version }
  };

  DAO.getData(Models.appVersion, query, {}, { lean : true }, callbackRoute);
}


/* module.exports = {
    failActionFunction : failActionFunction,
}; */

