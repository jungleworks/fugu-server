/**
 * Created by ashishprasher on 15/01/18.
 */

var Promise                                 = require('bluebird');

var dbHandler                               = require('./../../../routes/mysqlLib');
var constants                               = require('./../../../routes/constants');
var logging                                 = require('./../../../routes/logging');


exports.createUserOffering                  = createUserOffering;
exports.getUserOfferings                    = getUserOfferings;
exports.getDefaultOfferings                 = getDefaultOfferings;
exports.initializeOfferings                 = initializeOfferings;

function createUserOffering(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [];
    var rows   = [];
    var query  = "INSERT IGNORE INTO tb_user_offerings (user_id, offering) VALUES ";
    for (var i = 0; i < opts.offerings.length; i++) {
      rows.push(" (?,?) ");
      values.push(opts.user_id, opts.offerings[i]);
    }

    query += rows.toString();
    dbHandler.mysqlQueryPromise(apiReference, "createUserOffering", query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserOfferings(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [opts.user_id];
    var query  = `SELECT
                        uo.offering,
                        od.name,
                        od.url,
                        od.logo
                    FROM
                        tb_user_offerings uo
                    LEFT JOIN tb_offering_data od ON
                        od.id = uo.offering
                    WHERE
                        uo.user_id = ? `;

    if (opts.offering) {
      query += " AND uo.offering= ? ";
      values.push(opts.offering);
    }
    ` ORDER BY
                        uo.updated_datetime
                    DESC`;

    dbHandler.mysqlQueryPromise(apiReference, "getUserOfferings", query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getDefaultOfferings(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [];
    var query  = "SELECT ";
    if(opts.fields){
      query += opts.fields
    } else {
      query += " * "
    }
    query += " FROM tb_offering_data WHERE 1=1";
    if (opts.name) {
      query += " AND name = ? ";
      values.push(opts.name);
    }
    if (opts.id) {
      query += " AND id = ?";
      values.push(opts.id);
    }
    query += " ORDER BY id";
    dbHandler.mysqlQueryPromise(apiReference, "getDefaultOfferings", query, values).then((result) => {
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}


function initializeOfferings(apiReference, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      var validOfferings = [];
      var offeringIdToOfferingName = {};
      var offeringNameToOfferingId = {};
      var offerings = yield getDefaultOfferings(apiReference, {fields :"id,name"});
      for(var i = 0; i < offerings.length; i++ ){
        validOfferings.push(offerings[i].id);
        offeringIdToOfferingName[offerings[i].id] = offerings[i].name;
        offeringNameToOfferingId[offerings[i].name] = offerings[i].id;
      }
      startupVariables.validOfferings = validOfferings;
      startupVariables.offeringIdToOfferingName = offeringIdToOfferingName;
      startupVariables.offeringNameToOfferingId = offeringNameToOfferingId;
      logging.log(apiReference, startupVariables);
    })().then((data) => {
      logging.log(apiReference, {EVENT: "initializeOfferings Success", DATA: data});
      resolve(data);
    }, (error) => {
      logging.logError(apiReference, {EVENT: "initializeOfferings Error", ERROR: error});
      reject(error);
    });
  });
}