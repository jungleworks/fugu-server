'use strict';

const Promise                         = require('bluebird');
const _                               = require('underscore');
const stripe                          = require('stripe')(config.get('stripeCredentials.StripeKey'));

const logging                         = require('./../../../routes/logging');
const commonFunPromise                = require('./../../../routes/commonFunctionPromise');
const responses                       = require('./../../../routes/responses');
const constants                       = require('./../../../routes/constants');

const textUtility                     = require('./../../../utilities/textUtility');
const userService                     = require('./../../../modules/authentication/services/userService');
const logService                      = require('./../services/logService');
const currencyService                 = require('./../services/currencyService');
const stripeService                   = require('./../services/stripeService');
const billingService                  = require('./../services/billingService');
const utilityService                  = require('./../../../services/utilityService');
const razorpayService                 = require('./../services/razorpayService');
const jungleworksPayService           = require('./../services/jungleworksService');

const endpointSecret                  = config.get("stripeCredentials.webhookSecret");


exports.makeUserPayment             = makeUserPayment;
exports.getUserCard                 = getUserCard;
exports.setupIntent                 = setupIntent;
exports.addUserCardV2               = addUserCardV2;

function makeUserPayment(req, res) {
  let apiReference   = req.apiReference;
  let user_id        = req.body.user_id;
  let access_token   = req.body.access_token;
  let billing_amount = req.body.billing_amount || req.body.amount;
  let description    = req.body.description || "Charge for " + startupVariables.offeringIdToOfferingName[req.body.offering] + " Billing Plan";
  let currency_id    = req.body.currency_id || 1;
  let payment_gateway= req.body.payment_gateway || 1;
  let opts           = {user_id, access_token, description, amount: billing_amount, currency_id : currency_id, payment_gateway, optional_content: req.body.optional_content || "Billing Plan"};
  deductPayment(apiReference, opts, req, res);
}

function getUserCard(req, res) {
  var apiReference = req.apiReference;

  var user_id = req.body.user_id;
  var access_token = req.body.access_token;
  var user_card;

  Promise.coroutine(function *() {
    var userInfo = yield userService.getUser(apiReference, {access_token: access_token, user_id: user_id});
    if (_.isEmpty(userInfo)) {
      return responses.authenticationErrorResponse(res);
    }

    userInfo = userInfo[0];
    logging.log(apiReference, {EVENT: "authenticateUserAccessTokenAndUserIdMust", userInfo: userInfo});
    user_card = yield commonFunPromise.getUserCard(user_id);

    logging.log(apiReference, {EVENT: "getUserCard", user_card: user_card});
    return responses.sendCustomResponse(res,
      constants.responseMessages.ACTION_COMPLETE,
      constants.responseFlags.SUCCESS_CODE,
      user_card,
      apiReference
    );
  })().catch((error) => {
    logging.logError(apiReference, {EVENT: "addUserCard ERROR", ERROR: error});
    return responses.sendCustomResponse(res, error,
      constants.responseFlags.SHOW_ERROR_MESSAGE,
      {},
      apiReference
    );
  })
}

