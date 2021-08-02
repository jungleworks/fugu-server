/**
 * Created by ashishprasher on 31/08/17.
 */
const md5              = require('MD5');
const bcrypt           = require('bcryptjs');
const _                = require('underscore');
const Promise          = require('bluebird');
const config           = require('config');
const csv              = require("csvtojson");
const fs               = require('fs');
const phone            = require('node-phonenumber');
const CryptoJS         = require("crypto-js");
const moment           = require('moment');

var phoneUtil = phone.PhoneNumberUtil.getInstance();

const saltRounds                      = 10;
const RESP                            = require('../Config').responseMessages;
const constants                       = require('../Utils/constants');
const commonFunctions                 = require('../Utils/commonFunctions');
const UniversalFunc                   = require('../Utils/universalFunctions');
const { logger }                      = require('../libs/pino_logger');
const userService                     = require('../services/user');
const workspaceService                = require('../services/workspace');
const sendEmail                       = require('../Notification/email').sendEmailToUser;
const utilityService                  = require('../services/utility');
const templateBuilder                 = require('../Notification/email');
const userTemplate                    = require('../Config/userTemplates');
const notificationService             = require('../services/notifier');
const fuguService                     = require('../services/fugu');
const conversationService             = require('../services/conversation');
const redis                           = require('../Utils/redis').Redis;
const workspaceController             = require('../Controller/workspace');
const chatController                  = require('../Controller/chatController');
const pushNotificationController      = require('../Controller/pushNotification');
const pushNotificationBuilder         = require('../Builder/pushNotification');
const channelService                  = require('../services/channel');
const handleChatService               = require('../services/handleChat');
const businessService                 = require('../services/business');
const bot                             = require('../services/bot');
const googleDaoService                = require('../modules/googleCalender/services/googleDaoService');

exports.setPassword                      = setPassword;
exports.userLogin                        = userLogin;
exports.userLoginV1                      = userLoginV1;
exports.userLogout                       = userLogout;
exports.getUsers                         = getUsers;
exports.inviteUser                       = inviteUser;
exports.resendInvitation                 = resendInvitation;
exports.revokeInvitation                 = revokeInvitation;
exports.verifyToken                      = verifyToken;
exports.editUserInfo                     = editUserInfo;
exports.resetPasswordRequest             = resetPasswordRequest;
exports.resetPassword                    = resetPassword;
exports.changePassword                   = changePassword;
exports.getUserInfo                      = getUserInfo;
exports.editFuguUserInfo                 = editFuguUserInfo;
exports.verifySignUpToken                = verifySignUpToken;
exports.loginViaAccessToken              = loginViaAccessToken;
exports.verifyPasswordResetToken         = verifyPasswordResetToken;
exports.getUserInvites                   = getUserInvites;
exports.loginViaAccessTokenV1            = loginViaAccessTokenV1;
exports.changeContactNumberRequest       = changeContactNumberRequest;
exports.changeContactNumber              = changeContactNumber;
exports.updateDeviceToken                = updateDeviceToken;
exports.sendFeedback                     = sendFeedback;
exports.submitGdprQuery                  = submitGdprQuery;
exports.manageUserRole                   = manageUserRole;
exports.deletePendingRequests            = deletePendingRequests;
exports.verifyInfo                       = verifyInfo;
exports.getUserContacts                  = getUserContacts;
exports.createUser                       = createUser;
exports.createGroup                      = createGroup;
exports.addMemberInGroup                 = addMemberInGroup;
exports.disableUser                      = disableUser;
exports.onBoardUser                      = onBoardUser;
exports.editWorkspace                    = editWorkspace;
exports.removeMemberFromGroup            = removeMemberFromGroup;
exports.deleteGroup                      = deleteGroup;
exports.getGroupInfo                     = getGroupInfo;
exports.renameGroup                      = renameGroup;
exports.userLoginV2                      = userLoginV2;
exports.whatsNewFeature                  = whatsNewFeature;
exports.insertUserDeviceDetails          = insertUserDeviceDetails;
exports.getInfo                          = getInfo;
exports.editInfo                         = editInfo;
exports.testPushNotification             = testPushNotification;
exports.sendMessageEmail                 = sendMessageEmail;
exports.getUserChannelsInfo              = getUserChannelsInfo;
exports.notifyUsers                      = notifyUsers;
exports.logException                     = logException;
exports.updateLpuUserChannels            = updateLpuUserChannels;
exports.getPushNotifications             = getPushNotifications;
exports.getAllUserUnreadCount            = getAllUserUnreadCount;
exports.endSnooze                        = endSnooze;
exports.updateUserDetails                = updateUserDetails;
exports.getLoginOtp                      = getLoginOtp;
exports.validateOtpOrToken               = validateOtpOrToken;
exports.getAccessToken                   = getAccessToken;
exports.getWhiteLabelDomain              = getWhiteLabelDomain;
exports.getPlanExpiry                    = getPlanExpiry;

function setPassword(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userData = yield userService.verifyUser(logHandler, { email_token: payload.email_token });
    if (_.isEmpty(userData)) {
      throw new Error(RESP.ERROR.eng.EMAIL_TOKEN_NOT_VERIFIED.customMessage);
    }
    [userData] = userData;
    const workspaceInfo = yield workspaceService.getInfo(logHandler,
      { workspace: payload.workspace });
    if (_.isEmpty(workspaceInfo)) {
      throw new Error('Workspace does not exist');
    }
    const opts = {};

    if (userData.email) {
      opts.email = userData.email;
    }
    if (userData.contact_number) {
      opts.contact_number = userData.contact_number;
    }
    if (_.isEmpty(opts)) {
      throw new Error('Invalid Information Provided!');
    }
    let userInfo = yield userService.getInfo(logHandler, opts);

    if (!_.isEmpty(userInfo) && userInfo[0].user_status == constants.UserStatus.INVITED) {
      [userInfo] = userInfo;
      yield userService.updateInfo(logHandler,
        {
          user_id: userInfo.user_id,
          password: md5(payload.password),
          full_name: payload.full_name,
          user_status: constants.UserStatus.REGISTERED
        });
      yield userService.updateUserDetails(logHandler,
        {
          user_id: userInfo.user_id,
          workspace_id: userData.workspace_id,
          full_name: payload.full_name,
          status: constants.userStatus.ENABLED
        });
      const fuguUserId = yield userService.getWorkspaceUsersInfo(logHandler,
        {
          user_id: userInfo.user_id,
          workspace_id: userData.workspace_id,
          status: true
        });
      if (userData.type != constants.userRole.GUEST) {
        workspaceController.updateUserBillingPlan(logHandler,
          {
            fugu_user_id: fuguUserId[0].fugu_user_id,
            status: constants.status.ENABLED,
            workspace_id: workspaceInfo[0].workspace_id
          });
      }
      opts.workspace_id = userData.workspace_id;
     yield userService.markInvitedUserAsUser(logHandler, opts);
      return { access_token: userInfo.access_token };
    }

    if (!_.isEmpty(userInfo)) {
      throw new Error('User is already Signup!');
    }

    // create user
    const userId = commonFunctions.generateUserId();
    const accessToken = bcrypt.hashSync(opts.email || opts.contact_number, saltRounds);

    if (!userData.email) {
      userData.email = `${opts.contact_number.split('-')[1]}@jungleworks.auth`;
    }
    const insertUser = {
      user_id: userId,
      email: userData.email,
      password: md5(payload.password),
      full_name: payload.full_name,
      contact_number: opts.contact_number,
      access_token: accessToken,
      user_status: constants.UserStatus.REGISTERED
    };

    yield userService.insertNew(logHandler, insertUser);

    const insertUserDetails = {
      user_id: userId,
      workspace_id: userData.workspace_id,
      user_image: '',
      user_type: constants.userType.CUSTOMER,
      contact_number: opts.contact_number,
      full_name: payload.full_name || ''
    };

    if (workspaceInfo[0].default_manager_fugu_user_id) {
      const getManagerDetails = yield userService.getUserInfo(logHandler,
        {
          fugu_user_id: workspaceInfo[0].default_manager_fugu_user_id,
          workspace_id: workspaceInfo[0].workspace_id
        });
      insertUserDetails.manager = getManagerDetails[0].full_name;
      insertUserDetails.manager_fugu_user_id = workspaceInfo[0].default_manager_fugu_user_id;
    }
    if (userData.type == constants.userRole.GUEST) {
      insertUser.guest_id = userData.id;
      insertUserDetails.role = constants.userRole.GUEST;
      insertUserDetails.user_type = constants.userType.GUEST;


    }

    // insertUserDetails.fugu_user_id = workspaceInfo[0].user_id;
    yield userService.insertUserDetails(logHandler, insertUserDetails);
    // mark user created
    opts.workspace_id = userData.workspace_id;
     yield userService.markInvitedUserAsUser(logHandler, opts);

    return { access_token: accessToken };
  })().then(
    (data) => {
      logger.trace(logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccessWithFile(RESP.SUCCESS.DEFAULT, data, res);
    },
    (error) => {
      logger.error(logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
}


function userLogin(logHandler, payload, res) {
  Promise.coroutine(function* () {
    payload.email = payload.email ? payload.email.toLowerCase() : undefined;
    let md5Password = md5(payload.password);
    let error;

    commonFunctions.checkAppVersion(logHandler, payload);
    let userInfo = yield userService.getInfo(logHandler, { email: payload.email });
    // nothing found in local db
    if (_.isEmpty(userInfo) || userInfo[0].user_status == constants.UserStatus.INVITED) {
      error = new Error("User Does not exist");
      error.errorResponse = RESP.ERROR.eng.INVALID_EMAIL;
      throw error;
    }
    // user found in local db
    userInfo = userInfo[0];

    // password and status validations
    if (userInfo.password != md5Password) {
      error = new Error("Password is incorrect");
      error.errorResponse = RESP.ERROR.eng.INVALID_PASSWORD;
      throw error;
    }

    if (!userInfo.access_token) {
      userInfo.access_token = bcrypt.hashSync(payload.email, saltRounds);
      yield userService.updateInfo(logHandler, { user_id: userInfo.user_id, access_token: userInfo.access_token });
    }
    payload.user_id = userInfo.user_id;

    let result = yield userService.getUserDetails(logHandler, { email: payload.email });
    commonFunctions.checkAppVersion(logHandler, payload);
    for (let user of result) {
      user.config = {};
      let workspacePropertyValue = yield workspaceService.getConfiguration(logHandler, user.workspace_id);
      user.config = {};
      commonFunctions.addAllKeyValues(workspacePropertyValue, user.config);

      user.is_admin = false;
      user.attributes = commonFunctions.jsonParse(user.attributes);
      user.app_update_message = payload.app_update_message;
      user.app_update_config = {
        app_update_message: payload.app_update_message,
        app_link: constants.appUpdateLink[payload.device_type],
        app_update_text: constants.appUpdateText[payload.device_type]
      };
    }
    logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: result });
    return result;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_IN, data, res);
  }, (error) => {
    logger.error(logHandler, { EVENT: "AGENT LOGIN ERROR" }, { MESSAGE: error.message });
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
}


function userLoginV1(logHandler, payload, res) {
  Promise.coroutine(function* () {
    payload.email = payload.email ? payload.email.toLowerCase() : undefined;
    payload.contact_number = payload.contact_number ? payload.contact_number.trim() : undefined;
    payload.username = payload.username ? payload.username.trim() : undefined;

    // check user existence, password and status validations
    let userInfo = yield userService.getInfo(logHandler, { email: payload.email, contact_number: payload.contact_number, username: payload.username });

    if (_.isEmpty(userInfo) || userInfo[0].user_status == constants.UserStatus.INVITED) {
        let error = new Error("User Does not exist");
        error.errorResponse = RESP.ERROR.eng.INVALID_EMAIL;
        throw error;
    }
    userInfo = userInfo[0];
    if(!userInfo.timezone){
      yield userService.updateInfo(logHandler,{user_id:userInfo.user_id,timezone: payload.time_zone})
    }

    if (payload.domain == 'muleapp.io') {
      payload.domain = `buymule.com`
    }

   if (userInfo.auth_user_id) {
      let options = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.AUTHENTICATE_USER,
        json: {
          email: userInfo.email,
          password: payload.password,
          auth_key: config.get("authKey"),
          offering: 15
        }
      };
      let response = yield utilityService.sendHttpRequest(logHandler, options);
      if (response.status != 200) {
        throw new Error("Password is Incorrect")
      }
    } else {
      if (userInfo.password != md5(payload.password)) {
        throw new Error("Password is incorrect")
      }
    }

    if (!userInfo.access_token) {
      userInfo.access_token = bcrypt.hashSync(payload.email || payload.contact_number, saltRounds);
      yield userService.updateInfo(logHandler, { user_id: userInfo.user_id, access_token: userInfo.access_token });
    }
    payload.user_id = userInfo.user_id;



    // check login in particular workspace
    let responseObj = {};
    yield userService.getUserAllInfo(logHandler, {user_id: userInfo.user_id, email: userInfo.email, contact_number: userInfo.contact_number, username: userInfo.username, domain: payload.domain || config.get("baseDomain"), insert_logs: true, user_agent: payload.user_agent }, responseObj);

    let turnCredentials = yield workspaceService.getTurnCredentials(logHandler);
    turnCredentials[0].ice_servers = commonFunctions.jsonParse(turnCredentials[0].ice_servers);
    responseObj.turn_credentials = turnCredentials[0];

    // fetch all put users
    let opts = {
      app_version: payload.app_version,
      device_id: payload.device_id,
      device_type: payload.device_type,
      token: payload.token,
      voip_token: payload.voip_token,
      device_details: payload.device_details
    };
    if (payload.device_id) {
      for (const space of responseObj.workspaces_info) {
        opts['user_id'] = space.fugu_user_id;
        yield userService.insertUserDeviceDetails(logHandler, opts);
      }
    }
    // else {
    //   logger.error(logHandler, "no device id " + userInfo.user_id);
    // }

    let [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

    delete workspaceAppInfo.google_creds;
    delete workspaceAppInfo.email_credentials;

    responseObj.whitelabel_details = workspaceAppInfo;
    userInfo.workspace_properties = JSON.parse(workspaceAppInfo.properties);

    if (payload.device_type == constants.enumDeviceType.ANDROID || payload.device_type == constants.enumDeviceType.IOS) {
      userInfo.app_update_config = {
        app_link: workspaceAppInfo[constants.deviceTypeLinkKeys[payload.device_type]],
        app_update_text: constants.appUpdateText[payload.device_type]
      };
      let currentAppVersion = payload.app_version;

      if (currentAppVersion < workspaceAppInfo[constants.deviceTypeLatestVersionKeys[payload.device_type]]) {
        userInfo.app_update_config.app_update_message = constants.appUpdateMessage.SOFT_UPDATE;
      }

      if (currentAppVersion < workspaceAppInfo[constants.deviceTypeCriticalVersionKeys[payload.device_type]]) {
        userInfo.app_update_config.app_update_message = constants.appUpdateMessage.HARD_UPDATE;
      }
    }
    userInfo.attributes = commonFunctions.jsonParse(userInfo.attributes);
    userInfo.user_channel = commonFunctions.getSHAOfObject(userInfo.user_id);
    userInfo.push_token = workspaceAppInfo.domain_id + userInfo.user_id + payload.device_id;

    userInfo.google_refresh_token ? userInfo.has_google_contacts = true : userInfo.has_google_contacts = false;
    if (payload.device_type == constants.enumDeviceType.ANDROID) {
      let pushObj = yield userService.getMaxPushId(logHandler)
      if(pushObj.length) {
        responseObj.last_notification_id = pushObj[0].id;
      }
    }
    delete userInfo.google_refresh_token;
    responseObj.user_info = userInfo;
    responseObj.restricted_email_domains = constants.disallowWorkspaceEmail;
    responseObj.supported_file_type = constants.supportedFileTypes;
    responseObj.fugu_config = constants.fugu_config;
    delete userInfo.password;
    return responseObj;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_IN, data, res);
  }, (error) => {
    console.error('LOGIN ERROR -------->',error);
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
}

function loginViaAccessToken(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let result = payload.userInfo;
    logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: result });

    return result;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_IN, data, res);
  }, (error) => {
    logger.error(logHandler, { EVENT: "AGENT LOGIN ERROR" }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
}

function loginViaAccessTokenV1(logHandler, payload, res) {
  Promise.coroutine(function* () {

    // let userWorkspaceIdsLength = payload.user_workspace_ids ? payload.user_workspace_ids.length : 0;

    // let userWorkspaceIds = new Set();
    // for (let workspace_id of user_workspace_ids) {
    //   userWorkspaceIds.add((workspace_id));
    // }

    const obj = { access_token: payload.access_token };
    if (payload.workspace_id) {
      obj.workspace_id = payload.workspace_id;
    }

    if (payload.old_dashboard) {
      throw RESP.ERROR.eng.REDIRECT_ERROR;
    }

    let userInfo = yield userService.getInfo(logHandler, obj);

    if (_.isEmpty(userInfo)) {
      const error = new Error("Session expired! Please login again");
      error.errorResponse = RESP.ERROR.eng.INVALID_ACCESS_TOKEN;
      throw error;
    }
    [userInfo] = userInfo;
    if(!userInfo.timezone){
      yield userService.updateInfo(logHandler,{user_id:userInfo.user_id,timezone: payload.time_zone})
    }
    userInfo.is_calendar_linked = false;
    const responseObj = {};


    if(userInfo.user_properties) {
      try{
        userInfo.user_properties = JSON.parse(userInfo.user_properties);

      } catch (err) {
        console.error(err)
      }
    }
    let getGoogleCalenderTokenDetails = yield googleDaoService.getGoogleTokenDetails(logHandler, {user_unique_key: userInfo.user_id});
    if(getGoogleCalenderTokenDetails.length){
      userInfo.is_calendar_linked = true;
    }
    const [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get('baseDomain')});

    if (!workspaceAppInfo){
      return {
        statusCode : 422,
        message : "Invalid Workspace"
      }
    }
    obj.domain_id = workspaceAppInfo.domain_id;
    if( payload.workspace ){
      // let workspaceId = yield workspaceService.getInfo( logHandler , { workspace : payload.workspace  })
      if (!(workspaceAppInfo.workspace_id)){
        return {
          statusCode : 422,
          message : "You are not registered with us"
        }
      }
      let whatsNewStatus = yield userService.getWorkspaceUsersInfo(logHandler, { status: true, workspace_id: workspaceAppInfo.workspace_id , user_id : userInfo.user_id })
      if(!(whatsNewStatus.length)){
        return {
          statusCode : 401,
          message : "User does not belong to this workspace"
        }
      }
      let whatsNew = yield userService.getWhatsNewFeatureStatus( logHandler , { whats_new_status : whatsNewStatus[0].whats_new_status   , role : whatsNewStatus[0].role } )
      if (!_.isEmpty(whatsNew)){
        responseObj.whatsNew = whatsNew[0].COUNT
      }
    }

    delete userInfo.password;
    obj.email = userInfo.email;
    obj.contact_number = userInfo.contact_number;
    obj.user_id = userInfo.user_id;
    obj.username = userInfo.username;
    obj.domain = payload.domain || config.get('baseDomain');
    obj.insert_logs = true;
    obj.user_agent   = payload.user_agent;
    // get all workspaces information like invitations open workspaces and workspaces_info
    yield userService.getUserAllInfo(logHandler, obj, responseObj);
    userInfo.unread_notification_count = responseObj.unread_notification_count;

    const turnCredentials = yield workspaceService.getTurnCredentials(logHandler)
    turnCredentials[0].ice_servers = commonFunctions.jsonParse(turnCredentials[0].ice_servers);
    responseObj.turn_credentials = turnCredentials[0];

    // look for changes based on request
    // fetch all put users
    const opts = {
      device_id: payload.device_id,
      device_type: payload.device_type,
      token: payload.token,
      voip_token: payload.voip_token,
      device_details: payload.device_details
    };

    if (payload.device_id) {
      for (const space of responseObj.workspaces_info) {
        opts['user_id'] = space.fugu_user_id;
        yield userService.insertUserDeviceDetails(logHandler, opts);
      }

      // let workspaceIdsLength = responseObj.workspaces_info.length;

      // if (workspaceIdsLength - userWorkspaceIdsLength == 0) {
      yield userService.getFuguUserUnreadCount(logHandler, responseObj.workspaces_info, opts);

      // }
    }
    // else {
    //   logger.error(logHandler, `no device id ${userInfo.user_id}`);
    // }

    //   commonFunctions.checkAppVersion(logHandler, payload);
   // const [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
    delete workspaceAppInfo.google_creds;
    delete workspaceAppInfo.email_credentials;

    responseObj.whitelabel_details = workspaceAppInfo;
    userInfo.workspace_properties = JSON.parse(workspaceAppInfo.properties);
    workspaceAppInfo.properties = JSON.parse(workspaceAppInfo.properties);
    workspaceAppInfo.colors = JSON.parse(workspaceAppInfo.colors);
    if (payload.device_type == constants.enumDeviceType.ANDROID || payload.device_type == constants.enumDeviceType.IOS) {
      userInfo.app_update_config = {
        app_link: workspaceAppInfo[constants.deviceTypeLinkKeys[payload.device_type]],
        app_update_text: constants.appUpdateText[payload.device_type].replace('app_name', workspaceAppInfo.app_name)
      };
      const currentAppVersion = payload.app_version;

      // if (currentAppVersion < workspaceAppInfo[constants.deviceTypeLatestVersionKeys[payload.device_type]]) {
      //   userInfo.app_update_config.app_update_message = constants.appUpdateMessage.SOFT_UPDATE;
      // }

      if (currentAppVersion < workspaceAppInfo[constants.deviceTypeCriticalVersionKeys[payload.device_type]]) {
        userInfo.app_update_config.app_update_message = constants.appUpdateMessage.HARD_UPDATE;
      } else if (currentAppVersion < workspaceAppInfo[constants.deviceTypeLatestVersionKeys[payload.device_type]]) {
        userInfo.app_update_config.app_update_message = constants.appUpdateMessage.SOFT_UPDATE;
      } else {
        userInfo.app_update_config.app_update_message = constants.appUpdateMessage.DEFAULT;
      }
    }

    userInfo.google_refresh_token ? userInfo.has_google_contacts = true : userInfo.has_google_contacts = false;
    userInfo.attributes = commonFunctions.jsonParse(userInfo.attributes);
    userInfo.notification_snooze_time = constants.notificationSnoozeTimeEnum;
    delete userInfo.google_refresh_token;
    delete userInfo.password;
    userInfo.user_channel = commonFunctions.getSHAOfObject(userInfo.user_id);
    userInfo.push_token = workspaceAppInfo.domain_id + userInfo.user_id + payload.device_id;
    if (payload.device_type == constants.enumDeviceType.ANDROID) {
      let pushObj = yield userService.getMaxPushId(logHandler)
      if (pushObj.length) {
        responseObj.last_notification_id = pushObj[0].id;
      }
    }
    responseObj.user_info = userInfo;
    responseObj.supported_file_type = constants.supportedFileTypes;
    responseObj.fugu_config = constants.fugu_config;
    responseObj.invite_billing = false;

    return responseObj;
  })().then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_IN, data, res);
  }, (error) => {
    console.error("LOGIN VIA ACCESS TOKEN------->", error);
    error = (error.errorResponse) ? error.errorResponse : error;
    UniversalFunc.sendError(error, res);
  });
}

