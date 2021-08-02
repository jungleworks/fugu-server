const Promise                                     = require('bluebird');
const _                                           = require('underscore');
const NodeRSA                                     = require('node-rsa');


const logging                                     = require('./../../../routes/logging');
const constants                                   = require('./../../../routes/constants');
const responses                                   = require('./../../../routes/responses');

const httpService                                 = require('./../../../services/httpService');

exports.getApplePublicKey                    = getApplePublicKey;

function getApplePublicKey(apiReference,kid) {
  return new Promise(async (resolve, reject) => {
    try {
      let endpoint     = `https://appleid.apple.com/auth/keys`;
      let options= {
        url   : endpoint,
        method  : 'GET',
        json    : true,
        timeout : 10000,
      }
      let data = await httpService.sendHttpRequest(apiReference, options);
      const key = data.keys.find((k) => k.kid === kid);
      const pubKey = new NodeRSA();
      pubKey.importKey({n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64')}, 'components-public');
      logging.log(apiReference, {EVENT: "Validate Facebook Token", RESPONSE: pubKey.exportKey(['public'])});
      return resolve(pubKey.exportKey(['public']));
    } catch (error) {
      logging.logError(apiReference, {EVENT: "Error in validating facebook Token", ERROR: error});
      reject(error);
    }
  })
}
