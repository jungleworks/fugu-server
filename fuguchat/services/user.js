/**
 * Created by vidit on 7/7/17.
 */
const Promise                               = require('bluebird');
const _                                     = require('underscore');
const dbHandler                             = require('../database').dbHandler;
const constants                             = require('../Utils/constants');
const workspaceService                      = require('./workspace');
const commonFunctions                       = require('../Utils/commonFunctions');
const { logger }                            = require('../libs/pino_logger');
const utilityService                        = require('../services/utility');
const userService                           = require('../services/user');
const channelService                        = require('../services/channel');
const conversationService                   = require('../services/conversation');
const userController                        = require('../Controller/userController')
const bot                                   = require('../services/bot');
const config                                = require('config');
const RESP                                  = require('../Config').responseMessages;
const sendEmail                             = require('../Notification/email').sendEmailToUser;
const fuguService                           = require('../services/fugu');
const utils                                 = require('../Utils/commonFunctions');
const redis                                 = require('../Utils/redis').Redis;
const slaveDbHandler                        = require('../database').slaveDbHandler;


exports.insertNew                                   = insertNew;
exports.getInfoUsingEmailOrAccessToken              = getInfoUsingEmailOrAccessToken;
exports.updateInfo                                  = updateInfo;
exports.saveInvitedUsers                            = saveInvitedUsers;
exports.getUserInvitationData                       = getUserInvitationData;
exports.updateUserInvitation                        = updateUserInvitation;
exports.verifyUser                                  = verifyUser;
exports.duplicateUserInvitationCheck                = duplicateUserInvitationCheck;
exports.markInvitedUserAsUser                       = markInvitedUserAsUser;
exports.checkDuplicate                              = checkDuplicate;
exports.getUserInvitations                          = getUserInvitations;
exports.getRegisteredUsers                          = getRegisteredUsers;
exports.getInfo                                     = getInfo;
exports.saveResetPasswordRequest                    = saveResetPasswordRequest;
exports.saveNewPassword                             = saveNewPassword;
exports.getAllActiveUsers                           = getAllActiveUsers;
exports.updateResetPasswordToken                    = updateResetPasswordToken;
exports.getUserInfo                                 = getUserInfo;
exports.insertUserOnlineStatusLogs                  = insertUserOnlineStatusLogs;
exports.getLeastLoadUsers                           = getLeastLoadUsers;
exports.disableUsers                                = disableUsers;
exports.revokeInvitations                           = revokeInvitations;
exports.insertOrUpdateDevicesDetails                = insertOrUpdateDevicesDetails;
exports.insertDeviceDetails                         = insertDeviceDetails;
exports.insertUserDeviceDetails                     = insertUserDeviceDetails;
exports.updateDeviceDetails                         = updateDeviceDetails;
exports.getAllBusinessWithEmail                     = getAllBusinessWithEmail;
exports.markOfflineUserFromOtherDevices             = markOfflineUserFromOtherDevices;
exports.getDomains                                  = getDomains;
exports.verifyPasswordResetToken                    = verifyPasswordResetToken;
exports.checkIfAlreadyRequestedForPasswordReset     = checkIfAlreadyRequestedForPasswordReset;
exports.insertUserDetails                           = insertUserDetails;
exports.getWorkspaceUsersInfo                       = getWorkspaceUsersInfo;
exports.updateUserDetails                           = updateUserDetails;
exports.replaceAccessToken                          = replaceAccessToken;
exports.getWorkspaceAndDeviceDetails                = getWorkspaceAndDeviceDetails;
exports.getUserAllInfo                              = getUserAllInfo;
exports.getUserDetails                              = getUserDetails;
exports.getWorkspaceOwner                           = getWorkspaceOwner;
exports.inviteUserUsingContactNumber                = inviteUserUsingContactNumber;
exports.inviteUserUsingEmail                        = inviteUserUsingEmail;
exports.getChangeContactNumbers                     = getChangeContactNumbers;
exports.insertChangeContactNumber                   = insertChangeContactNumber;
exports.updateChangeContactNumber                   = updateChangeContactNumber;
exports.insertFeedback                              = insertFeedback;
exports.getFuguUserUnreadCount                      = getFuguUserUnreadCount;
exports.updateDetails                               = updateDetails;
exports.insertUserGdprQuery                         = insertUserGdprQuery;
exports.deletePendingUserInvites                    = deletePendingUserInvites;
exports.getTodayChangeNumberRequests                = getTodayChangeNumberRequests;
exports.getUserTodayPasswordResetRequests           = getUserTodayPasswordResetRequests;
exports.updateUserRoleInChatGroups                  = updateUserRoleInChatGroups;
exports.updateManagerInAttendance                   = updateManagerInAttendance;
exports.updateBulkManagerInAttendance               = updateBulkManagerInAttendance;
exports.getOwner                                    = getOwner;
exports.getUniqueUserInfo                           = getUniqueUserInfo;
exports.getWhatsNewFeatureStatus                    = getWhatsNewFeatureStatus;
exports.updateWhatsNewStatus                        = updateWhatsNewStatus;
exports.insertUserStatus                            = insertUserStatus;
exports.getUsersUpdatedStatus                       = getUsersUpdatedStatus;
exports.getUsersUpdatedStatusCount                  = getUsersUpdatedStatusCount;
exports.updateBilling                               = updateBilling;
exports.getGoogleUserInfo                           = getGoogleUserInfo;
exports.insertNewGoogleUser                         = insertNewGoogleUser;
exports.updateGoogleUserInfo                        = updateGoogleUserInfo;
exports.getUserStatus                               = getUserStatus;
exports.insertGuestUserInfo                         = insertGuestUserInfo;
exports.getGuestUsers                               = getGuestUsers;
exports.getInvitedUserData                          = getInvitedUserData;
exports.getGuestUsersToConnect                      = getGuestUsersToConnect;
exports.disableFuguUser                             = disableFuguUser;
exports.getUsersDeviceDetails                       = getUsersDeviceDetails;
exports.getUserDetail                               = getUserDetail;
exports.updateDeviceInfo                            = updateDeviceInfo;
exports.getUsersNotificationUnreadCount             = getUsersNotificationUnreadCount;
exports.insertOrUpdateUserToChannel                 = insertOrUpdateUserToChannel;
exports.updateUserToChannel                         = updateUserToChannel;
exports.searchBot                                   = searchBot;
exports.searchByName                                = searchByName;
exports.getActiveUsersOfBusiness                    = getActiveUsersOfBusiness;
exports.getUsersWithIds                             = getUsersWithIds;
exports.insertOrUpdateUserInChannel                 = insertOrUpdateUserInChannel;
exports.getGuestData                                = getGuestData;
exports.updateGuest                                 = updateGuest;
exports.getUsersWithAppInfo                         = getUsersWithAppInfo;
exports.insertUserToChannels                        = insertUserToChannels;
exports.getNotificationInfo                         = getNotificationInfo;
exports.updateUserNotificationCount                 = updateUserNotificationCount;
exports.getUsersUniqueDevices                       = getUsersUniqueDevices;
exports.getAllBusinessUsers                         = getAllBusinessUsers;
exports.getInfoUsers                                = getInfoUsers;
exports.decrementUserNotificationUnreadCount        = decrementUserNotificationUnreadCount;
exports.updateFuguInfo                              = updateFuguInfo;
exports.incrementUserNotificationUnreadCount        = incrementUserNotificationUnreadCount;
exports.createChannelsWithBots                      = createChannelsWithBots;
exports.getWorkspaceUser                            = getWorkspaceUser;
exports.getUsersByIds                               = getUsersByIds;
exports.getGuestUsersToConnectInWorkspace           = getGuestUsersToConnectInWorkspace;
exports.getUsersUsingUserUniqueKey                  = getUsersUsingUserUniqueKey;
exports.insertUserToChannel                         = insertUserToChannel;
exports.updateGuestChannels                         = updateGuestChannels;
exports.updateLastSeen                              = updateLastSeen;
exports.getUserLastSeen                             = getUserLastSeen;
exports.searchUserInChannel                         = searchUserInChannel;
exports.searchUser                                  = searchUser;
exports.searchGuestUsers                            = searchGuestUsers;
exports.getGuestUsersToConnectWith                  = getGuestUsersToConnectWith;
exports.checkIfUserIsManager                        = checkIfUserIsManager;
exports.disableFuguUserInAttendance                 = disableFuguUserInAttendance;
exports.insertPushNotification                      = insertPushNotification;
exports.getPushNotifications                        = getPushNotifications;
exports.deletePush                                  = deletePush;
exports.getMaxPushId                                = getMaxPushId;
exports.getLatestUsersDeviceDetails                 = getLatestUsersDeviceDetails;
exports.searchSelf                                  = searchSelf;
exports.disableFuguUserInScrum                      = disableFuguUserInScrum;
exports.updateSnoozeTime                            = updateSnoozeTime;
exports.endSnooze                                   = endSnooze;
exports.insertOrUpdateUserToChannelDetails          = insertOrUpdateUserToChannelDetails;
exports.insertAuthLogs                              = insertAuthLogs;
exports.createBotChannel                            = createBotChannel;
exports.insertOtpSteps                              = insertOtpSteps;
exports.getUserInvitationToken                      = getUserInvitationToken;
exports.getUserAccessToken                          = getUserAccessToken;
exports.insertChangeEmailLogs                       = insertChangeEmailLogs;
exports.getChangeEmailLogs                          = getChangeEmailLogs;
exports.updateUserToWorkspace                       = updateUserToWorkspace;
exports.getUserActiveAndInvitedSpaces               = getUserActiveAndInvitedSpaces;