async function deductPayment(apiReference, opts, req, res) {
  let data;
  let msg;
  let code;
  let currency_obj           = startupVariables.currencyIdToCurrencyObj[opts.currency_id];
  let is_on_session           = req.body.is_on_session;
  let log                    = {};
  log.amount                 = opts.amount;
  log.transaction_id         = 0;
  log.user_id                = opts.user_id;
  log.offering               = req.body.offering;
  log.description            = opts.description;
  log.status                 = 0;
  log.currency_id            = opts.currency_id;
  log.dollar_amount          = opts.amount * currency_obj.conversion_factor;
  log.conversion_factor      = currency_obj.conversion_factor;
  log.payment_gateway        = opts.payment_gateway;

  let userInfo = await userService.getUser(apiReference, {access_token: opts.access_token, user_id: opts.user_id});
  if (_.isEmpty(userInfo)) {
    log.response  = 'User not found';
    logService.insertPaymentLog(apiReference, log);
    return responses.authenticationErrorResponse(res);
  }

  userInfo = userInfo[0];
  switch (opts.payment_gateway){
    case constants.PAYMENT_GATEWAYS.STRIPE:{
      if (opts.amount <= 0) {
        log.response  = 'Amount is less than equal to 0 : ' + opts.amount;
        logService.insertPaymentLog(apiReference, log);
        return responses.sendCustomResponse(res, constants.responseMessages.PAYMENT_COMPLETE, constants.responseFlags.SUCCESS_CODE, {
          transaction_id     : textUtility.generateRandomStringAndNumbers(),
          transaction_status : 1,
          billing_amount     : opts.amount,
          email              : userInfo.email
        }, apiReference);
      }

      let creditCardInfo = await commonFunPromise.getUserCreditCardDetail(opts.user_id, apiReference);
      logging.log(apiReference, {EVENT: "getUserCreditCardDetail", credit_card_detail: creditCardInfo});
      let jungleLinkSent = false;
      if (!creditCardInfo.length) {
          if (req.body.offering == 2){
              if (opts.currency_id == 2) {
                  let razorpayOpts = {
                      name         : userInfo.first_name,
                      email        : userInfo.email,
                      phone        : userInfo.phone,
                      user_id      : userInfo.user_id,
                      amount       : opts.amount,
                      description  : opts.description,
                      offering     : req.body.offering,
                      currency_id  : opts.currency_id,
                      is_on_session: is_on_session
                  };
                  let razorpayResponse = await razorpayService.sendPaymentLink(apiReference, razorpayOpts);
                  jungleLinkSent = true;
                  msg                  = razorpayResponse.msg;
                  code                 = razorpayResponse.code;
                  data                 = razorpayResponse.data;
              } else {
                  let jungleworksPayOpts = {
                      name: userInfo.first_name,
                      email: userInfo.email,
                      phone: userInfo.phone,
                      user_id: userInfo.user_id,
                      amount: log.dollar_amount,
                      description: opts.description,
                      offering: req.body.offering,
                      currency_id: opts.currency_id,
                      is_on_session: is_on_session
                  };
                  let jungleworkspayResponse = await jungleworksPayService.sendPaymentLink(apiReference, jungleworksPayOpts);
                  msg = jungleworkspayResponse.msg;
                  code = jungleworkspayResponse.code;
                  data = jungleworkspayResponse.data;
                  let sendMailOpts = {
                      email: userInfo.email,
                      first_name: userInfo.first_name,
                      company_name: userInfo.company_name,
                      offering: req.body.offering,
                      user_id: userInfo.user_id,
                      currency_symbol: currency_obj.symbol,
                      is_on_session: is_on_session,
                      jwp_short_url: jungleworkspayResponse.data.jwp_short_url,
                      description: opts.description,
                      optional_content: opts.optional_content
                  };
                  jungleLinkSent = true;
                  billingService.sendJunglePaymentMail(apiReference, sendMailOpts);
              }
          } else {
              log.response  = constants.responseMessages.CARD_NOT_EXIST;
              logService.insertPaymentLog(apiReference, log);
              return responses.sendCustomResponse(res, constants.responseMessages.CARD_NOT_EXIST, constants.responseFlags.USER_CARD_NOT_EXIST,
                {}, apiReference);
          }
      }

      if (!jungleLinkSent) {
          creditCardInfo = creditCardInfo[0];

          let deductPaymentOpts = {
              cardObj: creditCardInfo,
              amount: opts.amount,
              description: opts.description,
              metadata: {user_id: opts.user_id, description: opts.description},
              currencyObj: currency_obj
          };
          let deductionResponse = await stripeService.deductPayment(apiReference, deductPaymentOpts);
          logging.log(apiReference, {EVENT: "deductPayment", deductionResponse: deductionResponse});

          data = {
              transaction_id: deductionResponse.charge_id,
              billing_amount: opts.amount,
              email: userInfo.email,
              payment_intent_id: deductionResponse.payment_intent_id
          };

          log.transaction_id = deductionResponse.charge_id;
          data.transaction_status = 1;
          log.status = 1;
          msg = constants.responseMessages.PAYMENT_COMPLETE;
          code = constants.responseFlags.SUCCESS_CODE;
          if (!deductionResponse.success) {
              data.transaction_status = 0;
              log.status = 0;
              log.transaction_id = 0;
              msg = deductionResponse.message || constants.responseMessages.PAYMENT_FAILED;
              code = constants.responseFlags.SHOW_ERROR_MESSAGE;

              if (deductionResponse.authentication_required) {
                  data.transaction_status = 402;
                  data.payment_method = deductionResponse.payment_method;
                  data.client_secret = deductionResponse.client_secret;
                  let sendMailOpts = {
                      email: userInfo.email,
                      first_name: userInfo.first_name,
                      company_name: userInfo.company_name,
                      offering: req.body.offering,
                      user_id: userInfo.user_id,
                      payment_intent_id: deductionResponse.payment_intent_id,
                      client_secret: deductionResponse.client_secret,
                      amount: opts.amount,
                      currency_symbol: currency_obj.symbol,
                      is_on_session: is_on_session,
                      card_brand: creditCardInfo.brand,
                      last4_digits: creditCardInfo.last4_digits,
                  };

                  billingService.sendPaymentAuthorisationMail(apiReference, sendMailOpts);
              }
              else if (req.body.offering == 2) {
                  if (opts.currency_id == 2) {
                      let razorpayOpts = {
                          name         : userInfo.first_name,
                          email        : userInfo.email,
                          phone        : userInfo.phone,
                          user_id      : userInfo.user_id,
                          amount       : opts.amount,
                          description  : opts.description,
                          offering     : req.body.offering,
                          currency_id  : opts.currency_id,
                          is_on_session: is_on_session
                      };
                      let razorpayResponse = await razorpayService.sendPaymentLink(apiReference, razorpayOpts);
                      msg                  = razorpayResponse.msg;
                      code                 = razorpayResponse.code;
                      data                 = razorpayResponse.data;
                  } else {
                      let jungleworksPayOpts = {
                          name: userInfo.first_name,
                          email: userInfo.email,
                          phone: userInfo.phone,
                          user_id: userInfo.user_id,
                          amount: log.dollar_amount,
                          description: opts.description,
                          offering: req.body.offering,
                          currency_id: opts.currency_id,
                          is_on_session: is_on_session
                      };
                      let jungleworkspayResponse = await jungleworksPayService.sendPaymentLink(apiReference, jungleworksPayOpts);
                      msg = jungleworkspayResponse.msg;
                      code = jungleworkspayResponse.code;
                      data = jungleworkspayResponse.data;
                      let sendMailOpts = {
                          email: userInfo.email,
                          first_name: userInfo.first_name,
                          company_name: userInfo.company_name,
                          offering: req.body.offering,
                          user_id: userInfo.user_id,
                          currency_symbol: currency_obj.symbol,
                          is_on_session: is_on_session,
                          jwp_short_url: jungleworkspayResponse.data.jwp_short_url,
                          description: opts.description,
                          optional_content: opts.optional_content
                      };
                      billingService.sendJunglePaymentMail(apiReference, sendMailOpts);
                  }
              }

          }
      }
      break;
    }

    case constants.PAYMENT_GATEWAYS.RAZORPAY:{
      let razorpayOpts = {
        name         : userInfo.first_name,
        email        : userInfo.email,
        phone        : userInfo.phone,
        user_id      : userInfo.user_id,
        amount       : opts.amount,
        description  : opts.description,
        offering     : req.body.offering,
        currency_id  : opts.currency_id,
        is_on_session: is_on_session
      };
     let razorpayResponse = await razorpayService.sendPaymentLink(apiReference, razorpayOpts);
     msg                  = razorpayResponse.msg;
     code                 = razorpayResponse.code;
     data                 = razorpayResponse.data;
     break;
    }
    default: {
      if (req.body.offering == 2) {
        if (opts.currency_id == 2) {
            let razorpayOpts = {
                name         : userInfo.first_name,
                email        : userInfo.email,
                phone        : userInfo.phone,
                user_id      : userInfo.user_id,
                amount       : opts.amount,
                description  : opts.description,
                offering     : req.body.offering,
                currency_id  : opts.currency_id,
                is_on_session: is_on_session
            };
            let razorpayResponse = await razorpayService.sendPaymentLink(apiReference, razorpayOpts);
            msg                  = razorpayResponse.msg;
            code                 = razorpayResponse.code;
            data                 = razorpayResponse.data;
        } else {
            let jungleworksPayOpts = {
                name: userInfo.first_name,
                email: userInfo.email,
                phone: userInfo.phone,
                user_id: userInfo.user_id,
                amount: log.dollar_amount,
                description: opts.description,
                offering: req.body.offering,
                currency_id: opts.currency_id,
                is_on_session: is_on_session
            };
            let jungleworkspayResponse = await jungleworksPayService.sendPaymentLink(apiReference, jungleworksPayOpts);
            msg = jungleworkspayResponse.msg;
            code = jungleworkspayResponse.code;
            data = jungleworkspayResponse.data;
            let sendMailOpts = {
                email: userInfo.email,
                first_name: userInfo.first_name,
                company_name: userInfo.company_name,
                offering: req.body.offering,
                user_id: userInfo.user_id,
                currency_symbol: currency_obj.symbol,
                is_on_session: is_on_session,
                jwp_short_url: jungleworkspayResponse.data.jwp_short_url,
                description: opts.description,
                optional_content: opts.optional_content
            };
            billingService.sendJunglePaymentMail(apiReference, sendMailOpts);
        }
      }
    }
  }

  log.response              = msg;
  logService.insertPaymentLog(apiReference, log);
  return responses.sendCustomResponse(res, msg, code, data, apiReference);
}

