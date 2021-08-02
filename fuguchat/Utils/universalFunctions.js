const moment = require('moment');
// const zlib = require('zlib');
const ERROR = require('../Config').responseMessages.ERROR;
const SUCCESS = require('../Config').responseMessages.SUCCESS;

/*-------------------------------------------------------------------------------
 * send error
 * -----------------------------------------------------------------------------*/

exports.sendError = function (err, res) {
  const errorMessage = err.customMessage || err.message || ERROR.eng.DEFAULT.customMessage;
  if (typeof err == 'object' && err.hasOwnProperty('statusCode') && err.hasOwnProperty('customMessage')) {
    return res.status(err.statusCode).send({ statusCode: err.statusCode, message: errorMessage, type: err.type || ERROR.eng.DEFAULT.type, data: err.data || {} });
   }

  return res.status(err.statusCode || 400).send({ statusCode: err.statusCode || 400, message: errorMessage, type: err.type || ERROR.eng.DEFAULT.type, data: err.data || {} });
  };

exports.sendErrorWithCause = function (errorMessage, error, res) {
  let errStack = error.stack || "";
  let cause = errStack.split("\n")[0];
  if (typeof errorMessage == 'object' && errorMessage.hasOwnProperty('statusCode') && errorMessage.hasOwnProperty('customMessage')) {
    return res.status(errorMessage.statusCode).send({
      statusCode: errorMessage.statusCode,
      message: errorMessage.customMessage,
      type: errorMessage.type || ERROR.eng.DEFAULT.type,
      cause: cause
    });
  }
  return res.status(400).send({
    statusCode: 400, message: errorMessage, type: ERROR.eng.DEFAULT.type, cause: cause
  });
};

exports.sendSuccess = function (successMsg, data, res) {
  let statusCode = data ? data.statusCode || successMsg.statusCode || 200 : 200;
  let message = successMsg.customMessage || SUCCESS.DEFAULT.customMessage;
  let responseObj = { statusCode: data ? data.statusCode || statusCode : statusCode, message: data ? data.customMessage || message : message, data: data || {} };

  // if (constants.enableZlibCompression) {
  //   zlib.gzip(JSON.stringify(responseObj), (err, zippedData) => {
  //     if (err) {
  //       return res.status(statusCode).send(data);
  //     }
  //     res.set({ 'Content-Encoding': 'gzip' });
  //     return res.send(zippedData);
  //   });
  // } else {
  return res.status(statusCode).send(responseObj);
  // }
};

exports.sendSuccessWithFile = function (successMsg, data, res) {
  res.send(data);
};



/*-------------------------------------------------------------------------------
 * Joi error handle
 * -----------------------------------------------------------------------------*/

