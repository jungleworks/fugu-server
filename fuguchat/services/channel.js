const Promise                      = require('bluebird');
const dbHandler                    = require('../database').dbHandler;
const _                            = require('underscore');
const constants                    = require('../Utils/constants');
const utils                        = require('../Utils/commonFunctions');
const { logger }                   = require('../libs/pino_logger');
const userService                  = require('./user');
const UniversalFunc                = require('../Utils/universalFunctions');
const conversationService          = require('../services/conversation');
const slaveDbHandler               = require('../database').slaveDbHandler;

exports.getLabelById                                          = getLabelById;
exports.getChannelByTransactionId                             = getChannelByTransactionId;
exports.update                                                = update;
exports.getInfo                                               = getInfo;
exports.getUsersWithDetailsFromUserToChannel                  = getUsersWithDetailsFromUserToChannel;
exports.disableUsersOfUserToChannel                           = disableUsersOfUserToChannel;
exports.enableUsersOfUserToChannel                            = enableUsersOfUserToChannel;
exports.insertUsersInUserToChannel                            = insertUsersInUserToChannel;
exports.getOwnerAndAgentOfChannel                             = getOwnerAndAgentOfChannel;
exports.getUsersFromUserToChannelExceptUserId                 = getUsersFromUserToChannelExceptUserId;
exports.getUserFromUserToChannel                              = getUserFromUserToChannel;
exports.disableUsersOnChannelExceptUser                       = disableUsersOnChannelExceptUser;
exports.assignAgent                                           = assignAgent;
exports.getChannelWithLabelAndOwner                           = getChannelWithLabelAndOwner;
exports.getChannelAndLabelInfo                                = getChannelAndLabelInfo;
exports.getDefaultChannelsInfoExceptLabelIds                  = getDefaultChannelsInfoExceptLabelIds;
exports.getDefaultChannels                                    = getDefaultChannels;
exports.getAgentAssignedChats                                 = getAgentAssignedChats;
exports.markChatsUnassigned                                   = markChatsUnassigned;
exports.disableUserOnChannels                                 = disableUserOnChannels;
exports.getChannelsInfo                                       = getChannelsInfo;
exports.updateLastActivityAtChannel                           = updateLastActivityAtChannel;
exports.getUserToChannelDetails                               = getUserToChannelDetails;
exports.getUserChannelStatsByUserUniqueKey                    = getUserChannelStatsByUserUniqueKey;
exports.migrateAgentChats                                     = migrateAgentChats;
exports.getUsersParticipatedChannels                          = getUsersParticipatedChannels;
exports.groupSearchByName                                     = groupSearchByName;
exports.getGroupChannelsWithMemberNames                       = getGroupChannelsWithMemberNames;
exports.getChannelsHavingUsers                                = getChannelsHavingUsers;
exports.addUserToGeneralChat                                  = addUserToGeneralChat;
exports.getAllChannelsWithChatType                            = getAllChannelsWithChatType;
exports.getUserChannelsInfo                                   = getUserChannelsInfo;
exports.insertOrUpdateChannelHistory                          = insertOrUpdateChannelHistory;
exports.getUsersFromUserToChannelExceptUserIdHavingChannelIds = getUsersFromUserToChannelExceptUserIdHavingChannelIds;
exports.getUserJoinedGroups                                   = getUserJoinedGroups;
exports.getOpenGroups                                         = getOpenGroups;
exports.getOpenGroupsByGroupName                              = getOpenGroupsByGroupName;
exports.getUserChannelInfo                                    = getUserChannelInfo;
exports.getChannelAttachments                                 = getChannelAttachments;
exports.getThreadUsersParticipatedInChannel                   = getThreadUsersParticipatedInChannel;
exports.getThreadAttachments                                  = getThreadAttachments;
exports.getUsersParticipatedInChannel                         = getUsersParticipatedInChannel;
exports.saveChatClearUptoMessageId                            = saveChatClearUptoMessageId;
exports.getClearChatHistory                                   = getClearChatHistory;
exports.searchGeneralGroups                                   = searchGeneralGroups;
exports.getUsersParticipatedInChannels                        = getUsersParticipatedInChannels;
exports.updateGroupChatType                                   = updateGroupChatType;
exports.getAllChannelInfo                                     = getAllChannelInfo;
exports.getAllUsersParticipatedInChannels                     = getAllUsersParticipatedInChannels;
exports.getChannelsUsersInfo                                  = getChannelsUsersInfo;
exports.getOwnerAndChannelInfo                                = getOwnerAndChannelInfo;
exports.getAdminAndOwnerOfBusiness                            = getAdminAndOwnerOfBusiness;
exports.getUserO2OChannels                                    = getUserO2OChannels;
exports.getChannelWithOnlyAdmin                               = getChannelWithOnlyAdmin;
exports.updateAdminOfChannel                                  = updateAdminOfChannel;
exports.getDefaultChannelIds                                  = getDefaultChannelIds;
exports.insertIntoChannels                                    = insertIntoChannels;
exports.insertIntoMessageSeen                                 = insertIntoMessageSeen;
exports.getMessageSeenBy                                      = getMessageSeenBy;
exports.getThreadMessageSeenBy                                = getThreadMessageSeenBy;
exports.updateMessageSeen                                     = updateMessageSeen;
exports.updateChannelHistory                                  = updateChannelHistory;
exports.getThreadMeesageSeenByCount                           = getThreadMeesageSeenByCount;
exports.getMeesageSeenByCount                                 = getMeesageSeenByCount;
exports.suspendUsersOfUserToChannel                           = suspendUsersOfUserToChannel;
exports.getUserAllChannels                                    = getUserAllChannels;
exports.getAllPinChannels                                     = getAllPinChannels;
exports.updatePinChannel                                      = updatePinChannel;
exports.getHrmBotChannelId                                    = getHrmBotChannelId;

