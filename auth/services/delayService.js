/**
 * Created by ashishprasher on 25/02/19.
 */

var logging                     = require('./../routes/logging');

exports.set                   = set;



function set(apiReference, timeInMs) {
  return new Promise(function(resolve) {
    if (timeInMs <= 0) {
      resolve();
    } else {
      logging.log(apiReference, {EVENT: "DELAY", TIME : timeInMs});
      setTimeout(resolve.bind(null), timeInMs);
    }
  });
}