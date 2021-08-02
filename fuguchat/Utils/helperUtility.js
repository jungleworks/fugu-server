
const request                       = require('request');

exports.sendFuguAlert               = sendFuguAlert;

function sendFuguAlert(logHandler, opts){
   try{
    let options = {
      method : "POST",
      url    : "https://api.fugu.chat/api/webhook?token=" + opts.token,
      body   : {
        data: {
          message: opts.message,
        }
      },
      headers: {
        'content-type': 'application/json',
      },
      json   : true
    };
    request(options, (error, response, body) => {
        return;
      });
  } catch(error){
      return;
  }
}  