function getLabelById(logHandler, labelId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT channel_name AS label_name, default_message FROM channels WHERE channel_id = ?`;
    let queryObj = {
      query : query,
      args  : [labelId],
      event : "getLabelById"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function update(logHandler, payload) {
  return new Promise((resolve, reject) => {
    logger.trace(logHandler, { EVENT : "Updating channel" }, { PAYLOAD : payload });
    if(_.isEmpty(payload.update_fields)) {
      return reject(new Error("Update Fields Missing"));
    }
    if(_.isEmpty(payload.where_clause)) {
      return reject(new Error("Where condition Empty"));
    }


    let updateObj = {};
    updateObj.updated_at = new Date();

 //   if(payload.update_fields.channel_image){
 //     updateObj.channel_image_thumbnail = payload.update_fields.channel_image_thumbnail;
 //   }

    let validUpdateColumns = new Set(["channel_name", "status", "channel_type", "lmu_id", "lma_id", "lm_updated_at", "owner_id", "agent_id", "updated_at",
      "default_message", "label_id", "label", "channel_image", "channel_priority", "chat_type", "custom_label", "channel_properties"]);
    _.each(payload.update_fields, (value, key) => {
      logger.trace(logHandler, "UPDATIN VALUES", key, value);
      if(validUpdateColumns.has(key) && (value === null || value == 0 || value)) {
        updateObj[key] = value;
      }
    });


    let values = [];
    let whereCondition = "";
    _.each(payload.where_clause, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    let query = `UPDATE channels SET ?  where 1=1 ${whereCondition}`;
    let queryObj = {
      query : query,
      args  : [updateObj].concat(values),
      event : "Updating channel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getChannelByTransactionId(logHandler, transactionId, businessId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT channel_id, channel_name, custom_label, transaction_id from channels  where transaction_id = ? AND business_id = ?`;
    let queryObj = {
      query : query,
      args  : [transactionId, businessId],
      event : "getChannelByTransactionId"
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

    let query = `SELECT * from channels where 1=1 `;

    let values = [];

    if (payload.channel_id) {
      query += ' AND channel_id = ? ';
      values.push(payload.channel_id);
    }

    if (payload.channel_ids) {
      query += ' AND channel_id IN (?) ';
      values.push(payload.channel_ids);
    }

    //Check if arguments are passed.
    if ( _.isEmpty(values)) {
      return reject('No parameters found');
    }

    let queryObj = {
      query : query,
      args  : values,
      event : "getChannelInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserJoinedGroups(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT 
                  utc.channel_id,
                  c.chat_type,COALESCE(c.channel_image,'{}') as channel_image ,COALESCE(c.custom_label, '') AS label
                  FROM
                      user_to_channel utc
                          LEFT JOIN
                      channels c ON c.channel_id = utc.channel_id AND  c.chat_type in (3,4,5,6) AND c.status = 1
                  WHERE
                      utc.user_id = ?
                          AND utc.status = 1
                          AND c.workspace_id = ?`;
    let queryObj = {
      query : query,
      args: [payload.user_id, payload.workspace_id],
      event : "getUserJoinedGroups"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getOpenGroups(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeholder = "";
    let values = [payload.workspace_id, payload.user_id];

    if(payload.search_query) {
      values.push("%" + payload.search_query + "%");
      placeholder = ` AND custom_label like ?`;
    }
    let query = `SELECT 
                  channel_id, chat_type,COALESCE(channel_image,'{}') as channel_image ,COALESCE(custom_label, '') AS label, COALESCE(custom_label, '') AS custom_label
                  FROM
                      channels c
                  WHERE
                       workspace_id = ? AND chat_type = 4 AND status = 1 AND channel_id not in (
                            SELECT 
                                channel_id
                            FROM
                                user_to_channel 
                            WHERE
                                user_id = ? AND status = 1) AND status = 1 ${placeholder} `;

    let queryObj = {
      query : query,
      args  : values,
      event : "getOpenGroups"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getOpenGroupsByGroupName(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = ` SELECT 
                  c.channel_id, c.chat_type,COALESCE(c.channel_image,'{}') as channel_image ,COALESCE(c.custom_label, '') AS label
                  FROM
                      channels c
                  WHERE
                       c.business_id = ? AND  c.chat_type in (4) AND c.channel_id not in (
                            SELECT 
                                utc.channel_id
                            FROM
                                user_to_channel utc
                            WHERE
                                utc.user_id = ? AND utc.status = 1
                  )`;
    let queryObj = {
      query : query,
      args  : [payload.business_id, payload.search_query],
      event : "getOpenGroups"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllChannelsWithChatType(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * from channels where workspace_id = ? and chat_type IN (?) AND status = 1`;
    let queryObj = {
      query : query,
      args: [payload.workspace_id, payload.chat_type],
      event : "getAllChannelsWithChannelType"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


// TODO : remove heavy query
function getChannelsHavingUsers(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if(_.isEmpty(payload.userIds)) {
      return resolve([]);
    }
    let query = `
                  SELECT
                  channels.channel_id,
                  channels.custom_label,
                  channels.channel_image
                  FROM
                      (
                      SELECT DISTINCT
                          channel_id
                      FROM
                          user_to_channel
                      WHERE
                          user_to_channel.user_id = ? AND user_to_channel.channel_id IN(
                          SELECT DISTINCT
                              channel_id
                          FROM
                              user_to_channel
                          WHERE
                              user_to_channel.user_id = ?
                      )
                  ) AS utc
                  LEFT JOIN channels ON channels.channel_id = utc.channel_id AND channels.chat_type = ? AND utc.channel_id is NOT NULL
                  WHERE channels.channel_id is NOT NULL`;
    let queryObj = {
      query : query,
      args  : [payload.userIds[0], payload.userIds[1], payload.chat_type],
      event : "getChannelsHavingUsers"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getChannelsInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let placeHolder = ''
    if(payload.workspace_id){
      placeHolder = `and workspace_id = ?`
    }
    let query = `SELECT * from channels where channel_id IN (?) ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : [payload.channel_ids, payload.workspace_id],
      event : "getChannelsInfo"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getGroupChannelsWithMemberNames(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(payload.channel_ids)) {
      return resolve([]);
    }

    let values = [];
    if(payload.channel_ids_to_connect) {
      values.push(payload.channel_ids_to_connect);
    } else {
      values.push(payload.channel_ids);
    }
    values.push(payload.workspace_id);

    let placeHolder = '(3,4,8)';
    if(payload.status){
      placeHolder = '(3,4,5,6,8)'
    }
    let query = `SELECT
    c.channel_id,c.chat_type,COALESCE(c.channel_image, '{}') as channel_image, COALESCE(c.custom_label, '') AS label,
    GROUP_CONCAT(u.full_name) AS members, count(*) as members_count
    FROM
        channels c
    LEFT JOIN user_to_channel utc ON
        c.channel_id = utc.channel_id
    LEFT JOIN user_to_workspace u ON u.user_id = utc.user_id
    WHERE
       c.chat_type IN ${placeHolder} AND c.channel_id IN (?) AND c.workspace_id = ? and c.status = 1 and utc.status = 1 and u.status = 1
    GROUP BY
        c.channel_id ORDER BY utc.last_activity DESC`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getChannelsWithMemberDetails"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersWithDetailsFromUserToChannel(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `
              SELECT 
                  uc.*, users.full_name, users.user_type
              FROM
                  user_to_channel AS uc LEFT JOIN
                  users ON users.user_id = uc.user_id
              WHERE
                  channel_id = ? `;
    let queryObj = {
      query : query,
      args  : [payload.channel_id],
      event : "getAllFromUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function disableUsersOfUserToChannel(logHandler, userList, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel SET status = 0 WHERE user_id in (?) AND channel_id IN (?)`;
    let queryObj = {
      query : query,
      args  : [userList, channel_id],
      event : "disableUsersOfUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersFromUserToChannelExceptUserIdHavingChannelIds(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if(!opts.channel_ids.length) {
      return resolve({});
    }
    let query = `
                SELECT 
                utc.channel_id, utc.user_id, utc.created_at,u.user_type, u.full_name, u.user_thumbnail_image as user_image, u.status
            FROM
                user_to_channel utc
                 join user_to_workspace u 
                on u.user_id = utc.user_id
            WHERE
                utc.channel_id in (?) AND utc.user_id not in (?) AND utc.status != 0
            ORDER BY utc.id`;
    let queryObj = {
      query : query,
      args  : [opts.channel_ids, opts.user_id],
      event : "getUsersFromUserToChannelExceptUserIdHavingChannelIds"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let channelToResult = {};
      for (let res of result) {
        if(!channelToResult[res.channel_id]) {
          channelToResult[res.channel_id] = [];
        }
        channelToResult[res.channel_id].push(res);
      }
      resolve(channelToResult);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersFromUserToChannelExceptUserId(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `
                SELECT 
                utc.user_id, utc.created_at,u.user_type, u.full_name, u.user_image, 
                  COALESCE(upds.leave_type,'PRESENT') as leave_type , u.status,
                   utc.role,
                   u.user_properties
            FROM
                user_to_channel utc
                left join user_to_workspace u 
                on u.user_id = utc.user_id
                LEFT JOIN user_present_day_status upds
                on u.user_id = upds.fugu_user_id AND DATE(NOW()) BETWEEN DATE(start_date) AND DATE(start_date + INTERVAL days  - 1  DAY ) AND days >= 1
            WHERE
                utc.channel_id = ? AND utc.user_id not in (?) AND utc.status != 0
            ORDER BY utc.id `;
    let queryObj = {
      query : query,
      args  : [opts.channel_id, opts.user_id],
      event : "getUsersFromUserToChannelExceptUserId"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function enableUsersOfUserToChannel(logHandler, userList, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel SET status = 1 WHERE user_id in (?) AND channel_id IN (?)`;
    let queryObj = {
      query : query,
      args  : [userList, channel_id],
      event : "enableUsersOfUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertUsersInUserToChannel(logHandler, user_id, channelIds, user_channel_role) {
  return new Promise((resolve, reject) => {
    let values = [];
    for (let channel of channelIds) {
      values = values.concat([user_id, channel, user_channel_role]);
    }
    let placeHolder = new Array(channelIds.length).fill("(?,?,?)").join(',');

    let query = `INSERT INTO user_to_channel (user_id, channel_id, role) VALUES ${placeHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "insertUsersInUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getOwnerAndAgentOfChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `
                 SELECT 
                    c.owner_id,
                    c.agent_id,
                    owners.full_name AS owner_name,
                    COALESCE(agents.user_image, '') AS agent_image,
                    COALESCE(agents.full_name, '') AS agent_name,
                    owners.attributes AS owner_address,
                    owners.phone_number AS owner_phone_number,
                    owners.email AS owner_email
                FROM
                    channels c
                        LEFT JOIN
                    users owners ON c.owner_id = owners.user_id
                        LEFT JOIN
                    users agents ON c.agent_id = agents.user_id
                WHERE
                    channel_id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.channel_id],
      event : "getOwnerAndAgentOfChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      if(result.length) { return resolve(result[0]); }
      return resolve({});
    }, (error) => {
      reject(error);
    });
  });
}

function getUserFromUserToChannel(logHandler, user_id, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `select user_id, notification, role, status, last_read_message_id, is_pinned from user_to_channel where user_id IN (?) and channel_id = ? and status IN (1,2)`;
    let queryObj = {
      query : query,
      args  : [user_id, channel_id],
      event : "getUserFromUserToChannel"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function disableUsersOnChannelExceptUser(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel SET status = 0 WHERE channel_id = ? AND status !=0 AND user_id != ?`;
    let queryObj = {
      query : query,
      args  : [opts.channel_id, opts.user_id],
      event : "disableUsersOnChannelExceptUser"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateLastActivityAtChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel SET last_activity = ? WHERE channel_id = ? and user_id = ? `;
    let queryObj = {
      query : query,
      args  : [new Date(), opts.channel_id, opts.user_id],
      event : "updateLastActivityAtChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function assignAgent(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      // update assigned agent
      let updatePayload = {
        update_fields : { agent_id : opts.user_id },
        where_clause  : {
          channel_id : opts.channel_id
        }
      };
      yield update(logHandler, updatePayload);

      // get agents
      let existingUsers = yield getUsersWithDetailsFromUserToChannel(logHandler, opts);
      let removeAssignedAgents = [];
      let updateCurrentAgentStatus = false;
      for (let user of Array.from(existingUsers)) {
        if(user.status == constants.userStatus.ENABLE && user.user_type == constants.userType.AGENT) {
          removeAssignedAgents.push(user.user_id);
        } else if(user.user_id == opts.user_id) {
          updateCurrentAgentStatus = true;
        }
      }

      // update agents status
      if(!_.isEmpty(removeAssignedAgents)) {
        yield disableUsersOfUserToChannel(logHandler, removeAssignedAgents, opts.channel_id);
      }

      let updateObj = {
        user_id    : opts.user_id,
        channel_id : opts.channel_id,
        status     : constants.userStatus.ENABLE
      };
      yield userService.insertOrUpdateUserToChannel(logHandler, updateObj);

      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getChannelWithLabelAndOwner(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM channels WHERE owner_id = ? AND label_id = ?";
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.label_id],
      event : "getChannelWithLabelAndOwner"
    };
    dbHandler.executeQuery(logHandler, queryObj).then(
      (result) => { resolve(result); },
      (error) => { reject(error); }
    );
  });
}

function getChannelAndLabelInfo(logHandler, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT 
                  channels.channel_name,
                  channels.label_id,
                  channels.chat_type,
                  labels.channel_name AS label,
                  labels.status AS label_status,
                  channels.custom_attributes as custom_attributes
              FROM
                  channels
                      LEFT JOIN
                  channels AS labels ON channels.label_id = labels.channel_id
              WHERE
                  channels.channel_id = ?`;

    let queryObj = {
      query : query,
      args  : [channel_id],
      event : "get channel and label info"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getDefaultChannelsInfoExceptLabelIds(logHandler, business_id, labelIds) {
  return new Promise((resolve, reject) => {
    let query = `
                  SELECT 
                  - 1 AS channel_id,
                  channel_name,
                  0 AS user_id,
                  created_at AS date_time,
                  default_message AS message,
                  label,
                  channel_id AS label_id,
                  status,
                  1 AS channel_status,
                  0 AS unread_count,
                  channel_image,
                  channel_priority
              FROM
                  channels
              WHERE
                  channel_type = 2 AND business_id = ?
                      AND channel_id NOT IN (?)
                      AND status != 0
              ORDER BY channel_priority`;

    let queryObj = {
      query : query,
      args  : [business_id, labelIds],
      event : "getDefaultChannelsInfoExceptLabelIds"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      for (let i in result) {
        if(result[i].channel_type == constants.channelType.DEFAULT_CHANNEL) {
          result[i].channel_id = -1;
        } else {
          result[i].channel_id = -2;
        }
      }
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getDefaultChannels(logHandler, business_id) {
  return new Promise((resolve, reject) => {
    let query = `
                  SELECT 
                      channel_id,
                      channel_name,
                      default_message,
                      status,
                      channel_image,
                      channel_priority,
                      custom_attributes
                  FROM
                      channels
                  WHERE
                      business_id = ? AND channel_type = 2
                          AND status IN (0 , 1)
                  ORDER BY status desc, channel_priority`;

    let queryObj = {
      query : query,
      args  : [business_id],
      event : "getDefaultChannels"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      for (let i = 0; i < result.length; i++) {
        result[i].custom_attributes = utils.jsonParse(result[i].custom_attributes);
      }
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAgentAssignedChats(logHandler, agent_id) {
  return new Promise((resolve, reject) => {
    let query = `SELECT channel_id, channel_name, label_id FROM channels where agent_id = ? and status = ?`;

    let queryObj = {
      query : query,
      args  : [agent_id, constants.channelStatus.OPEN],
      event : "getAgentAssignedChats"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function markChatsUnassigned(logHandler, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `update channels SET agent_id = 0 where channel_id IN (?)`;

    let queryObj = {
      query : query,
      args  : [channel_id],
      event : "markChatsUnassigned"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function disableUserOnChannels(logHandler, user_id, channel_ids) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel SET status = 0 WHERE user_id = ? AND channel_id IN (?)`;
    let queryObj = {
      query : query,
      args  : [user_id, channel_ids],
      event : "disableUserOnChannels"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUsersParticipatedChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {
    if(_.isEmpty(opts.userIds)) {
      return resolve({});
    }
    let query    = `SELECT distinct(channel_id) from user_to_channel where user_id in (?) AND status = 1 
    AND channel_id in ( SELECT channel_id from user_to_channel where user_id = ?  AND status = 1)`;
    let queryObj = {
      query : query,
      args  : [opts.userIds, opts.user_id],
      event : "getUsersParticipatedChannels"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserToChannelDetails(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let params = {};
    let values = [];
    let statusPlaceHolder = ``
    let whereCondition = "";
    if(payload.channel_id) {
      params.channel_id = payload.channel_id;
    }
    if(payload.user_id) {
      params.user_id = payload.user_id;
    }
    if(payload.role) {
      params.role = payload.role;
    }

    if(_.isEmpty(params)) {
      throw new Error("Invalid query parameters getUserToChannelDetails ");
    }

    _.each(params, (value, key) => {
      whereCondition += " AND " + key + " = ? ";
      values.push(value);
    });

    if (utils.isDefined(payload.status)) {
      statusPlaceHolder = ` AND status IN (?)`
      values.push(payload.status);
    }

    let query = `SELECT * from user_to_channel where 1=1 ${whereCondition} ${statusPlaceHolder}`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getUserToChannelDetails"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserChannelStatsByUserUniqueKey(logHandler, userUniqueKey) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                      c.channel_id,
                      c.custom_label,
                      c.label,
                      c.created_at,
                      c.status,
                      c.agent_id,
                      agent.email as agent_email,
                      u.user_id
                  FROM
                      channels c
                  LEFT JOIN  users u ON
                      c.owner_id = u.user_id
                  LEFT JOIN users agent ON
                      agent.user_id = c.agent_id
                  where u.user_unique_key = ?`;
    let queryObj = {
      query : query,
      args  : [userUniqueKey],
      event : "getUserChannelStatsByUserUniqueKey"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function migrateAgentChats(logHandler, payload, agentDetails) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let channelIds = [];
      let channelDetails = yield getAgentAssignedChats(logHandler, payload.user_id);

      if(!_.isEmpty(channelDetails)) {
        for (let i = 0; i < channelDetails.length; i++) {
          channelIds.push(channelDetails[i].channel_id);
        }
        // TODO remove loop queries
        logger.trace(logHandler, { EVENT : "channelDetails Channel Ids", channelIds });
        if(payload.assign_to_agent_id) {
          for (let i = 0; i < channelIds.length; i++) {
            let opts = {
              user_id    : payload.assign_to_agent_id,
              channel_id : channelIds[i]
            };
            yield assignAgent(logHandler, opts);
          }
          message = "The Chat was re-assigned to " + agentDetails[0].full_name;
        } else {
          markChatsUnassigned(logHandler, channelIds);
          disableUserOnChannels(logHandler, payload.user_id, channelIds);
          message = "The Chat was marked un-assigned";
        }
        let localopts = {};
        localopts.business_id  = payload.business_id;
        localopts.user_id      = payload.userInfo.user_id;
        localopts.data         = { message : message };
        localopts.user_type    = payload.userInfo.user_type;
        localopts.full_name    = payload.userInfo.full_name;
        localopts.message_type = constants.messageType.NOTE;
        for (let i = 0; i < channelDetails.length; i++) {
          localopts.label_id     = channelDetails[i].label_id;
          localopts.channel_id   = channelDetails[i].channel_id;
          localopts.channel_name = channelDetails[i].channel_name;
          yield Promise.promisify(dbquery.insertUsersConversation).call(null, logHandler, localopts);
        }
      }
    })().then((data) => {
      logger.trace(logHandler, { RESPONSE : data });
      return resolve();
    }, (error) => {
      logger.error(logHandler, error);
      return reject(error);
    });
  });
}



function groupSearchByName(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let values = [payload.workspace_id, '%' + payload.search_text + "%", payload.user_id];
    let query = `SELECT
                      distinct(channels.channel_id)
                  FROM
                      channels
                  LEFT JOIN user_to_channel ON channels.channel_id = user_to_channel.channel_id
                  WHERE
                      channels.workspace_id = ? 
                      AND channels.chat_type IN(3, 4, 5, 6, 8) 
                      AND channels.custom_label LIKE  ?
                      AND user_to_channel.user_id = ? 
                      AND user_to_channel.status = 1 
                      AND channels.status = 1 
                  ORDER BY
                      channels.custom_label
                  DESC
                  LIMIT 30`;
    let queryObj = {
      query : query,
      args  : values,
      event : "groupSearchByName"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function addUserToGeneralChat(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let channel_id = [];
      let channels = yield getAllChannelsWithChatType(logHandler, { workspace_id: payload.workspace_id, chat_type : [constants.chatType.GENERAL_CHAT, constants.chatType.DEFAULT_GROUP ]});

      let user_channel_role;
      if(!channels.length) {
        let params           = {};
        params.chat_type     = constants.chatType.GENERAL_CHAT;
        params.workspace_id   = payload.workspace_id;
        params.owner_id      = payload.user_id;
        params.custom_label  = constants.generalChatName;
        let response = yield insertIntoChannels(logHandler, params);
        channel_id.push(response.insertId);

        let opts = {};
        opts.workspace_id = payload.workspace_id;
        opts.user_id      = 0;
        opts.channel_id   = channel_id[0];
        opts.data         = { message : constants.generalChatIntroMessage + `${payload.app_name}` };
        opts.user_type    = constants.userType.BOT;
        opts.message_type = constants.messageType.MESSAGE;
        opts.status       = constants.userConversationStatus.MESSAGE;
        opts.muid         = UniversalFunc.getRandomString();
        user_channel_role = constants.userRole.ADMIN;
        yield conversationService.insertUsersConversation(logHandler, opts);
      } else {
        user_channel_role = constants.userRole.USER;
        for(let channelId of channels){
          channel_id.push(channelId.channel_id);
        }
      }
      yield insertUsersInUserToChannel(logHandler, payload.user_id, channel_id, user_channel_role);
      return {};
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserChannelsInfo(logHandler, userId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    COALESCE(c.custom_label, '') AS label,
                    COALESCE(c.channel_image, '{}') AS channel_image,                    
                    utc.channel_id,
                    c.chat_type,
                    utc.notification
                FROM
                    user_to_channel utc
                LEFT JOIN channels c ON
                    utc.channel_id = c.channel_id
                WHERE
                    utc.user_id =  ? and utc.status = 1 `;
    let queryObj = {
      query : query,
      args  : [userId],
      event : "getUserChannelsInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUserChannelInfo(logHandler, userId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    COALESCE(c.custom_label, '') AS label,
                    utc.channel_id,
                    utc.notification,
                    c.workspace_id
                FROM
                    user_to_channel utc
                LEFT JOIN channels c ON
                    utc.channel_id = c.channel_id
                WHERE
                    utc.user_id =  ? AND
                    c.chat_type IN (8) AND
                     utc.status IN (1,2) `;
    let queryObj = {
      query : query,
      args  : [userId],
      event : "getUserChannelInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function searchGeneralGroups(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                  c.channel_id,c.chat_type,c.channel_image, COALESCE(c.custom_label, '') AS label
                  FROM
                      channels c
                  WHERE
                      c.chat_type = ? AND c.custom_label like ? AND c.business_id = ?`;
    let queryObj = {
      query : query,
      args  : [constants.chatType.GENERAL_CHAT, "%" + payload.search_text + "%", payload.business_id],
      event: "searchGeneralGroups"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function insertOrUpdateChannelHistory(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = ` INSERT INTO user_to_channel (user_id,channel_id,last_read_message_id,last_message_read_at) VALUES (?,?,?,?) 
    ON DUPLICATE KEY UPDATE last_read_message_id = ?, last_message_read_at = ? ` ;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.channel_id, opts.message_id, new Date(), opts.message_id, new Date()],
      event : "insertOrUpdateChannelHistory"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
function updateChannelHistory(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = ` UPDATE user_to_channel SET last_read_message_id = ?, last_message_read_at = ? where user_id = ? and channel_id = ? ` ;
    let queryObj = {
      query : query,
      args  : [ opts.message_id, new Date() , opts.user_id, opts.channel_id ],
      event : "insertOrUpdateChannelHistory"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getChannelAttachments(logHandler, opts) {
  // let placeHolder = '';
  // if (opts.workspace_id) {
  //   placeHolder = `AND workspace_id IN (${opts.workspace_id})`;
  // }
  return new Promise((resolve, reject) => {
    let query = `select id as message_id, message, muid , message_type , created_at from users_conversation where channel_id = ? and workspace_id = ? and message_type IN ( ? ) and status = 1 order by id desc limit ?,?`;
    let queryObj = {
      query : query,
      args: [+opts.channel_id, opts.workspace_id, opts.message_type, opts.page_start, opts.page_end],
      event : "getChannelAttachments"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getUsersParticipatedInChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let selectColumn = ``;
    if (opts.follow_thread) {
      selectColumn = ` true as follow_thread,`
    }

    let query = `SELECT
                      u.user_id,
                      utc.notification,
                      ${selectColumn}
                      utc.last_read_message_id,
                      u.user_unique_key,
                      utc.role,
                      u.notification_level,
                      u.full_name,
                      u.user_type,
                      us.notification_snooze_time
                  FROM
                      user_to_channel utc Join user_to_workspace u on utc.user_id = u.user_id
                      JOIN users us ON
                       u.user_unique_key = us.user_id
                  WHERE
                      utc.user_id IN(?) AND utc.channel_id = ? AND
                  utc.STATUS = 1 and u.status IN ("ENABLED","INVITED")`;
    let queryObj = {
      query : query,
      args  : [opts.user_ids, opts.channel_id],
      event : "getUsersParticipatedInChannels"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getThreadUsersParticipatedInChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let users = {};
      let user_ids = [];

      if(opts.chat_type == constants.chatType.O20_CHAT) {
        let userChannelInfo = yield getUserToChannelDetails(logHandler, { channel_id : opts.channel_id });
        user_ids.push(userChannelInfo[0].user_id);
        user_ids.push(userChannelInfo[1].user_id);
      }

      let alreadyInvolvedUsers = yield conversationService.getUserToThread(logHandler, { message_id : opts.message_id, status : constants.status.ENABLE });
      for (let row of alreadyInvolvedUsers) {
        if(!users[row.user_id]) {
          users[row.user_id] = row.user_id;
          user_ids.push(row.user_id);
        }
      }
      return yield getUsersParticipatedInChannels(logHandler, { user_ids : user_ids, channel_id : opts.channel_id, follow_thread : true });
    })().then((data) => {
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function getThreadAttachments(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                         true as is_thread_message, 
                         thread_message_id,
                         message,
                         thread_muid as muid ,
                         message_type,
                         created_at
                          FROM
                         thread_user_messages
                     WHERE
                         channel_id = ? AND message_type IN ( ? )  AND status = 1
                     ORDER BY
                         thread_message_id
                     DESC
                     LIMIT ? , ? `;
    let queryObj = {
      query : query,
      args  : [opts.channel_id, opts.message_type, opts.page_start, opts.page_end],
      event : "getThreadAttachments"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getUsersParticipatedInChannel(logHandler, opts) {
  let placeHolder = ``;
  let values = [opts.channel_id];
  if (opts.remove_self) {
    placeHolder = `  utc.user_id != ? AND `;
    values.push(opts.user_id)
  }
  if(opts.user_ids){
    placeHolder = ` utc.user_id IN (?) AND `;
    values.push(opts.user_ids);
  }

  let query = `SELECT
                  u.user_id,
                  utc.notification,
                  u.user_unique_key,
                  u.notification_level,
                  us.notification_snooze_time
              FROM
                  user_to_channel utc Join user_to_workspace u on utc.user_id = u.user_id
                  JOIN users us on
                  u.user_unique_key = us.user_id
              WHERE
                   utc.channel_id = ? AND ${placeHolder}
              utc.STATUS IN (1,2) 
              `;

  if (opts.include_invited_user) {
      query += ` and (u.status = "ENABLED" OR u.status = "INVITED") `;
  } else {
      query += ` and u.status = "ENABLED" `;
  }

  const queryObj = {
    query: query,
    args: values,
    event: "getUsersParticipatedInChannel"
  };

  try {
    const data = dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}


function saveChatClearUptoMessageId(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `update user_to_channel set last_message_id = ?, is_pinned = 0 where channel_id = ? and user_id = ? `;
    let queryObj = {
      query : query,
      args  : [opts.message_id, opts.channel_id, opts.user_id],
      event : "saveChatClearUptoMessageId"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getClearChatHistory(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `select user_id,last_message_id, last_read_message_id from  user_to_channel where channel_id = ? and user_id IN (?) `;
    let queryObj = {
      query : query,
      args  : [opts.channel_id, opts.user_id],
      event : "getClearChatHistory"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateGroupChatType(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE channels SET chat_type = ?  where channel_id IN (?)`;
    let queryObj = {
      query : query,
      args  : [payload.chat_type, payload.channelIds],
      event : "Updating channel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getAllChannelInfo(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT
                    c.custom_label,
                    c.channel_id,
                    COALESCE(c.channel_image, "{}") AS channel_image,
                    bd.workspace_name as business_name,
                    bd.fugu_secret_key as app_secret_key,
                    GROUP_CONCAT(uu.email) as emails,
                    GROUP_CONCAT(uu.contact_number) as contact_numbers
                FROM
                    channels c
                LEFT JOIN user_to_channel utc ON
                    c.channel_id = utc.channel_id
                LEFT JOIN user_to_workspace u ON
                    utc.user_id = u.user_id
                  JOIN users uu on
                   u.user_unique_key = uu.user_id
                LEFT JOIN workspace_details bd ON
                    bd.workspace_id = c.workspace_id
                WHERE
                    utc.channel_id IN(
                    SELECT
                        channel_id
                    FROM
                        user_to_channel utc
                    JOIN user_to_workspace u ON
                        u.user_id = utc.user_id
                    WHERE
                        uu.email = ? AND utc.status = 1
                ) AND u.status = 1 AND utc.status = 1 AND bd.status = "ENABLED" AND c.chat_type IN(3, 4) AND c.custom_label IS NOT NULL
                GROUP BY
                    utc.channel_id`;
    let queryObj = {
      query : query,
      args  : [payload.email],
      event : "getAllChannelInfo"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getAllUsersParticipatedInChannels(logHandler, opts) {
  const query = `SELECT
                channel_id,
                GROUP_CONCAT(user_id) AS user_ids
              FROM
                user_to_channel
              WHERE
                channel_id IN(?) AND
              STATUS
                != 0
              GROUP BY
                channel_id`;
  const queryObj = {
    query: query,
    args: [opts.channel_id, opts.channel_id],
    event: "getUsersParticipatedInChannel"
  };
  try {
    const data = await dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    reject(error);
  }
}

function getChannelsUsersInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {

    if(_.isEmpty(opts.channel_ids)) {
      return resolve({});
    }
    let values = [];
    if(opts.channel_ids_to_connect) {
      values.push(opts.channel_ids_to_connect);
    } else {
      values.push(opts.channel_ids)
    }
    values.push([constants.chatType.O20_CHAT], opts.user_id);

    let placeHolder = '';
    if(opts.user_id) {
      placeHolder = ' AND u.user_id != ? ';
    }
    let query = `SELECT
                  utc.channel_id,
                  u.full_name,
                  u.user_thumbnail_image user_image,
                  u.user_id,
                  u.user_type,
                  u.status
              FROM
                  channels c
              JOIN user_to_channel utc ON
                  utc.channel_id = c.channel_id
              JOIN user_to_workspace u ON
                  utc.user_id = u.user_id
              WHERE
                  utc.channel_id IN (?) AND ((c.custom_label is null or c.custom_label = '') or (c.channel_image is null or c.channel_image = '')) and c.chat_type != ? and utc.status IN (1,2) and u.status IN ("ENABLED","INVITED") ${placeHolder}
              ORDER BY
                  utc.channel_id, utc.last_activity
              DESC`;
    let queryObj = {
      query : query,
      args  : values,
      event : "getChannelsUsersInfo"
    };

    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      let channelUserMap = {};
      let channelLabelMap = {};
      for (let row of result) {
        if(!channelUserMap[row.channel_id]) {
          channelUserMap[row.channel_id] = [];
        }

        if(!channelLabelMap[row.channel_id]) {
          channelLabelMap[row.channel_id] = "";
        }
        // skip for 3 length
        if(channelUserMap[row.channel_id].length == constants.unamedGroupMemberLength) {
          continue;
        }
        let user        = {};
        user.full_name  = row.full_name.split(' ')[0];
        user.user_image = row.user_image || '';
        user.user_id    = row.user_id;
        user.user_type  = row.user_type;

        channelLabelMap[row.channel_id] = channelLabelMap[row.channel_id] ? channelLabelMap[row.channel_id] + ", " + user.full_name : user.full_name ;
        channelUserMap[row.channel_id].push(user);
      }
      logger.trace(logHandler, { RESPONSE : { channelUserMap : channelUserMap, channelLabelMap : channelLabelMap }, OPTS : opts });
      resolve({ channelUserMap : channelUserMap, channelLabelMap : channelLabelMap });
    }, (error) => {
      reject(error);
    });
  });
}


function getOwnerAndChannelInfo(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query =  `SELECT
              c.channel_id,
              c.owner_id,
              u.full_name AS owner_name,
              c.chat_type,
              utc.notification
            FROM
              channels c
            LEFT JOIN user_to_workspace u ON
              c.owner_id = u.user_id
            LEFT  JOIN user_to_channel utc ON 
              utc.channel_id = c.channel_id
            WHERE
              c.channel_id = ? AND utc.user_id = ?`;
    let queryObj = {
      query : query,
      args  : [opts.channel_id, opts.user_id],
      event : "getOwnerAndChannelInfo"
    };
    slaveDbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getAdminAndOwnerOfBusiness(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query =  `SELECT
              ud.user_id fugu_user_id
          FROM
              user_to_workspace ud
          JOIN workspace_details wd
          ON
              ud.workspace_id = wd.workspace_id
          WHERE
              wd.fugu_secret_key = ? AND ud.status = "ENABLED" AND ud.role NOT IN ("USER","GUEST")`;
    let queryObj = {
      query : query,
      args  : [opts.app_secret_key],
      event : "getAdminAndOwnerOfBusiness"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getUserO2OChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query =  `SELECT
              utc.channel_id,
              utc.user_id,
              u.full_name,
              u.user_image,
              utc.last_activity
          FROM
              user_to_channel utc
          JOIN channels c ON
              c.channel_id = utc.channel_id
          JOIN user_to_channel um ON
              c.channel_id = um.channel_id
          JOIN user_to_workspace u ON
              um.user_id = u.user_id
          WHERE
              c.chat_type = 2 AND utc.user_id = ? AND um.user_id != ?`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.user_id],
      event : "getUserO2OChannels"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getChannelWithOnlyAdmin(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query =  `SELECT
                    channel_id
                  FROM
                    user_to_channel utc
                  WHERE
                    utc.user_id = ? AND role = "ADMIN" AND NOT EXISTS(
                  SELECT
                   *
                  FROM
                    user_to_channel utco
                  JOIN user_to_workspace u ON
                    u.user_id = utco.user_id
                  WHERE
                    utco.user_id != ?  AND utco.role = "ADMIN" AND utc.channel_id = utco.channel_id
                  AND
                    u.status = 1)`;
    let queryObj = {
      query : query,
      args  : [opts.user_id, opts.user_id],
      event : "getChannelWithOnlyAdmin"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updateAdminOfChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query =  `UPDATE
                    user_to_channel utc
                  JOIN(
                  SELECT
                    ut.user_id,
                    ut.channel_id
                  FROM
                    user_to_channel ut 
                  JOIN user_to_workspace uu ON
                    uu.user_id = ut.user_id AND uu.status = 1
                  WHERE
                    ut.channel_id IN( ? ) AND ut.role != "ADMIN"
                  GROUP BY
                    ut.channel_id
                  ) u
                  ON
                    utc.channel_id = u.channel_id AND utc.user_id = u.user_id
                  SET
                    role = "ADMIN"`;
    let queryObj = {
      query : query,
      args  : [opts.channel_id],
      event : "updateAdminOfChannel"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function getDefaultChannelIds(logHandler, opts) {
  return new Promise((resolve, reject) => {

    let query =  `SELECT * FROM channels WHERE channel_id in (?) and chat_type IN (5,6)`;
    let queryObj = {
      query : query,
      args  : [opts.channels],
      event : "updateAdminOfChannel"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function insertIntoChannels (logHandler, opts) {
  const allowedFields = [`workspace_id`, `status`,
    `channel_image`, `owner_id`, `chat_type`,
    'custom_label'];
  let fields = [];
  let values = [];
  for (const field of allowedFields) {
    if (field in opts) {
      fields.push(field);
      values.push(opts[field]);
    }
  }
  const query = "INSERT INTO `channels`(" + fields.join(', ') + " ) " +
    " VALUES( " + new Array(fields.length).fill("?").join(', ') + " )";
  let queryObj = {
    query,
    args: values,
    event: "insertIntoChannels"
  };

  try {
    const result = dbHandler.executeQuery(logHandler, queryObj);
    return result;
  } catch(error) {
    throw new Error(error);
  }
}

async function insertIntoMessageSeen(logHandler, opts) {
  let placeHolder = ``;
  const values = [opts.user_id,opts.channel_id];

  if(opts.message_id) {
    placeHolder = `(user_id, channel_id, message_id)`;
    values.push(opts.message_id);
  } else {
    placeHolder = `(user_id, channel_id, thread_message_id)`;
    values.push(opts.thread_message_id);
  }

  const query = `INSERT IGNORE INTO message_seen ${placeHolder} VALUES (?, ?, ?) ` ;
  let queryObj = {
    query,
    args: values,
    event: "insertIntoMessageSeen"
  };

  try {
    return dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function getMessageSeenBy(logHandler, opts) {
  const query = "SELECT MIN(ms.id) AS id, u.full_name, u.role, u.user_thumbnail_image, u.user_id, ms.channel_status, ms.created_at AS seen_at "
               + " FROM message_seen ms USE INDEX (`user message`) JOIN user_to_channel utc ON ms.channel_id = utc.channel_id  AND "
               + " ms.user_id = utc.user_id AND ms.user_id != ?  AND ms.channel_id = ? AND ms.message_id >= ? JOIN user_to_workspace u ON "
               + " ms.user_id = u.user_id GROUP BY ms.user_id HAVING channel_status = 'DEFAULT' ORDER BY seen_at DESC LIMIT ?,? ";

  const queryObj = {
    query: query,
    args: [opts.user_id, opts.channel_id, opts.message_id, opts.page_start, opts.page_end],
    event: "getMessageSeenBy"
  };

  try {
    return await slaveDbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function getThreadMessageSeenBy(logHandler, opts) {
  const query = `SELECT
         MIN(ms.id) AS id,
         u.full_name,
         u.role,
         user_thumbnail_image,
         ms.created_at AS seen_at
     FROM
         message_seen ms
     JOIN user_to_channel utc ON
        ms.channel_id = utc.channel_id  AND ms.user_id = utc.user_id AND ms.user_id != ? AND ms.channel_id = ? AND ms.thread_message_id >= ?
     JOIN user_to_workspace u ON
         ms.user_id = u.user_id
     JOIN thread_user_messages tum ON 
     ms.thread_message_id = tum.thread_message_id AND tum.message_id = ?
     GROUP BY 
         ms.user_id ORDER BY seen_at DESC LIMIT ?,?`;

  const queryObj = {
    query: query,
    args: [opts.user_id, opts.channel_id, opts.thread_message_id, opts.message_id, opts.page_start, opts.page_end],
    event: "getThreadMessageSeenBy"
  };

  try {
    return await slaveDbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function updateMessageSeen(logHandler, opts) {
  let placeHolder = ``;
  const values = [opts.user_id, opts.channel_id];

  if (opts.message_id) {
    placeHolder = `(user_id, channel_id, message_id,channel_status)`;
    values.push(opts.message_id, opts.channel_status || constants.userMessageSeenChannelStatus.DEFAULT);
  } else {
    placeHolder = `(user_id, channel_id, thread_message_id, channel_status)`;
    values.push(opts.thread_message_id, opts.channel_status || constants.userMessageSeenChannelStatus.DEFAULT);
  }

  const query = `INSERT IGNORE INTO message_seen (user_id, channel_id, message_id,channel_status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE channel_status = ?`;
  let queryObj = {
    query,
    args: [opts.user_id, opts.channel_id, opts.message_id, opts.channel_status, opts.channel_status],
    event: "updateMessageSeen"
  };

  try {
    return dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function getThreadMeesageSeenByCount(logHandler, opts) {
  const query = `SELECT
             u.user_id,
             ms.channel_status
     FROM
         message_seen ms
     JOIN user_to_channel utc ON
        ms.channel_id = utc.channel_id  AND ms.user_id = utc.user_id AND ms.user_id != ? AND ms.channel_id = ? AND ms.thread_message_id >= ?
     JOIN user_to_workspace u ON
         ms.user_id = u.user_id
     JOIN thread_user_messages tum ON 
     ms.thread_message_id = tum.thread_message_id AND tum.message_id = ?
     GROUP BY 
         ms.user_id `;

  const queryObj = {
    query: query,
    args: [opts.user_id, opts.channel_id, opts.thread_message_id, opts.message_id],
    event: "getThreadMeesageSeenByCount"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}

async function getMeesageSeenByCount(logHandler, opts) {
  const query = `SELECT
             u.user_id,
             ms.channel_status
         FROM
             message_seen ms
         JOIN user_to_channel utc ON
            ms.channel_id = utc.channel_id  AND ms.user_id = utc.user_id AND ms.user_id != 2106523  AND ms.channel_id = 502564 AND ms.message_id >= 380948173
         JOIN user_to_workspace u ON
             ms.user_id = u.user_id
         GROUP BY
            ms.user_id HAVING channel_status = "DEFAULT"  
             `;

  const queryObj = {
    query: query,
    args: [opts.user_id, opts.channel_id, opts.message_id],
    event: "getMeesageSeenByCount"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}







function suspendUsersOfUserToChannel(logHandler, userList, channel_id) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE user_to_channel utc JOIN channels c on utc.channel_id = c.channel_id SET utc.status = 2 WHERE utc.user_id in (?) AND c.custom_label IN (?) AND c.chat_type = 8`;
    let queryObj = {
      query: query,
      args: [userList, channel_id],
      event: "suspendUsersOfUserToChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

async function getUserAllChannels(logHandler, opts) {
  let placeHolder = ``;
  let values = [opts.user_id];
  if(opts.channel_id) {
    placeHolder = ` AND utc.channel_id = ? `
    values.push(opts.channel_id);
  }
  const query = `SELECT c.channel_id, last_message_id, c.custom_label, c.chat_type FROM  user_to_channel utc JOIN channels c ON utc.channel_id = c.channel_id WHERE utc.user_id = ? ${placeHolder} AND	utc.status = 1 AND c.status = 1 `;

  const queryObj = {
    query: query,
    args: values,
    event: "getUserAllChannels"
  };

  try {
    return await dbHandler.executeQuery(logHandler, queryObj);
  } catch (error) {
    throw new Error(error);
  }
}


function getAllPinChannels(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let query = `select user_id, notification, role, status, last_read_message_id from user_to_channel where user_id IN (?) and is_pinned = 1 and status IN (1,2)`;
    let queryObj = {
      query: query,
      args: [opts.user_id],
      event: "getAllPinChannels"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function updatePinChannel(logHandler, opts) {
  return new Promise((resolve, reject) => {
    let values;
    if (opts.conversation_status == constants.conversationStatus.PIN_CHAT){
      values = [1, opts.channel_id, opts.user_id]
    } else {
      values = [0, opts.channel_id, opts.user_id]
    }
    let query = `UPDATE user_to_channel set is_pinned = ? where channel_id = ? AND user_id = ?`;
    let queryObj = {
      query: query,
      args: values,
      event: "updatePinChannel"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
function getHrmBotChannelId(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `SELECT uw.user_id, uw.user_unique_key, uc.channel_id
                FROM user_to_workspace uw
                LEFT JOIN user_to_channel uc ON uc.user_id = uw.user_id
                LEFT JOIN channels c ON c.channel_id = uc.channel_id
                WHERE uw.workspace_id = ? AND uw.user_type = ? AND c.owner_id = ?`
    let queryObj = {
      query : query,
      args  : [payload.workspace_id, constants.userType.HRM_BOT, payload.user_id],
      event : "getChannelsId"
    };
    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}
