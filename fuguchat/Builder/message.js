exports.getObject                  = getObject;

const notificationType = {
  MESSAGE : 1,
  BUTTON  : 14
};

exports.notificationType = notificationType;

function getObject(type) {
  let object;
  switch (type) {
    case notificationType.MESSAGE:
      object = getMessageObject();
      break;
      case notificationType.BUTTON:
      object = getButtonObject();
      break;

    default:
      object = {};
  }
  return Object.seal(object);
}

function getButtonObject() {
  return {
    attempts : undefined,
    message  : {
      channel  : undefined,
      clientId : undefined,
      data     : {
        server_push    :0,
        is_thread_message:false,
        is_web          :true,
        date_time      : undefined,
        full_name      : undefined,
        index          : undefined,
        is_typing      : 0,
        message        : undefined,
        message_status : 0,
        message_type   : 14,
        user_id        : undefined,
        user_type      : undefined,
        muid           : undefined     
      },
      id : undefined,
      custom_actions : {
        title :undefined,
        is_action_taken :  true
    }
    },
    options : {
      attempts : undefined,
      deadline : undefined,
      interval : undefined,
      timeout  : undefined
    },
   
  };
}


function getMessageObject() {
  return {
    attempts : undefined,
    message  : {
      channel  : undefined,
      clientId : undefined,
      data     : {
        date_time      : undefined,
        full_name      : undefined,
        index          : undefined,
        is_typing      : 0,
        message        : undefined,
        message_status : 0,
        message_type   : 1,
        user_id        : undefined,
        user_type      : undefined,
        muid           : undefined,
        image_url      : undefined,
        thumbnail_url  : undefined
      },
      id : undefined
    },
    options : {
      attempts : undefined,
      deadline : undefined,
      interval : undefined,
      timeout  : undefined
    }
  };
}
