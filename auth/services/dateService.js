/**
 * Created by sumeetrana on 01/03/19.
 */

const moment                    = require('moment');

const logging                   = require('./../routes/logging');

exports.subtractTime            = subtractTime;
exports.getFormattedDate        = getFormattedDate;



function subtractTime(apiReference, opts) {
  let newDate = new Date(opts.date);
  newDate.setTime(newDate.getTime() - (opts.min * 60000));
  return new Date(newDate);
}






exports.formats = {
  mysqlFormatDate         : 'YYYY-MM-DD',
  mysqlFormatTime         : 'HH:mm:ss',
  mysqlFormatDateTime     : 'YYYY-MM-DD HH:mm:ss',
  dateTime12Hour          : 'YYYY-MM-DD hh:mm a',
  timeWithMilliSeconds    : 'YYYY-MM-DD HH:mm:ss SSS',
  invoiceMonth            : 'MMM YYYY',
  billingMonth            : 'YYYY-MM',
  yearMonth               : 'YYYYMM',
  billingDate             : 'YYYYMMDD',
  jsFormatDateTime        : 'YYYY-MM-DDTHH:mm:ss',
  mail12Hour              : "MMMM Do YYYY, h:mm A",
  mail24Hour              : "MMMM Do YYYY, H:mm",
  time12Hour              : "hh:mm A",
  time24Hour              : "HH:mm",
  orderHistory12Hour      : "MMMM d, YYYY, h:mm A",
  orderHistory24Hour      : "MMMM d, YYYY, HH:mm",
  dateTimeWithMilliSeconds: "YYYY-MM-DDTHH:mm:ss.SSS"
};


function getFormattedDate(date, format) {
  return moment(new Date(date)).format(format);
}