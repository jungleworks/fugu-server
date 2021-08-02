exports.getObject                  = getObject;

const notificationType = {
  MESSAGE                   : 1,
  CLEAR_CHAT                : 2,
  DELETE_MESSAGE            : 3,
  NEW_WORKSPACE             : 5,
  READ_ALL                  : 6,
  REMOVE_USER               : 7,
  CHANGE_GROUP_INFO         : 8,
  ADD_MEMBER                : 9,
  READ_UNREAD_NOTIFICATION  : 10,
  VIDEO_CALL                : 12,
  AUDIO_CALL                : 13,
  EDIT_MESSAGE              : 14,
  SESSION_EXPIRED           : 15,
  VIDEO_CONFERENCE          : 16,
  MISSED_CALL               : 17,
  VIDEO_CONFERENCE_HUNG_UP  : 19,
  CALLING_CONFERENCE        : 20,
  HANGOUTS_CALL_NOTIFICATION: 21,
  ASSIGN_TASK               : 22,
  SCHEDULE_MEETING          : 23
};

exports.notificationType = notificationType;

function getObject(type) {
  let object;
  switch (type) {
    case notificationType.MESSAGE:
      object = getMessageObject(type);
      break;
    case notificationType.CLEAR_CHAT:
      object = clearChatObj(type);
      break;
    case notificationType.DELETE_MESSAGE:
      object = deleteMessage(type);
      break;
    case notificationType.NEW_WORKSPACE:
      object = getNewWorkspaceObj(type);
      break;
    case notificationType.READ_ALL:
      object = getReadAllObject(type);
      break;
    case notificationType.REMOVE_USER:
      object = removeUser(type);
      break;
    case notificationType.CHANGE_GROUP_INFO:
      object = changeGroupInfo(type);
      break;
    case notificationType.ADD_MEMBER:
      object = addMemberObj(type);
      break;
    case notificationType.READ_UNREAD_NOTIFICATION:
      object = getNotificationObj(type);
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
    case notificationType.VIDEO_CONFERENCE_HUNG_UP:
      object = getVideoConferenceHungUpObj(type);
      break;
     case notificationType.CALLING_CONFERENCE:
      object = getCallingConferenceObject(type)
      break;
    case notificationType.HANGOUTS_CALL_NOTIFICATION:
      object = getVideoConferenceObj(type);
      break;  
    case notificationType.ASSIGN_TASK:
      object = getMessageObject(type);
    case notificationType.SCHEDULE_MEETING:
      object = getMessageObject(type);
      break;  
    default:
      object = {};
  }
  return Object.seal(object);
}

function getMessageObject(type) {
  return {
    notification_type        : type,
    server_push              : true,
    channel_id               : undefined,
    muid                     : undefined,
    message                  : undefined,
    full_name                : undefined,
    user_id                  : undefined,
    user_unique_key          : undefined,
    user_type                : undefined,
    agent_id                 : undefined,
    agent_name               : undefined,
    last_sent_by_id          : undefined,
    last_sent_by_full_name   : undefined,
    last_sent_by_user_type   : undefined,
    label                    : undefined,
    channel_image            : undefined,
    members_info             : [],
    channel_thumbnail_url    : undefined,
    chat_status              : undefined,
    bot_channel_name         : undefined,
    date_time                : undefined,
    message_type             : 1,
    chat_type                : 1,
    isTyping                 : 0,
    type                     : 100,
    user_thumbnail_image     : undefined,
    is_thread_message        : false,
    image_url                : undefined,
    unread_notification_count: undefined,
    thumbnail_url            : undefined,
    custom_label             : undefined,
    app_secret_key           : undefined,
    update_notification_count: undefined,
    domain                   : undefined,
    question                 : undefined,
    comment                  : undefined,
    multiple_select          : undefined,
    expire_time              : undefined,
    poll_options             : undefined,
    url                      : undefined,
    file_size                : undefined,
    custom_actions           : undefined,
    default_text_field       : undefined,
    file_name                : undefined,
    document_type            : undefined,
    thread_muid              : undefined,
    is_web                   : undefined,
    message_id               : undefined,
    image_height             : undefined,
    image_width              : undefined,
    workspace                : undefined,
    username                 : undefined,
    notification             : undefined,
    only_admin_can_message   : undefined,
    business_id              : undefined,
    business_name            : undefined,
    push_message             : undefined,
    noti_msg                 : undefined,
    hasCaption               : undefined,
    title                    : undefined,
    showpush                 : undefined,
    last_notification_id     : undefined,
    tagged_users             : undefined,
    new_message              : undefined,
    device_id                : undefined,
    android_device_id        : undefined,
    image_url_100x100        : undefined,
    user_image_50x50         : undefined,
    hrm_bot_type             : undefined,
    play_sound               : true
  };
}

