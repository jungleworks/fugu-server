
const saltRounds       = 10;
const bcrypt           = require('bcryptjs');
const _                = require('underscore');
const md5              = require('MD5');
const Promise          = require('bluebird');
const config           = require('config');
const RESP             = require('../Config').responseMessages;
const { logger }       = require('../libs/pino_logger');
const constants        = require('../Utils/constants');
const UniversalFunc    = require('../Utils/universalFunctions');
const workspaceService = require('../services/workspace');
const userService      = require('../services/user');
const bot              = require('../services/bot')
const commonFunctions  = require('../Utils/commonFunctions');
const sendEmail        = require('../Notification/email').sendEmailToUser;
const utilityService   = require('../services/utility');
const channelService   = require('../services/channel');
const UserController   = require('../Controller/userController');
const phone            = require('node-phonenumber')
const CryptoJS         = require("crypto-js");
const { google }       = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const helperUtility    = require('../Utils/helperUtility');
const businessService = require('../services/business');

const phoneUtil = phone.PhoneNumberUtil.getInstance();

exports.checkEmail                  = checkEmail;
exports.signup                      = signup;
exports.signupV1                    = signupV1;
exports.verifyOtp                   = verifyOtp;
exports.verifyOtpV1                 = verifyOtpV1;
exports.getConfiguration            = getConfiguration;
exports.editConfiguration           = editConfiguration;
exports.getWorkspaceInfo            = getWorkspaceInfo;
exports.editWorkspaceInfo           = editWorkspaceInfo;
exports.setWorkspacePasswordV1      = setWorkspacePasswordV1;
exports.switchWorkspace             = switchWorkspace;
exports.createWorkspace             = createWorkspace;
exports.addPublicEmailDomain        = addPublicEmailDomain;
exports.editPublicEmailDomain       = editPublicEmailDomain;
exports.getPublicEmailDomains       = getPublicEmailDomains;
exports.getPublicInviteDetails      = getPublicInviteDetails;
exports.joinWorkspace               = joinWorkspace;
exports.getPublicInfo               = getPublicInfo;
exports.publicInvite                = publicInvite;
exports.getOpenAndInvited           = getOpenAndInvited;
exports.getAllMembers               = getAllMembers;
exports.getInvitedUsers             = getInvitedUsers;
exports.leave                       = leave;
exports.getWorkspaceDetails         = getWorkspaceDetails;
exports.registerUser                = registerUser;
exports.updateAuthUser              = updateAuthUser;
exports.signupV2                    = signupV2;
exports.googleSignup                = googleSignup;
exports.syncGoogleContacts          = syncGoogleContacts;
exports.getPaymentDetails           = getPaymentDetails;
exports.addUserCards                = addUserCards;
exports.buyPlan                     = buyPlan;
exports.updatePlan                  = updatePlan;
exports.updateUserBillingPlan       = updateUserBillingPlan;
exports.validateWorkspace           = validateWorkspace;
exports.verifyAndRegisterGoogleUser = verifyAndRegisterGoogleUser;
exports.registerPhoneNumber         = registerPhoneNumber;
exports.checkInvitedContacts        = checkInvitedContacts;
exports.deactivateUser              = deactivateUser;
exports.getAllChannelInfo           = getAllChannelInfo;
exports.insertScrumDetails          = insertScrumDetails;
exports.getScrumDetails             = getScrumDetails;
exports.editScrumDetails            = editScrumDetails;
exports.checkUserAvailability       = checkUserAvailability;
exports.scrumCron                   = scrumCron;
exports.getIntentToken              = getIntentToken;
exports.authorizePayment            = authorizePayment;
exports.meetCount                   = meetCount;
exports.checkUserInviteDetails      = checkUserInviteDetails;


function checkEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let error = {};
      let details = yield workspaceService.getInfo(logHandler, { email: payload.email });
      if (!_.isEmpty(details)) {
        error = new Error("Email Already Exists");
        error.errorResponse = RESP.ERROR.eng.USER_ALREADY_EXISTS;
        throw error;
      }
      return {};
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}


function signup(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      payload.email = payload.email.trim().toLowerCase();
      payload.workspace_name = payload.workspace_name.trim();
      payload.workspace = payload.workspace.trim().toLowerCase();
      let error = {};
      // check if Already Business Created
      let domainsDetails = yield workspaceService.getInfo(logHandler, { workspace: payload.workspace });
      if (!_.isEmpty(domainsDetails)) {
        error = new Error("Workspace already exists");
        error.errorResponse = RESP.ERROR.eng.DOMAIN_ALREADY_ALLOCATED;
        throw error;
      }
      // check if already requested for account
      let businessSignUpInfo = yield workspaceService.getBusinessSignUpInfo(logHandler, { email: payload.email, workspace: payload.workspace });
      if (!_.isEmpty(businessSignUpInfo)) {
        error = new Error("OTP already send");
        error.errorResponse = RESP.ERROR.eng.OTP_ALREADY_SENT;
        throw error;
      }

      // sometimes it creates 5 digit numbe
      payload.otp = UniversalFunc.generateRandomString(constants.business.OTP_LENGTH, true);

      // insert data in business_details table
      yield workspaceService.insertSignUpRequest(logHandler, payload);

      let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { domain_id: domainsDetails[0].domain_id });

      // sending email using mailgun
      sendEmail(
        constants.emailType.BUSINESS_SIGNUP,
        {
          otp: payload.otp,
          domain_id: domainsDetails[0].domain_id,
          email_credentials: workspaceDetails.email_credentials,
          workspace: payload.workspace || constants.defaultWorkspace
        }, payload.email, `${domainsDetails[0].app_name} confirmation code: ${payload.otp}`, "Business SignUp Mail"
      );

      logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: payload });
      return { email: payload.email };
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}


function signupV1(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      payload.email ? payload.email = payload.email.trim().toLowerCase() : 0;
      payload.contact_number ? payload.contact_number = payload.contact_number.trim() : 0;

      if (payload.contact_number) {
        let checkIfUserContactNumberExists = yield userService.getInfo(logHandler, { contact_number: payload.contact_number });
        if (!_.isEmpty(checkIfUserContactNumberExists)) {
          throw new Error("Phone number already exists");
        }
      }

      let options = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
        json: {
          field_names: "first_name, access_token, password, email,user_id",
          email: payload.email,
          auth_key: config.get("authKey"),
          offering: 15
        }
      };
      let response = yield utilityService.sendHttpRequest(logHandler, options);

      if (response.status == 200) {
        let ifAlreadyEmailExists = yield userService.getInfo(logHandler, { email: payload.email });
        if (_.isEmpty(ifAlreadyEmailExists)) {
          let userId = commonFunctions.generateUserId();
          let insertUser = {
            user_id: userId,
            email: payload.email,
            password: response.data[0].password,
            full_name: response.data[0].first_name,
            contact_number: payload.contact_number || "",
            access_token: bcrypt.hashSync(payload.email || payload.contact_number, saltRounds),
            auth_user_id: response.data[0].user_id,
            user_status: constants.UserStatus.REGISTERED
          };

          yield userService.insertNew(logHandler, insertUser);
        }
      }

      let error = {};
      let checkIfAlreadyRequested = yield workspaceService.getBusinessSignUpInfo(logHandler, payload);
      payload.otp = commonFunctions.isEnv("test") ? 444444 : UniversalFunc.generateRandomString(constants.business.OTP_LENGTH, true);

      let signUpTimeLimit = new Date();
      signUpTimeLimit.setMinutes(signUpTimeLimit.getMinutes() - constants.getMaxResendLimit);

      if (_.isEmpty(checkIfAlreadyRequested)) {
        // insert data in business_details table
        yield workspaceService.insertSignUpRequest(logHandler, payload);
      } else if (checkIfAlreadyRequested[0].sent_count == constants.countConstants.MAX_MAIL_SENT_COUNT && checkIfAlreadyRequested[0].updated_at > signUpTimeLimit) {
        error = new Error("You have reached to max limit!");
        error.errorResponse = RESP.ERROR.eng.OTP_ALREADY_SENT;
        throw error;
      } else if (checkIfAlreadyRequested[0].updated_at > signUpTimeLimit) {
        payload.sent_count = checkIfAlreadyRequested[0].sent_count + 1;
        payload.is_expired = constants.isOtpExpired.NO;
      } else {
        payload.sent_count = 1;
      }
      yield workspaceService.updateBusinessSignUpInfo(logHandler, payload);

      let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

      // sending email using mailgun
      if (!commonFunctions.isEnv("test")) {
        if (payload.email) {
          sendEmail(
            constants.emailType.BUSINESS_SIGNUP,
            {
              otp: payload.otp,
              domain_id: workspaceDetails.domain_id,
              email_credentials: workspaceDetails.email_credentials,
            }, payload.email, `${workspaceDetails.app_name || 'FuguChat'} confirmation code: ${payload.otp}`, "Business SignUp Mail"
          );
        } else {
          let contactNumber = payload.contact_number.split('-').join('');
          let message = payload.otp + `is your OTP for confirming your phone number on ${workspaceDetails.app_name || "FuguChat"}`+ " Thank you for signing up. We're happy you're here.";
          yield utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [contactNumber] });
        }
      }


      logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: payload });
      return { email: payload.email, disallow_workspace_email: constants.disallowWorkspaceEmail };
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}


