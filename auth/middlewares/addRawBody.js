/**
 * Created by ashishprasher on 06/09/19.
 */

const rawBodyRequiredApiUrls = ['/stripe/webhook','/razorpay/webhook'];

module.exports = function addRawBody() {
  return function(req, res, next) {
    if(!rawBodyRequiredApiUrls.includes(req.url)){
      return next();
    }
    req.setEncoding('utf8');

    let data = '';

    req.on('data', function(chunk) {
      data += chunk;
    });

    req.on('end', function() {
      req.rawBody = data;

      next();
    });
  };
};