let failActionFunction = function (request, reply, source, error) {
  if (error.isBoom) {
    delete error.output.payload.validation;
    if (error.output.payload.message.indexOf("authorization") !== -1) {
      error.output.statusCode = ERROR.UNAUTHORIZED.statusCode;
      return reply(error);
    }
    let details = error.data.details[0];
    if (details.message.indexOf("pattern") > -1 && details.message.indexOf("required") > -1 && details.message.indexOf("fails") > -1) {
      error.output.payload.message = "Invalid " + details.path;
      return reply(error);
    }
  }
  let customErrorMessage = '';
  if (error.output.payload.message.indexOf("[") > -1) {
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
  if (inDate) { return new Date(); }

  return new Date().toISOString();
};

let getTodayDateInFormat = function (format) {
  if (format) { return moment().format(format); }

  return moment().format('YYYY-MM-DD');
};

let getDateTime = function (offset) {
  if (offset) { return moment(new Date()).utcOffset(offset).format('YYYY-MM-DD/HH:mm'); }

  return moment(new Date()).format('YYYY-MM-DD/HH:mm');
};

let getDateTimeWithOffset = function (date, offset, format) {
  return moment(new Date(date)).utcOffset(offset).format(format);
};

exports.convertUtcDateToLocalDate = function(date, timezone){
  return moment(date).add(timezone,'minute').format("YYYY-MM-DDTHH:mm:ss");
}

let getDateInFormat = function (date, format) {
  if (format) { return moment(date).format(format); }

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
  if (format) { newDate = moment(Date).add(time, timeUnit).format(format); } else { newDate = moment(Date).add(time, timeUnit); }
  return newDate;
}

function getMinutesFromTime(time) {
  let timeAry = time.split(':');
  let hours = timeAry[0];
  let minutes = timeAry[1].split(' ')[0];
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  minutes += hours * 60;
  if (timeAry[1].split(" ")[1] == "PM") {
    if (hours == 12) minutes = minutes;
    else minutes += 12 * 60;
  } else if (timeAry[1].split(" ")[1] == "AM") minutes -= hours * 60;
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
  if (diff > 720) {
    hours -= 12;
  }
  if (hours == 0) {
    hours = 12;
  }
  let mins = diff % 60;
  if (mins == 0) {
    mins = "00";
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  d = hours + ":" + mins + " ";
  if (diff >= 720) {
    d += "PM";
    slotMeridian = "PM";
  } else {
    d += "AM";
    slotMeridian = "AM";
  }
  jsonDate.timeSlot = d;
  if (slotMeridian == myMeridian) {
    jsonDate.date = finalDate;
  } else if (slotMeridian == 'AM' && myMeridian == 'PM') {
    jsonDate.date = finalDate.add('d', 1);
  } else if (slotMeridian == 'PM' && myMeridian == 'AM') {
    jsonDate.date = finalDate.subtract(1, 'd');
  }
  jsonDate.date = jsonDate.date.toISOString().split('T')[0];
  return jsonDate;
}


let getDifference = function (date, duration, unit) {
  return new Date(moment(date).subtract(duration, unit));
};


function isEmpty(obj) {
  if (obj == null) return true;
  if (obj.length && obj.length > 0) return false;
  if (obj.length === 0) return true;

  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

function getRange(startDate, endDate, diffIn) {
  let dr = moment.range(startDate, endDate);
  if (!diffIn) { diffIn = 'minutes'; }
  if (diffIn == "milli") { return dr.diff(); }

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
      temp[keyName[j]] = data[i][keyName[j]];
    }
    map[data[i][key]] = temp;
  }
  return map;
}

let createArray = function (List, keyName) {
  let IdArray = [];
  for (let key in List) {
    if (List.hasOwnProperty(key)) {
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
  if (lat < -90 || lat > 90) {
    valid = false;
  }
  if (long < -180 || long > 180) {
    valid = false;
  }
  return valid;
};

let getUnique = function (string) {
  let num = 0;
  if (string.length) {
    for (let i = 0; i < string.length; i++) {
      if (string.lastIndexOf(string[i]) == string.length - 1 - string.lastIndexOf(string[i])) {
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


function capitalizeFirstLetterstr(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

exports.getRandomString = function () {
  return exports.generateRandomString(10) + "." + (new Date()).getTime();
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


function checkAppVersion(type, appType, version, callbackRoute) {
  let query = {
    type: type,
    appType: appType,
    currentCriticalVersion: { $gt: version }
  };

  DAO.getData(Models.appVersion, query, {}, { lean: true }, callbackRoute);
}

/* module.exports = {
    failActionFunction : failActionFunction,
}; */

exports.formatPhoneNumber = function (phone) {
  if (phone) {
    phone = phone.toString();
    phone = phone.replace(" ", "");
    phone = phone.replace("(", "");
    phone = phone.replace(")", "");
    phone = phone.replace("-", "");
    phone = phone.replace("undefined", "");
    phone = phone.replace("_", "");
    phone = phone.replace(",", "");
  }
  return phone;
}

exports.getRandomString = () => {
  return exports.generateRandomString(10) + "." + (new Date()).getTime();
};

exports.validateDate = function (message, regex) {
  // const str = message;
  let dateRegexWithoutGlobal = new RegExp(regex, '');

  let matchCount = 0;
  const dateObj = {
    dates: [],
    isInvalid: false
  };
  let m;
  while ((m = dateRegexWithoutGlobal.exec(message)) !== null) {
    if (m.index === dateRegexWithoutGlobal.lastIndex) {
      dateRegexWithoutGlobal.lastIndex++;
    }
    matchCount++;
    if (matchCount > 2) {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
      return dateObj;
    }
    const unparsedDateTime = m[0];
    const unparsedDate = unparsedDateTime.split(' ')[0];
    const unparsedTime = unparsedDateTime.split(' ')[1];
    let monthDate = [];
    let time = []
    if (unparsedDate.includes('.')) {
      monthDate = unparsedDate.split('.');
    } else if (unparsedDate.includes('/')) {
      monthDate = unparsedDate.split('/');
    } else if (unparsedDate.includes('-')) {
      monthDate = unparsedDate.split('-');
    }
    if (unparsedTime) {
      time = unparsedTime.split(':');
    }
    if (time[0] > 23) {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
      return 301;
    }
    if (time[1] > 59) {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
      return 301;
    }
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth() + 1;
    const leaveDate = monthDate[0];
    const leaveMonth = monthDate[1];
    const leaveDateObj = moment().set('month', leaveMonth - 1).set('date', leaveDate);
    const temp = new Date(leaveDateObj);
    if (temp instanceof Date && !isNaN(temp.getTime())) {
      if (nowMonth == 1 && leaveMonth == 12) {
        temp.setFullYear(nowYear - 1);
      } else {
        temp.setFullYear(nowYear);
      }
      if (temp.getTime() < now.getTime()) {
        // Two cases are possible
        // 1. he is applying leave for a day in past
        // 2. he is applying for leave in next year
        // consider case 1 if leaveDate is within 1 month from 		today
        // else consider case 2
        if (moment(now).diff(moment(temp), 'months') < 1) {
          if (nowMonth == 1 && leaveMonth == 12) {
            leaveDateObj.set('year', nowYear - 1);
          } else {
            leaveDateObj.set('year', nowYear);
          }
        } else {
          if (nowMonth == 1 && leaveMonth == 12) {
            leaveDateObj.set('year', nowYear);
          } else {
            leaveDateObj.set('year', nowYear + 1);
          }
        }
      } else {
        // applying for leave for someday in future in same year
        leaveDateObj.set('year', nowYear);
      }
      if (time.length) {
        leaveDateObj.set('hours', time[0]);
        leaveDateObj.set('minutes', time[1]);
      }
      // console.log(leaveDateObj);
      dateObj.dates.push(new Date(leaveDateObj));
    } else {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
    }
    return dateObj;
  }
}

exports.validateTime = function (message, regex) {
  // const str = message;
  let timeRegexWithoutGlobal = new RegExp(regex, '');
  const dateObj = {
    dates: [],
    isInvalid: false
  };
  let m;

  while ((m = timeRegexWithoutGlobal.exec(message)) !== null) {
    if (m.index === timeRegexWithoutGlobal.lastIndex) {
      timeRegexWithoutGlobal.lastIndex++;
    }
    const unparsedDateTime = m[0];
    const unparsedTime = unparsedDateTime.split(' ')[0];
    let time = []

    if (unparsedTime) {
      time = unparsedTime.split(':');
    }
    if (time[0] > 23) {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
      return 301;
    }
    if (time[1] > 59) {
      dateObj.isInvalid = true;
      dateObj.dates = [];
      dateObj.dates.push(new Date());
      return 301;
    }
    return unparsedTime;
  }
}

exports.shuffle = function (array) {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function random(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }

  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new TypeError('Expected all arguments to be numbers');
  }

  return Math.floor(Math.random() * (max - min + 1) + min);
}

exports.getDateRange=function (message) {
  try{
    if (message.includes('tomorrow')) {
      const today = moment();
      const tomorrow = moment(today).add(1, 'days');
      return {
        dates: [tomorrow],
        isInvalid: false
      };
    }
    const regex = /(\d+(\.|-|\/)\d+(\.|-|\/)\d)|(\d+(\.|-|\/)\d+)/gm;
    const str = message;
    let matchCount = 0;
    const dateObj = {
      dates: [],
      isInvalid: false
    };
    let m;
    while ((m = regex.exec(str)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      matchCount++;
      if (matchCount > 2) {
        dateObj.isInvalid = true;
        dateObj.dates = [];
        dateObj.dates.push(new Date());
        return dateObj;
      }
      const unparsedDate = m[0];
      let monthDate = [];
      if (unparsedDate.includes('.')) {
        monthDate = unparsedDate.split('.');
      } else if (unparsedDate.includes('/')) {
        monthDate = unparsedDate.split('/');
      } else if (unparsedDate.includes('-')) {
        monthDate = unparsedDate.split('-');
      }
      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth() + 1;
      const leaveDate = monthDate[0];
      const leaveMonth = monthDate[1];
      const leaveDateObj = moment().set('month', leaveMonth - 1).set('date', leaveDate);
      const temp = new Date(leaveDateObj);
      if (temp instanceof Date && !isNaN(temp.getTime())) {
        if (nowMonth == 1 && leaveMonth == 12) {
          temp.setFullYear(nowYear - 1);
        } else {
          temp.setFullYear(nowYear);
        }
        if (temp.getTime() < now.getTime()) {
          // Two cases are possible
          // 1. he is applying leave for a day in past
          // 2. he is applying for leave in next year
          // consider case 1 if leaveDate is within 1 month from 		today
          // else consider case 2
          if (moment(now).diff(moment(temp), 'days') < 1) {
            if (nowMonth == 1 && leaveMonth == 12) {
              leaveDateObj.set('year', nowYear - 1);
            } else {
              leaveDateObj.set('year', nowYear);
            }
          } else {
            if (nowMonth == 1 && leaveMonth == 12) {
              leaveDateObj.set('year', nowYear);
            } else {
              leaveDateObj.set('year', nowYear + 1);
            }
          }
        } else {
          // applying for leave for someday in future in same year
          leaveDateObj.set('year', nowYear);
        }
        // console.log(leaveDateObj);
        dateObj.dates.push(new Date(leaveDateObj));
      } else {
        console.log('Invalid date found');
        dateObj.isInvalid = true;
        dateObj.dates = [];
        dateObj.dates.push(new Date());
        return dateObj;
      }
    }
    return dateObj;
  }catch(e){
    return JSON.stringify(e);
  }
}
