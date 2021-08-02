'use_strict';

// starting configuration
let allowedConfigs = new Set(['production', 'beta', 'test']);
if (!allowedConfigs.has(process.env.NODE_ENV)) {
  console.log("please specify valid NODE_ENV to run server");
}

process.env.NODE_CONFIG_DIR = __dirname + '/configuration/';
config = require('config');

if (config.get('newRelicEnabled')) {
  require('newrelic');
}
process.configuration = config;
global.AWSSettings = jsonToObject(process.env.AWSSettings || config.get('AWSSettings'));

/** @namespace */
/** @namespace process*/
/** @namespace process.env.NODE_ENV*/
/** @namespace console*/

//Importing and declaring Libraries
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');
const redis = require('socket.io-redis');
const apihandler = require('./router');
// const customRequestLogger = require('./libs/request_logger.js');
const UniversalFunc = require('./Utils/universalFunctions');
const commonFunctions = require('./Utils/commonFunctions');
let app = express();
const chathandler = require('./Routes/chathandler');
const routehandler = require('./Routes/routehandler');
const { expressPino } = require('./libs/pino_logger');
const redisUtility    = require('./Utils/redisUtility');
const moduleRoutes    = require('./modules/index');     //Do not remove

apnsConnection = {};
global.base_dir = __dirname;

//add uuid to each request
app.use(function (req, res, next) {
  req.uuid = UniversalFunc.generateRandomString(10);
  next();
});

// middlewares
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(customRequestLogger.create());
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, app_version, device_type, access_token,app_secret_key, auth_token,domain");
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS,PATCH');
  next();
});
//logger
app.use(expressPino);
app.use(redisUtility.apiCount);

// all api's
app.use('/api', apihandler);
app.use('/auth/webhook', routehandler.authorizePayment);

app.get('/ping_lb', function (req, res) {
  res.send(200)
})

app.get('/ping_socket', function (req, res) {
  res.send(200)
})

app.set('port', process.env.PORT || config.get('PORT'));

const httpsServer = http.createServer(app);

const io = require('socket.io')(httpsServer, {
  serveClient: true
});

httpsServer.listen(app.get('port'), function () {
  console.log(`
              _,     _   _     ,_
          .-'' /     \\'-'/     \\ ''-.
         /    |      |   |      |    \\
        ;      \\_  _/     \\_  _/      ;
       |         ''         ''         |
       |         Up And Running        |
        ;    .-.   .-.   .-.   .-.    ;
         \\  (   '.'   \\ /   '.'   )  /
          '-.;         V         ;.-'`);
  console.log('Express server listening on port ' + app.get('port'));
});

io.set('transports', ['websocket']);

io.adapter(redis({ host: config.get('redisServer'), port: 6379 }));


io.use((socket, next) => {
  if (socket.handshake.query.en_user_id) {
    let user_id = commonFunctions.decryptText(socket.handshake.query.en_user_id);
    if (user_id) {
      return next();
    }
  }
  return next(new Error('authentication error'));
});

io.on('connection', chathandler.handleSocket);
global.io = io;

process.on("message", function (message) {
  console.log("Received signal : " + message);
  if (message === 'shutdown') {
    console.log("Shutting down server");
    httpsServer.close();
    setTimeout(function () {
      process.exit(0);
    }, 15000);
  }
});

function jsonToObject(data) {
  try {
    if (typeof data == 'string') {
      return JSON.parse(data);
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error in jsonToObject conversion", { data : data });
    return data;
  }
}

// async function redisRemovePresenceKeys() {
//   const keys = await redisClient.keys(`${process.env.pm_id}#presence#*`);
//   for (const key of keys) {
//     redisClient.del(key);
//   }
// }
