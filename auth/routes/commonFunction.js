var request                             = require('request');
var _                                   = require('underscore');
var logging                             = require('./logging');

exports.checkBlank                      = checkBlank;
exports.addDays                         = addDays;
exports.getKeyListFromObject            = getKeyListFromObject;
exports.getValListFromObject            = getValListFromObject;

function checkBlank (arr, apiReference) {
  if (!Array.isArray(arr)) {
    return 1;
  }
  var arrlength = arr.length;
  for (var i = 0; i < arrlength; i++) {
    if (arr[i] === undefined || arr[i] == null) {
      arr[i] = "";
    } else {
      arr[i] = arr[i];
    }
    arr[i] = arr[i].toString().trim();
    if (arr[i] === '' || arr[i] === "" || arr[i] === undefined) {
      logging.log(apiReference, {EVENT: "Check blank failed", MAN_VALUES: arr});
      return 1;
    }
  }
  return 0;
}

function addDays(days) {
  var newDate = new Date();
  newDate.setTime(newDate.getTime() + (86400000 * days)); // add a date
  newDate.setHours(23, 59, 59, 999);
  return new Date(newDate)
}

function getKeyListFromObject(obj, isNum) {
  var keys = [];
  if (_.isEmpty(obj)) {
    return keys;
  }
  for (var key in obj) {
    if (isNum) {
      key = Number(key);
    }
    keys.push(key);
  }
  return keys;
}

function getValListFromObject(obj) {
  var values = [];
  if (_.isEmpty(obj)) {
    return values;
  }
  for (var key in obj) {
    values.push(obj[key]);
  }
  return values;
}
