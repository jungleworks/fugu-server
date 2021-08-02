/**
 * Created by ashishprasher on 05/09/19.
 */

const _                                     = require('underscore');
const config                                = require('config');
const handlebars                            = require('handlebars');

const stripeService                         = require('./stripeService');
const textUtility                           = require('./../../../utilities/textUtility');
const dbHandler                             = require('./../../../routes/mysqlLib');
const constants                             = require('./../../../routes/constants');
const mailingService                        = require('./../../../services/mailingService');
const logging                               = require('./../../../routes/logging');
const dateService                           = require('./../../../services/dateService');
const utilityService                        = require('./../../../services/utilityService');

exports.getCreditCardInfo                   = getCreditCardInfo;
exports.createPaymentAuthorisationToken     = createPaymentAuthorisationToken;
exports.sendPaymentAuthorisationMail        = sendPaymentAuthorisationMail;
exports.sendJunglePaymentMail               = sendJunglePaymentMail;


async function getCreditCardInfo(apiReference, opts) {
  let cardInfo = {};
  let stripeCardInfo = await stripeService.getCreditCardInfo(apiReference, opts);
  if(stripeCardInfo.valid){
    cardInfo.payment_method = stripeCardInfo.data.id;
    cardInfo.customer_id    = stripeCardInfo.data.customer;
    cardInfo.brand          = stripeCardInfo.data.card.brand;
    cardInfo.funding        = stripeCardInfo.data.card.funding;
    cardInfo.last4_digits   = stripeCardInfo.data.card.last4;
    cardInfo.expiry_date    = stripeCardInfo.data.card.exp_month + "-" + stripeCardInfo.data.card.exp_year;
    cardInfo.is_active      = 1;
    cardInfo.user_id        = opts.user_id;
    cardInfo.source         = opts.source;
  }

  return cardInfo;
}

async function createPaymentAuthorisationToken(apiReference, opts) {
   opts.payment_token = textUtility.generateAccessToken(opts.payment_intent_id, opts.user_id);
   await insertPaymentAuthorisationToken(apiReference, opts);
   return opts.payment_token;
}

async function sendPaymentAuthorisationMail(apiReference, opts) {
  logging.log(apiReference, {EVENT : "sendPaymentAuthorisationMail", opts});
  let paymentToken = await createPaymentAuthorisationToken(apiReference, opts);

  if(!opts.is_on_session){
    let templateData = {
      link         : config.get("payUrl") + "#/stripe/pay?token=" + paymentToken,
      amount       : opts.currency_symbol + opts.amount.toFixed(2),
      offering_name: startupVariables.offeringIdToOfferingName[opts.offering],
      date         : dateService.getFormattedDate(new Date(), dateService.formats.mysqlFormatDate),
      last4_digits : opts.last4_digits,
      card_brand   : opts.card_brand
      };
    let subject = handlebars.compile("Payment authorization request for {{{offering_name}}}")(templateData);
    let html    = handlebars.compile(module.exports.SCA_MAIL_TEMPLATE)(templateData);
    mailingService.sendMail({to : opts.email}, subject, html, constants.OFFERING_WEBHOOK_CONFIG[opts.offering].mail_from);
  }
}

async function sendJunglePaymentMail(apiReference, opts) {
    logging.log(apiReference, {EVENT : "sendPaymentAuthorisationMail", opts});

    if(!opts.is_on_session){
        let templateData = {
            link         : opts.jwp_short_url,
            offering_name: startupVariables.offeringIdToOfferingName[opts.offering],
            date         : dateService.getFormattedDate(new Date(), dateService.formats.mysqlFormatDate),
            description  : opts.description,
            optional_content: opts.optional_content
        };
        let subject = handlebars.compile("Payment invoice of {{{offering_name}}} for {{{optional_content}}}")(templateData);
        let html    = handlebars.compile(module.exports.JUNGLE_MAIL_TEMPLATE)(templateData);
        mailingService.sendMail({to : opts.email}, subject, html, constants.OFFERING_WEBHOOK_CONFIG[opts.offering].mail_from);
    }
}