function getReadAllObject(type) {
  return {
    notification_type : type,
    server_push       : true,
    user_id           : undefined,
    user_type         : undefined,
    channel_id        : undefined,
    domain            : undefined,
    app_secret_key    : undefined
  };
}

function clearChatObj(type) {
  return {
    notification_type : type,
    server_push       : true,
    channel_id        : undefined,
    user_id           : undefined,
    muid              : undefined,
    thread_muid       : undefined,
    app_secret_key    : undefined,
    domain            : undefined
  };
}

function deleteMessage(type) {
  return {
    notification_type : type,
    server_push       : true,
    channel_id        : undefined,
    user_id           : undefined,
    muid              : undefined,
    thread_muid       : undefined,
    app_secret_key    : undefined,
    domain            : undefined
  };
}

function getNewWorkspaceObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    user_unique_key           : undefined,
    app_secret_key            : undefined,
    update_notification_count : undefined,
    domain                    : undefined
  };
}


function removeUser(type) {
  return {
    notification_type     : type,
    server_push           : true,
    user_id               : undefined,
    channel_id            : undefined,
    label                 : undefined,
    custom_label          : undefined,
    chat_type             : undefined,
    muid                  : undefined,
    message               : undefined,
    message_type          : undefined,
    channel_thumbnail_url : undefined,
    removed_user_id       : undefined,
    date_time             : undefined,
    members_info          : [],
    app_secret_key        : undefined,
    domain                : undefined,
    only_admin_can_message : undefined
  };
}

function changeGroupInfo(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    muid                      : undefined,
    message_type              : undefined,
    user_id                   : undefined,
    user_unique_key           : undefined,
    is_deleted_group : undefined,
    chat_type                 : undefined,
    channel_id                : undefined,
    channel_thumbnail_url     : undefined,
    channel_image             : undefined,
    custom_label              : undefined,
    app_secret_key            : undefined,
    update_notification_count : undefined,
    user_ids_to_remove_admin  : undefined,
    user_ids_to_make_admin    : undefined,
    is_chat_type_changed      : undefined,
    domain                    : undefined,
    date_time                 : undefined,
    only_admin_can_message : undefined
  };
}


function addMemberObj(type) {
  return {    
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
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
    added_member_info         : undefined,
    app_secret_key            : undefined,
    update_notification_count : undefined,
    domain                    : undefined,
    only_admin_can_message: undefined
  };
}

function getNotificationObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    unread_notification_count : 0,
    domain                    : undefined
  };
}

function getVideoObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    app_secret_key            : undefined,
    video_call_type           : undefined,
    user_id                   : undefined,
    full_name                 : undefined,
    sdp                       : undefined,
    reason                    : undefined,
    rtc_candidate             : undefined,
    muid                      : undefined,
    user_thumbnail_image      : undefined,
    channel_id                : undefined,
    device_id                 : undefined,
    date_time                 : undefined,
    channel_id                : undefined,
    stop_screen_share         : undefined,
    is_screen_share           : undefined,
    device_type               : undefined,
    call_type                 : undefined,
    domain                    : undefined,
    message_type              : undefined,
    invite_link               : undefined,
    hungup_type               : undefined,
    refresh_call: undefined,
    user_unique_key: undefined
  };
}
function getAudioCallObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    app_secret_key            : undefined,
    video_call_type           : undefined,
    user_id                   : undefined,
    full_name                 : undefined,
    sdp                       : undefined,
    stop_screen_share         : undefined,
    rtc_candidate             : undefined,
    reason                    : undefined,
    muid                      : undefined,
    user_thumbnail_image      : undefined,
    channel_id                : undefined,
    device_id                 : undefined,
    date_time                 : undefined,
    channel_id                : undefined,
    is_screen_share           : undefined,
    message_type              : undefined,
    device_type               : undefined,
    call_type                 : undefined,
    domain                    : undefined,
    invite_link               : undefined,
    hungup_type               : undefined,
    refresh_call: true,
    user_unique_key: undefined
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
    message_type              : undefined,
    is_thread_message         : undefined,
    domain                    : undefined,
    date_time                 : undefined
  };
}

function getSessionExpiredObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    user_unique_key           : undefined,
    app_secret_key            : undefined,
    showpush                  : undefined,
    domain                    : undefined
  };
}


