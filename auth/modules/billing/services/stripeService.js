/**
 * Created by ashishprasher on 05/09/19.
 */

const stripe                                  = require('stripe')(config.get('stripeCredentials.StripeKey'));
const _                                       = require('underscore');

const logging                                 = require('./../../../routes/logging');
const textUtility                             = require('./../../../utilities/textUtility');

exports.setupIntent                           = setupIntent;
exports.createStripeCustomer                  = createStripeCustomer;
exports.getCreditCardInfo                     = getCreditCardInfo;
exports.deductPayment                         = deductPayment;


async function setupIntent(apiReference, opts) {
  let response = { valid : false};
  try{
    response.data = await stripe.setupIntents.create({});
    response.valid = true;
    logging.log(apiReference, {EVENT : "setupIntent", in : opts, response: response});
  } catch(e){
    logging.logError(apiReference, {EVENT : "setupIntent error", in : opts, response: response});
  }
  return response;
}

async function getCreditCardInfo(apiReference, opts) {
  let response = { valid : false};
  try{
    response.data = await stripe.paymentMethods.retrieve(opts.payment_method);
    response.valid = true;
    logging.log(apiReference, {EVENT : "getCreditCardInfo", in : opts, response: response});
  } catch(e){
    logging.logError(apiReference, {EVENT : "getCreditCardInfo error", in : opts, response: response});
  }
  return response;
}

async function createStripeCustomer(apiReference, opts) {
  let response = { valid : false};
  try{
    response.data = await  stripe.customers.create({
      payment_method: opts.payment_method,
      email         : opts.email,
      description   : "Customer create for User Auth Server.",
      metadata      : opts.metadata || null
    });
    response.valid = true;
    logging.log(apiReference, {EVENT : "createStripeCustomer", in : opts, response: response});
  } catch(e){
    logging.logError(apiReference, {EVENT : "createStripeCustomer error", in : opts, response: response});
  }
  return response;
}


async function deductPayment(apiReference, opts) {
  let result = {};
  try {
    let amount_in_cents = opts.amount;
    if (!opts.currencyObj.is_zero_decimal_currency) {
      amount_in_cents = amount_in_cents * 100;
    }

    if (amount_in_cents < opts.currencyObj.minimum_amount) {
      result.success   = true;
      result.charge_id = textUtility.generateRandomStringAndNumbers();
      return result;
    }
    let response = await stripe.paymentIntents.create({
      amount              : Math.round(amount_in_cents),
      currency            : opts.currencyObj.name,
      customer            : opts.cardObj.customer_id,
      payment_method      : opts.cardObj.payment_method || opts.cardObj.card_token,
      description         : opts.description,
      confirm             : true,
      off_session         : true,
      payment_method_types: ['card'],
      metadata            : opts.metadata || null
    }).catch( (error)=>{
      logging.log(apiReference, {EVENT : "paymentIntent response ", response : error});
      if(error.statusCode == 402){
        result.success   = false;
        result.message   = error.message;
        if(error.raw && error.raw.payment_intent){
          result.payment_intent_id = error.raw.payment_intent.id;
          result.client_secret     = error.raw.payment_intent.client_secret;
          result.charge_id         = error.raw.charge;
        }
        if(error.statusCode == 402 && error.raw.decline_code == "authentication_required"){
          result.authentication_required = true;
          if(error.raw.payment_method){
            result.payment_method = error.raw.payment_method.id;
          }
        }
      }
    });

    logging.log(apiReference, {EVENT: "paymentIntent", response: response});

    if (response && response.status == 'succeeded') {
      result.success             = true;
      result.payment_intent_id   = response.id;
      if(response.charges && !_.isEmpty(response.charges.data) && response.charges.data[0].id){
        result.charge_id          = response.charges.data[0].id;
      }
    }
  } catch(e){
    logging.logError(apiReference, {EVENT : "deductPayment" , ERROR : e});
  }
  return result;

}