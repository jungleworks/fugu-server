
const Promise                                 = require('bluebird');
const md5                                     = require('md5')

const dbHandler                               = require('./../../../routes/mysqlLib');
const constants                               = require('./../../../routes/constants');
const logging                                 = require('./../../../routes/logging');
const authenticationController                = require('./../../authentication/controllers/userController')
const utilityService                          = require('./../../../services/utilityService');


exports.getOtp                          =   getOtp;
exports.insertOtpStatus                 =   insertOtpStatus;
exports.updateOtpStatus                 =   updateOtpStatus;
exports.processRegister                 =   processRegister;
exports.getUserDetail                   =   getUserDetail;
exports.updateOtpAttempt                =   updateOtpAttempt;
exports.getOtpText                      =   getOtpText;
exports.updateOtpStatusNew              =   updateOtpStatusNew;
exports.generateRandomNumber            =   generateRandomNumber;

function getOtp(apiReference, opts) {
    return new Promise((resolve, reject) => {
        var values = [opts.phone];
        var query  = "SELECT * FROM tb_otp_verification WHERE phone=?";
        if(opts.hasOwnProperty('is_verified'))
        {
            query+=` AND is_verified=${opts.is_verified}`
        }
        dbHandler.mysqlQueryPromise(apiReference, "getOtp", query, values).then((result) => {
        resolve(result)
    }, (error) => {
        reject(error);
    });
});
}

function insertOtpStatus(apiReference, opts) {
    return new Promise((resolve, reject) => {
        var query  = "INSERT INTO tb_otp_verification SET ?";
        dbHandler.mysqlQueryPromise(apiReference, "insertOtpStatus", query, opts).then((result) => {
            resolve(result)
        }, (error) => {
            reject(error);
        });
    });
}

function updateOtpStatus(apiReference, opts) {
    return new Promise((resolve, reject) => {
        var query  = `UPDATE tb_otp_verification SET ? ,update_datetime=NOW() WHERE phone=${opts.phone} `;
        dbHandler.mysqlQueryPromise(apiReference, "updateOtpStatus", query, opts).then((result) => {
            resolve(result)
        }, (error) => {
            reject(error);
        });
    });
}

function updateOtpStatusNew(apiReference, opts) {
    return new Promise((resolve, reject) => {
        var query  = `UPDATE tb_otp_verification SET otp_count=0, is_verified=1 WHERE phone=${opts.phone}`;
        dbHandler.mysqlQueryPromise(apiReference, "updateOtpStatusNew", query, opts).then((result) => {
            resolve(result)
        }, (error) => {
            reject(error);
        });
    });
}

