/**
 * The node-module to hold the constants for the server
 */

var config                          = require('config');

var commonFunc                      = require('./commonFunction');
var offeringService                 = require('./../modules/authentication/services/offeringService');


function define(obj, name, value) {
  Object.defineProperty(obj, name, {
    value       : value,
    enumerable  : true,
    writable    : false,
    configurable: true
  });
}

exports.SECRET_API_KEY = "c#4ng3T#isS3cR3tK3Y";

exports.responseMessages = {
  PARAMETER_MISSING                             : "Insufficient information was supplied. Please check and try again.",
  WRONG_PASSWORD                                : "Incorrect Password.",
  ACTION_COMPLETE                               : "Successful",
  LOGIN_SUCCESSFULLY                            : "Logged in successfully.",
  INVALID_ACCESS_TOKEN                          : "Session expired. Please logout and login again.",
  EMAIL_NOT_EXISTS                              : "This account is not registered with us.",
  ERROR_IN_EXECUTION                            : "Some error occurred while executing. Please refresh the page and try again.",
  SHOW_ERROR_MESSAGE                            : "Some error occurred. Please refresh the page and try again.",
  NO_DATA_FOUND                                 : "No data found.",
  INVALID_ACCESS                                : "You are not authorized to perform this action.",
  EMAIL_REGISTERED_ALREADY                      : "Email already exists.",
  INVALID_API_KEY                               : "Invalid api key.",
  DUPLICATE_DATA                                : "DUPLICATE_DATA" ,
  CUSTOM_FIELD_ALREADY_EXIST                    : "You have already added custom fields",
  INVALID_USER_API_KEY                          : "Invalid user api key.",
  INVALID_AUTH_KEY                              : "Invalid server auth key.",
  CARD_NOT_EXIST                                : "User doesn't have a saved card.",
  CURRENCY_NOT_EXIST                            : "Currency is not yet configured",
  PAYMENT_COMPLETE                              : "Payment Successful.",
  CARD_ADDED_SUCCESSFULLY                       : "Card added successfully.",
  CARD_UPDATED_SUCCESSFULLY                     : "Card updated successfully.",
  PAYMENT_FAILED                                : "Payment Failed.",
  USER_BLOCKED                                  : "User is blocked.",
  USERNAME_ALREADY_EXISTS                       : "This username already exists",
  DOMAIN_ALREADY_EXISTS                         : "This domain already exists",
  DOMAIN_ALREADY_REGISTERED                     : "Domain is already registered with your account. Please try logging in with this domain: ",
  SOMETHING_WENT_WRONG                          : "Something went wrong. Please try again later",
  INVALID_VERIFICATION_TOKEN                    : "Verification token is invalid",
  VERIFICATION_TOKEN_VALIDITY_MESSAGE           : "A link has been sent to your mail, that link is valid only for 24 hours",
  OFFERING_NOT_BOUGHT                           : "You have not bought this offering",
  PASSWORD_UPDATED                              : "Password updated successfully",
  INCORRECT_OLD_PASSWORD                        : "Old password is incorrect",
  SAME_NEW_PASSWORD                             : "Old and new password can't be same",
  EMAIL_REGISTERED_ALREADY_WITH_ANOTHER_OFFERING: "You are already registered on JungleWorks. Please login with same credentials.",
  ADMIN_CANT_DELETE_SELF                        : "You can't delete your own account",
  NAME_ALREADY_EXISTS                           : "Name already exists",
  VERIFYING_ACCESS_TOKEN                        : "Verify access_token",
  NOT_VALID_EMAIL                               : "There's some issue with the information that you've provided. Please try again",
  ID_ALREADY_EXIST                              : "An account with this Facebook id already exists",
  RAZORPAY_PAYMENT_LINK_SENT                    : "Razorpay Payment Link sent successfully",
  EXCEEDED_OTP_VERIFICATION                     : "Exceeded Otp Verification",
  INVALID_OTP                                   : "Invalid OTP",
  INVALID_PHONE_NUMBER                          : "Invalid Phone Number",
  PHONE_NUMBER_BLOCKED                          : "Phone number is Blocked",
  INVALID_APPLE_TOKEN                           : "Token is Invalid",
  APPLE_TOKEN_EXPIRED                           : "Token is Expired",
  INVALID_USER_ID                               : "Invalid user Id.",
  JUNGLEWORKS_PAYMENT_LINK_SENT               : "Jungleworks Payment Link sent successfully"
};

