/**
 * Created by ashishprasher on 22/08/19.
 */

var Promise                                 = require('bluebird');

var dbHandler                               = require('./../../../routes/mysqlLib');
var constants                               = require('./../../../routes/constants');
var logging                                 = require('./../../../routes/logging');

exports.getCurrencies                       = getCurrencies;
exports.initializeCurrencies                = initializeCurrencies;

function getCurrencies(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [];
    opts.columns = opts.columns ? opts.columns : '*';

    var query  = `SELECT ${opts.columns} FROM tb_currencies WHERE is_active = 1 `;

    if(opts.currency_id){
      query += " AND currency_id = ?";
      values.push(opts.currency_id);
    }

    dbHandler.mysqlQueryPromise(apiReference, "getCurrencies", query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function initializeCurrencies(apiReference, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      var validCurrencies = [];
      var currencyIdToCurrencyObj = {};
      var currencies = yield getCurrencies(apiReference, {});
      for(var i = 0; i < currencies.length; i++ ){
        validCurrencies.push(currencies[i].id);
        currencyIdToCurrencyObj[currencies[i].id] = currencies[i];
      }
      startupVariables.validCurrencies         = validCurrencies;
      startupVariables.currencyIdToCurrencyObj = currencyIdToCurrencyObj;
      logging.log(apiReference, startupVariables);
    })().then((data) => {
      logging.log(apiReference, {EVENT: "initializeCurrencies Success", DATA: data});
      resolve(data);
    }, (error) => {
      logging.logError(apiReference, {EVENT: "initializeCurrencies Error", ERROR: error});
      reject(error);
    });
  });
}