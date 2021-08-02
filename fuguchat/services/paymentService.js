

const dbHandler         = require('../database').dbHandler;


exports.insertRazorpayPaymentDetails     = insertRazorpayPaymentDetails;
exports.insertRazorpayLogs               = insertRazorpayLogs;
exports.updateRazorpayTransactionDetails = updateRazorpayTransactionDetails;
exports.getRazorpayTransactionDetails    = getRazorpayTransactionDetails;


function insertRazorpayPaymentDetails(logHandler, opts){
    return new Promise((resolve, reject)=> {
        let sql = `INSERT INTO razorpay_transactions(user_id, workspace_id, user_count, order_id, url, amount, status, domain_id) VALUES
                   (?, ?, ?, ?, ?, ?, ?, ?)`;

       let queryObj = {
        query  : sql,
        args   : [opts.user_id, opts.workspace_id, opts.user_count, opts.order_id, opts.payment_url, opts.amount, opts.status, opts.domain_id],
        event  : "insertRazorpayDetails"
      }  
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
       return resolve(result);
      }, (error) => {
        return reject(error);
      });         
    })
}

function insertRazorpayLogs(logHandler, opts){
    return new Promise((resolve, reject)=>{
      let insertObj = {};
      opts.user_id             ? insertObj.user_id             = opts.user_id                  : 0;
      opts.workspace_id        ? insertObj.workspace_id        = opts.workspace_id             : 0;
      opts.user_count          ? insertObj.user_count          = opts.user_count               : 0;
      opts.totalPrice          ? insertObj.amount              = opts.totalPrice               : 0;
      opts.request             ? insertObj.request             = JSON.stringify(opts.request)  : 0;
      opts.response            ? insertObj.response            = JSON.stringify(opts.response) : 0;
      opts.event               ? insertObj.event               = opts.event                    : 0;

      let sql = `INSERT INTO razorpay_logs SET ?`;

       let queryObj = {
       query  : sql,
       args   : [insertObj],
       event  : "insertRazorpayLogs"
       }  
       dbHandler.executeQuery(logHandler, queryObj).then((result) => {
       return resolve(result);
       }, (error) => {
       return resolve(error);
       });         
    })
}


function updateRazorpayTransactionDetails(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let updateObj = {};
     opts.status    ? updateObj.status = opts.status : 0;
     opts.transaction_id  ? updateObj.transaction_id = opts.transaction_id : 0;
     let values = [updateObj];

     let sql = `UPDATE razorpay_transactions SET ? WHERE 1`;

     if(opts.order_id){
       sql += ` AND order_id = ?`;
       values.push(opts.order_id);
     }
     let queryObj = {
      query  : sql,
      args   : values,
      event  : "insertRazorpayLogs"
      }  
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      return resolve(result);
      }, (error) => {
      return resolve(error);
      });
   })
}


function getRazorpayTransactionDetails(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let values = [];
    let sql = `SELECT * FROM razorpay_transactions WHERE 1`;

    if(opts.order_id){
      sql += ` AND order_id = ?`;
      values.push(opts.order_id);
    }
    if(opts.status){
      sql += ` AND status = ?`;
      values.push(opts.status);
    }
    if(opts.amount){
      sql += ` AND amount = ?`;
      values.push(opts.amount);
    }
    if(opts.domain_id){
      sql += ` AND domain_id = ?`;
      values.push(opts.domain_id);
    }
    let queryObj = {
      query  : sql,
      args   : values,
      event  : "getRazorpayTransactionDetails"
      }
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      return resolve(result);
      }, (error) => {
      return reject(error);
      });
  })
}