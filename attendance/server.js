'use_strict';

// starting configuration
let allowedConfigs = new Set(['production', 'beta', 'test']);
if(!allowedConfigs.has(process.env.NODE_ENV)){
  console.log("please specify valid NODE_ENV to run server");
  return;
}

process.env.NODE_CONFIG_DIR = __dirname + '/configuration/';
config = require('config');

if(config.get('newRelicEnabled')){
  require('newrelic');
}
process.configuration = config;
global.AWSSettings = jsonToObject(process.env.AWSSettings || config.get('AWSSettings'));

/** @namespace */
/** @namespace process*/
/** @namespace process.env.NODE_ENV*/
/** @namespace console*/

//Importing and declaring Libraries
const express                                = require('express');
const http                                   = require('http');
const bodyParser                             = require('body-parser');
const path                                   = require('path');
const morgan                                 = require('morgan');
const requireg                               = require('requireg');
const db                                     = require('./database');
const logger                                 = require('./Routes/logging');
const apihandler                             = require('./router');
const cachebuilder                           = require('./cachebuilder');
const customRequestLogger                    = require('./libs/request_logger.js');
const UniversalFunc                          = require('./Utils/universalFunctions');
const commonFunctions                        = require('./Utils/commonFunctions');
let app                                      = express();


apnsConnection                 = {};
global.base_dir                = __dirname;


let logHandler = {
    apiModule : "server",
    apiHandler : "logger"
}
//add uuid to each request
app.use(function(req, res, next) {
  req.uuid = UniversalFunc.generateRandomString(10);
  next();
});

//Api details listing
app.use(morgan(function (tokens, req, res) {
  return [
    '[', commonFunctions.getLoggingTime(),'-',req.uuid,']',
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms','-',
    tokens.res(req, res, 'content-length')
  ].join(' ')
}));



// middlewares
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(customRequestLogger.create());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, app_version, device_type, access_token");
  res.header ('Access-Control-Allow-Methods', 'PATCH');
  next();
});



// all api's
app.use('/api',     apihandler);



//Added docs to test
app.get('/docs', function (req, res) {
  let allowedConfigs = new Set(['dev','development','test']);
  if (!allowedConfigs.has(process.env.NODE_ENV)) {
    return res.send('Chalo Jugnoo Se!');
  }
  const aglio = requireg('aglio');
  let options = {
    themeVariables: 'default'
  };
  aglio.renderFile(__dirname + '/docs.apib', __dirname + '/docs.html', options, function (err, warnings) {
    if (err) {
      return res.send("Error : " + JSON.stringify(err));
    }
    if (warnings && warnings.length) {
      return res.send("Warning : " + JSON.stringify(warnings));
    }
    res.sendFile(path.join(__dirname + '/docs.html'));
  });

});


// server and db up and running
app.get('/ping', function (req, res) {
  res.send(200, {}, { pong: true });
});
app.get('/heartbeat',  function(req, res, next) {
  db.connection.query('SELECT 1 from DUAL WHERE 1 =1 ', function(err, result){
      if(err) {
        return res.status(500).send('Internal server Error!');
      }
      res.send('Chalo Jugnoo Se!');
    });
});

app.set('port', process.env.PORT || config.get('PORT'));

const httpsServer = http.createServer(app);
httpsServer.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
  cachebuilder.buildcache(function () {
    logger.info(logHandler, "Cache initilization done");
  });
});

process.on("message", function(message){
  console.log("Received signal : " + message);
  if (message === 'shutdown') {
    console.log("Shutting down server");
    httpsServer.close();
    setTimeout(function(){
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

//custom handlers
process.on("uncaughtException", function(err) {
  console.error(commonFunctions.getCurrentTime() + " uncaughtException: " + err.message);
  console.error(err.stack);
});

if (!('toJSON' in Error.prototype))
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      let error = "{}";
      if(this.stack){
        let errStack = this.stack.split('\n');
        error = errStack[0] + errStack[1];
      }
      else if (this.message){
        error = this.message;
      }
      return error;
    },
    configurable: true,
    writable: true
  });

Set.prototype.isSuperset = function(subset) {
  for (const elem of subset) {
    if (!this.has(elem)) {
      return false;
    }
  }
  return true;
};

Set.prototype.union = function(setB) {
  const union = new Set(this);
  for (const elem of setB) {
    union.add(elem);
  }
  return union;
};

Set.prototype.intersection = function(setB) {
  const intersection = new Set();
  for (const elem of setB) {
    if (this.has(elem)) {
      intersection.add(elem);
    }
  }
  return intersection;
};

Set.prototype.difference = function(setB) {
  const difference = new Set(this);
  for (const elem of setB) {
    difference.delete(elem);
  }
  return difference;
};
