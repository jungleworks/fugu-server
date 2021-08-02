/**
 * Created by vidit on 7/7/17.
 */

const Promise                  = require('bluebird');
const config                   = require('config');
const _                        = require('underscore');
const dbHandler                = require('../database').dbHandler;
const { logger }               = require('../libs/pino_logger');
const constants                = require('../Utils/constants');
const commonFunctions          = require('../Utils/commonFunctions');
const slaveDbHandler           = require('../database').slaveDbHandler;
const botService               = require('./bot');


exports.insertNew                           = insertNew;
exports.getInfo                             = getInfo;
exports.updateInfo                          = updateInfo;
exports.getConfiguration                    = getConfiguration;
exports.getBusinessSignUpInfo               = getBusinessSignUpInfo;
exports.insertSignUpRequest                 = insertSignUpRequest;
exports.updateBusinessSignUpInfo            = updateBusinessSignUpInfo;
exports.getBusinessesInfo                   = getBusinessesInfo;
exports.getBusinessPropertyValue            = getBusinessPropertyValue;
exports.getInfoCommon                       = getInfoCommon;
exports.editConfiguration                   = editConfiguration;
exports.getWorkspaceConfiguration           = getWorkspaceConfiguration;
exports.getUserBusinessesDetails            = getUserBusinessesDetails;
exports.insertPublicEmailDomain             = insertPublicEmailDomain;
exports.getPublicEmailDomains               = getPublicEmailDomains;
exports.getPublicEmailDomain                = getPublicEmailDomain;
exports.deletePendingBusinessSignupRequests = deletePendingBusinessSignupRequests;
exports.editPublicEmailDomains              = editPublicEmailDomains;
exports.updatePublicEmailDomain             = updatePublicEmailDomain;
exports.getWorkspacesConfiguration          = getWorkspacesConfiguration;
exports.getConfigurations                   = getConfigurations;
exports.getWorkspaceUsers                   = getWorkspaceUsers;
exports.getInvitedUsers                     = getInvitedUsers;
exports.getUserWorspaces                    = getUserWorspaces;
exports.getWorkspacesUsers                  = getWorkspacesUsers;
exports.getTurnCredentials                  = getTurnCredentials;
exports.getWorkspaceDetails                 = getWorkspaceDetails;
exports.getDomainDetails          = getDomainDetails;
exports.getAllOwners                        = getAllOwners;
exports.getTookanWorkspace                  = getTookanWorkspace;
exports.updateTookanWorkspace               = updateTookanWorkspace;
exports.getPublicWorkspaceDetails           = getPublicWorkspaceDetails;
exports.getWorkspaceUsersCount              = getWorkspaceUsersCount;
exports.getWorkspaceBillingPlans            = getWorkspaceBillingPlans;
exports.getBillingPlans                     = getBillingPlans;
exports.getAllBusinesses                    = getAllBusinesses;
exports.updateCurrentUserCount              = updateCurrentUserCount;
exports.getBusinessActiveTransaction        = getBusinessActiveTransaction;
exports.getScrumTokenByBusinessId           = getScrumTokenByBusinessId;
exports.insertBillingTransaction            = insertBillingTransaction;
exports.updateBillingTransaction            = updateBillingTransaction;
exports.getGuestUsers                       = getGuestUsers;
exports.getGuestAllUsers                    = getGuestAllUsers;
exports.getSpaceDetailsById                 = getSpaceDetailsById;
exports.getBusinessDetails                  = getBusinessDetails;
exports.getUsersByUniqueKey                 = getUsersByUniqueKey;
exports.getWorkspaceDetailsWithDomain       = getWorkspaceDetailsWithDomain;
exports.getDomainCredentials                = getDomainCredentials;
exports.searchInvitedUsers                  = searchInvitedUsers;
exports.pendingAndAcceptedUsers             = pendingAndAcceptedUsers;
exports.getWorkspaceDeactivatedMembers      = getWorkspaceDeactivatedMembers;
exports.getGuestUsersData                   = getGuestUsersData;
exports.getAllMembers                       = getAllMembers;
exports.getWorkspaceExpirationDays          = getWorkspaceExpirationDays;
exports.updateExpirationDays                = updateExpirationDays;
exports.updateTransaction                   = updateTransaction;
exports.getBillingDetails                   = getBillingDetails;
exports.getAllMemberWithGuest               = getAllMemberWithGuest;
exports.getUserWorkspaceData                = getUserWorkspaceData;
exports.getWorkSpaceUserCount               = getWorkSpaceUserCount;
exports.insertMeetCount                     = insertMeetCount;
exports.getMeetConferenceRoom               = getMeetConferenceRoom;
exports.getLoginDetails                     = getLoginDetails;
exports.insertLoginRequest                  = insertLoginRequest;
exports.updateLoginDetails                  = updateLoginDetails;
exports.insertWorkspacePropertyOnInstallApp = insertWorkspacePropertyOnInstallApp;
exports.getAppConfigurations                = getAppConfigurations;
exports.getNoOfInviteAllowed                = getNoOfInviteAllowed;
exports.getActiveUserInWorkspace            = getActiveUserInWorkspace;
exports.insertUpdateWorkspaceInviteAllowed  = insertUpdateWorkspaceInviteAllowed;
exports.getOpenWorkspaceDetails             = getOpenWorkspaceDetails;
exports.insertDefaultWorkspaceProperty      = insertDefaultWorkspaceProperty
exports.getWorkspacesOverriddenConfiguration      = getWorkspacesOverriddenConfiguration

function getAllMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let limitPlaceHolder = '';
    let values = [];
    let userIdPlaceHolder = ''
    if (payload.user) {
      userIdPlaceHolder = ` AND ud.user_id != ${payload.userId}  `
    }


    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }


    let query = `SELECT
                    ud.user_unique_key as user_id,
                    ud.user_id as fugu_user_id,
                    ud.full_name,
                    u.email,
                    u.auth_user_id,
                    ud.contact_number,
                    coalesce(ud.user_thumbnail_image,"") as user_image,
                    ud.user_thumbnail_image,
                    ud.status,
                    COALESCE(upds.leave_type,'PRESENT')  as leave_type,
                    ud.role
                FROM
                    user_to_workspace ud
                LEFT JOIN users u ON
                    ud.user_unique_key = u.user_id
                LEFT JOIN user_present_day_status upds
                    on ud.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
                WHERE
                    ud.workspace_id = ${payload.workspace_id} ${userIdPlaceHolder} AND ud.role != "GUEST" and ud.user_type NOT IN (0,3,4,5,7,9,10) and ud.status IN ('ENABLED','INVITED')
                 ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };

    dbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}

function getAllMemberWithGuest(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let limitPlaceHolder = '';
    let values = [];

    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }


    let query = `SELECT
                  ud.user_unique_key as user_id,
                  ud.user_id as fugu_user_id,
                  ud.full_name,
                  ud.contact_number,
                  coalesce(ud.user_thumbnail_image,"") as user_image,
                  u.email,
                  u.auth_user_id,
                  ud.user_thumbnail_image,
                  ud.status,
                  COALESCE(upds.leave_type,'PRESENT')  as leave_type,
                  ud.role
                FROM
                    guest_interaction gi JOIN
                    user_to_workspace ud  on gi.user_id = ud.user_id and gi.status = 1 and ud.status IN ('ENABLED','INVITED')
                    LEFT JOIN user_present_day_status upds
                    on ud.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
                    JOIN users u  ON
                    u.user_id = ud.user_unique_key
                WHERE
                    JSON_CONTAINS(
                        user_ids_to_connect,
                        CAST(${payload.user_id} AS CHAR(50))
                    ) AND gi.user_id IN(
                        SELECT user_id as fugu_user_id from user_to_workspace where workspace_id = ${payload.workspace_id}  and status IN ('ENABLED','INVITED') AND role = 'GUEST'
                    )
                    ORDER BY
                    fugu_user_id ASC
                 ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };

    dbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}