function checkIfUserIsManager(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT COUNT(*) as count FROM user_to_workspace
    WHERE manager_fugu_user_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id],
      event: "getGuestUsersToConnect"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGuestUsersToConnectWith(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
           ud.user_unique_key as user_id,
           ud.user_id as fugu_user_id,
           ud.full_name,
           ud.contact_number,
           ud.user_image,
           u.email,
           ud.user_thumbnail_image,
           ud.status,
           ud.role
         FROM
            guest_interaction gi JOIN
             user_to_workspace ud  on gi.user_id = ud.user_id and gi.status = 1 and ud.status IN ('ENABLED','INVITED')
             JOIN users u  ON
             u.user_id = ud.user_unique_key
         WHERE
             JSON_CONTAINS(
                 user_ids_to_connect,
                 CAST(? AS CHAR(50))
             ) AND gi.user_id IN( SELECT user_id as fugu_user_id from user_to_workspace where 
              workspace_id = ? and status IN ('ENABLED','INVITED') AND role = 'GUEST')`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id, payload.workspace_id],
      event: "getGuestUsersToConnect"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function searchUser(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let userPlaceHolder = ``;
    let includeUserPlaceholder = `AND  u.user_id != ${payload.user_id} `

    if (payload.include_current_user) {
      includeUserPlaceholder = ''
    }
    let values = [payload.workspace_id];
    let guestPlaceholder = `  UNION
    
    SELECT
     DISTINCT ud.user_id,
      ud.full_name,
      ud.emails as email,
      ud.user_type,
      ud.status,
      ud.contact_number,
      ud.role,
      COALESCE(upds.leave_type,'PRESENT') as leave_type,
      ud.user_id as fugu_user_id,
      coalesce(ud.user_thumbnail_image,"") as user_image,
      ud.user_thumbnail_image as user_thumbnail_image
        FROM
            guest_interaction gi JOIN
            user_to_workspace ud  on gi.user_id = ud.user_id and gi.status = 1  and ud.status IN ('ENABLED','INVITED') AND ud.full_name LIKE ?
            JOIN users u  ON
            u.user_id = ud.user_unique_key
            LEFT JOIN user_present_day_status upds
            on ud.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
        WHERE
            JSON_CONTAINS(
                user_ids_to_connect,
                CAST(${payload.user_id} AS CHAR(50))
            ) AND gi.user_id IN(
                SELECT user_id as fugu_user_id from user_to_workspace where workspace_id = ${payload.workspace_id}  and status IN ('ENABLED','INVITED') AND role = 'GUEST' 
            )
 `
    let statusPlaceholder = ` AND u.status IN ('ENABLED','INVITED')`
    if (payload.user_ids_to_connect) {
      userPlaceHolder = `AND u.user_id IN (?)  `;
      values.push(payload.user_ids_to_connect);
    }
    if (payload.accepted_members) {
      statusPlaceholder = ` AND u.status IN ('ENABLED')`
    }
    if (payload.no_guest_users) {
      guestPlaceholder = ''
    }
    if (payload.user_status == constants.getMembers.DEACTIVATED_MEMBERS) {
      statusPlaceholder = `AND u.status IN ('DISABLED' , 'LEFT')`
    }

    values.push("%" + payload.search_text + "%", "%" + payload.search_text + "%")
    let query = `SELECT
             DISTINCT u.user_id,
             u.full_name,
             u.emails as email,
             u.user_type,
             u.status,
             u.contact_number,
             u.role,
             COALESCE(upds.leave_type,'PRESENT')  as leave_type,
             u.user_id as fugu_user_id,
             coalesce(u.user_thumbnail_image,"") as user_image,
             u.user_image as user_thumbnail_image
         FROM
             user_to_workspace u
             LEFT JOIN user_present_day_status upds
            on u.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
         WHERE
         u.workspace_id = ?  ${userPlaceHolder} ${includeUserPlaceholder} ${statusPlaceholder}  AND u.user_type NOT IN(0, 3, 4, 5 , 7,10) AND u.role!='GUEST'  AND u.full_name LIKE ?
            ${guestPlaceholder}
           `;
    let queryObj = {
      query: query,
      args: values,
      event: "userSearch"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function searchUserInChannel(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let userPlaceHolder = ``;
    let values = [];

    if (payload.user_ids_to_connect) {
      userPlaceHolder = ` u.user_id IN (?) AND `;
      values.push(payload.user_ids_to_connect);
    }

    values.push(payload.channel_id, payload.user_id, payload.workspace_id, "%" + payload.search_text + "%")
    let query = `SELECT
               u.user_id as fugu_user_id,
               u.user_id,
               u.full_name, 
               u.emails as email,
               u.user_type,
               u.status,
               u.contact_number,
               utc.role,
               COALESCE(upds.leave_type,'PRESENT')  as leave_type,
               coalesce(u.user_thumbnail_image,"") as user_image,
               u.user_thumbnail_image as user_thumbnail_image
           FROM
               user_to_workspace u
           JOIN user_to_channel utc ON
               u.user_id = utc.user_id and utc.status = 1
            LEFT JOIN user_present_day_status  upds 
               on u.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
           WHERE
              ${userPlaceHolder} utc.channel_id = ?  AND u.user_id != ? AND u.status IN ('ENABLED','INVITED') AND u.workspace_id = ? AND u.user_type NOT IN(0, 3, 4, 5) AND u.full_name LIKE ? 
       `;
    let queryObj = {
      query: query,
      args: values,
      event: "userSearch"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function searchGuestUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let values = [payload.workspace_id]
    let statusPlaceholder = `and ud.status IN ('ENABLED','INVITED')`

    values.push("%" + payload.search_text + "%", "%" + payload.search_text + "%")

    if (payload.user_status == "DEACTIVATED_MEMBERS") {
      statusPlaceholder = `and ud.status IN ('DISABLED','LEFT')`
    }
    let query = `SELECT
                      ud.user_unique_key as user_id,
                      ud.user_id as fugu_user_id,
                      ud.full_name,
                      u.email,
                      u.auth_user_id,
                      ud.contact_number,
                      coalesce(ud.user_thumbnail_image,"") as user_image,
                      ud.user_thumbnail_image as user_thumbnail_image,
                      ud.status,
                      ud.role,
                      gi.guest_id as id
                  FROM
                      user_to_workspace ud
                  LEFT JOIN users u ON
                      ud.user_unique_key = u.user_id
                  LEFT JOIN guest_interaction gi ON
                      gi.user_id = ud.user_id
                  WHERE
                      ud.workspace_id = ? and ud.role = 'GUEST' ${statusPlaceholder}  and ( ud.full_name like ? or ud.contact_number like ? )`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}



function saveResetPasswordRequest(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `insert into password_reset_request (user_id, reset_token) values (?, ?) On duplicate key update reset_token = ?, expired = 'NO'`;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.reset_token, payload.reset_token],
      event: "savePasswordResetRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function verifyPasswordResetToken(logHandler, token) {
  return new Promise((resolve, reject) => {
    let query = `select user_id from password_reset_request where expired = 'NO' and reset_token = ?`;

    let queryObj = {
      query: query,
      args: [token],
      event: "savePasswordResetRequest"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function checkIfAlreadyRequestedForPasswordReset(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select user_id, sent_count, updated_at from password_reset_request where user_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.user_id],
      event: "checkIfAlreadyRequestedForPasswordReset"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT 
                    user_id,
                    username, 
                    email, 
                    full_name, 
                    user_properties, 
                    auth_user_id, 
                    access_token, 
                    COALESCE(contact_number,"") as contact_number, 
                    user_thumbnail_image as user_image,
                    user_image as original_image, 
                    password, 
                    onboard_source, 
                    COALESCE(attributes,'{}') as attributes,
                    google_refresh_token,
                    apple_user_identifier, 
                    user_status ,
                    timezone
                  FROM 
                    users 
                  WHERE 1 = 1 `;
    let values = [];
    if (payload.email) {
      query += " AND email= ? ";
      values.push(payload.email);
    }

    if (payload.user_id) {
      query += " AND user_id= ? ";
      values.push(payload.user_id);
    }

    if (payload.access_token) {
      query += " AND access_token= ? ";
      values.push(payload.access_token);
    }

    if (payload.contact_number) {
      query += " AND contact_number= ? ";
      values.push(payload.contact_number);
    }

    if (payload.emails) {
      query += " AND email IN (?) ";
      values.push(payload.emails);
    }

    if (payload.contact_numbers) {
      query += " AND contact_number IN (?) ";
      values.push(payload.contact_numbers);
    }

    if (payload.guest_to_connect_users) {
      query += " AND user_id in (?) ";
      values.push(payload.guest_to_connect_users);
    }

    if (payload.username) {
      query += " AND username= ? ";
      values.push(payload.username);
    }
    if(payload.auth_user_id){
      query += " AND auth_user_id = ?";
      values.push(payload.auth_user_id);
    }
    if(payload.apple_user_identifier){
      query += " AND (apple_user_identifier = ? OR email = ?)";
      values.push(payload.apple_user_identifier);
      values.push(payload.apple_email);
    }
    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllActiveUsers(logHandler, workspace_id) {
  return new Promise((resolve, reject) => {
    let query = `Select count(*) as registered_users from user_to_workspace where workspace_id = ? and status = 'ENABLED' AND  user_unique_key NOT IN ("iqfdwcyak5","im4fcyak5") AND user_type IN (1,6)`;
    let queryObj = {
      query: query,
      args: [workspace_id],
      event: "getAllActiveUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function saveNewPassword(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = "UPDATE users SET password = ? where workspace_id = ? and user_id = ?";

    let queryObj = {
      query: query,
      args: [payload.password, password.user_id],
      event: "saveNewPassword"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertNew(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `INSERT  INTO users set ? `;
    let userInfo = {
      user_id: payload.user_id,
      email: payload.email,
      access_token: payload.access_token,
      contact_number: payload.contact_number || null,
      full_name: payload.full_name || '',
      password: payload.password || '',
      username: payload.username || null,
      onboard_source: payload.onboard_source || constants.onBoardSource.FUGU,
      google_refresh_token: payload.google_refresh_token || null,
      user_image: payload.user_image || "",
      user_thumbnail_image: payload.user_thumbnail_image || "",
      user_status: payload.user_status || "",
      business_usecase: payload.business_usecase || null,
      timezone: payload.timezone || null
    };
    payload.auth_user_id ? userInfo.auth_user_id = payload.auth_user_id : 0;
    let queryObj = {
      query: query,
      args: [userInfo],
      event: "Inserting new user "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      userInfo.userId = result.insertId;
      resolve(userInfo);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoUsingEmailOrAccessToken(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let emailOrToken = "";
    if (payload.email) {
      emailOrToken = "email = ?";
      values.push(payload.email);
    } else if (payload.access_token) {
      emailOrToken = "access_token = ?";
      values.push(payload.access_token);
    } else {
      throw new Error("No valid identifier passed");
    }
    let query = `
      SELECT *
      FROM
        users
      WHERE
        ${emailOrToken}
    `;
    let queryObj = {
      query: query,
      args: values,
      event: "Get User Info "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Update users set ? where user_id = ?`;
    let updateObj = {};
    payload.email                 ? updateObj.email                    = payload.email                                  : 0;
    payload.user_status           ? updateObj.user_status              = payload.user_status                            : 0;
    payload.password              ? updateObj.password                 = payload.password                               : 0;
    payload.access_token          ? updateObj.access_token             = payload.access_token                           : "";
    payload.full_name             ? updateObj.full_name                = commonFunctions.toTitleCase(payload.full_name) : 0;
    (payload.user_image || payload.user_image == '') ? updateObj.user_image = payload.user_image                        : "";
    payload.contact_number        ? updateObj.contact_number           = payload.contact_number.trim()                  : 0;
    payload.attributes            ? updateObj.attributes               = commonFunctions.objectStringify(payload.attributes) : 0;
    (payload.user_thumbnail_image || payload.user_thumbnail_image == '') ? updateObj.user_thumbnail_image = payload.user_thumbnail_image : "";
    payload.auth_user_id          ? updateObj.auth_user_id             = payload.auth_user_id          : 0;
    payload.google_refresh_token  ? updateObj.google_refresh_token     = payload.google_refresh_token  : 0;
    payload.username              ? updateObj.username                 = payload.username              : 0;
    payload.notification_level    ? updateObj.notification_level       = payload.notification_level    : 0;
    payload.user_properties       ? updateObj.user_properties          = utils.objectToJson(logHandler, payload.user_properties) : 0;
    payload.end_snooze            ? updateObj.notification_snooze_time = null                          : 0;
    payload.apple_user_identifier ? updateObj.apple_user_identifier    = payload.apple_user_identifier : "";
    payload.timezone              ? updateObj.timezone                 = payload.timezone  :0;

    updateObj.updated_at = new Date();
    let queryObj = {
      query: query,
      args: [updateObj, payload.user_id],
      event: "updating user info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserToWorkspace(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Update user_to_workspace set ? where emails = "${payload.old_email}"`;
    let updateObj = {};
    payload.new_email                 ? updateObj.emails                    = payload.new_email                                  : 0;

    updateObj.updated_at = new Date();
    let queryObj = {
      query: query,
      args: [updateObj],
      event: "updating user info"
    };
    console.log("q===>>>>",queryObj)

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateUserDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let updateObj = {};
    payload.full_name ? updateObj.full_name = commonFunctions.toTitleCase(payload.full_name) : 0;
    (payload.user_image || payload.user_image == '') ? updateObj.user_image = payload.user_image : "";
    payload.password ? updateObj.password = payload.password : "";
    payload.user_type ? updateObj.user_type = payload.user_type : "";
    payload.status ? updateObj.status = payload.status : "";
    payload.designation ? updateObj.designation = payload.designation.trim() : 0;
    payload.location ? updateObj.location = payload.location.trim() : 0;
    payload.contact_number ? updateObj.contact_number = payload.contact_number.trim() : 0;
    payload.department ? updateObj.department = payload.department.trim() : 0;
    payload.role ? updateObj.role = payload.role.trim() : 0;
    (payload.thumbnail_user_image || payload.thumbnail_user_image == '') ? updateObj.user_thumbnail_image = payload.thumbnail_user_image : "";
    payload.manager_data ? (updateObj.manager_fugu_user_id = payload.manager_data.fugu_user_id || 0, updateObj.manager = payload.manager_data.full_name || "") : "";
    payload.manager ? updateObj.manager = payload.manager.trim() : 0;
    payload.auto_download_level ? updateObj.auto_download_level = payload.auto_download_level : 0;
    payload.gallery_media_visibility ? updateObj.gallery_media_visibility = payload.gallery_media_visibility : 0;
    payload.image_100x100 ? updateObj.image_set = JSON.stringify({ image_100x100: payload.image_100x100, image_50x50: payload.image_50x50 }) : 0;
    payload.remove_image_set ? updateObj.image_set = null : 0;
    payload.user_properties ? updateObj.user_properties = payload.user_properties : 0;

    if (_.isEmpty(updateObj)) {
      reject(new Error("Nothing to update!"));
    }

    let placeHolders = ``;
    let newPlaceHolders = ``;
    let values = [updateObj];

    if (payload.disable_all_users) {
      placeHolders = ` user_id = ?`;
      values.push(payload.user_id);
    } else if (payload.old_manager_fugu_user_id) {
      newPlaceHolders = `manager_fugu_user_id = ?`
      placeHolders = ` manager_fugu_user_id = ?`
      values.push(payload.old_manager_fugu_user_id);
    } else if (payload.auto_download_level || (payload.gallery_media_visibility || (payload.gallery_media_visibility == 0))) {
      payload.auto_download_level ? updateObj.auto_download_level = payload.auto_download_level : 0;
      payload.gallery_media_visibility || (payload.gallery_media_visibility == 0) ? updateObj.gallery_media_visibility = payload.gallery_media_visibility : 0;
      placeHolders = ` user_id = ? `;
      newPlaceHolders = ` user_unique_key = ? `;
      values = [updateObj];
      values.push(payload.user_id);
    } else {
      placeHolders = ` user_id = ? and workspace_id = ?`;
      newPlaceHolders = ` user_unique_key = ? and workspace_id = ?`;
      values.push(payload.user_id, payload.workspace_id);
    }
    // let query = ` Update user_details set ? where ${placeHolders}`;

    // let queryObj = {
    //   query : query,
    //   args  : values,
    //   event : "updating user details"
    // };

    // dbHandler.executeQuery(logHandler, queryObj).then((result) => {
    //   resolve(result);
    // }, (error) => {
    //   reject(error);
    // });

    let newQuery = ` Update user_to_workspace set ? where ${newPlaceHolders}`;

    let newQueryObj = {
      query: newQuery,
      args: values,
      event: "updating user details"
    };

    dbHandler.executeQuery(logHandler, newQueryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function saveInvitedUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeHolders = [];


    _.each(payload.emailTokenMap, (value) => {
      values = values.concat(payload.workspace_id, value.email, value.contact_number, value.token, value.status, value.type || constants.userRole.USER, value.invited_by);
      placeHolders = placeHolders.concat("(?,?,?,?,?,?,?)");
    });

    _.each(payload.contactTokenMap, (value) => {
      values = values.concat(payload.workspace_id, value.email, value.contact_number, value.token, value.status, value.type || constants.userRole.USER, value.invited_by);
      placeHolders = placeHolders.concat("(?,?,?,?,?,?,?)");
    });

    placeHolders = placeHolders.join(" ,");

    if (_.isEmpty(values)) {
      logger.error(logHandler, "saveInvitedUsers", payload);
      return reject(new Error("Invalid Info" + payload));
    }
    let query = `INSERT
                   INTO
                       user_invitations( workspace_id,email,contact_number,invitation_token,status,type,invited_by)
                   VALUES ${placeHolders}
                   ON DUPLICATE KEY
                   UPDATE
                       invitation_token =VALUES(invitation_token), 
                       status = VALUES(status)`;
    let queryObj = {
      query: query,
      args: values,
      event: "saveInvitedUsers"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserInvitationData(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placehHolder = "";
    let values = [];

    if (payload.contact_number) {
      placehHolder = ` and contact_number IN (?)`;
      values = [payload.workspace_id, payload.contact_number];
    }
    if (payload.email) {
      placehHolder = ` and email IN (?)`;
      values = [payload.workspace_id, payload.email];
    }

    if (payload.invitation_status) {
      placehHolder = ` and status != ?`;
      values = [payload.workspace_id, payload.invitation_status];
    }

    if (payload.invite_type) {
      placehHolder = ` and type = ?`;
      values = [payload.workspace_id, payload.invite_type];
    }
    let query = `select * from user_invitations where workspace_id = ?  ${placehHolder}`;

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInvitationData"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserInvitation(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    payload.status ? updateObj.status = payload.status : "";
    payload.invitation_token ? updateObj.invitation_token = payload.invitation_token : "";
    payload.sent_count ? updateObj.sent_count = payload.sent_count : "";

    if (_.isEmpty(updateObj) || _.isNull(payload.workspace_id) || _.isUndefined(payload.workspace_id)) {
      return reject(new Error("Nothing to update"));
    }

    let placehHolder = "";
    let values = [updateObj, payload.workspace_id];

    if (payload.contact_number) {
      placehHolder = ` and contact_number = ?`;
      values.push(payload.contact_number);
    }
    if (payload.email) {
      placehHolder = ` and email = ?`;
      values.push(payload.email);
    }

    let query = `update user_invitations set ? where workspace_id = ? ${placehHolder}`;

    let queryObj = {
      query: query,
      args: values,
      event: "updateUserInvitation"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function duplicateUserInvitationCheck(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeholder = '';
    let values = [opts.workspace_id, opts.emails];

    if (opts.emails) {
      placeholder += ' and email in (?) ';
      values = [opts.workspace_id, opts.emails];
    }

    if (opts.contact_numbers) {
      placeholder += ' and contact_number IN (?) ';
      values = [opts.workspace_id, opts.contact_numbers];
    }

    if (_.isEmpty(values)) {
      return reject(new Error("Invalid Information"));
    }

    let query = `select email, contact_number, status from user_invitations where workspace_id = ? ${placeholder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "duplicateCheck"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if (opts.emails) {
        let response = {};
        response.already_invited_emails = [];
        response.reinvited_emails = [];
        _.each(result, (value) => {
          if (value.status == constants.invitationStatus.EXPIRED || value.status == constants.invitationStatus.NOT_EXPIRED) {
            response.already_invited_emails.push(value.email);
          }
          if (value.status == constants.invitationStatus.RE_INVITED) {
            response.reinvited_emails.push(value.email);
          }
        });
        return resolve(response);
      }

      if (opts.contact_numbers) {
        let response = {};
        response.already_invited_contacts = [];
        response.reinvited_contacts = [];
        _.each(result, (value) => {
          if (value.status == constants.invitationStatus.EXPIRED || value.status == constants.invitationStatus.NOT_EXPIRED) {
            response.already_invited_contacts.push(value.contact_number);
          }
          if (value.status == constants.invitationStatus.RE_INVITED) {
            response.reinvited_contacts.push(value.contact_number);
          }
        });
        return resolve(response);
      }
    }, (error) => {
      reject(error);
    });
  });
}

function verifyUser(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select  * from user_invitations where invitation_token = ? `;
    let values = [payload.email_token];

    let queryObj = {
      query: query,
      args: values,
      event: "verifyUser"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function markInvitedUserAsUser(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeholder = '';
    let values = [];

    if (opts.email) {
      placeholder = ' and email = ? ';
      values = [opts.workspace_id, opts.email];
    }
    if (opts.contact_number) {
      placeholder = ' and contact_number = ? ';
      values = [opts.workspace_id, opts.contact_number];
    }

    if (_.isEmpty(values)) {
      reject(new Error('Invalid Info'));
    }

    const query = `update user_invitations set status = 'EXPIRED' where workspace_id = ? ${placeholder} `;
    const queryObj = {
      query,
      args: values,
      event: 'markInvitedUserAsUser'
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function checkDuplicate(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeholder = '';
    let values = [];

    if (opts.emails) {
      placeholder += ' and email in (?) ';
      values = [opts.workspace_id, opts.emails];
    }

    if (opts.contact_numbers) {
      placeholder += ' and u.contact_number IN (?) ';
      values = [opts.workspace_id, opts.contact_numbers];
    }

    if (opts.status) {
      placeholder += ' and uds.status = ? ';
      values.push(opts.status);
    }


    if (_.isEmpty(values)) {
      return reject(new Error("Invalid Information"));
    }

    let query = `select u.user_id, u.email, u.contact_number, uds.status from users u join user_to_workspace uds on u.user_id = uds.user_id where uds.workspace_id = ?  ${placeholder} `;

    let queryObj = {
      query: query,
      args: values,
      event: "check duplicate user"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if (opts.emails) {
        let response = {};
        response.already_registered_emails = [];
        response.left_emails = [];
        _.each(result, (value) => {
          if (value.status == constants.userStatus.ENABLED || value.status == constants.userStatus.DISABLED) {
            response.already_registered_emails.push(value.email);
          }
          if (value.status == constants.userStatus.LEFT) {
            response.left_emails.push(value.email);
          }
        });
        return resolve(response);
      }

      if (opts.contact_numbers) {
        let response = {};
        response.already_registered_contacts = [];
        response.left_contacts = [];
        _.each(result, (value) => {
          if (result.status == constants.userStatus.ENABLED || result.status == constants.userStatus.DISABLED) {
            response.already_registered_contacts.push(value.contact_number);
          }
          if (value.status == constants.userStatus.LEFT) {
            response.left_contacts.push(value.contact_number);
          }
        });
        return resolve(response);
      }
      return resolve([]);
    }, (error) => {
      reject(error);
    });
  });
}

function getRegisteredUsers(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `
                select user_id, full_name, email, user_image from users where workspace_id = ? and status = 'ENABLED' LIMIT ${Math.abs(opts.page_start - 1)} , ${Math.abs(opts.page_end - opts.page_start + 1)}`;
    let queryObj = {
      query: query,
      args: [opts.workspace_id],
      event: "getRegisteredUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserInvitations(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let invitationStatus = [constants.invitationStatus.RE_INVITED, constants.invitationStatus.NOT_EXPIRED];
    let placeHolder = "";
    let values = [invitationStatus,[constants.allowedWorkspaceStatus.DISABLED, constants.allowedWorkspaceStatus.EXPIRED]];
    if(payload.email){
        placeHolder = ` and ui.email = ?`;
        values.push(payload.email);
    }
    if (payload.contact_number) {
      placeHolder += ` OR ui.contact_number = ?`;
      values.push(payload.contact_number);
    }
    if(payload.number){
      placeHolder += ` AND ui.contact_number = ?`;
      values.push(payload.number);
    }
    let query = `
                  SELECT
                  ui.workspace_id,
                  ui.email,
                  ui.invitation_token,
                  wd.workspace,
                  wd.workspace_name,
                  wd.fugu_secret_key
              FROM
                  user_invitations ui
              JOIN workspace_details wd ON
                  ui.workspace_id = wd.workspace_id AND ui.status IN (?) AND wd.status NOT IN (?) 
              where 1=1  ${placeHolder} GROUP BY wd.fugu_secret_key ORDER BY ui.created_at DESC`;

    let queryObj = {
      query: query,
      args: values,
      event: "getUserInvitations"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateResetPasswordToken(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(payload.update_fields)) {
      return reject(new Error("Update Fields Missing"));
    }
    if (_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }

    let updateObj = {};
    updateObj.updated_at = new Date();
    let validUpdateColumns = new Set(["expired", "reset_token", "sent_count"]);
    _.each(payload.update_fields, (value, key) => {
      if (validUpdateColumns.has(key) && (value === null || value == 0 || value)) {
        updateObj[key] = value;
      }
    });

    let values = [];
    let whereCondition = "";
    _.each(payload.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    let query = `UPDATE password_reset_request SET ?  where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: [updateObj].concat(values),
      event: "updateChangeContactNumber"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeholder = '';
    let limitPlaceHolder = ``;
    let values = [];

    if (payload.email) {
      placeholder = ' and u.email IN (?) and uds.workspace_id = ?';
      values = [payload.email, payload.workspace_id];
    }

    if (payload.username) {
      placeholder = `and u.username IN (?) and uds.workspace_id = ?`
      values = [payload.username, payload.workspace_id];
    }

    if (payload.contact_number) {
      placeholder = ' and u.contact_number IN (?)  and uds.workspace_id = ?';
      values = [payload.contact_number, payload.workspace_id];
    }

    if (payload.user_id || payload.fugu_user_id) {
      placeholder = ' and uds.user_id IN (?) and uds.workspace_id = ?';
      values = [payload.fugu_user_id || payload.user_id, payload.workspace_id];
    }

    if (payload.role) {
      placeholder = ' and uds.role = ? and uds.workspace_id = ?';
      values = [payload.role, payload.workspace_id];
    }

    if (payload.status) {
      placeholder += ' and uds.status IN (?)';
      values.push(payload.status);
    }
    if (payload.noBotUsers) {
      placeholder += 'and uds.user_type NOT IN (0,3,4,5,8)'
    }


    if (payload.token) {
      placeholder = ' and uds.user_id IN (?) and uds.workspace_id = ? and u.access_token = ?';
      values = [payload.user_ids, payload.workspace_id, payload.token];
    }

    if (values.length <= 1) {
      return reject(new Error("Insufficient Information Provided!"));
    }


    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }

    let query = `
                  SELECT
                      u.user_id,
                      uds.full_name,
                      u.email,
                      u.full_name as user_name,
                      COALESCE(u.contact_number,"") as user_contact_number,
                      u.user_image as user_image_url,
                      u.user_thumbnail_image as user_thumbnail_image_url,
                      uds.role,
                      coalesce(uds.user_image,"") as user_image,
                      ifnull(uds.user_thumbnail_image, '') as user_thumbnail_image,
                      COALESCE(u.contact_number,"") as contact_number,
                      uds.workspace_id,
                      uds.emails as username,
                      uds.user_id as fugu_user_id,
                      uds.designation,
                      uds.location,
                      uds.manager_fugu_user_id,
                      uds.department,
                      uds.manager,
                      uds.status,
                      uds.created_at,
                      uds.user_type,
                      uds.user_unique_key,
                      u.notification_snooze_time,
                      COALESCE(u.attributes,"{}") as attributes,
                      u.timezone 
                  FROM
                      users u JOIN user_to_workspace uds on u.user_id = uds.user_unique_key
                  WHERE
                      1=1 ${placeholder}  ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "getUserInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getNotificationInfo(logHandler, payload) {
  const query = `SELECT
                    utw.user_id,
                    notification_level,
                    u.notification_snooze_time,
                    COALESCE(utw.user_properties, "{}") AS user_properties
                  FROM user_to_workspace utw JOIN users u on
                  utw.user_unique_key = u.user_id
                   WHERE utw.user_id = ? AND workspace_id = ?`;
  const queryObj = {
    query,
    args: [payload.user_id, payload.workspace_id],
    event: "getInfo"
  };

  try {
    const result = dbHandler.executeQuery(logHandler, queryObj);
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

function getOwner(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `
                  SELECT
                      distinct(u.email)
                  FROM
                      users u JOIN user_to_workspace uds on u.user_id = uds.user_unique_key
                  WHERE
                      uds.workspace_id = ? and uds.role='OWNER'`;
    let values = [payload.workspace_id];
    let queryObj = {
      query: query,
      args: values,
      event: "getOwner"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserOnlineStatusLogs(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `insert into logs_user_online_status (user_id, online_status) values (?, ?)`;
    let values = [payload.user_id, payload.online_status];
    let queryObj = {
      query: query,
      args: values,
      event: "insertUserOnlineStatusLogs"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertChangeEmailLogs(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `insert into tb_change_email_logs SET ? ON DUPLICATE KEY UPDATE new_email = "${payload.new_email}"`;
    let values = payload;
    let queryObj = {
      query: query,
      args: values,
      event: "insertChangeEmailLogs"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getChangeEmailLogs(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM tb_change_email_logs WHERE old_email= ?`;
    let queryObj = {
      query: query,
      args: [payload.email],
      event: "insertChangeEmailLogs"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getLeastLoadUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query =
      `
      select

      count(case when c.status = 2 then c.channel_id end) as closed_channel_count,
      count(case when c.status = 1 then c.channel_id end) as open_channel_count ,
      u.user_id as user_id,
      u.full_name,
      u.user_type

      from users u

      left join channels c
      on u.user_id = c.user_id

      where user_type = 2 AND u.status = 1 AND u.workspace_id = ?
      AND u.online_status = 'AVAILABLE'
      group by c.user_id
      order by open_channel_count asc, closed_channel_count desc
    `;


    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "getLeastLoadUsers"
    };
    let logHandlerLocal = commonFunctions.cloneObject(logHandler);
    logHandlerLocal.logResultLength = true;
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function disableUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE users SET status = 0, access_token = NULL WHERE user_id IN (?) AND workspace_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.user_ids, payload.workspace_id],
      event: "disableUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function revokeInvitations(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_invitations SET is_enabled = 0 WHERE user_id IN (?) AND is_invitation = 1 AND workspace_id = ? `;
    let queryObj = {
      query: query,
      args: [payload.invite_ids, payload.workspace_id],
      event: "revokeInvitations"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

// function insertOrUpdateDevicesDetails(logHandler, payload) {
//   return new Promise((resolve, reject) => {
//     Promise.coroutine(function* () {
//       payload.device_details = commonFunctions.objectStringify(payload.device_details);
//       let obj = {
//         user_id     : payload.user_id,
//         workspace_id : payload.workspace_id,
//         device_id   : payload.device_id
//       };
//       let deviceDetails = yield getDeviceDetails(logHandler, obj);
//       if(!_.isEmpty(deviceDetails)) {
//         yield updateDeviceDetails(logHandler, payload);
//         return {};
//       }
//       yield insertDeviceDetails(logHandler, payload);
//       return {};
//     })().then((data) => {
//       resolve(data);
//     }, (error) => {
//       reject(error);
//     });
//   });
// }

// function getDeviceDetails(logHandler, payload) {
//   return new Promise((resolve, reject) => {
//     let query = `SELECT * from user_devices where workspace_id = ? and user_id = ? and device_id = ? `;
//     let queryObj = {
//       query : query,
//       args  : [payload.workspace_id, payload.user_id, payload.device_id],
//       event : "revokeInvitations"
//     };

//     dbHandler.executeQuery(logHandler, queryObj).then((result) => {
//       resolve(result);
//     }, (error) => {
//       reject(error);
//     });
//   });
// }

function getWorkspaceAndDeviceDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT workspace_details.fugu_secret_key ,
                 user_devices.*
     from user_devices LEFT JOIN workspace_details on user_devices.workspace_id =  workspace_details.workspace_id
      where  user_devices.user_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.user_id, payload.device_id],
      event: "getWorkspaceAndDeviceDetails"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateDevicesDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO  user_devices  (workspace_id,user_id,device_id, token,device_type,device_details) VALUES (?,?,?,?,?,?)
                  ON DUPLICATE KEY UPDATE device_details = ?`;
    let queryObj = {
      query: query,
      args: [
        payload.workspace_id, payload.user_id, payload.device_id, payload.token, payload.device_type, payload.device_details,
        payload.device_details
      ],
      event: "insertOrUpdateDevicesDetails"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
function updateDeviceDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `update 
                user_device_details ud 
                   JOIN 
                user_to_workspace uw 
                ON ud.user_id = uw.user_id set token = null, voip_token = null where  device_id = ? AND uw.user_unique_key = ?`;
    let queryObj = {
      query: query,
      args: [payload.device_id, payload.user_id],
      event: "revokeInvitations"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertDeviceDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let insertObj = {
      workspace_id: payload.workspace_id,
      user_id: payload.user_id,
      device_id: payload.device_id,
      token: payload.token,
      device_type: payload.device_type,
      device_details: payload.device_details,
      online_status: constants.onlineStatus.ONLINE
    };

    let query = `insert into user_devices set ?`;
    let queryObj = {
      query: query,
      args: [insertObj],
      event: "revokeInvitations"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllBusinessWithEmail(logHandler, email) {
  return new Promise((resolve, reject) => {
    let query = `SELECT user_id, workspace_id from users where email = ?`;
    let queryObj = {
      query: query,
      args: [email],
      event: "getAllBusinessWithEmail"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function markOfflineUserFromOtherDevices(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    payload.token ? updateObj.token = payload.token : 0;
    payload.device_details ? updateObj.device_details = payload.device_details : 0;
    updateObj.online_status = constants.onlineStatus.OFFLINE;
    let query = `update user_devices set ? where workspace_id = ? and user_id = ? and device_id != ?`;
    let queryObj = {
      query: query,
      args: [updateObj, payload.workspace_id, payload.user_id, payload.device_id],
      event: "revokeInvitations"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getDomains(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let businessDetails = yield getAllBusinessWithEmail(logHandler, payload.email);
      let businessIds = [];
      _.each(businessDetails, (business) => {
        businessIds.push(business.workspace_id);
      });

      if (_.isEmpty(businessIds)) {
        return [];
      }
      let domains = yield workspaceService.getBusinessesInfo(logHandler, businessIds);
      return domains;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function insertUserDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let insertObj = {
      workspace_id: payload.workspace_id,
      user_unique_key: payload.user_unique_key
    };
    payload.original_image ? insertObj.user_image = payload.original_image : 0;
    payload.user_image ? insertObj.user_thumbnail_image = payload.user_image : 0;
    payload.contact_number ? insertObj.contact_number = payload.contact_number : 0;
    payload.full_name ? insertObj.full_name = payload.full_name : 0;
    payload.role ? insertObj.role = payload.role : 0;
    payload.manager ? insertObj.manager = payload.manager : 0;
    payload.manager_fugu_user_id ? insertObj.manager_fugu_user_id = payload.manager_fugu_user_id : 0;
    payload.status ? insertObj.status = payload.status : 0;
    insertObj.accepted_policies = constants.acceptedPolicies.YES;
    payload.status ? insertObj.status = payload.status : 0;
    insertObj.user_type = payload.user_type || 0;
    payload.emails ? insertObj.emails = payload.emails : 0;
    payload.image_100x100 ? insertObj.image_set = JSON.stringify({ image_100x100: payload.image_100x100, image_50x50: payload.image_50x50 }) : 0;

    let query = `insert into user_to_workspace set ? ON DUPLICATE KEY UPDATE status = ?`;
    let queryObj = {
      query: query,
      args: [insertObj, constants.userStatus.ENABLED],
      event: "insertUserDetails"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceUsersInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placehHolder = '';
    let values = [payload.workspace_id];

    if (payload.status) {
      placehHolder = `and user_unique_key = ?`;
      values.push(payload.user_id);
    } else if (payload.role) {
      placehHolder = ` and role = ?`;
      values.push(payload.role);
    }

    let query = `SELECT user_unique_key as user_id,whats_new_status,role,user_id as fugu_user_id from user_to_workspace where workspace_id = ? and status IN ('ENABLED','INVITED') ${placehHolder} `;
    let queryObj = {
      query: query,
      args: values,
      event: `getWorkspaceUsersInfo`
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function replaceAccessToken(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `update users set access_token = ? where access_token = ?`;
    let queryObj = {
      query: query,
      args: [payload.new_access_token, payload.old_access_token],
      event: `replaceAccessToken`
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserAllInfo(logHandler, payload, result) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspacesInfo = yield workspaceService.getUserBusinessesDetails(logHandler, payload);
      if (!payload.domain_id) {
        const [result] = yield workspaceService.getDomainDetails(logHandler, { domain: payload.domain || config.get("baseDomain") });
        payload.domain_id = result.id;
      }
      let unread_notification_count = 0;
      for (let data of workspacesInfo) {
        const video_conference = yield bot.getApps(logHandler, { workspace_id: data.workspace_id, app_id: constants.AppIdCheck.VIDEO_CONFERENCE });
        if (video_conference && video_conference.length) {
          data.is_conferencing_enabled = video_conference[0].status;
        }
        if (data.workspace_status == constants.businessStatus.EXPIRED) {
          data.billing_url = `https://${data.workspace}.${data.domain}/billing`;
        }
        if (data.workspace_image) {
          data.workspace_image = JSON.parse(data.workspace_image);
        }

        if (data.colors) {
          data.colors = JSON.parse(data.colors);
        }
        unread_notification_count += data.unread_notification_count;


        if (data.attendance_token && 0) {
          let options = {
            url: config.get('attendanceUrl') + constants.API_END_POINT.GET_MEMBERS + `?business_token=${data.attendance_token}&full_name=${data.full_name}&email=${data.email}&user_name=fugu${data.user_id}&user_count=${constants.usersCount.USER}`,
            method: 'GET',
            attendance: true
          };
          let apiResult = yield utilityService.sendHttpRequest(logHandler, options);
          try {
            apiResult = JSON.parse(apiResult);
            data.user_attendance_config = JSON.parse(apiResult.data.user_info[0].config);
            data.attendance_role = apiResult.data.user_info[0].role;
            data.attendance_user_name = apiResult.data.user_info[0].user_name;
          } catch (err) {
            console.error("attendace error", err)
          }
        }

        data.user_properties ? data.user_properties = JSON.parse(data.user_properties) : 0;
        delete data.google_creds;
        delete data.email_credentials;
      }
      if(payload.insert_logs){
        insertLoginLogs(logHandler, { user_id: payload.user_id, username: payload.username, user_agent: payload.user_agent, login_by: constants.LOGIN_BY.FUGU});
      }

      result.unread_notification_count = unread_notification_count;
      let validWorkspacesInfo = [];
      let joinedWorkspaceIds = [];

      for (let workspaceInfo of Array.from(workspacesInfo)) {
        if (workspaceInfo.status != constants.UserStatus.INVITED) {
          joinedWorkspaceIds.push(workspaceInfo.workspace_id);
        }
      }

      // getting all workspaces which has open invitations to email domain
      let OpenWorkspacesToJoin = yield workspaceService.getPublicEmailDomains(logHandler, { email_domain: payload.email.split('@')[1], joinedWorkspaceIds: joinedWorkspaceIds, domain_id: payload.domain_id });
      for (let row of OpenWorkspacesToJoin) {
        joinedWorkspaceIds.push(row.workspace_id);
      }

      let workspacesConfig = {};
      let workspaceAppConfig = {};
      if (!_.isEmpty(joinedWorkspaceIds)) {
        workspacesConfig = yield workspaceService.getConfigurations(logHandler, joinedWorkspaceIds, payload.domain);
        workspaceAppConfig = yield workspaceService.getAppConfigurations(logHandler, joinedWorkspaceIds);
      }
      const overriddenConfigs = yield workspaceService.getWorkspacesOverriddenConfiguration(logHandler, payload.domain)
      for (let workspaceInfo of Array.from(workspacesInfo)) {
        if (!(workspaceInfo.workspace_status == constants.allowedWorkspaceStatus.DISABLED) &&
          workspaceInfo.user_status == constants.userStatus.ENABLED) {
          if (!workspacesConfig[workspaceInfo.workspace_id]) {
            workspaceInfo.config = workspacesConfig[0];
          } else {
            workspaceInfo.config = workspacesConfig[workspaceInfo.workspace_id];
          }
          // parsing for android as string parsing problem was there.
          if (workspaceInfo.config && workspaceInfo.config.max_conference_participants) {
            workspaceInfo.config.max_conference_participants = parseInt(workspaceInfo.config.max_conference_participants);
          }
          for (let i = 0; i < overriddenConfigs.length; i++) {
            let property = overriddenConfigs[i].property;
            workspaceInfo.config[property] = overriddenConfigs[i].value;
          }
          workspaceInfo.en_user_id = commonFunctions.encryptText(workspaceInfo.fugu_user_id);
          validWorkspacesInfo.push(workspaceInfo);
          if(workspaceAppConfig[workspaceInfo.workspace_id]){
            workspaceInfo.installed_apps = workspaceAppConfig[workspaceInfo.workspace_id];
          }
        }

      }
      result.workspaces_info = validWorkspacesInfo;

      let getInvitationObj = {
        email: payload.email
      };

      if (payload.email.split('@')[1] == 'fuguchat.com' || payload.contact_number) {
        getInvitationObj.contact_number = payload.contact_number
      }
      result.invitation_to_workspaces = yield getUserInvitations(logHandler, getInvitationObj);

      for (let row of OpenWorkspacesToJoin) {
        let config = {};
        if (!workspacesConfig[row.workspace_id]) {
          config[row.workspace_id] = workspacesConfig[0];
        } else {
          config[row.workspace_id] = workspacesConfig[row.workspace_id];
        }

        // checking if workspace has enabled open invitations
        if (config[row.workspace_id][constants.workspaceProperties.SIGNUP_MODE] == constants.signUpMode.EMAIL) {
          if (joinedWorkspaceIds.indexOf(row.workspace_id) > -1) {
            joinedWorkspaceIds.splice(joinedWorkspaceIds.indexOf(row.workspace_id), 1);
          }
        }
      }

      // invited user workspace ids
      for (let invitedWorkspaces of result.invitation_to_workspaces) {
        joinedWorkspaceIds.push(invitedWorkspaces.workspace_id);
      }

      let email = payload.email;
      // extracting open workspaces a user can join
       result.open_workspaces_to_join = yield workspaceService.getPublicEmailDomains(logHandler,
         { email_domain: email.split('@')[1], joinedWorkspaceIds: joinedWorkspaceIds,
           domain_id: payload.domain_id });
      return result;
    })().then((data) => {
      logger.trace(logHandler, { getUserAllInfo: data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, error);
      reject(error);
    });
  });
}

function getFuguUserUnreadCount(logHandler, workspaces_info, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      // let fuguUsers = [];
      // for (let workspace_info of workspaces_info) {
      //   let user = {
      //     app_secret_key : workspace_info.fugu_secret_key,
      //     en_user_id     : commonFunctions.encryptText(workspace_info.fugu_user_id),     // app_type, app_version, device_details, web_token
      //     app_version    : opts.app_version,
      //     device_type    : constants.getFuguDeviceType(opts.device_type),
      //     device_id      : opts.device_id
      //   };
      //   fuguUsers.push(user);
      // }
      // let secretKeyToUser = yield conversationService.getUserUnreadCount(logHandler, fuguUsers);
      for (let workspace_info of workspaces_info) {
        // if(secretKeyToUser[workspace_info.fugu_secret_key] || secretKeyToUser[workspace_info.fugu_secret_key] == 0) {
        const user_count = yield conversationService.getUserUnreadCount(logHandler, workspace_info.fugu_user_id);
        workspace_info.en_user_id = commonFunctions.encryptText(workspace_info.fugu_user_id);
        workspace_info.user_id = workspace_info.fugu_user_id;
        workspace_info.user_channel = commonFunctions.getSHAOfObject(workspace_info.fugu_user_id);
        workspace_info.unread_count = user_count.unread_count || 0;
        // }
      }
      return workspaces_info;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

// TODO remove unneccesary
function getUserDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeholder = ``;

    if (payload.workspace_id) {
      placeholder += ` uds.workspace_id = ? AND `;
      values.push(payload.workspace_id);
    }
    if (payload.access_token) {
      placeholder += ` u.access_token = ? AND `;
      values.push(payload.access_token);
    }
    if (payload.email) {
      placeholder += ` u.email = ? AND `;
      values.push(payload.email);
    }

    let query = `SELECT
                      u.email,
                      u.user_id,
                      u.access_token,
                      u.full_name as default_user_name,
                      COALESCE(u.contact_number,"") as default_contact_number,
                      u.user_image as default_user_image,
                      COALESCE(u.attributes,"{}") as attributes,
                      uds.full_name,
                      uds.user_image,
                      uds.role,
                      b.email as workspace_email,
                      b.workspace_name,
                      b.workspace,
                      b.workspace_id,
                      b.fugu_secret_key,
                      b.status,
                      uds.location,
                      uds.department,
                      uds.designation,
                      uds.contact_number,
                      uds.status,
                      b.domain_id,
                      uds.user_id as fugu_user_id
                  FROM
                      users u
                  LEFT JOIN user_to_workspace uds ON
                      u.user_id = uds.user_unique_key
                  LEFT JOIN workspace_details b ON
                      uds.workspace_id = b.workspace_id
                  WHERE 1=1 AND ${placeholder} uds.status = 'ENABLED' AND b.status = 'ENABLED'`;
    let queryObj = {
      query: query,
      args: values,
      event: "getUserDetails"
    };
    let logHandlerLocal = commonFunctions.cloneObject(logHandler);
    logHandlerLocal.logResultLength = true;
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function inviteUserUsingContactNumber(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let opts = {
        workspace_id: payload.workspace_id,
        contact_numbers: payload.contact_numbers
      };
      opts.contact_details = Array.from(new Set(opts.contact_numbers));
      opts.contact_numbers = [];
      _.each(opts.contact_details, (data) => {
        opts.contact_numbers.push(data.contact_number.trim());
        if (!commonFunctions.isValidNumber(data.contact_number, data.country_code)) {
          throw new Error("Number is not valid");
        }
      });
      opts.contact_numbers = [...new Set(opts.contact_numbers)];
      opts.contact_numbers.indexOf(payload.userInfo.contact_number) > -1 ? payload.contact_numbers.splice(payload.contact_numbers.indexOf(payload.userInfo.contact_number), 1) : payload.contact_numbers;

      let duplicateContactNumbers = yield duplicateUserInvitationCheck(logHandler, opts);
      let alreadyInvitedContactNumbers = duplicateContactNumbers.already_invited_contacts.concat(duplicateContactNumbers.reinvited_contacts);

      let response = yield checkDuplicate(logHandler, opts);
      let newInvitedContacts = opts.contact_numbers.filter(el => alreadyInvitedContactNumbers.indexOf(el) < 0);
      let leftUsers = response.left_contacts.filter(el => duplicateContactNumbers.reinvited_contacts.indexOf(el) < 0);
      let contactsToBeInvited = newInvitedContacts.concat(leftUsers);
      if (!_.isEmpty(contactsToBeInvited)) {
        leftUsers = new Set(leftUsers);
        opts.contactTokenMap = {};

        for (let i = 0; i < contactsToBeInvited.length; i++) {
          opts.contactTokenMap[contactsToBeInvited[i]] = {
            token: commonFunctions.getSHAOfObject(new Date().getTime() + contactsToBeInvited[i] + Math.round(parseFloat(Math.random() * 10000)) + ""),
            email: null,
            contact_number: contactsToBeInvited[i],
            status: constants.invitationStatus.NOT_EXPIRED,
            invited_by: payload.workspaceInfo.user_id || payload.workspaceInfo.workspace
          };

          if (payload.is_guest) {
            opts.contactTokenMap[contactsToBeInvited[i]].type = constants.userRole.GUEST
          }

          if (leftUsers.has(contactsToBeInvited[i])) {
            opts.contactTokenMap[contactsToBeInvited[i]].status = constants.invitationStatus.RE_INVITED;
          }

          let contactNumber = contactsToBeInvited[i];
          contactNumber = contactNumber.split('-').join('');
          let url = `https://${payload.workspaceInfo.full_domain}/${payload.workspaceInfo.workspace}/`;
          let invitationLink = url + "redirectInvitation?email_token=" + opts.contactTokenMap[contactsToBeInvited[i]].token + "&contact_number=" + opts.contact_numbers[i] + "&workplace=" + payload.workspaceInfo.workspace;
          let shorterLinkResult = yield utilityService.shortnerUrl(logHandler, invitationLink);
          shorterLinkResult.shortUrl ? invitationLink = shorterLinkResult.shortUrl : 0;

          let message = payload.userInfo.full_name + ` has invited you to ${payload.workspaceInfo.workspace_name} on ${payload.workspaceInfo.app_name}. Click below link to join. ` + invitationLink;

          yield utilityService.sendSmsUsingBumbl(logHandler, { message: message, phoneNumbers: [contactNumber] });
        }
        yield saveInvitedUsers(logHandler, opts);
      }
      return {
        success: contactsToBeInvited,
        duplicateInvited: duplicateContactNumbers
      };
    })().then((result) => {
      logger.trace(logHandler, "inviteUserUsingContactNumber", result);
      resolve(result);
    }, (error) => {
      logger.error(logHandler, "ERROR inviteUserUsingContactNumber", error);
      reject(error);
    });
  });
}

function inviteUserUsingEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let opts = {};
      opts.workspace_id = payload.workspace_id;
      payload.emails = commonFunctions.convertArrayToLowerCase(payload.emails);
      payload.emails = [...new Set(payload.emails)];
      if(!payload.erp_token) {
        payload.emails.indexOf(payload.userInfo.email) > -1 ? payload.emails.splice(payload.emails.indexOf(payload.userInfo.email), 1) : payload.emails;
      }
      opts.emails = Array.from(new Set(payload.emails));
      opts.invitation_type = payload.invitation_type;

      opts.emails = commonFunctions.trimSpaceInArray(logHandler, opts.emails);

      let duplicateEmails = yield duplicateUserInvitationCheck(logHandler, opts);
      let alreadyInvitedEmails = duplicateEmails.already_invited_emails.concat(duplicateEmails.reinvited_emails);

      let response = yield checkDuplicate(logHandler, opts);
      let newInvitedEmails = opts.emails.filter(el => alreadyInvitedEmails.indexOf(el) < 0);
      let leftUsers = response.left_emails.filter(el => duplicateEmails.reinvited_emails.indexOf(el) < 0);
      let emailsToBeInvited = newInvitedEmails.concat(leftUsers);

      if (!_.isEmpty(emailsToBeInvited)) {
        leftUsers = new Set(leftUsers);
        opts.emailTokenMap = {};

        for (let i = 0; i < emailsToBeInvited.length; i++) {
          opts.emailTokenMap[emailsToBeInvited[i]] = {
            token: commonFunctions.getSHAOfObject(new Date().getTime() + emailsToBeInvited[i] + Math.round(parseFloat(Math.random() * 10000)) + ""),
            contact_number: null,
            email: emailsToBeInvited[i],
            status: constants.invitationStatus.NOT_EXPIRED,
            invited_by: payload.workspaceInfo.user_id || -1
          };

          if (payload.is_guest) {
            opts.emailTokenMap[emailsToBeInvited[i]].type = constants.userRole.GUEST
          }

          if (leftUsers.has(emailsToBeInvited[i])) {
            opts.emailTokenMap[emailsToBeInvited[i]].status = constants.invitationStatus.RE_INVITED;
          }
        }

        let invited = yield saveInvitedUsers(logHandler, opts);

        if (invited.insertId <= 0) {
          throw new Error("Something went wrong");
        }
        _.each(opts.emailTokenMap, (value, key) => {
          let url = `https://${payload.workspaceInfo.full_domain}/${payload.workspaceInfo.workspace}/`;
          let invitationLink = url + "redirectInvitation?email_token=" + value.token + "&email=" + value.email + "&workplace=" + payload.workspaceInfo.workspace;


          sendEmail(constants.emailType.USER_INVITATION, {
            full_name: payload.userInfo.full_name,
            workspace_name: payload.workspaceInfo.workspace_name,
            invitation_link: invitationLink,
            logo: payload.workspaceInfo.logo,
            app_name: payload.workspaceInfo.app_name,
            domain_id: payload.workspaceInfo.domain_id,
            email_credentials: payload.workspaceInfo.email_credentials
          }, key, "You have been invited to join " + payload.workspaceInfo.workspace_name + " " + payload.workspaceInfo.app_name, "User Invitation Mail");
        });
      }
      return { success: newInvitedEmails, duplicateInvited: alreadyInvitedEmails };
    })().then((result) => {
      logger.trace(logHandler, "inviteUserUsingContactNumber", result);
      resolve(result);
    }, (error) => {
      logger.error(logHandler, "ERROR inviteUserUsingContactNumber", error);
      reject(error);
    });
  });
}


function getChangeContactNumbers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM change_contact_number WHERE user_id = ? and otp = ? `;
    let queryObj = {
      query: query,
      args: [payload.user_id, payload.otp],
      event: "getChangeContactNumbers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertChangeContactNumber(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT into change_contact_number (user_id, contact_number, otp) values (?, ?, ?) On DUPLICATE KEY UPDATE otp = ? , expired = 'NO'`;
    let queryObj = {
      query: query,
      args: [payload.user_id, payload.contact_number, payload.otp, payload.otp],
      event: "insertChangeContactNumber"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateChangeContactNumber(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(payload.update_fields)) {
      return reject(new Error("Update Fields Missing"));
    }
    if (_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }

    let updateObj = {};
    updateObj.updated_at = new Date();
    let validUpdateColumns = new Set(["expired", "otp", "sent_count", "contact_number"]);
    _.each(payload.update_fields, (value, key) => {
      if (validUpdateColumns.has(key) && (value === null || value == 0 || value)) {
        updateObj[key] = value;
      }
    });

    let values = [];
    let whereCondition = "";
    _.each(payload.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    let query = `UPDATE change_contact_number SET ?  where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: [updateObj].concat(values),
      event: "updateChangeContactNumber"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertFeedback(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO user_feedback (user_id, workspace_id, type, rating, feedback, extra_details) VALUES (?,?,?,?,?,?)`;
    let queryObj = {
      query: query,
      args: [payload.userInfo.user_id, payload.workspace_id || null, payload.type || "HELP", payload.rating || 0, payload.feedback, payload.extra_details],
      event: "insertFeedback"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `update user_details set fugu_user_id = ? where id = ?`;
    let queryObj = {
      query: query,
      args: [payload.fugu_user_id, payload.id],
      event: "insertFeedback"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertUserGdprQuery(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `insert into gdpr_queries ( user_id, workspace_id, reason, query) values (?,?,?,?)`;
    let queryObj = {
      query: query,
      args: [payload.userInfo.user_id, payload.workspace_id, payload.reason, payload.query],
      event: "insertUserGdprQuery"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function deletePendingUserInvites(logHandler) {
  return new Promise((resolve, reject) => {
    let query = `delete FROM user_invitations where status = 'NOT_EXPIRED' and updated_at < Date(now()) - INTERVAL 30 DAY`;
    let queryObj = {
      query: query,
      args: [],
      event: "deletePendingUserInvites"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getTodayChangeNumberRequests(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT user_id FROM change_contact_number WHERE user_id = ? and Date(created_at) =  Date(now()) `;

    let queryObj = {

      query: query,

      args: [payload.user_id, payload.otp],

      event: "getChangeContactNumbers"

    };


    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function getUserTodayPasswordResetRequests(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select user_id from password_reset_request where user_id = ? and date(created_at) = date(now())`;

    let queryObj = {
      query: query,
      args: [payload.user_id],
      event: "checkIfAlreadyRequestedForPasswordReset"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateUserRoleInChatGroups(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE
            user_to_channel utc
        JOIN channels c ON
            utc.channel_id = c.channel_id
        SET
            utc.role = ?
        WHERE
            c.workspace_id = ? AND c.chat_type IN (5,6) AND utc.user_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.role, payload.workspace_id, payload.fugu_user_id],
      event: "updateUserRoleInChatGroups"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateManagerInAttendance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let query = `UPDATE 
                ${databaseName}.users a 
                SET 
                a.manager_user_id =( 
                SELECT 
                * 
                FROM 
                (SELECT 
                au.user_id 
                FROM 
                ${databaseName}.users au 
                WHERE 
                au.user_name = CONCAT("fugu", ?) ) AS user_name ) 
                WHERE 
                a.user_name = CONCAT("fugu", ?)`;
    let queryObj = {
      query: query,
      args: [payload.manager_fugu_user_id, payload.fugu_user_id],
      event: "updateManagerInAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateBulkManagerInAttendance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let query = `UPDATE 
                ${databaseName}.users a 
                SET 
                a.manager_user_id =( 
                SELECT 
                * 
                FROM 
                (SELECT 
                au.user_id 
                FROM 
                ${databaseName}.users au 
                WHERE 
                au.user_name = CONCAT("fugu", ?) ) AS user_name ) 
                WHERE 
                a.manager_user_id = ( 
                  SELECT 
                  * 
                  FROM 
                  (SELECT 
                  au.user_id 
                  FROM 
                  ${databaseName}.users au 
                  WHERE 
                  au.user_name = CONCAT("fugu", ?) ) AS manager_user_name ) `;
    let queryObj = {
      query: query,
      args: [payload.manager_fugu_user_id, payload.fugu_user_id],
      event: "updateManagerInAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getWorkspaceOwner(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select u.user_id, u.auth_user_id, u.email from user_to_workspace ud join users u on ud.user_unique_key = u.user_id where ud.workspace_id = ? and ud.role = 'OWNER'`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "getWorkspaceOwner"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUniqueUserInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select user_id, email, full_name, auth_user_id,access_token, COALESCE(contact_number,"") as contact_number, user_thumbnail_image as user_image, user_image as original_image, password, COALESCE(attributes,'{}') as attributes from users where 1=0`;
    let values = [];

    if (payload.email) {
      query += " OR email = ? ";
      values.push(payload.email);
    }

    if (payload.contact_number) {
      query += " OR contact_number= ? ";
      values.push(payload.contact_number);
    }

    if (payload.username) {
      query += " OR username= ? ";
      values.push(payload.username);
    }

    if (_.isEmpty(values)) {
      throw new Error("insufficient information.")
    }
    let queryObj = {
      query: query,
      args: values,
      event: "getUniqueUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWhatsNewFeatureStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = '';
    let countPlaceholder = '*';
    let paginationPlaceholder = ' ORDER BY id  DESC  LIMIT ? , ? ';
    payload.role = constants.userRoleNumber[payload.role]
    let values = [payload.role, Math.abs(payload.page_start - 1), Math.abs(payload.page_end - payload.page_start + 1)]

    if (payload.whats_new_status || payload.whats_new_status == 0) {
      placeHolder = ` id > ? AND `
      countPlaceholder = `COUNT(*) AS COUNT`
      paginationPlaceholder = '';
      values = [payload.whats_new_status, payload.role]
    }
    let query = `SELECT ${countPlaceholder} FROM whats_new_feature where ${placeHolder} role <= ?  AND status = 1 ${paginationPlaceholder} `;

    let queryObj = {
      query: query,
      args: values,
      event: "getWhatsNewFeatureStatus"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateWhatsNewStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    // let query = ` UPDATE user_details SET whats_new_status = (SELECT MAX(id) as count FROM whats_new_feature ) WHERE user_id = ?  and workspace_id = ?`;

    // let queryObj = {
    //   query : query,
    //   args  : [ payload.user_id , payload.workspace_id ],
    //   event : "updateWorkspaceId"
    // };

    // dbHandler.executeQuery(logHandler, queryObj).then((result) => {
    //   resolve(result);
    // }, (error) => {
    //   reject(error);
    // });

    /*
      New table query
    */
    const newQuery = ` UPDATE user_to_workspace SET whats_new_status = (SELECT MAX(id) as count FROM whats_new_feature ) WHERE user_unique_key = ?  and workspace_id = ?`;

    let newQueryObj = {
      query: newQuery,
      args: [payload.user_id, payload.workspace_id],
      event: "updateWorkspaceId"
    };

    dbHandler.executeQuery(logHandler, newQueryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` INSERT INTO user_status (fugu_user_id, status,days) VALUES (?,?,?)`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id, payload.status, payload.days],
      event: "insertUserStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

//removedBilling
function getUsersUpdatedStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT
    id
    FROM user_status
            WHERE
              fugu_user_id  = ? and date(created_at) = date(now()) and day(LAST_DAY(NOW())) != day(DATE(NOW()))`;
    let queryObj = {
      query: query,
      args: [payload.fugu_user_id],
      event: "getUsersUpdatedStatus"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
//removedBilling

function getUsersUpdatedStatusCount(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
          count(DISTINCT(us.fugu_user_id)) as recent_active_users
         FROM
             user_status us
         JOIN user_to_workspace ud ON
             us.fugu_user_id = ud.user_id
         WHERE
             ud.workspace_id = ? AND us.fugu_user_id NOT IN(?) AND us.created_at > date(now() - interval 1 month) GROUP BY ud.workspace_id
         ORDER BY
             us.fugu_user_id,
             us.created_at`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id, payload.fugu_user_id],
      event: "getUsersUpdatedStatusCount"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBilling(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolders = ``;
    let dayPlaceHolder = ``;
    let lastDay = ``;
    let values = [payload.id];
    if (!payload.update_billing_status) {
      if (payload.add_one_day) {
        dayPlaceHolder = ` + INTERVAL 1 DAY `
      }
      placeHolders = ` bt.balance - `;
    } else {
      placeHolders = ` bt.balance + `
    }

    if (payload.period == constants.billingPeriod.MONTHLY) {
      lastDay = `DAY(LAST_DAY(NOW()))`;
    } else {
      lastDay = 30.41;
    }
    let query = `UPDATE billing_transactions bt 
               JOIN billing_plans bp ON
                   bt.plan_id = bp.id AND bt.id IN (?)
               SET
                   bt.balance = ${placeHolders} DATEDIFF(bt.expire_on,
                   DATE(NOW() ${dayPlaceHolder})) / ${lastDay} * bp.price`;
    let queryObj = {
      query: query,
      args: values,
      event: "updateBilling"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertNewGoogleUser(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `INSERT IGNORE INTO google_users set ? `;
    let userInfo = {
      user_id: payload.user_id,
      email: payload.email,
      access_token: payload.access_token,
      full_name: payload.full_name || '',
      onboard_source: payload.onboard_source || constants.onBoardSource.FUGU,
      google_refresh_token: payload.google_refresh_token || null,
      user_image: payload.user_image || "",
      user_thumbnail_image: payload.user_thumbnail_image || ""
    };

    let queryObj = {
      query: query,
      args: [userInfo],
      event: "Inserting new user "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      userInfo.userId = result.insertId;
      resolve(userInfo);
    }, (error) => {
      reject(error);
    });
  });
}

function getGoogleUserInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `select user_id , email, full_name,access_token, user_thumbnail_image as user_image, user_image as original_image, onboard_source, COALESCE(attributes,'{}') as attributes, google_refresh_token from google_users where 1=1 and email= ?`;

    let queryObj = {
      query: query,
      args: payload.email,
      event: "getUserInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateGoogleUserInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Update google_users set ? where user_id = ?`;
    let updateObj = {};
    payload.email ? updateObj.email = payload.email : 0;
    payload.access_token ? updateObj.access_token = payload.access_token : "";
    payload.full_name ? updateObj.full_name = commonFunctions.toTitleCase(payload.full_name) : 0;
    (payload.user_image || payload.user_image == '') ? updateObj.user_image = payload.user_image : "";
    payload.attributes ? updateObj.attributes = commonFunctions.objectStringify(payload.attributes) : 0;
    (payload.user_thumbnail_image || payload.user_thumbnail_image == '') ? updateObj.user_thumbnail_image = payload.user_thumbnail_image : "";
    payload.google_refresh_token ? updateObj.google_refresh_token = payload.google_refresh_token : 0;
    payload.onboard_source ? updateObj.onboard_source = payload.onboard_source : 0;

    updateObj.updated_at = new Date();
    let queryObj = {
      query: query,
      args: [updateObj, payload.user_id],
      event: "updating user info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertGuestUserInfo(logHandler, payload, allGuest) {
  return new Promise((resolve, reject) => {

    let values = [];
    let placeHolders = new Array(allGuest.length).fill("(?,?,?,?)").join(', ');
    for (let i = 0; i < allGuest.length; i++) {
      values = values.concat([allGuest[i], payload.workspace_id, payload.channel_ids_to_connect, payload.user_ids_to_connect]);
    }


    let query = `INSERT IGNORE INTO guest_interaction (guest_id, workspace_id,channel_ids_to_connect, user_ids_to_connect) VALUES ${placeHolders}`;

    let queryObj = {
      query: query,
      args: values,
      event: "insertGuestUserInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserStatus(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM user_status WHERE fugu_user_id = ? AND status = "DISABLED"  ORDER BY id DESC LIMIT 1`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id],
      event: "getUserStatus"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGuestUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
                 ui.id,
                 ui.workspace_id,
                 ui.email,
                 ui.contact_number,
                 ui.status,
                 ud.user_image,
                 ud.user_thumbnail_image,
                 ud.full_name,
                 gi.user_id AS fugu_user_id
              FROM
                 user_invitations ui
              JOIN guest_interaction gi
              ON
                 ui.id = gi.guest_id
              JOIN user_to_workspace ud ON
                 gi.user_id = ud.user_id   
              WHERE
                 ui.workspace_id = ? and
                 gi.status = 1`;

    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "insertGuestUserInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInvitedUserData(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `select * from user_invitations where workspace_id = ? AND email in (?) or contact_number in (?)`;

    let queryObj = {
      query: query,
      args: [payload.workspace_id, payload.email, payload.contact_numbers],
      event: "updateUserRoleInChatGroups"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGuestUsersToConnect(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
           ud.user_unique_key as user_id,
           ud.user_id as fugu_user_id,
           ud.full_name,
           ud.contact_number,
           ud.user_image,
           u.email,
           ud.user_thumbnail_image,
           ud.status,
           ud.role
         FROM
            guest_interaction gi JOIN
             user_to_workspace ud  on gi.user_id = ud.user_id and gi.status = 1 and ud.status IN ('ENABLED','INVITED')
             JOIN users u  ON
             u.user_id = ud.user_unique_key
         WHERE
             JSON_CONTAINS(
                 user_ids_to_connect,
                 CAST(? AS CHAR(50))
             ) AND gi.user_id IN(?)`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id, payload.guest_to_connect],
      event: "getGuestUsersToConnect"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function disableFuguUser(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE
            user_to_workspace
        SET
            status = "DISABLED"
        WHERE
            user_unique_key = ?`;

    let queryObj = {
      query: query,
      args: [payload.user_unique_key],
      event: "disableFuguUser"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      return result
    }, (error) => {
      throw error;
    });
  })
}
/*
 * Function to insert device info and token data in user_device_details table
 */
async function insertUserDeviceDetails(logHandler, payload) {

  if (payload.device_details && typeof payload.device_details != 'string') {
    payload.device_details = JSON.stringify(payload.device_details);
  }
  delete payload.app_version;
  const query = `insert into user_device_details set ? ON DUPLICATE KEY UPDATE device_details = VALUES(device_details), token = VALUES(token), voip_token = VALUES(voip_token), updated_at = now()`;
  const queryObj = {
    query: query,
    args: [payload],
    event: "insertDeviceDetails"
  };

  dbHandler.executeQuery(logHandler, queryObj).then((result) => {
    return result
  }, (error) => {
    throw error;
  });
}

async function getUsersDeviceDetails(logHandler, opts) {
  let placeHolder = "";
  let values = [opts.userIds];
  let androidPlaceholder = ``;

  if (opts.user_id) {
    if (opts.device_id) {
      placeHolder = " and ud.user_id = ? and ud.device_id != ?"
      values.push(opts.user_id, opts.device_id);
    } else if (opts.skip_user_devices) {
      placeHolder = " and ud.user_id != ? AND ud.device_id NOT IN (?)";
      values.push(opts.user_id, opts.skip_user_devices);
    } else {
      placeHolder = " and ud.user_id != ? ";
      values.push(opts.user_id);
    }
  }
  //  u.email as email,
  if (opts.android_only) {
    androidPlaceholder = `  ud.device_type = 'ANDROID' AND`;
  }

  let sql = `
              SELECT
                  u.user_id as user_id,
                  u.user_unique_key,
                  u.workspace_id as business_id,
                  u.full_name as full_name,
                  u.status as status,
                  u.user_properties,
                  u.notification_level,
                  u.user_type,
                  u.contact_number,
                  u.user_image,
                  1 as app_type,
                  u.user_unique_key,
                  ud.device_type,
                  ud.device_details,
                  ud.token as device_token,
                  ud.voip_token,
                  ud.device_id,
                  MAX(ud.updated_at) as updated_at
                FROM user_to_workspace u
                  JOIN user_device_details ud ON
                  u.user_id = ud.user_id AND u.user_id IN (?)
                WHERE
                 ${androidPlaceholder} ud.token !='' ${placeHolder}  and u.status = "ENABLED" and
                  ud.updated_at >= NOW() - INTERVAL 30 DAY GROUP BY ud.token ORDER BY updated_at DESC`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getUsersDeviceDetails"
  };
  return dbHandler.executeQuery(logHandler, queryObj)
}

async function getUserDetail(logHandler, payload) {
  let query = ` select user_id,role, user_unique_key,emails,emails as username, image_set, workspace_id, full_name, COALESCE(contact_number,"") as contact_number, user_thumbnail_image as user_image, user_image as original_image, status, user_properties ,user_type from user_to_workspace where 1=1`;
  let values = [];
  if (payload.user_id) {
    query += " and user_id in (?) ";
    values.push(payload.user_id);
  }

  let queryObj = {
    query: query,
    args: values,
    event: "getUserDetail"
  };
  return await slaveDbHandler.executeQuery(logHandler, queryObj)
}

async function updateDeviceInfo(logHandler, payload, userInfo) {
  let query = `UPDATE user_device_details set  ? where user_id = ? and device_id = ?;`;
  let updateObj = {};
  (payload.device_details) ? updateObj.device_details = payload.device_details : 0;
  updateObj.updated_at = new Date();
  if (payload.token || payload.token == null) {
    updateObj.token = payload.token;
    updateObj.updated_at = new Date();
  }
  if (payload.voip_token || payload.voip_token == null) {
    updateObj.voip_token = payload.voip_token;
    updateObj.updated_at = new Date();
  }
  let queryObj = {
    query: query,
    args: [updateObj, userInfo.user_id, payload.device_id],
    event: "updateDeviceInfo"
  };
  return dbHandler.executeQuery(logHandler, queryObj)
}


function getUsersNotificationUnreadCount(logHandler, opts) {
  opts.user_unique_key = [...new Set(opts.user_unique_key)];
  let sql = `select SUM(ud.unread_notification_count) as unread_notification_count, ud.user_unique_key from user_to_workspace ud JOIN workspace_details wd ON ud.workspace_id = wd.workspace_id  where wd.domain_id = ? AND user_unique_key IN (?)  GROUP BY user_unique_key`;
  let queryObj = {
    query: sql,
    args: [opts.domain_id, opts.user_unique_key],
    event: "getUsersNotificationUnreadCount"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

function insertOrUpdateUserToChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if (typeof opts.status == 'undefined') {
      opts.status = 1;
    }
    let query = `INSERT INTO  user_to_channel  (user_id, channel_id, status, role, last_activity, last_read_message_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status = ?, role = ?`;
    let queryObj = {
      query: query,
      args: [opts.user_id, opts.channel_id, opts.status, opts.role, opts.last_activity, opts.last_read_message_id || null, opts.status, opts.role],
      event: "insertOrUpdateUserToChannel"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
async function getGuestData(logHandler, opts) {
  let placeHolder = ``;
  let values = [];
  let selectPlaceholder = ``;
  if (opts.guest_id && opts.get_invited_by) {
    selectPlaceholder = ` , ui.invited_by `
    placeHolder = ` JOIN user_invitations ui on gi.guest_id = ui.id AND guest_id = ?`
    values.push(opts.guest_id);
  } else if (opts.guest_id) {
    placeHolder = ` WHERE gi.guest_id = ? `;
    values.push(opts.guest_id);
  } else {
    placeHolder = ` WHERE user_id = ?`;
    values.push(opts.user_id);
  }
  let query = `SELECT gi.* ${selectPlaceholder} FROM guest_interaction gi  ${placeHolder}`;
  let queryObj = {
    query: query,
    args: values,
    event: "getGuestData"
  };
  try {
    const data = await slaveDbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }

}
async function searchBot(logHandler, payload) {
  let sql = `SELECT
                  full_name,
                  status,
                  user_image,
                  user_type,
                  user_id,
                  user_id as fugu_user_id,
                  user_image as user_thumbnail_image
              FROM
                  user_to_workspace
              WHERE
              workspace_id = ? AND  user_type in (3,4,5,7,8,9) AND full_name LIKE ? AND
              STATUS = 1  `;
  let queryObj = {
    query: sql,
    args: [payload.workspace_id, "%" + payload.search_text + "%"],
    event: "searchUsers"
  };

  let logHandlerLocal = utils.cloneObject(logHandler);
  try {
    const data = dbHandler.executeQuery(logHandlerLocal, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}
function searchByName(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let userPlaceHolder = ``;
    let values = [];
    if (payload.user_ids_to_connect) {
      userPlaceHolder = ` u.user_id IN (?) AND `;
      values.push(payload.user_ids_to_connect);
    }

    placeHolder = ``;
    if (payload.include_all_users) {
      placeHolder = ''
      values.push(payload.workspace_id, "%" + payload.search_text + "%");
    } else {
      placeHolder = `u.user_id != ? AND`;
      values.push(payload.user_id, payload.workspace_id, "%" + payload.search_text + "%");
    }

    let userStatusPlaceHolder = ``;
    if (!payload.search_deactivated_member) {
      userStatusPlaceHolder = ` u.status IN ("ENABLED","INVITED")  AND`
    }

    let query = `
              SELECT
                  u.full_name,
                  u.user_id,
                  u.user_id as fugu_user_id,
                  u.emails as email,
                  u.emails as username,
                  u.department,
                  u.user_type,
                  u.status,
                  ''  AS leave_type,
                  u.contact_number as phone_number,
                  user_thumbnail_image as user_thumbnail_image,
                  COALESCE(u.user_thumbnail_image, '') as user_image
              FROM
                  user_to_workspace u
          WHERE
          ${userPlaceHolder}  ${placeHolder} ${userStatusPlaceHolder} u.workspace_id = ? AND u.user_type NOT IN (0,3,4,5,7,9,10) AND u.full_name LIKE ?
         limit 20`;
    let queryObj = {
      query: query,
      args: values,
      event: "searchByName"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getActiveUsersOfBusiness(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeholder = "";
    let values = [opts.workspace_id];

    if (!_.isEmpty(opts.userIds)) {
      placeholder = " AND user_id in ( ? )"
      values.push(opts.userIds);
    }

    if (opts.chatType == constants.chatType.FUGU_BOT) {
      values.push([constants.userType.CUSTOMER, constants.userType.GUEST, opts.user_type])
    } else if (opts.allowed_guest) {
      values.push([constants.userType.CUSTOMER])
    } else {
      values.push([constants.userType.CUSTOMER, constants.userType.GUEST]);
    }
    let sql = `SELECT * FROM  user_to_workspace WHERE workspace_id = ? ${placeholder} AND user_type IN (?) AND status in ("ENABLED","INVITED") `;
    let queryObj = {
      query: sql,
      args: values,
      event: "getUsersWithIds"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    logHandlerLocal.logResultLength = true;
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersWithIds(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM  user_to_workspace WHERE user_id in ( ? )";
    let queryObj = {
      query: sql,
      args: [opts.userIds],
      event: "getUsersWithIds"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    logHandlerLocal.logResultLength = true;
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateUserInChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO  user_to_channel  (user_id,channel_id,status,role,last_activity,last_read_message_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status = ?, role = ?, last_read_message_id = ?`;
    let queryObj = {
      query: query,
      args: [opts.user_id, opts.channel_id, opts.status || 1, opts.role, opts.last_activity, opts.last_read_message_id, opts.status, opts.role, opts.last_read_message_id],
      event: "insertOrUpdateUserInChannel"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateGuest(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let values = [];
    let whereCondition = "";
    _.each(opts.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    let query = `UPDATE guest_interaction set ? where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: [opts.update_fields].concat(values),
      event: "updateGuest"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserToChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let updateObject = {};
    if (opts.status) {
      updateObject.status = opts.status;
    }
    if (opts.notification) {
      updateObject.notification = opts.notification;
    }

    if (opts.role) {
      updateObject.role = opts.role;
    }

    if (_.isEmpty(updateObject)) {
      return resolve({});
    }
    let query = `UPDATE user_to_channel SET ? WHERE user_id IN (?) AND channel_id = ?`;
    let queryObj = {
      query: query,
      args: [updateObject, opts.user_id, opts.channel_id],
      event: "updateUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersWithAppInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(opts.userIds)) {
      return resolve([]);
    }

    let placeholder = "";
    let limitPlaceHolder = "";
    let userPlaceHolder = "";
    let values = [opts.channel_id, opts.userIds];
    let orderByPlaceholder = "u.user_id ASC"
    if (opts.status) {
      values.push(opts.status);
      placeholder += " AND u.status in (?)";
    }
    if (opts.workspace_id) {
      values.push(opts.workspace_id);
      placeholder += " AND u.workspace_id in (?)";
    }
    if (opts.page_start || opts.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(opts.page_start, opts.page_end);
    }
    if (!opts.user) {
      userPlaceHolder = `AND u.user_id!= ${opts.user_id} `
    }
    if (opts.chat_type) {
      orderByPlaceholder = `utc.role ,u.full_name,u.user_id ASC`
    }

    let query = `SELECT DISTINCT u.user_id, u.user_type, u.full_name, utc.role, utc.notification, u.contact_number, IFNULL(u.emails,'') as email,COALESCE(upds.leave_type,'PRESENT')  as leave_type,
                 COALESCE(u.user_thumbnail_image, '') AS user_image, u.status
                 FROM
                     user_to_workspace AS u
                 LEFT JOIN user_to_channel utc ON
                  u.user_id = utc.user_id
                 LEFT JOIN user_present_day_status upds
                  on u.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
                 WHERE utc.channel_id = ? AND u.user_id in (?)  ${userPlaceHolder} AND u.user_type in (1,6) ${placeholder}  
                 order by 
                 ${orderByPlaceholder}
                ${limitPlaceHolder}`
      ;
    let queryObj = {
      query: query,
      args: values,
      event: "get user info"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserToChannels(logHandler, params, channel_ids) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(channel_ids)) {
      throw new Error("Nothing to insert in insertUserToChannel");
    }

    let values = [];
    let placeHolders = new Array(channel_ids.length).fill("(?,?,?)").join(', ');
    for (let i = 0; i < channel_ids.length; i++) {
      values = values.concat([params.user_id, channel_ids[i], 1]);
    }

    let query = `INSERT INTO  user_to_channel  (user_id,channel_id,status) VALUES  ${placeHolders} ON duplicate key UPDATE status = VALUES(status)`;

    let queryObj = {
      query: query,
      args: values,
      event: "insertUserToChannels"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateUserNotificationCount(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `update user_to_workspace set unread_notification_count =  ? where user_id In (?)`;
    let queryObj = {
      query: sql,
      args: [opts.notificationCount, opts.fugu_user_id],
      event: "updateUserNotificationCount"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersUniqueDevices(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    if (opts.domain_id) {
      placeHolder = ` AND workspace_id IN ( select workspace_id from workspace_details where domain_id = ${opts.domain_id})`
    }
    const sql = `
                SELECT
                    u.user_id,
                    u.user_unique_key,
                    u.workspace_id,
                    u.workspace_id as business_id,
                    u.full_name,
                    u.status,
                    u.user_properties,
                    u.notification_level,
                    u.user_type,
                    u.contact_number,
                    u.user_image,
                    ud.device_type,
                    ud.device_details,
                    ud.token as device_token
                  FROM user_to_workspace u
                    JOIN user_device_details ud ON
                    u.user_id = ud.user_id ${placeHolder} AND u.user_unique_key IN(?)
                  WHERE
                    ud.token !='' and u.status = 1 and
                    ud.updated_at >= NOW() - INTERVAL 30 DAY
                  GROUP BY
                    u.user_unique_key,
                    ud.device_id,
                    ud.device_type
                  `;
    const queryObj = {
      query: sql,
      args: [opts.user_unique_keys],
      event: "getUsersUniqueDevices"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    logHandlerLocal.logResultLength = true;
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
async function getAllBusinessUsers(logHandler, opts) {
  let placeHolder = ''
  switch (opts.broadcast_user_type) {
    case constants.broadcast_user_type.EXCEPT:
      placeHolder = 'AND user_id NOT IN (?)'
      break;
    case constants.broadcast_user_type.ONLY:
      placeHolder = 'AND user_id IN (?)'
      break;
  }
  let sql = `SELECT user_id, full_name FROM  user_to_workspace WHERE workspace_id = ? AND user_type = 1 AND status = 1 ${placeHolder}`;
  let queryObj = {
    query: sql,
    args: [opts.workspace_id, opts.user_ids],
    event: "getUsersWithIds"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

function getInfoUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    let limitPlaceHolder = '';
    let values = [payload.user_id];
    if (payload.workspace_id) {
      placeHolder = ` AND workspace_id IN (${payload.workspace_id})`
    }


    if (payload.page_start) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }
    if (payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end - 1);
    }
    let query = `select IFNULL(uw.emails,'') as email, uw.contact_number as phone_number, uw.user_id, uw.user_unique_key, uw.workspace_id, uw.full_name, uw.user_type, uw.status, COALESCE(uw.user_image, '') AS user_image  from user_to_workspace uw where uw.user_id IN (?) ${placeHolder} ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "get user info"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function decrementUserNotificationUnreadCount(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [opts.userIds];
    if (opts.workspace_id) {
      placeHolder = ` AND workspace_id = ?`;
      values.push(opts.workspace_id);
    }
    let sql = `update user_to_workspace set unread_notification_count = GREATEST(0, unread_notification_count - 1) where user_id In (?) ${placeHolder}`;
    let queryObj = {
      query: sql,
      args: values,
      event: "decrementUserNotificationUnreadCount"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateFuguInfo(logHandler, payload, userInfo) {
  return new Promise((resolve, reject) => {
    if (!userInfo.user_id) {
      return reject(new Error("Invalid user_id"));
    }

    let query = ` Update user_to_workspace set ? where user_id = ? AND user_type IN (1,6) `;
    let updateObj = {};
    (payload.email) ? updateObj.email = payload.email : 0;
    (payload.full_name) ? updateObj.full_name = utils.toTitleCase(payload.full_name) : 0;
    (payload.phone_number) ? updateObj.phone_number = payload.phone_number : 0;
    (payload.device_type) ? updateObj.device_type = payload.device_type : 0;
    (payload.device_id) ? updateObj.device_id = payload.device_id : 0;
    (payload.device_key) ? updateObj.device_key = payload.device_key : 0;
    (payload.app_type) ? updateObj.app_type = payload.app_type : 0;
    (payload.attributes) ? updateObj.attributes = payload.attributes : 0;
    (payload.user_image || payload.user_image == '') ? updateObj.user_image = payload.user_image : 0;
    (payload.source) ? updateObj.source = payload.source : 0;
    (payload.source_type) ? updateObj.source_type = payload.source_type : 0;
    (payload.custom_attributes) ? updateObj.custom_attributes = payload.custom_attributes : 0;
    (payload.user_properties) ? updateObj.user_properties = utils.objectToJson(logHandler, payload.user_properties) : 0;
    (payload.notification_level) ? updateObj.notification_level = payload.notification_level : 0;
    (payload.status) ? updateObj.status = payload.status : 0;
    payload.user_type ? updateObj.user_type = payload.user_type : 0;
    /*
    (payload.device_token === null || payload.device_token)  ? updateObj.device_token = payload.device_token : 0;
    if(payload.web_token  === null || payload.web_token) {
      updateObj.web_token = payload.web_token;
      updateObj.web_token_updated_at = new Date();
    }
    */
    updateObj.updated_at = new Date();

    let queryObj = {
      query: query,
      args: [updateObj, userInfo.user_id],
      event: "updating user info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(updateObj);
    }, (error) => {
      reject(error);
    });
  });
}


function incrementUserNotificationUnreadCount(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `update user_to_workspace set unread_notification_count = unread_notification_count + 1 where user_id IN (?)`;
    let queryObj = {
      query: sql,
      args: [opts.fugu_user_id],
      event: "incrementUserNotificationUnreadCount"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


async function createBotChannel(logHandler, payload) {
  try {
    let usersIds = payload.userIdsToAdd;
    let params = {};
    params.chat_type = constants.chatType.FUGU_BOT;
    params.workspace_id = payload.workspace_id;
    params.owner_id = usersIds[0];
    let response = await channelService.insertIntoChannels(logHandler, params);
    let channel_id = response.insertId;
    for (let i = 0; i < usersIds.length; i++) {
      let updateObj = {};
      updateObj.user_id = usersIds[i];
      updateObj.channel_id = channel_id;
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.role = constants.userRole.USER;
      updateObj.workspace_id = payload.workspace_id;
      await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    }
    let messagePayload = {};
    messagePayload.workspace_id = payload.workspace_id;
    messagePayload.user_id = payload.user_id;
    messagePayload.channel_id = channel_id;
    messagePayload.full_name = payload.full_name;
    messagePayload.muid = commonFunctions.generateRandomString(10);
    messagePayload.user_type = payload.user_type;
    messagePayload.message_type = constants.messageType.MESSAGE;
    messagePayload.data = { message: payload.message }
    messagePayload.status = constants.userConversationStatus.MESSAGE;
    conversationService.insertUsersConversation(logHandler, messagePayload);
  } catch (error) {
    throw new Error(error);
  }
}

function getWorkspaceUser(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * from user_to_workspace where user_unique_key = ? and workspace_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.user_unique_key, opts.workspace_id],
      event: "getWorkspaceUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getUsersByIds(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT u.email,uw.user_id, uw.workspace_id from user_to_workspace uw JOIN users u ON u.user_id = uw.user_unique_key where uw.user_id IN (?) and workspace_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.user_ids, opts.workspace_id],
      event: "getWorkspaceUser"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateFuguInfo(logHandler, payload, userInfo) {
  return new Promise((resolve, reject) => {
    if (!userInfo.user_id) {
      return reject(new Error("Invalid user_id"));
    }

    let query = ` Update user_to_workspace set ? where user_id = ? AND user_type IN (1,6) `;
    let updateObj = {};
    (payload.email) ? updateObj.email = payload.email : 0;
    (payload.full_name) ? updateObj.full_name = utils.toTitleCase(payload.full_name) : 0;
    (payload.phone_number) ? updateObj.phone_number = payload.phone_number : 0;
    (payload.device_type) ? updateObj.device_type = payload.device_type : 0;
    (payload.device_id) ? updateObj.device_id = payload.device_id : 0;
    (payload.device_key) ? updateObj.device_key = payload.device_key : 0;
    (payload.app_type) ? updateObj.app_type = payload.app_type : 0;
    (payload.attributes) ? updateObj.attributes = payload.attributes : 0;
    (payload.user_image || payload.user_image == '') ? updateObj.user_image = payload.user_image : 0;
    (payload.source) ? updateObj.source = payload.source : 0;
    (payload.source_type) ? updateObj.source_type = payload.source_type : 0;
    (payload.custom_attributes) ? updateObj.custom_attributes = payload.custom_attributes : 0;
    (payload.user_properties) ? updateObj.user_properties = utils.objectToJson(logHandler, payload.user_properties) : 0;
    (payload.notification_level) ? updateObj.notification_level = payload.notification_level : 0;
    (payload.status) ? updateObj.status = payload.status : 0;
    payload.user_type ? updateObj.user_type = payload.user_type : 0;
    /*
    (payload.device_token === null || payload.device_token)  ? updateObj.device_token = payload.device_token : 0;
    if(payload.web_token  === null || payload.web_token) {
      updateObj.web_token = payload.web_token;
      updateObj.web_token_updated_at = new Date();
    }
    */
    updateObj.updated_at = new Date();

    let queryObj = {
      query: query,
      args: [updateObj, userInfo.user_id],
      event: "updating user info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(updateObj);
    }, (error) => {
      reject(error);
    });
  });
}


function incrementUserNotificationUnreadCount(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `update user_to_workspace set unread_notification_count = unread_notification_count + 1 where user_id IN (?)`;
    let queryObj = {
      query: sql,
      args: [opts.fugu_user_id],
      event: "incrementUserNotificationUnreadCount"
    };

    let logHandlerLocal = utils.cloneObject(logHandler);
    dbHandler.executeQuery(logHandlerLocal, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function createChannelsWithBots(logHandler, payload) {
  try {
    if(payload.domain_id == 1 || payload.domain_id == 4){
      let [botData] = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.FUGU_BOT })
      if (_.isEmpty(botData)) {
        botData = await userService.insertUserDetails(logHandler, {
          workspace_id: payload.workspace_id,
          full_name: constants.defaultBotName,
          user_type: constants.userType.FUGU_BOT,
          status: 'ENABLED',
          user_unique_key: "im4fcyak5",
          user_image: constants.fuguBotImageURL
        })
      }
      if (!payload.checkUserAlreadyExists) {
        createBotChannel(logHandler, { userIdsToAdd: [payload.fugu_user_id, botData.insertId || botData.user_id], workspace_id: payload.workspace_id, user_id: botData.insertId || botData.user_id, full_name: botData.full_name, user_type: botData.user_type, message: constants.defaultMessageForFuguBot.replace("app_name", constants.defaultBotName[payload.domain_id])});
      }
    }
    if (payload.workspaceInfo.attendance_token) {
      let attendanceBotData = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.ATTENDANCE_BOT });

      if (!_.isEmpty(attendanceBotData)) {
        let channelsWithAttendanceBot = await bot.getBotChannelId(logHandler,{attendance_user_id: attendanceBotData[0].user_id, user_id: payload.fugu_user_id})

        if (!channelsWithAttendanceBot.length) {
          createBotChannel(logHandler, { userIdsToAdd: [payload.fugu_user_id, attendanceBotData[0].user_id], workspace_id: payload.workspace_id, user_id: attendanceBotData[0].user_id, full_name: attendanceBotData[0].full_name, user_type: attendanceBotData[0].user_type, message: constants.messageForNewAttendanceBotChannel });
        }
      }
      const defaultManager = await workspaceService.getSpaceDetailsById(logHandler, { workspace_id: payload.workspace_id });

      if (!_.isEmpty(defaultManager) && defaultManager[0].default_manager_fugu_user_id) {
        let bulkSignUp = {
          url: config.get('attendanceUrl') + constants.API_END_POINT.SIGN_UP,
          method: 'POST',
          attendance: true,
          json: {
            bulk_users: [{ full_name: payload.full_name, user_name: "fugu" + payload.fugu_user_id, email: payload.email || "fuguUser", manager_user_name: "fugu" + defaultManager[0].default_manager_fugu_user_id, role: constants.userRole.USER }],
            business_token: payload.workspaceInfo.attendance_token
          }
        };
        utilityService.sendHttpRequest(logHandler, bulkSignUp);
      }
    }
    if (payload.workspaceInfo.scrum_token) {
      let scrumBotData = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.SCRUM_BOT });
      if (!_.isEmpty(scrumBotData)) {
        let channelsWithScrumBot = await bot.getBotChannelId(logHandler,{attendance_user_id: scrumBotData[0].user_id, user_id: payload.fugu_user_id})
        if (_.isEmpty(channelsWithScrumBot)) {
          createBotChannel(logHandler, { userIdsToAdd: [payload.fugu_user_id, scrumBotData[0].user_id], workspace_id: payload.workspace_id, user_id: scrumBotData[0].user_id, full_name: scrumBotData[0].full_name, user_type: scrumBotData[0].user_type, message: constants.userMessageForScrumBot });
        }
      }
      let defaultManager = await workspaceService.getSpaceDetailsById(logHandler, { workspace_id: payload.workspace_id });

      if (!_.isEmpty(defaultManager)) {
        if (defaultManager[0].default_manager_fugu_user_id) {
          let bulkSignUp = {
            url: config.get('scrumUrl') + constants.API_END_POINT.INSERT_NEW_USER,
            method: 'POST',
            json: {
              bulk_users: [{ full_name: payload.full_name, user_name: `fugu${payload.fugu_user_id}`, email: payload.email || "fuguUser", role: constants.userRole.USER }],
              business_token: payload.workspaceInfo.scrum_token
            }
          };
          await utilityService.sendHttpRequest(logHandler, bulkSignUp);
        }
      }
    }

    // let videoConference = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.CONFERENCE_BOT });

    // if (videoConference.length) {
    //   let channelsWithVideoConferenceBot = await bot.getChannelsWithVideoConferenceBot(logHandler, { workspace_id: payload.workspace_id, user_ids: payload.fugu_user_id })
    //   if (!channelsWithVideoConferenceBot.length) {
    //     createBotChannel(logHandler, { userIdsToAdd: [payload.fugu_user_id, videoConference[0].user_id], workspace_id: payload.workspace_id, user_id: videoConference[0].user_id, full_name: videoConference[0].full_name, user_type: videoConference[0].user_type, message: constants.defaltConferenceMessage });
    //   }
    // }

    if (payload.properties && payload.properties.is_self_chat_enabled) {

      let selfBot = await bot.getBotInfo(logHandler, { workspace_id: payload.workspace_id, user_type: constants.userType.SELF_BOT });

      if (selfBot.length) {
        let selfBotChannel = await bot.getBotChannelId(logHandler,{attendance_user_id: selfBot[0].user_id, user_id: payload.fugu_user_id});
        if (!selfBotChannel.length) {
          createBotChannel(logHandler, { userIdsToAdd: [payload.fugu_user_id, selfBot[0].user_id], workspace_id: payload.workspace_id, user_id: selfBot[0].user_id, full_name: selfBot[0].full_name, user_type: selfBot[0].user_type, message: constants.selfBotDefaultMessage });
        }
      }
    }

  } catch (error) {
    console.error("Error------------------------------->", error);
    throw new Error(error);
  }
}

async function createBotChannel(logHandler, payload) {
  try {
    let usersIds = payload.userIdsToAdd;
    let params = {};
    params.chat_type = constants.chatType.FUGU_BOT;
    params.workspace_id = payload.workspace_id;
    params.owner_id = usersIds[0];
    let response = await channelService.insertIntoChannels(logHandler, params);
    let channel_id = response.insertId;
    for (let i = 0; i < usersIds.length; i++) {
      let updateObj = {};
      updateObj.user_id = usersIds[i];
      updateObj.channel_id = channel_id;
      updateObj.status = constants.userStatus.ENABLE;
      updateObj.role = constants.userRole.USER;
      updateObj.workspace_id = payload.workspace_id;
      await userService.insertOrUpdateUserToChannel(logHandler, updateObj);
    }
    let messagePayload = {};
    messagePayload.workspace_id = payload.workspace_id;
    messagePayload.user_id = payload.user_id;
    messagePayload.channel_id = channel_id;
    messagePayload.full_name = payload.full_name;
    messagePayload.muid = commonFunctions.generateRandomString(10);
    messagePayload.user_type = payload.user_type;
    messagePayload.message_type = constants.messageType.MESSAGE;
    messagePayload.data = { message: payload.message }
    messagePayload.status = constants.userConversationStatus.MESSAGE;
    conversationService.insertUsersConversation(logHandler, messagePayload);
  } catch (error) {
    throw new Error(error);
  }
}

function getWorkspaceUser(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * from user_to_workspace where user_unique_key = ? and workspace_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.user_unique_key, opts.workspace_id],
      event: "getWorkspaceUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getUsersByIds(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT u.email,uw.user_id from user_to_workspace uw JOIN users u ON u.user_id = uw.user_unique_key where uw.user_id IN (?) and workspace_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.user_ids, opts.workspace_id],
      event: "getWorkspaceUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGuestUsersToConnectInWorkspace(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                *
         FROM
             guest_interaction gi 
         WHERE
             JSON_CONTAINS(
                 user_ids_to_connect,
                 CAST(? AS CHAR(50))
             ) AND workspace_id IN (?)`;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.workspace_id],
      event: "getGuestUsersToConnectInWorkspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersUsingUserUniqueKey(logHandler, user_unique_keys, workspace_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT u.user_id as user_unique_key, up.user_id  from users u join user_to_workspace up on u.user_id = up.user_unique_key where u.user_id IN (?) and up.workspace_id =? group by user_id`;
    let queryObj = {
      query: query,
      args: [user_unique_keys, workspace_id],
      event: "getUsersUsingUserUniqueKey"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserToChannel(logHandler, params, userIds) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(userIds)) {
      throw new Error("Nothing to insert in insertUserToChannel");
    }

    let values = [];
    let placeHolders = new Array(userIds.length).fill("(?,?,?)").join(', ');
    for (let i = 0; i < userIds.length; i++) {
      values = values.concat([userIds[i], params.channel_id, 1]);
    }

    let query = `INSERT INTO  user_to_channel  (user_id,channel_id,status) VALUES  ${placeHolders} ON duplicate key UPDATE status = VALUES(status)`;

    let queryObj = {
      query: query,
      args: values,
      event: "INSERT_USER_TO_CHANNEL"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGuestUsersToConnectInWorkspace(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                *
         FROM
             guest_interaction gi 
         WHERE
             JSON_CONTAINS(
                 user_ids_to_connect,
                 CAST(? AS CHAR(50))
             ) AND workspace_id IN (?)`;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.workspace_id],
      event: "getGuestUsersToConnectInWorkspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersUsingUserUniqueKey(logHandler, user_unique_keys, workspace_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT u.user_id as user_unique_key, up.user_id  from users u join user_to_workspace up on u.user_id = up.user_unique_key where u.user_id IN (?) and up.workspace_id =? group by user_id`;
    let queryObj = {
      query: query,
      args: [user_unique_keys, workspace_id],
      event: "getUsersUsingUserUniqueKey"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUserToChannel(logHandler, params, userIds) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(userIds)) {
      throw new Error("Nothing to insert in insertUserToChannel");
    }

    let values = [];
    let placeHolders = new Array(userIds.length).fill("(?,?,?)").join(', ');
    for (let i = 0; i < userIds.length; i++) {
      values = values.concat([userIds[i], params.channel_id, 1]);
    }

    let query = `INSERT INTO  user_to_channel  (user_id,channel_id,status) VALUES  ${placeHolders} ON duplicate key UPDATE status = VALUES(status)`;

    let queryObj = {
      query: query,
      args: values,
      event: "INSERT_USER_TO_CHANNEL"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateGuestChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query = `UPDATE
                         guest_interaction
                     SET
                         channel_ids_to_connect = JSON_ARRAY_APPEND(channel_ids_to_connect, '$', ?)
                     WHERE
                         user_id = ?`;

    let queryObj = {
      query: query,
      args: [opts.channel_id, opts.user_id],
      event: "updateGuestChannels"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
async function getUserLastSeen(logHandler, data) {
  const query = `
              SELECT
                last_seen
              FROM
                  user_to_workspace
              WHERE
                user_id = ? `;
  const queryObj = {
    query,
    args: [data.user_id],
    event: 'getLastSeen'
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

let lastSeenObj = {};
let lastSeenQueryActive = false;
function updateLastSeen(logHandler, data) {
  lastSeenObj[data.user_id] = data.timestamp;
  if (!lastSeenQueryActive) {
    createLastSeenChunk(logHandler, lastSeenObj);
    lastSeenObj = {};
  }
}

async function createLastSeenChunk(logHandler, obj) {
  lastSeenQueryActive = true;
  const lastSeenCopy = Object.entries(obj);
  const iterations = Math.ceil(lastSeenCopy.length / constants.lastSeenUpdateChunkSize);
  for (let i = 0; i < iterations; i++) {
    updateLastSeenQuery(logHandler, lastSeenCopy.splice(0, constants.lastSeenUpdateChunkSize));
    await sleep(2000);
  }
  setTimeout(() => {
    lastSeenQueryActive = false;
  }, 30000);
}

async function updateLastSeenQuery(logHandler, values) {
  const query = `INSERT INTO
                  user_to_workspace(user_id,last_seen)
                  VALUES ?
                  ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)`;
  const queryObj = {
    query,
    args: [values],
    event: 'updateLastSeen'
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

async function sleep(timer) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timer);
  });
}


function disableFuguUserInAttendance(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let query = `UPDATE 
                ${databaseName}.users u JOIN
                user_to_workspace uw ON
                u.user_name = CONCAT('fugu',uw.user_id)
                SET u.status = 0 
                  WHERE
                  uw.user_unique_key = ?`;
    let queryObj = {
      query: query,
      args: [payload.user_unique_key],
      event: "disableFuguUserInAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


async function insertPushNotification(logHandler, pushData) {

  let values = [];
  let placeHolders = new Array(pushData.length).fill("(?,?,?,?)").join(', ');

  for (const [index, user] of pushData.entries()) {
    values = values.concat([pushData[index].user_unique_key, pushData[index].domain_id, pushData[index].device_id, pushData[index].data]);
  }

  const query = `INSERT INTO
                  push_notifications(user_unique_key, domain_id, device_id, data)
                  VALUES ${placeHolders}`;
  const queryObj = {
    query,
    args: values,
    event: 'insertPushNotification'
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    redis.set("lastPushId", data.insertId);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}


async function getPushNotifications(logHandler, opts) {
  const query = `SELECT * FROM push_notifications WHERE id > ? AND domain_id = ? AND user_unique_key = ? AND device_id = ?`;
  const queryObj = {
    query,
    args: [opts.last_notification_id, opts.domain_id, opts.user_unique_key, opts.device_id],
    event: 'getPushNotifications'
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

async function deletePush(logHandler, opts) {
  const query = `DELETE FROM push_notifications WHERE device_id = ? AND user_unique_key = ? AND domain_id = ? `;
  const queryObj = {
    query,
    args: [opts.device_id, opts.user_unique_key, opts.domain_id],
    event: 'deletePush'
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

async function getMaxPushId(logHandler, opts) {
  const query = `SELECT id FROM push_notifications ORDER BY id DESC LIMIT 1`;
  const queryObj = {
    query,
    args: [],
    event: 'getMaxPushId'
  };

  try {
    const data = await slaveDbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}


async function getLatestUsersDeviceDetails(logHandler, opts) {
  let values = [opts.userIds, opts.userIds];

  let placeHolder = "";

  if (opts.user_id) {
    if (opts.device_id) {
      placeHolder = " and ud.user_id = ? and ud.device_id != ?"
      values.push(opts.user_id, opts.device_id);
    } else if (opts.skip_user_devices) {
      placeHolder = " and ud.user_id != ? AND ud.device_id NOT IN (?)";
      values.push(opts.user_id, opts.skip_user_devices);
    } else {
      placeHolder = " and ud.user_id != ? ";
      values.push(opts.user_id);
    }
  }

  let secondPlaceHolder = ``
  if (opts.skip_user_id) {
    secondPlaceHolder = ` AND uu.user_id NOT IN (?)`;
    values.push(opts.skip_user_id)
  }

  let webPlaceHolder = ``;
  let orderByPlaceholder = ` ASC`
  if (opts.remove_web) {
    webPlaceHolder = ` AND ud.device_type != "WEB"`
    orderByPlaceholder = ` DESC`
  }

  let sql = `SELECT
                  u.user_id as user_id,
                  u.user_unique_key,
                  u.workspace_id as business_id,
                  u.full_name as full_name,
                  u.status as status,
                  u.user_properties,
                  u.notification_level,
                  u.user_type,
                  u.contact_number,
                  u.user_image,
                  1 as app_type,
                  u.user_unique_key,
                  ud.device_type,
                  ud.device_details,
                  ud.token as device_token,
                  ud.voip_token,
                  ud.device_id,
                  MAX(ud.updated_at) as updated_at
                FROM user_to_workspace u
                  JOIN user_device_details ud ON
                  u.user_id = ud.user_id AND u.user_id IN (?) ${webPlaceHolder}
                  INNER JOIN (SELECT max(uu.updated_at) as updated_at FROM user_device_details uu WHERE uu.user_id IN (?) ${secondPlaceHolder} AND token is not null GROUP by token) a ON ud.updated_at = a.updated_at
                WHERE
                  ud.token !='' ${placeHolder}  and u.status = "ENABLED" and
                  ud.updated_at >= NOW() - INTERVAL 30 DAY 
                   GROUP BY ud.token 
                  ORDER BY updated_at ${orderByPlaceholder}`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getLatestUsersDeviceDetails"
  };
  return dbHandler.executeQuery(logHandler, queryObj)
}


function searchSelf(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `SELECT
              * FROM user_to_workspace where  workspace_id = ? AND  user_id = ? AND full_name LIKE ?`
    let queryObj = {
      query: query,
      args: [payload.workspace_id, payload.user_id, "%" + payload.search_text + "%"],
      event: "searchSelf"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function disableFuguUserInScrum(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `scrum_bot` : `scrum_prod`;
    let query = `UPDATE 
                ${databaseName}.users u JOIN
                user_to_workspace uw ON
                u.user_id = uw.user_id
                SET u.status = 0 
                  WHERE
                  uw.user_unique_key = ?`;
    let queryObj = {
      query: query,
      args: [payload.user_unique_key],
      event: "disableFuguUserInScrum"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function updateSnoozeTime(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Update users set notification_snooze_time = now() + INTERVAL ? MINUTE where user_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.snooze_time_interval, payload.user_id],
      event: "updateSnoozeTime"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function endSnooze(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` Update users set notification_snooze_time = null where notification_snooze_time < now()`;
    let queryObj = {
      query: query,
      args: [],
      event: "endSnooze"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateUserToChannelDetails(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if (typeof opts.status == 'undefined') {
      opts.status = 1;
    }
    let query = `INSERT INTO  user_to_channel  (user_id, channel_id, status, role, last_activity, last_read_message_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status = ?, role = ?, is_pinned = 0`;
    let queryObj = {
      query: query,
      args: [opts.user_id, opts.channel_id, opts.status, opts.role, opts.last_activity, opts.last_read_message_id || null, opts.status, opts.role],
      event: "insertOrUpdateUserToChannelDetails"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertOtpSteps(logHandler, opts){
  return new Promise((resolve, reject)=> {
     let query = `INSERT INTO otp_steps(contact_number, step) VALUES(?, ?)`;
     let queryObj = {
       query: query,
       args: [opts.contact_number, opts.step],
       event: "insertOtpSteps"
     }
     dbHandler.executeQuery(logHandler, queryObj).then((result) => {
         resolve(result);
     }, (error) => {
         resolve(true);
    });
  })
}


function insertLoginLogs(logHandler, opts){
  return new Promise((resolve ,reject)=> {
    let query = `INSERT INTO login_logs(user_id, username, user_agent, login_by) VALUES (?, ?, ?, ?)`;
    let queryObj = {
      query: query,
      args: [opts.user_id, opts.username, opts.user_agent, opts.login_by],
      event: "insertLoginLogs"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      resolve(true);
    });
  })
}

function insertAuthLogs(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let insertObj = {};
    opts.request              ? insertObj.request                 = JSON.stringify(opts.request)  : 0;
    opts.response             ? insertObj.response                = JSON.stringify(opts.response) : 0;
    opts.type                 ? insertObj.type                    = opts.type                     : 0;
    opts.signup_login_source  ? insertObj.signup_login_source     = opts.signup_login_source      : 0;
    let query = `INSERT INTO  auth_logs SET ?`;
    let queryObj = {
      query: query,
      args: [insertObj],
      event: "insertAuthLogs"
    }
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
    }, (error) => {
        resolve(true);
      });
    })
  }

function getUserInvitationToken(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `SELECT * FROM user_invitations WHERE workspace_id = ? AND (email = ? OR contact_number = ?)`;
    let queryObj = {
      query: sql,
      args: [opts.workspace_id, opts.email, opts.contact_number],
      event: "getUserInvitationToken"
    }
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
    }, (error) => {
        reject(error);
      });
    })
}

function getUserAccessToken(logHandler, opts) {
  return new Promise((resolve, reject)=> {
    let sql = 'SELECT access_token FROM users WHERE username = ?';
    let queryObj = {
      query: sql,
      args: [opts.username],
      event: "lpuLoginViaUSM"
    }
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function getUserActiveAndInvitedSpaces(logHandler, user_unique_keys) {
  return new Promise((resolve, reject) => {
    let values = []
    values.push(user_unique_keys)
    let query =`SELECT workspace_id,user_unique_key
                FROM user_to_workspace
                WHERE user_unique_key IN (?)
                AND status IN("ENABLED","INVITED")`
    const queryObj = {
      query: query,
      args: values,
      event: "getUserActiveAndInvitedSpaces"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let records = []
      for (let i = 0; i < user_unique_keys.length; i++) {
        let temp = {}
        temp.user_unique_key = user_unique_keys[i]
        temp.workspace_id = result.filter(row =>
          row.user_unique_key == temp.user_unique_key
        ).map(x => x.workspace_id)
        records.push(temp)
      }
      resolve(records);
    }, (error) => {
      reject(error);
    });
  })
}