function verifyOtp(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      // verify if otp is valid or Not
      let details = yield workspaceService.getBusinessSignUpInfo(logHandler, { email: payload.email.trim(), otp: payload.otp.trim() });
      if (_.isEmpty(details)) {
        throw new Error("Invalid OTP");
      }
      payload.otp.toString();
      return { email: payload.email, otp: payload.otp };
    })().then((data) => {
      logger.trace(logHandler, { RESPONSE: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}

function verifyOtpV1(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let result = {};

      let dataObj = {
        otp: payload.otp.trim()
      };
      (payload.email && !(payload.signup_source == constants.onBoardSource.GOOGLE)) ? dataObj.email = payload.email.trim().toLowerCase() : 0;
      //if(payload.device_type != constants.enumDeviceType.WEB) {
      payload.contact_number ? dataObj.contact_number = payload.contact_number.trim() : 0;
      //}
      // verify if otp is valid or Not
      let signupDetails = yield workspaceService.getBusinessSignUpInfo(logHandler, dataObj);

      if (_.isEmpty(signupDetails)) {
        throw new Error("Invalid OTP");
      }

      if (signupDetails[0].is_expired == constants.isOtpExpired.YES) {
        throw new Error("OTP expired!");
      }

      if (payload.signup_source == constants.onBoardSource.GOOGLE) {
        return {}
      }
      yield workspaceService.updateBusinessSignUpInfo(logHandler,{email: payload.email, is_otp_verified: 1});
      let checkIfUserExists = yield userService.getInfo(logHandler, dataObj);

      // if(_.isEmpty(checkIfUserExists) && payload.device_type == constants.enumDeviceType.WEB ) {
      //   checkIfUserExists = yield userService.getInfo(logHandler, { otp : payload.otp.trim(), contact_number : payload.contact_number.trim()});
      //   if(!_.isEmpty(checkIfUserExists)) {
      //     throw new Error("User already exists.");
      //   }
      // }

      if (!_.isEmpty(checkIfUserExists)) {
        delete checkIfUserExists[0].password;
        commonFunctions.checkAppVersion(logHandler, payload);
        checkIfUserExists[0].app_update_config = {
          app_update_message: payload.app_update_message,
          app_link: constants.appUpdateLink[payload.device_type],
          app_update_text: constants.appUpdateText[payload.device_type]
        };
        result.user_info = checkIfUserExists[0];
        yield userService.getUserAllInfo(logHandler, { email: checkIfUserExists[0].email, contact_number: checkIfUserExists[0].contact_number, domain: payload.domain || config.get("baseDomain")}, result);
        result.user_info.attributes = commonFunctions.jsonParse(result.user_info.attributes);
        dataObj.sent_count = 0;
        dataObj.is_expired = constants.isOtpExpired.YES;

        yield workspaceService.updateBusinessSignUpInfo(logHandler, dataObj);
        result.supported_file_type = constants.supportedFileTypes;
        result.fugu_config = constants.fugu_config;

        return result;
      }
      let error = {};
      error = new Error("User does not exists");
      error.errorResponse = RESP.ERROR.eng.USER_DOES_NOT_EXIST;
      throw error;
    })().then((data) => {
      logger.trace(logHandler, { RESPONSE: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}

function setWorkspacePasswordV1(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      // get otp to verify if it is correct
      payload.email ? payload.email.trim().toLowerCase() : 0;
      payload.contact_number ? payload.contact_number.trim() : 0;

      if (payload.contact_number) {
        let checkIfUserContactNumberExists = yield userService.getInfo(logHandler, { contact_number: payload.contact_number });
        if (!_.isEmpty(checkIfUserContactNumberExists)) {
          throw new Error("Phone number already exists");
        }
      }

      let opts = {};

      payload.email ? opts.email = payload.email : opts.contact_number = payload.contact_number;
      let businessSignupInfo = yield workspaceService.getBusinessSignUpInfo(logHandler, opts);
      if (_.isEmpty(businessSignupInfo)) {
        throw new Error("Invalid OTP");
      }
      businessSignupInfo = businessSignupInfo[0];

      // check if business already created or not
      if (businessSignupInfo.is_expired == constants.isOtpExpired.YES) {
        throw new Error("OTP expired");
      }

      let userInfo = yield userService.getInfo(logHandler, payload);
      if (!_.isEmpty(userInfo)) {
        throw new Error("User already exists!");
      }
      let attributes = {};
      if (!payload.contact_number) {
        attributes.is_using_google_apps = yield utilityService.checkUsingGoogleApps(logHandler, payload.email);
      }
      attributes = JSON.stringify(attributes);
      // create new user as it does not exists

      let userId = commonFunctions.generateUserId();
      let accessToken = bcrypt.hashSync(payload.email || payload.contact_number, saltRounds);
      let email = payload.email ? payload.email : payload.contact_number.split('+91-').join('') + '@fuguchat.com';
      let insertObj = {
        user_id       : userId,
        email         : email,
        access_token  : accessToken,
        contact_number: payload.contact_number,
        password      : md5(payload.password),
        full_name     : payload.full_name,
        attributes    : attributes,
        user_status   : constants.UserStatus.REGISTERED
      };

      businessSignupInfo.contact_number ? insertObj.contact_number = businessSignupInfo.contact_number : insertObj.contact_number = payload.contact_number;

      yield userService.insertNew(logHandler, insertObj);
      payload.sent_count = 0;
      payload.is_expired = constants.isOtpExpired.YES;
      yield workspaceService.updateBusinessSignUpInfo(logHandler, payload);
      insertObj.attributes = JSON.parse(insertObj.attributes);
      insertObj.user_channel = commonFunctions.getSHAOfObject(insertObj.user_id);
      let domainDetails = yield workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain") });
      if (!_.isEmpty(domainDetails)) {
        insertObj.workspace_properties = JSON.parse(domainDetails[0]["properties"]);
      }
      let loginObj = { user_info: insertObj };
      yield userService.getUserAllInfo(logHandler, { email: email, contact_number: payload.contact_number, domain: payload.domain }, loginObj);
      loginObj.supported_file_type = constants.supportedFileTypes;
      loginObj.fugu_config = constants.fugu_config;
      return loginObj;
    })().then((data) => {
      logger.trace(logHandler, { RESPONSE: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}
function getConfiguration(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspace_id = payload.workspace_id;
      if (_.isEmpty(payload.workspaceInfo)) {
        throw new Error("Invalid Workspace id");
      }
      let workspaceProperties = yield workspaceService.getConfiguration(logHandler, workspace_id);
      if (payload.workspaceInfo.default_manager_fugu_user_id) {
        let result = yield workspaceService.getUserWorkspaceData(logHandler, { fugu_user_id: payload.workspaceInfo.default_manager_fugu_user_id, workspace_id: payload.workspace_id })
        workspaceProperties.default_manager_full_name = result[0].full_name;
        workspaceProperties.default_manager_fugu_user_id = payload.workspaceInfo.default_manager_fugu_user_id
      }
      return workspaceProperties;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function getPublicInviteDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceDetails = yield workspaceService.getInfo(logHandler, { workspace: payload.workspace });
      if (_.isEmpty(workspaceDetails)) {
        throw new Error("Invalid workspace");
      }
      let workspaceProperties = yield workspaceService.getConfiguration(logHandler, workspaceDetails[0].workspace_id);
      if (workspaceProperties.enable_public_invite != 1) {
        throw new Error("Public Invite Disabled");
      }
      let workpspaceActiveUsers = yield userService.getAllActiveUsers(logHandler, businessDetails[0].workspace_id);

      let getPublicEmailDomains = yield workspaceService.getPublicEmailDomain(logHandler, { workspace_id: businessDetails[0].workspace_id });
      let openEmailDomains = [];

      _.each(getPublicEmailDomains, (emailDomainDetail) => {
        openEmailDomains.push(emailDomainDetail.email_domain);
      });
      return {
        registered_users: workpspaceActiveUsers[0].registered_users,
        open_email_domains: openEmailDomains
      };
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function editConfiguration(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (payload.workspaceInfo.role == constants.userRole.USER) {
        throw new Error("Insufficient Rights!");
      }

      yield workspaceService.editConfiguration(logHandler, payload);

      let opts = {
        app_secret_key: payload.workspaceInfo.fugu_secret_key,
        en_user_id: commonFunctions.encryptText(payload.workspaceInfo.fugu_user_id),
        app_version: payload.app_version,
        device_type: constants.getFuguDeviceType(payload.device_type)
      };

      commonFunctions.getFormatedObj(logHandler, payload, opts, constants.fuguConfiguration);
      if(payload.any_user_can_invite == 1 ){
        return RESP.SUCCESS.ANY_USER_CAN_INVITE
      } else if(payload.any_user_can_invite == 0){
        return RESP.SUCCESS.ONLY_ADMINS_CAN_INVITE
      } else if(payload.signup_mode == 0 || payload.signup_mode == 1){
        return RESP.SUCCESS.BUSINESS_SIGNUP_MODE
      } else if(payload.delete_message_duration){
        return RESP.SUCCESS.MESSAGE_DELETION_TIME
      } else if(payload.delete_message == 1){
        return RESP.SUCCESS.MESSAGE_DELETION
      } else if(payload.delete_message == 0){
        return RESP.SUCCESS.MESSAGE_DELETION_DISABLED
      } else if(payload.edit_message == 0){
        return RESP.SUCCESS.EDIT_MESSAGE_DISABLED
      } else if(payload.edit_message == 1){
        return RESP.SUCCESS.EDIT_MESSAGE
      } else if(payload.hide_email == 1){
        return RESP.SUCCESS.WORKSPACE_EMAILS_HIDDEN
      } else if(payload.hide_email == 0){
        return RESP.SUCCESS.WORKSPACE_EMAILS_VISIBLE
      } else if(payload.hide_contact_number == 0){
        return RESP.SUCCESS.WORKSPACE_NUMBERS_VISIBLE
      } else if(payload.hide_contact_number == 1){
        return RESP.SUCCESS.WORKSPACE_NUMBERS_HIDDEN
      } else if(payload.edit_message_duration){
        return RESP.SUCCESS.EDIT_MESSAGE_TIME
      } else if(payload.enable_create_group == 1){
        return RESP.SUCCESS.EDIT_GROUP_CREATION_ENABLED
      } else if(payload.enable_create_group == 0){
        return RESP.SUCCESS.EDIT_GROUP_CREATION_DISABLED
      } else if(payload.enable_one_to_one_chat == 1){
        return RESP.SUCCESS.ENABLED_ONE_TO_ONE_CHAT
      } else if(payload.enable_one_to_one_chat == 0){
        return RESP.SUCCESS.DISABLED_ONE_TO_ONE_CHAT
      } else {
        return RESP.SUCCESS.BUSINESS_INFO_CHANGED
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceInfo(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      payload.workspace_id = payload.workspace_id;
      if (payload.loginObj.user_info.role == constants.userRole.USER) {
        throw new Error("Insufficient Access");
      }
      let selectPayload = {
        select_columns: ["business_name as workspace_name", "domain as workspace", "email as workspace_email"],
        where_clause: {
          workspace_id: payload.workspace_id
        }
      };
      let result = yield workspaceService.getInfoCommon(logHandler, selectPayload);
      if (!result.length) {
        throw new Error("Business not found");
      }
      logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: result[0] });
      return result[0];
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function editWorkspaceInfo(logHandler, payload, res) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceInfo = payload.workspaceInfo;
      let userInfo = payload.userInfo;

      // if (userInfo.password != md5(payload.password) && payload.workspace_name) {
      //   throw new Error("Password is incorrect");
      // }

      if(workspaceInfo.role != constants.userRole.OWNER) {
        throw new Error("Only owner can change settings")
      }

      let updatePayload = {
        where_clause: {
          workspace_id: workspaceInfo.workspace_id
        }
      };

      if (payload.default_manager_fugu_user_id) {
        let getInfo = yield workspaceService.getUserWorkspaceData(logHandler, { workspace_id: payload.workspace_id, fugu_user_id: payload.default_manager_fugu_user_id })
        if (!_.isEmpty(getInfo) && getInfo[0].status == constants.userStatus.ENABLED) {
          updatePayload.default_manager_fugu_user_id = payload.default_manager_fugu_user_id
        }
      }

      payload.workspace_name ? updatePayload.workspace_name = payload.workspace_name : 0;
      payload.status ? updatePayload.status = payload.status : 0;
      payload.remove_workspace_image ? updatePayload.image = null : 0;
      if (payload.workspace_image_url) {
        let imageObj = {
          workspace_image_url: payload.workspace_image_url,
          workspace_thumbnail_image: payload.workspace_thumbnail_url
        }
        updatePayload.image = JSON.stringify(imageObj)
      }

      yield workspaceService.updateInfo(logHandler, updatePayload);

      if(payload.default_manager_fugu_user_id){
        return RESP.SUCCESS.WORKSPACE_DEFAULT_MANAGER
      } else if (payload.workspace_image_url) {
          return RESP.SUCCESS.WORKSPACE_ICON_UPDATED
      } else if (payload.workspace_name) {
        return RESP.SUCCESS.WORKSPACE_NAME_UPDATED
     } else if (payload.remove_workspace_image) {
       return RESP.SUCCESS.WORKSPACE_IMAGE_REMOVED
    } else {
      return {};
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function sendDomainsToEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let domains = yield userService.getDomains(logHandler, { email: payload.email });
      if (_.isEmpty(domains)) {
        throw new Error("No Domain Found");
      }
      let html = "";
      _.each(domains, (row) => {
        let firstLetter = row.domain[0].toUpperCase();
        html += `<tr>
                    <td style="height: 40px; width: 40px;">
                        <div class="img" style="font-size: 20px; font-family: 'Lato', sans-serif;text-align:center;vertical-align:middle;display:table-cell;
                        color: #ffffff; font-weight:400; height: 40px; width: 40px; border-radius: 4px; background-color: #6380E0">
                            ${firstLetter}
                        </div>
                    </td>
                    <td>
                        <div style="font-family: 'Lato', sans-serif;font-size: 20px;margin-left:10px;">
                            ${row.domain}
                        </div>
                    </td>
                </tr>`;
      });

      // sending email using mailgun
      sendEmail(
        constants.emailType.SEND_DOMAINS_TO_EMAIL,
        {
          html: html
        }, payload.email, "You have been requested to send domains to your email ", "Send Domains"
      );
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function switchWorkspace(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let userInfo = payload.userInfo;
      payload.device_details = commonFunctions.objectStringify(payload.device_details);

      let localObj = {
        user_id: userInfo.user_id,
        workspace_id: payload.workspace_id,
        device_type: payload.device_type,
        token: payload.token || null,
        device_id: payload.device_id,
        device_details: payload.device_details
      };
      yield userService.insertOrUpdateDevicesDetails(logHandler, localObj);
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


async function createWorkspace(logHandler, payload) {
  try{
   let userInfo = payload.userInfo;
   let error = {};
   let result = await workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain") });
   if (_.isEmpty(result)) {
     throw new Error("Can not create workspace.")
   }

   let properties = JSON.parse(result[0].properties);
   if (!properties.is_create_workspace_enabled){
     error= new Error('You are not allowed to create a workspace')
     error.errorResponse = RESP.ERROR.eng.ACCESS_DENIED;
     throw error;
   }

   if (!userInfo.auth_user_id && userInfo.contact_number) {
     registerUser(logHandler, userInfo);
   }
  // check if Already workspace Created
  payload.workspace = payload.workspace_name.replace(/ /g, '-').replace(/\./g, '').replace(/\_/g, '').replace(/[^\w\s]/gi, '').replace(/\u00a0/g, "").toLowerCase()
  payload.domain  = payload.domain || config.get("baseDomain")
  payload.create_workspace= true
  let domainsDetails = await workspaceService.getWorkspaceDetails(logHandler, payload);
  if (!_.isEmpty(domainsDetails)) {
    error = new Error("Workspace already exists");
    error.errorResponse = RESP.ERROR.eng.DOMAIN_ALREADY_ALLOCATED;
    throw error;
  }

  let [workspaceAppInfo] = await workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

  const app_secret_key = md5(userInfo.email + Math.random());
  const hrm_api_key = md5(app_secret_key + Math.random() + payload.workspace_name + new Date().getTime().toString());
  let insertObj = {
    email: userInfo.email,
    workspace: payload.workspace,
    workspace_name: payload.workspace_name,
    domain_id: result[0].id,
    app_name: workspaceAppInfo.app_name,
    fav_icon: workspaceAppInfo.fav_icon,
    logo: workspaceAppInfo.logo,
    colors: workspaceAppInfo.colors,
    status: constants.allowedWorkspaceStatus.ENABLED,
    fugu_secret_key: app_secret_key,
    hrm_api_key
  };
  payload.domain_id = result[0].id;
  payload.properties = JSON.parse(workspaceAppInfo.properties);
  // create business
  let createWorkspace = await workspaceService.insertNew(logHandler, insertObj);

  insertObj.userId = userInfo.user_id;
  insertObj.access_token = userInfo.access_token;

  let insertUserDetails = {
    user_unique_key: userInfo.user_id,
    workspace_id: createWorkspace.workspace_id,
    user_image: userInfo.user_image,
    full_name: userInfo.full_name,
    emails: userInfo.email,
    contact_number: userInfo.contact_number,
    user_type: constants.userType.CUSTOMER,
    role: constants.userRole.OWNER,
    original_image: userInfo.original_image
  };

  if(userInfo.user_image) {
    try {
      let fileName = './uploads/' + UniversalFunc.generateRandomString(10) + "_" + (new Date()).getTime()

      await Promise.promisify(commonFunctions.downloadFile).call(null, userInfo.user_image, fileName);

      let file = {};

      file.originalname = fileName + '.jpg'
      file.mimetype = 'image/jpg'
      file.path = fileName
      // payload.file.mimetype=   'image/jpg'
      let thumbnailUrl = await utilityService.createThumbnailFromImage(logHandler, { file: file }, constants.image_100x100);
      let image50x50 = await utilityService.createThumbnailFromImage(logHandler, { file: file }, constants.image_50x50);

      insertUserDetails.image_100x100 = thumbnailUrl.url;
      insertUserDetails.image_50x50 = image50x50.url
    }catch  (e) {
      console.error(">>>",e);
    }
  }

  let workspaceInfo = [];
  workspaceInfo.push({ fugu_secret_key: app_secret_key, app_name: workspaceAppInfo.app_name });

  workspaceInfo[0].en_user_id ? insertUserDetails.fugu_user_id = commonFunctions.decryptText(workspaceInfo[0].en_user_id) : 0;

  let insertBotUserDetails = {
    user_unique_key: "im4fcyak5",
    workspace_id: createWorkspace.workspace_id,
    user_image: constants.defaultBotImage[result[0].id],
    full_name: constants.defaultBotName[result[0].id] + " Bot",
    contact_number: '',
    original_image: constants.defaultBotImage[result[0].id],
    role: constants.userRole.USER,
    user_type: constants.userType.FUGU_BOT,
    // fugu_user_id: workspaceInfo[0].fugu_bot_user_id,
    status: constants.status.ENABLED
  }

  await userService.insertUserDetails(logHandler, insertBotUserDetails);

  if (payload.properties.is_self_chat_enabled) {
    let selfBot = {
      user_unique_key: "imfaFIU2407",
      workspace_id   : createWorkspace.workspace_id,
      user_image     : constants.fuguSupportImageURL,
      original_image : constants.fuguSupportImageURL,
      full_name      : "Self Bot",
      contact_number : '',
      user_type      : constants.userType.SELF_BOT,
      role           : constants.userRole.USER,
      status         : constants.status.ENABLED
    }
    await userService.insertUserDetails(logHandler, selfBot);
  }
  //default conference Bot
  if(payload.properties.conference_link){
    let insertConferneceBotDetails = {
      user_unique_key: "im4fcyak513",
      workspace_id: createWorkspace.workspace_id,
      user_image: constants.CONFERENCE_BOT_IMAGE,
      full_name: "Conference Bot",
      contact_number: '',
      original_image: constants.CONFERENCE_BOT_IMAGE,
      role: constants.userRole.USER,
      user_type: constants.userType.CONFERENCE_BOT,
      status: constants.status.ENABLED
    }

    await userService.insertUserDetails(logHandler, insertConferneceBotDetails);
    await bot.insertOrUpdateApp(logHandler,{workspace_id: createWorkspace.workspace_id, app_id: constants.AppIdCheck.VIDEO_CONFERENCE, app_state: constants.appState.ACTIVE});
  }

  // update app secret key of fugu

  const fuguUserObj = await userService.insertUserDetails(logHandler, insertUserDetails);
  updateWorkspaceInfo = {
    fugu_secret_key: app_secret_key,
    default_manager_fugu_user_id: fuguUserObj.insertId,
    where_clause: {
      workspace_id: createWorkspace.workspace_id
    }
  };
  payload.tookan_user_id ? updateWorkspaceInfo.tookan_user_id = payload.tookan_user_id : 0;

  await workspaceService.updateInfo(logHandler, updateWorkspaceInfo);
  payload.device_details = commonFunctions.objectStringify(payload.device_details);

  let workspaceProperties = await workspaceService.getConfiguration(logHandler, insertObj.workspace_id);

  let response = {
    workspace_id            : insertObj.workspace_id,
    user_image              : userInfo.user_image,
    email                   : userInfo.email,
    contact_number          : userInfo.contact_number,
    full_name               : userInfo.full_name || '',
    workspace_name          : payload.workspace_name,
    fugu_secret_key         : app_secret_key,
    workspace               : payload.workspace,
    role                    : constants.userRole.OWNER,
    en_user_id              : commonFunctions.encryptText(fuguUserObj.insertId),
    fugu_user_id            : fuguUserObj.insertId,
    user_channel            : commonFunctions.getSHAOfObject(userInfo.user_id),
    config                  : {},
    restricted_email_domains: constants.disallowWorkspaceEmail
  };

  commonFunctions.addAllKeyValues(workspaceProperties, response.config);

  payload.workspace_id = insertObj.workspace_id;
  payload.fugu_user_id = fuguUserObj.insertId;
  payload.workspaceInfo = userInfo;
  payload.full_name = userInfo.full_name;
  payload.domain_id = result[0].id;

  if(result[0].id != 12) {
    userService.createChannelsWithBots(logHandler, payload);
    channelService.addUserToGeneralChat(logHandler, { workspace_id: insertObj.workspace_id, user_id: fuguUserObj.insertId, app_name: workspaceAppInfo.app_name, domain_id: payload.domain_id});
  }

  return response;
 }catch(error){
   return false;
 }
}

function addPublicEmailDomain(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceInfo = payload.workspaceInfo;
      if (_.isEmpty(workspaceInfo)) {
        throw new Error("Invalid Workspace Id");
      }
      if (workspaceInfo.role != constants.userRole.OWNER && workspaceInfo.role != constants.userRole.ADMIN) {
        throw new Error("Un-authorized");
      }

      let disAllowedEmailSet = new Set(constants.disallowWorkspaceEmail);
      if (payload.email_domain.indexOf('@') > -1 || disAllowedEmailSet.has(payload.email_domain)) {
        throw new Error("Invalid Data!");
      }
      yield workspaceService.editConfiguration(logHandler, { workspace_id: payload.workspace_id, signup_mode: constants.signUpMode.EMAIL });
      yield workspaceService.insertPublicEmailDomain(logHandler, { workspace_id: payload.workspace_id, email_domain: payload.email_domain, status: constants.allowedWorkspaceStatus.ENABLED })
      if(payload.add_email_domains){
        return RESP.SUCCESS.BUSINESS_SIGNUP_MODE
      } else {
        return {};
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function editPublicEmailDomain(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceInfo = payload.workspaceInfo;
      if (_.isEmpty(workspaceInfo)) {
        throw new Error("Invalid Workspace Id");
      }

      if (workspaceInfo.role != constants.userRole.OWNER && workspaceInfo.role != constants.userRole.ADMIN) {
        throw new Error("Un-authorized");
      }

      yield workspaceService.editConfiguration(logHandler, { workspace_id: payload.workspace_id, signup_mode: constants.signUpMode.EMAIL });
      yield workspaceService.editPublicEmailDomains(logHandler, { workspace_id: payload.workspace_id, add_email_domains: payload.add_email_domains });
      if(payload.add_email_domains){
        return RESP.SUCCESS.BUSINESS_SIGNUP_MODE
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function getPublicEmailDomains(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceInfo = payload.workspaceInfo;
      if(!workspaceInfo) {
        throw new Error("Invalid workspace")
      }
      if (workspaceInfo.role == constants.userRole.USER) {
        throw new Error("Un-authorized!");
      }

      let result = yield workspaceService.getPublicEmailDomains(logHandler, { workspace_id: workspaceInfo.workspace_id });
      return { public_email_domains: result };
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function getOpenAndInvited(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let result = {};
      let userInfo = payload.userInfo;
      let [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
      yield userService.getUserAllInfo(logHandler, { user_id: userInfo.user_id, email: userInfo.email, contact_number: userInfo.contact_number, domain: workspaceAppInfo.domain }, result);
      let domainDetails = yield workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain") });
      if (!_.isEmpty(domainDetails)) {
        const whitelabel_properties = JSON.parse(domainDetails[0]["properties"]);
        return { invitation_to_workspaces: result.invitation_to_workspaces, open_workspaces_to_join: result.open_workspaces_to_join, whitelabel_properties: whitelabel_properties };
      } else {
        return { invitation_to_workspaces: result.invitation_to_workspaces, open_workspaces_to_join: result.open_workspaces_to_join };
      }
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function getPublicInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let token;
      let user_already_exist = false;
      let businessDetails = yield workspaceService.getInfo(logHandler, { workspace: payload.workspace });
      if (_.isEmpty(businessDetails)) {
        throw new Error("Invalid space " + payload.workspace);
      }

      // public invite
      let businessProperties = yield workspaceService.getConfiguration(logHandler, businessDetails[0].workspace_id);
      let public_invite_enabled = (businessProperties.enable_public_invite == constants.propertyStatus.ENABLED);
      let workspace_registered_users = 0;
      if (public_invite_enabled) {
        let businessActiveUsers = yield userService.getAllActiveUsers(logHandler, businessDetails[0].workspace_id);
        workspace_registered_users = businessActiveUsers[0].registered_users;
        if(payload.user_unique_key){
          let checkUserAlreadyExists = yield workspaceService.getActiveUserInWorkspace(logHandler,{user_unique_key: payload.user_unique_key, workspace_id: businessDetails[0].workspace_id});
          if(checkUserAlreadyExists.length){
            if(checkUserAlreadyExists[0].status == constants.userStatus.DISABLED || checkUserAlreadyExists[0].status == constants.userStatus.LEFT){
              throw new Error("You're disabled in this space, please contact space admin!");
            }else if(checkUserAlreadyExists[0].status == constants.userStatus.INVITED){
              let obj = {
                workspace_id: checkUserAlreadyExists[0].workspace_id,
                email       : checkUserAlreadyExists[0].emails,
                contact_number: checkUserAlreadyExists[0].contact_number
              }
              let invitation_details = yield userService.getUserInvitationToken(logHandler, obj);
              if(invitation_details.length){
                token = invitation_details[0].invitation_token;
              }
            }else{
              user_already_exist = true;
            }
          }else{
            let getUserDetails = yield userService.getInfo(logHandler,{user_id: payload.user_unique_key});
            if(getUserDetails.length){
              token =  commonFunctions.generateToken();
              let emailTokenMap = {};
              emailTokenMap[getUserDetails[0].email] = {
               contact_number: getUserDetails[0].contact_number,
               email: getUserDetails[0].email,
              status: constants.invitationStatus.NOT_EXPIRED,
              token : token,
              invited_by: 0
              }
             yield userService.saveInvitedUsers(logHandler,{ workspace_id: businessDetails[0].workspace_id, emailTokenMap});
          }
       }
      }
    }
      // open domains
      let getPublicEmailDomains = yield workspaceService.getPublicEmailDomain(logHandler, { workspace_id: businessDetails[0].workspace_id });
      let openEmailDomains = [];
      _.each(getPublicEmailDomains, (emailDomainDetail) => {
        openEmailDomains.push(emailDomainDetail.email_domain);
      });
      return {
        public_invite_enabled: public_invite_enabled,
        registered_users: workspace_registered_users,
        open_email_domains: openEmailDomains,
        workspace_name: businessDetails[0].workspace,
        user_already_exist: user_already_exist,
        invitation_token: token
      };
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function publicInvite(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceDetails = yield workspaceService.getPublicWorkspaceDetails(logHandler, { workspace: payload.workspace });
      if (_.isEmpty(workspaceDetails)) {
        throw new Error("Invalid workspace");
      }
      if (payload.invitation_type == constants.inviationType.ALREADY_INVITED) {
        throw new Error("Can't send a invite to already invited user");
      }

      // public invite
      if (payload.invitation_type == constants.inviationType.PUBLIC_INVITATION) {
        let businessProperties = yield workspaceService.getConfiguration(logHandler, workspaceDetails[0].workspace_id);
        if (businessProperties.enable_public_invite != constants.propertyStatus.ENABLED) {
          throw new Error("Public Invite Disabled");
        }
      }

      // open invite
      if (payload.invitation_type == constants.inviationType.OPEN_INVITATION) {
        let getPublicEmailDomains = yield workspaceService.getPublicEmailDomain(logHandler, { workspace_id: workspaceDetails[0].workspace_id });
        let openEmailDomainsSet = new Set();
        _.each(getPublicEmailDomains, (emailDomainDetail) => {
          openEmailDomainsSet.add(emailDomainDetail.email_domain);
        });
        let domain = payload.email.split("@")[1];
        if (!openEmailDomainsSet.has(domain)) {
          throw new Error("Open Invite not allowed for @" + domain);
        }
      }


      // invite user
      let ownerEmail = yield userService.getOwner(logHandler, { workspace_id: workspaceDetails[0].workspace_id });
      if (!ownerEmail.length) {
        throw new Error("No active owner found");
      }
      let userInfo = yield userService.getUserDetails(logHandler, { email: ownerEmail[0].email, workspace_id: workspaceDetails[0].workspace_id });
      let inviteUserPayload = {
        emails: [payload.email] ,
        system_invite: true,
        loginObj: {},
        email_credentials: workspaceDetails[0].email_credentials
      };
      if(payload.contact_number){
        inviteUserPayload.contact_numbers = [{contact_number: payload.contact_number, country_code: payload.country_code}];
        delete inviteUserPayload.emails;
      }
      inviteUserPayload.invitation_type = payload.invitation_type;
      inviteUserPayload.workspace_id = workspaceDetails[0].workspace_id;
      inviteUserPayload.workspaceInfo = workspaceDetails[0];
      inviteUserPayload.userInfo = userInfo[0];
      logger.trace(logHandler, "ongoing data from public invite to invite user!", inviteUserPayload);
      yield UserController.inviteUser(logHandler, inviteUserPayload);
      return {email: payload.email};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function joinWorkspace(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let workspace_id = payload.workspace_id;
    let workspaceInfo = payload.workspaceInfo;
    let workspace_details;

    if (workspaceInfo && workspaceInfo.status == constants.allowedWorkspaceStatus.DISABLED) {
      throw new Error("Workspace is disabled");
    }
    if (payload.invitation_type == constants.inviationType.OPEN_INVITATION){
      workspace_details  = yield workspaceService.getWorkspaceDetailsWithDomain(logHandler, {workspace_id});
    }
    // already invited
    let userData = {};
    if (payload.invitation_type == constants.inviationType.ALREADY_INVITED) {
      userData = yield userService.verifyUser(logHandler, { email_token: payload.email_token });
      if (_.isEmpty(userData)) {
        throw new Error(RESP.ERROR.eng.EMAIL_TOKEN_NOT_VERIFIED.customMessage);
      }
      userData = userData[0];

      if (userData.status == constants.invitationStatus.REVOKED) {
        throw new Error("Your invitation has been revoked.");
      }
      let workspaceResult = yield businessService.getInfo(logHandler, { workspace_id: userData.workspace_id });
      if (workspaceResult.status == constants.allowedWorkspaceStatus.DISABLED) {
        throw new Error("Workspace is disabled!");
      }

      yield userService.markInvitedUserAsUser(logHandler, { email: userData.email, contact_number: userData.contact_number, workspace_id: userData.workspace_id });
      workspaceInfo = workspaceResult;
      workspace_id = workspaceInfo.workspace_id;
    }

    // open invites
    if (payload.invitation_type == constants.inviationType.OPEN_INVITATION) {
      if (!workspace_id) {
        throw new Error("Insufficient information supplied workspace_id");
      }
      let publicEmailDomain = yield workspaceService.getPublicEmailDomains(logHandler, { workspace_id: workspace_id });
      if (_.isEmpty(publicEmailDomain)) {
        throw new Error("No Public Email Domain Found!");
      }
      workspaceInfo = publicEmailDomain[0];
      workspaceInfo.properties = workspace_details[0].properties;
      payload.workspaceInfo = workspaceInfo;
      // let getPublicEmailDomains = yield workspaceService.getPublicEmailDomain(logHandler, { workspace_id: workspace_id });
      let openEmailDomainsSet = new Set();
      _.each(publicEmailDomain, (emailDomainDetail) => {
        openEmailDomainsSet.add(emailDomainDetail.email_domain);
      });
      let domain = userInfo.email.split("@")[1];
      if (!openEmailDomainsSet.has(domain)) {
        throw new Error("Open Invite not allowed for @" + domain);
      }
    }

    let insertUserDetails = {
      user_unique_key: userInfo.user_id,
      workspace_id   : workspace_id,
      user_image     : userInfo.user_image,
      contact_number : userInfo.contact_number,
      full_name      : userInfo.full_name,
      original_image : userInfo.original_image || "",
      user_type      : constants.userType.CUSTOMER
    };

    if (userData.type == constants.userRole.GUEST) {
      insertUserDetails.guest_id = userData.id;
      insertUserDetails.role = constants.userRole.GUEST;
      insertUserDetails.user_type = constants.userType.GUEST;
    }
    userInfo.email ? insertUserDetails.email = userInfo.email : 0;
    let workspaceDataForPutUser = [{ fugu_secret_key: workspaceInfo.fugu_secret_key }];
    payload.status = constants.getFuguUserStatus[constants.userStatus.ENABLED];


    if (workspaceInfo.default_manager_fugu_user_id) {
      getManagerDetails = yield userService.getUserInfo(logHandler, { fugu_user_id: workspaceInfo.default_manager_fugu_user_id, workspace_id: workspaceInfo.workspace_id });
      insertUserDetails.manager = getManagerDetails[0].full_name;
      insertUserDetails.manager_fugu_user_id = workspaceInfo.default_manager_fugu_user_id;
    }

    workspaceDataForPutUser[0].en_user_id ? insertUserDetails.fugu_user_id = commonFunctions.decryptText(workspaceDataForPutUser[0].en_user_id) : 0;

    if (userData.type != constants.userRole.GUEST) {
      updateUserBillingPlan(logHandler, { fugu_user_id: insertUserDetails.fugu_user_id, status: constants.status.ENABLED, workspace_id: workspaceInfo.workspace_id });
    }
    const checkUserAlreadyExists = yield userService.getWorkspaceUser(logHandler, { user_unique_key: userInfo.user_id, workspace_id });

    const fuguObj = yield userService.insertUserDetails(logHandler, insertUserDetails);

    const data = {
      fugu_user_id: fuguObj.insertId,
      workspace_id: workspace_id,
      workspaceInfo,
      full_name: userInfo.full_name,
      email: userInfo.email,
      checkUserAlreadyExists: !!checkUserAlreadyExists.length,
      domain_id : payload.workspaceInfo.domain_id,
      properties: commonFunctions.jsonToObject(logHandler, workspaceInfo.properties)
    };

    if (workspaceInfo.domain_id != 12) {
      userService.createChannelsWithBots(logHandler, data);
    }
    if (userData.type != constants.userRole.GUEST && !checkUserAlreadyExists.length && payload.workspaceInfo.domain_id != 12)  {
      // if needed, use the business config key to restrict general chat space wise
      channelService.addUserToGeneralChat(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: fuguObj.insertId, app_name: payload.app_name, domain_id: workspaceInfo.domain_id});
    }
    let workspaceProperties = yield workspaceService.getConfiguration(logHandler, insertUserDetails.workspace_id);
    let response = {
      workspace_id   : workspace_id,
      user_image     : userInfo.user_image,
      contact_number : userInfo.contact_number,
      email          : userInfo.email,
      full_name      : userInfo.full_name || '',
      workspace_name : payload.workspace_name,
      fugu_secret_key: workspaceInfo.fugu_secret_key,
      workspace      : payload.workspace,
      role           : constants.userRole.USER,
      config         : workspaceProperties,
      en_user_id     : commonFunctions.encryptText(data.fugu_user_id),
      fugu_user_id   : data.fugu_user_id ? parseInt(data.fugu_user_id): data.fugu_user_id,
      user_channel   : commonFunctions.getSHAOfObject(data.fugu_user_id)
    };

    return response;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  }, (error) => {
      console.error("------>", error)
    UniversalFunc.sendError(error, res);
  });
}

function getAllMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let response = {};
      payload.page_start = parseInt(payload.page_start);
      payload.page_end = constants.getAllMembersPageSize;

      if(!payload.workspaceInfo) {
        throw new Error("Invalid workspace")
      }

      if (payload.page_start == 0) {
        let allMembers = yield workspaceService.getWorkSpaceUserCount(logHandler, { workspace_id: payload.workspace_id, status: [constants.status.ENABLED], guest_allowed: payload.all_guest_included, noBotUsers: true });
         response.user_count = allMembers.length ?  allMembers[0].user_count : 0;
        let total_guest_users = yield workspaceService.getGuestUsersData(logHandler, { workspace_id: payload.workspace_id, all_user: true });
        let guest_user_count = 0;
        let  totalDeactivatedGuestUsers = 0;
        for(let i = 0; i < total_guest_users.length; i++){
            if(total_guest_users[i].status == constants.userStatus.LEFT || total_guest_users[i].status == constants.userStatus.DISABLED){
              totalDeactivatedGuestUsers += 1;
            }else{
               guest_user_count += 1;
            }
        }
        response.guest_user_count = guest_user_count
        response.totalDeactivatedGuestUsers = totalDeactivatedGuestUsers
      };

     if(payload.user_type == constants.getMembers.PENDING || payload.user_type == constants.getMembers.ACCEPTED) {
      if (payload.page_start == 0) {
      let total_users = yield workspaceService.getInvitedUsers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_type == constants.getMembers.PENDING ? [constants.invitationStatus.NOT_EXPIRED, constants.invitationStatus.RE_INVITED] :  constants.invitationStatus.EXPIRED  });
      response.user_count = total_users.length;
      }
      let members = yield workspaceService.getInvitedUsers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_type == constants.getMembers.PENDING ?  [constants.invitationStatus.NOT_EXPIRED, constants.invitationStatus.RE_INVITED]  :  constants.invitationStatus.EXPIRED   , page_start: payload.page_start, page_end: payload.page_end });
      payload.user_type == constants.getMembers.PENDING ?  response.pending_members = members :  response.accepted_members = members ;
    }


      if (payload.user_type == constants.getMembers.GUEST_USERS || payload.invitation_type == constants.inviteType.GUEST || payload.user_type == constants.getMembers.GUEST_DEACTIVATED_USERS){
        let guest_users = yield workspaceService.getGuestUsersData(logHandler, { workspace_id: payload.workspace_id, page_start: payload.page_start, page_end: payload.page_end , status :  (payload.user_type == constants.getMembers.GUEST_DEACTIVATED_USERS) ? constants.getMembers.DEACTIVATED_MEMBERS : ''});
        response.guest_users = guest_users
      }


      if ((payload.user_type == constants.getMembers.ALL_MEMBERS || payload.user_type == constants.getMembers.DEFAULT)) {
        if (payload.user_status == constants.status.ENABLED) {
          payload.user_status = [constants.status.ENABLED, constants.status.INVITED];
        }

        if (payload.workspaceInfo.role == constants.userRole.GUEST) {
          let allGuest = yield workspaceService.getGuestAllUsers(logHandler, { fugu_user_id: payload.workspaceInfo.fugu_user_id });
          if (!_.isEmpty(allGuest)) {
            if (allGuest[0].user_ids_to_connect) {
              let users = JSON.parse(allGuest[0].user_ids_to_connect);
              let total_members = yield userService.getUserInfo(logHandler, { fugu_user_id: users, workspace_id: payload.workspace_id, noBotUsers: true });
              response.all_members = yield userService.getUserInfo(logHandler, { fugu_user_id: users, workspace_id: payload.workspace_id, page_start: payload.page_start, page_end: payload.page_end, noBotUsers: true });
              response.user_count = (total_members).length
            }
          }
        } else if (payload.include_user_guests) {
           let allMembers             = yield workspaceService.getAllMembers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, guest_allowed: payload.all_guest_included, noBotUsers: true, user_id: payload.workspaceInfo.fugu_user_id, user:true, userId: payload.workspaceInfo.user_id});
           let membersWithGuest       = yield workspaceService.getAllMemberWithGuest(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, guest_allowed: payload.all_guest_included, noBotUsers: true, user_id: payload.workspaceInfo.fugu_user_id});
           allMembers = allMembers.concat(membersWithGuest);
           let limitedMembers = allMembers.slice(payload.page_start, payload.page_start + payload.page_end);
           response.all_members = limitedMembers;
          if (payload.page_start == 0) {
            response.user_count = allMembers.length + 1;
            let userData = yield workspaceService.getUserWorkspaceData(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, guest_allowed: payload.all_guest_included, noBotUsers: true,  fugu_user_id: payload.workspaceInfo.user_id });
            (response.all_members).unshift(userData[0])        //response.all_members = response.all_members.concat(userData)
          }
        } else {
          let guests = [];
          if (!payload.all_guest_included) {
            // let guestUsers = yield userService.getWorkspaceUsersInfo(logHandler, { role: constants.userRole.GUEST, workspace_id: payload.workspace_id, page_start: payload.page_start, page_end: payload.page_end });
            // if(guestUsers.length) {
            //   let guestUsersId = guestUsers.map(x => x["fugu_user_id"]);
            //   if(guestUsersId.length) {
            //     guests = yield userService.getGuestUsersToConnect(logHandler, { guest_to_connect : guestUsersId, fugu_user_id : payload.workspaceInfo.fugu_user_id });
            //   }
            // }
            guests = yield userService.getGuestUsersToConnectWith(logHandler, { fugu_user_id: payload.workspaceInfo.fugu_user_id, workspace_id: payload.workspace_id })
          }
          if(payload.user_status && payload.user_status.includes(constants.status.ENABLED)) {
            payload.user_status =  [constants.status.ENABLED]
          }

          if (payload.page_start == 0) {
            let allMembersLength = yield workspaceService.getWorkSpaceUserCount(logHandler, { workspace_id: payload.workspace_id, status: [constants.status.ENABLED]  , guest_allowed: payload.all_guest_included, noBotUsers: true });
            response.user_count = allMembersLength.length ? allMembersLength[0].user_count : 0;
          }

          let allMembers = yield workspaceService.getWorkspaceUsers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, guest_allowed: payload.all_guest_included, page_start: payload.page_start, page_end: payload.page_end, noBotUsers: true, userId: payload.workspaceInfo.user_id });
          response.all_members = allMembers

          if (payload.page_start == 0) {
            let userData = yield workspaceService.getUserWorkspaceData(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, guest_allowed: payload.all_guest_included, noBotUsers: true, fugu_user_id: payload.workspaceInfo.user_id });
            (response.all_members).unshift(userData[0])
            //response.all_members = response.all_members.concat(userData)
          }
        }
      }

      if (payload.page_start == 0) {
        let deactivatedMemberCount = yield workspaceService.getWorkspaceDeactivatedMembers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status });
        response.deactivatedMemberCount = deactivatedMemberCount.length
      }

      if (payload.user_type == constants.getMembers.DEACTIVATED_MEMBERS) {
          let deactivatedMembers = yield workspaceService.getWorkspaceDeactivatedMembers(logHandler, { workspace_id: payload.workspace_id, status: payload.user_status, page_start: payload.page_start, page_end: payload.page_end, guestUsers: payload.guestDeactivatedUsers })
        response.all_members = deactivatedMembers
       return response
      }

      if ((payload.user_type == constants.getMembers.INVITED_MEMBERS || payload.user_type == constants.getMembers.DEFAULT)) {
        response.invited_users = yield workspaceService.getInvitedUsers(logHandler, { workspace_id: payload.workspace_id, status: payload.invitation_status, page_start: payload.page_start, page_end: payload.page_end });
      }


      response.get_all_member_page_size = constants.getAllMembersPageSize;
      return response;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getInvitedUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let userInfo = payload.userInfo;
      let workspaceInfo = payload.workspaceInfo;

      if (_.isEmpty(workspaceInfo)) {
        throw new Error("Invalid Workspace Id!");
      }

      if (workspaceInfo.config.any_user_can_invite == 0 && userInfo.role == constants.userRole.USER) {
        throw new Error("Access Denied");
      }

      let invitedUsers = yield workspaceService.getInvitedUsers(logHandler, { workspace_id: payload.workspace_id });
      return { invited_users: invitedUsers };
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function leave(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let userInfo = payload.userInfo;
      let workspaceInfo = payload.workspaceInfo;
      if (workspaceInfo.role == constants.userRole.OWNER) {
        throw new Error("Owner can't exit the workspace");
      }
      if (workspaceInfo.config.enable_public_invite == constants.propertyStatus.DISABLED) {
        throw new Error("You only exit open community");
      }
      let userDetails = yield userService.getUserInfo(logHandler, { email: userInfo.email, contact_number: userInfo.contact_number, workspace_id: payload.workspace_id });
      if (_.isEmpty(userDetails)) {
        throw new Error("User does not exist");
      }
      let opts = {};
      opts.user_id = userDetails[0].user_id;
      opts.status = constants.userStatus.LEFT;
      opts.workspace_id = payload.workspace_id;
      yield userService.updateUserDetails(logHandler, opts);
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}


function getWorkspaceDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let result = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain, workspace_id: payload.workspace_id, hrm_api_key : payload.hrm_api_key });
      delete result[0].google_creds;
      delete result[0].email_credentials;

      for (let data of result) {
        if (data.colors) {
          data.colors = JSON.parse(data.colors);
        }
        if (data.properties) {
          data.properties = JSON.parse(data.properties);
        }
      }
      return result;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}



