/**
 * Created by sumeet on 04/03/19.
 */

var bodyParser              = require('body-parser');
var logger                  = require('morgan');
var errorhandler            = require('errorhandler');
var path                    = require('path');

var utilityService          = require('./../services/utilityService');

var requestLogger           = require('./../libs/request_log');

startupVariables            = require('./../routes/startupVariables');

require('./parser'); //used for stripe webhook, data is required in raw format

app.set('port', process.env.PORT || config.get('PORT_HTTP'));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    return res.sendStatus(400);
  }
  next();
});

app.use(logger('dev'));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,access_token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(requestLogger.create());

if ('development' == app.get('env')) {
  app.use(errorhandler());
}

console.log("App Environment Running at: ", app.get('env'));