function insertNew(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = "INSERT INTO workspace_details set ? ";
    let workspaceInfo = {
      workspace_name: payload.workspace_name,
      email: payload.email,
      workspace: payload.workspace,
      domain_id: payload.domain_id,
      app_name: payload.app_name,
      fav_icon: payload.fav_icon,
      logo: payload.logo,
      colors: payload.colors,
      status: payload.status || constants.businessStatus.ENABLED,
      hrm_api_key : payload.hrm_api_key
    };

    let queryObj = {
      query: query,
      args: [workspaceInfo],
      event: "Inserting new workspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      payload.workspace_id = result.insertId;
      resolve(payload);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    const values = [];
    let query = `
      SELECT *
      FROM
        workspace_details
      WHERE 
        1=1  
    `;
    if (payload.workspace_id) {
      query += ' AND workspace_id = ? ';
      values.push(payload.workspace_id);
    }

    if (payload.email) {
      query += ' AND email = ? ';
      values.push(payload.email);
    }

    if (payload.workspace) {
      query += ' AND workspace = ? ';
      values.push(payload.workspace);
    }
    if (payload.scrum_token) {
      query += 'AND scrum_token = ?';
      values.push(payload.scrum_token)
    }
    if (_.isEmpty(values)) {
      return reject(new Error('Insufficient Information supplied!'));
    }
    const queryObj = {
      query,
      args: values,
      event: 'Get Business Info '
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessesInfo(logHandler, businessId) {
  return new Promise((resolve, reject) => {
    let query = `select * from workspace_details where workspace_id IN (?) and  status = 'ENABLED'`;
    let queryObj = {
      query: query,
      args: [businessId],
      event: "Get Business Device Mappings By App Name"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoCommon(logHandler, payload) {
  return new Promise((resolve, reject) => {
    logger.trace(logHandler, { EVENT: "GET Business Info using getInfoCommon" }, { PAYLOAD: payload });
    if (_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }

    // where
    let whereCondition = "";
    let values = [];
    _.each(payload.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    // select
    let select = "*";
    if (!_.isEmpty(payload.select_columns)) {
      select = payload.select_columns.join(",");
    }


    let query = `Select ${select}  from workspace_details where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: values,
      event: "Get Business Info Common"
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
    logger.trace(logHandler, { EVENT: "Updating business info " }, { PAYLOAD: payload });
    let updateObj = {};
    if (_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }
    payload.workspace_name ? updateObj.workspace_name = payload.workspace_name : 0;
    payload.fugu_secret_key ? updateObj.fugu_secret_key = payload.fugu_secret_key : 0;
    payload.default_manager_fugu_user_id ? updateObj.default_manager_fugu_user_id = payload.default_manager_fugu_user_id : 0;
    payload.status ? updateObj.status = payload.status : 0;
    payload.hasOwnProperty('image') ? updateObj.image = payload.image : 0;
    payload.tookan_user_id ? updateObj.tookan_user_id = payload.tookan_user_id : 0;
    payload.attendance_token ? updateObj.attendance_token = payload.attendance_token : 0;
    payload.scrum_token ? updateObj.scrum_token = payload.scrum_token : 0;
    payload.scrum_token ? updateObj.scrum_token = payload.scrum_token : 0;
    payload.hrm_configuration ? updateObj.hrm_configuration = JSON.stringify(payload.hrm_configuration) : 0;


    let whereCondition = "";
    _.each(payload.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = " + value;
    });

    if (_.isEmpty(updateObj)) {
      return reject(new Error("Nothing to update"));
    }
    logger.trace(logHandler, "UPDATE OBJ", updateObj, whereCondition);
    let query = `UPDATE workspace_details set  ?  where 1=1 ${whereCondition}`;
    let queryObj = {
      query: query,
      args: [updateObj],
      event: "Updating workspace info"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getConfiguration(logHandler, workspace_id) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let result = yield getWorkspaceConfiguration(logHandler, 0);
      let workspaceConfig = yield getWorkspaceConfiguration(logHandler, workspace_id);
      _.each(workspaceConfig, (value, key) => {
        result[key] = value;
      });
      if(result.is_guest_allowed){
        result["all_roles"] = '["ADMIN","OWNER","USER","GUEST", "PAYING_GUEST"]'
      } else {
        result["all_roles"] = '["ADMIN","OWNER","USER"]'
      }
      return result;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessOwner(logHandler, workspace_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT 
                    u.*,
                    bd.business_name AS business_name,
                    bd.address AS business_address
                FROM
                    users u
                        JOIN
                    workspace_details bd ON bd.workspace_id = u.workspace_id
                        AND bd.email = u.email
                WHERE
                    bd.workspace_id = ? AND u.user_type = 2`;

    let queryObj = {
      query: query,
      args: [workspace_id],
      event: "getBusinessOwner"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoUsingEmail(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT *
      FROM
        workspace_details
      WHERE 
        email = ? 
    `;
    let queryObj = {
      query: query,
      args: [payload.email],
      event: "Get Business Info Using Email "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInfoByDomain(logHandler, workspace) {
  return new Promise((resolve, reject) => {
    let query = `
                    SELECT *
                    FROM
                      workspace_details
                    WHERE 
                      workspace = ? 
                  `;
    let queryObj = {
      query: query,
      args: [workspace],
      event: "Get Business Info "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessSignUpInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    const values = [];
    let query = `
                SELECT *
                FROM
                  signup_requests
                WHERE  1=1`;
    if (payload.email) {
      query += ' and email = ?';
      values.push(payload.email);
    }

    if (payload.otp) {
      query += ' and otp = ?';
      values.push(payload.otp);
    }

    if (payload.contact_number) {
      query += ' and contact_number = ?';
      values.push(payload.contact_number);
    }
    if( payload.is_otp_verified){
      query += ' AND is_otp_verified = ?';
      values.push(payload.is_otp_verified);
    }

    // TODO remove old version
    if (payload.workspace) {
      query += ' and domain = ?';
      values.push(payload.workspace);
    }

    query += 'ORDER BY created_at  DESC';
    const queryObj = {
      query,
      args: values,
      event: 'Get Business SignUp Info'
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function insertSignUpRequest(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = "INSERT INTO signup_requests set ? ";
    let businessSignUpRequest = {
      email: payload.email,
      domain: payload.workspace,
      business_name: payload.workspace_name,
      otp: payload.otp,
      contact_number: payload.contact_number
    };
    if(payload.sent_count){
       businessSignUpRequest.sent_count = payload.sent_count;
    }
    if(payload.is_expired){
      businessSignUpRequest.is_expired = payload.is_expired;
    }
    if(payload.is_otp_verified){
      businessSignUpRequest.is_otp_verified = payload.is_otp_verified;
    }

    let queryObj = {
      query: query,
      args: [businessSignUpRequest],
      event: "Inserting business Signup Details"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBusinessSignUpInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let updateObj = {};
    payload.otp                                     ? updateObj.otp             = payload.otp             : 0;
    (payload.sent_count || payload.sent_count == 0) ? updateObj.sent_count      = payload.sent_count      : 0;
    payload.is_expired                              ? updateObj.is_expired      = payload.is_expired      : 0;
    payload.hasOwnProperty('is_otp_verified')       ? updateObj.is_otp_verified = payload.is_otp_verified : 0;
    payload.email_token                             ? updateObj.email_token     = payload.email_token     : 0;
    let placeholder = '';
    let values = [updateObj];

    if (payload.email) {
      placeholder = ' email = ?';
      values.push(payload.email);
    } else {
      placeholder = ' contact_number = ?';
      values.push(payload.contact_number);
    }
    let query = `Update signup_requests set ? where  ${placeholder}`;

    if (values.length < 2) {
      logger.error(logHandler, "payload", payload, "query", query, "values", values);
      reject(new Error("Values are required"));
    }

    let queryObj = {
      query: query,
      args: values,
      event: "updating business SignUp info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBusinessPropertyValue(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeholder = ` `;
    let values = [];
    if (opts.workspace_id) {
      placeholder = ` workspace_id = ? and `;
      values.push(opts.workspace_id);
    }
    let query = `Select * from workspace_property where ${placeholder} property = ? `;
    values.push(opts.property);
    let queryObj = {
      query: query,
      args: values,
      event: `Get Business ${opts.property}`
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function editConfiguration(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspace_id = payload.workspace_id;
      let allowedConfig = yield getConfiguration(logHandler, 0);
      let placeHolders = [];
      let values = [];
      _.each(allowedConfig, (value, key) => {
        if (key in payload) {
          placeHolders.push("(" + new Array(3).fill("?").join(',') + ")");
          values = values.concat([workspace_id, key, payload[key]]);
        }
      });
      if (_.isEmpty(values)) {
        throw new Error("Invalid Property!");
      }
      let placeHolder = placeHolders.join(', ');
      let query = `REPLACE INTO workspace_property (workspace_id, property, value) VALUES ${placeHolder} `;
      let queryObj = {
        query: query,
        args: values,
        event: `EDIT Business ${payload}`
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceConfiguration(logHandler, workspace_id, property, properties) {
  return new Promise((resolve, reject) => {
    let values = [workspace_id];
    let query = `SELECT *  FROM workspace_property WHERE  workspace_id = ? `;
    if(property){
      query += ` AND property = ?`;
     values.push(property);
    }
    if(properties){
      query += ` AND property IN(?)`;
      values.push(properties);
    }
    let queryObj = {
      query: query,
      args: values,
      event: `get business configuration`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let res = {};
      for (let i = 0; i < result.length; i++) {
        let property = result[i].property;
        res[property] = result[i].value;
      }
      return resolve(res);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserBusinessesDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeholder = ``;

    if (payload.workspace_id) {
      placeholder += ` AND uds.workspace_id = ? `;
      values.push(payload.workspace_id);
    }
    if (payload.user_id) {
      placeholder += ` AND uds.user_unique_key = ? `;
      values.push(payload.user_id);
    }

    if (payload.username) {
      placeholder += ` AND u.username = ?`;
      values.push(payload.username);
    }

    if (payload.email) {
      placeholder += ` AND u.email = ? `;
      values.push(payload.email);
    }

    if (payload.domain) {
      placeholder += ` AND dc.domain = ?`;
      values.push(payload.domain);
    }

    let query = `SELECT
                      dc.domain,
                      u.email,
                      b.default_manager_fugu_user_id,
                      uds.full_name,
                      dc.email_credentials,
                      uds.user_thumbnail_image as user_image,
                      uds.role,
                      uds.user_id,
                      dc.full_domain,
                      b.domain_id,
                      b.workspace_name,
                      b.attendance_token,
                      b.scrum_token,
                      b.image as workspace_image,
                      b.colors,
                      b.logo,
                      b.fav_icon,
                      b.app_name,
                      b.workspace,
                      b.hrm_api_key,
                      b.workspace_id,
                      b.workspace_id as business_id,
                      IFNULL(uds.user_id, -1) as fugu_user_id,
                      b.fugu_secret_key,
                      b.status as workspace_status,
                      uds.location,
                      uds.department,
                      uds.auto_download_level,
                      uds.gallery_media_visibility,
                      COALESCE(u.contact_number,"") as contact_number,
                      uds.designation,
                      uds.unread_notification_count,
                      uds.status,
                      uds.user_unique_key,
                      uds.notification_level,
                      uds.user_properties,
                      uds.status as user_status,
                      dc.google_creds,
                      dc.properties,
                      dc.is_invite_email_enabled,
                      dc.android_app_link,
                      dc.payment_gateway_creds,
                      b.hrm_configuration,
                      b.fugu_secret_key
                  FROM
                  users u
                  JOIN user_to_workspace uds ON
                      u.user_id = uds.user_unique_key    
                  JOIN workspace_details b ON
                      uds.workspace_id = b.workspace_id
                  JOIN domain_credentials dc ON
                      dc.id = b.domain_id 
                  WHERE 1=1  ${placeholder} `;
    let queryObj = {
      query: query,
      args: values,
      event: "getUserBusinessDetails"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getPublicEmailDomains(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeholder = ``;
    let values = [constants.allowedWorkspaceStatus.ENABLED];
    if (payload.workspace_id) {
      placeholder += ` and awm.workspace_id = ? `;
      values.push(payload.workspace_id);
    }

    if (payload.email_domain) {
      placeholder += ' and awm.email_domain = ? AND wd.domain_id = ? ';
      values.push(payload.email_domain, payload.domain_id);
    }

    if (payload.joinedWorkspaceIds && payload.joinedWorkspaceIds.length > 0) {
      placeholder += ` and awm.workspace_id NOT IN( ${payload.joinedWorkspaceIds} )`;
    }
    let query = `Select awm.workspace_id, awm.email_domain, wd.fugu_secret_key, awm.status,
      wd.default_manager_fugu_user_id,wd.workspace, wd.workspace_name, wd.domain_id
       from workspace_open_invites awm JOIN workspace_details wd 
       ON awm.workspace_id = wd.workspace_id where wd.status = ? and awm.status = 'ENABLED'  ${placeholder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `getPublicEmailDomains`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getPublicEmailDomain(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select email_domain from workspace_open_invites where workspace_id = ? and status = 'ENABLED'`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: `getPublicEmailDomains`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertPublicEmailDomain(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `insert into workspace_open_invites set workspace_id = ?, email_domain = ? 
                 ON DUPLICATE KEY UPDATE status = ?`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id, payload.email_domain, payload.status],
      event: `insertPublicEmailDomain`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function deletePendingBusinessSignupRequests(logHandler) {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM signup_requests where is_expired = 'NO' and created_at < Date(now()) - INTERVAL 30 DAY`;
    let queryObj = {
      query: query,
      args: [],
      event: `deletePendingBusinessSignupRequests`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function editPublicEmailDomains(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspace_id = payload.workspace_id;
      let values = [];
      let placeHolders = [];
      yield updatePublicEmailDomain(logHandler, { status: constants.status.DISABLED, workspace_id: payload.workspace_id });
      let query;
      for (let domain of payload.add_email_domains) {
        placeHolders.push("(" + new Array(3).fill("?").join(',') + ")");
        values = values.concat([workspace_id, domain, constants.status.ENABLED]);
      }

      if (!payload.add_email_domains.length) {
        query = `UPDATE workspace_open_invites SET status = 'DISABLED' WHERE workspace_id = ?`;
        values.push(workspace_id);
      } else {
        let placeHolder = placeHolders.join(', ');
        query = `REPLACE INTO workspace_open_invites (workspace_id, email_domain, status) VALUES ${placeHolder} `;
      }

      // if (_.isEmpty(values)) {
      //   throw new Error("Invalid Property!");
      // }

      let queryObj = {
        query: query,
        args: values,
        event: `EDIT Open Email Domain ${payload}`
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    })().then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function getWorkspacesConfiguration(logHandler, workspaceIds) {
  return new Promise((resolve, reject) => {
    let query = `SELECT *  FROM workspace_property WHERE  workspace_id IN (?) `;
    let queryObj = {
      query: query,
      args: [workspaceIds],
      event: `get business configuration`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function updatePublicEmailDomain(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let updateObj = {};

    payload.status ? updateObj.status = payload.status : 0;
    payload.email_domain ? updateObj.email_domain = payload.email_domain : 0;

    let query = `update workspace_open_invites set ? where workspace_id = ?`;
    let queryObj = {
      query: query,
      args: [updateObj, payload.workspace_id],
      event: `updatePublicEmailDomain`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getConfigurations(logHandler, workspaceIds, domain) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let workspaceConfig = [];
      let allowedWorkspaceConfig = yield getWorkspaceConfiguration(logHandler, 0);
      if (!_.isEmpty(workspaceIds)) {
        workspaceConfig = yield getWorkspacesConfiguration(logHandler, workspaceIds);
      }
      let liveStreamMap = {};
      let liveStreamData = yield botService.getAppState(logHandler, {workspace_ids: workspaceIds, app_id: 1});
      for(let i = 0; i < liveStreamData.length; i++){
          liveStreamMap[liveStreamData[i].workspace_id] = liveStreamData[i].status;
      }
      let response = {};
      for (let row of workspaceConfig) {
        if (!response[row.workspace_id]) {
          response[row.workspace_id] = commonFunctions.cloneObject(allowedWorkspaceConfig);
          response[row.workspace_id][row.property] = row.value;
        } else {
          response[row.workspace_id][row.property] = row.value;
        }
        if(!liveStreamMap[row.workspace_id] || liveStreamMap[row.workspace_id] == 0){
          delete response[row.workspace_id]["livestream_permission"];
        }

        response[row.workspace_id]["is_group_live_stream_enabled"] = "1";
      }
      response[0] = allowedWorkspaceConfig;
      return response;
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getAppConfigurations(logHandler, workspaceIds){
   return new Promise(async(resolve, reject)=> {
     let appConfiguration = await botService.getAppState(logHandler,{workspace_ids: workspaceIds, status: 1});
     if(_.isEmpty(appConfiguration)){
       return resolve({});
     }
     let appConfigObj = {};
     for(let i = 0; i < appConfiguration.length; i++){
       if(appConfigObj[appConfiguration[i].workspace_id]){
         appConfigObj[appConfiguration[i]["workspace_id"]].push(appConfiguration[i].app_id);
       }else{
         appConfigObj[appConfiguration[i]["workspace_id"]] = [appConfiguration[i].app_id];
       }
    }
    return resolve(appConfigObj);
   })
}

function getGuestUsersData(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let values = [payload.workspace_id]
    let statusPlaceholder = `and ud.status IN ('ENABLED','INVITED')`
    let limitPlaceHolder = '';

    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }

    if (payload.status == "DEACTIVATED_MEMBERS") {
      statusPlaceholder = `and ud.status IN ('DISABLED','LEFT')`
    }
    if(payload.all_user){
      statusPlaceholder = '';
    }
    let query = `SELECT
                    ud.user_unique_key as user_id,
                    ud.user_id as fugu_user_id,
                    ud.full_name,
                    ud.emails AS email,
                    ud.contact_number,
                    coalesce(ud.user_thumbnail_image,"") as user_image,
                    ud.user_thumbnail_image,
                    ud.status,
                    ud.role,
                    gi.guest_id as id
                FROM
                    user_to_workspace ud
                 JOIN guest_interaction gi ON
                    gi.user_id = ud.user_id
                WHERE
                    ud.workspace_id = ? and ud.role = 'GUEST' ${statusPlaceholder} ORDER BY ud.role,fugu_user_id ASC ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}




function getWorkspaceUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    let select_columns = '';
    let guestPlaceHolder = ``;
    let limitPlaceHolder = '';
    let userIdPlaceHolder = '';
    let values = [+payload.workspace_id];

    if (payload.fugu_user_id) {
      select_columns = "  u.password, "
      placeHolder = ' and ud.user_id = ?';
      values.push(payload.fugu_user_id);
    }

    if (payload.guest_allowed) {
      guestPlaceHolder = ``;
    } else {
      guestPlaceHolder = `AND ud.role != "GUEST"`;
    }

    if (payload.status) {
      placeHolder = ' and ud.status IN (?)';
      values.push(payload.status);
    }

    if (payload.noBotUsers) {
      placeHolder += ' and ud.user_type NOT IN (0,3,4,5,7,8,9,10)'
    }

    if (payload.page_start || payload.page_start == 0) {
    limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }
    if (payload.userId && ( payload.page_start || payload.page_start == 0) ) {
      userIdPlaceHolder = ` AND ud.user_id != ${payload.userId} `;
      //values.push(payload.page_start, payload.page_end);
    }
    if (payload.user) {
      userIdPlaceHolder = ` AND  ud.user_id = ${payload.userId}  `
    }

    let query = `SELECT
                    ud.user_unique_key as user_id,
                    ud.user_id as fugu_user_id,
                    ud.full_name,
                    u.email,
                    u.auth_user_id,
                    ud.contact_number,
                    coalesce(ud.user_thumbnail_image,"") as user_image,
                    ${select_columns}
                    ud.user_thumbnail_image,
                    COALESCE(upds.leave_type,'PRESENT')  as leave_type,
                    ud.status,
                    ud.role,
                    ud.created_at
                FROM
                    user_to_workspace ud
                   JOIN users u ON
                    ud.user_unique_key = u.user_id
                  LEFT JOIN user_present_day_status upds
                    on ud.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
                WHERE
                    ud.workspace_id = ?  ${guestPlaceHolder} ${userIdPlaceHolder} ${placeHolder} order by ud.role,ud.user_id ASC ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}


function getWorkspaceDeactivatedMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let limitPlaceHolder = '';
    let guestPlaceHolder = `AND ud.role!='GUEST'`;
    let values = [payload.workspace_id];

    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }

    if (payload.guestUser) {
      guestPlaceHolder = `AND ud.role ='GUEST'`
    }

    let query = `SELECT
                    ud.user_unique_key as user_id,
                    ud.user_id as fugu_user_id,
                    ud.full_name,
                    u.email,
                    u.auth_user_id,
                    ud.contact_number,
                    coalesce(ud.user_thumbnail_image,"") as user_image,
                    ud.user_thumbnail_image,
                    ud.status,
                    ud.role
                FROM
                    user_to_workspace ud
                LEFT JOIN users u ON
                    ud.user_unique_key = u.user_id
                WHERE
                    ud.workspace_id = ? AND ud.status IN ( 'LEFT' , 'DISABLED' ) ${guestPlaceHolder} ORDER BY role,fugu_user_id ASC ${limitPlaceHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => {
      result.count
      resolve(result)
    }, (error) => {
      reject(error);
    });
  });
}


function searchInvitedUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    let limitPlaceHolder = ``;
    let values = [payload.workspace_id];

    if (payload.status) {
      placeHolder = ' and status = ?';
      values.push(payload.status);
    }
    let query = `SELECT
                      IFNULL(email, "") AS email,
                      IFNULL(contact_number, "") AS contact_number,
                      status,
                      type,
                      updated_at AS date_time
                  FROM
                      user_invitations
                  WHERE
                      workspace_id = ? ${placeHolder}
                  ORDER BY
                      updated_at
                  DESC 
    `;
    let queryObj = {
      query: query,
      args: values,
      event: `getInvitedUsers`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function pendingAndAcceptedUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    let values = [payload.workspace_id];

    if (payload.status) {
      placeHolder = ' and status = ?';
      values.push(payload.status);
    }

    values.push("%" + payload.search_text + "%", "%" + payload.search_text + "%")

    let query = `SELECT
                      IFNULL(email, "") AS email,
                      IFNULL(contact_number, "") AS contact_number,
                      status,
                      type,
                      updated_at AS date_time
                  FROM
                      user_invitations
                  WHERE
                      workspace_id = ? ${placeHolder} AND email LIKE ? OR contact_number LIKE ?
    `;
    let queryObj = {
      query: query,
      args: values,
      event: `getInvitedUsers`
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}









function getInvitedUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = '';
    let limitPlaceHolder = ``;
    let values = [payload.workspace_id];

    if (payload.status) {
      placeHolder = ' and status IN (?)';
      values.push(payload.status);
    }

    if (payload.page_start || payload.page_start == 0) {
      limitPlaceHolder = ` LIMIT ?,?`;
      values.push(payload.page_start, payload.page_end);
    }

    let query = `SELECT
                      IFNULL(email, "") AS email,
                      IFNULL(contact_number, "") AS contact_number,
                      status,
                      type,
                      updated_at AS date_time
                  FROM
                      user_invitations
                  WHERE
                      workspace_id = ? ${placeHolder}
                  ORDER BY
                      updated_at
                  DESC ${limitPlaceHolder}
    `;
    let queryObj = {
      query: query,
      args: values,
      event: `getInvitedUsers`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function getUserWorspaces(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.user_id];

    if (payload.domain_id) {
      placeHolder = ` AND wd.domain_id = ?`;
      values.push(payload.domain_id);
    }

    let query = `SELECT
                    ud.workspace_id,
                    ud.user_id
                FROM
                    user_to_workspace ud
                    Join workspace_details wd on ud.workspace_id = wd.workspace_id
                WHERE
                    ud.user_unique_key = ? and ud.status = 'ENABLED' AND wd.status = 'ENABLED' ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `getUserWorkspaces`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function getWorkspacesUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    ud.full_name,
                    u.email,
                    u.contact_number
                FROM
                    user_to_workspace ud
                LEFT JOIN users u ON
                    ud.user_unique_key = u.user_id
                WHERE
                    ud.workspace_id IN (?) AND ud.status = 'ENABLED' group by u.email`;
    let queryObj = {
      query: query,
      args: [payload.workspaceIds],
      event: `getUserWorkspaces`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function getTurnCredentials(logHandler) {
  return new Promise((resolve, reject) => {
    let query = `SELECT turn_api_key, ice_servers, username, credential
                FROM
                    turn_configuration
                WHERE
                   turn_api_key = ?`;
    let queryObj = {
      query: query,
      args: [config.get('turnApiKey')],
      event: `getTurnCredentials`
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


async function getWorkspaceDetails(logHandler, payload) {
    let placeHolder = ``;
    let values = [];

    if (payload.workspace && payload.domain) {
      placeHolder = ` wd.workspace = ? AND dc.domain = ?`;
      values = [payload.workspace, payload.domain];
    } else if (payload.hrm_api_key) {
      placeHolder = ` wd.hrm_api_key = ? `;
      values = [payload.hrm_api_key]
    } else {
      placeHolder = ` dc.domain = ?`;
      values = [payload.domain];
    }
    let query = `SELECT
              wd.workspace_id,
              wd.workspace_name,
              wd.app_name,
              dc.full_domain,
              dc.google_creds,
              dc.email_credentials,
              dc.id as domain_id,
              wd.default_manager_fugu_user_id,
              wd.workspace,
              wd.logo,
              JSON_EXTRACT(dc.google_creds, '$.googleWebClientId') as google_client_id,
              wd.fav_icon,
              dc.domain,
              wd.colors,
              dc.properties,
              dc.android_app_link,
              dc.android_latest_version,
              dc.android_critical_version,
              dc.ios_app_link,
              dc.ios_latest_version,
              dc.ios_critical_version,
              dc.full_domain,
              dc.show_meet_tab
            FROM
                workspace_details wd
            JOIN domain_credentials dc ON
                wd.domain_id = dc.id
            WHERE ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `getWorkspaceDetails`
    };
  let result  = await slaveDbHandler.executeQuery(logHandler, queryObj)
  if (result.length && payload.create_workspace) {
    payload.workspace = payload.workspace + Math.floor(Math.random() * 1000)
    getWorkspaceDetails(logHandler, payload);
  } else {
    return result;
  }
}

function getDomainDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [];
    let query = `SELECT * FROM domain_credentials WHERE 1`;

    if(payload.domain){
      query += ` AND domain = ?`;
      values.push(payload.domain);
    }
    if(payload.domain_id){
      query += ` AND id = ?`;
      values.push(payload.domain_id);
    }
    if(payload.domain_ids){
      query += " AND id IN (?)";
      values.push(payload.domain_ids);
    }
    if(payload.order_by){
      query += " ORDER BY id ASC";
    }

    let queryObj = {
      query: query,
      args : values,
      event: `getDomainDetails`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}

function getAllOwners(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT u.email, ud.role, u.user_id as user_id, u.full_name, u.password, u.contact_number FROM user_to_workspace ud JOIN users u on ud.user_unique_key = u.user_id WHERE ud.role = "OWNER" AND u.contact_number is NOT null 
    and u.user_id in ("jREN6b8r5c","cnWVu9MoeU") GROUP BY ud.user_unique_key`;
    let queryObj = {
      query: query,
      args: [payload.domain],
      event: `getAllOwners`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function getTookanWorkspace(logHandler, businessId) {
  return new Promise((resolve, reject) => {
    let query = `select * from workspace_details where tookan_user_id IN (?)`;
    let queryObj = {
      query: query,
      args: [businessId],
      event: "getTookanWorkspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateTookanWorkspace(logHandler, businessId, status) {
  return new Promise((resolve, reject) => {
    let query = `update workspace_details  set status = ? where tookan_user_id IN (?)`;
    let queryObj = {
      query: query,
      args: [status, businessId],
      event: "updateTookanWorkspace"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getPublicWorkspaceDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let placeHolder = ``;
    let values = [];

    if (payload.workspace) {
      placeHolder = ` wd.workspace = ?`;
      values = [payload.workspace];
    }
    let query = `SELECT
              wd.workspace_id,
              wd.workspace_name,
              wd.app_name,
              dc.google_creds,
              wd.workspace,
              wd.logo,
              JSON_EXTRACT(dc.google_creds, '$.googleWebClientId') as google_client_id,
              wd.fav_icon,
              dc.domain,
              wd.colors,
              dc.properties,
              dc.email_credentials,
              dc.android_app_link,
              dc.android_latest_version,
              dc.android_critical_version,
              dc.ios_app_link,
              dc.full_domain,
              dc.ios_latest_version,
              dc.ios_critical_version,
              dc.is_invite_email_enabled
            FROM
                workspace_details wd
            JOIN domain_credentials dc ON
                wd.domain_id = dc.id
            WHERE ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: `getPublicWorkspaceDetails`
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceUsersCount(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    datediff(now(), b.created_at) as days,
                    count(uds.user_id) as user_count,
                    b.status
                FROM user_to_workspace uds 
                JOIN workspace_details b ON
                    uds.workspace_id = b.workspace_id
                WHERE b.workspace_id = ? AND uds.user_type IN (1,6) AND uds.user_unique_key NOT IN ("iqfdwcyak5","im4fcyak5") AND uds.status = "ENABLED" AND emails NOT LIKE "%jungleworks.co%"
`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "getWorkspaceUsersCount"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspaceBillingPlans(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM billing  WHERE workspace_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id || 0],
      event: "getWorkspaceBillingPlans"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getBillingPlans(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.workspace_id];
    if (payload.plan_id) {
      placeHolder = ` AND id = ?`;
      values.push(payload.plan_id);
    } else if (payload.period) {
      placeHolder = ` AND period = ?`;
      values.push(payload.period);
    } else if (payload.billing_type) {
      placeHolder = ` AND plan_type = ? AND billing_type = ?`;
      values.push(payload.plan_type, payload.billing_type);
    }

    if (payload.app_id) {
      placeHolder += ` AND app_id = ? `;
      values.push(payload.app_id);
    }

    let query = `SELECT DATEDIFF(LAST_DAY(NOW()), DATE(NOW()))  as month_remaining_days,
                  DATEDIFF(LAST_DAY(NOW() + INTERVAL 11 MONTH), DATE(NOW()))  as year_remaining_days,
                  LAST_DAY(NOW()) as month_last_day,
                  LAST_DAY(NOW() + INTERVAL 11 MONTH) as year_last_day,
                  id,
                  price,
                  app_id,
                  period,
                  billing_type,
                  plan_type
                  FROM billing_plans WHERE workspace_id = ?  ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "getBillingPlans"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllBusinesses(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];
    if (payload.workspace_id) {
      placeHolder = ` and ud.workspace_id = ?  `;
      values.push(payload.workspace_id);
    } else {
      placeHolder = ` and bt.expire_on = DATE(now() - INTERVAL 1 DAY) `
    }
    let query = `SELECT
    bt.id,
    bt.workspace_id,
    bt.plan_id,
    bt.paid_for_users,
    bt.current_users,
    bt.balance,
    bp.price,
    COUNT(ud.user_id) AS total_users,
    GROUP_CONCAT(ud.user_id) AS fugu_user_id,
    LAST_DAY(NOW()) as month_last_day,
    LAST_DAY(NOW() + INTERVAL 11 MONTH) as year_last_day
             FROM
                 billing_transactions bt
             INNER JOIN(
                 SELECT
                     workspace_id,
                     MAX(created_at) AS max_date_time
                 FROM
                     billing_transactions mbt
                 GROUP BY
                     workspace_id
             ) lt
             ON
                 bt.created_at = lt.max_date_time
                 JOIN user_to_workspace ud ON
                         bt.workspace_id = ud.workspace_id AND ud.user_unique_key NOT IN("im4fcyak5","iqfdwcyak5","im4EinKp13") 
                                                   AND ud.status = "ENABLED" AND ud.role != "GUEST" ${placeHolder} AND bt.plan_state = "ACTIVE"
                 JOIN billing_plans bp ON
                 bt.plan_id = bp.id 
             GROUP BY
                 bt.workspace_id`;
    let queryObj = {
      query: query,
      args: values,
      event: "getAllBusinesses"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function updateCurrentUserCount(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    if (payload.status == constants.status.ENABLED) {
      placeHolder = `+`;
    } else {
      placeHolder = `-`;
    }

    let query = `UPDATE
            billing_transactions
        SET
            current_users = current_users ${placeHolder} 1
        WHERE
            id IN (?)`;
    let queryObj = {
      query: query,
      args: [payload.id],
      event: "updateCurrentUserCount"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getBusinessActiveTransaction(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.workspace_id]
    if (payload.billing_type) {
      placeHolder = ` bp.billing_type = ?  `;
      values.push(payload.billing_type);
    } else {
      placeHolder = ` bp.plan_type = "PER_USER"`;
    }

    if (payload.app_id) {
      placeHolder += ` AND bp.app_id = ?`;
      values.push(payload.app_id);
    }
    let query = `SELECT
    bt.id,
    bt.workspace_id,
    bt.plan_id,
    bt.paid_for_users,
    bt.current_users,
    bp.plan_type,
    bp.period,
    bp.price
             FROM
                 billing_transactions bt
                 JOIN billing_plans bp ON
                 bt.plan_id = bp.id and bt.workspace_id = ? AND bt.plan_state = "ACTIVE" AND ${placeHolder}`;
    let queryObj = {
      query: query,
      args: values,
      event: "getBusinessActiveTransaction"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBillingTransaction(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = `INSERT INTO  billing_transactions (workspace_id, email, plan_id, paid_for_users, current_users, amount, expire_on, transaction_id, payment_intent_id,transaction_status) VALUES (?,?,?,?,?,?,?,?,?,?)`;
    let queryObj = {
      query: query,
      args: [payload.workspace_id, payload.email, payload.plan_id, payload.user_count, payload.user_count, payload.amount, payload.expire_date, payload.transaction_id, payload.payment_intent_id, payload.transaction_status],
      event: "insertBillingTransaction"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateBillingTransaction(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [payload.invoice]
    if(payload.transaction_id) {
      placeHolder = ` id = ?`;
      values.push(payload.transaction_id)
    } else {
      placeHolder = ` workspace_id = ?`;
      values.push(payload.workspace_id);
    }

    let query = `UPDATE billing_transactions SET invoice = ? WHERE ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "updateBillingTransaction"
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
    ud.full_name,
    ud.created_at,
    IFNULL(SUM(us.days),DATEDIFF(NOW(), ud.created_at)) AS days,
        ud.user_id as fugu_user_id,
        us.created_at,
        DATEDIFF(NOW(), ud.created_at) AS guest_days
    FROM
        user_to_workspace ud
    LEFT JOIN user_status us ON
        ud.user_id = us.fugu_user_id
    WHERE
        ud.workspace_id IN (?) AND ud.role = "GUEST" AND ud.created_at < DATE(NOW() - INTERVAL 15 DAY)
    GROUP BY
        ud.user_id
    HAVING
        days > ?`;
    let queryObj = {
      query: query,
      args: [payload.workspace_ids, payload.max_guest_days],
      event: "getGuestUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getGuestAllUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                  *
                FROM guest_interaction where user_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id],
      event: `getGuestAllUsers`
    };

    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}

async function getSpaceDetailsById(logHandler, payload) {
  const query = `SELECT
                  domain_id, app_name, logo, workspace, default_manager_fugu_user_id,status, hrm_configuration,
                  workspace_name, workspace_id, attendance_token,scrum_token, hrm_api_key, fugu_secret_key as app_secret_key
                FROM workspace_details where workspace_id = ?`;

  let queryObj = {
    query: query,
    args: [payload.workspace_id],
    event: `getSpaceDetailsById`
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

function getBusinessDetails(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                   dc.id as domain_id,
                   wd.workspace_id,
                   wd.workspace_name,
                   wd.workspace,
                   wd.app_name,
                   wd.logo,
                   wd.fav_icon,
                   dc.domain,
                   dc.push_icon,
                   dc.android_app_link,
                   dc.android_latest_version,
                   dc.android_critical_version,
                   dc.ios_app_link,
                   dc.ios_latest_version,
                   dc.ios_critical_version
            FROM
                workspace_details wd
            JOIN domain_credentials dc ON
                wd.domain_id = dc.id
            WHERE wd.fugu_secret_key = ?`;

    let queryObj = {
      query: query,
      args: [opts.app_secret_key],
      event: "getBusinessDetails"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getScrumTokenByBusinessId(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT scrum_token  FROM workspace_details WHERE workspace_id = ? ORDER BY scrum_token  ` ;

    let queryObj = {
      query : query,
      args  : [payload.business_id],
      event : `getGuestAllUsers`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}

async function getUsersByUniqueKey(logHandler, opts) {
  const query = `SELECT
                 ud.full_name,
                 ud.user_id
                FROM user_to_workspace ud
                  JOIN workspace_details wd
                    ON wd.workspace_id = ud.workspace_id
                WHERE
                 wd.domain_id = ? AND ud.user_unique_key IN (?) AND ud.status IN ('ENABLED','INVITED')`;

  const queryObj = {
    query: query,
    args: [opts.domain_id, opts.user_unique_key],
    event: `getAllUsersByUniqueKey`
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

async function getWorkspaceDetailsWithDomain(logHandler, opts) {
  let values = [];
  let query = `SELECT
                 *
                FROM domain_credentials ud
                  JOIN workspace_details wd
                    ON wd.domain_id = ud.id
                WHERE 1 = 1 `;

    if(opts.workspace_id){
      query += ` AND wd.workspace_id = ?`;
      values.push(opts.workspace_id);
    }
    if(opts.workspace){
      query += ` AND wd.workspace = ?`;
      values.push(opts.workspace);
    }
    if(opts.domain){
      query += ` AND ud.domain = ?`;
      values.push(opts.domain);
    }
  const queryObj = {
    query: query,
    args: values,
    event: `getWorkspaceDetailsWithDomain`
  };

  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

async function getDomainCredentials(logHandler, opts) {
  let query = `SELECT
                   domain,
                   android_app_link,
                   android_latest_version,
                   android_critical_version,
                   ios_app_link,
                   ios_latest_version,
                   ios_critical_version,
                   properties
                    FROM
                      domain_credentials  
            WHERE 
                     id = ?`;
  let queryObj = {
    query: query,
    args: [opts.domain_id],
    event: "getDomainCredentials"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}


function getWorkspaceExpirationDays(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT datediff(trial_expire_on, date(now())) as days_left FROM billing_plans  WHERE workspace_id = ? AND trial_expire_on is not null` ;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "getWorkspaceExpirationDays"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateExpirationDays(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE billing_plans  set trial_expire_on = NULL WHERE workspace_id = ? `;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "updateExpirationDays"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getBillingDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
  let values = [];
  let query = `Select bt.id, bt.email,wd.workspace_name, bt.current_users, bt.expire_on, bt.amount from billing_transactions bt JOIN workspace_details wd on bt.workspace_id = wd.workspace_id  WHERE 1 = 1 `;
  if(payload.payment_intent_id){
    query += ` AND  payment_intent_id = ?`;
    values.push(payload.payment_intent_id);
  }
  if(payload.workspace_ids){
    query += ` AND bt.workspace_id IN (?)`;
    values.push(payload.workspace_ids);
  }
  if(payload.limit){
    query += ` ORDER BY ID DESC LIMIT 1`
  }
    let queryObj = {
      query: query,
      args: values,
      event: "getBillingDetails"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateTransaction(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE billing_transactions SET transaction_status = 1, invoice = ? WHERE payment_intent_id = ? `;
    let queryObj = {
      query: query,
      args: [payload.invoice, payload.payment_intent_id],
      event: "updateTransaction"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}




function getUserWorkspaceData(logHandler, payload){
  return new Promise((resolve, reject)=> {
    let values = [payload.workspace_id];
    let guestPlaceHolder;
    if (payload.guest_allowed) {
      guestPlaceHolder = ``;
    } else {
      guestPlaceHolder = `AND role != "GUEST" `;
    }
    let query = `SELECT
                user_unique_key as user_id,
                user_id as fugu_user_id,
                full_name,
                emails AS email,
                contact_number,
                coalesce(user_thumbnail_image,"") as user_image,
                user_thumbnail_image,
                status,
                role,
                created_at
              FROM            
                  user_to_workspace 
                  WHERE
                  workspace_id = ? ${guestPlaceHolder} `;

    if(payload.fugu_user_id){
      query += '  AND user_id = ?';
      values.push(payload.fugu_user_id);
    }
    if(payload.status) {
      query += ' AND status IN (?) ';
      values.push(payload.status);
    }
    if(payload.noBotUsers) {
     query += ' AND user_type NOT IN (0,3,4,5,7,8,9,10) ';
    }
    let queryObj = {
      query: query,
      args: values,
      event: "getUserWorkspaceData"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}


function getLoginDetails(logHandler, payload){
  return new Promise((resolve, reject)=> {
    let values = [];
    let query = `SELECT * FROM login_details WHERE 1 = 1 `;

    if(payload.contact_number){
       query += ` AND contact_number = ?`;
       values.push(payload.contact_number);
    }
    if(payload.email){
      query += ` AND email = ?`;
      values.push(payload.email);
    }
    if(payload.verify_status){
      query += ` AND is_verified = 0`;
    }
    if(payload.verify_time){
      query += ` AND created_at <= NOW() AND created_at >= DATE_SUB(NOW(),INTERVAL 60 MINUTE)`
    }
    if(payload.email_token){
      query += ` AND email_token = ?`;
      values.push(payload.email_token);
    }
    let queryObj = {
      query: query,
      args: values,
      event: "getLoginDetails"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}


function getWorkSpaceUserCount(logHandler, payload){
  return new Promise((resolve, reject)=> {
    let values = [payload.workspace_id];
    let guestPlaceHolder;
    if (payload.guest_allowed) {
      guestPlaceHolder = ``;
    } else {
      guestPlaceHolder = `AND role != "GUEST" `;
    }
    let query = `SELECT
                  count(*) AS user_count
              FROM            
                  user_to_workspace 
                  WHERE
                  workspace_id = ? ${guestPlaceHolder}`;

    if(payload.fugu_user_id){
      query += '  AND user_id = ?';
      values.push(payload.fugu_user_id);
    }
    if(payload.status) {
      query += ' AND status IN (?) ';
      values.push(payload.status);
    }
    if(payload.noBotUsers) {
     query += ' AND user_type NOT IN (0,3,4,5,7,8,9,10) ';
    }

    let queryObj = {
      query: query,
      args: values,
      event: "getUserWorkspaceData"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function insertMeetCount(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let query = `INSERT INTO meet_call_logs(domain, room_name) VALUES (?, ?)`;
     let queryObj = {
      query: query,
      args: [opts.domain, opts.room_name],
      event: "insertMeetCount"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
   })
}

function getMeetConferenceRoom(logHandler, room_name){
   return new Promise((resolve, reject) => {
     let query = `SELECT * FROM meet_call_logs WHERE room_name = ? AND DATE(created_at) = DATE(NOW())`;
     let queryObj = {
      query: query,
      args: [room_name],
      event: "getMeetRoom"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function insertLoginRequest(logHandler, opts){
    return new Promise((resolve, reject)=> {
      let query = `INSERT INTO login_details(email, contact_number, email_token) VALUES(?, ?, ?)`;

      let queryObj = {
        query: query,
        args: [opts.email, opts.contact_number, opts.email_token],
        event: "insertLoginRequest"
      };

      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    })
}

function updateLoginDetails(logHandler, opts){
   return new Promise((resolve ,reject)=> {
    let updateObj = {};

    opts.hasOwnProperty('sent_count')   ?    updateObj.sent_count  =     opts.sent_count   : 0;
    opts.hasOwnProperty('is_verified')  ?    updateObj.is_verified =     opts.is_verified  : 0;
    opts.email_token                    ?    updateObj.email_token =     opts.email_token  : 0;

    let query = `UPDATE login_details SET ? WHERE 1 = 1 `;

    let values = [updateObj];
    if(opts.contact_number){
      query += ` AND contact_number = ?`;
      values.push(opts.contact_number);
    }
    if(opts.email){
      query += ` AND email = ?`;
      values.push(opts.email);
    }
    if(opts.email_token){
      query += ` AND email_token = ?`;
      values.push(opts.email_token);
    }
    let queryObj = {
      query: query,
      args: values,
      event: "updateLoginDetails"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
   })
}

function insertWorkspacePropertyOnInstallApp(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `INSERT IGNORE INTO workspace_property(workspace_id, property, value) VALUES (?, ?, ?)`;
    let values = [opts.workspace_id, opts.property, opts.values];
    let queryObj = {
      query: sql,
      args : values,
      event: "insertWorkspacePropertyOnInstallApp"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function getNoOfInviteAllowed(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `SELECT * FROM workspace_invite_allowed WHERE workspace_id = ?`;
    let queryObj = {
      query: sql,
      args : opts.workspace_id,
      event: "getNoOfInviteAllowed"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function getActiveUserInWorkspace(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `SELECT * FROM user_to_workspace WHERE 1 `;
    let values = [];

    if(opts.workspace_id){
      sql += ` AND workspace_id = ?`;
      values.push(opts.workspace_id);
    }
    if(opts.status){
      sql += ` AND status IN('INVITED', 'ENABLED')`;
    }
    if(opts.userType){
      sql += ` AND user_type IN (?)`;
      values.push(opts.userType);
    }
    if(opts.user_unique_key){
      sql += ` AND user_unique_key = ?`;
      values.push(opts.user_unique_key);
    }
    let queryObj = {
      query: sql,
      args : values,
      event: "getActiveUserInWorkspace"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}

function insertUpdateWorkspaceInviteAllowed(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let sql = `INSERT INTO workspace_invite_allowed(workspace_id, invite_allowed) VALUES(?, ?) 
                ON DUPLICATE KEY UPDATE invite_allowed = invite_allowed + ?`;

    let queryObj = {
      query: sql,
      args : [opts.workspace_id, opts.invite_allowed, opts.invite_allowed],
      event: "insertUpdateWorkspaceInviteAllowed"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  })
}


function getOpenWorkspaceDetails(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let values = [opts.domain_id];
     let sql = `SELECT 
                  wp.workspace_id, 
                  wd.workspace, 
                  wd.workspace_name, 
                  wd.domain_id, 
                  wd.fugu_secret_key 
                FROM 
                  workspace_property wp 
                INNER JOIN
                  workspace_details wd
                ON
                  wd.workspace_id = wp.workspace_id
                WHERE
                  wd.domain_id = ? AND wp.property = 'enable_public_invite' AND wp.value = 1`;

     if(opts.joinedWorkspaceIds && opts.joinedWorkspaceIds.length) {
        sql += ` AND wd.workspace_id NOT IN (?)`;
        values.push(opts.joinedWorkspaceIds);
      }

      let queryObj = {
        query: sql,
        args : values,
        event: "getOpenWorkspaceDetails"
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
   })
}

function insertDefaultWorkspaceProperty(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = "INSERT INTO workspace_property(workspace_id, property, value) VALUES(?) ";

    let values = [];

    if (payload.workspace_id)
      values.push(payload.workspace_id);
    if (payload.property)
      values.push(payload.property);
    if (payload.value)
      values.push(payload.value)

    if (values.length < 3)
      return reject('Invalid arguments supplied');

    let queryObj = {
      query: query,
      args: [values],
      event: "Inserting default property for new workspace"
    };
    //console.log("insertDefaultWorkspaceProperty: ", queryObj)
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(payload);
    }, (error) => {
      reject(error);
    });
  });
}

function getWorkspacesOverriddenConfiguration(logHandler, domain) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM tb_domain_workspace_property WHERE domain_id IN (SELECT id FROM domain_credentials WHERE domain LIKE ?)`;
    let queryObj = {
      query: query,
      args: [domain],
      event: `getWorkspacesOverriddenConfiguration`
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}