exports.responseFlags = {
  INVALID_USER_ID                  : 400,
  ADDON_UPDATED                    : 200,
  ADDON_INSERTED                   : 200,
  DUPLICATE_ADDONS                 : 400,
  RESELLER_UPDATED                 : 200,
  NOT_AUTHORIZED_TO_ACCESS         : 400,
  PASSWORD_UPDATED                 : 200,
  INVALID_RESELLER_ID              : 400,
  DOMAIN_REQUIRED_IN_INPUT         : 400,
  PARAMETER_MISSING                : 100,
  INVALID_ACCESS_TOKEN             : 101,
  INVALID_USERNAME                 : 201,
  INVALID_EMAIL_ID                 : 201,
  ACTION_NOT_ALLOWED               : 201,
  INVALID_ACCESS                   : 201,
  WRONG_PASSWORD                   : 201,
  WRONG_OLD_PASSWORD               : 201,
  ACTION_COMPLETE                  : 200,
  LOGIN_SUCCESSFULLY               : 200,
  SHOW_ERROR_MESSAGE               : 201,
  IMAGE_FILE_MISSING               : 102,
  NO_DATA_FOUND                    : 400,
  ERROR_IN_EXECUTION               : 404,
  UPLOAD_ERROR                     : 201,
  USER_NOT_FOUND                   : 201,
  RESELLER_USER_NOT_FOUND          : 401,
  PASSWORD_CHANGED_SUCCESSFULLY    : 200,
  EXCEED_FLEET_COUNT               : 202,
  ACCOUNT_EXPIRE                   : 401,
  SHOW_WARNING                     : 410,
  ACTION_COMPLETE_2                : 205,
  BILLING_PLAN_CHANGED_FOR_TODAY   : 206,
  CREDIT_CARD_NOT_ADDED            : 300,
  VENDOR_NOT_FOUND                 : 201,
  EMAIL_NOT_EXISTS                 : 400,
  DOMAIN_NOT_AVAILABLE             : 400,
  DOMAIN_NOT_CREATED               : 400,
  DOMAIN_NOT_FOUND                 : 400,
  FORM_SETTINGS_NOT_FOUND          : 400,
  ALREADY_EXIST                    : 400,
  SMS_SETTINGS_NOT_FOUND           : 400,
  JOB_NOT_MAPPED_WITH_YOU          : 501,
  USER_ALREADY_EXISTS              : 601,
  AVAILABILITY_RIGHTS_CHANGED      : 210,
  INVALID_APP                      : 502,
  INVALID_FORM                     : 101,
  INVALID_PAYMENT_METHOD           : 101,
  PAYMENT_FAILED                   : 401,
  MINOR_ERROR                      : 201,
  NOT_AVAILABLE                    : 400,
  REFRESH_APP                      : 101,
  RESELLER_IS_ALREADY_ADMIN        : 409,
  SUCCESS_CODE                     : 200,
  RAZORPAY_PAYMENT_LINK_SENT       : 220,
  USER_CARD_NOT_EXIST              : 202,
  INTERNAL_SERVER_ERROR            : 500,
  BAD_REQUEST                      : 400,
  CLIENT_ERROR                     : 401,
  ALREADY_EXISTS                   : 409, //CONFLICT
  ALREADY_EXIST_IN_ANOTHER_OFFERING: 701,
  INVALID_PHONE_NUMBER             : 405,
  USER_BLOCKED                     : 406,
  JUNGLEWORKS_PAYMENT_LINK_SENT    : 222
};

exports.CURRENCY = "usd";

exports.CUSTOM_FIELDS = {
  TYPES: {
    DATE           : 'Date',
    DATE_FUTURE    : 'Date-Future',
    DATE_PAST      : 'Date-Past',
    DATE_TIME      : 'Date-Time',
    TIME           : 'Time',
    DATETIME_FUTURE: 'Datetime-Future',
    DATETIME_PAST  : 'Datetime-Past',
    EMAIL          : 'Email',
    NUMBER         : 'Number',
    TELEPHONE      : 'Telephone',
    TEXT           : 'Text',
    TEXTAREA       : 'TextArea',
    CHECKBOX       : 'Checkbox',
    IMAGE          : 'Image',
    SINGLE_SELECT  : 'Single-Select',
    MULTI_SELECT   : 'Multi-Select',
    DOCUMENT       : 'Document',
    URL            : 'URL'
  }
};

