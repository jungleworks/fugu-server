
const Promise          = require('bluebird');
const _                = require('underscore');
const dbHandler        = require('../database').dbHandler;
const constants        = require('../Utils/constants');
const commonFunctions  = require('../Utils/commonFunctions');
const slaveDbHandler   = require('../database').slaveDbHandler;


exports.fuguBot                           = fuguBot;
exports.insertBotResult                   = insertBotResult;
exports.getUserRole                       = getUserRole;
exports.getApps                           = getApps;
exports.getTeamMembers                    = getTeamMembers;
exports.getPendingUserApprovalForLeave    = getPendingUserApprovalForLeave;
exports.getNewManagerId                   = getNewManagerId;
exports.updateManagerInAttendance         = updateManagerInAttendance;
exports.updateChangeManagerRequest        = updateChangeManagerRequest;
exports.updateAppState                    = updateAppState;
exports.insertOrUpdateApp                 = insertOrUpdateApp;
exports.getChannelsWithAttendanceBot      = getChannelsWithAttendanceBot;
exports.getBotInfo                        = getBotInfo;
exports.getChannelsWithFuguBot            = getChannelsWithFuguBot;
exports.insertWebhook                     = insertWebhook;
exports.insertToken                       = insertToken;
exports.getWebhooks                       = getWebhooks;
exports.editWebhook                       = editWebhook;
exports.getAttendanceUser                 = getAttendanceUser;
exports.getUserCreatedAt                  = getUserCreatedAt;
exports.fuguCronMessages                  = fuguCronMessages;
exports.insertMessageStatus               = insertMessageStatus;
exports.getWebhookDetails                 = getWebhookDetails;
exports.getAppState                       = getAppState;
exports.editApps                          = editApps;
exports.getFuguBotKeywords                = getFuguBotKeywords;
exports.getInviteMemberAuthority          = getInviteMemberAuthority;
exports.getFuguBotResponse                = getFuguBotResponse;
exports.updateUserManager                 = updateUserManager;
exports.getBusinessDetails                = getBusinessDetails;
exports.getAllMembers                     = getAllMembers;
exports.getChannelsWithAttendanceBotUser  = getChannelsWithAttendanceBotUser;
exports.getChannelsWithFuguBotUser        = getChannelsWithFuguBotUser;
exports.getBotInformation                 = getBotInformation;
exports.updateUserOnAttendance            = updateUserOnAttendance;
exports.insertMembersOnLeave              = insertMembersOnLeave;
exports.removeDismissedLeaves             = removeDismissedLeaves;
exports.deleteExpiredLeaves               = deleteExpiredLeaves;
exports.insertBulkMembersOnLeave          = insertBulkMembersOnLeave;
exports.getChannelsWithScrumBot           = getChannelsWithScrumBot;
exports.getMessageByChannelId             = getMessageByChannelId;
exports.getScrumBotUser                   = getScrumBotUser;
exports.getAllChannelsWithFugueBotUser    = getAllChannelsWithFugueBotUser;
exports.getChannelsWithVideoConferenceBot = getChannelsWithVideoConferenceBot;
exports.getChannelsWithSelfBot            = getChannelsWithSelfBot;
exports.getWorkspace                      = getWorkspace;
exports.deleteWorkspace                   = deleteWorkspace;
exports.updateUserOnScrum                 = updateUserOnScrum;
exports.insertFuguAppMessages             = insertFuguAppMessages;
exports.getAttendanceUserInfo             = getAttendanceUserInfo;
exports.getUserPunchInStatus              = getUserPunchInStatus;
exports.getBotChannelId         = getBotChannelId;
exports.getAttendanceBotIdFromUserId      = getAttendanceBotIdFromUserId;
exports.getHrForAttendanceBot             = getHrForAttendanceBot;
exports.checkUserAttendanceFromUserId     = checkUserAttendanceFromUserId;


