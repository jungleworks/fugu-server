exports.getObject                  = getObject;

const mqMessageType = {
  MESSAGE : 1
};

exports.mqMessageType = mqMessageType;

function getObject(type) {
  let object;
  switch (type) {
    case mqMessageType.MESSAGE:
      object = getMessageObject(type);
      break;
    default:
      object = {};
  }
  return Object.seal(object);
}

function getMessageObject(type) {
  return {
    mq_message_type : type,
    core_message    : true,
    business_id     : undefined,
    channel_id      : undefined,
    message         : undefined,
    user_id         : undefined,
    user_type       : undefined,
    date_time       : undefined
  };
}


function getPublishObject(type) {
  return {
    mq_message_type : type,
    core_message    : true,
    business_id     : undefined,
    channel_id      : undefined,
    message         : undefined,
    user_id         : undefined,
    user_type       : undefined,
    date_time       : undefined
  };
}


function getAssignmentObject(type) {
  return {
    mq_message_type        : type,
    core_message           : true,
    user_id                : undefined,
    bot_channel_name       : undefined,
    channel_id             : undefined,
    message                : undefined,
    agent_id               : undefined,
    assigned_to            : undefined,
    assigned_by            : undefined,
    label                  : undefined,
    assigned_to_name       : undefined,
    assigned_by_name       : undefined,
    chat_status            : undefined,
    date_time              : undefined,
    assignment_type        : 2,
    message_type           : 2,
    chat_type              : 1,
    isTyping               : 0,
    type                   : 100,
    count_my_chats         : 0,
    count_all_chats        : 0,
    count_unassigned_chats : 0
  };
}