function updateDeviceToken(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let obj = {};
    obj.access_token = payload.access_token;
    obj.email = userInfo.email;
    obj.contact_number = userInfo.contact_number;
    obj.user_id = userInfo.user_id;
    let responseObj = {};
    // get all workspaces information like invitations open workspaces and workspaces_info
    // yield userService.getUserAllInfo(logHandler, obj, responseObj);

    // update token for user
    if(payload.domain) {
      let [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
      payload.workspaceInfo = workspaceAppInfo;
    }

    let opts = {
      app_version: payload.app_version,
      device_id: payload.device_id,
      device_type: payload.device_type,
      token: payload.token,
      voip_token: payload.voip_token,
      device_details: payload.device_details
    };

    let userWorkspaceDetails = yield workspaceService.getUserWorspaces(logHandler, { user_id: userInfo.user_id, domain_id : payload.workspaceInfo.domain_id });
    for (let data of userWorkspaceDetails) {
      opts.user_id = data.user_id
      yield userService.insertUserDeviceDetails(logHandler, opts);
    }
    return {}
    yield userService.insertUserDeviceDetails(logHandler, opts);

    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.ENTRY_ADDED_SUCCESSFULLY, data, res);
  }, (error) => {
    UniversalFunc.sendError(error, res);
  });
}

function userLogout(logHandler, payload, res) {
  Promise.coroutine(function* () {
    payload.user_id = payload.userInfo.user_id;

    if(payload.domain) {
      let domainDetails = yield workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain") })
      userService.deletePush(logHandler, { user_unique_key: payload.userInfo.user_id, device_id: payload.device_id, domain_id: domainDetails[0].id })
    }

    yield userService.updateDeviceDetails(logHandler, { device_id: payload.device_id, user_id: payload.userInfo.user_id });

    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_OUT, data, res);
  }, (error) => {
    logger.error(logHandler, { EVENT: "AGENT LOGOUT ERROR" }, { MESSAGE: error.message });
    UniversalFunc.sendError(error, res);
  });
}

function getUsers(logHandler, payload, res) {
  let opts = {};
  opts.workspace_id = payload.workspace_id;
  opts.page_start = commonFunctions.parseInteger(payload.page_start) || 1;  // pagination
  opts.page_end = payload.page_end || opts.page_start + constants.getUsersPageSize - 1;
  Promise.coroutine(function* () {
    let registeredUsers = yield userService.getRegisteredUsers(logHandler, opts);
    let response = {};
    response.users = registeredUsers;
    return response;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

async function inviteUser(logHandler, payload) {
  try {
    const { userInfo } = payload;
    const { workspaceInfo } = payload;
    workspaceInfo.properties = JSON.parse(workspaceInfo.properties)
    workspaceInfo.payment_gateway_creds = commonFunctions.jsonToObject(logHandler, workspaceInfo.payment_gateway_creds);
    if (!workspaceInfo) {
      throw new Error('Workspace does not exist.');
    }
    if (workspaceInfo.role == constants.userRole.GUEST) {
      throw new Error('Guests cannot invite members');
    }
    if(!workspaceInfo.is_invite_email_enabled && !_.isEmpty(payload.emails)){
        throw new Error('You are not allowed to invite people via email!');
    }
    payload.emails = payload.emails || [];
    payload.contact_numbers = payload.contact_numbers || [];

    let userInvitationData = await userService.getUserInvitationData(logHandler, { workspace_id: workspaceInfo.workspace_id, invitation_status: constants.invitationStatus.REVOKED });

    let maxFreeTrialUsers = constants.maxFreeTrialUsersForDomain[payload.workspaceInfo.domain_id]
    maxFreeTrialUsers ? 0 : maxFreeTrialUsers = constants.maxFreeTrialUsers

    if (workspaceInfo.workspace_status == constants.allowedWorkspaceStatus.USER_BASED_TRIAL && payload.emails.concat(payload.contact_numbers).concat(userInvitationData).length >= maxFreeTrialUsers) {
      throw new Error("Invite limit reached. Please buy a plan to continue.")
    }

    let userIds = [];
    let result = {};
    if (_.isEmpty(workspaceInfo)) {
      throw new Error("Invalid Workspace Id!");
    }
    // let userInfo = payload.userInfo[0];
    if (!payload.token && !payload.system_invite && (workspaceInfo.config.any_user_can_invite == 0) && (workspaceInfo.role == constants.userRole.USER)) {
      throw RESP.ERROR.USER_INVITE_ERROR.customMessage;
    }

    payload.emails = [...new Set(payload.emails)];
    payload.contact_numbers = [...new Set(payload.contact_numbers)];
    payload.emails.indexOf(userInfo.email) > -1 ? payload.emails.splice(payload.emails.indexOf(userInfo.email), 1) : payload.emails;
    payload.contact_numbers.indexOf(userInfo.contact_number) > -1 ? payload.contact_numbers.splice(payload.contact_numbers.indexOf(userInfo.contact_number), 1) : payload.contact_numbers;
    if(workspaceInfo.payment_gateway_creds && workspaceInfo.payment_gateway_creds.key_id){
      let checkUserHasInvite = await workspaceController.checkUserInviteDetails(logHandler, payload);
      if(!checkUserHasInvite.valid){
        let error = {}
        error.statusCode = 402;
        error.customMessage = 'Invitation Not allowed';
        error.data = checkUserHasInvite.data;
        return error;
      }
    }

    let allGuest = [];

    if (!_.isEmpty(payload.emails)) {
      let emails = await userService.inviteUserUsingEmail(logHandler, payload);
      result.emails = emails.success;
      result.duplicateInvitedEmails = emails.duplicateInvited;

      if (payload.is_guest) {
        if (emails.success.length) {
          let emailsInsertIds = await userService.getUserInvitationData(logHandler, { workspace_id: payload.workspace_id, email: emails.success });
          if (emailsInsertIds.length) {
            //let emailGuestIds = emailsInsertIds.map(x => x["id"])
            allGuest = allGuest.concat(emailsInsertIds.map(x => x["id"]));
          }
        }
      }

      if (!_.isEmpty(result.emails)) {
        let users = await userService.getInfo(logHandler, { emails: payload.emails });
        for (let user of users) {
          userIds.push(user.user_id);
        }
      }
    }

    if (!_.isEmpty(payload.contact_numbers)) {
      let contactNumbers = await userService.inviteUserUsingContactNumber(logHandler, payload);
      result.contactNumbers = contactNumbers.success;

      if (payload.is_guest) {
        if (contactNumbers.success.length) {
          let contactInsertIds = await userService.getUserInvitationData(logHandler, { workspace_id: payload.workspace_id, contact_number: contactNumbers.success });
          if (contactInsertIds.length) {
            allGuest = allGuest.concat(contactInsertIds.map(x => x["id"]));
          }
        }
      }

      if (!_.isEmpty(contactNumbers.success)) {
        let users = await userService.getInfo(logHandler, { contact_numbers: contactNumbers.success });
        for (let user of users) {
          userIds.push(user.user_id);
        }
      }
      result.duplicateInvitedContactNumbers = contactNumbers.duplicateInvited;
    }

    if (_.isEmpty(result.emails) && _.isEmpty(result.contactNumbers)) {
      throw new Error(RESP.ERROR.eng.ALL_EMAILS_ALREADY_INVITED.customMessage);
    }
    if (payload.is_guest && allGuest.length) {
      payload.all_guest = allGuest;
      await insertGuest(logHandler, payload)
    }
    let guestIds = {}
    if (payload.is_guest) {
      result.emails = (result.emails) ? (result.emails).length ? result.emails : null : null;
      result.contactNumbers = (result.contactNumbers) ? (result.contactNumbers).length ? result.contactNumbers : null : null;
      let invitedUserData = await userService.getInvitedUserData(logHandler, { workspace_id: payload.workspace_id, contact_numbers: result.contactNumbers, email: result.emails });
      for (data of invitedUserData) {
        data.email ? guestIds[data.email] = data.id : guestIds[data.contact_number] = data.id
      }
    }

    if (!_.isEmpty(result.emails)) {
      let existingUsersInvited = await userService.getInfo(logHandler, { emails: result.emails })
      let alreadyRegisteredEmails = existingUsersInvited.map(x => x["email"]);
      let newFuguUsersInvited = (result.emails).filter(x => !(alreadyRegisteredEmails).includes(x));

      for (email of result.emails) {
        let userInfo = [];
        //unregistered users
        if (newFuguUsersInvited.includes(email)) {
          let userId = commonFunctions.generateUserId();
          let accessToken = bcrypt.hashSync(email, saltRounds);
          let insertUser = {
            user_id: userId,
            email: email,
            password: null,
            full_name: (email.split("@"))[0],
            contact_number: "",
            access_token: accessToken,
            user_status: constants.UserStatus.INVITED
          }
          userInfo = await userService.insertNew(logHandler, insertUser);
        }
        userInfo = await userService.getInfo(logHandler, { email: email })
        userInfo = userInfo[0]

        let userWorkspaceInfo = await userService.getWorkspaceUser(logHandler, { user_unique_key : userInfo.user_id, workspace_id : payload.workspace_id});
        if(userWorkspaceInfo.length) {
          continue;
        }
        if (payload.is_guest) {
          userInfo.guest_id = guestIds[email]
          userInfo.role = constants.userRole.GUEST
        }
        let opts = {
          app_version: payload.app_version,
          device_id: commonFunctions.generateUserId(),
          device_type: payload.device_type
        }
        workspaceInfo.full_name = userInfo.full_name;
        workspaceInfo.user_image = (userInfo.user_image) ? userInfo.user_image : '';

        // let userDetails = await userService.insertUserDetails(logHandler, userInsertInfo);

        let insertUserDetails = {
          user_unique_key: userInfo.user_id,
          workspace_id: payload.workspaceInfo.workspace_id,
          original_image: (userInfo.original_image) ? userInfo.original_image : '',
          user_image: (userInfo.user_image) ? userInfo.user_image : '',
          contact_number: (userInfo.contact_number) ? userInfo.contact_number : '',
          full_name: (userInfo.email) ? userInfo.full_name : (email.split("@"))[0],
          status: constants.UserStatus.INVITED,
          user_type: constants.userType.CUSTOMER,
          emails:  (userInfo.email) ? (userInfo.email) : ''
        };

        if (userInfo.user_image) {
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
          } catch (e) {
            console.error(">>>", e);
          }
        }

        if (payload.is_guest) {
          insertUserDetails.guest_id = guestIds[email];
          insertUserDetails.role = constants.userRole.GUEST;
          insertUserDetails.user_type = constants.userType.GUEST;
        }

        if (workspaceInfo.default_manager_fugu_user_id) {
          let getManagerDetails = await userService.getUserInfo(logHandler, { fugu_user_id: workspaceInfo.default_manager_fugu_user_id, workspace_id: workspaceInfo.workspace_id });
          insertUserDetails.manager = getManagerDetails[0].full_name;
          insertUserDetails.manager_fugu_user_id = workspaceInfo.default_manager_fugu_user_id;
        }
        // insertUserDetails.fugu_user_id = userDetails[0].user_id;
        const fuguObj = await userService.insertUserDetails(logHandler, insertUserDetails);
        const data = {
          fugu_user_id: fuguObj.insertId,
          workspace_id: workspaceInfo.workspace_id,
          workspaceInfo,
          email,
          full_name: userInfo.full_name,
          domain_id : workspaceInfo.domain_id,
          properties: workspaceInfo.properties
        };
        if(workspaceInfo.domain_id != 12) {
          userService.createChannelsWithBots(logHandler, data);
        }
        if (!payload.is_guest) {
          // if needed, use the business config key to restrict general chat space wise
          if (workspaceInfo.domain_id != 12) {
            channelService.addUserToGeneralChat(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: fuguObj.insertId, app_name: payload.app_name, domain_id : workspaceInfo.domain_id});
          }
        } else {
          let opts = {
            update_fields: {
              user_id: fuguObj.insertId
            },
            where_clause: {
              guest_id: guestIds[email]
            }
          }
          userService.updateGuest(logHandler, opts);
          userService.insertUserToChannels(logHandler, { user_id: fuguObj.insertId }, payload.channel_ids_to_connect);
        }
      }
    }

    if (!_.isEmpty(result.contactNumbers)) {
      let existingUsersInvited = await userService.getInfo(logHandler, { contact_numbers: result.contactNumbers })
      let alreadyRegisteredNumbers = existingUsersInvited.map(x => x["contact_number"]);
      let newFuguUsersInvited = (result.contactNumbers).filter(x => !(alreadyRegisteredNumbers).includes(x));
      for (const contact_number of result.contactNumbers) {
        let userInfo = [];
        if (newFuguUsersInvited.includes(contact_number)) {
          const userId = commonFunctions.generateUserId();
          let accessToken = bcrypt.hashSync(contact_number, saltRounds);
          let insertUser = {
            user_id: userId,
            email: contact_number + "@fuguchat.com",
            password: null,
            full_name: contact_number,
            contact_number: contact_number,
            access_token: accessToken,
            user_status: constants.UserStatus.INVITED
          }

          userInfo = await userService.insertNew(logHandler, insertUser);
        }
        userInfo = await userService.getInfo(logHandler, { contact_number: contact_number })
        userInfo = userInfo[0];
        let userWorkspaceInfo = await userService.getWorkspaceUser(logHandler, { user_unique_key: userInfo.user_id, workspace_id: payload.workspace_id });
        if (userWorkspaceInfo.length) {
          continue;
        }

        if (payload.is_guest) {
          userInfo.guest_id = guestIds[contact_number]
          userInfo.role = constants.userRole.GUEST
        }

        let opts = {
          app_version: payload.app_version,
          device_id: commonFunctions.generateUserId(),
          device_type: payload.device_type
        }
        workspaceInfo.full_name = userInfo.full_name;
        workspaceInfo.user_image = (userInfo.user_image) ? userInfo.user_image : '';


        let insertUserDetails = {
          user_unique_key: userInfo.user_id,
          workspace_id: payload.workspaceInfo.workspace_id,
          original_image: (userInfo.original_image) ? userInfo.original_image : '',
          user_image: (userInfo.user_image) ? userInfo.user_image : '',
          contact_number: contact_number,
          full_name: userInfo.full_name ? userInfo.full_name : contact_number,
          status: constants.UserStatus.INVITED,
          user_type: constants.userType.CUSTOMER,
          emails:  (userInfo.email) ? (userInfo.email) : ''
        };
        if (payload.is_guest) {
          insertUserDetails.guest_id = guestIds[contact_number];
          insertUserDetails.role = constants.userRole.GUEST;
          insertUserDetails.user_type = constants.userType.GUEST;
        }
        if (workspaceInfo.default_manager_fugu_user_id) {
          let getManagerDetails = await userService.getUserInfo(logHandler, { fugu_user_id: workspaceInfo.default_manager_fugu_user_id, workspace_id: workspaceInfo.workspace_id });
          insertUserDetails.manager = getManagerDetails[0].full_name;
          insertUserDetails.manager_fugu_user_id = workspaceInfo.default_manager_fugu_user_id;
        }
        // insertUserDetails.fugu_user_id = userDetails[0].user_id;
        const fuguObj = await userService.insertUserDetails(logHandler, insertUserDetails);
        const data = {
          fugu_user_id: fuguObj.insertId,
          workspace_id: workspaceInfo.workspace_id,
          workspaceInfo,
          full_name: userInfo.full_name,
          domain_id : workspaceInfo.domain_id,
          properties:workspaceInfo.properties
        };

        if (workspaceInfo.domain_id != 12) {
          userService.createChannelsWithBots(logHandler, data);
        }
        if (!payload.is_guest) {
          // if needed, use the business config key to restrict general chat space wise
          if (workspaceInfo.domain_id != 12) {
            channelService.addUserToGeneralChat(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: fuguObj.insertId, app_name: payload.app_name, domain_id: workspaceInfo.domain_id});
          }
        } else {
          let opts = {
            update_fields: {
              user_id: fuguObj.insertId
            },
            where_clause: {
              guest_id: guestIds[contact_number]
            }
          }
          userService.updateGuest(logHandler, opts);
          userService.insertUserToChannels(logHandler, { user_id: fuguObj.insertId }, payload.channel_ids_to_connect);
        }
      }
    }
    // notifying users
    if (!payload.system_invite && !_.isEmpty(userIds)) {
      payload.notification_type = constants.notificationFor.INVITE_USERS;
      fuguService.notifyUser(logHandler, userIds, payload);
    }

    let response = {};
    response = result;
    response.alreadyRegistered = result.duplicateInvited;
    return response;
  } catch (error) {
    console.log("ERRERO---------------->", error);
    throw new Error(error);
  }
}