async function insertPaymentAuthorisationToken(apiReference, opts) {
  let insertObj = {
    offering         : opts.offering,
    user_id          : opts.user_id,
    payment_intent_id: opts.payment_intent_id,
    payment_token    : opts.payment_token,
    client_secret    : opts.client_secret,
    amount           : opts.amount,
    currency_symbol  : opts.currency_symbol,
    status           : constants.PAYMENT_INTENT_STATUS.UNPAID,
    is_on_session    : opts.is_on_session || 0
  };
  await dbHandler.mysqlQueryPromise(apiReference, "insertPaymentAuthorisationToken", "INSERT INTO tb_stripe_payment_intents SET ? ", insertObj);
}

exports.SCA_MAIL_TEMPLATE = `
<html>
    <body>
        <div style="background-color:lightgrey;height:100%;display:flex">
            <div style="box-shadow: 5px 10px 30px 0 rgba(243, 244, 252, 0.12);
              margin: auto;
              padding: 30px;
              min-width: 300px;
              max-width: 600px;
              border-radius: 8px;
              background-color: white;
              margin-top:40px;
              margin-bottom:40px;
              ">
             <img src="https://fuguchat.s3.ap-south-1.amazonaws.com/image/Vf95SR98tD_1568196393225.png" style="
    max-height: 30px;">
            <p style="text-align:left;padding-left:10px;padding-right:10px;padding-top:40px;font-size:20px;color: #2594fa;"><b style="font-size:25px">Confirm your {{{amount}}} payment</b></p>
            <p style="text-align:left;padding-left:10px;padding-right:10px;font-size:20px;color: #294661;">Please confirm your payment to {{{offering_name}}} using <b style="color:blue">Verified by {{{card_brand}}}.</b> Your bank requires this security measure for your card ending in {{{last4_digits}}}</p>
            <a style="text-align:left;font-size:16px;margin-left:10px;text-decoration:none; margin-right:10px;background-color:#007bff;text:white;padding-left:10px;padding-right:10px;padding-bottom:10px;padding-top:10px;color:white;border-radius:2px;border:none" type="button" href="{{{link}}}" target="_blank">Confirm Payment</a>
            
            <hr style="margin-left:10px;margin-right:10px;margin-bottom:50px;border-color: #eee;margin-top: 40px;">
                <div style="background-color:#f3f4fc;margin-left:10px;margin-right:10px">
                <p style="padding-left:10px;padding-top:10px;color: #294661;">{{{date}}}</p>
                <hr style="margin-left:10px;margin-right:10px">
                <p style="padding-left:10px;padding-bottom:10px;color: #294661;">Amount Due<span style="float:right;padding-right:10px">{{{amount}}}</span></p>
                </div>
        </div>
      </div>
   </body>
</html>`;

exports.JUNGLE_MAIL_TEMPLATE = `
<html>
    <body>
        <div style="background-color:lightgrey;height:100%;display:flex">
            <div style="box-shadow: 5px 10px 30px 0 rgba(243, 244, 252, 0.12);
              margin: auto;
              padding: 30px;
              min-width: 300px;
              max-width: 600px;
              border-radius: 8px;
              background-color: white;
              margin-top:40px;
              margin-bottom:40px;
              ">
             <img src="https://fuguchat.s3.ap-south-1.amazonaws.com/image/Vf95SR98tD_1568196393225.png" style="
    max-height: 30px;">
            <p style="text-align:left;padding-left:10px;padding-right:10px;padding-top:40px;font-size:20px;color: #2594fa;"><b style="font-size:25px">Make your payment</b></p>
            <p style="text-align:left;padding-left:10px;padding-right:10px;font-size:20px;color: #294661;">Please make your due payment for {{{offering_name}}} {{{optional_content}}}  by clicking on the pay button.</p>
            <a style="text-align:left;font-size:16px;margin-left:10px;text-decoration:none; margin-right:10px;background-color:#007bff;text:white;padding-left:10px;padding-right:10px;padding-bottom:10px;padding-top:10px;color:white;border-radius:2px;border:none" type="button" href="{{{link}}}" target="_blank">Pay</a>
               
        </div>
      </div>
   </body>
</html>
`