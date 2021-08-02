/**
 * Created by ashishprasher on 25/09/19.
 */

const _                                       = require('underscore');

const logging                                 = require('./../../../routes/logging');
const httpService                             = require('./../../../services/httpService');
const utilityService                          = require('./../../../services/utilityService');
const dbHandler                               = require('./../../../routes/mysqlLib');
const constants                               = require('./../../../routes/constants');

const keyId                                   = config.get("razorpay.key_id");
const keySecret                               = config.get("razorpay.key_secret");
const baseUrl                                 = config.get("razorpay.apiBaseUrl");
const auth                                    = "Basic " + new Buffer(keyId + ":" + keySecret).toString("base64");

exports.sendPaymentLink                       = sendPaymentLink;


async function sendPaymentLink(apiReference, opts) {
  logging.log(apiReference, {EVENT : "sendPaymentLink", opts: opts});
  let body = {
    customer    : {
      name   : opts.first_name,
      email  : opts.email,
      contact: opts.phone
    },
    sms_notify  : 1,
    email_notify: 1,
    type        : "link",
    view_less   : 1,
    amount      : parseInt(opts.amount * 100),
    currency    : startupVariables.currencyIdToCurrencyObj[opts.currency_id].name,
    description : opts.description,
    notes       : {user_id: opts.user_id, description: opts.description}
  };
  if(opts.is_on_session){
    body.sms_notify   = 0;
    body.email_notify = 0;
  }
  let options = {
    uri     : baseUrl + "/v1/invoices/",
    method  : 'POST',
    body    : body,
    json    : true,
    timeout : 10000,
    rejectUnauthorized : false,
    headers : {
      'Content-Type' : 'application/json; charset=utf-8',
      "Authorization": auth,
    }
  };
  let response = {
    data : {},
    code : constants.responseFlags.SHOW_ERROR_MESSAGE,
    msg  : constants.responseMessages.SHOW_ERROR_MESSAGE
  };
  let logLinkOpts = {
    user_id        : opts.user_id,
    amount         : opts.amount,
    currency_id    : opts.currency_id,
    offering       : opts.offering,
    description    : opts.description,
    rzp_request    : body
  };
  let razorpayResponse = {};
  try {
    razorpayResponse = await httpService.sendHttpRequest(apiReference, options);
    logging.log(apiReference, {EVENT : "rzpPaymentLink", razorpayResponse});
    if(razorpayResponse.id) {
      logLinkOpts.rzp_invoice_id  = razorpayResponse.id;
      logLinkOpts.rzp_customer_id = razorpayResponse.customer_id;
      logLinkOpts.rzp_short_url   = razorpayResponse.short_url;
      logLinkOpts.rzp_order_id    = razorpayResponse.order_id;
      logLinkOpts.rzp_response    = razorpayResponse;

      response = {
        data : {
          rzp_invoice_id     : razorpayResponse.id,
          rzp_order_id       : razorpayResponse.order_id,
          rzp_short_url      : razorpayResponse.short_url,
          transaction_status : constants.responseFlags.RAZORPAY_PAYMENT_LINK_SENT
        },
        code : constants.responseFlags.RAZORPAY_PAYMENT_LINK_SENT,
        msg  : constants.responseMessages.RAZORPAY_PAYMENT_LINK_SENT
      }
    }
  } catch (e){
    logging.logError(apiReference, {EVENT : "rzpPaymentLink ERROR", ERROR : e});
    if(e && e.body && e.body.error && e.body.error.description){
      response.msg = e.body.error.description;
    }
    logLinkOpts.rzp_response    = e.body;
    console.error(e);
  }

  logRazorpayLink(apiReference, logLinkOpts);
  logging.log(apiReference, {EVENT : "sendPaymentLink", response: response});
  return response;
}


async function logRazorpayLink(apiReference, opts) {
  let insertObj  = {
    rzp_invoice_id : opts.rzp_invoice_id,
    rzp_customer_id: opts.rzp_customer_id,
    rzp_short_url  : opts.rzp_short_url,
    rzp_order_id   : opts.rzp_order_id,
    user_id        : opts.user_id,
    amount         : opts.amount,
    currency_id    : opts.currency_id,
    offering       : opts.offering,
    description    : opts.description,
    rzp_response   : JSON.stringify(opts.rzp_response),
    rzp_request    : JSON.stringify(opts.rzp_request)
  };

  await dbHandler.mysqlQueryPromise(apiReference, "logRazorpayLink", "INSERT INTO tb_razorpay_payment_links SET ? ", insertObj);
}