function resendInvitation(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let opts = {};
    let placeHolder;
    opts.workspace_id = payload.workspace_id;
    opts.status = constants.invitationStatus.RE_INVITED;

    if (!payload.contact_info && !payload.email) {
      throw new Error("Nothing to resend.");
    }

    if (payload.contact_info && payload.email) {
      throw new Error("Couldn't procced");
    }

    if (payload.contact_info) {
      opts.contact_number = payload.contact_info.contact_number;
      placeHolder = "&contact_number=" + opts.contact_number;
    }
    if (payload.email) {
      opts.email = payload.email;
      placeHolder = "&email=" + opts.email;
    }

    let userInvitationData = yield userService.getUserInvitationData(logHandler, opts);

    if (_.isEmpty(userInvitationData)) {
      throw new Error("Invite user first.");
    }

    if (userInvitationData[0].status == constants.invitationStatus.EXPIRED) {
      throw new Error("User already exists");
    }

    let invitationTimeLimit = new Date();
    invitationTimeLimit.setMinutes(invitationTimeLimit.getMinutes() - constants.getMaxResendLimit);             // 24 hours

    if ((userInvitationData[0].status == constants.invitationStatus.RE_INVITED || userInvitationData[0].status == constants.invitationStatus.NOT_EXPIRED) && userInvitationData[0].updated_at > invitationTimeLimit) {
      if (userInvitationData[0].sent_count == constants.countConstants.MAX_INVITE_RESEND_COUNT) {
        throw new Error("You have reached to max limit");
      }
      if ((userInvitationData[0].status == constants.invitationStatus.RE_INVITED || userInvitationData[0].status == constants.invitationStatus.NOT_EXPIRED) && userInvitationData[0].updated_at > invitationTimeLimit) {
        opts.sent_count = userInvitationData[0].sent_count + 1;
      }
    } else {
      opts.sent_count = 1;
    }

    let url = `https://${payload.workspaceInfo.workspace}.${payload.workspaceInfo.domain}/`;
    opts.invitation_token = commonFunctions.getSHAOfObject(new Date().getTime() + opts.email || opts.contact_number.replace('-', '') + Math.round(parseFloat(Math.random() * 10000)) + "");
    let invitationLink = url + "redirectInvitation?email_token=" + opts.invitation_token + placeHolder + "&workplace=" + payload.workspaceInfo.workspace;
    let shorterLinkResult = yield utilityService.shortnerUrl(logHandler, invitationLink);

    yield userService.updateUserInvitation(logHandler, opts);
    let user = yield userService.getInfo(logHandler, opts);
    if (!_.isEmpty(user)) {
      payload.notification_type = constants.notificationFor.INVITE_USERS;
      // payload.fuguUserStatus = constants.getFuguUserStatus.ENABLED;
      fuguService.notifyUser(logHandler, [user[0].user_id], payload);
    }

    if (payload.email) {
      sendEmail(
        constants.emailType.USER_INVITATION,
        {
          email: payload.email,
          workspace_name: payload.workspaceInfo.workspace_name,
          invitation_link: shorterLinkResult ? shorterLinkResult.shortUrl : invitationLink,
          logo: payload.workspaceInfo.logo,
          app_name: payload.workspaceInfo.app_name,
          full_name: payload.userInfo.full_name,
          domain_id: payload.workspaceInfo.domain_id,
          email_credentials: payload.workspaceInfo.email_credentials
        }, payload.email, "You have been invited to join " + payload.workspaceInfo.workspace_name + ` team on ${payload.workspaceInfo.app_name}`, "User Invitation Mail"
      );
    }

    if (payload.contact_info) {

      let message = payload.userInfo.full_name + ` has invited you to ${payload.workspaceInfo.workspace_name} on ${payload.workspaceInfo.app_name}. Click below link to join. ` + (shorterLinkResult ? shorterLinkResult.shortUrl || invitationLink : invitationLink);
      yield utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [opts.contact_number] });

    }

    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    RESP.SUCCESS.INVITATION_RESENT.customMessage = `Your invitation to ${payload.email || payload.contact_info.contact_number} has been resent.`;
    UniversalFunc.sendSuccess(RESP.SUCCESS.INVITATION_RESENT, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function revokeInvitation(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let opts = {};
    opts.status = constants.invitationStatus.REVOKED;
    opts.workspace_id = payload.workspace_id;

    if (!payload.contact_info && !payload.email) {
      throw new Error("Nothing to revoke.");
    }

    if (payload.contact_info && payload.email) {
      throw new Error("Couldn't procced");
    }

    if (payload.contact_info) {
      if (!commonFunctions.isValidNumber(payload.contact_info.contact_number, payload.contact_info.country_code)) {
        throw new Error("Number is not valid");
      }
      opts.contact_number = payload.contact_info.contact_number;
    }

    if (payload.email) {
      opts.email = payload.email;
    }

    let userInvitationData = yield userService.getUserInvitationData(logHandler, opts);
    if (_.isEmpty(userInvitationData)) {
      throw new Error("User is not invited");
    }

    if (userInvitationData[0].status == constants.invitationStatus.EXPIRED) {
      throw new Error("User already exists");
    }

    if (userInvitationData[0].status == constants.invitationStatus.REVOKED) {
      throw new Error("Invitation already revoked");
    }

    opts.sent_count = 1;
    yield userService.updateUserInvitation(logHandler, opts);

    let obj = {};

    payload.email ? obj.email = payload.email : 0;
    payload.contact_info && payload.contact_info.contact_number ? obj.contact_number = payload.contact_info.contact_number: 0;
    if (_.isEmpty(obj)) {
      throw new Error("Invalid Information Provided!");
    }
    let userInfo = yield userService.getInfo(logHandler, obj);
    userInfo = userInfo[0];
    let fuguUserId = yield userService.getWorkspaceUsersInfo(logHandler, { user_id: userInfo.user_id, workspace_id: payload.workspaceInfo.workspace_id, status: true })
    yield userService.updateUserDetails(logHandler, { user_id: userInfo.user_id, workspace_id: payload.workspaceInfo.workspace_id, status: constants.userStatus.DISABLED })
    yield userService.updateUserDetails(logHandler, { status: constants.userStatus.DISABLED });

    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    RESP.SUCCESS.INVITATION_REVOKED.customMessage = `Your invitation to ${payload.email || payload.contact_info.contact_number} has been revoked.`;
    UniversalFunc.sendSuccess(RESP.SUCCESS.INVITATION_REVOKED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}


function verifyToken(logHandler, payload, res) {
  Promise.coroutine(function* () {
    payload.contact_token ? payload.email_token = payload.contact_token : 0;
    let userData = yield userService.verifyUser(logHandler, { email_token: payload.email_token });
    if (_.isEmpty(userData)) {
      throw new Error(RESP.ERROR.eng.EMAIL_TOKEN_NOT_VERIFIED.customMessage);
    }

    if (userData[0].status == constants.invitationStatus.REVOKED) {
      throw new Error("Your invitation has been revoked.");
    }

    let getDataObj = {};

    userData[0].contact_number ? getDataObj.contact_number = userData[0].contact_number : 0;
    userData[0].email ? getDataObj.email = userData[0].email : 0;

    let userInfo = yield userService.getInfo(logHandler, getDataObj);
    userInfo = userInfo[0];
    if (userData[0].status == constants.invitationStatus.EXPIRED) {
      return { access_token: userInfo.access_token };
    }

    let getObj = {
      workspace_id: userData[0].workspace_id
    };

    userData[0].email ? getObj.email = userData[0].email : 0;
    userData[0].contact_number ? getObj.contact_number = userData[0].contact_number : 0;

    if (_.isEmpty(userInfo) || userInfo.user_status == "INVITED") {
      return {};
    }

    let insertObj = {
      user_unique_key: userInfo.user_id,
      workspace_id: userData[0].workspace_id,
      user_image: userInfo.user_image || "",
      contact_number: userInfo.contact_number || "",
      full_name: userInfo.full_name || "",
      original_image: userInfo.original_image || "",
      user_type: constants.userType.CUSTOMER
    };

    userInfo.email ? insertObj.email = userInfo.email : 0;

    payload.status = constants.getFuguUserStatus[constants.userStatus.ENABLED];

    payload.device_id = payload.device_id ? payload.device_id : commonFunctions.generateRandomString(50);
    let workspaceInfo = yield workspaceService.getInfo(logHandler, { workspace_id: insertObj.workspace_id });

    if (userData[0].type == constants.userRole.GUEST) {
      insertObj.guest_id = userData[0].id;
      insertObj.role = constants.userRole.GUEST;
      insertObj.user_type = constants.userType.GUEST;
    }
;

    insertObj.fugu_user_id = workspaceInfo[0].user_id;

    if (workspaceInfo[0].default_manager_fugu_user_id) {
      getManagerDetails = yield userService.getUserInfo(logHandler, { fugu_user_id: workspaceInfo[0].default_manager_fugu_user_id, workspace_id: workspaceInfo[0].workspace_id });
      insertObj.manager = getManagerDetails[0].full_name;
      insertObj.manager_fugu_user_id = workspaceInfo[0].default_manager_fugu_user_id;
    }

    if (userData[0].type != constants.userRole.GUEST) {
      workspaceController.updateUserBillingPlan(logHandler, { fugu_user_id: insertObj.fugu_user_id, status: constants.status.ENABLED, workspace_id: workspaceInfo[0].workspace_id });
    }
    yield userService.insertUserDetails(logHandler, insertObj);
    yield userService.markInvitedUserAsUser(logHandler, getObj);

    return { access_token: userInfo.access_token };
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccessWithFile(RESP.SUCCESS.EMAIL_TOKEN_VERIFIED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}


function verifyPasswordResetToken(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let verifyToken = yield userService.verifyPasswordResetToken(logHandler, payload.reset_password_token);
    if (_.isEmpty(verifyToken)) {
      throw new Error("Invalid Password Reset Token");
    }
    verifyToken = verifyToken[0];
    let userData = yield userService.getInfo(logHandler, { user_id: verifyToken.user_id });

    if (_.isEmpty(userData)) {
      throw new Error("Invalid Data!");
    }
    let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
    delete workspaceDetails.google_creds;
    delete workspaceDetails.email_credentials;

    let variables = {
      url: 'resetPassword',
      reset_password_token: payload.reset_password_token,
      logo: workspaceDetails.logo,
      app_name: workspaceDetails.app_name,
      domain: payload.domain || workspaceDetails.domain,
      workspace: payload.workspace || workspaceDetails.workspace
    };
    return templateBuilder.renderMessageFromTemplateAndVariables(userTemplate.userResetPassword, variables);
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccessWithFile(RESP.SUCCESS.PASSWORD_RESET_TOKEN_VERIFIED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function verifySignUpToken(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let opts = {
      property: constants.business.SIGNUP_TOKEN_KEY
    };
    let businessesPropertyValue = yield workspaceService.getBusinessPropertyValue(logHandler, opts);
    if (_.isEmpty(businessesPropertyValue)) {
      throw new Error("Invalid token! Please Check");
    }

    let workspace_id = 0;
    for (let i = 0; i < businessesPropertyValue.length; i++) {
      if (businessesPropertyValue[i].value == payload.signup_token) {
        workspace_id = businessesPropertyValue[i].workspace_id;
      }
    }

    if (workspace_id == 0) {
      throw new Error("Invalid token! Please Check");
    }

    let workspaceinfo = yield workspaceService.getInfo(logHandler, { workspace_id: workspace_id });
    workspaceinfo = workspaceinfo[0];

    let email = [payload.email];
    let alreadyInvitedEmails = yield userService.duplicateUserInvitationCheck(logHandler, { workspace_id: workspaceinfo.workspace_id, emails: email });

    if (!_.isEmpty(alreadyInvitedEmails)) {
      throw new Error(RESP.ERROR.eng.ALL_EMAILS_ALREADY_INVITED.customMessage);
    }

    let alreadyRegisteredEmails = yield userService.checkDuplicate(logHandler, { workspace_id: workspaceinfo.workspace_id, emails: email });

    if (!_.isEmpty(alreadyRegisteredEmails.already_registered_emails)) {
      throw new Error(RESP.ERROR.eng.USER_ALREADY_EXISTS.customMessage);
    }


    let token = commonFunctions.getSHAOfObject(new Date().getTime() + payload.email + Math.round(parseFloat(Math.random() * 10000)));
    let emailTokenMap = {};
    emailTokenMap[payload.email] = token;

    yield userService.saveInvitedUsers(logHandler, { emailTokenMap: emailTokenMap, workspace_id: workspace_id });
    let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

    let url = config.get('frontEndUrl');
    let invitationLink = url + "/user/verifyToken?email_token=" + token;
    sendEmail(constants.emailType.USER_INVITATION, {
      email: payload.email,
      workspace_name: workspaceinfo.workspace_name,
      invitation_link: invitationLink,
      domain_id: workspaceDetails.domain_id,
      email_credentials: workspaceDetails.email_credentials,
    }, payload.email, "You have been invited to join " + workspaceinfo.workspace_name + ` team on ${workspaceDetails.app_name || "Office Chat"}`, "User Invitation Mail");
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.EMAIL_TOKEN_VERIFIED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function editUserInfo(logHandler, payload, res) {

  let opts = {};
  opts.workspace_id = payload.workspace_id;
  opts.email = payload.email;
  opts.full_name = payload.full_name;
  opts.status = payload.status;
  opts.files = payload.files;
  opts.designation = payload.designation;
  opts.department = payload.department;
  opts.manager = payload.manager;
  opts.manager_data = payload.manager_data;
  opts.location = payload.location;
  opts.device_id = payload.device_id;
  opts.attributes = commonFunctions.jsonParse(payload.userInfo.attributes) || {};
  opts.contacts = payload.contacts;
  opts.device_type = payload.device_type;
  opts.auto_download_level = payload.auto_download_level;
  opts.gallery_media_visibility = payload.gallery_media_visibility;
  // opts.contact_number               = payload.contact_number;
  opts.role = payload.role;
  if (opts.status == constants.userStatus.DISABLED || opts.status == constants.userStatus.LEFT) {
    opts.access_token = null;
  }

  Promise.coroutine(function* () {

    let userInfo = payload.userInfo;
    let workspaceInfo = payload.workspaceInfo;
    if (!workspaceInfo) {
      throw new Error("Invalid Information");
    }
    workspaceInfo.payment_gateway_creds = commonFunctions.jsonToObject(logHandler, workspaceInfo.payment_gateway_creds);
    if(opts.status == constants.userStatus.ENABLED && workspaceInfo.payment_gateway_creds && workspaceInfo.payment_gateway_creds.key_id){
      let checkUserHasInvite = yield workspaceController.checkUserInviteDetails(logHandler, payload);
      if(!checkUserHasInvite.valid){
        let error = {}
        error.statusCode = 402;
        error.customMessage = 'Invitation Not allowed';
        error.data = checkUserHasInvite.data;
        return error;
      }
    }
    let toBeEditedUserInfo = yield userService.getUserInfo(logHandler, { email: opts.email, workspace_id: opts.workspace_id, fugu_user_id: payload.fugu_user_id });
    if (_.isEmpty(toBeEditedUserInfo)) {
      throw new Error("invalid email");
    }

    if (payload.manager_data && !(payload.manager_data.fugu_user_id)) {
      throw new Error("Manager does not exists! ")
    }

    opts.user_id = toBeEditedUserInfo[0].user_id;
    toBeEditedUserInfo = toBeEditedUserInfo[0];

    if (workspaceInfo.role == constants.userRole.USER && (
       commonFunctions.isDefined(opts.status) ||
       commonFunctions.isDefined(opts.designation) ||
       commonFunctions.isDefined(opts.manager) ||
       commonFunctions.isDefined(opts.department) ||
       commonFunctions.isDefined(opts.role) )) {
       logger.error(logHandler, "TRYING TO EDIT SOMEONE ELSE DATA");
       throw new Error("Insufficient Rights");
      }

    if (workspaceInfo.role == constants.userRole.USER && workspaceInfo.fugu_user_id != toBeEditedUserInfo.fugu_user_id) {
      logger.error(logHandler, "TRYING TO EDIT SOMEONE ELSE DATA");
      throw new Error("Insufficient Rights");
    }

    if(workspaceInfo.workspace_id != toBeEditedUserInfo.workspace_id) {
      throw new Error("Invaid Workspace rights.")
    }

    if (toBeEditedUserInfo.status != constants.userStatus.ENABLED && toBeEditedUserInfo.status != constants.UserStatus.INVITED && (
      commonFunctions.isDefined(opts.designation) ||
      commonFunctions.isDefined(opts.manager) ||
      commonFunctions.isDefined(opts.department) ||
      commonFunctions.isDefined(opts.role) ||
      commonFunctions.isDefined(opts.full_name) ||
      commonFunctions.isDefined(opts.contact_number) ||
      commonFunctions.isDefined(opts.user_image))) {
      logger.error(logHandler, "DISABLED USER TRYING TO CHANGE DATA");
      throw new Error("User is deactivated");
    }

    // disabling himself
    if ((userInfo.email == opts.email || workspaceInfo.fugu_user_id == opts.fugu_user_id) && ((commonFunctions.isDefined(opts.status) && opts.status != constants.userStatus.LEFT) || commonFunctions.isDefined(opts.role))) {
      throw new Error("Un-authorized");
    }

    // prepare upload info
    if (!_.isEmpty(opts.files)) {
      opts.file = opts.files[0];
      opts.file_type = "image";
      let s3_url = yield utilityService.uploadFile(logHandler, opts);
      if (s3_url) {
        opts.user_image = s3_url.url;
        opts.thumbnail_user_image = s3_url.thumbnail_url;
        opts.image_100x100 = s3_url.image_100x100;
        opts.image_50x50 = s3_url.image_50x50;
      }
    }

    // update user default info for very first time




    let updateObj = {};
    if (payload.remove_profile_image) {
      opts.user_image = '',
        opts.thumbnail_user_image = '',
        updateObj.remove_image_set = true
    }
    updateObj.attributes = opts.attributes;
    (toBeEditedUserInfo.user_contact_number == '' && opts.contact_number) ? updateObj.contact_number = opts.contact_number : 0;
    (toBeEditedUserInfo.user_name == '' && opts.full_name) ? updateObj.full_name = opts.full_name : 0;
    ((toBeEditedUserInfo.user_image_url == '' && opts.user_image) || (opts.user_image == '')) ? updateObj.user_image = opts.user_image : 0;
    ((toBeEditedUserInfo.user_thumbnail_image_url == '' && opts.thumbnail_user_image) || (opts.thumbnail_user_image == '')) ? updateObj.user_thumbnail_image = opts.thumbnail_user_image : 0;
    ((toBeEditedUserInfo.image_100x100 == '' && opts.image_100x100) || (opts.image_100x100 == '')) ? updateObj.image_100x100 = opts.image_100x100 : 0;

    if(payload.web_theme) {
      updateObj.user_properties = { "web_theme": payload.web_theme};
    }
    const msg = RESP.SUCCESS.EDITED.customMessage;
    if (payload.notification_snooze_time) {
      yield userService.updateSnoozeTime(logHandler, { snooze_time_interval: constants.notificationSnoozeTime[payload.notification_snooze_time], user_id: opts.user_id   })
      updateObj.notification_snooze_time = constants.notificationSnoozeTime[payload.notification_snooze_time]
      return {msg}
    }
    if (payload.end_snooze) {
      updateObj.end_snooze = payload.end_snooze
    }
    opts.contacts ? updateObj.attributes.contacts = opts.contacts : 0;
    if (!_.isEmpty(updateObj)) {
      updateObj.user_id = opts.user_id;
      yield userService.updateInfo(logHandler, updateObj);

      if (payload.remove_profile_image) {
        updateObj.workspace_id = workspaceInfo.workspace_id
        yield userService.updateUserDetails(logHandler, updateObj)
      }
      if(payload.end_snooze || payload.web_theme){
        return {msg}
      }
      if (opts.contacts) {
        return {};
      }
    }


    if (payload.status == constants.status.ENABLED || payload.status == constants.status.DISABLED) {
      if (toBeEditedUserInfo.role != constants.userRole.GUEST) {
        workspaceController.updateUserBillingPlan(logHandler, { fugu_user_id: payload.fugu_user_id, status: payload.status, balance: payload.userInfo.billing_balance, workspace_id: workspaceInfo.workspace_id });
      }
      let days = null;
      if (toBeEditedUserInfo.role == constants.userRole.GUEST && payload.status == constants.status.DISABLED) {
        let guestStatus = yield userService.getUserStatus(logHandler, { fugu_user_id: payload.fugu_user_id });
        if (guestStatus.length) {
          if ((moment(new Date()).format("YYYY-MM-DD") != moment(new Date(guestStatus[0].created_at)).format("YYYY-MM-DD"))) {
            days = moment(new Date()).diff(moment(new Date(guestStatus[0].created_at)), "days");
          }
        } else {
          days = moment(new Date()).diff(moment(new Date(toBeEditedUserInfo.created_at)), "days");
        }
      }
      userService.insertUserStatus(logHandler, { fugu_user_id: payload.fugu_user_id, status: payload.status, days: days });
    }



    if (payload.status == constants.status.DISABLED) {
      if (toBeEditedUserInfo.role == constants.userRole.GUEST) {
        userService.updateGuest(logHandler, { update_fields: { status: 0 }, where_clause: { user_id: payload.fugu_user_id } });
      }
      let opts = {};
      if (payload.fugu_user_id == payload.workspaceInfo.default_manager_fugu_user_id) {
        if (payload.status == constants.status.DISABLED && payload.fugu_user_id == payload.workspaceInfo.default_manager_fugu_user_id) {
          let getManagerDetails = yield userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo.workspace_id });
          workspaceService.updateInfo(logHandler, { default_manager_fugu_user_id: getManagerDetails[0].fugu_user_id, where_clause: { workspace_id: payload.workspaceInfo.workspace_id } });
          opts.manager_fugu_user_id = getManagerDetails[0].fugu_user_id
          let managerPayload = {
            full_name: getManagerDetails[0].full_name,
            fugu_user_id: getManagerDetails[0].fugu_user_id
          }
          userService.updateUserDetails(logHandler, { manager_data: managerPayload, old_manager_fugu_user_id: payload.fugu_user_id });
        }
      }
      else {
        let getManagerName = yield userService.getUserInfo(logHandler, { fugu_user_id: payload.workspaceInfo.default_manager_fugu_user_id, workspace_id: payload.workspaceInfo.workspace_id })
        userService.updateUserDetails(logHandler, { manager_data: { fugu_user_id: payload.workspaceInfo.default_manager_fugu_user_id, full_name: getManagerName[0].full_name }, old_manager_fugu_user_id: payload.fugu_user_id })
        opts.manager_fugu_user_id = payload.workspaceInfo.default_manager_fugu_user_id
      }
      opts.fugu_user_id = payload.fugu_user_id
      userService.updateBulkManagerInAttendance(logHandler, opts);


      let channelsOfUser = yield channelService.getChannelWithOnlyAdmin(logHandler, { user_id: payload.fugu_user_id });


      let channel_ids = channelsOfUser.map(x => x["channel_id"]);
      if (!_.isEmpty(channel_ids)) {
        channelService.updateAdminOfChannel(logHandler, { channel_id: channel_ids });
      }

      let options = {
        userCCPushList: [toBeEditedUserInfo],
        userPushList: yield userService.getUsersDeviceDetails(logHandler, { userIds: toBeEditedUserInfo.fugu_user_id }),
        app_secret_key: payload.workspaceInfo.fugu_secret_key,
        user_unique_key: toBeEditedUserInfo.user_unique_key,
        notification_type: pushNotificationBuilder.notificationType.SESSION_EXPIRED,
        title: "SESSION EXPIRED",
        usersUnreadNotificationCount: {}
      };
      options.ccMentionPushUsers = {}
      options.followThreadUserIds = {};
      options.userPushList = handleChatService.preparePushNotificationList(options);
      handleChatService.pushNotifications(logHandler, options, payload.workspaceInfo);
      handleChatService.controlChannelPushes(logHandler, options);
    }

    if (payload.status || payload.full_name) {
      bot.updateUserOnAttendance(logHandler, payload);
      bot.updateUserOnScrum(logHandler, payload)
    }

    yield userService.updateUserDetails(logHandler, opts);

    if (payload.manager_data) {
      userService.updateManagerInAttendance(logHandler, { manager_fugu_user_id: payload.manager_data.fugu_user_id, fugu_user_id: payload.fugu_user_id });
    }
    opts.fugu_secret_key = workspaceInfo.fugu_secret_key;


    let userDetails = yield userService.getUserInfo(logHandler, { email: payload.email, workspace_id: opts.workspace_id, fugu_user_id: payload.fugu_user_id });
    if (_.isEmpty(userDetails)) {
      return;
    }
    let customMessage = RESP.SUCCESS.EDITED.customMessage;
    if( payload.status == constants.userStatus.ENABLED && toBeEditedUserInfo.role == constants.userRole.GUEST){
      customMessage = "Activated guest user"
    } else if (payload.status == constants.userStatus.DISABLED && toBeEditedUserInfo.role == constants.userRole.GUEST){
      customMessage = "Deactivated guest user"
    } else if (payload.status == constants.userStatus.ENABLED ){
      customMessage = "User Activated"
    } else if ( payload.status == constants.userStatus.DISABLED ){
      customMessage = "User Deactivated"
    } else if (!_.isEmpty(opts.files)) {
      customMessage = RESP.SUCCESS.PROFILE_PICTURE_UPLOADED.customMessage
    } else if ( payload.remove_profile_image ) {
      customMessage = RESP.SUCCESS.REMOVE_PROFILE_PICTURE.customMessage
    }
    return Object.assign(userDetails[0], { manager_data: { fugu_user_id: userDetails[0].manager_fugu_user_id || null, full_name: userDetails[0].manager || null } } , { customMessage : customMessage })
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.EDITED, data, res);
  }, (error) => {
      console.error(">>>>>>>>>>>>>>",error)
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function resetPasswordRequest(logHandler, payload, res) {
  // where to save reset password token
  Promise.coroutine(function* () {
    let resetLink;
    let userInfo = yield userService.getInfo(logHandler, payload);
    if (_.isEmpty(userInfo)) {
      throw new Error("This email or mobile number is not associated with any account!");
    }
    payload.user_id = userInfo[0].user_id;
    let checkIfAlreadyRequestedForPasswordReset = yield userService.getUserTodayPasswordResetRequests(logHandler, payload);
    if (checkIfAlreadyRequestedForPasswordReset && checkIfAlreadyRequestedForPasswordReset.length >= constants.countConstants.MAX_PASSWORD_RESET_REQUESTS) {
      throw new Error("Limit Exceeds!");
    }
    payload.reset_token = commonFunctions.getSHAOfObject((payload.email || payload.contact_number) + Math.round(parseFloat(Math.random() * 10000)) + "");

    let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
    delete workspaceDetails.google_creds;

    if (!payload.contact_number) {
       let data = {
        reset_password_link: config.get("frontEndUrl") + "/fugu-api/api/user/verifyPasswordResetToken?reset_password_token=" + payload.reset_token + "&domain=" + workspaceDetails.domain + "&workspace=" + workspaceDetails.workspace,
        full_name: userInfo[0].full_name == '' ? userInfo[0].email : userInfo[0].full_name,
        app_name: workspaceDetails.app_name,
        logo: workspaceDetails.logo,
        domain: workspaceDetails.domain,
        domain_id: workspaceDetails.domain_id,
        email_credentials: workspaceDetails.email_credentials,
        workspace: payload.workspace || constants.defaultWorkspace
      };
      sendEmail(constants.emailType.RESET_PASSWORD, data, payload.email, "Password Reset Mail", "Password Reset Mail");
    } else {
     // payload.reset_token = commonFunctions.getSHAOfObject((payload.email || payload.contact_number) + Math.round(parseFloat(Math.random() * 10000)) + "");
      let contactNumber = payload.contact_number;
      contactNumber = contactNumber.split('-').join('');
      let resetPasswordLink = config.get("frontEndUrl") + "/fugu-api/api/user/verifyPasswordResetToken?reset_password_token=" + payload.reset_token;
      let shorterLinkResult = yield utilityService.shortnerUrl(logHandler, resetPasswordLink);
      shorterLinkResult.shortUrl ? resetPasswordLink = shorterLinkResult.shortUrl : 0;
      let message = `We’ve received a request to reset your password. Click on the link below to allow us to help you with resetting the password. ` + resetPasswordLink;

      yield utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [contactNumber] });
    }
    yield userService.saveResetPasswordRequest(logHandler, payload);
  })().then(
    (data) => {
      logger.trace(logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.EMAIL_SENT, data, res);
    },
    (error) => {
      logger.error(logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
}


function getUserInvites(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let userId = userInfo.user_id;
    let attributes = userInfo.attributes ? commonFunctions.jsonToObject(logHandler, userInfo.attributes) : {};
    if (payload.user_api_token) {
      let emailIds = [];
      let url = "https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token={{{user_api_token}}}&max-results=500&v=3.0";
      url = url.replace("{{{user_api_token}}}", payload.user_api_token);
      let options = {
        url: url,
        method: 'GET',
      };
      let response = yield utilityService.sendHttpRequest(logHandler, options);

      if (response && response.feed && response.feed.entry) {
        response.feed.entry.map((item) => {
          if (item.gd$email) {
            emailIds.push(item.gd$email[0].address);
          }
        });
      }
      attributes.invite_emails = emailIds;
      yield userService.updateInfo(logHandler, { user_id: userId, attributes: attributes });
    }

    let emails = [];
    if (attributes && attributes.invite_emails) {
      emails = attributes.invite_emails;
    }
    if (!_.isEmpty(emails)) {
      emails = Array.from(new Set(emails));
      let alreadyInvitedEmails = yield userService.duplicateUserInvitationCheck(logHandler, { workspace_id: payload.workspace_id, emails: emails });
      let allInvitedEmails = alreadyInvitedEmails.already_invited_emails.concat(alreadyInvitedEmails.reinvited_emails);
      emails = emails.filter(email => allInvitedEmails.indexOf(email) < 0);

      let alreadyRegisteredEmails = yield userService.checkDuplicate(logHandler, { workspace_id: payload.workspace_id, emails: emails });
      let allRegisteredEmails = alreadyRegisteredEmails.already_registered_emails.concat(alreadyRegisteredEmails.left_emails);
      emails = emails.filter(el => alreadyRegisteredEmails.already_registered_emails.indexOf(el) < 0);
    }
    return emails;
  })().then(
    (data) => {
      logger.trace(logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
    },
    (error) => {
      logger.error(logHandler, error);
      UniversalFunc.sendError(error, res);
    }
  );
}

function resetPassword(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let verifyPasswordResetToken = yield userService.verifyPasswordResetToken(logHandler, payload.reset_password_token);
    if (_.isEmpty(verifyPasswordResetToken)) {
      throw new Error("Invalid token");
    }
    verifyPasswordResetToken = verifyPasswordResetToken[0];
    let userData = yield userService.getInfo(logHandler, { user_id: verifyPasswordResetToken.user_id });

    if (_.isEmpty(userData)) {
      throw new Error("Invalid Information");
    }
    userData = userData[0];
    payload.password = md5(payload.password);
    let accessToken = bcrypt.hashSync(userData.email, saltRounds);
    let updateObj = {
      user_id: userData.user_id,
      password: payload.password,
      access_token: accessToken
    };
    yield userService.updateInfo(logHandler, updateObj);


    if (userData.auth_user_id) {
      let options = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.UPDATE_USER_DETAILS,
        json: {
          user_id: userData.auth_user_id,
          updates: { password: payload.password },
          auth_key: config.get("authKey"),
          offering: 15
        }
      };
      yield utilityService.sendHttpRequest(logHandler, options);
    }


    let updatePayload = {
      update_fields: { expired: constants.expired.YES },
      where_clause: { user_id: userData.user_id }
    };
    let [workspaceDetails] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain });
    delete workspaceDetails.google_creds;
    delete workspaceDetails.email_credentials;

    yield userService.updateResetPasswordToken(logHandler, updatePayload);
    return templateBuilder.renderMessageFromTemplateAndVariables(userTemplate.resetPasswordSuccess, { logo: workspaceDetails.logo, app_name: workspaceDetails.app_name });
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccessWithFile(RESP.SUCCESS.PASSWORD_CHANGED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}


function changePassword(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.loginObj.user_info[0];
    let savedPassword = userInfo.password;
    let oldPasswordMd5 = md5(payload.old_password);
    let newPasswordMd5 = md5(payload.new_password);

    if (!_.isEqual(savedPassword, oldPasswordMd5)) {
      throw new Error("Password does not match");
    }
    if (_.isEqual(payload.old_password, payload.new_password)) {
      throw new Error("Old and new password is same");
    }

    let accessToken = bcrypt.hashSync(userInfo.email, saltRounds);
    let updateObj = {
      user_id: userInfo.user_id,
      access_token: accessToken,
      password: newPasswordMd5,
    };
    yield userService.updateInfo(logHandler, updateObj);

    // let updateDeviceObj = {
    //   workspace_id: payload.workspace_id,
    //   user_id: userInfo.user_id,
    //   device_id: payload.device_id
    // };
    //yield userService.markOfflineUserFromOtherDevices(logHandler, updateDeviceObj);
    return { access_token: accessToken };
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.PASSWORD_CHANGED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function getUserInfo(logHandler, payload, res) {
  Promise.coroutine(function* () {

    if (payload.workspaceInfo.workspace_status == constants.businessStatus.PERIOD_BASED_TRIAL) {
      workspaceController.validateWorkspace(logHandler, { workspace_id: payload.workspaceInfo.workspace_id });
    }
    let userDetails = yield userService.getUserInfo(logHandler, payload);
    if (_.isEmpty(userDetails)) {
      throw new Error("User does not exist!");
    }

    if (userDetails[0].email.split('@')[1] == "fuguchat.com") {
      userDetails[0].email = '';
    }

    let guest = {};
    if (payload.workspaceInfo.role == constants.userRole.GUEST || payload.workspaceInfo.role == constants.userRole.PAYING_GUETS) {
      guest.user_id = payload.fugu_user_id;
      guest.other_user_id = payload.workspaceInfo.fugu_user_id;
    } else if (userDetails[0].role == constants.userRole.GUEST || userDetails[0].role == constants.userRole.PAYING_GUETS) {
      guest.user_id = payload.workspaceInfo.fugu_user_id;
      guest.other_user_id = payload.fugu_user_id;
    }

    if (guest.user_id) {
      let messageAllowed = yield userService.getGuestUsersToConnect(logHandler, { fugu_user_id: guest.user_id, guest_to_connect: guest.other_user_id });
      if (messageAllowed.length) {
        userDetails[0].is_message_allowed = true;
      } else {
        userDetails[0].is_message_allowed = false;
      }
    } else {
      userDetails[0].is_message_allowed = true;
    }

    return Object.assign(userDetails[0], { manager_data: { fugu_user_id: userDetails[0].manager_fugu_user_id || null, full_name: userDetails[0].manager || null } })
  })().then((data) => {
    UniversalFunc.sendSuccess(RESP.SUCCESS.DATA_FETCHED_SUCCESSFULLY, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

async function getInfo(logHandler, payload) {
  try {
    const data = await userService.getNotificationInfo(logHandler, payload.userInfo);
    data[0].user_properties = JSON.parse(data[0].user_properties);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

function changeContactNumberRequest(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let otp = commonFunctions.isEnv("test") ? "444444" : UniversalFunc.generateRandomString(constants.business.OTP_LENGTH, true);


    let result = yield userService.getTodayChangeNumberRequests(logHandler, { user_id: userInfo.user_id });

    if (result.length >= constants.countConstants.MAX_PASSWORD_RESET_REQUESTS) {
      throw new Error("Limit Exceeds!");
    }

    let existingContact = yield userService.getInfo(logHandler, { contact_number: payload.contact_number });
    if (existingContact.length) {
      throw new Error("Phone number already in use !!");
    }


    let updatePayload = {
      update_fields: { expired: constants.expired.YES },
      where_clause: { user_id: userInfo.user_id }
    };
    yield userService.updateChangeContactNumber(logHandler, updatePayload);

    let insertPayload = {};
    insertPayload.user_id = userInfo.user_id;
    insertPayload.contact_number = payload.contact_number;
    insertPayload.otp = otp;
    yield userService.insertChangeContactNumber(logHandler, insertPayload);

    let phoneNumbers = [commonFunctions.getFormattedContactNumber(payload.contact_number)];
    let message = otp + ' is your OTP for changing your phone number on FuguChat';

    if (!commonFunctions.isEnv("test")) {
      yield utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: phoneNumbers });
    }
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.OTP_SENT_SUCCESSFULLY, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}



function changeContactNumber(logHandler, payload, res) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let ongoingRequest = yield userService.getChangeContactNumbers(logHandler, { user_id: userInfo.user_id, otp: payload.otp });
    if (!ongoingRequest.length) {
      throw new Error("Invalid OTP !!");
    }

    if (ongoingRequest[0].expired == constants.expired.YES) {
      throw new Error("OTP expired");
    }

    ongoingRequest = ongoingRequest[0];
    let existingContact = yield userService.getInfo(logHandler, { contact_number: ongoingRequest.contact_number });
    if (existingContact.length) {
      throw new Error("Phone number already in use !!");
    }


    let updatePayload = {
      update_fields: { expired: constants.expired.YES },
      where_clause: { user_id: userInfo.user_id }
    };
    yield userService.updateChangeContactNumber(logHandler, updatePayload);

    let updateUserPayload = {};
    updateUserPayload.user_id = userInfo.user_id;
    updateUserPayload.contact_number = ongoingRequest.contact_number;
    yield userService.updateInfo(logHandler, updateUserPayload);

    return {contact_number: ongoingRequest.contact_number};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.PHONE_NUMBER_UPDATE_SUCCESSFULLY, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}


function sendFeedback(logHandler, payload, res) {
  Promise.coroutine(function* () {
    logger.trace(logHandler, payload);

    yield userService.insertFeedback(logHandler, payload);

    if (!payload.type) {
      sendEmail(constants.emailType.FEEDBACK, {
        full_name: payload.userInfo.full_name,
        email: payload.userInfo.email,
        feedback: payload.feedback,
        extra_details: payload.extra_details,
        email_credentials: payload.workspaceInfo.email_credentials
      }, "feedback@fuguchat.com", "User Feedback", "User Feedback");
    }


    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.FEEDBACK_SUCCESSFULL, "", res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function submitGdprQuery(logHandler, payload, res) {
  Promise.coroutine(function* () {
    if (payload.workspaceInfo.role != constants.userRole.OWNER) {
      throw new Error('You are not authorized!');
    }

    yield userService.insertUserGdprQuery(logHandler, payload);
    sendEmail(constants.emailType.GDPR_QUERY, {
      full_name: payload.userInfo.full_name,
      email: payload.userInfo.email,
      workspace_id: payload.workspace_id,
      workspace_name: payload.workspaceInfo.workspace_name,
      query: payload.query,
      reason: payload.reason,
      email_credentials: payload.workspaceInfo.email_credentials
    }, "feedback@fuguchat.com", "GDPR QUERY", "GDPR QUERY");
    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.QUERY_RECEIVED, "", res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function manageUserRole(logHandler, payload ,res  ) {
  Promise.coroutine(function* () {
    let userInfo = payload.userInfo;
    let workspaceInfo = payload.workspaceInfo;
    if (payload.workspaceInfo.role == constants.userRole.USER) {
      throw new Error('You are not authorized!');
    }

    let userToChange = yield workspaceService.getUserWorkspaceData(logHandler, { fugu_user_id: payload.fugu_user_id, workspace_id: payload.workspace_id, guest_allowed: true });

    if (_.isEmpty(userToChange)) {
      throw new Error("Invalid Fugu User Id!");
    }

    userToChange = userToChange[0];

    if (userToChange.fugu_user_id == workspaceInfo.fugu_user_id) {
      throw new Error("Cannot edit own Information!");
    }

    if (payload.role && userToChange.status == constants.userStatus.DISABLED) {
      throw new Error("Enable User First!");
    }

    if (payload.role && userToChange.status == constants.userStatus.LEFT) {
      throw new Error("User Already Left");
    }

    if (userToChange.role == constants.userRole.GUEST) {
      if (payload.role) {
        yield userService.updateUserDetails(logHandler, { user_type: constants.userType.CUSTOMER, workspace_id: workspaceInfo.workspace_id, user_id: userToChange.user_id, role: payload.role });
      }
      workspaceController.updateUserBillingPlan(logHandler, { fugu_user_id: userToChange.fugu_user_id, status: constants.status.ENABLED, workspace_id: workspaceInfo.workspace_id });
      let channels = yield channelService.getAllChannelsWithChatType(logHandler, { workspace_id: workspaceInfo.workspace_id, chat_type: [constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP] });
      let channelIds = [];
      if (!_.isEmpty(channels)) {
        for (let channelId of channels) {
          channelIds.push(channelId.channel_id);
        }
      }
      if (!_.isEmpty(channelIds)) {
        userService.insertUserToChannels(logHandler, { user_id: userToChange.fugu_user_id }, channelIds);
      }
      userService.updateGuest(logHandler, { update_fields: { status: 0 }, where_clause: { user_id: userToChange.fugu_user_id } });
      return RESP.SUCCESS.UPGRADED_GUEST
    }

    // transferring ownership
    if (workspaceInfo.role == constants.userRole.OWNER) {
      // update his role to admin if he is owner
      if (payload.role == constants.userRole.OWNER) {
        if (userInfo.auth_user_id) {
          let options = {
            method: 'POST',
            url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.AUTHENTICATE_USER,
            json: {
              email: userInfo.email,
              password: payload.password,
              auth_key: config.get("authKey"),
              offering: 15
            }
          };
          let response = yield utilityService.sendHttpRequest(logHandler, options);
          if (response.status != 200) {
            throw new Error("Password is Incorrect")
          }
        } else {
          if (userInfo.password != md5(payload.password)) {
            throw new Error("Password is incorrect")
          }
        }
        if (!userToChange.auth_user_id && userToChange.contact_number) {
          workspaceController.registerUser(logHandler, userToChange);
        }
        let channels = yield channelService.getAllChannelsWithChatType(logHandler, { workspace_id: payload.workspace_id, chat_type: [constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP] });
        for(let data of channels) {
          redis.del(constants.promiseHash + data.channel_id);
        }

        yield userService.updateUserDetails(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: userInfo.user_id, role: constants.userRole.ADMIN });
        conversationService.updateAdminOfGeneralGroups(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: userToChange.fugu_user_id });
      }

      // making other person owner
      if (payload.role) {
        yield userService.updateUserDetails(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: userToChange.user_id, role: payload.role });
      }
    } else if (workspaceInfo.role == constants.userRole.ADMIN) { // admin taking decision
      if (payload.role == constants.userRole.OWNER || payload.role == constants.userRole.ADMIN) {
        throw new Error("You are not authorized!");
      }

      // making someone admin
      // if (payload.role == constants.userRole.ADMIN) {
      //   yield userService.updateUserDetails(logHandler, { workspace_id: workspaceInfo.workspace_id, user_id: userToChange.user_id, role: constants.userRole.ADMIN });
      // }
    }

    if (payload.role && payload.role != constants.userRole.OWNER) {
      yield userService.updateUserRoleInChatGroups(logHandler, { workspace_id: workspaceInfo.workspace_id, fugu_user_id: payload.fugu_user_id, role: payload.role });
    }

    if( payload.role == constants.userRole.ADMIN ){
      return RESP.SUCCESS.USER_TO_ADMIN
    } else if (payload.role == constants.userRole.USER){
      return RESP.SUCCESS.ADMIN_TO_USER
    } else if (payload.role == constants.userRole.OWNER){
      return RESP.SUCCESS.OWNERSHIP_TRANSFERRED
    } else {
    return {};
    }
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.DEFAULT, data , res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function deletePendingRequests(logHandler, payload, res) {
  Promise.coroutine(function* () {
    if (payload.string != '5d41402abc4b2a76b9719d911017c592') {
      throw new Error("Invalid Details!");
    }
    yield userService.deletePendingUserInvites(logHandler);
    yield workspaceService.deletePendingBusinessSignupRequests(logHandler);
    return {};
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.QUERY_RECEIVED, "", res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function verifyInfo(logHandler, payload, res) {
  Promise.coroutine(function* () {
    if (!payload.workspaceInfo) {
      throw new Error("Invalid Data!");
    }

    if (payload.workspaceInfo.role == constants.userRole.USER) {
      throw new Error("You are not authorized!");
    }

    return {
      fugu_secret_key: payload.workspaceInfo.fugu_secret_key
    };
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.QUERY_RECEIVED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}

function getUserContacts(logHandler, payload, res) {
  Promise.coroutine(function* () {

    let attributes = commonFunctions.jsonParse(payload.userInfo.attributes);

    if (!payload.workspaceInfo) {
      throw new Error("Invalid Workspace Id!");
    }

    let workspaceIds = [];

    if (payload.userInfo.google_refresh_token) {
      let google_refresh_token_url = "https://www.googleapis.com/oauth2/v4/token";
      if (payload.workspaceInfo.google_creds) {
        let google_creds = JSON.parse(payload.workspaceInfo.google_creds);

        let opts = {
          client_id: google_creds.googleWebClientId,
          client_secret: google_creds.client_secret,
          refresh_token: payload.userInfo.google_refresh_token,
          grant_type: "refresh_token"
        };
        let userGoogleAccessToken = yield utilityService.sendHttpRequest(logHandler, { url: google_refresh_token_url, method: "POST", json: opts });
        let emailIds = [];
        let url = "https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token={{{user_api_token}}}&max-results=500&v=3.0";
        url = url.replace("{{{user_api_token}}}", userGoogleAccessToken.access_token);
        let options = {
          url: url,
          method: 'GET',
        };

        let userGoogleData = yield utilityService.sendHttpRequest(logHandler, options);

        if (userGoogleData && userGoogleData.feed && userGoogleData.feed.entry) {
          userGoogleData.feed.entry.map((item) => {
            if (item.gd$email) {
              emailIds.push(item.gd$email[0].address);
            }
          });
        }
        userService.updateInfo(logHandler, { user_id: payload.userInfo.user_id, attributes: { invite_emails: emailIds } });
        attributes.invite_emails = emailIds;
      }
    }

    if (payload.contact_type == constants.getContactTypes.ALL || payload.contact_type == constants.getContactTypes.CONTACTS) {
      // get all workspace Ids of user

      let result = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: payload.workspace || constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain")});

      let workspaces = yield workspaceService.getUserWorspaces(logHandler, { user_id: payload.userInfo.user_id, domain_id: result[0].domain_id });

      for (let workspace of workspaces) {
        workspaceIds.push(workspace.workspace_id);
      }
      if (!_.isEmpty(workspaceIds)) {
        attributes.workspace_contacts = yield workspaceService.getWorkspacesUsers(logHandler, { workspaceIds: workspaceIds });
      }
    }

    if (payload.contact_type == constants.getContactTypes.ALL || payload.contact_type == constants.getContactTypes.GROUPS) {
      let opts = {
        app_secret_key: payload.workspaceInfo.fugu_secret_key,
        device_type: constants.getFuguDeviceType(payload.device_type),
        app_version: payload.app_version,
        en_user_id: commonFunctions.encryptText(payload.workspaceInfo.fugu_user_id)
      };

      // attributes.user_groups = yield workspaceController.getAllChannelInfo(logHandler, payload);
      attributes.user_groups = [];
    }
    return attributes;
  })().then((data) => {
    logger.trace(logHandler, { RESPONSE: data });
    UniversalFunc.sendSuccess(RESP.SUCCESS.QUERY_RECEIVED, data, res);
  }, (error) => {
    logger.error(logHandler, error);
    UniversalFunc.sendError(error, res);
  });
}


async function createUser(logHandler, payload) {
  let jsonArray;
  if (payload.csv) {
    let fileName = "./uploads/" + UniversalFunc.generateRandomString();
    await Promise.promisify(commonFunctions.downloadFile).call(null, payload.csv, fileName);
    jsonArray = await csv({ delimiter: [";", ","] }).fromFile(fileName);
    fs.unlink(fileName)
  } else {
    jsonArray = payload.user_data;
  }

  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);

  if (_.isEmpty(workspaceInfo)) {
    throw new Error("Workspace does not exist");
  }
  if (!_.isEmpty(jsonArray)) {
    for (let data of jsonArray) {
      const regex = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
      if ((data.email && regex.test(data.email.toLowerCase())) || data.username) {
        data.email ? data.email = data.email.toLowerCase() : 0;
        data.username ? data.username = data.username.toLowerCase().split(" ").join("") : 0;
        let userInfo = await userService.getUniqueUserInfo(logHandler, { email: data.email, username: data.username, contact_number: data.contact_number });
        let userId;
        if (_.isEmpty(userInfo)) {
          userId = commonFunctions.generateUserId();
          let accessToken = bcrypt.hashSync(data.email || data.contact_number || data.username, saltRounds);
          let userEmail = data.username;
          let insertUser = {
            user_id: userId,
            email: data.email || userEmail + "@fuguchat.com",
            username: data.username || null,
            password: md5(data.password) || md5(data.full_name ? data.full_name.toLowerCase().split(" ")[0] + "@fugu" : data.email.toLowerCase().split('@')[0] + "@fugu"),
            full_name: data.full_name || data.username || "User",
            contact_number: data.contact_number || "",
            access_token: accessToken,
            user_status: constants.UserStatus.REGISTERED
          }
          await userService.insertNew(logHandler, insertUser);
        } else {
          userId = userInfo[0].user_id
        }

        let insertUserDetails = {
          user_unique_key: userId,
          workspace_id: workspaceInfo[0].workspace_id,
          user_image: '',
          contact_number: data.contact_number || '',
          full_name: data.full_name || data.username || data.email.split('@')[0],
          emails: data.username || data.email,
          user_type : 1
        };

        // insertUserDetails.fugu_user_id = workspaceInfo[0].user_id;
       let fuguObj =  await userService.insertUserDetails(logHandler, insertUserDetails);
         await channelService.addUserToGeneralChat(logHandler, { workspace_id: workspaceInfo[0].workspace_id , user_id: fuguObj.insertId, app_name: payload.app_name})
      }
    }
  }
  return {};
}

async function createGroup(logHandler, payload) {
  let jsonArray;
 if (payload.csv) {
    let fileName = "./uploads/" + UniversalFunc.generateRandomString();
    await Promise.promisify(commonFunctions.downloadFile).call(null, payload.csv, fileName);
    jsonArray = await csv({
      delimiter: [";", ","]
    }).fromFile(fileName);
    fs.unlink(fileName)
  } else {
    jsonArray = payload.user_data;
  }

  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  if (!_.isEmpty(jsonArray)) {
    let emails = [] ;
    let usernames = [] ;

      emails = jsonArray.map(x => x["email"]);
      usernames = jsonArray.map(x => x["username"]);

    if (!_.isEmpty(emails) && !_.isEmpty(usernames)) {
      let userObj = {
        workspace_id: workspaceInfo[0].workspace_id,
        status: [constants.status.ENABLED , constants.status.INVITED ]
      };

      _.isEmpty(emails[0]) ? 0 : userObj.email = emails;
      _.isEmpty(usernames[0]) ? 0 : userObj.username = usernames;

      let userInfo;
      let userInfoObj = {
        workspace_id: workspaceInfo[0].workspace_id,
      };
      if (!_.isEmpty(payload.admin_usernames)) {
        if (!_.isEmpty(userObj.email)) {
          userInfoObj.email = payload.admin_usernames;
        } else {
          userInfoObj.username = payload.admin_usernames;
        }
      } else {
        userInfoObj = userObj;
      }
      userInfo = await userService.getUserInfo(logHandler, userObj);
      let userAdmin = await userService.getUserInfo(logHandler, userInfoObj);
      if (!_.isEmpty(userInfo)) {
        let fuguUserIds = userInfo.map(x => x["fugu_user_id"]);
        let headers = {
          "Content-Type": "application/json",
          app_secret_key: workspaceInfo[0].fugu_secret_key,
          app_version: 123,
          device_type: 3
        };
        let options = {
          method: 'POST',
          url: config.get('ocBaseUrl') + constants.API_END_POINT.CREATE_GROUP,
          json: {
            en_user_id: commonFunctions.encryptText(userAdmin[0].fugu_user_id),
            user_ids_to_add: fuguUserIds,
            no_admin_group: true,
            chat_type: payload.is_private ? 3 : 4,
            api_key: true
          },
          headers: headers
        };

        if (!_.isEmpty(payload.admin_usernames)) {
          let opts = {
            workspace_id: workspaceInfo[0].workspace_id,
            status: constants.status.ENABLED
          }
          if(!_.isEmpty(userObj.email)) {
            opts.email = payload.admin_usernames;
          } else {
            opts.username = payload.admin_usernames;
          }
          let adminUserInfo = await userService.getUserInfo(logHandler, opts);
          if (!_.isEmpty(adminUserInfo)) {
            options.json.admin_user_ids = adminUserInfo.map(x => x["fugu_user_id"]);
          }
        }
        payload.group_name ? options.json.custom_label = payload.group_name : 0;

       let response =  await utilityService.sendHttpRequest(logHandler, options);

        // if (workspaceInfo[0].workspace_id == 2478) {
        //   channelService.insertLpuChannels(logHandler, { channel_id: response.data.channel_id, lpu_channel_id: payload.lpu_channel_id });
        // }
       return { channel_id : response.data.channel_id }
      } else {
        throw new Error("User(s) not invited or registered in this workspace.")
      }
    }
  }
}

async function addMemberInGroup(logHandler, payload) {
  let jsonArray;
  if (payload.csv) {
    let fileName = "./uploads/" + UniversalFunc.generateRandomString();
    await Promise.promisify(commonFunctions.downloadFile).call(null, payload.csv, fileName);
    jsonArray = await csv({ delimiter: [";", ","] }).fromFile(fileName);
    fs.unlink(fileName)
  } else {
    jsonArray = payload.user_data;
  }

  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (!_.isEmpty(jsonArray)) {
    let emails = jsonArray.map(x => x["email"]);
    let usernames = jsonArray.map(x => x["username"]);
    let contact_number = jsonArray.map(x => x["contact_number"])
    if (!_.isEmpty(emails) || !_.isEmpty(usernames) || !_.isEmpty(contact_number)) {
      let userObj = {
        workspace_id: workspaceInfo[0].workspace_id,
        status: [constants.status.ENABLED, constants.status.INVITED]
      };
      _.isEmpty(emails) ? 0 : userObj.email = emails;
      _.isEmpty(usernames) ? 0 : userObj.username = usernames;
    //  _.isEmpty(contact_number) ? 0 : userObj.contact_number = contact_number;

      let userInfo = await userService.getUserInfo(logHandler, userObj);

      if (!_.isEmpty(userInfo)) {
        let fuguUserIds = userInfo.map(x => x["fugu_user_id"]);

        let options = {
          method: 'POST',
          url: config.get('ocBaseUrl') + constants.API_END_POINT.ADD_MEMBER,
          json: {
            en_user_id: commonFunctions.encryptText(userOwnerInfo[0].fugu_user_id),
            user_ids_to_add: fuguUserIds,
            api_key: "asffew",
            channel_id: payload.channel_id
          },
          headers: {
            "Content-Type": "application/json",
            app_secret_key: workspaceInfo[0].fugu_secret_key,
            app_version: 123,
            device_type: 3
          }
        };
        payload.group_name ? options.json.custom_label = payload.group_name : 0;

        await utilityService.sendHttpRequest(logHandler, options);
      }
    } else {
      throw new Error("Nothing to add.")
    }
  }
}

async function disableUser(logHandler, payload) {
  let jsonArray;
  if (payload.csv) {
    let fileName = "./uploads/" + UniversalFunc.generateRandomString();
    await Promise.promisify(commonFunctions.downloadFile).call(null, payload.csv, fileName);
    jsonArray = await csv({
      delimiter: [";", ","]
    }).fromFile(fileName);
    fs.unlink(fileName)
  } else {
    jsonArray = payload.user_data;
  }

  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (!_.isEmpty(jsonArray)) {
    let emails = jsonArray.map(x => x["email"]);
    let usernames = jsonArray.map(x => x["username"]);

    if (!_.isEmpty(emails) && !_.isEmpty(usernames)) {
      let userObj = {
        workspace_id: workspaceInfo[0].workspace_id,
        status: constants.status.ENABLED
      };
      _.isEmpty(emails) ? 0 : userObj.email = emails;
      _.isEmpty(usernames) ? 0 : userObj.username = usernames;
      let userInfo = await userService.getUserInfo(logHandler, userObj);
      if (!_.isEmpty(userInfo)) {
        await userService.updateUserDetails(logHandler, { status: constants.status.DISABLED, user_id: userInfo[0].user_id, workspace_id: workspaceInfo[0].workspace_id });
      }
    }
  }
}

async function onBoardUser(logHandler, payload) {
  let userInfo = await userService.getInfo(logHandler, { email: payload.email });

  let adminAccessToken;
  let accessToken;
  if (_.isEmpty(userInfo)) {
    let userId = commonFunctions.generateUserId();
    accessToken = bcrypt.hashSync(payload.email || payload.contact_number, saltRounds);
    let insertUser = {
      user_id: userId,
      email: payload.email,
      password: md5(payload.full_name ? payload.full_name.toLowerCase().split(" ")[0] + "@fugu" : payload.email.toLowerCase().split('@')[0] + "@fugu"),
      full_name: payload.full_name || payload.email.split('@')[0],
      contact_number: payload.contact_number || "",
      access_token: accessToken,
      auth_user_id: payload.user_id,
      user_status: constants.UserStatus.REGISTERED
    };
    adminAccessToken = insertUser.access_token;
    await userService.insertNew(logHandler, insertUser);
  } else {
    accessToken = userInfo[0].access_token;
    adminAccessToken = userInfo[0].access_token;
  }

  let tookanWorkspaceInfo = await workspaceService.getTookanWorkspace(logHandler, payload.user_id);

  let workspaceInfo;
  let response = {};
  if (_.isEmpty(tookanWorkspaceInfo)) {
    let newWorkspace = payload.business_name;
    newWorkspace = newWorkspace.replace(",", "");
    newWorkspace = newWorkspace.replace(".", "");
    newWorkspace = newWorkspace.replace("(", "");
    newWorkspace = newWorkspace.replace(")", "");
    newWorkspace = newWorkspace.replace("undefined", "");
    newWorkspace = newWorkspace.replace("_", "");
    newWorkspace = newWorkspace.replace("'", "");
    newWorkspace = newWorkspace.replace("/", "");


    let options = {
      url: config.get("ocBaseUrl") + "/api/workspace/createWorkspace",
      method: 'POST',
      json: {
        workspace: newWorkspace.split(" ").join("-") + "-" + payload.user_id,
        workspace_name: payload.business_name,
        tookan_user_id: payload.user_id,
        device_id: UniversalFunc.generateRandomString(),
        device_details: { "device_type": "WEB" }
      },
      headers: {
        access_token: accessToken,
        app_version: "1.0.1",
        device_type: "WEB",
      }
    };
    let createWorkspaceResult = await utilityService.sendHttpRequest(logHandler, options);

    if (createWorkspaceResult.statusCode != 200) {
      throw new Error("Workspace already exist.")
    }
    workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, createWorkspaceResult.data.workspace_id);
    let token = CryptoJS.AES.encrypt(adminAccessToken, 'keytoencrypt')
    let workspaceUrl = `https://${workspaceInfo[0].workspace}.${config.get("baseDomain")}/redirectToken?token=${token}`;
    let shortLink = await utilityService.shortnerUrl(logHandler, workspaceUrl);
    shortLink.shortUrl ? workspaceUrl = shortLink.shortUrl : workspaceUrl;
    payload.phone = payload.phone.replace(" ", "");
    payload.phone = payload.phone.replace("-", "");
    // utilityService.sendSmsUsingBumbl(logHandler, { message : `Thank you for being a valuable customer to Tookan. Explore our new field communication add-on Fugu`, phoneNumbers : [payload.phone] });
    response.workspace_url = workspaceUrl;
  } else {
    await workspaceService.updateTookanWorkspace(logHandler, payload.user_id, constants.status.ENABLED);
    let token = CryptoJS.AES.encrypt(adminAccessToken, 'keytoencrypt')
    let workspaceUrl = `https://${tookanWorkspaceInfo[0].workspace}.${config.get("baseDomain")}/redirectToken?token=${token}`;
    let shortLink = await utilityService.shortnerUrl(logHandler, workspaceUrl);
    shortLink.shortUrl ? workspaceUrl = shortLink.shortUrl : workspaceUrl;
    response.workspace_url = workspaceUrl;
    return response;
  }

  let adminUserDetails = await userService.getUserInfo(logHandler, { email: payload.email, workspace_id: workspaceInfo[0].workspace_id });

  let tookan = {
    url: config.get("tookanUrl") + "v2/view_all_team_only",
    method: 'POST',
    json: {
      api_key: payload.api_key
    },
    headers: {
      "Content-Type": "application/json"
    }
  };

  let tookanTeamResult = await utilityService.sendHttpRequest(logHandler, tookan);
  let tookanTeamManagerMap = {};
  let tookanTeamAgentMap = {};

  if (!_.isEmpty(tookanTeamResult.data)) {
    for (let data of tookanTeamResult.data) {
      if (!tookanTeamManagerMap[data.team_id]) {
        tookanTeamManagerMap[data.team_id] = [adminUserDetails[0].fugu_user_id];
        tookanTeamAgentMap[data.team_id] = [];
      }
    }
  }

  let tookanMangerPaylaod = {
    url: config.get("tookanUrl") + "v2/view_all_manager",
    method: 'POST',
    json: {
      api_key: payload.api_key,
      is_password_required: 1
    },
    headers: {
      "Content-Type": "application/json"
    }
  };

  let tookanMangerPaylaodResult = await utilityService.sendHttpRequest(logHandler, tookanMangerPaylaod);

  if (!_.isEmpty(tookanMangerPaylaodResult.data)) {
    let smsSentToManagerMap = {};
    for (let data of tookanMangerPaylaodResult.data) {
      if (data.email) {
        data.email = data.email.toLowerCase();
        let userInfo = await userService.getInfo(logHandler, { email: data.email });
        let userId;
        let managerAccessToken;
        if (_.isEmpty(userInfo)) {
          userId = commonFunctions.generateUserId();
          let accessToken = bcrypt.hashSync(data.email || data.phone, saltRounds);
          let insertUser = {
            user_id: userId,
            email: data.email,
            password: data.password ? data.password : md5(data.full_name ? data.full_name.toLowerCase().split(" ")[0] + "@fugu" : data.email.toLowerCase().split('@')[0] + "@fugu"),
            full_name: data.username || data.email.split('@')[0],
            access_token: accessToken,
            user_status: constants.UserStatus.REGISTERED
          };
          managerAccessToken = insertUser.access_token;
          await userService.insertNew(logHandler, insertUser);
        } else {
          managerAccessToken = userInfo[0].access_token;
          userId = userInfo[0].user_id;
        }
        let insertUserDetails = {
          user_unique_key: userId,
          workspace_id: workspaceInfo[0].workspace_id,
          user_image: '',
          emails: data.email || '',
          full_name: data.username || data.email.split('@')[0]
        };

        // insertUserDetails.fugu_user_id = workspaceInfo[0].user_id;
        await userService.insertUserDetails(logHandler, insertUserDetails);

        if (data.phone && !smsSentToManagerMap[data.phone]) {
          try {
            let loginToken = CryptoJS.AES.encrypt(managerAccessToken, 'keytoencrypt');
            let smsUrl = `https://${workspaceInfo[0].workspace}.${config.get("baseDomain")}/redirectToken?token=${loginToken}`;
            let shortLink = await utilityService.shortnerUrl(logHandler, smsUrl);
            shortLink.shortUrl ? smsUrl = shortLink.shortUrl.replace("https://", "") : smsUrl;
            smsSentToManagerMap[data.phone] = true;
            utilityService.sendSmsUsingBumbl(logHandler, { message: `Hey, ${payload.business_name} is now using Fugu to chat and co-ordinate. Join your team here! ${smsUrl}`, phoneNumbers: [data.phone] });
          } catch (error) {
            console.error("Error while sending message to manager", error)
          }
        }

        for (let team of data.teams) {
          tookanTeamManagerMap[team.team_id].push(insertUserDetails.fugu_user_id)
        }
      }
    }
  }

  let tookanAgentPaylaod = {
    url: config.get("tookanUrl") + "v2/get_available_agents",
    method: 'POST',
    json: {
      api_key: payload.api_key,
      is_password_required: 1
    },
    headers: {
      "Content-Type": "application/json"
    }
  };

  let tookanAgentPaylaodResult = await utilityService.sendHttpRequest(logHandler, tookanAgentPaylaod);

  if (!_.isEmpty(tookanAgentPaylaodResult.data)) {
    for (let data of tookanAgentPaylaodResult.data) {
      if (data.phone) {
        let insertUser = true;
        let agentPhoneNumber;
        try {
          data.phone = UniversalFunc.formatPhoneNumber(data.phone)
          data.phone[0] == "+" ? 0 : data.phone = "+" + data.phone;
          data.phone = phoneUtil.parse(data.phone);
          data.phone = phoneUtil.format(data.phone, phone.PhoneNumberFormat.INTERNATIONAL);
          agentPhoneNumber = data.phone;
          data.phone = data.phone.replace(" ", "-");
          data.phone = data.phone.split(" ").join("");
          data.phone.split(" ").join("-");
        } catch (error) {
          insertUser = false;
          console.error("Error >>>>>", error)
        }

        if (insertUser) {
          let userInfo = await userService.getInfo(logHandler, { contact_number: data.phone });
          let userId;
          let agentAccessToken;
          if (_.isEmpty(userInfo)) {
            userId = commonFunctions.generateUserId();
            let accessToken = bcrypt.hashSync(data.email || data.phone, saltRounds);
            let insertUser = {
              user_id: userId,
              email: data.phone.split('-')[1] + '@fuguchat.com',
              password: data.password ? data.password : md5(data.name ? data.name.toLowerCase().split(" ")[0] + "@fugu" : data.phone + "@fugu"),
              full_name: data.username || "Agent",
              contact_number: data.phone || "",
              access_token: accessToken,
              user_status: constants.UserStatus.REGISTERED
            };
            agentAccessToken = insertUser.access_token;
            await userService.insertNew(logHandler, insertUser);
          } else {
            userId = userInfo[0].user_id;
            agentAccessToken = userInfo[0].access_token;
          }
          let insertUserDetails = {
            user_unique_key : userId,
            workspace_id: workspaceInfo[0].workspace_id,
            user_image: '',
            email: insertUser.email,
            contact_number: data.phone || '',
            full_name: data.name || "AGENT"
          };


          if (data.phone) {
            try {
              agentPhoneNumber = agentPhoneNumber.replace(" ", "");
              let agentLoginToken = CryptoJS.AES.encrypt(agentAccessToken, 'keytoencrypt')
              let smsUrl = `https://${workspaceInfo[0].workspace}.${config.get("baseDomain")}/redirectToken?token=${agentLoginToken}`;
              let shortLink = await utilityService.shortnerUrl(logHandler, smsUrl);
              shortLink.shortUrl ? smsUrl = shortLink.shortUrl.replace("https://", "") : 0;
              utilityService.sendSmsUsingBumbl(logHandler, { message: `Hey, ${payload.business_name} is now using Fugu to chat and co-ordinate. Join your team here! ${smsUrl}`, phoneNumbers: [agentPhoneNumber] });
            } catch (error) {
              console.error("Error while sending message to agent", error)
            }
          }

          // insertUserDetails.fugu_user_id = workspaceInfo[0].user_id;
          await userService.insertUserDetails(logHandler, insertUserDetails);
          tookanTeamAgentMap[data.team_id].push(insertUserDetails.fugu_user_id)
        }
      }
    }
  }

  if (!_.isEmpty(tookanTeamResult.data)) {
    for (let data of tookanTeamResult.data) {
      if (_.isEmpty(tookanTeamManagerMap[data.team_id]) && _.isEmpty(tookanTeamAgentMap[data.team_id])) {
       } else {
        let createGroupPayload = {
          method: 'POST',
          url: 'https://api-oc.fuguchat.com' + constants.API_END_POINT.CREATE_GROUP,
          json: {
            en_user_id: _.isEmpty(tookanTeamManagerMap[data.team_id]) ? commonFunctions.encryptText(tookanTeamAgentMap[data.team_id][0]) : commonFunctions.encryptText(tookanTeamManagerMap[data.team_id][0]),
            user_ids_to_add: tookanTeamManagerMap[data.team_id].concat(tookanTeamAgentMap[data.team_id]),
            chat_type: 3,
            custom_label: data.team_name
          },
          headers: {
            "Content-Type": "application/json",
            app_secret_key: workspaceInfo[0].fugu_secret_key,
            app_version: 123,
            device_type: 3
          }
        };
        _.isEmpty(tookanTeamManagerMap[data.team_id]) ? createGroupPayload.json.no_admin_group = true : 0;
        await utilityService.sendHttpRequest(logHandler, createGroupPayload);
      }
    }
  }
  return response;
}

async function editWorkspace(logHandler, payload) {
  await workspaceService.updateTookanWorkspace(logHandler, payload.user_id, constants.status.DISABLED);
  return {};
}

async function renameGroup(logHandler, payload) {
  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (_.isEmpty(workspaceInfo)) {
    throw new Error("INVALID TOKEN");
  }

  let options = {
    method: 'POST',
    url: config.get('ocBaseUrl') + constants.API_END_POINT.EDIT_INFO,
    json: {
      en_user_id: commonFunctions.encryptText(userInfo[0].fugu_user_id),
      channel_id: payload.channel_id,
      custom_label: payload.custom_label,
      api_key: payload.token
    },
    headers: {
      "Content-Type": "application/json",
      app_secret_key: workspaceInfo[0].fugu_secret_key,
      app_version: 123,
      device_type: 3
    }
  };

  let result = await utilityService.sendHttpRequest(logHandler, options);
  if (result.statusCode != 200 && result.statusCode != 201) {
    throw new Error(result.message);
  }
  return {};
}

async function getGroupInfo(logHandler, payload) {
  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (_.isEmpty(workspaceInfo)) {
    throw new Error("INVALID TOKEN");
  }


  let options = {
    method: 'GET',
    url: config.get('ocBaseUrl') + constants.API_END_POINT.GET_GROUP_INFO + `?channel_id=${payload.channel_id}&en_user_id=${commonFunctions.encryptText(userInfo[0].fugu_user_id)}&get_data_type=MEMBERS`,
    headers: {
      "Content-Type": "application/json",
      app_secret_key: workspaceInfo[0].fugu_secret_key,
      app_version: 123,
      device_type: 3
    }
  }
  let result = await utilityService.sendHttpRequest(logHandler, options);
  if (result.statusCode == 400) {
    throw new Error(result.message);
  }
  return result.data;
}

async function deleteGroup(logHandler, payload) {
  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (_.isEmpty(workspaceInfo)) {
    throw new Error("INVALID TOKEN");
  }

  let options = {
    method: 'DELETE',
    url: config.get('ocBaseUrl') + constants.API_END_POINT.DELETE_FROM_CHANNEL,
    json: {
      channel_id: payload.channel_id,
      en_user_id: commonFunctions.encryptText(userInfo[0].fugu_user_id),
      delete_channel: true,
      api_key: true
    },
    headers: {
      "Content-Type": "application/json",
      app_secret_key: workspaceInfo[0].fugu_secret_key,
      app_version: 123,
      device_type: 3
    }
  };

  let result = await utilityService.sendHttpRequest(logHandler, options);
  if (result.statusCode == 400) {
    throw new Error(result.message);
  }
  return {};
}

async function removeMemberFromGroup(logHandler, payload) {
  let jsonArray;
  if (payload.csv) {
    let fileName = "./uploads/" + UniversalFunc.generateRandomString();
    await Promise.promisify(commonFunctions.downloadFile).call(null, payload.csv, fileName);
    jsonArray = await csv({ delimiter: [";", ","] }).fromFile(fileName);
    fs.unlink(fileName)
  } else {
    jsonArray = payload.user_data;
  }

  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: workspaceInfo[0].workspace_id, status: constants.status.ENABLED });

  if (!_.isEmpty(jsonArray)) {
    let emails = jsonArray.map(x => x["email"]);
    let usernames = jsonArray.map(x => x["username"]);

    if (!_.isEmpty(emails) && !_.isEmpty(usernames)) {
      let userObj = {
        workspace_id: workspaceInfo[0].workspace_id,
        status: constants.status.ENABLED
      };
      _.isEmpty(emails) ? 0 : userObj.email = emails;
      _.isEmpty(usernames) ? 0 : userObj.username = usernames;
      let userInfo = await userService.getUserInfo(logHandler, userObj);

      if (!_.isEmpty(userInfo)) {
        let fuguUserIds = userInfo.map(x => x["fugu_user_id"]);
        let options = {
          method: 'DELETE',
          url: config.get('ocBaseUrl') + constants.API_END_POINT.DELETE_FROM_CHANNEL,
          json: {
            en_user_id: commonFunctions.encryptText(userOwnerInfo[0].fugu_user_id),
            user_ids_to_remove: fuguUserIds,
            channel_id: payload.channel_id,
            api_key: true
          },
          headers: {
            "Content-Type": "application/json",
            app_secret_key: workspaceInfo[0].fugu_secret_key,
            app_version: 123,
            device_type: 3
          }
        };
        let result = await utilityService.sendHttpRequest(logHandler, options);
        if (result.statusCode != 200) {
          throw new Error(result.message);
        }
      }
      return {};
    }
  }
}

async function userLoginV2(logHandler, payload) {
  payload.email ? payload.email = payload.email.trim().toLowerCase() : 0;
  payload.contact_number ? payload.contact_number = payload.contact_number.trim() : 0;
  payload.username ? payload.username = payload.username : 0;
  let error = {};

  let checkIfUserExists = await userService.getInfo(logHandler, { contact_number: payload.contact_number, email: payload.email , username : payload.username });


  if (!_.isEmpty(checkIfUserExists)) {
    if(checkIfUserExists[0].password == '' || checkIfUserExists[0].password == null){
      let invitationData = await userService.getUserInvitations(logHandler,{number: payload.contact_number, email: payload.email});
      error = new Error("User Password is not set");
      error.statusCode = 203;
      if(!_.isEmpty(invitationData)){
        error.data = {
          invitation_token: invitationData[0].invitation_token,
          workspace       : invitationData[0].workspace
        }
      }
     throw error;
    }
    return checkIfUserExists[0].onboard_source == constants.onBoardSource.GOOGLE ? RESP.SUCCESS.ALREADY_EXIST_FROM_GOOGLE : RESP.SUCCESS.ALREADY_EXIST_FROM_FUGU;
  }

  if (payload.email) {
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
      let ifAlreadyEmailExists = await userService.getInfo(logHandler, { email: payload.email });
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
          timezone: payload.time_zone,
          user_status: constants.UserStatus.REGISTERED
        };

        let emailChange=await userService.getChangeEmailLogs(logHandler,{email:payload.email});
        if(!_.isEmpty(emailChange)){
          error.customMessage = 'Your email was changed to '+ emailChange[0].new_email;
          error.statusCode = 400;
          throw(error);
        }

        await userService.insertNew(logHandler, insertUser);
      }
      else{
        if(!ifAlreadyEmailExists[0].timezone){
          await userService.updateInfo(logHandler,{user_id:ifAlreadyEmailExists[0].user_id,timezone: payload.time_zone})
        }
      }
    }
  }

  if(!payload.username){
  let checkIfAlreadyRequested = await workspaceService.getBusinessSignUpInfo(logHandler, payload);
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

}
 if(payload.domain == 'muleapp.io'){
   payload.domain = "buymule.com";
 }
let workspaceDetails = await workspaceService.getWorkspaceDetailsWithDomain(logHandler,{workspace: constants.defaultWorkspace, domain: payload.domain || config.get('baseDomain')});
workspaceDetails = workspaceDetails[0];
  // sending email using mailgun
  if (!commonFunctions.isEnv("test1")) {
    if (payload.email) {
      sendEmail(
        constants.emailType.BUSINESS_SIGNUP,
        {
          otp: payload.otp,
          email_credentials: workspaceDetails.email_credentials,
          domain_id: workspaceDetails.domain_id,
          logo: workspaceDetails.logo,
          app_name: workspaceDetails.app_name,
        }, payload.email, `${workspaceDetails.app_name} confirmation code: ${payload.otp}`, "Business SignUp Mail"
      );
    } else if(payload.contact_number){
      let contactNumber = payload.contact_number.split('-').join('');
      let message = payload.otp + ' is your OTP for confirming your phone number on '+ workspaceDetails.app_name +'. Thank you for signing up. We' + `'re happy you're here.`;

      await utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [contactNumber] });
    }
  }
  logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: payload });
  if ( payload.username && _.isEmpty(checkIfUserExists) ) {
    throw new Error("User does not exists!");
  }
  return { email: payload.email, disallow_workspace_email: constants.disallowWorkspaceEmail, };
}

async function whatsNewFeature(logHandler, payload) {
  let opts = {};
  let responseObj = {}

  userService.updateWhatsNewStatus(logHandler, { user_id: payload.userInfo.user_id, workspace_id: payload.workspaceInfo.workspace_id })
  opts.workspace_id = payload.workspaceInfo.workspace_id
  opts.page_start = commonFunctions.parseInteger(payload.page_start) || 1;  // pagination
  opts.page_end = payload.page_end || opts.page_start + constants.getUsersDisplaySize - 1;
  opts.role = payload.workspaceInfo.role
  responseObj.data = await userService.getWhatsNewFeatureStatus(logHandler, opts)
  responseObj.page_size = await constants.getUsersDisplaySize;
  return responseObj;
}

async function insertGuest(logHandler, payload) {
  payload.userInfo.role = payload.workspaceInfo.role
  let insertObj = {
    workspace_id: payload.workspace_id
  };
  let channelData;
  let workspaceOwner = await conversationService.getUserDetails(logHandler, {workspace_id: payload.workspace_id, role: 'OWNER', status: 'ENABLED'});
  if(!_.isEmpty(workspaceOwner) && !payload.user_ids_to_connect.includes(workspaceOwner[0].user_id)){
    payload.user_ids_to_connect.push(workspaceOwner[0].user_id);
  }
  if (payload.custom_label) {
    let privateGroup = payload.all_guest
    privateGroup.push(payload.workspaceInfo.fugu_user_id)
    try {
      payload.userInfo.workspace_id = payload.workspace_id;
      payload.userInfo.user_id = payload.workspaceInfo.user_id;
      channelData = await chatController.createGroupChat(logHandler, { user_ids_to_add: payload.user_ids_to_connect, userInfo: payload.userInfo, custom_label: payload.custom_label, businessInfo: { workspace_id: payload.workspace_id } });
    } catch (error) {
      throw new Error(error);
    }
    // let options = {
    //   method: 'POST',
    //   url: config.get('ocBaseUrl') + constants.API_END_POINT.CREATE_GROUP,
    //   json: {
    //     en_user_id        : commonFunctions.encryptText(payload.workspaceInfo.fugu_user_id),
    //     user_ids_to_add   : [payload.workspaceInfo.fugu_user_id],
    //     chat_type         : 3,
    //     custom_label      : payload.custom_label
    //   },
    //   headers: {
    //     "Content-Type" : "application/json",
    //     app_secret_key : payload.workspaceInfo.fugu_secret_key,
    //     app_version    : 123,
    //     device_type    : 3
    //   }
    // };

    // let result = await utilityService.sendHttpRequest(logHandler, options);
    // if(result.statusCode == 200){
    //   if(!_.isEmpty(payload.channel_ids_to_connect)) {
    payload.channel_ids_to_connect ? 0 : payload.channel_ids_to_connect = [];
    payload.channel_ids_to_connect.push(channelData.channel_id);
    // } else {
    //   payload.channel_ids_to_connect = [result.data.channel_id];
    // }
  }

  if (payload.user_ids_to_connect) {
    insertObj.user_ids_to_connect = JSON.stringify(payload.user_ids_to_connect);
  }

  if (payload.channel_ids_to_connect) {
    insertObj.channel_ids_to_connect = JSON.stringify(payload.channel_ids_to_connect);
  }
  userService.insertGuestUserInfo(logHandler, insertObj, payload.all_guest);
}

async function insertUserDeviceDetails(logHandler, payload) {
  const insertObj = {
    user_id: payload.user_id,
    device_id: payload.device_id,
    token: payload.token,
    device_type: payload.device_type,
    voip_token: payload.voip_token,
    device_details: payload.device_details
  };
  await userService.insertUserDeviceDetails(logHandler, insertObj);
}

async function testPushNotification(logHandler, payload) {
  try {
    let userDetails = await userService.getUserInfo(logHandler, { user_id: payload.userInfo.user_id, workspace_id: payload.businessInfo.workspace_id });
    if (_.isEmpty(userDetails)) {
      throw new Error("No valid user found with user_id : " + payload.userInfo.user_id);
    }
    let userIds = [];
    _.each(userDetails, (user) => {
      userIds.push(user.fugu_user_id);
    });
    let userPushList = await userService.getUsersDeviceDetails(logHandler, { userIds: userIds });
    let payloadObj = pushNotificationBuilder.getObject(pushNotificationBuilder.notificationType.TEST_NOTIFICATION);
    payloadObj.push_message = constants.pushNotification.TEST_MESSAGE;
    payloadObj.message = constants.pushNotification.TEST_MESSAGE;
    payloadObj.title = constants.pushNotification.TEST_TITLE;
    payloadObj.chat_type = 0;
    payloadObj.user_id = 0;
    payloadObj.channel_id = -1;
    payloadObj.label = "";
    payloadObj.date_time = new Date();
    payloadObj.label_id = -1;
    payloadObj.new_message = constants.pushNotification.TEST_MESSAGE;
    payloadObj.last_sent_by_full_name = userDetails[0].user_id;
    payloadObj.last_sent_by_id = userDetails[0].user_id;
    payloadObj.last_sent_by_user_type = userDetails[0].user_type;
    payloadObj.app_secret_key = payload.businessInfo.app_secret_key;
    _.each(userPushList, (pushList) => {
      pushList.payload = payloadObj;
    });
    pushNotificationController.sendBulkNotification(logHandler, userPushList);
    return {};
  } catch (error) {
    logger.error(logHandler, error);
    throw new Error(error);
  }
}

async function editInfo(logHandler, payload, res) {
  try {
    let userInfo = payload.userInfo;
    let businessInfo = payload.businessInfo;
    let userUpdateObject = {};
    userUpdateObject.user_id = userInfo.user_id;
    userUpdateObject.workspace_id = businessInfo.workspace_id;
    userUpdateObject.user_properties = commonFunctions.jsonParse(logHandler, userInfo.user_properties);

    // prepare upload info
    if (!_.isEmpty(payload.files)) {
      payload.file = payload.files[0];
      let s3_url = await utilityService.uploadFile(logHandler, { file: payload.files[0] });
      if (s3_url) {
        userUpdateObject.user_image = s3_url.url;
      }
    }

    // update user info
    if (payload.user_properties) {
      payload.user_properties = commonFunctions.jsonToObject(logHandler, payload.user_properties);
      if (!userUpdateObject.user_properties) {
        userUpdateObject.user_properties = {};
      }
      _.each(payload.user_properties, (value, key) => {
        if (constants.validUserProperties.has(key)) {
          userUpdateObject.user_properties[key] = value;
        }
      });
    }
    if (payload.notification_level) {
      userUpdateObject.notification_level = payload.notification_level;
    }
    await userService.updateInfo(logHandler, userUpdateObject, userInfo);


    // notification update
    let notificationUpdate = {};
    notificationUpdate.user_id = userInfo.user_id;
    if (payload.mute_channel_id) {
      redis.del(`channelInfo` + payload.mute_channel_id);
      notificationUpdate.channel_id = payload.mute_channel_id;
      notificationUpdate.notification = constants.pushNotification.MUTED;
      await userService.updateUserToChannel(logHandler, notificationUpdate);
    }
    if (payload.unmute_channel_id) {
      redis.del(`channelInfo` + payload.unmute_channel_id);
      notificationUpdate.channel_id = payload.unmute_channel_id;
      notificationUpdate.notification = constants.pushNotification.UNMUTED;
      await userService.updateUserToChannel(logHandler, notificationUpdate);
    }


    logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: {} });

    return {};
  } catch (error) {
    logger.error(logHandler, { EVENT: "EDIT USER DETAILS ERROR" }, { MESSAGE: error.message });
    throw new Error(error);
  }
}

async function sendMessageEmail(logHandler, payload) {
  try {
    let userEmails = [];
    if (_.isEmpty(payload.user_ids)) {
      throw new Error("Something went wrong");
    }
    let usersInfo = await userService.getUsersByIds(logHandler, { user_ids: payload.user_ids, workspace_id: payload.businessInfo.workspace_id });

    if (!usersInfo.length) {
      throw new Error("No valid User found");
    }
    let message;
    if (payload.muid) {
      message = await conversationService.getMessageByMuid(logHandler, { muid: payload.muid, channel_id: payload.channel_id });
    } else {
      message = await conversationService.getThreadMessageByThreadMuid(logHandler, payload);
    }

    if (_.isEmpty(message) || message[0].message_state == constants.status.DISABLE) {
      throw new Error("Something went wrong");
    }

    if (payload.muid) {
      payload.message_id = message[0].id;
    } else {
      payload.thread_message_id = message[0].thread_message_id;
    }

    const channelInfo = await channelService.getInfo(logHandler, { channel_id: message[0].channel_id });

    if (channelInfo[0].workspace_id != payload.userInfo.workspace_id) {
      throw new Error("Cannot take action on this message")
    }

    const userExistsInChannel = await channelService.getUserFromUserToChannel(logHandler, payload.user_ids, channelInfo[0].channel_id);

    if(!userExistsInChannel.length) {
      throw new Error("User does not belong to this channel.");
    }

    payload.user_ids = userExistsInChannel.map(x => x["user_id"]);

    let sendEmailData = await conversationService.getUserSendEmailData(logHandler, { user_id: payload.userInfo.user_id, userIds: payload.user_ids, message_id: payload.message_id, thread_message_id: payload.thread_message_id });
    let insertSendEmail = {};
    for (let row of sendEmailData) {
      if (row.send_message_email_count >= constants.maxMessageSendAsEmailCountToUser) {
        throw new Error(`Send message as a email limit exceeded!`);
      }
      insertSendEmail[row.send_email_to_user_id] = {};
      insertSendEmail[row.send_email_to_user_id].send_message_email_count = row.send_message_email_count;
    }


    for (let user of usersInfo) {
      userEmails.push(user.email);
      if (!insertSendEmail[user.user_id]) {
        insertSendEmail[user.user_id] = {};
        insertSendEmail[user.user_id].send_message_email_count = 0;
      }

      insertSendEmail[user.user_id].send_message_email_count++;
    }

    payload.insertSendEmail = insertSendEmail;
    conversationService.insertOrUpdateSendMessageAsEmail(logHandler, payload);
    let opts = {
      user_name: payload.userInfo.full_name,
      business_name: payload.businessInfo.workspace_name,
    };

    if (message[0].message_type == constants.messageType.MESSAGE) {
      opts.message = message[0].encrypted_message;
    } else {
      opts.message = "Attached " + constants.defaultEmailMessageBasedOnMessageType[message[0].message_type];
    }

    let [workspaceDetails] = await workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });

    if (payload.userInfo.user_image) {
      opts.user_image_html = ` <div class="table-child"><img src="${payload.userInfo.user_image}" class="image" alt="user_image" /></div>`
    } else {
      opts.user_image_html = ` <div class="table-child"><img src= ${workspaceDetails.logo} class="fugu-image" alt="user_image" /></div>`
    }

    if (payload.channelInfo.chat_type != constants.chatType.O20_CHAT && payload.custom_label) {
      opts.custom_label = `<div style="font-size: 1.2em;margin-top:-1px;"><b>${payload.custom_label}</b></div>`
    }
    opts.app_name = workspaceDetails.app_name;

    opts.domain_id= workspaceDetails.domain_id;
    opts.email_credentials= workspaceDetails.email_credentials;
    commonFunctions.isEnv("test") ? opts.channel_url = `https://${payload.workspace_domain_name}.${workspaceDetails.domain}/messages/${payload.channel_id}` : opts.channel_url = `https://${payload.workspace_domain_name}.fugu.chat/messages/${payload.channel_id}`;

    for (let email of userEmails) {
      sendEmail(constants.emailType.MESSAGE_MAIL, opts, email, `(${payload.businessInfo.workspace_name}) ${payload.userInfo.full_name}`);
    }
    return {};
  } catch (error) {
    logger.error(logHandler, error);
    throw new Error(error);
  }
}

async function editFuguUserInfo(logHandler, payload, res) {
  try {
    const { userInfo } = payload;
    const { businessInfo } = payload;
    let userUpdateObject = {};
    userUpdateObject.user_id = userInfo.user_id;
    userUpdateObject.workspace_id = businessInfo.workspace_id;
    userUpdateObject.user_properties = commonFunctions.jsonParse(logHandler, userInfo.user_properties);

    // prepare upload info
    if (!_.isEmpty(payload.files)) {
      payload.file = payload.files[0];
      let s3_url = await utilityService.uploadFile(logHandler, { file: payload.files[0] });
      if (s3_url) {
        userUpdateObject.user_image = s3_url.url;
      }
    }

    // update user info
    if (payload.user_properties) {
      payload.user_properties = commonFunctions.jsonToObject(logHandler, payload.user_properties);
      if (!userUpdateObject.user_properties) {
        userUpdateObject.user_properties = {};
      }
      _.each(payload.user_properties, (value, key) => {
        if (constants.validUserProperties.has(key)) {
          userUpdateObject.user_properties[key] = value;
        }
      });
    }
    if (payload.notification_level) {
      userUpdateObject.notification_level = payload.notification_level;
    }
    await userService.updateFuguInfo(logHandler, userUpdateObject, userInfo);

    let notificationUpdate = {};
    notificationUpdate.user_id = userInfo.user_id;

    if(payload.channel_id) {
      redis.del(`channelInfo` + payload.channel_id);
      notificationUpdate.channel_id = payload.channel_id;
      notificationUpdate.notification = payload.notification;
      await userService.updateUserToChannel(logHandler, notificationUpdate);
    }
    // notification update
    // REMOVE ON HARD UPDATE
    if (payload.mute_channel_id) {
      redis.del(`channelInfo` + payload.mute_channel_id);
      notificationUpdate.channel_id = payload.mute_channel_id;
      notificationUpdate.notification = constants.channelNotification.MUTED;
      await userService.updateUserToChannel(logHandler, notificationUpdate);
    }
    if (payload.unmute_channel_id) {
      redis.del(`channelInfo` + payload.unmute_channel_id);
      notificationUpdate.channel_id = payload.unmute_channel_id;
      notificationUpdate.notification = constants.channelNotification.UNMUTED;
      await userService.updateUserToChannel(logHandler, notificationUpdate);
    }

    logger.trace(logHandler, { EVENT: "Final response" }, { RESULT: {} });
    return {};
  } catch (error) {
    throw new Error(error);
  }
}

async function getUserChannelsInfo(logHandler, payload) {
  try {
    let userInfo = payload.userInfo;
    let result = await channelService.getUserChannelsInfo(logHandler, payload.userInfo.user_id);
    let channelIds = [];
    for (let row of result) {
      if (row.chat_type != constants.chatType.O20_CHAT && (!row.label || _.isEmpty(commonFunctions.jsonParse(row.channel_image)))) {
        channelIds.push(row.channel_id);
      }
    }

    let lastActiveUsers = await channelService.getChannelsUsersInfo(logHandler, { channel_ids: channelIds, user_id: payload.userInfo.user_id });
    let channelUserInfo = lastActiveUsers.channelUserMap || {};
    let channelLabelInfo = lastActiveUsers.channelLabelMap || {};

    for (let row of result) {
      if (row.chat_type != constants.chatType.O20_CHAT && (!row.label || _.isEmpty(commonFunctions.jsonParse(row.channel_image)))) {

        row.members_info = channelUserInfo[row.channel_id] || [];
        let label = channelLabelInfo[row.channel_id];
        if (row.members_info.length < constants.unamedGroupMemberLength) {
          label = label ? label + ", " + userInfo.full_name.split(' ')[0] : userInfo.full_name.split(' ')[0];
          row.members_info.push({
            full_name: userInfo.full_name.split(' ')[0],
            user_id: userInfo.user_id,
            user_image: userInfo.user_image || ""
          });
        }

        if (!row.label) {
          row.label = label;
        }
      }
    }
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

function notifyUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let userInfo = yield userService.getUserDetail(logHandler, { user_id: payload.userInfo.user_id });
      // switch case
      switch(payload.notification_type) {
        case 'INVITE_USERS': {
          let options = {};
          let userPushList = yield userService.getUsersUniqueDevices(logHandler, { user_unique_keys: payload.user_unique_keys, domain_id : payload.businessInfo.domain_id });
          let users = yield userService.getUsersUsingUserUniqueKey(logHandler, payload.user_unique_keys, payload.userInfo.workspace_id);

          options.businessInfo = payload.businessInfo;
          options.userIds = [];
          options.userIdsToUserUniqueKeyMap = {};
          for (let user of users) {
            options.userIds.push(user.user_id);
            options.userIdsToUserUniqueKeyMap[user.user_id] = user.user_unique_key;
          }
          let notificationType = pushNotificationBuilder.notificationType.NEW_WORKSPACE;

          let pushMessage = userInfo[0].full_name + "" + constants.pushMessage.NEW_WORKSPACE + "" + payload.businessInfo.workspace_name;
          options.userPushList = userPushList;
          options.app_secret_key = payload.businessInfo.app_secret_key;
          options.message = pushMessage;
          options.push_message = pushMessage;
          options.business_id = userInfo[0].workspace_id;
          options.user_thumbnail_image = userInfo[0].user_image;
          options.notification_type = notificationType;
          options.domain = payload.domain,
          options.title   = "Let's Join!";
          options.userInfo = userInfo[0];
          options.update_notification_count = constants.saveNotificationFor.INVITE_USERS;


          // let [businessDetails] = yield businessService.getBusinessDetails(logHandler, { app_secret_key: payload.app_secret_key });
          // options.domain = businessDetails.domain;
          let userDetails = yield businessService.getAllBusinessUserInfo(logHandler, { domain_id: payload.businessInfo.domain_id, user_unique_key: payload.user_unique_keys });

          let userIds = userDetails.map(x => x["user_id"]);
          // options.userIds = userIds;


          let usersUnreadNotifications = yield userService.getUsersNotificationUnreadCount(logHandler, { fugu_user_id: userIds, user_unique_key: payload.user_unique_keys, domain_id: payload.businessInfo.domain_id });
          yield notificationService.saveNotifications(logHandler, options);

          options.usersUnreadNotificationCount = {};
          for (let row of usersUnreadNotifications) {
            if (!options.usersUnreadNotificationCount[row.user_unique_key]) {
              options.usersUnreadNotificationCount[row.user_unique_key] = {};
              //options.usersUnreadNotificationCount[row.user_unique_key].count = 0;
            }
            options.usersUnreadNotificationCount[row.user_unique_key].count = row.unread_notification_count;
          }
          options.userPushList = handleChatService.preparePushNotificationList(options);
          options.userCCPushList = users;
          options.ccMentionPushUsers = {}
          options.followThreadUserIds = {};
          yield handleChatService.pushNotifications(logHandler, options, payload.businessInfo);
          yield handleChatService.controlChannelPushes(logHandler, options);
          break;
        }

        case 'SCHEDULE_MEETING':  {
          let options = {};
          let userPushList = yield userService.getUsersUniqueDevices(logHandler, { user_unique_keys: payload.user_unique_keys, domain_id : payload.businessInfo.domain_id });
          let users = yield userService.getUsersUsingUserUniqueKey(logHandler, payload.user_unique_keys, payload.userInfo.workspace_id);

          options.businessInfo = payload.businessInfo;
          options.userIds = [];
          options.userIdsToUserUniqueKeyMap = {};
          for (let user of users) {
            options.userIds.push(user.user_id);
            options.userIdsToUserUniqueKeyMap[user.user_id] = user.user_unique_key;
          }
          let notificationType = pushNotificationBuilder.notificationType.SCHEDULE_MEETING;

          let pushMessage                   = payload.push_message || userInfo[0].full_name + constants.pushMessage.MEET_CALL;
          options.userPushList              = userPushList;
          options.app_secret_key            = payload.businessInfo.app_secret_key;
          options.message                   = userInfo[0].full_name + pushMessage;
          options.push_message              = userInfo[0].full_name + pushMessage;
          options.business_id               = userInfo[0].workspace_id;
          options.user_thumbnail_image      = userInfo[0].user_image;
          options.notification_type         = notificationType;
          options.domain                    = payload.domain,
          options.title                     = "Let's Join!";
          options.userInfo                  = userInfo[0];
          options.workspace                 = payload.businessInfo.workspace;
          options.pushFlag                  = true;
          options.notification_title        = payload.notification_title;
          options.update_notification_count = constants.saveNotificationFor.MEET_CALL;;


          // let [businessDetails] = yield businessService.getBusinessDetails(logHandler, { app_secret_key: payload.app_secret_key });
          // options.domain = businessDetails.domain;
          let userDetails = yield businessService.getAllBusinessUserInfo(logHandler, { domain_id: payload.businessInfo.domain_id, user_unique_key: payload.user_unique_keys });

          let userIds = userDetails.map(x => x["user_id"]);
          // options.userIds = userIds;


          //console.log("object preparation: ", options, payload)
          let usersUnreadNotifications = yield userService.getUsersNotificationUnreadCount(logHandler, { fugu_user_id: userIds, user_unique_key: payload.user_unique_keys, domain_id: payload.businessInfo.domain_id });
          yield notificationService.saveNotifications(logHandler, options);

          options.usersUnreadNotificationCount = {};
          for (let row of usersUnreadNotifications) {
            if (!options.usersUnreadNotificationCount[row.user_unique_key]) {
              options.usersUnreadNotificationCount[row.user_unique_key] = {};
              //options.usersUnreadNotificationCount[row.user_unique_key].count = 0;
            }
            options.usersUnreadNotificationCount[row.user_unique_key].count = row.unread_notification_count;
          }

          options.userPushList = handleChatService.preparePushNotificationList(options);
          options.userCCPushList = users;

          //console.log("object preparation: ", options)

          options.ccMentionPushUsers = {}
          options.followThreadUserIds = {};
          yield handleChatService.pushNotifications(logHandler, options, payload.businessInfo);
          yield handleChatService.controlChannelPushes(logHandler, options);
          break;
        }
      }

      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

async function logException(logHandler, payload, res) {
  utilityService.insertIntoLogException(logHandler, payload);
}


async function updateLpuUserChannels(logHandler, payload) {
  let lpuChannelID = [];
  let suspendedChannels = [];
  let userFuguChannels = [];
 //  payload.lpu_channel_id = [{ "GroupName": "jaggi-singh-1", "IsSuspended": false }, { "GroupName": "jaggi-singh-2", "IsSuspended": false }, { "GroupName": "jaggi-singh-3", "IsSuspended": false }, { "GroupName": "jaggi-singh-4", "IsSuspended": false }]
  for(let data of payload.lpu_channel_id) {
    if (data.IsSuspended) {
      suspendedChannels.push(data.GroupName)
    }
    if(data.GroupName != "" && data.GroupName != null){
      lpuChannelID.push(data.GroupName)
    }
  }
  if(lpuChannelID.length){
      userFuguChannels = await channelService.getFuguChannels(logHandler, { lpu_channel_id: lpuChannelID, workspace_id: payload.workspace_id });
  }
  try {
    if (userFuguChannels.length && userFuguChannels[0].workspace_id != payload.workspace_id) {
      throw new Error("User and channel does't belong to same business.")
    }

    let alreadyChannelMap = {};
    if(userFuguChannels.length) {
      for (let data of userFuguChannels) {
      if (!alreadyChannelMap[data.custom_label]) {
          alreadyChannelMap[data.custom_label] = data.channel_id;
        }
      }
    }

    let userOwnerInfo = await userService.getUserInfo(logHandler, { role: constants.userRole.OWNER, workspace_id: payload.workspace_id, status: constants.status.ENABLED });
    let params = {};
    params.chat_type = constants.chatType.RESTRICTED_GROUP;
    params.workspace_id = payload.workspace_id;
    params.owner_id = userOwnerInfo[0].fugu_user_id;
    params.channel_image = null;


    let message = `${userOwnerInfo[0].full_name} created a new group`;
    messageParams = {};
    messageParams.workspace_id = userOwnerInfo[0].workspace_id;
    messageParams.user_id = userOwnerInfo[0].user_id;
    messageParams.data = { message };
    messageParams.user_type = userOwnerInfo[0].user_type;
    messageParams.full_name = userOwnerInfo[0].full_name;
    messageParams.message_type = constants.messageType.PUBLIC_NOTE;
    messageParams.status = constants.userConversationStatus.MESSAGE;
    for (let channel of payload.lpu_channel_id) {
      if (!alreadyChannelMap[channel.GroupName] && channel.GroupName != "" && channel.GroupName != null) {
        params.custom_label = channel.GroupName;
        let response = await channelService.insertIntoChannels(logHandler, params);
        messageParams.channel_id = response.insertId;
        messageParams.muid = UniversalFunc.getRandomString();
        conversationService.insertUsersConversation(logHandler, messageParams);
        alreadyChannelMap[channel.GroupName] = response.insertId;

        // Insert Owner In all channels
        let ownerObj = {};
        ownerObj.user_id = userOwnerInfo[0].fugu_user_id;
        ownerObj.channel_id = response.insertId;
        ownerObj.status = constants.userStatus.ENABLE;
        ownerObj.role = constants.userRole.ADMIN;
        ownerObj.last_read_message_id = 0;
        await userService.insertOrUpdateUserInChannel(logHandler, ownerObj);
      }
    }

    userFuguChannels = Object.values(alreadyChannelMap);

    let userInChannels = await channelService.getUserChannelInfo(logHandler, payload.user_id);
    userInChannels = userInChannels.map(x => x["channel_id"]);

    let channelToRemove = userInChannels.filter(id => !userFuguChannels.includes(id))

    let channelsToAdd = userFuguChannels.filter(id => !userInChannels.includes(id))

    if (channelToRemove.length) {
      await channelService.disableUsersOfUserToChannel(logHandler, payload.user_id, channelToRemove);
    }

    if (channelsToAdd.length) {
      await userService.insertUserToChannels(logHandler, { user_id: payload.user_id }, channelsToAdd);
    }

    if (suspendedChannels.length) {
      await channelService.suspendUsersOfUserToChannel(logHandler, payload.user_id, suspendedChannels)
    }
  } catch (err) {
    console.error("LPU error", err)
  }

  return {};
}



async function onboardUser(logHandler, payload) {
  try{
    let userId = commonFunctions.generateUserId();
    let accessToken = bcrypt.hashSync(payload.email || payload.contact_number || payload.username, saltRounds);
    let userEmail = payload.username;
    let insertUser = {
      user_id: userId,
      email: payload.email || userEmail + "@fuguchat.com",
      username: payload.username || null,
      password: null,
      full_name: payload.full_name || payload.username || "User",
      contact_number: payload.contact_number || "",
      access_token: accessToken,
      user_status : constants.UserStatus.REGISTERED
    }
    await userService.insertNew(logHandler, insertUser);


    let insertUserDetails = {
      user_unique_key: userId,
      workspace_id: payload.workspace_id,
      original_image: payload.user_image || '',
      user_image : payload.user_image || '',
      user_thumbnail_image: payload.user_image || '',
      contact_number: payload.contact_number || '',
      image_100x100: payload.user_image ? { image_100x100: payload.user_image } : false,
      full_name: payload.full_name || payload.username || payload.email.split('@')[0],
      emails: payload.username || payload.email,
      user_type: 1
    };

    let fuguObj = await userService.insertUserDetails(logHandler, insertUserDetails);
  } catch(err) {
    console.error("---------",err)
  }

  return;
}


async function getPushNotifications(logHandler, payload) {
  let response = {};
  let domainDetails = await workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain")})

  let pushNotifications = await userService.getPushNotifications(logHandler, { user_unique_key: payload.userInfo.user_id, device_id: payload.device_id, last_notification_id: payload.last_notification_id, domain_id: domainDetails[0].id });
  if(pushNotifications.length) {
    for (let pushData of pushNotifications) {
      pushData.data = JSON.parse(pushData.data);
    }
    userService.deletePush(logHandler, { user_unique_key: payload.userInfo.user_id, device_id: payload.device_id, domain_id: domainDetails[0].id })
  }
  response.push_notifications = pushNotifications;
  response.last_notification_id = await redis.get("lastPushId")
  return response;
 }


async function getAllUserUnreadCount(logHandler, payload) {
  let workspaceInfo = await workspaceService.getBusinessesInfo(logHandler, payload.workspace_id);
  if(!workspaceInfo.length) {
    throw new Error("Invalid Token")
  }

  let userInfo = await userService.getUserInfo(logHandler, {
    workspace_id: workspaceInfo[0].workspace_id,
    status: constants.status.ENABLED,
    username: payload.username
  });

  if(!userInfo.length) {
    throw new Error("Invalid User")
  }

  let userUnreadCount = await conversationService.getWorkspaceUnreadCount(logHandler, { user_id: userInfo[0].fugu_user_id });
  let response = {}
  if(userUnreadCount.length) {
    response.unread_count = userUnreadCount[0].unread_count
  } else {
    response.unread_count = 0;
  }
  return response;
}

async function endSnooze(logHandler, payload) {
  await userService.endSnooze(logHandler,payload)
  return{};
}

async function updateUserDetails(logHandler, payload){
  try{
    payload.email ? payload.email.trim().toLowerCase() : 0;
    payload.contact_number ? payload.contact_number.trim() : 0;
    console
    if (payload.contact_number) {
      let checkIfUserContactNumberExists = await userService.getInfo(logHandler, { contact_number: payload.contact_number });
      if (!_.isEmpty(checkIfUserContactNumberExists)) {
          throw new Error("Phone number already exists");
      }
    }
    let opts = {
      full_name: payload.full_name,
      user_id  : payload.user_id || payload.userInfo.user_id
    }
    if(payload.contact_number){
      payload.userInfo.contact_number = payload.contact_number;
      opts.contact_number             = payload.contact_number;
    }
    userService.updateInfo(logHandler, opts);
    payload.userInfo.full_name = payload.full_name;
    if(payload.workspace_name){
      payload.is_signup = true;
    let workspaceDetails = await workspaceController.createWorkspace(logHandler, payload);
    return workspaceDetails;
  }
    return {};
  }catch(error){
    throw(error);
  }
}

async function getLoginOtp(logHandler, payload){
  let response = {valid: false};
  try{
    let email          = payload.email || null;
    let contact_number = payload.contact_number || null;
    let app_type       = payload.app_type;
    let email_token;
    let logo = constants.FUGU_ICON;
    let email_credentials, domain_id, defaultUrl, app_name;

    let workspaceAppInfo = await workspaceService.getWorkspaceDetails(logHandler, {workspace: constants.defaultWorkspace, domain: payload.domain || config.get('baseDomain')});

   if(workspaceAppInfo && workspaceAppInfo.length){
       logo              = workspaceAppInfo[0].logo;
       app_name          = workspaceAppInfo[0].app_name;
       defaultUrl        = workspaceAppInfo[0].full_domain;
       email_credentials = workspaceAppInfo[0].email_credentials;
       domain_id         = workspaceAppInfo[0].domain_id
   }
    if(contact_number){
      if(!contact_number.includes('-')){
        contact_number = '+91-' + contact_number;
      }
      let options = {
        method: 'POST',
        url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_LOGIN_OTP,
        json: {
          phone   : contact_number.replace('-',''),
          auth_key: config.get("authKey"),
          app_type: app_type,
          offering: constants.SERVER_AUTH_CONSTANTS.FUGU_CHAT_OFFERING_ID
        }
      };
      if(domain_id && domain_id != constants.DOMAIN_MAPPING.FUGU){
        options.json.message_text = `Your verification code for ${constants.defaultBotName[domain_id] ? constants.defaultBotName[domain_id] : "Fugu" } is `;
      }
      let result = await utilityService.sendHttpRequest(logHandler, options);
      userService.insertAuthLogs(logHandler,{request: options, response: result, type: 'GET_OTP', signup_login_source: payload.contact_number});
      if(result.status != 200){
        response.message = result.message;
        return response;
      };
      let default_email = '@junglework.auth';
      email = contact_number.split('+91-').join('') + default_email;
      let otpObj = {
        contact_number: contact_number,
        step          : constants.OTP_STEP.SEND,
      }
      if(payload.resend_otp){
        otpObj.step = constants.OTP_STEP.RESEND
      }
      userService.insertOtpSteps(logHandler, otpObj);
    }
    if(payload.email){

      let emailChange=await userService.getChangeEmailLogs(logHandler,{email:payload.email});
      if(!_.isEmpty(emailChange)){
        let error = {}
        error.customMessage = 'Your email was changed to '+ emailChange[0].new_email;
        error.statusCode = 400;
        throw(error);
      }



      email_token = commonFunctions.getSHAOfObject(new Date().getTime() + email + Math.round(parseFloat(Math.random() * 10000)) + "");
      let url = `https://${defaultUrl}/redirectSignup?token=`;
      let signup_link = url + email_token + "&email=" + email;
      sendEmail(
        constants.emailType.EMAIL_SIGNUP,
        {
          link: signup_link,
          logo: logo,
          app_name: app_name,
          email_credentials: email_credentials,
          domain_id : domain_id
        }, email, `${app_name} Email Verification`
      );
      await workspaceService.insertLoginRequest(logHandler,{email, contact_number, email_token: email_token});
    }
    if(contact_number){
      let getLoginDetails  = await workspaceService.getLoginDetails(logHandler, {contact_number: payload.contact_number, email: payload.email});
      if(_.isEmpty(getLoginDetails)){
        await workspaceService.insertLoginRequest(logHandler,{email, contact_number, email_token: email_token});
      }else{
        let sent_count = getLoginDetails[0].sent_count + 1;
        await workspaceService.updateLoginDetails(logHandler,{email, is_verified: 0, contact_number, sent_count, email_token});
      }
    }
    response.valid = true;
    return response;
  }catch(error){
    logger.error(logHandler, error);
    throw(error);
  }
}

async function validateOtpOrToken(logHandler, payload){
   try{
      let response  = {valid: false};
      let resultObj = {};
      let otpObj = {
        contact_number: payload.contact_number,
        step: constants.OTP_STEP.VALID
      }
      let auth_user_id;
      let getUser = await userService.getInfo(logHandler, { contact_number: payload.contact_number, email: payload.email });
      if(payload.contact_number){
        let options  = {
          method: 'POST',
          url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.VALIDATE_LOGIN_OTP,
          json: {
            phone                 : payload.contact_number.replace('-',''),
            app_type              : payload.app_type,
            otp                   : Number(payload.otp),
            country_phone_code    : payload.country_phone_code || "IN",
            timezone              : payload.timezone || "-330",
            auth_key              : config.get("authKey"),
            offering              : constants.SERVER_AUTH_CONSTANTS.FUGU_CHAT_OFFERING_ID,
            company_address       : constants.SERVER_AUTH_CONSTANTS.COMPANY_ADDRESS,
            company_latitude      : constants.SERVER_AUTH_CONSTANTS.LATITUDE,
            company_longitude     : constants.SERVER_AUTH_CONSTANTS.LONGITUDE,
            ipconfig              : {
              country_code        : payload.country_code || "IN",
              continent_code      : payload.continent_code || "AS"
            }
          }
        }
        let result = await utilityService.sendHttpRequest(logHandler, options);
        userService.insertAuthLogs(logHandler,{request: options, response: result, type: 'VALIDATE_OTP', signup_login_source: payload.contact_number});
        if(result.status != 200){
          otpObj.step = constants.OTP_STEP.INVALID;
          userService.insertOtpSteps(logHandler, otpObj);
           response.message = result.message;
           return response;
        };
        userService.insertOtpSteps(logHandler, otpObj);
        if(result.otp_validation_type ==  constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP && !_.isEmpty(getUser)){
          userService.updateInfo(logHandler, {auth_user_id: result.data.user_id, user_id: getUser[0].user_id});
        }
        if( !_.isEmpty(getUser) && !getUser[0].timezone){
          userService.updateInfo(logHandler, {timezone:payload.timezone, user_id: getUser[0].user_id});
        }
        workspaceService.updateLoginDetails(logHandler, {sent_count:0, is_verified: 1, contact_number: payload.contact_number});
        //case when user is registered in auth and fugu already
        if(result && result.data && result.otp_validation_type ==  constants.AUTH_OTP_VALIDATION_TYPE.LOGIN && !_.isEmpty(getUser) && getUser[0].full_name){
          response.signup_type = constants.AUTH_OTP_VALIDATION_TYPE.LOGIN;
          response.valid = true;
          return response;
        }

       //case when user is registered in fugu but not in auth.
        if(result.otp_validation_type ==  constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP && !_.isEmpty(getUser) && getUser[0].full_name){
          response.signup_type = constants.AUTH_OTP_VALIDATION_TYPE.LOGIN;
          response.valid = true;
          return response;
        }
        //case when user kills the page or app before fill the user name
        if(!_.isEmpty(getUser) && !getUser[0].full_name){
          response.signup_type              = constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP;
          getUser[0].attributes             = commonFunctions.jsonToObject(logHandler, getUser[0].attributes);
          response.user_info                = getUser[0];
          response.supported_file_type      = constants.supportedFileTypes;
          response.fugu_config              = constants.fugu_config;
          response.invitation_to_workspaces = [];
          response.open_workspaces_to_join  = [];
          response.workspaces_info          = [];
          response.valid                    = true;

          return response;
        }
        if(result.otp_validation_type == constants.AUTH_OTP_VALIDATION_TYPE.LOGIN){
          auth_user_id = result.data[0].user_id;
        }else{
          auth_user_id = result.data.user_id
        }
      }else {
        let getDetails  = await workspaceService.getLoginDetails(logHandler, {email: payload.email, email_token: payload.verification_token, verify_status: true, verify_time: true});
        if(_.isEmpty(getDetails)){
          response.message = 'Verification link has been expired!!';
          return response;
        }
        workspaceService.updateLoginDetails(logHandler, {sent_count:0, is_verified: 1,email: payload.email, email_token: payload.verification_token});
        if(!_.isEmpty(getUser) && getUser[0].full_name){
          response.signup_type = constants.AUTH_OTP_VALIDATION_TYPE.LOGIN;
          response.valid = true;
          return response;
        }
        if(!_.isEmpty(getUser) && getUser[0].full_name){
          response.signup_type = constants.AUTH_OTP_VALIDATION_TYPE.LOGIN;
          response.valid = true;
          return response;
        }
        if(!_.isEmpty(getUser) && !getUser[0].full_name){
          response.signup_type              = constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP;
          getUser[0].attributes             = commonFunctions.jsonToObject(logHandler, getUser[0].attributes);
          response.user_info                = getUser[0];
          response.supported_file_type      = constants.supportedFileTypes;
          response.fugu_config              = constants.fugu_config;
          response.invitation_to_workspaces = [];
          response.open_workspaces_to_join  = [];
          response.workspaces_info          = [];
          response.valid                    = true;

          return response;
        }
      }
      let attributes = {};
      if (!payload.contact_number) {
        attributes.is_using_google_apps = await utilityService.checkUsingGoogleApps(logHandler, payload.email);
      }
      attributes = JSON.stringify(attributes);
      let userId = commonFunctions.generateUserId();
      let accessToken = bcrypt.hashSync(payload.email || payload.contact_number, saltRounds);
      let default_email = '@jungleworks.auth';
      let email =   payload.email ? payload.email : payload.contact_number.split('+91-').join('') + default_email;
      let password = payload.contact_number ? payload.contact_number : payload.email;
      if(payload.email){
        let options = {
          method: 'POST',
          url: config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS,
          json: {
            field_names: "access_token, email, user_id",
            email      : payload.email,
            auth_key   : config.get("authKey"),
            offering   : 15
          }
        };
        let response = await utilityService.sendHttpRequest(logHandler, options);
        if(response && response.data && response.data.length && response.data[0].user_id){
          auth_user_id = response.data[0].user_id;
        }
      }
      let insertObj = {
        user_id       : userId,
        email         : email,
        access_token  : accessToken,
        contact_number: payload.contact_number,
        full_name     : payload.full_name,
        auth_user_id  : auth_user_id,
        onboard_source: payload.onboard_source,
        password      : md5(password),
        attributes    : attributes,
        user_status   : constants.UserStatus.REGISTERED
      };
      await userService.insertNew(logHandler, insertObj);
      workspaceService.insertSignUpRequest(logHandler,{ email, contact_number: payload.contact_number, sent_count: 0, is_otp_verified: 1, is_expired: constants.isOtpExpired.YES, otp: payload.otp});

      insertObj.user_channel = commonFunctions.getSHAOfObject(insertObj.user_id);
      resultObj.user_info    =  insertObj;
      await userService.getUserAllInfo(logHandler, { email: email, contact_number: payload.contact_number }, resultObj);
      resultObj.supported_file_type = constants.supportedFileTypes;
      resultObj.fugu_config         = constants.fugu_config;
      insertObj.attributes          = commonFunctions.jsonToObject(logHandler, insertObj.attributes);
      resultObj.user_info           = insertObj;
      resultObj.valid               = true;
      resultObj.signup_type         = constants.AUTH_OTP_VALIDATION_TYPE.SIGNUP;

      return resultObj;
    }catch(error){
     throw(error);
    }
}

exports.loginResponse = function(logHandler, payload, res){
    Promise.coroutine(function* () {
      payload.email          = payload.email          ? payload.email.toLowerCase()   : undefined;
      payload.contact_number = payload.contact_number ? payload.contact_number.trim() : undefined;
      payload.username       = payload.username       ? payload.username.trim()       : undefined;

      let userInfo = yield userService.getInfo(logHandler, { email: payload.email, contact_number: payload.contact_number, username: payload.username });
      if (_.isEmpty(userInfo) || userInfo[0].user_status == constants.UserStatus.INVITED) {
        let error = new Error("User Does not exist");
        error.errorResponse = RESP.ERROR.eng.INVALID_EMAIL;
        throw error;
      }
      userInfo = userInfo[0];

      if (!userInfo.access_token) {
        userInfo.access_token = bcrypt.hashSync(payload.email || payload.contact_number, saltRounds);
        yield userService.updateInfo(logHandler, { user_id: userInfo.user_id, access_token: userInfo.access_token });
      }
      payload.user_id = userInfo.user_id;

      // check login in particular workspace
      let responseObj = {};
      yield userService.getUserAllInfo(logHandler, { email: userInfo.email, contact_number: userInfo.contact_number, username: userInfo.username, domain: payload.domain || config.get("baseDomain") }, responseObj);
      let turnCredentials = yield workspaceService.getTurnCredentials(logHandler)
      turnCredentials[0].ice_servers = commonFunctions.jsonParse(turnCredentials[0].ice_servers);
      responseObj.turn_credentials   = turnCredentials[0];

       // fetch all put users
      let opts = {
        app_version    : payload.app_version,
        device_id      : payload.device_id,
        device_type    : payload.device_type,
        token          : payload.token,
        voip_token     : payload.voip_token,
        device_details : payload.device_details
      };
      if(payload.device_id) {
        for (const space of responseObj.workspaces_info) {
          opts['user_id'] = space.fugu_user_id;
          yield userService.insertUserDeviceDetails(logHandler, opts);
        }
      }
      // else {
      //   logger.error(logHandler, "no device id " + userInfo.user_id);
      // }
      let [workspaceAppInfo] = yield workspaceService.getWorkspaceDetails(logHandler, { workspace: constants.defaultWorkspace, domain: payload.domain || config.get("baseDomain") });
      delete workspaceAppInfo.google_creds;
      delete workspaceAppInfo.email_credentials;

      responseObj.whitelabel_details = workspaceAppInfo;
      userInfo.workspace_properties = JSON.parse(workspaceAppInfo.properties);

      if (payload.device_type == constants.enumDeviceType.ANDROID || payload.device_type == constants.enumDeviceType.IOS) {
        userInfo.app_update_config = {
          app_link       : workspaceAppInfo[constants.deviceTypeLinkKeys[payload.device_type]],
          app_update_text: constants.appUpdateText[payload.device_type]
        };
        let currentAppVersion = payload.app_version;
        if(currentAppVersion < workspaceAppInfo[constants.deviceTypeLatestVersionKeys[payload.device_type]]) {
          userInfo.app_update_config.app_update_message = constants.appUpdateMessage.SOFT_UPDATE;
        }
        if(currentAppVersion < workspaceAppInfo[constants.deviceTypeCriticalVersionKeys[payload.device_type]]) {
          userInfo.app_update_config.app_update_message = constants.appUpdateMessage.HARD_UPDATE;
        }
      }
      userInfo.attributes   = commonFunctions.jsonParse(userInfo.attributes);
      userInfo.user_channel = commonFunctions.getSHAOfObject(userInfo.user_id);
      userInfo.push_token   = workspaceAppInfo.domain_id + userInfo.user_id + payload.device_id;

      userInfo.google_refresh_token ? userInfo.has_google_contacts = true : userInfo.has_google_contacts = false;
      if (payload.device_type == constants.enumDeviceType.ANDROID) {
        let pushObj = yield userService.getMaxPushId(logHandler)
        if(pushObj.length) {
          responseObj.last_notification_id = pushObj[0].id;
        }
      }
      delete userInfo.google_refresh_token;
      delete userInfo.password;
      responseObj.user_info                = userInfo;
      responseObj.restricted_email_domains = constants.disallowWorkspaceEmail;
      responseObj.supported_file_type      = constants.supportedFileTypes;
      responseObj.fugu_config              = constants.fugu_config;
      responseObj.signup_type              = constants.AUTH_OTP_VALIDATION_TYPE.LOGIN;
      return responseObj;
    })().then((data) => {
      logger.trace(logHandler, { RESPONSE: data });
      UniversalFunc.sendSuccess(RESP.SUCCESS.LOGGED_IN, data, res);
    },(error) => {
       error = (error.errorResponse) ? error.errorResponse : error;
       UniversalFunc.sendError(error, res);
    });
}
/**
 * get fugu access token from auth access token
 * @async
 * @method
 * @param {object} logHandler
 * @param {object} payload
 * @returns {object} access_token
 *  @throws {NotFoundError} When the access token is not found.
 */

async function getAccessToken(logHandler, payload){
   try{
    let auth_user_id;
     let body = {
        field_names : "first_name, access_token, password, email, user_id",
        access_token: payload.auth_token,
        auth_key    : config.get("authKey"),
        offering    : 15
     }

    let url = config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS;
    let response = await utilityService.sendRequestToExternalServer(logHandler,url, body);
    if(response && response.data &&  response.data.length){
      auth_user_id = response.data[0].user_id;
    }
    if(auth_user_id){
      let user_details = await userService.getInfo(logHandler,{auth_user_id});
      if(user_details.length){
        return {access_token: user_details[0].access_token};
      }
    }
    throw new Error("User not found!!");
   } catch(error){
     throw(error);
   }
}


/**
 * get white label domain from auth access token
 * @async
 * @method
 * @param {object} logHandler
 * @param {object} payload
 * @returns {object} whitelabel domain or non whitelabel domain
 *  @throws {NotFoundError} When the access token is not found.
 */

async function getWhiteLabelDomain(logHandler, payload){
   try{
    let auth_user_id;
    let domain_ids_array = [1];
     let body = {
        field_names : "first_name, access_token, password, email, user_id",
        access_token: payload.access_token,
        auth_key    : config.get("authKey"),
        offering    : 15
     }

    let url = config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS;
    let response = await utilityService.sendRequestToExternalServer(logHandler,url, body);
    if(response && response.data &&  response.data.length){
      auth_user_id = response.data[0].user_id;
    }
    if(!auth_user_id){
      throw new Error("Invalid Access Token");
    }
    let user_details = await userService.getInfo(logHandler,{auth_user_id});
    if(!user_details.length){
      throw new Error("User not found!!");
    }
    let userWorkspaces   = await workspaceService.getActiveUserInWorkspace(logHandler, {user_unique_key: user_details[0].user_id});
    let workspaceDetails = await workspaceService.getSpaceDetailsById(logHandler,{workspace_id: userWorkspaces[0].workspace_id});
    if(workspaceDetails[0].domain_id != 1){
      domain_ids_array.push(workspaceDetails[0].domain_id);
   }

    let domain_details = await workspaceService.getDomainDetails(logHandler,{domain_ids: domain_ids_array, order_by: true});
    let obj = {
      non_whitelabel_domain: domain_details[0].full_domain,
      whitelabel_domain: ""
    }
    if(domain_details.length > 1){
      obj.whitelabel_domain = domain_details[1].full_domain
    }
    return obj;
   } catch(error){
     throw(error);
   }
}



/**
 * get Plan Expiry Date from auth access token
 * @async
 * @method
 * @param {object} logHandler
 * @param {object} payload
 * @returns {object} plan expire date time
 *  @throws {NotFoundError} When no billing found.
 */

async function getPlanExpiry(logHandler, payload){
  try{
   let auth_user_id;
    let body = {
       field_names : "first_name, access_token, password, email, user_id",
       access_token: payload.access_token,
       auth_key    : config.get("authKey"),
       offering    : 15
    }

   let url = config.get("authServerUrl") + constants.AUTH_API_END_POINT.GET_USER_DETAILS;
   let response = await utilityService.sendRequestToExternalServer(logHandler,url, body);
   if(response && response.data &&  response.data.length){
     auth_user_id = response.data[0].user_id;
   }
   if(!auth_user_id){
     throw new Error("Invalid Access Token");
   }
   let user_details = await userService.getInfo(logHandler,{auth_user_id});
   if(!user_details.length){
     throw new Error("User not found!!");
   }
   let userWorkspaces = await workspaceService.getActiveUserInWorkspace(logHandler, {user_unique_key: user_details[0].user_id});
   let workspace_ids  = userWorkspaces.map(x => x["workspace_id"]);

   let billingDetails = await workspaceService.getBillingDetails(logHandler,{workspace_ids, order_by: true});

   if(!billingDetails.length){
     throw new Error("No billing found for this user!!");
   }
   return{expiry_date: billingDetails[0].expire_on};
  } catch(error){
    throw(error);
  }
}