function registerUser(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {

      let userObj = {
        source              : payload.source           || "",
        medium              : payload.medium           || "",
        previous_page       : payload.previous_page    || "",
        referrer            : payload.referrer         || "",
        utm_lead            : payload.utm_lead         || "",
        web_referrer        : payload.web_referrer     || "",
        old_source          : payload.old_source       || "",
        old_medium          : payload.old_medium       || "",
        incomplete          : payload.incomplete       || "",
        vertical            : payload.vertical         || "",
        ad_campaign_name    : payload.ad_campaign_name || "",
        vertical_page       : payload.vertical_page    || "",
        gclid               : payload.gclid            || "",
        utm_term            : payload.utm_term         || "",
        utm_campaign        : payload.utm_campaign     || "",
        old_utm_campaign    : payload.old_utm_campaign || "",
        terms_and_conditions: 1
      };

      let options = {
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.REGISTER_USER,
        method: 'POST',
        json: {
          email             : payload.email,
          username          : payload.email,
          first_name        : payload.full_name || payload.name,
          password          : payload.password,
          phone             : payload.contact_number.replace('-','') || payload.phone || "",
          timezone          : payload.timezone || "-330",
          country_phone_code: payload.country_phone_code || "IN",
          offering          : 15,
          company_address   : constants.SERVER_AUTH_CONSTANTS.COMPANY_ADDRESS,
          company_latitude  : constants.SERVER_AUTH_CONSTANTS.LATITUDE,
          company_longitude : constants.SERVER_AUTH_CONSTANTS.LONGITUDE,
          ipconfig          : {
            country_code: payload.country_code || "IN",
            continent_code: payload.continent_code || "AS",
            region_code   : payload.region_code || "IN"
          },
          auth_key   : config.get("authKey"),
          productname:  payload.productname,
          lead_allocation: payload.lead_allocation
        }
      };
      Object.assign(options.json, userObj);
      let authServerResponse = yield utilityService.sendHttpRequest(logHandler, options);

      if (authServerResponse.status == RESP.SUCCESS.DEFAULT.statusCode) {

        let updateObj = {
          user_id: payload.user_id,
          auth_user_id: authServerResponse.data.user_id
        };
        yield userService.updateInfo(logHandler, updateObj);

        let options = {
          method: 'POST',
          url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.UPDATE_USER_DETAILS,
          json: {
            user_id: authServerResponse.data.user_id,
            updates: { password: payload.password },
            auth_key: config.get("authKey"),
            offering: 15
          }
        };
        yield utilityService.sendHttpRequest(logHandler, options);
        // redis.set(payload.user_id, 1);
      } else if (authServerResponse.status == 701) {
        updateAuthUser(logHandler, { email: payload.email, user_id: payload.user_id });
      }
      if (authServerResponse.status != 200) {
        logger.error(logHandler, authServerResponse);
      }

      return {}

        ;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


async function updateAuthUser(logHandler, payload) {
  //  let allOwners = await workspaceService.getAllOwners(logHandler);
  let options = {
    method: 'POST',
    url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
    json: {
      field_names: "first_name, access_token, password, email,user_id",
      email: payload.email,
      auth_key: config.get("authKey"),
      offering: 15
    }
  };
  let response = await utilityService.sendHttpRequest(logHandler, options);
  if (response.status == 200) {
    let updateObj = {
      user_id: payload.user_id,
      auth_user_id: response.data[0].user_id
    };
    await userService.updateInfo(logHandler, updateObj);
  }
}

async function signupV2(logHandler, payload) {
  payload.email ? payload.email = payload.email.trim().toLowerCase() : 0;
  payload.phone ? payload.phone = payload.phone.trim() : 0;

  let contactNumber = payload.phone;
  contactNumber = UniversalFunc.formatPhoneNumber(contactNumber)
  contactNumber[0] == "+" ? 0 : contactNumber = "+" + contactNumber;
  contactNumber = phoneUtil.parse(contactNumber);
  contactNumber = phoneUtil.format(contactNumber, phone.PhoneNumberFormat.INTERNATIONAL);
  contactNumber = contactNumber.replace(" ", "-");
  contactNumber = contactNumber.split(" ").join("");
  contactNumber.split(" ").join("-");
  payload.contact_number = contactNumber;
  if (payload.phone) {
    let checkIfUserContactNumberExists = await userService.getInfo(logHandler, { contact_number: contactNumber });
    if (!_.isEmpty(checkIfUserContactNumberExists)) {
      let resObj = RESP.ERROR.eng.PHONE_NUMBER_ALREADY_EXIST
      throw resObj;
    }
  }
  if(payload.ipconfig){
    payload.country_code   = payload.ipconfig.country_code;
    payload.continent_code = payload.ipconfig.continent_code;
    payload.region_code    = payload.ipconfig.region_code;
  }

  let ifAlreadyEmailExists = await userService.getInfo(logHandler, { email: payload.email });

  let result = {};
  if (_.isEmpty(ifAlreadyEmailExists)) {
    let userId = commonFunctions.generateUserId();
    let insertUser = {
      user_id: userId,
      email: payload.email,
      password: md5(payload.password),
      full_name: payload.name,
      contact_number: contactNumber || "",
      access_token: bcrypt.hashSync(payload.email || contactNumber, saltRounds),
      business_usecase   : payload.business_usecase,
      user_status        : constants.UserStatus.REGISTERED
    }

    let token = CryptoJS.AES.encrypt(insertUser.access_token, 'keytoencrypt');
    result.access_token = `${token}`;
    await userService.insertNew(logHandler, insertUser);
    payload.password = md5(payload.password);
    registerUser(logHandler, payload);
    return result;
  } else {
    let resObj = RESP.ERROR.eng.EMAIL_ALREADY_EXIST
    throw resObj;
  }
}


async function googleSignup(logHandler, payload) {

  let [workspaceDetails] = await workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

  workspaceDetails.google_creds = JSON.parse(workspaceDetails.google_creds);

  let REDIRECT_URL;
  if (payload.device_type == constants.enumDeviceType.WEB) {
    REDIRECT_URL = workspaceDetails.google_creds.web_redirect_url;
  } else {
    REDIRECT_URL = workspaceDetails.google_creds.app_redirect_url;
  }

  const oauth2Client = new google.auth.OAuth2(workspaceDetails.google_creds.googleWebClientId, workspaceDetails.google_creds.client_secret, REDIRECT_URL);

  let response = await oauth2Client.getToken(payload.authorized_code);

  let result = {};
  if (!_.isEmpty(response)) {
    const client = new OAuth2Client(workspaceDetails.google_creds.googleWebClientId);
    const ticket = await client.verifyIdToken({ idToken: response.tokens.id_token, audience: [workspaceDetails.google_creds.googleWebClientId, workspaceDetails.google_creds.googleAndroidClientId, workspaceDetails.google_creds.googleIosClientId] });
    const userGoogleDetails = ticket.getPayload();

    if (!_.isEmpty(userGoogleDetails)) {
      let userInfo = await userService.getInfo(logHandler, { email: userGoogleDetails.email });

      let userId;
      if (_.isEmpty(userInfo)) {
        let insertUser = {
          user_id: commonFunctions.generateUserId(),
          email: userGoogleDetails.email,
          password: "",
          full_name: userGoogleDetails.name,
          access_token: bcrypt.hashSync(userGoogleDetails.email, saltRounds),
          onboard_source: constants.onBoardSource.GOOGLE,
          user_status: constants.UserStatus.REGISTERED
        }

        if (userGoogleDetails.picture) {
          let opts = {}
          opts.fileName = "./uploads/" + UniversalFunc.generateRandomString();
          opts.path = opts.fileName
          await Promise.promisify(commonFunctions.downloadFile).call(null, userGoogleDetails.picture, opts.fileName);
          opts.file_type = "image";
          opts.file = opts.fileName;
          opts.originalname = userId + ".jpg";
          let s3_url = await utilityService.uploadFile(logHandler, { file: opts });
          if (s3_url) {
            insertUser.user_image = s3_url.url;
            insertUser.user_thumbnail_image = s3_url.thumbnail_url;
          }
        }

        response.tokens.refresh_token ? insertUser.google_refresh_token = response.tokens.refresh_token : 0;
        userId = insertUser.user_id;
        result.access_token = insertUser.access_token;
        result.onboard_source = insertUser.onboard_source;
        await userService.insertNew(logHandler, insertUser);
        workspaceService.insertSignUpRequest(logHandler,{ email: userGoogleDetails.email, sent_count: 0, is_otp_verified: 1, is_expired: constants.isOtpExpired.YES});
      } else {
        userId = userInfo[0].user_id;
        result.onboard_source = userInfo[0].onboard_source;
        result.access_token = userInfo[0].access_token;
      }

      if (response.tokens.access_token && payload.device_type != "ANDROID") {
        let emailIds = [];
        let url = "https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token={{{user_api_token}}}&max-results=500&v=3.0";
        url = url.replace("{{{user_api_token}}}", response.tokens.access_token);
        let options = {
          url: url,
          method: 'GET',
        };

        let userGoogleData = await utilityService.sendHttpRequest(logHandler, options);

        if (userGoogleData && userGoogleData.feed && userGoogleData.feed.entry) {
          userGoogleData.feed.entry.map((item) => {
            if (item.gd$email) {
              emailIds.push(item.gd$email[0].address);
            }
          });
        }
        let attributes = {
          user_id: userId,
          attributes: {
            invite_emails: emailIds
          }
        }
        response.tokens.refresh_token ? attributes.google_refresh_token = response.tokens.refresh_token : 0;
        userService.updateInfo(logHandler, attributes);
      }
    }
  }
  return result;
}



async function syncGoogleContacts(logHandler, payload) {

  let [workspaceDetails] = await workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

  workspaceDetails.google_creds = JSON.parse(workspaceDetails.google_creds);

  let REDIRECT_URL;
  if (payload.device_type == constants.enumDeviceType.WEB) {
    REDIRECT_URL = workspaceDetails.google_creds.web_redirect_url;
  } else {
    REDIRECT_URL = workspaceDetails.google_creds.app_redirect_url;
  }

  const oauth2Client = new google.auth.OAuth2(workspaceDetails.google_creds.googleWebClientId, workspaceDetails.google_creds.client_secret, REDIRECT_URL);

  let response = await oauth2Client.getToken(payload.authorized_code);

  if (!_.isEmpty(response)) {
    const client = new OAuth2Client(workspaceDetails.google_creds.googleWebClientId);
    const ticket = await client.verifyIdToken({ idToken: response.tokens.id_token, audience: [workspaceDetails.google_creds.googleWebClientId, workspaceDetails.google_creds.googleAndroidClientId, workspaceDetails.google_creds.googleIosClientId] });
    const userGoogleDetails = ticket.getPayload();

    if (!_.isEmpty(userGoogleDetails)) {
      if (response.tokens.access_token) {
        let emailIds = [];
        let url = "https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token={{{user_api_token}}}&max-results=500&v=3.0";
        url = url.replace("{{{user_api_token}}}", response.tokens.access_token);
        let options = {
          url: url,
          method: 'GET',
        };

        let userGoogleData = await utilityService.sendHttpRequest(logHandler, options);

        if (userGoogleData && userGoogleData.feed && userGoogleData.feed.entry) {
          userGoogleData.feed.entry.map((item) => {
            if (item.gd$email) {
              emailIds.push(item.gd$email[0].address);
            }
          });
        }
        userService.updateInfo(logHandler, { user_id: payload.userInfo.user_id, attributes: { invite_emails: emailIds } });
      }
    }
  }
  return {};
}

async function getPaymentDetails(logHandler, payload) {
  let response = {
    user_cards: {}
  };
  if(!payload.workspaceInfo) {
    throw new Error("Invalid workspace")
  }
  if (payload.userInfo.auth_user_id) {
    let options = {
      method: 'POST',
      url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
      json: {
        field_names: "first_name, access_token, password, email,user_id",
        email: payload.userInfo.email,
        auth_key: config.get("authKey"),
        offering: 15
      }
    };
    let userDetails = await utilityService.sendHttpRequest(logHandler, options);

    if (userDetails.status == 200) {
      let getCards = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_CARD,
        json: {
          user_id: payload.userInfo.auth_user_id,
          access_token: userDetails.data[0].access_token,
          auth_key: config.get("authKey"),
          offering: 15
        }
      };
      let userCards = await utilityService.sendHttpRequest(logHandler, getCards);
      if (userCards.status == 200) {
        response.user_cards = userCards.data[0] || {};
      }
    }
  }

  let opts = {
    workspace_id: payload.workspaceInfo.workspace_id,
  };

  if (payload.app_id) {
    opts.app_id = payload.app_id;
    opts.plan_type = constants.planType.SUBSCRIPTION,
      opts.billing_type = constants.billingType.APP,
      response.plan_type = constants.planType.SUBSCRIPTION;
  } else {
    opts.plan_type = constants.planType.PER_USER,
      opts.billing_type = constants.billingType.FUGU,
      response.plan_type = constants.planType.PER_USER;
  }

  response.billing_plans = await workspaceService.getBillingPlans(logHandler, opts);

  if (opts.plan_type == constants.planType.PER_USER) {
    let [active_users] = await userService.getAllActiveUsers(logHandler, payload.workspaceInfo.workspace_id);
    response.active_users = active_users.registered_users;
  }
  return response;
}

async function addUserCards(logHandler, payload) {
  let response = {};
  if (!payload.workspaceInfo) {
    throw new Error("Invalid workspace")
  }

  if (payload.userInfo.auth_user_id) {
    let options = {
      method: 'POST',
      url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
      json: {
        field_names: "first_name, access_token, password, email,user_id",
        email: payload.userInfo.email,
        auth_key: config.get("authKey"),
        offering: 15
      }
    };
    let userDetails = await utilityService.sendHttpRequest(logHandler, options);

    if (userDetails.status == 200) {
      let addCards = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.ADD_USER_CARD,
        json: {
          user_id: payload.userInfo.auth_user_id,
          access_token: userDetails.data[0].access_token,
          auth_key: config.get("authKey"),
          offering: 15,
          payment_method: payload.payment_method
        }
      };
      let userCards = await utilityService.sendHttpRequest(logHandler, addCards);
      if (_.isEmpty(userCards.data)) {
        throw new Error("error occured while adding card.")
      }
    }
  }
  return response;
}