exports.SOCIAL = {
  FACEBOOK:{
    APP_ID    : config.get("facebook.app_id"),
    APP_SECRET: config.get("facebook.app_secret")
  }
};

exports.SOCIAL_STATUS = {
  REGISTER : 1,
  LOGIN    :2
};
exports.SOCIALWEBSITE = {
  FACEBOOK: 1,
  GOOGLE  :2,
  APPLE : 3
};

exports.OFFERING = {
  FUGU  : 15
}

exports.CUSTOM_FIELDS_LIST = {
  ALL     : [
    module.exports.CUSTOM_FIELDS.TYPES.DATE,
    module.exports.CUSTOM_FIELDS.TYPES.DATE_FUTURE,
    module.exports.CUSTOM_FIELDS.TYPES.DATE_PAST,
    module.exports.CUSTOM_FIELDS.TYPES.DATE_TIME,
    module.exports.CUSTOM_FIELDS.TYPES.DATETIME_FUTURE,
    module.exports.CUSTOM_FIELDS.TYPES.DATETIME_PAST,
    module.exports.CUSTOM_FIELDS.TYPES.EMAIL,
    module.exports.CUSTOM_FIELDS.TYPES.NUMBER,
    module.exports.CUSTOM_FIELDS.TYPES.TELEPHONE,
    module.exports.CUSTOM_FIELDS.TYPES.TEXT,
    module.exports.CUSTOM_FIELDS.TYPES.CHECKBOX,
    module.exports.CUSTOM_FIELDS.TYPES.IMAGE,
    module.exports.CUSTOM_FIELDS.TYPES.SINGLE_SELECT,
    module.exports.CUSTOM_FIELDS.TYPES.MULTI_SELECT,
    module.exports.CUSTOM_FIELDS.TYPES.DOCUMENT,
    module.exports.CUSTOM_FIELDS.TYPES.TEXTAREA,
    module.exports.CUSTOM_FIELDS.TYPES.URL
  ],
  DATETIME: [
    module.exports.CUSTOM_FIELDS.TYPES.DATE_TIME,
    module.exports.CUSTOM_FIELDS.TYPES.DATETIME_FUTURE,
    module.exports.CUSTOM_FIELDS.TYPES.DATETIME_PAST
  ],
  DATE    : [
    module.exports.CUSTOM_FIELDS.TYPES.DATE,
    module.exports.CUSTOM_FIELDS.TYPES.DATE_FUTURE,
    module.exports.CUSTOM_FIELDS.TYPES.DATE_PAST
  ]
};

exports.internalEmailDomains =
  ['@clicklabs', '@jungleworks.c'];

exports.testEmailDomains = ['@testmail', '@yopmail', '@test.'];


exports.offerings = {
  FUGU     : 6
};

exports.verificationTokenSeparator  = "______";

exports.PAYMENT_INTENT_STATUS  = {
  UNPAID  : 0,
  PAID    : 1,
  DISABLED: 2
};

exports.OFFERING_WEBHOOK_CONFIG = {
  15: {
    url      : config.get("webhookConfig.fuguchat.baseUrl") + "/auth/webhook",
    key      : config.get("webhookConfig.fuguchat.secret_key"),
    mail_from: "Fugu Chat <support@fuguchat.com>"
  }
};

exports.WEBHOOK_TYPES  = {
  STRIPE_WEBHOOK  : 1,
  RAZORPAY_WEBHOOK: 2,
  JUNGLEPAY_WEBHOOK: 3
};

exports.PAYMENT_GATEWAYS = {
  STRIPE  : 1,
  RAZORPAY: 2,
  JW_INVOICE: 3
};

exports.BUMBL = {
    SEND_SMS: config.get("bumbl.baseUrl")+'/jungle/sendSms',
    API_KEY: config.get("bumbl.apiKey"),
    USER_ID: config.get("bumbl.userId"),
    OFFERING: config.get("bumbl.offering")
}


exports.AUTH_OTP_VALIDATION_TYPE= {
  LOGIN:1,
  SIGNUP:2
}

exports.OTP_PROPERTIES = {
  MAX_ATTEMPT:5,
  MAX_OTP_COUNT:5,
  OTP_TIME_LIMIT:30
}

exports.JUNGLEWORKS_AUTH_DOMAIN = "@jungleworks.auth";