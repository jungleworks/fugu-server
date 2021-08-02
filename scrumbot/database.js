/**
 * Created by gagandeep on 31/01/19.
 */



const mysql     = require('mysql');
//const Config    = require('./Config');
const util      = require('util');
const config    = require('config');
const logging   = require('./Routes/logging');


let connection = mysql.createPool({
    connectionLimit : 150,
    host            : config.get('MYSQL.host'),
    user            : config.get('MYSQL.user'),
    password        : config.get('MYSQL.password'),
    database        : config.get('MYSQL.database'),
    charset         : "utf8mb4"
});

connection.getConnection((err, connection) => {
    if(err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log("mysql connected " + JSON.stringify(util.inspect(connection.config, { showHidden : false, depth : 1 })));
});

let dbHandler = {
    executeQuery : function (logHandler, queryObj) {
        return new Promise((resolve, reject) => {
            const start = new Date();
            queryObj.query = queryObj.query.replace(/\s+/g, " ");
            let finalQuery = connection.query(queryObj.query, queryObj.args, (err, result) => {
                queryObj.sql = finalQuery.sql;
                queryObj.sql = queryObj.sql.replace(/[\n\t]/g, '');

                let event = queryObj.event || "Executing mysql query";
                let resultLog = (!logHandler.logResultLength) ? result : ((result) ? { RESULT_LENGTH : result.length } : { RESULT_LENGTH : 0 });
                logging.logDatabaseQuery(logHandler, event, queryObj.sql, resultLog, err);
                logging.trace(logHandler, { query_duration : (new Date() - start) + " ms " });
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

    query : function (logHandler, event, sql, values, cb) {
        const start = new Date();
        let queryObj = connection.query(sql, values, (err, result) => {
            let resultLog = (!logHandler.logResultLength) ? result : ((result) ? { RESULT_LENGTH : result.length } : { RESULT_LENGTH : 0 });
            logging.logDatabaseQuery(logHandler, event, queryObj.sql, resultLog, err);
            logging.trace(logHandler, { query_duration : (new Date() - start) + " ms " });
            return cb(err, result);
        });
    },

    executeTransaction : function (queries, values, callback) {
    },

    escape : function (values) {
        return connection.escape(values);
    }
};

module.exports.connection  =  connection;
module.exports.dbHandler   =  dbHandler;