async function buyPlan(logHandler, payload) {

  let [active_users] = await workspaceService.getWorkspaceUsersCount(logHandler, { workspace_id: payload.workspace_id });

  let [billing_plan] = await workspaceService.getBillingPlans(logHandler, payload);

  if (_.isEmpty(billing_plan)) {
    throw new Error("Invalid Plan.");
  }
  let activePlan = await workspaceService.getBusinessActiveTransaction(logHandler, { workspace_id: payload.workspace_id, billing_type: billing_plan.billing_type, app_id: billing_plan.app_id });
  if (activePlan.length) {
    throw new Error("You have a running active plan.")
  }
  let deductableAmount;
  let expireDate = ``;
  if (billing_plan.plan_type == constants.planType.SUBSCRIPTION) {
    deductableAmount = billing_plan.price;
    if (billing_plan.period == constants.billingPeriod.MONTHLY) {
      expireDate = billing_plan.month_last_day;
    } else {
      expireDate = billing_plan.year_last_day;
    }
  } else {
    if (billing_plan.period == constants.billingPeriod.MONTHLY) {
      let now = new Date();
      let numberOfDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      deductableAmount = (billing_plan.price / numberOfDays) * billing_plan.month_remaining_days * active_users.user_count;
      expireDate = billing_plan.month_last_day;
    } else {
      deductableAmount = (billing_plan.price * billing_plan.year_remaining_days * active_users.user_count * 12) / 365;
      expireDate = billing_plan.year_last_day;
    }
  }
  deductableAmount = deductableAmount.toFixed(2);


  if (!payload.userInfo.auth_user_id) {
    throw new Error("Authentication failed.")
  }

  let options = {
    method: 'POST',
    url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
    json: {
      field_names: "first_name, access_token, password, email,user_id",
      email: payload.userInfo.email,
      auth_key: config.get("authKey"),
      offering: 15
    }
  };
  let userDetails = await utilityService.sendHttpRequest(logHandler, options);

  if (userDetails.status == 200) {
    let deductPaymentPayload = {
      method: 'POST',
      url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.MAKE_USER_PAYMENT,
      json: {
        user_id: payload.userInfo.auth_user_id,
        access_token: userDetails.data[0].access_token,
        auth_key: config.get("authKey"),
        offering: 15,
        is_on_session : true,
        billing_amount: deductableAmount
      }
    };
    let userCards = await utilityService.sendHttpRequest(logHandler, deductPaymentPayload);
    if (userCards.data.transaction_status == 402 || userCards.data.transaction_status == 1) {
      let businessTransaction = await workspaceService.insertBillingTransaction(logHandler, {
        workspace_id: payload.workspace_id,
        plan_id: payload.plan_id,
        user_count: active_users.user_count,
        amount: deductableAmount,
        transaction_id: userCards.data.transaction_id,
        expire_date: expireDate,
        email: userCards.data.email,
        transaction_status: userCards.data.transaction_status,
        payment_intent_id: userCards.data.payment_intent_id
      });

      let variables = {
        invoice_number: businessTransaction.insertId,
        date: new Date().toDateString(),
        customer_name: payload.userInfo.full_name,
        customer_email: userCards.data.email,
        company_name: payload.workspaceInfo.workspace,
        description: `Number of users ${active_users.user_count}`,
        duration: new Date(expireDate).toDateString(),
        total_amount: deductableAmount
      }
      let result = await utilityService.createPdf(logHandler, "INVOICE", variables);

      if (billing_plan.billing_type == constants.billingType.APP) {
        let options = {
          method: 'PATCH',
          url: config.get('ocBaseUrl') + constants.API_END_POINT.UPDATE_APP_STATE,
          json: {
            en_user_id: commonFunctions.encryptText(payload.workspaceInfo.fugu_user_id),
            app_state: "ACTIVE",
            app_id: billing_plan.app_id,
            status: 1
          },
          headers: {
            "Content-Type": "application/json",
            app_secret_key: payload.workspaceInfo.fugu_secret_key,
            app_version: 123,
            device_type: 3
          }
        };
        await utilityService.sendHttpRequest(logHandler, options);
      }
      workspaceService.updateExpirationDays(logHandler, { workspace_id: payload.workspace_id });
      workspaceService.updateInfo(logHandler, { where_clause: { workspace_id: payload.workspace_id }, status: constants.allowedWorkspaceStatus.ENABLED });
      if(userCards.data.transaction_status == 402) {
        return {
          transaction_status: userCards.data.transaction_status,
          client_secret: userCards.data.client_secret,
          payment_method: userCards.data.payment_method,
          card_token: userCards.data.card_token || false
        }
      } else {
        variables.email_credentials = payload.workspaceInfo.email_credentials;
        sendEmail(constants.emailType.INVOICE, variables, userCards.data.email, `Invoice`, "Business SignUp Mail");
        workspaceService.updateBillingTransaction(logHandler, { workspace_id: payload.workspace_id, invoice: result.url })
      }

    }
  }
  return {};
}

