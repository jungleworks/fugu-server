const nodeMailerModule        = require('nodemailer');
const smtpTransport           = require('nodemailer-smtp-transport');
const Handlebars              = require('handlebars');
const Config                  = require('../Config');

const emailTemplates          = require('../Config/emailTemplates');
const { logger }                  = require('../libs/pino_logger');
const constants               = require('../Utils/constants');
const pdfTemplates            = require('../Config/pdfTemplates');


const logHandler = {
  apiModule  : "server",
  apiHandler : "email"
};

exports.renderMessageFromTemplateAndVariables = renderMessageFromTemplateAndVariables;

let transporter;

exports.sendEmailToUser = function (emailType, emailVariables, emailId, emailSubject) {
  let mailOptions = {
    from    : "Fugu Chat <support@fuguchat.com>",
    to      : emailId,
    subject : emailSubject,
    html    : null
  };
  const emailCredentials = JSON.parse(emailVariables.email_credentials);
  if (emailVariables.email_credentials) {
    transporter = nodeMailerModule.createTransport(smtpTransport(emailCredentials));
    mailOptions.from = emailCredentials.senderEmail;
  } else {
    throw new Error("No SMTP Credentials Available!");
  }

  emailVariables.logo ? emailVariables.logo = replaceUrl(emailVariables.logo) : '';

  logger.trace(logHandler, emailType, emailVariables, emailId, emailSubject);
  switch (emailType) {
    case constants.emailType.USER_INVITATION:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.userInvitation, emailVariables);
      break;
    case constants.emailType.BUSINESS_SIGNUP:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.businessSignup, emailVariables);
      break;
    case constants.emailType.RESET_PASSWORD:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.resetPassword, emailVariables);
      break;
    case constants.emailType.SEND_DOMAINS_TO_EMAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.sendDomainsToEmail, emailVariables);
      break;
    case constants.emailType.FEEDBACK:
      mailOptions.html  = renderMessageFromTemplateAndVariables(emailTemplates.feedbackMail, emailVariables);
      break;
    case constants.emailType.GDPR_QUERY:
      mailOptions.html  = renderMessageFromTemplateAndVariables(emailTemplates.gdprQueryMail, emailVariables);
      break;
      case constants.emailType.SIGN_UP:
      mailOptions.html  = renderMessageFromTemplateAndVariables(emailTemplates.signUp, emailVariables);
      break;
    case constants.emailType.INVOICE:
    mailOptions.html  = renderMessageFromTemplateAndVariables(pdfTemplates.invoice, emailVariables);
      break;
    case constants.emailType.NEW_CONTACT_NUMBER:
      mailOptions.html  = renderMessageFromTemplateAndVariables(emailTemplates.newContactNumber, emailVariables);
        break;
    case constants.emailType.MESSAGE_MAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.messageEmail, emailVariables);
      break;
    case constants.emailType.LEAVE_MAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.leaveEmail, emailVariables);
      break;
    case constants.emailType.REQUEST_MAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.requestEmail, emailVariables);
      break;
    case constants.emailType.AGENT_INVITATION:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.agentInvitation, emailVariables);
      break;
    case constants.emailType.RESELLER_SIGNUP:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.resellerSignup, emailVariables);
      break;
    case constants.emailType.WELCOME_MAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.welcomeEmail, emailVariables);
      break;
    case constants.emailType.SIMPLE_TEXT_MAIL:
      mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.simpleTextMail, emailVariables);
      break;
    case constants.emailType.EMAIL_SIGNUP:
      mailOptions.html =  renderMessageFromTemplateAndVariables(emailTemplates.signupEmail, emailVariables);
      break;
    case constants.emailType.SCHEDULE_EMAIL:
      mailOptions.html =  renderMessageFromTemplateAndVariables(emailTemplates.scheduleMeetingEmail, emailVariables);
      break;
    default:
      logger.error(logHandler, "No case matched while sending mail with : " + emailType);
      return;
  }
  sendMailViaTransporter(mailOptions, (err, res) => {
    console.log(err, res);
  });
};


function renderMessageFromTemplateAndVariables(templateData, variablesData) {
  return Handlebars.compile(templateData)(variablesData);
}

function sendMailViaTransporter(mailOptions, cb) {
  transporter.sendMail(mailOptions, (error, info) => {
    if(error) { logger.error(logHandler, 'Mail Sent Callback Error:', error); }
    logger.debug(logHandler, 'Mail Sent ', info);
  });
  cb();
}

function replaceUrl(url) {
  return url.replace('fchat.s3.ap-south-1.amazonaws.com', 's3.fugu.chat');
}
