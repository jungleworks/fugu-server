/**
 * Created by shashank on 31/01/21.
 */


const _                                       = require('underscore');

const logging                                 = require('./../../../routes/logging');
const httpService                             = require('./../../../services/httpService');
const utilityService                          = require('./../../../services/utilityService');
const dbHandler                               = require('./../../../routes/mysqlLib');
const constants                               = require('./../../../routes/constants');


exports.sendPaymentLink                       = sendPaymentLink;


async function sendPaymentLink(apiReference, opts) {
    logging.log(apiReference, {EVENT : "sendPaymentLink", opts: opts});

    let totalAmount = Number(opts.amount + Number(0.0399 * opts.amount + 0.30)  ); // 3.9% of amount + 30 cents

    totalAmount = Number(parseFloat(totalAmount).toFixed(2));

    let body = {
        "to_name": opts.name,
        "lead_owner": startupVariables.offeringIdToOfferingName[opts.offering],
        "to_email": opts.email,
        "tnc_data":"<p></p>\n",
        "is_tnc_added":0,
        "invoice_date": new Date(),
        "due_date" : new Date(Date.now() + 21 * 24*60*60*1000), // 21 days more
        "notes":"",
        "discount_type":"PERCENT",
        "tax": "3.99",
        "from_company_logo":"0",
        "from_company_name":"CL",
        "amount": totalAmount, // 3.9% + 30 cents
        "currency":"usd",
        "items":[{"name": opts.description,"quantity":1,"amount": opts.amount}],
        "sub_total": opts.amount,
        "is_usa_client":  opts.currency_id == 1 ? 1 : 0,
        "bank_details":"",
        "access_token": utilityService.isEnvLiveOrBeta() ? config.get("jungleworks_live.token") :  config.get("jungleworks_test.token")
    };

    let options = {
        uri     : (utilityService.isEnvLiveOrBeta() ? config.get("jungleworks_live.apiBaseUrl") : config.get("jungleworks_test.apiBaseUrl")) + "/invoice/createInvoice",
        method  : 'POST',
        body    : body,
        json    : true,
        timeout : 10000,
        rejectUnauthorized : false,
        headers : {
            'Content-Type' : 'application/json; charset=utf-8',
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
        jwp_request    : body
    };
    let jungleworksInvoiceResponse = {};
    try {
        jungleworksInvoiceResponse = await httpService.sendHttpRequest(apiReference, options);
        logging.log(apiReference, {EVENT : "jwiPaymentLink", jungleworksInvoiceResponse});
        if(jungleworksInvoiceResponse.status == 200) {
            logLinkOpts.jwp_invoice_id  = jungleworksInvoiceResponse.data;
            logLinkOpts.jwp_short_url   = (utilityService.isEnvLiveOrBeta() ? config.get("jungleworks_live.invoiceUrl") : config.get("jungleworks_test.invoiceUrl")) + jungleworksInvoiceResponse.data;
            logLinkOpts.message         = jungleworksInvoiceResponse.message;
            logLinkOpts.jwp_response    = jungleworksInvoiceResponse;

            response = {
                data : {
                    jwp_invoice_id     : jungleworksInvoiceResponse.data,
                    jwp_short_url      : (utilityService.isEnvLiveOrBeta() ? config.get("jungleworks_live.invoiceUrl") : config.get("jungleworks_test.invoiceUrl")) + jungleworksInvoiceResponse.data,
                    transaction_status : constants.responseFlags.JUNGLEWORKS_PAYMENT_LINK_SENT
                },
                code : constants.responseFlags.JUNGLEWORKS_PAYMENT_LINK_SENT,
                msg  : constants.responseMessages.JUNGLEWORKS_PAYMENT_LINK_SENT
            }
        }
    } catch (e){
        logging.logError(apiReference, {EVENT : "rzpPaymentLink ERROR", ERROR : e});
        if(e && e.body && e.body.error && e.body.error.description){
            response.msg = e.body.error.description;
        }
        logLinkOpts.jwp_response    = e.body;
        console.error(e);
    }

    logJungleworksPayLink(apiReference, logLinkOpts);
    logging.log(apiReference, {EVENT : "sendPaymentLink", response: response});
    return response;
}

async function logJungleworksPayLink(apiReference, opts) {
    let insertObj  = {
        jwp_invoice_id : opts.jwp_invoice_id,
        jwp_short_url  : opts.jwp_short_url,
        user_id        : opts.user_id,
        amount         : opts.amount,
        currency_id    : opts.currency_id,
        offering       : opts.offering,
        description    : opts.description,
        jwp_response   : JSON.stringify(opts.jwp_response),
        jwp_request    : JSON.stringify(opts.jwp_request)
    };

    await dbHandler.mysqlQueryPromise(apiReference, "logJunglepayLink", "INSERT INTO tb_jungleworks_payment_links SET ? ", insertObj);
}