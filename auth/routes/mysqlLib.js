
var mysql                               = require('mysql');
var Promise                             = require('bluebird');

var logging                             = require('./logging');

exports.mysqlQueryPromise               = mysqlQueryPromise;
exports.mysqlQueryPromiseSlave          = mysqlQueryPromiseSlave;

var db_config = {
  host              : config.get('databaseSettings.host'),
  user              : config.get('databaseSettings.user'),
  password          : config.get('databaseSettings.password'),
  database          : config.get('databaseSettings.database'),
  multipleStatements: true
};

var slave_db_config = {
  host              : config.get('slaveDatabaseSettings.host'),
  user              : config.get('slaveDatabaseSettings.user'),
  password          : config.get('slaveDatabaseSettings.password'),
  database          : config.get('slaveDatabaseSettings.database'),
  multipleStatements: true
};

function initializeConnectionPool(db_config) {
  var numConnectionsInPool = 0;
  console.log('CALLING INITIALIZE POOL');
  var conn = mysql.createPool(db_config);
  conn.on('connection', function (connection) {
    numConnectionsInPool++;
    console.log('NUMBER OF CONNECTION IN POOL : ', numConnectionsInPool);
  });
  return conn;
}

var dbClient = {
  executeQuery     : function (queryObject, callback, apiReference) {
    var sql = connection.query(queryObject.query, queryObject.args, function (err, result) {
      var event = queryObject.event || "Executing mysql query";
      logging.log(apiReference, {EVENT: event, ERROR: err, RESULT: result, QUERY: sql.sql});
      if (err) {
        if (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_QUERY_INTERRUPTED') {
          setTimeout(module.exports.dbHandler.executeQuery.bind(null, queryObject.query, queryObject.args, callback, apiReference), 50);
        } else {
          callback(err, result, sql);
        }
      } else {
        callback(err, result);
      }
    });
  },
  executeSlaveQuery: function (queryObject, callback, apiReference) {
    var sql = slaveConnection.query(queryObject.query, queryObject.args, function (err, result) {
      var event = queryObject.event || "Executing mysql query";
      logging.log(apiReference, {EVENT: event, ERROR: err, RESULT: result, QUERY: sql.sql});
      if (err) {
        if (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_QUERY_INTERRUPTED') {
          setTimeout(module.exports.dbHandler.executeSlaveQuery.bind(null, queryObject.query, queryObject.args, callback, apiReference), 50);
        } else {
          callback(err, result, sql);
        }
      } else {
        callback(err, result, sql);
      }
    });
  }
};

exports.dbHandler = (function (){
    return dbClient;
})();

function mysqlQueryPromise(apiReference, event, queryString, params) {
  return new Promise((resolve, reject) => {
    var query = connection.query(queryString, params, function (sqlError, sqlResult) {
      logging.log(apiReference, {
        EVENT     : "Executing query " + event, QUERY: query.sql, SQL_ERROR: sqlError,
        SQL_RESULT: sqlResult, SQL_RESULT_LENGTH: sqlResult && sqlResult.length
      });

      if (sqlError || !sqlResult) {
        if (sqlError) {
          logging.logError(apiReference, event, sqlError, sqlResult, query.sql);
          if (sqlError.code === 'ER_LOCK_DEADLOCK' || sqlError.code === 'ER_QUERY_INTERRUPTED') {
            setTimeout(mysqlQueryPromise.bind(null, apiReference, event, queryString, params), 50);
          } else {
            return reject({
              ERROR: sqlError,
              QUERY: query.sql,
              Event: event
            });
          }
        }
      }
      return resolve(sqlResult);
    });
  });
}

function mysqlQueryPromiseSlave(apiReference, event, queryString, params) {
  return new Promise((resolve, reject) => {
    var query = slaveConnection.query(queryString, params, function (sqlError, sqlResult) {
      logging.log(apiReference, {
        EVENT     : "Executing query " + event, QUERY: query.sql, SQL_ERROR: sqlError,
        SQL_RESULT: sqlResult, SQL_RESULT_LENGTH: sqlResult && sqlResult.length
      });

      if (sqlError || !sqlResult) {
        if (sqlError) {
          logging.logError(apiReference, event, sqlError, sqlResult, query.sql);
          if (sqlError.code === 'ER_LOCK_DEADLOCK' || sqlError.code === 'ER_QUERY_INTERRUPTED') {
            setTimeout(mysqlQueryPromiseSlave.bind(null, apiReference, event, queryString, params), 50);
          } else {
            return reject({
              ERROR: sqlError,
              QUERY: query.sql,
              Event: event
            });
          }
        }
      }
      return resolve(sqlResult);
    });
  });
}

connection = initializeConnectionPool(db_config);
slaveConnection = initializeConnectionPool(slave_db_config);
