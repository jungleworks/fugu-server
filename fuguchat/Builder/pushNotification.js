
exports.getObject                  = getObject;


const notificationType = {
  NOTIFICATION             : 0,  // default object used as wrapper for push notification
  MESSAGE                  : 1,
  CLEAR_CHAT               : 2,
  DELETE_MESSAGE           : 3,
  FIRE_BASE                : 4,
  NEW_WORKSPACE            : 5,
  READ_ALL                 : 6,
  REMOVE_USER              : 7,
  CHANGE_GROUP_INFO        : 8,
  ADD_MEMBER               : 9,
  READ_UNREAD_NOTIFICATION : 10,
  TEST_NOTIFICATION        : 11,
  VIDEO_CALL               : 12,
  AUDIO_CALL               : 13,
  EDIT_MESSAGE             : 14,
  SESSION_EXPIRED          : 15,
  VIDEO_CONFERENCE         : 16,
  MISSED_CALL              : 17,
  ANDROID_PUSH_SERVICE     : 18,
  VIDEO_CONFERENCE_HUNG_UP : 19,
  CALLING_CONFERENCE       : 20,
  HANGOUTS_CALL_NOTIFICATION: 21,
  ASSIGN_TASK               : 22,
  SCHEDULE_MEETING          : 23
};
exports.notificationType = notificationType;

function getObject(type) {
  let object;
  switch (type) {
    case notificationType.NOTIFICATION:
      object = getNotificationObject(type);
      break;
    case notificationType.MESSAGE:
      object = getMessageObject(type);
      break;
    case notificationType.CLEAR_CHAT:
      object = getMessageObject(type);
      break;
    case notificationType.DELETE_MESSAGE:
      object = getMessageObject(type);
      break;
    case notificationType.FIRE_BASE:
      object = getFireBaseObject(type);
      break;
    case notificationType.NEW_WORKSPACE:
      object = getNewWorkspaceObj(type);
      break;
    case notificationType.REMOVE_USER:
      object = getRemoveUserObj(type);
      break;
    case notificationType.CHANGE_GROUP_INFO:
      object = getChangeGroupInfo(type);
      break;
    case notificationType.ADD_MEMBER:
      object = addMemberObj(type);
      break;
    case notificationType.READ_UNREAD_NOTIFICATION:
      object = getNotificationObj(type);
      break;
    case notificationType.TEST_NOTIFICATION:
      object = getTestNotificationObject(type);
      break;
    case notificationType.VIDEO_CALL:
      object = getVideoObj(type);
      break;
    case notificationType.AUDIO_CALL:
      object = getAudioCallObj(type);
      break;
    case notificationType.EDIT_MESSAGE:
      object = getEditMessageObj(type);
      break;
    case notificationType.SESSION_EXPIRED:
      object = getSessionExpiredObj(type);
      break;
    case notificationType.VIDEO_CONFERENCE:
      object = getVideoConferenceObj(type);
      break;
    case notificationType.MISSED_CALL:
      object = getMissedCallObj(type);
      break;
    case notificationType.READ_ALL:
      object = getReadAllObject(type);
      break;
    case notificationType.ANDROID_PUSH_SERVICE:
      object = getAndroidServiceObject(type);
      break;
    case notificationType.VIDEO_CONFERENCE_HUNG_UP:
      object = getVideoConferenceHungUpObj(type);
      break;
    case notificationType.CALLING_CONFERENCE:
      object = getCallingConferenceObject(type)
      break;
      case notificationType.HANGOUTS_CALL_NOTIFICATION:
      object = getVideoConferenceObj(type)
      break;
    case notificationType.ASSIGN_TASK:
      object = getMessageObject(type)
    case notificationType.SCHEDULE_MEETING:
      object = getMessageObject(type)
      break;
    default:
      object = {};
  }
  return Object.seal(object);
}

function getNotificationObject(type) {
  return {
    notification_type : type,
    business_id       : undefined,
    push_to           : undefined,
    device_token      : undefined,
    device_type       : undefined,
    app_type          : undefined,
    device_info       : undefined,
    payload           : undefined,
    domain            : undefined,
    user_type         : undefined,
    business_name     : undefined,
    remove_voip       : undefined
  };
}

