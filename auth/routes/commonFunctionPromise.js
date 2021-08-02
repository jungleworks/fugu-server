
var Promise                              = require('bluebird');
var md5                                  = require('MD5');

var dbHandler                            = require('./mysqlLib').dbHandler;
var logging                              = require('./logging');


exports.getUserWithEmail                         = getUserWithEmail;
exports.getUserCreditCardDetail                  = getUserCreditCardDetail;
exports.insertUserCreditCard                     = insertUserCreditCard;
exports.updateUserCreditCard                     = updateUserCreditCard;
exports.getUserCard                              = getUserCard;

function getUserWithEmail(email, apiReference) {
  return new Promise((resolve, reject) => {
    var sql         = "SELECT usr.*,GROUP_CONCAT(offer.offering) AS all_offering FROM tb_users usr LEFT JOIN tb_user_offerings offer ON " +
      "usr.user_id = offer.user_id WHERE usr.email = ? GROUP BY usr.user_id";
    var queryObject = {
      query: sql,
      args : [email],
      event: "GET User With Detail Email"
    };
    dbHandler.executeQuery(queryObject, function (err, result) {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }, apiReference);
  });
}

function getUserCreditCardDetail(user_id, apiReference) {
  return new Promise((resolve, reject) => {
    var sql         = "SELECT * FROM tb_user_credit_card WHERE user_id = ? AND is_active = 1 LIMIT 1";
    var queryObject = {
      query: sql,
      args : [user_id],
      event: "getUserCreditCardDetail - user_id"
    };
    dbHandler.executeQuery(queryObject, function (err, result) {
      logging.log(apiReference, {EVENT: "SELECT getUserCreditCardDetail", ERROR: err, RESULT: result});
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }, apiReference);
  });
}

function insertUserCreditCard(data, apiReference) {
  return new Promise((resolve, reject) => {
    var sql         = "INSERT INTO tb_user_credit_card (user_id, card_token, last4_digits, brand, funding, expiry_date, " +
      " customer_id, source, is_active, payment_method) VALUES (?,?,?,?,?,?,?,?,?,?)";
    var sql_args    = [data.user_id, data.card_token, data.last4_digits, data.brand, data.funding, data.expiry_date,
      data.customer_id, data.source, data.is_active, data.payment_method];
    var queryObject = {
      query: sql,
      args : sql_args,
      event: "insertUserCreditCard - user_id"
    };
    dbHandler.executeQuery(queryObject, function (err, result) {
      logging.log(apiReference, {EVENT: "INSERT tb_user_credit_card", ERROR: err, RESULT: result});
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }, apiReference);
  });
}

function updateUserCreditCard(data, apiReference) {
  return new Promise((resolve, reject) => {
    var sql         = "UPDATE tb_user_credit_card SET `card_token` = ?, `last4_digits` = ?, `brand` = ?, `funding` = ?, `expiry_date` = ?, " +
      " customer_id = ?, source = ?, payment_method = ? WHERE user_id = ? LIMIT 1";
    var sql_args    = [data.card_token, data.last4_digits, data.brand, data.funding, data.expiry_date,
      data.customer_id, data.source, data.payment_method, data.user_id];
    var queryObject = {
      query: sql,
      args : sql_args,
      event: "updateUserCreditCard - user_id"
    };
    dbHandler.executeQuery(queryObject, function (err, result) {
      logging.log(apiReference, {EVENT: "UPDATE tb_user_credit_card", ERROR: err, RESULT: result});
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }, apiReference);
  });
}

function getUserCard(user_id) {
  return new Promise((resolve, reject) => {
    var sql = "SELECT last4_digits, brand, funding, expiry_date, source FROM tb_user_credit_card WHERE user_id = ? AND is_active = 1";
    connection.query(sql, [user_id], function (error, result) {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}