async function setupIntent(req, res) {
  let apiReference = req.apiReference;
  try {
    let intentResponse = await stripeService.setupIntent(apiReference, {});
    if(!intentResponse.valid){
      throw Error("intent not found");
    }
    return responses.sendCustomResponse(res, constants.responseMessages.ACTION_COMPLETE, constants.responseFlags.SUCCESS_CODE,
      intentResponse.data, apiReference);
  }
  catch(e){
    logging.logError(apiReference, {EVENT: "setupIntent ERROR", ERROR: e});
    return responses.sendCustomResponse(res, e, constants.responseFlags.SHOW_ERROR_MESSAGE, {}, apiReference);
  }
}

async function addUserCardV2(req, res) {
  let apiReference = req.apiReference;

  let userId          = req.body.user_id;
  let accessToken     = req.body.access_token;
  let paymentMethod   = req.body.payment_method;
  let source          = req.body.source || 0;

  let metadata        = {user_id : userId, source};
  let responseMsg     = "";
  let newCardAdded    = 0;

  try {
    let userInfo = await userService.getUser(apiReference, {access_token: accessToken, user_id: userId});
    if (_.isEmpty(userInfo)) {
      return responses.authenticationErrorResponse(res);
    }

    userInfo = userInfo[0];
    let creditCardInfo = await commonFunPromise.getUserCreditCardDetail(userId);

    if(_.isEmpty(creditCardInfo)){
      let createCustomerOpts = {
        payment_method: paymentMethod,
        email         : userInfo.email,
        metadata      : metadata,
        source        : source,
        user_id       : userId
      };
      let createCustomerResponse = await stripeService.createStripeCustomer(apiReference, createCustomerOpts);
      let cardObj                = await billingService.getCreditCardInfo(apiReference, createCustomerOpts);
      await commonFunPromise.insertUserCreditCard(cardObj, apiReference);
      responseMsg = constants.responseMessages.CARD_ADDED_SUCCESSFULLY;
      newCardAdded = 1;
    } else {
      creditCardInfo = creditCardInfo[0];
      let attachPaymentOpts = {
        payment_method: paymentMethod,
        customer_id   : creditCardInfo.customer_id,
        source        : source,
        user_id       : userId
      };
      let stripeResponse = await stripeService.attachStripeCustomerWithPaymentMethod(apiReference, attachPaymentOpts);
      let cardObj        = await billingService.getCreditCardInfo(apiReference, attachPaymentOpts);
      await commonFunPromise.updateUserCreditCard(cardObj, apiReference);
      responseMsg = constants.responseMessages.CARD_UPDATED_SUCCESSFULLY;
    }

    return responses.sendCustomResponse(res, responseMsg, constants.responseFlags.SUCCESS_CODE,
      {"email": userInfo.email, "newCardAdded" : newCardAdded}, apiReference);


  } catch(e){
    logging.logError(apiReference, {EVENT : "addUserCardV2", e : e});
    return responses.sendCustomResponse(res, e, constants.responseFlags.SHOW_ERROR_MESSAGE, {}, apiReference);
  }
}