// logHandler, businessId, pushTo, deviceToken, deviceType,appType,deviceInfo, payload
function getMessageObject(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    message_type              : undefined,
    follow_thread             : undefined,
    push_message              : undefined,
    workspace: undefined,
    user_unique_key           : undefined,
    is_voip_push              : undefined,
    muid                      : '',
    thread_muid               : '',
    title                     : undefined,
    user_id                   : undefined,
    channel_id                : undefined,
    label                     : undefined,
    date_time                 : undefined,
    chat_type                 : undefined,
   // flag                      : 21,
    showpush                  : 1,   // ios
    //deepindex                 : -1,
    image                     : "",
    // backward compatibility
    label_id                  : undefined,
    new_message               : undefined,
    unread_count              : 0,
    last_sent_by_full_name    : undefined,
    last_sent_by_id           : undefined,
    last_sent_by_user_type    : undefined,
    channel_image             : undefined,
    tagged_users              : [],
    app_secret_key            : undefined,
    members_info              : [],
    user_thumbnail_image      : undefined,
    is_thread_message         : undefined,
    attachment_url            : undefined,
    attachment_thumbnail_url  : undefined,
    update_notification_count : undefined,
    body                      : undefined,
    icon                      : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    image_url         : undefined,
    thumbnail_url     : undefined,
    url               : undefined,
    file_size         : undefined,
    file_name         : undefined,
    document_type     : undefined,
    image_width       : undefined,
    image_height      : undefined,
    image_url_100x100 : undefined,
    message_id        : undefined,
    hasCaption        : undefined,
    noti_msg          : undefined,
    hrm_bot_type      : undefined
  };
}


function getFireBaseObject(type) {
  return {
    notification_type : type,
    server_push       : true,
    title             : undefined,
    body              : undefined,
    channel_id        : undefined,
    thread_muid       : undefined,
    muid              : undefined,
    is_thread_message : undefined,
    app_secret_key    : undefined,
    // click_action      : "https://web.fuguchat.com/#/dashboard",
    icon              : undefined,
    domain            : undefined,
    user_type         : undefined,
    business_id       : undefined,
    business_name     : undefined
  };
}


function getNewWorkspaceObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    workspace:undefined,
    push_message              : undefined,
    title                     : undefined,
    user_id                   : undefined,
    user_unique_key           : undefined,
    showpush                  : 1,   // ios
    app_secret_key            : undefined,
    update_notification_count : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    date_time                 : undefined,
    user_thumbnail_image      : undefined,
    noti_msg: undefined
  };
}


function getRemoveUserObj(type) {
  return {
    notification_type     : type,
    server_push           : true,
    channel_id            : undefined,
    muid                  : undefined,
    message               : undefined,
    user_id               : undefined,
    showpush              : 1,   // ios
    members_info          : [],
    app_secret_key        : undefined,
    chat_type             : undefined,
    message_type          : undefined,
    date_time             : undefined,
    removed_user_id       : undefined,
    channel_thumbnail_url : undefined,
    domain                : undefined,
    user_type             : undefined,
    business_id           : undefined,
    business_name         : undefined
  };
}


function getChangeGroupInfo(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    muid                      : undefined,
    channel_id                : undefined,
    channel_image             : undefined,
    channel_thumbnail_url     : undefined,
    chat_type                 : undefined,
    is_deleted_group : undefined,
    custom_label              : undefined,
    message_type              : undefined,
    user_id                   : undefined,
    user_unique_key           : undefined,
    date_time                 : undefined,
    showpush                  : 1,   // ios
    app_secret_key            : undefined,
    update_notification_count : undefined,
    user_ids_to_remove_admin  : undefined,
    user_ids_to_make_admin    : undefined,
    is_chat_type_changed      : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    only_admin_can_message: undefined,
    business_name: undefined,
    noti_msg: undefined,
    only_admin_can_message : undefined
  };
}

function addMemberObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    new_message               : undefined,
    message_type              : undefined,
    push_message              : undefined,
    muid                      : '',
    title                     : undefined,
    user_id                   : undefined,
    user_unique_key           : undefined,
    channel_id                : undefined,
    label                     : undefined,
    date_time                 : undefined,
    chat_type                 : undefined,
    showpush                  : 1,   // ios
    channel_thumbnail_url     : undefined,
    members_info              : [],
    notification              : undefined,
    custom_label              : undefined,
    app_secret_key            : undefined,
    added_member_info         : undefined,
    update_notification_count : undefined,
    body                      : undefined,
    icon                      : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name: undefined,
    user_thumbnail_image: undefined,
    noti_msg: undefined
  };
}

function getNotificationObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    showpush                  : 0,   // ios
    channel_id                : undefined,
    muid                      : undefined,
    unread_notification_count : undefined,
    date_time                 : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    app_secret_key            : undefined
  };
}

function getTestNotificationObject(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    push_message              : undefined,
    title                     : undefined,
    user_id                   : undefined,
    channel_id                : undefined,
    label                     : undefined,
    date_time                 : undefined,
    chat_type                 : undefined,
  //  flag                      : 21,
    showpush                  : 1,   // ios
   // deepindex                 : -1,
    image                     : "",
    // backward compatibility
    label_id                  : undefined,
    new_message               : undefined,
    unread_count              : 0,
    last_sent_by_full_name    : undefined,
    last_sent_by_id           : undefined,
    last_sent_by_user_type    : undefined,
    app_secret_key            : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined
  };
}

function getVideoObj(type) {
  return {
    notification_type         : type,
    app_secret_key            : undefined,
    video_call_type           : undefined,
    body                      : undefined,
    workspace: undefined,
    title                     : undefined,
    message_type              : undefined,
    user_id                   : undefined,
    full_name                 : undefined,
    muid                      : undefined,
    user_thumbnail_image      : undefined,
    channel_id                : undefined,
    is_silent                 : undefined,
    device_id                 : undefined,
    date_time                 : undefined,
    call_type                 : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    invite_link               : undefined,
    hungup_type               : undefined,
    message                   : undefined
  };
}

function getAudioCallObj(type) {
  return {
    notification_type         : type,
    app_secret_key            : undefined,
    video_call_type           : undefined,
    workspace:undefined,
    body                      : undefined,
    title                     : undefined,
    message_type              : undefined,
    user_id                   : undefined,
    full_name                 : undefined,
    muid                      : undefined,
    user_thumbnail_image      : undefined,
    channel_id                : undefined,
    is_silent                 : undefined,
    device_id                 : undefined,
    date_time                 : undefined,
    call_type                 : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    hungup_type               : undefined,
    message                   : undefined
  };
}

function getEditMessageObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    channel_id                : undefined,
    user_id                   : undefined,
    muid                      : undefined,
    thread_muid               : undefined,
    app_secret_key            : undefined,
    message                   : undefined,
    title                     : undefined,
    full_name                 : undefined,
    update_notification_count : undefined,
    body                      : undefined,
    is_thread_message         : undefined,
    icon                      : undefined,
    push_message              : undefined,
    noti_msg                  : undefined,
    message_type              : undefined,
    showpush                  : undefined,
    date_time                 : undefined,
    tagged_users              : [],
    chat_type                 : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined
  };
}

function getSessionExpiredObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    user_unique_key           : undefined,
    app_secret_key            : undefined,
    showpush                  : 0,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined
  };
}

function getVideoConferenceObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    message_type              : undefined,
    workspace:undefined,
    push_message              : undefined,
    user_unique_key           : undefined,
    muid                      : '',
    title                     : undefined,
    user_id                   : undefined,
    channel_id                : undefined,
    label                     : undefined,
    date_time                 : undefined,
    chat_type                 : undefined,
   // flag                      : 21,
    showpush                  : 1,   // ios
    //deepindex                 : -1,
    image                     : "",
    // backward compatibility
    label_id                  : undefined,
    caller_text               : undefined,
    new_message               : undefined,
    invite_link               : undefined,
    full_name                 : undefined,
    unread_count              : 0,
    last_sent_by_full_name    : undefined,
    last_sent_by_id           : undefined,
    last_sent_by_user_type    : undefined,
    channel_image             : undefined,
    app_secret_key            : undefined,
    is_thread_message         : undefined,
    body                      : undefined,
    icon                      : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    remove_voip               : undefined
  };
}

function getMissedCallObj(type) {
  return {
    notification_type         : type,
    app_secret_key            : undefined,
    video_call_type           : undefined,
    body                      : undefined,
    title                     : undefined,
    message_type              : undefined,
    workspace:undefined,
    user_id                   : undefined,
    full_name                 : undefined,
    muid                      : undefined,
    user_thumbnail_image      : undefined,
    channel_id                : undefined,
    is_silent                 : undefined,
    device_id                 : undefined,
    date_time                 : undefined,
    call_type                 : undefined,
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    hungup_type               : undefined,
    message                   : undefined,
  };
}

