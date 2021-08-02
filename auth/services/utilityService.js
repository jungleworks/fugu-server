/**
 * Created by ashishprasher on 07/03/18.
 */

exports.isEnv                 = isEnv;
exports.getEnv                = getEnv;
exports.isEnvLiveOrBeta       = isEnvLiveOrBeta;
exports.isEnvLive             = isEnvLive;



function isEnv(env) {
  return process.env.NODE_ENV == env;
}

function isEnvLiveOrBeta() {
  return isEnv('production') || isEnv('beta');
}

function isEnvLive() {
  return isEnv('production');
}

function getEnv() {
  return process.env.NODE_ENV;
}