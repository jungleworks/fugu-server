/**
 * Created by ashishprasher on 17/01/18.
 */


var nodemailer                      = require("nodemailer");
var underscore                      = require('underscore');

var logging                         = require('./../routes/logging');

var smtpTransport                   = undefined;


exports.sendMail                    = sendMail;
exports.getDomainLoginMailHtml      = getDomainLoginMailHtml;
exports.sendPlainTextEmail          = sendPlainTextEmail;
exports.internalMailFooter          = internalMailFooter;


function sendPlainTextEmail(to, cc, bcc, subject, message, from, apiReference, callback) {
  logging.log(apiReference, {EVENT: "sendPlainTextEmail", TO: to, FROM: from, SUBJECT: subject, MSG: message});
  var nodemailer = require("nodemailer");
  if (smtpTransport === undefined) {
    smtpTransport = nodemailer.createTransport({
      //service: config.get('emailCredentials.service'),
      host: config.get('emailCredentials.host'),
      port: config.get('emailCredentials.port'),
      auth: {
        user: config.get('emailCredentials.senderEmail'),
        pass: config.get('emailCredentials.senderPassword')
      }
    });
  }

  if (to) {
    to = removeInvalidIds(to);
  }
  if (cc) {
    cc = removeInvalidIds(cc);
  }
  if (bcc) {
    bcc = removeInvalidIds(bcc);
  }

  if (typeof (from) === undefined || from == null || from == "") {
    from = config.get('emailCredentials.From');
  }

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from   : from,
    to     : to,
    subject: subject,
    text   : message
  };

  if (cc) {
    mailOptions.cc = cc;
  }
  if (bcc) {
    mailOptions.bcc = bcc;
  }

  // send mail with defined transport object
  if (to.length > 0 || cc.length > 0 || bcc.length > 0) {
    smtpTransport.sendMail(mailOptions, function (error, response) {
      logging.consolelog("Sending Mail Error: " + JSON.stringify(error));
      logging.consolelog("Sending Mail Response: " + JSON.stringify(response));
      callback(1);
    });
  } else {
    callback(0);
  }
}

function sendMail(recipients, subject, htmlContent, from) {
  return new Promise((resolve, reject) => {
    if (smtpTransport === undefined) {
      smtpTransport = nodemailer.createTransport({
        host: config.get('emailCredentials.host'),
        port: config.get('emailCredentials.port'),
        auth: {
          user: config.get('emailCredentials.senderEmail'),
          pass: config.get('emailCredentials.senderPassword')
        }
      });
    }
    if (recipients.to) {
      recipients.to = removeInvalidIds(recipients.to);
    }
    if (recipients.cc) {
      recipients.cc = removeInvalidIds(recipients.cc);
    }
    if (recipients.bcc) {
      recipients.bcc = removeInvalidIds(recipients.bcc);
    }

    if (typeof (from) === undefined || from == null || from == "") {
      from = config.get('emailCredentials.From');
    }

    var mailOptions = {
      from   : from,
      to     : recipients.to,
      subject: subject,
      html   : htmlContent
    };

    if (recipients.cc) {
      mailOptions.cc = recipients.cc;
    }
    if (recipients.bcc) {
      mailOptions.bcc = recipients.bcc;
    }
    
    if (recipients.to.length > 0 || recipients.cc.length > 0 || recipients.bcc.length > 0) {
      smtpTransport.sendMail(mailOptions, function (error, response) {
        logging.logError("Sending Mail Error: " + JSON.stringify(error));
        logging.consolelog("Sending Mail Response: " + JSON.stringify(response));
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    } else {
      return reject('no recipient defined');
    }
  });
}

function removeInvalidIds(allIds) {
  // done to handle the case where array is passed after stringifying
  allIds = allIds.toString();
  allIds = allIds.split(',');

  var i          = 0;
  var isInvalid  = false;
  var regularExp = /@facebook.com/i;
  var index      = allIds.length;
  while (index--) {
    allIds[index] = allIds[index].trim();
    isInvalid     = regularExp.test(allIds[index]);
    if (isInvalid === true) {
      allIds.splice(index, 1);
    }
  }
  return allIds;
}

function getDomainLoginMailHtml(apiReference, opts) {
  var html = '<p style="text-decoration:none;"> Hi ' + opts.first_name + ',<b></p>';
  html += "<br><b>" + opts.text + "</b> ";
  html += "<br><b>url:</b> " + opts.url;

  return html;
}

function internalMailFooter(html, opts) {
  html += "<br><b> Lead Name: </b>" + opts.first_name + " " + opts.last_name;
  html += "<br><b> Lead Email: </b>" + opts.email;
  html += "<br><b> Lead Phone: </b>" + opts.phone;
  if(opts.continent_code){
    html += "<br><b> Country Code: </b>" + opts.continent_code.toUpperCase();
  }

  html +="<br><br><b>Best,</b>";
  html +="<br><b>Team Jungle</b>";
  return html;
}