async function updatePlan(logHandler){
  let allWorkspaceInfo = await workspaceService.getAllBusinesses(logHandler, {});

  let workspaceIds = allWorkspaceInfo.map(x => x["workspace_id"]);

  let guestUsers = []; //await workspaceService.getGuestUsers(logHandler, { workspace_ids: workspaceIds, max_guest_days: constants.guestMaxDays })

  let guestUsersMap = {};
  if (guestUsers.length) {
    for (let data of guestUsers) {
      if (!guestUsersMap[data.workspace_id]) {
        guestUsersMap[data.workspace_id] = {};
        guestUsersMap[data.workspace_id].guest_users = [];
        guestUsersMap[data.workspace_id].days = 0;
      }
      guestUsersMap[data.workspace_id].guest_users.push(data.fugu_user_id);
      guestUsersMap[data.workspace_id].days = guestUsersMap[data.workspace_id].days + data.days;
    }
  }

  for (let data of allWorkspaceInfo) {
    let userInfo = await userService.getWorkspaceOwner(logHandler, { workspace_id: data.workspace_id });
    let expireWorkspace = false;
    if (!_.isEmpty(userInfo)) {
      if (userInfo[0].auth_user_id) {
        let fuguUserIds = data.fugu_user_id.split(",").map(Number);
        fuguUserIds = Array.from(new Set(fuguUserIds))
        let deductableAmount;

        deductableAmount = fuguUserIds.length * data.price + data.balance;
        let result = await deductPayment(logHandler, { email : userInfo[0].email, deductableAmount : deductableAmount, workspace_id : data.workspace_id, plan_id : data.plan_id, user_count : fuguUserIds.length, expireDate : data.month_last_day, full_name : userInfo[0].full_name });
        if (result.statusCode != 200) {
          expireWorkspace = true;
        }
      } else {
        expireWorkspace = true;
      }
    } else {
      expireWorkspace = true;
    }

    return{};
    // if (expireWorkspace) {
    //   workspaceService.updateInfo(logHandler, { workspace_id: payload.workspace_id, status: constants.allowedWorkspaceStatus.EXPIRED });
    // }
  }
}

