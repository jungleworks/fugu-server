var apns = require('apn');
const utils  = require('../Utils/commonFunctions');

exports.createConnection     = createConnection;

let options = {
  certData           : null,
  keyData            : null,
  passphrase         : 'click',
  ca                 : null,
  pfx                : null,
  pfxData            : null,
  gateway            : utils.isEnv("test") ? "gateway.sandbox.push.apple.com" : "api.push.apple.com",
  // port               : 443,
  rejectUnauthorized : true,
  enhanced           : true,
  cacheLength        : 100,
  autoAdjustCache    : true,
  connectionTimeout  : 0,
  ssl                : true,
  production         : utils.isEnv("test") ? true : true
};

function createConnection(apnsConnection, businessId, appType, path, passphrase) {
  // console.info("initiating APNS_CONNECTION business_id : " + businessId + ", appType : " + appType + ", path : " + path + ", passphrase :" + passphrase);
  let iosPem     =  path;
  let opts = utils.cloneObject(options);
  if(passphrase) {
    opts.passphrase = passphrase;
  }
  opts.cert = opts.key = iosPem;
  if(!utils.isDefined(apnsConnection[businessId])) {
    apnsConnection[businessId] = {};
  }
  let connection   = new apns.Provider(opts);
  /*
  connection.on('error', (err) => {
    console.error('[APNS_ERROR] APNS error !!', err);
    // createConnection();
  });
  connection.on('disconnected', (err) => {
    console.error('[APNS_ERROR] APNS disconnected !!', err);
    // createConnection();
  });
  connection.on('timeout', (err) => {
    console.error('[APNS_ERROR] APNS connection timeout !!', err);
    // createConnection();
  });
  */
  apnsConnection[businessId][appType]  = connection;
}
