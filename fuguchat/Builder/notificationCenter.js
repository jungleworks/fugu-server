const utils                         = require('../Utils/commonFunctions');

exports.getObjectBasedOnNotificationTypes = getObjectBasedOnNotificationTypes;


function freeze(object) {
  return Object.freeze(object);
}

const notificationType = {
  MESSAGE           : 1,
  NEW_WORKSPACE     : 5,
  CHANGE_GROUP_INFO : 8,
  ADD_MEMBER        : 9,
  EDIT_MESSAGE      : 14,
  ASSIGN_TASK       : 22,
  SCHEDULE_MEETING  : 23
};

exports.allowedNotificationTypesToBeSaved = freeze(utils.getAllKeysFromMap(notificationType));


exports.notificationType = notificationType;

function getObjectBasedOnNotificationTypes(type) {
  let object;
  switch (type) {
    case notificationType.MESSAGE:
      object = getMessageKeys(type);
      break;
    case notificationType.NEW_WORKSPACE:
      object = addWorkspace(type);
      break;
    case notificationType.CHANGE_GROUP_INFO:
      object = getChangeGroupKeys(type);
      break;
    case notificationType.ADD_MEMBER:
      object = addMemberKeys(type);
      break;
    case notificationType.EDIT_MESSAGE:
      object = getMessageKeys(type);
      break;
    case notificationType.ASSIGN_TASK:
      object = assignTask(type);
    case notificationType.SCHEDULE_MEETING:
      object = assignTask(type);
      break;  

    default:
      object = {};
  }
  return Object.seal(object);
}

function getMessageKeys(type) {
  return {
    notification_type    : type,
    message              : undefined,
    notification_title   : undefined,
    muid                 : undefined,
    thread_muid          : undefined,
    action_by_user_id    : undefined,
    action_by_user_image : undefined,
    channel_image        : undefined,
    chat_type            : undefined,
    user_id              : undefined,
    user_unique_key      : undefined,
    channel_id           : undefined,
    app_secret_key       : undefined,
    action_by_user_name  : undefined,
    is_tagged            : undefined
  };
}

function addWorkspace(type) {
  return {
    notification_type    : type,
    message              : undefined,
    notification_title   : undefined,
    user_id              : undefined,
    user_unique_key      : undefined,
    action_by_user_id    : undefined,
    action_by_user_image : undefined,
    action_by_user_name  : undefined,
    business_image       : undefined,
    app_secret_key       : undefined
  };
}

function getChangeGroupKeys(type) {
  return {
    notification_type    : type,
    notification_title   : undefined,
    action_by_user_id    : undefined,
    action_by_user_image : undefined,
    action_by_user_name  : undefined,
    user_id              : undefined,
    user_unique_key      : undefined,
    chat_type            : undefined,
    channel_id           : undefined,
    channel_image        : undefined,
    message              : undefined,
    muid                 : undefined,
    app_secret_key       : undefined
  };
}

function addMemberKeys(type) {
  return {
    notification_type    : type,
    notification_title   : undefined,
    action_by_user_id    : undefined,
    action_by_user_image : undefined,
    user_id              : undefined,
    user_unique_key      : undefined,
    channel_image        : undefined,
    channel_id           : undefined,
    chat_type            : undefined,
    message              : undefined,
    action_by_user_name  : undefined,
    muid                 : undefined,
    app_secret_key       : undefined
  };
}

function assignTask(type) {
  return {
    notification_type    : type,
    notification_title   : undefined,
    action_by_user_id    : undefined,
    action_by_user_image : undefined,
    user_id              : undefined,
    user_unique_key      : undefined,
    channel_image        : undefined,
    channel_id           : undefined,
    chat_type            : undefined,
    message              : undefined,
    action_by_user_name  : undefined,
    app_secret_key       : undefined
  };
}