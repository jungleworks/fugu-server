

const mysql     = require('mysql');
const Config    = require('./Config');
const util      = require('util');
const config    = require('config');
const { logger }   = require('./libs/pino_logger');
const helperUtility = require('./Utils/helperUtility');
const constants    = require('./Utils/constants');


let connection = mysql.createPool({
  connectionLimit : 150,
  host            : config.get('MYSQL.host'),
  user            : config.get('MYSQL.user'),
  password        : config.get('MYSQL.password'),
  database        : config.get('MYSQL.database'),
  charset         : "utf8mb4"
});

// connection.getConnection((err, connection) => {
//   if(err) {
//     console.error('error connecting: ' + err.stack);
//     return;
//   }

//   console.log("mysql connected " + JSON.stringify(util.inspect(connection.config, { showHidden : false, depth : 1 })));
// });


let slaveConnection = mysql.createPool({
  connectionLimit: 150,
  host: config.get('SLAVE_MYSQL.host'),
  user: config.get('SLAVE_MYSQL.user'),
  password: config.get('SLAVE_MYSQL.password'),
  database: config.get('SLAVE_MYSQL.database'),
  charset: "utf8mb4"
});

// slaveConnection.getConnection((err, connection) => {
//   if (err) {
//     console.error('error connecting: ' + err.stack);
//     return;
//   }

//   console.log("slave mysql connected " + JSON.stringify(util.inspect(connection.config, { showHidden: false, depth: 1 })));
// });


let dbHandler = {
  executeQuery : function (logHandler, queryObj) {
    return new Promise((resolve, reject) => {
      queryObj.query = queryObj.query.replace(/\s+/g, " ");
      let finalQuery = connection.query(queryObj.query, queryObj.args, (err, result) => {
        queryObj.sql = finalQuery.sql;
        queryObj.sql = queryObj.sql.replace(/[\n\t]/g, '');

        
        if(err && (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_QUERY_INTERRUPTED')) {
          setTimeout(() => {
            module.exports.dbHandler.executeQuery(logHandler, queryObj)
              .then(result => resolve(result), (error, result) => reject(error, result));
          }, 50);
        } else if(err) {
          return reject(err, result);
        } else {
          return resolve(result);
        }
      });
    });
  },

  executeTransaction: function (queries, values) {
    return new Promise((resolve, reject) => {
      if (queries.length !== values.length)
        reject(Error("Query and arguments length do not match"))
      connection.getConnection(function (err, connection) {
        if (err) reject(err)
        connection.beginTransaction(function (err) {
          if (err) {
            reject(err)
          }
          for (let i = 0; i < queries.length; i++) {
            // console.log( "Queries ==>", queries[i], "Values ==>", values[i])
            connection.query(queries[i].replace(/\s+/g, " ").replace(/[\n\t]/g, ''), values[i], function (err, result) {
              if (err) {
                connection.rollback(function () {
                  reject(err)
                });
              }
              if (i === queries.length - 1) {
                connection.commit(function (err) {
                  if (err) {
                    connection.rollback(function () {
                      reject(err)
                    });
                  }
                  resolve(result)
                });
              }
            });
          }
        });
      });
    });
  },

  query : function (logHandler, event, sql, values, cb) {
    const start = new Date();
    let queryObj = connection.query(sql, values, (err, result) => {
      let resultLog = (!logHandler.logResultLength) ? result : ((result) ? { RESULT_LENGTH : result.length } : { RESULT_LENGTH : 0 });
      logger.trace(logHandler, { query_duration : (new Date() - start) + " ms " });
      return cb(err, result);
    });
  },

  escape : function (values) {
    return connection.escape(values);
  }
};


let slaveDbHandler = {
  executeQuery: function (logHandler, queryObj) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      queryObj.query = queryObj.query.replace(/\s+/g, " ");
      let finalQuery = slaveConnection.query(queryObj.query, queryObj.args, (err, result) => {
        queryObj.sql = finalQuery.sql;
        queryObj.sql = queryObj.sql.replace(/[\n\t]/g, '');

        let event = queryObj.event || "Executing mysql query";
        let resultLog = (!logHandler.logResultLength) ? result : ((result) ? { RESULT_LENGTH: result.length } : { RESULT_LENGTH: 0 });
        logger.trace(logHandler, { query_duration: (new Date() - start) + " ms " });
        if (err && (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_QUERY_INTERRUPTED')) {
          setTimeout(() => {
            module.exports.dbHandler.executeQuery(logHandler, queryObj)
              .then(result => resolve(result), (error, result) => reject(error, result));
          }, 50);
        } else if (err) {
          return reject(err, result);
        } else {
          return resolve(result);
        }
      });
    });
  },

  query: function (logHandler, event, sql, values, cb) {
    const start = new Date();
    let queryObj = connection.query(sql, values, (err, result) => {
      let resultLog = (!logHandler.logResultLength) ? result : ((result) ? { RESULT_LENGTH: result.length } : { RESULT_LENGTH: 0 });
      logger.trace(logHandler, { query_duration: (new Date() - start) + " ms " });
      return cb(err, result);
    });
  },

  executeTransaction: function (queries, values, callback) {
  },

  escape: function (values) {
    return connection.escape(values);
  }
};

module.exports.connection  =  connection;
module.exports.slaveConnection = slaveConnection;
module.exports.dbHandler   =  dbHandler;
module.exports.slaveDbHandler = slaveDbHandler