function getMessageByChannelId(logHandler , payload ){
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM users_conversation  WHERE channel_id IN (?) AND user_id IN (?) ORDER BY id  DESC `;
    let queryObj = {
      query : sql,
      args  : [payload.channel_id , payload.bot_id],
      event : "getChannelsWithAttendanceBot"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getScrumBotUser(logHandler, opts) {
  return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM (
                   SELECT
                   utc.user_id,
                   utc.channel_id,
                   GROUP_CONCAT(ub.full_name) bot,
                   GROUP_CONCAT(ub.user_id) bot_id,
                   uh.full_name human,
                   uh.user_id human_id,
                   uh.business_id
                   FROM 
                   user_to_channel utc
                   LEFT JOIN 
                   channels c ON utc.channel_id = c.channel_id
                   LEFT JOIN 
                   users ub ON ub.user_id = utc.user_id AND ub.user_type = 7
                   LEFT JOIN 
                   users uh ON uh.user_id = utc.user_id AND uh.user_type = 1
                   WHERE 
                   c.chat_type = 7 
                   GROUP BY c.channel_id
                   ) a
                   WHERE bot IS NOT NULL AND human_id IN (?)`;
    let queryObj = {
      query : sql,
      args  : [opts.usersId],
      event : "getAttendanceUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}




function getBotInformation(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT
        b.user_id,
        b.business_id,
        metric,
        s.full_name,
        d.bot_token,
        u.channel_id
      FROM
        bots_metrics b
      JOIN user_to_channel u ON b.user_id = u.user_id
      JOIN users s ON b.user_id = s.user_id
      JOIN business_details d ON b.business_id = d.business_id
      WHERE
        b.metric = ? AND
        d.bot_token = ?
    `;
    let queryObj = {
      query : sql,
      args  : [opts.metric, opts.bot_token],
      event : "getBotInformation"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



async function insertMessageStatus(logHandler, opts) {
  let sql = `update user_to_workspace set message_journey_status = message_journey_status +1 where user_id  IN (?)`;
  let queryObj = {
    query: sql,
    args: [opts.user_id],
    event: "get response"
  };
  return dbHandler.executeQuery(logHandler, queryObj)
}
function fuguBot(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `select ${payload.metric} from fugu_bot where fugu_user_id = ? and workspace_id = ?`;

    let queryObj = {
      query: query,
      args: [payload.fugu_user_id, payload.workspace_id],
      event: "fuguBot"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBotResult(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO fugu_bot_search (user_id, full_name, searched_content, result) VALUES (?,?,?,?)`;

    let queryObj = {
      query: query,
      args: [payload.user_id, payload.full_name, payload.searched_content, payload.result],
      event: "insertBotResult"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
function getUserRole(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                  ud.role
                FROM
                  user_to_workspace ud
                WHERE
                  ud.status = 'ENABLED' AND ud.user_id = ? 
                  AND ud.workspace_id = ?`;
    let queryObj = {
      query: query,
      args: [payload.user_id, payload.workspace_id],
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}
function getApps(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [opts.workspace_id];
    if (opts.app_id) {
      placeHolder = ` AND a.id = ?`
      values.push(opts.app_id);
    }

    if (opts.is_user) {
      placeHolder += ` AND a.type = "WEBHOOK"`
    }

    let sql = `SELECT
                bip.id,
                a.id AS app_id,
                a.name,
                a.description,
                a.bot_user_id,
                a.page_url,
                a.icon,
                a.type,
                a.tag_line,
                a.categories,
                a.bot_user_type,
                bip.status,
                bip.app_state,
                bip.workspace_id,
                wd.hrm_api_key
            FROM
                apps a
            LEFT JOIN business_installed_apps bip ON
                a.id = bip.app_id AND bip.workspace_id = ?
            LEFT JOIN workspace_details wd ON wd.workspace_id = bip.workspace_id    
                WHERE 1=1 AND a.is_deleted = 0 and a.type != 'CUSTOM' ${placeHolder}`;
    let queryObj = {
      query: sql,
      args: values,
      event: "getApps"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getTeamMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values = [];
    if (payload.manager_fugu_user_id) {
      placeHolder = " AND ud.manager_fugu_user_id = ?";
      values.push(payload.manager_fugu_user_id);
    } else if (payload.role) {
      placeHolder = " AND ud.role = ? AND ud.workspace_id = ?";
      values.push(payload.role, payload.workspace_id);
    } else if (payload.user_id) {
      placeHolder = " AND ud.user_id = ?";
      values.push(payload.user_id);
    } else {
      placeHolder = '< (SELECT COUNT(id) as count FROM message_journey) '
    }
    let query = `SELECT
                    ud.user_unique_key as user_id,
                    ud.user_id as fugu_user_id,
                    ud.full_name,
                    u.email,
                    ud.contact_number,
                    ud.user_image,
                    ud.user_thumbnail_image,
                    ud.status,
                    ud.manager_fugu_user_id,
                    ud.role
                FROM
                   user_to_workspace ud
                LEFT JOIN users u ON
                    ud.user_unique_key = u.user_id
                WHERE
                ud.status = 'ENABLED' ${placeHolder} `;
    let queryObj = {
      query: query,
      args: values,
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}

async function fuguCronMessages(logHandler, opts) {
  let sql = ` SELECT message_journey.id , time_period , fugu_bot_responses.response , message_journey.role ,message_journey FROM message_journey 
    LEFT JOIN fugu_bot_responses on message_journey.message_journey= fugu_bot_responses.id `;
  let queryObj = {
    query: sql,
    args: [],
    event: "get response"
  };

  return dbHandler.executeQuery(logHandler, queryObj)
}
async function getPendingUserApprovalForLeave(logHandler, opts) {
  let sql = `SELECT json_extract(message, "$.custom_actions[0].title") as title, json_extract(message, "$.custom_actions[0].leave_id") as leave_id FROM users_conversation WHERE workspace_id = ? and channel_id = ? and message_type = ? AND json_extract(message, "$.custom_actions[0].leave_id") IN (?) AND json_extract(message, "$.custom_actions[0].confirmation_type") = ?`;
  let queryObj = {
    query: sql,
    args: [opts.workspace_id, opts.channel_id, constants.messageType.BUTTON, opts.leave_id, constants.leaveState.USER_LEAVE_CONFIRMATION],
    event: "getPendingUserApprovalForLeave"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
};

async function getNewManagerId(logHandler, opts) {
  let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;

  let sql = `SELECT * FROM ${databaseName}.change_manager_request cmr JOIN ${databaseName}.users u on  cmr.new_manager_user_id = u.user_id WHERE id = ?`;
  let queryObj = {
    query: sql,
    args: [opts.id],
    event: "getNewManagerId"
  };

  return dbHandler.executeQuery(logHandler, queryObj)
}

async function updateManagerInAttendance(logHandler, opts) {
  let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;

  let sql = `UPDATE 
          ${databaseName}.change_manager_request cmr 
          JOIN ${databaseName}.users u ON 
          cmr.user_id = u.user_id 
          SET 
          cmr.status = "APPROVED" , u.manager_user_id = cmr.new_manager_user_id 
          WHERE cmr.id = ?`;
  let queryObj = {
    query: sql,
    args: [opts.id],
    event: "updateManagerInAttendance"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function updateChangeManagerRequest(logHandler, opts) {
  let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
  let sql = `UPDATE ${databaseName}.change_manager_request set status = "REJECTED" WHERE id = ?`;
  let queryObj = {
    query: sql,
    args: [opts.id],
    event: "updateChangeManagerRequest"
  };

  return dbHandler.executeQuery(logHandler, queryObj)
}

async function getChannelsWithAttendanceBotUser(logHandler, opts) {
  let placeHolder = ``;
  let values = [];

  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.usersId, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 4 ${placeHolder} AND c.chat_type = 7
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       uw.user_id IN(?) ${placeHolder}  AND uw.user_type IN (1,6) AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getChannelsWithAttendanceBotUser"
  };
 return dbHandler.executeQuery(logHandler, queryObj);
}

async function updateAppState(logHandler, payload) {
  let query = ` Update business_installed_apps set app_state = ?, status = ? where workspace_id = ? and app_id = ? `;

  let queryObj = {
    query: query,
    args: [payload.app_state, payload.status, payload.workspace_id, payload.app_id],
    event: "updateAppState"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}


async function insertOrUpdateApp(logHandler, opts) {
  let sql = `INSERT INTO business_installed_apps (workspace_id, app_id, app_state) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status = ?`;
  let queryObj = {
    query: sql,
    args: [opts.workspace_id, opts.app_id, opts.app_state || constants.appState.ACTIVE, opts.status],
    event: "insertOrUpdateApp"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getChannelsWithAttendanceBot(logHandler, userIds) {
  let sql = `SELECT * FROM (
      SELECT
      utc.user_id,
      utc.channel_id,
      GROUP_CONCAT(ub.full_name) bot,
      GROUP_CONCAT(ub.user_id) bot_id,
      uh.full_name human,
      uh.user_id human_id
      FROM 
      user_to_channel utc
      LEFT JOIN 
      channels c ON utc.channel_id = c.channel_id
      LEFT JOIN 
      user_to_workspace ub ON ub.user_id = utc.user_id AND ub.user_type = 4
      LEFT JOIN 
      user_to_workspace uh ON uh.user_id = utc.user_id AND uh.user_type = 1
      WHERE 
      c.chat_type = 7 
      GROUP BY c.channel_id
      ) a
      WHERE bot IS NOT NULL AND human_id IN (?)`;
  let queryObj = {
    query: sql,
    args: [userIds],
    event: "getChannelsWithAttendanceBot"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getBotInfo(logHandler, opts) {
  let sql = ` SELECT * FROM user_to_workspace WHERE user_type = ? AND workspace_id = ? `;
  let params = [opts.user_type, opts.workspace_id];

  if (opts.email){
    sql += ` AND emails = ?`
    params.push(opts.email)
  }

  let queryObj = {
    query: sql,
    args : params,
    event: "getBotInfo"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function insertWebhook(logHandler, opts) {
  let sql = `INSERT INTO webhooks (user_id, channel_id, installed_app_id, webhook_link, created_by_user_id, hash) VALUES (?,?,?,?,?,?)`;
  let queryObj = {
    query: sql,
    args: [opts.user_id, opts.channel_id, opts.installed_app_id, opts.webhook_link, opts.created_by_user_id, opts.hash],
    event: "insertWebhook"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function insertToken(logHandler, opts) {
  const sql = ' UPDATE webhooks  SET token = ? , model_id = ? ,webhook_id = ?  WHERE installed_app_id =  ?';
  const queryObj = {
    query: sql,
    args: [opts.token, opts.idModel, opts.id, opts.installed_app_id],
    event: 'insertToken'
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getWebhooks(logHandler, opts) {
  let placeHolder = '';
  const values = [opts.workspace_id];

  if (opts.user_id) {
    placeHolder = ' AND w.user_id = ?';
    values.push(opts.user_id);
  } else if (opts.webhook_id) {
    placeHolder = ' AND w.id = ?';
    values.push(opts.webhook_id);
  } else {
    placeHolder = ' AND bip.app_id = ? ';
    values.push(opts.app_id, opts.created_by_user_id);
  }

  if (opts.user_role) {
    placeHolder += ' AND uh.user_id = ? ';
    values.push(opts.created_by_user_id);
  }

  const sql = `SELECT
              w.id as webhook_id,
              bip.app_id,
              w.channel_id,
              w.webhook_link,
              w.status as webhook_status,
              w.model_id,
              w.token, 
              bip.status as app_status,
              COALESCE(c.custom_label, '') AS label,
              c.channel_id,
              u.full_name
          FROM
              webhooks w
          JOIN business_installed_apps bip ON
              w.installed_app_id = bip.id
          JOIN channels c on
          w.channel_id = c.channel_id
          JOIN user_to_workspace u ON
          w.user_id = u.user_id
          JOIN user_to_workspace uh ON 
          w.created_by_user_id = uh.user_id
          WHERE
          bip.workspace_id = ? AND w.status !=2  ${placeHolder}`;
  const queryObj = {
    query: sql,
    args: values,
    event: 'getWebhooks'
  };
  return slaveDbHandler.executeQuery(logHandler, queryObj)
}

async function editWebhook(logHandler, opts, webhook_id) {
  let placeHolder = '';
  let values = [];
  if (opts.webhook_status || opts.webhook_status == '0') {
    placeHolder = ' w.status = ? ';
    values = [opts.webhook_status]
  }

  if (opts.full_name) {
    placeHolder ? placeHolder += "," : 0
    placeHolder += ` u.full_name = ?`;
    values.push(opts.full_name);
  }

  if (opts.channel_id) {
    placeHolder ? placeHolder += "," : 0
    placeHolder += ` w.channel_id = ? `
    values.push(opts.channel_id);
  }

  if (_.isEmpty(values)) {
    throw new Error("Nothing to update.")
  }
  values.push(webhook_id);
  let sql = `UPDATE webhooks w JOIN user_to_workspace u ON w.user_id = u.user_id SET ${placeHolder} WHERE w.id = ?`;
  let queryObj = {
    query: sql,
    args: values,
    event: "editWebhook"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getChannelsWithFuguBot(logHandler, opts) {
  let placeHolder = '';
  let count_placeHolder = '';
  let user_id_placeholder = '';
  if (opts.workspace_id) {
    placeHolder = ' AND c.workspace_id = ? ';
    user_id_placeholder = 'AND human_id IN (?)';
    if (opts.broadcast_user_type) {
      (opts.broadcast_user_type == constants.broadcast_user_type.EXCEPT) ? user_id_placeholder = 'AND human_id NOT IN (?)' : '';
    }
  }
  if (opts.status) {
    count_placeHolder = `AND uh.message_journey_status < (SELECT COUNT(id) as count FROM message_journey) `
  }
  let sql = `SELECT * FROM ( 
                  SELECT 
                  utc.user_id, 
                  utc.channel_id, 
                  GROUP_CONCAT(ub.full_name) bot, 
                  GROUP_CONCAT(ub.user_id) bot_id, 
                  uh.status,
                  uh.full_name human, 
                  uh.user_id human_id ,
                  uh.workspace_id ,
                  uh.message_journey_status
                  FROM 
                  user_to_channel utc 
                  LEFT JOIN 
                  channels c ON utc.channel_id = c.channel_id 
                  LEFT JOIN 
                  user_to_workspace ub ON ub.user_id = utc.user_id AND ub.user_type = 3 
                  LEFT JOIN 
                  user_to_workspace uh ON uh.user_id = utc.user_id AND uh.user_type = 1 ${count_placeHolder}
                  WHERE 
                  c.chat_type = 7 
                  ${placeHolder}
                  GROUP BY c.channel_id 
                  ) a 
                  WHERE bot IS NOT NULL and status = 1 ${user_id_placeholder} `;
  let queryObj = {
    query: sql,
    args: [opts.workspace_id, opts.user_ids],
    event: "getChannelsWithFuguBot"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}


async function getChannelsWithFuguBotUser(logHandler, opts) {
  let placeHolder = '';
  let count_placeHolder = '';
  let user_id_placeholder = '';
  let values = [];
  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ? ';
    user_id_placeholder = 'AND user_id IN (?)';
    values = [opts.workspace_id, opts.workspace_id, opts.user_ids]
    if (opts.broadcast_user_type) {
      (opts.broadcast_user_type == constants.broadcast_user_type.EXCEPT) ? user_id_placeholder = 'AND user_id NOT IN (?)' : '';
    }
  }
  if (opts.status) {
    count_placeHolder = `AND uw.message_journey_status < (SELECT COUNT(id) as count FROM message_journey) AND uw.user_id IN (${opts.user_ids})`
  }
  let sql = `SELECT * FROM 
  ( SELECT 
  user_id as bot_id, 
  channel_id 
  FROM 
  user_to_workspace uw 
  JOIN 
  user_to_channel uc 
  USING(user_id) 
  JOIN 
  channels c 
  USING(channel_id) 
  WHERE 
  uw.user_type = 3 
  ${placeHolder} 
  AND c.chat_type = 7 
  ) a JOIN 
  ( 
  SELECT 
  user_id, 
  channel_id, 
  user_type, 
  full_name,
  message_journey_status
  FROM 
  user_to_workspace uw 
  JOIN 
  user_to_channel uc 
  USING(user_id) 
  JOIN 
  channels c 
  USING(channel_id) 
  
  WHERE 
  uw.user_type = 1 
  ${placeHolder} ${count_placeHolder}
  AND c.chat_type = 7  ${user_id_placeholder}
  
  ) b 
  USING(channel_id) 
  WHERE user_type = 1 
  `;
  let queryObj = {
    query: sql,
    args: values,
    event: "getChannelsWithFuguBotUser"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}
/**
 *
  let placeHolder = ``;
  let values = [];

  if(opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.usersId, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 3 ${placeHolder} AND c.chat_type = 7 ${count_placeHolder}
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       ${user_id_placeholder} ${placeHolder}  AND uw.user_type = 1 AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type = 1
 */
async function getUserCreatedAt(logHandler, opts) {
  let sql = `SELECT 
  u.user_id, 
  u.created_at,
  u.role,
  wd.app_name,
  wd.domain_id
  FROM user_to_workspace u 
  JOIN
   workspace_details wd 
   on u.workspace_id = wd.workspace_id AND  wd.status = "ENABLED"
   WHERE date(u.created_at) = date(now()) AND user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: [],
    event: "getUserCreatedAt"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getAttendanceUser(logHandler, opts) {
  let placeHolder = ``;
  let timeplaceHolder = ``;
  let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;

  if (!opts.clock_out) {
    placeHolder = "NOT"
    timeplaceHolder = ` AND u.shift_start_time BETWEEN ? AND ?`;
  } else {
    timeplaceHolder = ` AND u.shift_end_time BETWEEN ? AND ?`
  }

  let sql = `SELECT * FROM (
                   SELECT
                   utc.user_id,
                   utc.channel_id,
                   GROUP_CONCAT(ub.full_name) bot,
                   GROUP_CONCAT(ub.user_id) bot_id,
                   uh.full_name human,
                   uh.user_id human_id
                   FROM 
                   user_to_channel utc
                   LEFT JOIN 
                   channels c ON utc.channel_id = c.channel_id
                   LEFT JOIN 
                   user_to_workspace ub ON ub.user_id = utc.user_id AND ub.user_type = 4
                   LEFT JOIN 
                   user_to_workspace uh ON uh.user_id = utc.user_id AND uh.user_type = 1
                   WHERE 
                   c.chat_type = 7 AND
                   c.workspace_id = ?
                   GROUP BY c.channel_id
                   ) a
                   WHERE bot IS NOT NULL AND human_id IN (SELECT
                   SUBSTRING_INDEX(u.user_name, "fugu", -1) AS user_id
                   FROM
                   ${databaseName}.user_attendance ua
                   JOIN ${databaseName}.users u ON
                   ua.user_id = u.user_id
                   INNER JOIN(
                   SELECT
                   user_id,
                   MAX(created_at) AS max_date_time
                   FROM
                   ${databaseName}.user_attendance
                   GROUP BY
                   user_id
                   ) latest_time
                   ON
                   ua.user_id = latest_time.user_id AND ua.created_at = latest_time.max_date_time
                   WHERE u.status = 1 AND
                   ua.clocked_out IS ${placeHolder} NULL AND u.business_id = ?  ${timeplaceHolder}
                   GROUP BY
                   u.user_name)`;
  let queryObj = {
    query: sql,
    args: [opts.business_id, opts.attendance_business_id, opts.start_time_interval, opts.end_time_interval],
    event: "getAttendanceUser"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getWebhookDetails(logHandler, opts) {
  let sql = `SELECT
              w.id as webhook_id,
              bip.app_id,
              w.user_id,
              w.channel_id,
              w.webhook_link,
              w.status as webhook_status,
              w.model_id,
              w.token, 
              bip.status as app_status,
              COALESCE(c.custom_label, '') AS label,
              c.channel_id,
              u.full_name,
              b.fugu_secret_key
          FROM
              webhooks w
          JOIN business_installed_apps bip ON
              w.installed_app_id = bip.id
          JOIN channels c on
          w.channel_id = c.channel_id
          JOIN user_to_workspace u ON
          w.user_id = u.user_id
          JOIN user_to_workspace uh ON 
          w.created_by_user_id = uh.user_id
          JOIN workspace_details b ON
          bip.workspace_id = b.workspace_id
          WHERE
          w.hash = ? AND w.status !=2 `;
  let queryObj = {
    query: sql,
    args: [opts.hash],
    event: "getWebhooks"
  };

  return dbHandler.executeQuery(logHandler, queryObj);
}


function getAppState(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [];
    let sql = `SELECT id, workspace_id, app_state, app_id, status, datediff(now(), created_at) as days FROM business_installed_apps WHERE  1 `;
    if(opts.workspace_id){
     sql +=  ` AND workspace_id = ?`
     values.push(opts.workspace_id);
    }
    if(opts.app_id){
      sql += `  AND app_id = ?`;
      values.push(opts.app_id);
    }
    if(opts.workspace_ids){
      sql += ` AND workspace_id IN (?)`;
      values.push(opts.workspace_ids);
    }
    if(opts.status){
      sql += ` AND status = 1`;
    }
    let queryObj = {
      query: sql,
      args: values,
      event: "getAppState"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function editApps(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let placeHolder = ``;
    let values;
    if (opts.app_state) {
      placeHolder = ` app_state = ? , status = ?`;
      values = [opts.app_state, opts.status, opts.workspace_id, opts.app_id];
    } else {
      placeHolder = ` status = ? `;
      values = [opts.status, opts.workspace_id, opts.app_id]
    }
    let sql = `UPDATE business_installed_apps SET  ${placeHolder} where workspace_id = ? AND app_id = ?`;
    let queryObj = {
      query: sql,
      args: values,
      event: "editApps"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
};

function getFuguBotKeywords(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT keyword FROM fugu_keywords WHERE keyword IN (?) `;
    let queryObj = {
      query: query,
      args: [payload.message_array],
      event: "fuguBot"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getInviteMemberAuthority(logHandler, payload) {
  return new Promise((resolve, reject) => {

    let query = ` SELECT property,value FROM workspace_property WHERE workspace_id = ? AND property = "any_user_can_invite" `;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: "fuguBot"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
};

function getFuguBotResponse(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `  SELECT * FROM  fugu_bot_responses  WHERE  JSON_CONTAINS(keywords,  ? )   `;
    let queryObj = {
      query: query,
      args: [payload.message_array],
      event: "fuguBot"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
};

function updateUserManager(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `UPDATE user_to_workspace SET manager = ?, manager_fugu_user_id = ? where user_id = ?`;
    let queryObj = {
      query: sql,
      args: [opts.full_name, opts.manager_fugu_user_id, opts.user_id],
      event: "updateUserManager"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
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
                   dc.full_domain,
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
};

function getAllMembers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
    ud.full_name,
    CONCAT("fugu", ud.user_id) AS user_name,
    u.email,
    CONCAT("fugu", ud.manager_fugu_user_id) AS manager_user_name,
    ud.role
FROM
    user_to_workspace ud
LEFT JOIN users u ON
    ud.user_unique_key = u.user_id
WHERE
    ud.status = 'ENABLED' AND ud.workspace_id = ? AND u.user_id NOT IN(
        "im4fcyak5",
        "im4EinKp13",
        "iqfdwcyak5",
        "im4EinKp23"
    ) `;
    let queryObj = {
      query: query,
      args: [payload.workspace_id],
      event: `get all members`
    };
    dbHandler.executeQuery(logHandler, queryObj).then(result => resolve(result), (error) => {
      reject(error);
    });
  });
}


function updateUserOnAttendance(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;

    let updateObj = {};
    opts.status ? updateObj.status = constants.getFuguUserStatus[opts.status] : 0;
    opts.full_name ? updateObj.full_name = opts.full_name : 0;
    let values = [updateObj, 'fugu' + opts.fugu_user_id];
    let sql = `UPDATE ${databaseName}.users set ? where user_name = ? `;
    let queryObj = {
      query: sql,
      args: values,
      event: "updateUserOnAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertMembersOnLeave(logHandler,opts){
  return new Promise((resolve, reject) => {

    let sql = `INSERT INTO user_present_day_status ( leave_id , fugu_user_id , start_date , days , leave_type ) VALUES ( ? , ? , ? , ? , ? ) `;

    let queryObj = {
      query: sql,
      args: [ opts.id , opts.user_id , opts.start_date , opts.days , opts.leave_type ],
      event: "updateUserOnAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertBulkMembersOnLeave(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values = [];
    let placeHolders = new Array(opts.length).fill("(?,?,?,?,?)").join(', ');
    for (let data of opts) {
      values = values.concat([data.id, data.user_id, data.start_date, data.days, data.leave_type]);
    }

    let sql = `INSERT INTO user_present_day_status ( leave_id , fugu_user_id , start_date , days , leave_type ) VALUES  ${placeHolders}`;

    let queryObj = {
      query: sql,
      args: values,
      event: "updateUserOnAttendance"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}



function removeDismissedLeaves(logHandler,opts){
  return new Promise((resolve, reject) => {

    let sql = `DELETE FROM user_present_day_status WHERE  leave_id = ?`;

    let queryObj = {
      query: sql,
      args: [ opts.id ],
      event: "updateUserOnAttendance"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function deleteExpiredLeaves(logHandler,opts){
  return new Promise((resolve, reject) => {

    let sql = `DELETE FROM user_present_day_status WHERE  DATE(NOW()) > DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1`;

    let queryObj = {
      query: sql,
      args: [ opts.id ],
      event: "updateUserOnAttendance"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getChannelsWithScrumBot(logHandler, opts) {
  let placeHolder = ``;
  let values = [];

  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.usersId, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 7 ${placeHolder} AND c.chat_type = 7
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       uw.user_id IN(?) ${placeHolder}  AND uw.user_type IN (1,6) AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getChannelsWithAttendanceBotUser"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getAllChannelsWithFugueBotUser(logHandler, opts) {
  let placeHolder = ``;
  let values = [];

  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.usersId, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 3 ${placeHolder} AND c.chat_type = 7
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       uw.user_id IN(?) ${placeHolder}  AND uw.user_type IN (1,6) AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getAllChannelsWithFugueBotUser"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getChannelsWithVideoConferenceBot(logHandler, opts) {
  let placeHolder = ``;
  let values = [];

  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.user_ids, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 9 ${placeHolder} AND c.chat_type = 7
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       uw.user_id IN(?) ${placeHolder}  AND uw.user_type IN (1,6) AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getChannelsWithVideoConferenceBot"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getChannelsWithSelfBot(logHandler, opts) {
  let placeHolder = ``;
  let values = [];

  if (opts.workspace_id) {
    placeHolder = ' AND uw.workspace_id = ?';
    values = [opts.workspace_id, opts.user_ids, opts.workspace_id];
  } else {
    values = [opts.usersId];
  }

  let sql = `SELECT
    *
FROM
    (
    SELECT
        user_id AS bot_id,
        channel_id
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
        uw.user_type = 10 ${placeHolder} AND c.chat_type = 7
) a
JOIN(
    SELECT user_id,
        channel_id,
        user_type,
        full_name
    FROM
        user_to_workspace uw
    JOIN user_to_channel uc USING(user_id)
    JOIN channels c USING(channel_id)
    WHERE
       uw.user_id IN(?) ${placeHolder}  AND uw.user_type IN (1,6) AND c.chat_type = 7) b USING(channel_id)
    WHERE
        user_type IN (1,6)`;
  let queryObj = {
    query: sql,
    args: values,
    event: "getChannelsWithSelfBot"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function getWorkspace(logHandler) {
  let sql = `SELECT * FROM self_bot LIMIT 1`;
  let queryObj = {
    query: sql,
    args: [],
    event: "getWorkspace"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

async function deleteWorkspace(logHandler, opts) {
  let sql = `DELETE  FROM self_bot WHERE workspace_id = ?`;
  let queryObj = {
    query: sql,
    args: [opts.workspace_id],
    event: "deleteWorkspace"
  };
  return dbHandler.executeQuery(logHandler, queryObj);
}

function updateUserOnScrum(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let databaseName = commonFunctions.isEnv("test") ? `scrum_bot` : `scrum_prod`;

    let updateObj = {};
    opts.status ? updateObj.status = constants.getFuguUserStatus[opts.status] : 0;
    opts.full_name ? updateObj.full_name = opts.full_name : 0;
    let values = [updateObj, opts.fugu_user_id];
    let sql = `UPDATE ${databaseName}.users set ? where user_id = ? `;
    let queryObj = {
      query: sql,
      args: values,
      event: "updateUserOnScrum"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertFuguAppMessages(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let sql = `INSERT INTO secret_santa_messages (user_id,workspace_id, message) VALUES (?,?, ?)`;
    let queryObj = {
      query: sql,
      args: [opts.user_id, opts.workspace_id, opts.message],
      event: "insertFuguAppMessages"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getAttendanceUserInfo(logHandler, opts) {
  let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;

  let sql = `SELECT * FROM ${databaseName}.users WHERE user_name = ?`;
  let queryObj = {
    query: sql,
    args: [opts.user_name],
    event: "getAttendanceUserInfo"
  };

  return dbHandler.executeQuery(logHandler, queryObj)
}

function getUserPunchInStatus(logHandler, opts){
  return new Promise((resolve, reject)=> {
     let username = 'fugu' + opts.user_id;
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let sql = `SELECT
                ua.created_at AS punch_in_time,
                ulr.leave_type_id,
                blp.is_clock_in_allowed,
                u.shift_start_time,
                ulr.leave_phase,
                u.work_days,
                u.manager_user_id,
                u.status
              FROM
                ${databaseName}.users u
                LEFT JOIN ${databaseName}.user_attendance ua 
              ON
                u.user_id = ua.user_id AND DATE(ua.created_at + INTERVAL u.time_zone MINUTE) = DATE(NOW() + INTERVAL u.time_zone MINUTE)
                LEFT JOIN ${databaseName}.user_leave_requests ulr 
              ON
                ulr.user_id = u.user_id AND ulr.status = 'APPROVED' AND DATE(NOW() + INTERVAL u.time_zone MINUTE) >= DATE(ulr.start_date + INTERVAL u.time_zone MINUTE) 
                AND (CASE WHEN ulr.days = 0.5 THEN DATE(NOW() + INTERVAL u.time_zone MINUTE) <= DATE(TIMESTAMPADD( MINUTE, 330, TIMESTAMPADD(DAY, ulr.days, ulr.start_date))) 
                ELSE DATE(NOW() + INTERVAL u.time_zone MINUTE) < DATE(TIMESTAMPADD( MINUTE, 330, TIMESTAMPADD(DAY, ulr.days, ulr.start_date))) END)
                LEFT JOIN ${databaseName}.business_leave_properties blp 
              ON
                blp.id = ulr.leave_type_id
              WHERE
                u.user_name = ?
              UNION
              SELECT
                ua.created_at AS punch_in_time,
                ulr.leave_type_id,
                blp.is_clock_in_allowed,
                u.shift_start_time,
                ulr.leave_phase,
                u.work_days,
                u.manager_user_id,
                u.status
                FROM
                ${databaseName}.users u
                LEFT JOIN ${databaseName}.user_attendance ua 
              ON
                u.user_id = ua.user_id AND DATE(ua.created_at + INTERVAL u.time_zone MINUTE) = DATE(NOW() + INTERVAL u.time_zone MINUTE)
                RIGHT JOIN ${databaseName}.user_leave_requests ulr
              ON
                ulr.user_id = u.user_id AND ulr.status = 'APPROVED' AND DATE(NOW() + INTERVAL u.time_zone MINUTE) >= DATE(ulr.start_date + INTERVAL u.time_zone MINUTE) 
                AND (CASE WHEN ulr.days = 0.5 THEN DATE(NOW() + INTERVAL u.time_zone MINUTE) <= DATE(TIMESTAMPADD( MINUTE, 330, TIMESTAMPADD(DAY, ulr.days, ulr.start_date))) 
                ELSE DATE(NOW() + INTERVAL u.time_zone MINUTE) < DATE(TIMESTAMPADD( MINUTE, 330, TIMESTAMPADD(DAY, ulr.days, ulr.start_date))) END)
                LEFT JOIN ${databaseName}.business_leave_properties blp 
              ON
                blp.id = ulr.leave_type_id
              WHERE
                u.user_name = ?`;
     let queryObj = {
      query: sql,
      args : [username, username],
      event: "getAttendanceUserInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result)=> {
      return resolve(result);
    }).catch((error)=> {
       return resolve();
    })
  })
}

function getBotChannelId(logHandler, opts){
  return new Promise((resolve, reject)=> {
    let values = [];
    let sql = `SELECT utc.channel_id,ut.user_id AS bot_id, utc.user_id as human_id FROM user_to_channel ut JOIN user_to_channel utc 
                ON ut.channel_id = utc.channel_id WHERE 1 = 1`;

      if(opts.attendance_user_id){
        sql += ` AND ut.user_id = ?`;
        values.push(opts.attendance_user_id);
      }
      if(opts.bot_ids){
        sql += ` AND ut.user_id IN (?)`;
        values.push(opts.bot_ids);
      }
      if(opts.user_id){
        sql += ' AND utc.user_id = ? ';
        values.push(opts.user_id);
      }
      if(opts.user_ids){
        sql += ' AND utc.user_id IN (?)';
        values.push(opts.user_ids)
      }

      let queryObj = {
        query: sql,
        args : values,
        event: "getBotChannelId"
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result)=> {
        return resolve(result);
      }).catch((error)=> {
         return resolve();
      })
  })
}

function getAttendanceBotIdFromUserId(logHandler, user_id){
  return new Promise((resolve, reject)=> {
    let query = `SELECT user_id AS attendance_bot_id FROM user_to_workspace where workspace_id  = 
                 (SELECT workspace_id FROM user_to_workspace WHERE user_id = ?) and user_type = 4`;
    let queryObj = {
      query: query,
      args : [user_id],
      event: "getAttendanceBotIdFromUserId"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result)=> {
      return resolve(result[0]);
    }).catch((error)=> {
       return reject(error);
    })
  })
}

function getHrForAttendanceBot(logHandler, opts){
   return new Promise((resolve, reject)=> {
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let query = `SELECT SUBSTR(u.user_name, 5) AS user_id, u.full_name, u.email FROM ${databaseName}.users u INNER JOIN ${databaseName}.business b ON u.business_id = b.business_id WHERE
                  u.role = ? AND b.business_token = ? AND b.business_name = ? ;
                  `
      let queryObj = {
        query: query,
        args : [opts.role, opts.business_token, opts.workspace_name],
        event: "getHrForAttendanceBot"
      };
      dbHandler.executeQuery(logHandler, queryObj).then((result)=> {
        return resolve(result);
      }).catch((error)=> {
         return reject(error);
      })
   })
}

function checkUserAttendanceFromUserId(logHandler, opts){
   return new Promise((resolve, reject)=> {
     let values = ["fugu"+ opts.user_id];
    let databaseName = commonFunctions.isEnv("test") ? `attendance_test` : `attendance_prod`;
    let query = ` SELECT ua.created_at FROM ${databaseName}.users u INNER JOIN ${databaseName}.user_attendance ua ON u.user_id = ua.user_id 
                  WHERE u.user_name = ? AND DATE(ua.created_at + INTERVAL 330 MINUTE) = DATE(NOW()) AND ua.clocked_out is NULL`;
    let queryObj = {
      query: query,
      args : values,
      event: "checkUserAttendanceFromUserId"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result)=> {
      return resolve(result);
    }).catch((error)=> {
       return reject(error);
    })
   })
}