async function processRegister(apiReference, opts) {
    return new Promise(async (resolve,reject)=> {
        let req      = {
            body: {
                email               : opts.email || (opts.phone + constants.JUNGLEWORKS_AUTH_DOMAIN).replace(/[+]/g, ""),
                username            : opts.phone,
                first_name          : opts.phone,
                password            : md5(opts.phone),
                phone               : opts.phone,
                timezone            : opts.timezone,
                country_phone_code  : opts.country_phone_code,
                company_address     : opts.company_address || 'CDCL',
                company_latitude    : opts.company_latitude || 30,
                company_longitude   : opts.company_longitude || 78,
                ipconfig            : opts.ipconfig
            }
        };
        opts.last_name?(req.body.last_name=opts.last_name):0;
        opts.terms_and_conditions?(req.body.terms_and_conditions=opts.terms_and_conditions):0;
        opts.language?(req.body.language=opts.language):0;
        opts.company_name?(req.body.company_name=opts.company_name):0;
        opts.source?(req.body.source=opts.source):0;
        opts.medium?(req.body.medium=opts.medium):0;
        opts.business_type?(req.body.business_type=opts.business_type):0;
        opts.previous_page?(req.body.previous_page=opts.previous_page):0;
        opts.referrer?(req.body.referrer=opts.referrer):0;
        opts.old_source?(req.body.old_source=opts.old_source):0;
        opts.old_medium?(req.body.old_medium=opts.old_medium):0;
        opts.incomplete?(req.body.incomplete=opts.incomplete):0;
        opts.vertical?(req.body.vertical=opts.vertical):0;
        opts.ad_campaign_name?(req.body.ad_campaign_name=opts.ad_campaign_name):0;
        opts.vertical_page?(req.body.vertical_page=opts.vertical_page):0;
        opts.gclid?(req.body.gclid=opts.gclid):0;
        opts.ctaType?(req.body.ctaType=opts.ctaType):0;
        opts.utm_term?(req.body.utm_term=opts.utm_term):0;
        opts.lead_allocation?(req.body.lead_allocation=opts.lead_allocation):0;
        opts.utm_campaign?(req.body.utm_campaign=opts.utm_campaign):0;
        opts.web_referrer?(req.body.web_referrer=opts.web_referrer):0;
        opts.old_utm_campaign?(req.body.old_utm_campaign=opts.old_utm_campaign):0;
        opts.verification_status?(req.body.verification_status=opts.verification_status):0;
        opts.custom_fields?(req.body.custom_fields=opts.custom_fields):0;
        opts.dispatcher_user_id?(req.body.dispatcher_user_id=opts.dispatcher_user_id):0;
        opts.is_merchant?(req.body.is_merchant=opts.is_merchant):0;
        opts.message?(req.body.message=opts.message):0;
        opts.url?(req.body.url=opts.url):0;
        opts.session_ip?(req.body.session_ip=opts.session_ip):0;
        opts.utm_source?(req.body.utm_source=opts.utm_source):0;
        opts.country_code?(req.body.country_code=opts.country_code):0;
        opts.continent_code?(req.body.continent_code=opts.continent_code):0;
        opts.region_code?(req.body.region_code=opts.region_code):0;
        opts.productname?(req.body.productname=opts.productname):0;
        opts.uber_for?(req.body.uber_for=opts.uber_for):0;
        opts.is_dispatcher?(req.body.is_dispatcher=opts.is_dispatcher):0;
        opts.utm_content?(req.body.utm_content=opts.utm_content):0;
        opts.utm_keyword?(req.body.utm_keyword=opts.utm_keyword):0;
        opts.utm_lead?(req.body.utm_lead=opts.utm_lead):0;
        opts.offering?(req.body.offering=opts.offering):0;
        
        await authenticationController.jungleRegisterUser(req, {
            status: (result) => {
                return {
                    send: (result) => {
                        console.log(result)
                        resolve(result)
                    }
                }
            }
        });
    })
}


function getUserDetail(apiReference, opts) {
    return new Promise((resolve, reject) => {
        opts.email = opts.email || (opts.phone + constants.JUNGLEWORKS_AUTH_DOMAIN).replace(/[+]/g, "");
        let values=[];
        var query  = `SELECT * FROM tb_users WHERE 1=1 AND is_merchant=0 AND is_dispatcher=0`;
        if(opts.hasOwnProperty('phone'))
        {
            query+=` AND phone = ?`;
            values.push(opts.phone);
        }
        query+=` OR email = ?`;
        values.push(opts.email);
        dbHandler.mysqlQueryPromise(apiReference, "getUserDetail", query, values).then((result) => {
            resolve(result)
        }, (error) => {
            reject(error);
        });
    });
}

function updateOtpAttempt(apiReference, opts) {
    return new Promise((resolve, reject) => {
        var query  = `UPDATE tb_otp_verification SET  `;
        let value=[];
        if(opts.hasOwnProperty('attempt')){
            query+=` attempt=0`
        }
        else {
            query+=` attempt=attempt+1 `
        }
        if(opts.hasOwnProperty('otp_count')){
            query+=` , otp_count=0 `
        }
        if(opts.hasOwnProperty('is_verified')){
            query+=` , is_verified=1`
        }
        query+=` WHERE 1=1 AND is_verified=0 AND (email = ? OR phone = ?) `;
        value.push(opts.email);
        value.push(opts.phone);
        dbHandler.mysqlQueryPromise(apiReference, "updateOtpAttempt", query, value).then((result) => {
            resolve(result)
        }, (error) => {
            reject(error);
        });
    });
}

function getOtpText(apiReference, opts) {
    let html = `Hello User, <br><br>
    We have received a request to register account in JungleWork<br><br> 
    Your ${startupVariables.offeringIdToOfferingName[opts.offering]} verification code is ${opts.otp}<br><br>
    <b>Kind Regards,<br>
    Team Jungleworks</b>`;
    return html;
}


function generateRandomNumber(){
    let random;
    if(utilityService.isEnvLiveOrBeta()) {
        random = Math.floor(100000 + Math.random() * 900000);
    }else{
        random=444444;
    }
    return random;
}