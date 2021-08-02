
const _                            = require('underscore');
     
const workspaceService             = require('../services/workspace');
const constants                    = require('../Utils/constants');
const dateUtility                  = require('../Utils/dateUtility');
const commonFunctions              = require('../Utils/commonFunctions');
const utilityService               = require('../services/utility');
const paymentService               = require('../services/paymentService');
const sendEmail                    = require('../Notification/email').sendEmailToUser;


exports.calculateInvitePrice         = calculateInvitePrice;
exports.initiatePayment              = initiatePayment;
exports.razorpayPaymentWebhook       = razorpayPaymentWebhook;


async function calculateInvitePrice(logHandler, opts){
    try{
      let payment_gateway_creds = JSON.parse(opts.workspaceInfo.payment_gateway_creds);
      let pricePerUser;
      let workspace_id = opts.workspaceInfo.workspace_id;
      let getWorkspaceConfiguration = await workspaceService.getWorkspaceConfiguration(logHandler,workspace_id, 'per_user_invite_price');
      if(_.isEmpty(getWorkspaceConfiguration)){
        getWorkspaceConfiguration = await workspaceService.getWorkspaceConfiguration(logHandler, 0, 'per_user_invite_price');
      }
      pricePerUser = getWorkspaceConfiguration.per_user_invite_price;
      let user_count         = opts.user_count;
      let calculatePriceType = opts.price_type;
      let totalPriceForCurrentMonth;
      totalPriceForCurrentMonth = calculatePlanAmount(pricePerUser, user_count, calculatePriceType);
      return({totalPrice: totalPriceForCurrentMonth, no_of_users: user_count, currency: payment_gateway_creds.currency});
 
    }catch(error){
      throw(error);
    }
}


function calculatePlanAmount(pricePerUser, user_count, price_type){
  let currentDay         = dateUtility.getCurrentDay(new Date());
  let totalDaysInMonth   = dateUtility.getDaysinMonth(new Date());
  let pendingDaysInMonth = totalDaysInMonth - currentDay + 1;
  if(price_type == constants.PAYMENT_PRICE_TYPE.MONTH_WISE){
    pendingDaysInMonth = totalDaysInMonth;
  }
  let totalPrice = ((pricePerUser/totalDaysInMonth) * pendingDaysInMonth * user_count).toFixed(2);
  return totalPrice;
}

async function initiatePayment(logHandler, opts){
  try{
      let totalPrice   = Number(opts.amount);
      let user_id      = opts.workspaceInfo.user_id;
      let workspace_id = opts.workspaceInfo.workspace_id;
      let paymentCreds = JSON.parse(opts.workspaceInfo.payment_gateway_creds);
      let calculatedPrice = await calculateInvitePrice(logHandler, opts);
      if(calculatedPrice.totalPrice != totalPrice){
        throw('Invalid Data. Price mismatch!!');
      };
      let token =  commonFunctions.generateToken();
      let data = {
        user_id    : opts.workspaceInfo.domain_id,
        secret_key : paymentCreds.key_secret,
        offering_id: 15,
        key_id     : paymentCreds.key_id,
        description: "purchasing invitation",
        amount     : totalPrice,
        currency   : opts.currency,
        customer_id: user_id,
        meta_data  : { 
          order_id    : token,
          amount      : totalPrice,
          currency    : opts.currency,
          user_count  : opts.user_count,
          workspace_id: opts.workspaceInfo.workspace_id,
          user_id     : user_id
        },
        success_url: paymentCreds.success_url + opts.workspaceInfo.workspace,
        failure_url: paymentCreds.error_url + opts.workspaceInfo.workspace,
        secret_key : config.get('junglePaymentSecretKey')
      }
     let options = {
      method  : 'POST',
      url     : config.get('junglePaymentUrl') +  constants.JUNGLE_PAYMENT_ENDPOINT.GET_RAZORPAY_URL,
      json    : data,
      headers: {
        'content-type': 'application/json'
      }  
    };
    let result = await utilityService.sendHttpRequest(logHandler, options);
      paymentService.insertRazorpayLogs(logHandler, { totalPrice, user_id,user_count: opts.user_count, workspace_id, request: data, response: result, event: constants.PAYMENT_EVENTS.INITIATE_PAYMENT});
      if(result.status != 200){
        throw new Error('Something went wrong, please refresh and try again');
      }
      let insertObj = {
        order_id    : token,
        amount      : totalPrice,
        user_id     : user_id,
        workspace_id: opts.workspaceInfo.workspace_id,
        user_count  : opts.user_count,
        payment_url : result.data.redirect_url,
        status      : constants.PAYMENT_STATUS.INITIATE,
        domain_id   : opts.workspaceInfo.domain_id
      }
     await paymentService.insertRazorpayPaymentDetails(logHandler, insertObj);
     return result.data; 

  }catch(error){
    throw(error);
  }
}


async function razorpayPaymentWebhook(logHandler, opts){
   try{
     let metaData = JSON.parse(opts.metaData);
     paymentService.insertRazorpayLogs(logHandler, { totalPrice: metaData.amount, user_id: metaData.user_id, workspace_id: metaData.workspace_id, request: {}, response: opts, event: constants.PAYMENT_EVENTS.PAYMENT_WEBHOOK});
   
     if(!opts.transaction_complete){
       throw new Error('Transaction Failed. Please try again with different payment method!!');
     }
     let getTransactionDetails = await paymentService.getRazorpayTransactionDetails(logHandler, {order_id: metaData.order_id, amount: metaData.amount, domain_id: opts.user_id});
     if(_.isEmpty(getTransactionDetails)){
       throw new Error('No Transaction Found!!');
     }
     if(getTransactionDetails[0].status != constants.PAYMENT_STATUS.INITIATE){
       throw new Error('Invalid Transaction');
     }
     let updateObj = {
       order_id      : metaData.order_id,
       status        : constants.PAYMENT_STATUS.COMPLETE,
       transaction_id: opts.invoice_id
     };
     await paymentService.updateRazorpayTransactionDetails(logHandler, updateObj);
     await workspaceService.insertUpdateWorkspaceInviteAllowed(logHandler, {workspace_id: getTransactionDetails[0].workspace_id, invite_allowed: getTransactionDetails[0].user_count});
     return;
   }catch(error){
     throw(error);
   }
}