async function deductPayment(logHandler, payload) {
  let options = {
    method: 'POST',
    url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
    json: {
      field_names: "first_name, access_token, password, email,user_id",
      email: payload.email,
      auth_key: config.get("authKey"),
      offering: 15
    }
  };
  let userDetails = await utilityService.sendHttpRequest(logHandler, options);

  if (userDetails.status == 200) {
    let deductPaymentPayload = {
      method  : 'POST',
      url     : config.get("authServerUrl") + constants.AUTH_API_END_POINT.MAKE_USER_PAYMENT,
      json    : {
        user_id        : userDetails.data[0].user_id,
        access_token   : userDetails.data[0].access_token,
        auth_key       : config.get("authKey"),
        offering       : 15,
        billing_amount : payload.deductableAmount
      }
    };
    let userCards = await utilityService.sendHttpRequest(logHandler, deductPaymentPayload);
    if (userCards.data.transaction_status == 402 || userCards.data.transaction_status == 1) {
      let businessTransaction = await workspaceService.insertBillingTransaction(logHandler, {
        workspace_id: payload.workspace_id,
        plan_id: payload.plan_id,
        user_count: payload.user_count,
        amount: payload.deductableAmount,
        transaction_id: userCards.data.transaction_id,
        expire_date: payload.expireDate,
        email: userCards.data.email,
        transaction_status: userCards.data.transaction_status,
        payment_intent_id: userCards.data.payment_intent_id
      });

      let variables = {
        invoice_number: businessTransaction.insertId,
        date: new Date().toDateString(),
        customer_name: payload.full_name,
        customer_email: userCards.data.email,
        company_name: "Billing plans",
        description: `Number of users ${payload.user_count}`,
        duration: new Date(payload.expireDate).toDateString(),
        total_amount: payload.deductableAmount
      }
      if (userCards.data.transaction_status == 402) {
        return {}
      }
      let result = await utilityService.createPdf(logHandler, "INVOICE", variables);
      variables.email_credentials = payload.workspaceInfo.email_credentials;
      sendEmail(constants.emailType.INVOICE, variables, userCards.data.email, `Invoice`, "Business SignUp Mail");
      workspaceService.updateBillingTransaction(logHandler, { workspace_id: payload.workspace_id, invoice: result.url, transaction_id: businessTransaction.insertId })

    }
  }
}