function getReadAllObject(type) {
  return {
    notification_type: type,
    server_push: true,
    channel_id: undefined,
    muid: undefined,
    message: undefined,
    user_id: undefined,
    showpush: 1,   // ios
    members_info: [],
    app_secret_key: undefined,
    chat_type: undefined,
    message_type: undefined,
    date_time: undefined,
    removed_user_id: undefined,
    channel_thumbnail_url: undefined,
    domain: undefined,
    user_type: undefined,
    business_id: undefined,
    business_name: undefined
  };
}


function getAndroidServiceObject(type) {
  return {
    notification_type: type,
    message_type: undefined,
    follow_thread: undefined,
    push_message: undefined,
    workspace: undefined,
    user_unique_key: undefined,
    muid: '',
    thread_muid: '',
    title: undefined,
    user_id: undefined,
    channel_id: undefined,
    label: undefined,
    date_time: undefined,
    chat_type: undefined,
    label_id: undefined,
    new_message: undefined,
    last_sent_by_full_name: undefined,
    last_sent_by_id: undefined,
    last_sent_by_user_type: undefined,
    channel_image: undefined,
    app_secret_key: undefined,
    user_thumbnail_image: undefined,
    is_thread_message: undefined,
    attachment_url: undefined,
    attachment_thumbnail_url: undefined,
    update_notification_count: undefined,
    body: undefined,
    domain: undefined,
    user_type: undefined,
    business_id: undefined,
    business_name: undefined,
    image_url: undefined,
    thumbnail_url: undefined,
    url: undefined,
    file_size: undefined,
    file_name: undefined,
    document_type: undefined,
    image_width: undefined,
    image_height: undefined,
    image_url_100x100: undefined,
    message_id: undefined,
    hasCaption: undefined,
    noti_msg: undefined,
    save_push : true,
    push_type: undefined,
    tagged_users: undefined,
    domain_id: undefined,
    notification: undefined
  };
}

function getVideoConferenceHungUpObj(type) {
  return {
    notification_type: type,
    server_push: true,
    message: undefined,
    message_type: undefined,
    workspace: undefined,
    push_message: undefined,
    user_unique_key: undefined,
    muid: undefined,
    title: undefined,
    user_id: undefined,
    channel_id: undefined,
    label: undefined,
    date_time: undefined,
    chat_type: undefined,
    // flag                      : 21,
    showpush: 1,   // ios
    //deepindex                 : -1,
    image: "",
    // backward compatibility
    label_id: undefined,
    caller_text: undefined,
    new_message: undefined,
    message_id: undefined,
    full_name: undefined,
    unread_count: 0,
    last_sent_by_full_name: undefined,
    last_sent_by_id: undefined,
    last_sent_by_user_type: undefined,
    channel_image: undefined,
    app_secret_key: undefined,
    is_thread_message: undefined,
    body: undefined,
    icon: undefined,
    domain: undefined,
    user_type: undefined,
    business_id: undefined,
    business_name: undefined
  };
}

function getCallingConferenceObject(type) {
  return {
    notification_type: type,
    server_push: true,
    message: undefined,
    caller_text: undefined,
    message_type: undefined,
    push_message: undefined,
    user_unique_key: undefined,
    muid: '',
    title: undefined,
    user_id: undefined,
    channel_id: undefined,
    label: undefined,
    date_time: undefined,
    chat_type: undefined,
    flag: 21,
    showpush: 1,   // ios
    deepindex: -1,
    image: "",
    // backward compatibility
    label_id: undefined,
    full_name: undefined,
    new_message: undefined,
    invite_link: undefined,
    unread_count: 0,
    last_sent_by_full_name: undefined,
    last_sent_by_id: undefined,
    last_sent_by_user_type: undefined,
    channel_image: undefined,
    app_secret_key: undefined,
    is_thread_message: undefined,
    body: undefined,
    icon: "https://s3.ap-south-1.amazonaws.com/fuguchat/images/fugu-icon.png",
    domain: undefined,
    user_type: undefined,
    business_id: undefined,
    business_name: undefined,
    custom_actions: undefined,
    device_id:undefined,
    is_audio_conference: undefined,
    sender_user_id: undefined,
    call_type: undefined,
    video_call_type: undefined,
    user_thumbnail_image: undefined
  };
}