function getVideoConferenceObj(type) {
  return {
    notification_type         : type,
    server_push               : true,
    message                   : undefined,
    caller_text               : undefined,
    noti_msg                  : undefined,
    play_sound                : false,
    message_type              : undefined,
    push_message              : undefined,
    user_unique_key           : undefined,
    muid                      : '',
    title                     : undefined,
    user_id                   : undefined,
    channel_id                : undefined,
    label                     : undefined,
    date_time                 : undefined,
    chat_type                 : undefined,
    flag                      : 21,
    showpush                  : 1,   // ios
    deepindex                 : -1,
    image                     : "",
    // backward compatibility
    label_id                  : undefined,
    full_name                 : undefined,
    new_message               : undefined,
    invite_link               : undefined,
    unread_count              : 0,
    last_sent_by_full_name    : undefined,
    last_sent_by_id           : undefined,
    last_sent_by_user_type    : undefined,
    channel_image             : undefined,
    app_secret_key            : undefined,
    is_thread_message         : undefined,
    body                      : undefined,
    icon                      : "https://s3.ap-south-1.amazonaws.com/fuguchat/images/fugu-icon.png",
    domain                    : undefined,
    user_type                 : undefined,
    business_id               : undefined,
    business_name             : undefined,
    custom_actions            : undefined,
    is_audio_conference:undefined,
    sender_user_id : undefined
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

function getVideoConferenceHungUpObj(type) {
  return {
    notification_type: type,
    server_push      : true,
    message          : undefined,
    message_type     : undefined,
    workspace        : undefined,
    push_message     : undefined,
    user_unique_key  : undefined,
    muid             : '',
    title            : undefined,
    user_id          : undefined,
    channel_id       : undefined,
    label            : undefined,
    date_time        : undefined,
    chat_type        : undefined,
    // flag                      : 21,
    showpush: 1,   // ios
    //deepindex                 : -1,
    image: "",
    // backward compatibility
    label_id              : undefined,
    caller_text           : undefined,
    new_message           : undefined,
    invite_link           : undefined,
    full_name             : undefined,
    unread_count          : 0,
    last_sent_by_full_name: undefined,
    last_sent_by_id       : undefined,
    last_sent_by_user_type: undefined,
    channel_image         : undefined,
    app_secret_key        : undefined,
    is_thread_message     : undefined,
    body                  : undefined,
    icon                  : undefined,
    domain                : undefined,
    user_type             : undefined,
    business_id           : undefined,
    business_name         : undefined
  };
}

function getCallingConferenceObject(type) {
  return {
    notification_type: type,
    server_push      : true,
    message          : undefined,
    caller_text      : undefined,
    message_type     : undefined,
    push_message     : undefined,
    user_unique_key  : undefined,
    muid             : '',
    title            : undefined,
    user_id          : undefined,
    channel_id       : undefined,
    label            : undefined,
    date_time        : undefined,
    chat_type        : undefined,
    flag             : 21,
    showpush         : 1,           // ios
    deepindex        : -1,
    image            : "",
    // backward compatibility
    label_id              : undefined,
    full_name             : undefined,
    new_message           : undefined,
    invite_link           : undefined,
    unread_count          : 0,
    last_sent_by_full_name: undefined,
    last_sent_by_id       : undefined,
    last_sent_by_user_type: undefined,
    channel_image         : undefined,
    app_secret_key        : undefined,
    is_thread_message     : undefined,
    body                  : undefined,
    icon                  : "https://s3.ap-south-1.amazonaws.com/fuguchat/images/fugu-icon.png",
    domain                : undefined,
    user_type             : undefined,
    business_id           : undefined,
    business_name         : undefined,
    custom_actions        : undefined,
    is_audio_conference   : undefined,
    sender_user_id        : undefined,
    video_call_type       : undefined,
    call_type             : undefined,
    device_id             : undefined,
    user_thumbnail_image  : undefined
  };
}

exports.controlChannelEvent = {
   1 : "message",
   2 : "clear_chat",
   3 : "delete_message",
   5 : "new_workspace",
   6 : "read_all",
   7 : "remove_member",
   8 : "change_group_info",
   9 : "add_member",
   10: "read_unread_notification",
   12: "video_call",
   13: "audio_call",
   14: "edit_message",
   15: "session_expired",
   16: "video_conference",
   17: "missed_call",
   19: "video_conference_hungup",
   20: "calling",
   21: "hangouts_call",
   22: "assign_task",
   23: "schedule_meeting"
};
exports.controlChannelForConversationUpdate = {
  "PIN_CHAT"  : "pin_chat",
  "UNPIN_CHAT": "unpin_chat"
}