async function updateUserBillingPlan(logHandler, payload) {
  let businessLastTransaction = await workspaceService.getBusinessActiveTransaction(logHandler, { workspace_id: payload.workspace_id });
  if (!_.isEmpty(businessLastTransaction)) {
    let updateUserBillingStatus = false;
    let transactionIdsToUpdate = businessLastTransaction.map(x => x["id"]);
    if (businessLastTransaction[0].current_users >= businessLastTransaction[0].paid_for_users) {
      let skipUpdateBilling = false;
      let addOneDay = false;
      if (payload.status == constants.status.ENABLED) {
        updateUserBillingStatus = true;
      } else if (businessLastTransaction[0].current_users != businessLastTransaction[0].paid_for_users) {
        let updatedUserStatus = await userService.getUsersUpdatedStatus(logHandler, { fugu_user_id: payload.fugu_user_id });
        if (!_.isEmpty(updatedUserStatus)) {
          addOneDay = true;
        }
      } else {
        skipUpdateBilling = true;
      }
      if (!skipUpdateBilling) {
        userService.updateBilling(logHandler, { id: transactionIdsToUpdate, update_billing_status: updateUserBillingStatus, status: payload.status, add_one_day: addOneDay, period: businessLastTransaction[0].period });
      }
    }
    workspaceService.updateCurrentUserCount(logHandler, { id: transactionIdsToUpdate, add_current_user_count: updateUserBillingStatus, status: payload.status });
  }
}

async function validateWorkspace(logHandler, payload) {
  let [allUsersInWorkspace] = await workspaceService.getWorkspaceUsersCount(logHandler, { workspace_id: payload.workspace_id });
  if (allUsersInWorkspace.status != constants.status.ENABLED && (allUsersInWorkspace.status == constants.allowedWorkspaceStatus.PERIOD_BASED_TRIAL && allUsersInWorkspace.days >= constants.maxFreeTrialDays)) {
    workspaceService.updateInfo(logHandler, { where_clause: { workspace_id: payload.workspace_id }, status: constants.allowedWorkspaceStatus.EXPIRED });
  }
}

async function verifyAndRegisterGoogleUser(logHandler, payload) {
  payload.signup_source = constants.onBoardSource.GOOGLE;
  await verifyOtpV1(logHandler, payload)
  let otherUserInfo = await userService.getInfo(logHandler, { contact_number: payload.contact_number });
  let opts = {};
   opts.user_status = constants.UserStatus.REGISTERED;
  let googleUserInfo = await userService.getGoogleUserInfo(logHandler, { email: payload.email })
  let result = '';
  if (otherUserInfo.length) {
    otherUserInfo = otherUserInfo[0];
    if ((otherUserInfo.email).includes("@fuguchat.com")) {
      opts.email = googleUserInfo[0].email;
    } else {
      let error = new Error("Email Already Exists");
      error.errorResponse = RESP.ERROR.eng.USER_ALREADY_EXISTS;
      throw error;
    }
    (otherUserInfo.user_image) ? '' : opts.user_image = googleUserInfo[0].original_image;
    (otherUserInfo.user_thumbnail_image) ? '' : opts.user_thumbnail_image = googleUserInfo[0].user_image;
    (otherUserInfo.attributes) ? '' : opts.attributes = googleUserInfo[0].attributes;
    opts.google_refresh_token = googleUserInfo[0].google_refresh_token;
    opts.user_id = otherUserInfo.user_id
    await userService.updateInfo(logHandler, opts);
    result = otherUserInfo
  } else {
    opts = (googleUserInfo.length) ? googleUserInfo[0] : ''
    opts.contact_number = payload.contact_number
    result = await userService.insertNew(logHandler, opts);
  }
  return { access_token: result.access_token }
}

async function registerPhoneNumber(logHandler, payload) {

  let error = {};
  let checkIfAlreadyRequested = await workspaceService.getBusinessSignUpInfo(logHandler, payload);
  let checkIfUserContactNumberExists = await userService.getInfo(logHandler, { contact_number: payload.contact_number });
  if (!_.isEmpty(checkIfUserContactNumberExists) && (!((checkIfUserContactNumberExists[0].email).includes("@fuguchat.com")))) {
    throw new Error("Phone number already exists");
  }

  payload.otp = commonFunctions.isEnv("test") ? 444444 : UniversalFunc.generateRandomString(constants.business.OTP_LENGTH, true);

  let signUpTimeLimit = new Date();
  signUpTimeLimit.setMinutes(signUpTimeLimit.getMinutes() - constants.getMaxResendLimit);

  if (_.isEmpty(checkIfAlreadyRequested)) {
    // insert data in business_details table
    await workspaceService.insertSignUpRequest(logHandler, payload);
  } else if (checkIfAlreadyRequested[0].sent_count == constants.countConstants.MAX_MAIL_SENT_COUNT && checkIfAlreadyRequested[0].updated_at > signUpTimeLimit) {
    error = new Error("You have reached to max limit!");
    error.errorResponse = RESP.ERROR.eng.OTP_ALREADY_SENT;
    throw error;
  } else if (checkIfAlreadyRequested[0].updated_at > signUpTimeLimit) {
    payload.sent_count = checkIfAlreadyRequested[0].sent_count + 1;
    payload.is_expired = constants.isOtpExpired.NO;
  } else {
    payload.sent_count = 1;
  }
  await workspaceService.updateBusinessSignUpInfo(logHandler, payload);
  // sending email using mailgun
  if (!commonFunctions.isEnv("test")) {
    let contactNumber = payload.contact_number.split('-').join('');
    let message = payload.otp + ' is your OTP for confirming your phone number on FuguChat. Thank you for signing up. We' + `'re happy you're here.`;
    await utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [contactNumber] });
  }
}

async function checkInvitedContacts(logHandler, payload) {
  payload.contact_details = Array.from(new Set(payload.contact_numbers));
  payload.contact_numbers = [];
  _.each(payload.contact_details, (data) => {
    payload.contact_numbers.push(data.contact_number.trim());
    if (!commonFunctions.isValidNumber(data.contact_number, data.country_code)) {
      throw new Error(data.contact_number + " is not valid.");
    }
  });
}

async function deactivateUser(logHandler, payload) {
  if (!payload.email && !payload.contact_number) {
    throw new Error("Please provide email or contact number.")
  }
  let userInfo = await userService.getInfo(logHandler, { email: payload.email, contact_number: payload.contact_number });

  if (!userInfo.length) {
    throw new Error("User not found.");
  }
  userInfo = userInfo[0];
  userService.disableFuguUser(logHandler, { user_unique_key: userInfo.user_id });
  userService.disableFuguUserInAttendance(logHandler, { user_unique_key: userInfo.user_id });
  userService.disableFuguUserInScrum(logHandler, { user_unique_key: userInfo.user_id })
  return {};
}

