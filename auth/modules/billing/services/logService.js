/**
 * Created by sumeet on 29/03/19.
 */
var dbHandler                        = require('./../../../routes/mysqlLib');

exports.insertPaymentLog   = insertPaymentLog;

function insertPaymentLog(apiReference, opts) {
  return new Promise((resolve, reject) => {
    var values = [opts];
    var query = `INSERT into tb_payment_logs SET ?`;

    dbHandler.mysqlQueryPromise(apiReference, "insertPaymentLog" , query, values).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}