async function getAllChannelInfo(logHandler, payload) {
  try {
    let result = await channelService.getAllChannelInfo(logHandler, { email: payload.userInfo.email });
    let businessGroupMap = {};
    let businessNameMap = {};
    let response = [];
    for (let res of result) {
      res.emails = res.emails ? res.emails.split(',') : [];
      res.contact_numbers = res.contact_numbers ? res.contact_numbers.split(',') : [];
      res.channel_image = commonFunctions.jsonParse(res.channel_image);
      if (!businessGroupMap[res.app_secret_key]) {
        businessGroupMap[res.app_secret_key] = [];
        businessNameMap[res.app_secret_key] = res.business_name;
      }
      businessGroupMap[res.app_secret_key].push(res);
    }
    _.each(businessGroupMap, (value, key) => {
      response.push({
        workspace_name: businessNameMap[key],
        groups: businessGroupMap[key]
      });
    });

    return response;
  } catch (error) {
    throw new Error(error);
  }
}

async function getAllChannelInfo(logHandler, payload) {
  try {
    let result = await channelService.getAllChannelInfo(logHandler, { email: payload.userInfo.email });
    let businessGroupMap = {};
    let businessNameMap = {};
    let response = [];
    for (let res of result) {
      res.emails = res.emails ? res.emails.split(',') : [];
      res.contact_numbers = res.contact_numbers ? res.contact_numbers.split(',') : [];
      res.channel_image = commonFunctions.jsonParse(res.channel_image);
      if (!businessGroupMap[res.app_secret_key]) {
        businessGroupMap[res.app_secret_key] = [];
        businessNameMap[res.app_secret_key] = res.business_name;
      }
      businessGroupMap[res.app_secret_key].push(res);
    }
    _.each(businessGroupMap, (value, key) => {
      response.push({
        workspace_name: businessNameMap[key],
        groups: businessGroupMap[key]
      });
    });

    return response;
  } catch (error) {
    throw new Error(error);
  }
}

async function insertScrumDetails(logHandler, payload) {
   let businessInfo =  await workspaceService.getScrumTokenByBusinessId(logHandler, {business_id : payload.business_id });
   if(_.isEmpty(businessInfo)){
     throw new Error ("Invalid Business Id")
   }
  let botInfo = await bot.getBotInfo(logHandler, { user_type: constants.userType.SCRUM_BOT, workspace_id: payload.business_id})
   let createNewScrum = {
      url        : config.get('scrumUrl') + constants.API_END_POINT.CREATE_NEW_SCRUM,
      method     : 'POST',
      attendance : true,
      json       : {
        business_token    : businessInfo[0].scrum_token,
        manager_fugu_user_id: payload.manager_user_id,
        scrum_name     : payload.scrum_name,
        start_day      : payload.start_day,
        time_zone      : payload.time_zone,
        start_time     : payload.start_time,
        active_days    : payload.active_days,
        frequency      : payload.frequency,
        respondants    : payload.respondants,
        welcome_message: payload.welcome_message,
        scrum_time     : payload.scrum_time,
        end_time_reminder : payload.end_time_reminder,
        delivering_result_to_users : payload.delivering_result_to_users,
        delivering_result_to_channels : payload.delivering_result_to_channels,
        questions       : payload.questions,
        end_time_text :  payload.end_time_text,
        //delivering_result_to : payload.delivering_result_to
      }
    };
   await utilityService.sendHttpRequest(logHandler, createNewScrum);
  if (payload.delivering_result_to_channels && payload.delivering_result_to_channels.length) {
    userService.insertUserToChannels(logHandler, { user_id :botInfo[0].user_id }, payload.delivering_result_to_channels)
  }
}




async function editScrumDetails(logHandler, payload) {
  let businessInfo =  await workspaceService.getScrumTokenByBusinessId(logHandler, {business_id : payload.business_id });
  let botInfo = await bot.getBotInfo(logHandler, { user_type: constants.userType.SCRUM_BOT, workspace_id: payload.business_id })

  let createNewScrum = {
     url        : config.get('scrumUrl') + constants.API_END_POINT.EDIT_SCRUM_DETAILS,
     method     : 'POST',
     attendance : true,
     json       : {
      // business_token    : businessInfo[0].scrum_token,
       manager_fugu_user_id: payload.manager_user_id,
       start_day      : payload.start_day,
       time_zone      : payload.time_zone,
       start_time     : payload.start_time,
       active_days    : payload.active_days,
       frequency      : payload.frequency,
       respondants    : payload.respondants,
       welcome_message: payload.welcome_message,
       scrum_time     : payload.scrum_time,
       end_time_reminder : payload.end_time_reminder,
       delivering_result_to_users : payload.delivering_result_to_users,
       delivering_result_to_channels : payload.delivering_result_to_channels,
       questions       : payload.questions,
       end_time_text :  payload.end_time_text,
       scrum_id      : payload.scrum_id,
       scrum_status  : payload.scrum_status,
       scrum_name : payload.scrum_name
     }
   };
   let result = await utilityService.sendHttpRequest(logHandler, createNewScrum);
  if (payload.delivering_result_to_channels && payload.delivering_result_to_channels.length) {
    userService.insertUserToChannels(logHandler, { user_id: botInfo[0].user_id }, payload.delivering_result_to_channels)
  }
   return result
}




async function getScrumDetails(logHandler, payload) {
  let businessInfo =  await workspaceService.getScrumTokenByBusinessId(logHandler, {business_id : payload.business_id });
  if(!(businessInfo[0].scrum_token)){
    throw new Error("Scrum Bot is not installed for this workspace")
  }
  if (!_.isEmpty(businessInfo)) {
    let placeholder = ''
    let userRole = ''
    if (payload.user_name) {
      userRole = await userService.getUserInfo(logHandler,{fugu_user_id : payload.user_name , workspace_id : payload.business_id})
      if(_.isEmpty(userRole)){
        throw new Error("User does not belong to this workspace")
      }
      placeholder = "?user_name=" + payload.user_name
    } else if (payload.scrum_id) {
      placeholder = "?scrum_id=" + payload.scrum_id
    }
    placeholder += "&business_token=" + businessInfo[0].scrum_token
    let createNewScrum = {
      url: config.get('scrumUrl') + constants.API_END_POINT.GET_SCRUM_DETAILS + placeholder,
      method: 'POST',
      attendance: true,
      json : {
        role :  (userRole[0])?userRole[0].role : "no role"
      }
    };
    let result = await utilityService.sendHttpRequest(logHandler, createNewScrum);

    if(result.data){
    for (let scrum of result.data) {
      if (scrum.delivering_result_to_channels.length) {
        let channelInfo = await channelService.getChannelsInfo(logHandler, { channel_ids: scrum.delivering_result_to_channels })
        let channelData = [];
        for (let channel of channelInfo) {
          let obj = {}
          obj["channel_id"] = channel.channel_id;
          obj["label"] = channel.custom_label;
          channelData.push(obj);
        }
        scrum.delivering_result_to_channels = channelData;
      }
    }
  }
    return result;
  }
  return {}
}

async function checkUserAvailability(logHandler, payload) {
    let businessInfo =  await workspaceService.getScrumTokenByBusinessId(logHandler, {business_id : payload.business_id });

    let checkUserAvailability = {
       url        : config.get('scrumUrl') + constants.API_END_POINT.CHECK_USER_AVAILABILITY ,
       method     : 'GET',
       attendance : true,
       json       : {
        business_token    : businessInfo[0].scrum_token,
        user_name : payload.user_id,
        start_day : payload.start_day,
        time_zone   : payload.time_zone,
        start_time   : payload.start_time,
        active_days  : payload.active_days,
        frequency  : payload.frequency,
        scrum_id : payload.scrum_id
       }
     };
    let result =   await utilityService.sendHttpRequest(logHandler , checkUserAvailability);
   return result
  }

  async function scrumCron(logHandler, payload) {

    let scrumCron = {
       url        : config.get('scrumUrl') + constants.API_END_POINT.SCRUM_CRON ,
       method     : 'GET',
       attendance : true,
       json       : {
        scrum_id : payload.scrum_id
       }
     };

    let result =   await utilityService.sendHttpRequest(logHandler , scrumCron);
    return result
  }

async function getIntentToken(logHandler, payload) {
  if(!payload.workspaceInfo) {
    throw new Error("Invalid workspace")
  }
  if (payload.userInfo.auth_user_id) {
    let options = {
      method: 'POST',
      url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
      json: {
        field_names: "first_name, access_token, password, email,user_id",
        email: payload.userInfo.email,
        auth_key: config.get("authKey"),
        offering: 15
      }
    };
    let userDetails = await utilityService.sendHttpRequest(logHandler, options);

    if (userDetails.status == 200) {
      let intentPayload = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.SETUP_INTETNT,
        json: {
           access_token: userDetails.data[0].access_token,
           auth_key: config.get("authKey"),
           offering: 15
        }
      };
      let clientData = await utilityService.sendHttpRequest(logHandler, intentPayload);
      return clientData;
    } else {
      throw new Error('Error while getting client data.')
    }
  } else {
    throw new Error('User not registered.')
  }
}

async function authorizePayment(logHandler, payload) {
  if (payload.secret_key != config.get("authWebhookSecret")) {
    throw new Error("Invalid secret")
  }

  if(payload.data.transaction_status == 1 && payload.data.payment_intent_id) {
    let result = await workspaceService.getBillingDetails(logHandler, { payment_intent_id : payload.data.payment_intent_id});
    let userInfo = await userService.getInfo(logHandler, { email : result[0].email});
    let variables = {
      invoice_number: result[0].id,
      date: new Date().toDateString(),
      customer_name: userInfo[0].full_name,
      customer_email: userInfo[0].email,
      company_name: result[0].workspace_name,
      description: result[0].current_users,
      duration: new Date(result[0].expire_on).toDateString(),
      total_amount: result[0].amount
    }
    let result1 = await utilityService.createPdf(logHandler, "INVOICE", variables);
    variables.email_credentials = payload.workspaceInfo.email_credentials;
    sendEmail(constants.emailType.INVOICE, variables, userInfo[0].email, `Invoice`, "Business SignUp Mail");

    workspaceService.updateTransaction(logHandler, { payment_intent_id: payload.data.payment_intent_id, invoice: result1.url })
  }
  return {};
}


async function meetCount(logHandler, opts){
  try{
    if(!opts.domain){
      throw(error);
    }
    let room_name = utilityService.getRoomFromMeetUrl(opts.domain);
    if(!room_name){
      return;
    }
    let checkRoomAlreadyCount = await workspaceService.getMeetConferenceRoom(logHandler, room_name);
    if(!_.isEmpty(checkRoomAlreadyCount)){
      return;
    }
    opts.domain = opts.domain.split(room_name)[0];
    await workspaceService.insertMeetCount(logHandler,{domain: opts.domain, room_name});
     return;
  }catch(error){
    throw(error)
  }
}

async function checkUserInviteDetails(logHandler, opts){
  try{
    let response = {valid: false};
    let workspaceInfo = opts.workspaceInfo;
    let new_invites;
    let free_invite_details = await workspaceService.getWorkspaceConfiguration(logHandler, workspaceInfo.workspace_id, 'free_invite');
    if(_.isEmpty(free_invite_details)){
      free_invite_details = await workspaceService.getWorkspaceConfiguration(logHandler, 0, 'free_invite');
    }
    let invite_allowed = Number(free_invite_details.free_invite) + 1;
    let no_of_invite_allowed = await workspaceService.getNoOfInviteAllowed(logHandler, {workspace_id: opts.workspaceInfo.workspace_id});
    if(!_.isEmpty(no_of_invite_allowed)){
      invite_allowed = invite_allowed + no_of_invite_allowed[0].invite_allowed;
    }
    let no_of_active_users = await workspaceService.getActiveUserInWorkspace(logHandler,{workspace_id: opts.workspaceInfo.workspace_id, status: true, userType:[1,6]});
    let remaining_invites =  invite_allowed - no_of_active_users.length;
    if(Math.sign(remaining_invites) == -1){
      return response;
    }
    if(!_.isEmpty(opts.emails)){
      new_invites = opts.emails.length;
    }else if(!_.isEmpty(opts.contact_numbers)){
      new_invites = opts.contact_numbers.length;
    }else{
      new_invites = 1;
    }
    if(new_invites > remaining_invites){
      let extra_invites = new_invites - remaining_invites;
      response.data = extra_invites
      return response;
    }
    response.valid = true;
    return response;
  }catch(error){
    throw(error);
  }
}
