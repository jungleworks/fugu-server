const commonFunctions = require('../Utils/commonFunctions');


function freeze(object) {
  return Object.freeze(object);
}

exports.serverInitMessage = `
              _,     _   _     ,_
          .-'' /     \\'-'/     \\ ''-.
         /    |      |   |      |    \\
        ;      \\_  _/     \\_  _/      ;
       |         ''         ''         |
       |         Up And Running        |
        ;    .-.   .-.   .-.   .-.    ;
         \\  (   '.'   \\ /   '.'   )  /
          '-.;         V         ;.-'
`;


exports.enumDeviceType = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  WEB: 'WEB'
};

exports.validDevices = ['ANDROID', 'IOS', 'WEB', '1', '2', '3'];

exports.getFuguDeviceType = (deviceType) => {
  if (deviceType == exports.enumDeviceType.ANDROID) {
    return 1;
  }
  if (deviceType == exports.enumDeviceType.IOS) {
    return 2;
  }
  if (deviceType == exports.enumDeviceType.WEB) {
    return 3;
  }
  return 0;
};

exports.getFuguUserStatus = freeze({
  ENABLED: '1',
  DISABLED: '0',
  LEFT: '0',
  INVITED: '1'
});

exports.validDeviceTypes = freeze(commonFunctions.getAllValuesFromMap(exports.enumDeviceType));


exports.notificationFlags = {
  DISPLAY_MESSAGE: 21
};

exports.EMAIL_MAX_SIZE = 60;

exports.MIN_DOTAT = 2;

exports.MAX_INTEGER = Number.MAX_SAFE_INTEGER;

exports.cache = {
  BUSINESS_DETAILS: 'business_details',
  BUSINESS_PROPERTY: 'business_property',
  BUSINESS_DEVICE_MAPPINGS: 'business_device_mappings',
  SERVER_LOGGING: 'server_logging'
};

exports.supportedFileTypes = [
  'image',
  'video',
  'audio',
  'file'
];

exports.supportedFileExtensions = {
  image: ['jpeg', 'jpg', 'png', 'bmp']
};

exports.getUsersPageSize = 100;
exports.getUsersDisplaySize = 10;
exports.getMessagesPageSize = 50;
exports.getConversationsPageSize = 20;
exports.getSearchMessagePageSize = 20;
exports.getNotificationsPageSize = 20;
exports.getStarredMessagesPageSize = 30;
exports.messageSeenByPageSize = 20;

exports.MYSQL_INT_MAX = 2147483647;

exports.fileTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  file: ['application/pdf', 'text/csv', 'text/plain', 'application/vnd.ms-powerpoint', 'application/msword', 'application/vnd.ms-excel', 'text/comma-separated-values', 'application/vnd.android.package-archive', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/x-7z-compressed'],
  audio: ['audio/3gpp', 'audio/mp3', 'audio/midi', 'audio/mpeg', 'audio/x-aiff', 'audio/mpeg', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/wav'],
  video: ['video/webm', 'video/ogg', 'video/3gpp', 'video/mp4', 'video/avi']
};

exports.userReadUnreadMessageTypes = [1, 4, 10, 11, 12, 13, 14, 15];

exports.userType = freeze({
  BOT             : 0,
  CUSTOMER        : 1,
  AGENT           : 2,
  FUGU_BOT        : 3,
  ATTENDANCE_BOT  : 4,
  FUGU_SUPPORT    : 5,
  GUEST           : 6,
  SCRUM_BOT       : 7,
  HRM_BOT         : 8,
  CONFERENCE_BOT  : 9,
  SELF_BOT        : 10
});

exports.messageType = {
  MESSAGE                  : 1,
  NOTE                     : 2,
  PRIVATE_MESSAGE          : 3,
  BUSINESS_SPECIFIC_MESSAGE: 4,
  PUBLIC_NOTE              : 5,
  IMAGE                    : 10,
  FILE_ATTACHMENT          : 11,
  VIDEO                    : 12,
  VIDEO_CALL               : 13,
  BUTTON                   : 14,
  POLL                     : 15,
  CONFERENCE_CALL          : 16
};

exports.messageStatus = freeze({
  SENT: 1,
  DELIVERED: 2,
  READ: 3
});

exports.userVisibleMessageTypes = [1, 4, 5, 10, 11, 12, 13, 14, 15];

exports.getAWSFolder = (mimeType) => {
  const imageTypes = new Set(exports.fileTypes.image);
  const fileTypes = new Set(exports.fileTypes.file);
  if (imageTypes.has(mimeType)) {
    return 'image';
  }
  if (fileTypes.has(mimeType)) {
    return 'file';
  }
  return 'default';
};

exports.FILE_TYPE = {
  IMAGE: 'image',
  FILE: 'file'
};

exports.FUGU_EMAIL = 'fugusales@click-labs.com';

exports.mailSubject = freeze({
  WELCOME_MAIL: "We're delighted to have you! Welcome to Fugu."
});

// exports.enableZlibCompression = true;

exports.defaultAppType = 1;


exports.onlineStatus = freeze({
  ONLINE : 'ONLINE',
  AWAY   : 'AWAY',
  OFFLINE: 'OFFLINE'
});

exports.validOnlineStatuses = freeze(commonFunctions.getAllValuesFromMap(exports.onlineStatus));

exports.userStatus = freeze({
  ENABLED  : 'ENABLED',
  DISABLED : 'DISABLED',
  LEFT     : 'LEFT',
  INVITED  : 'INVITED',
  ENABLE   : 1,
  DISABLE  : 0,
  SUSPENDED: 2
});


exports.status = freeze({
  ENABLED : 'ENABLED',
  DISABLED: 'DISABLED',
  INVITED : 'INVITED',
  ENABLE  : 1,
  DISABLE : 0
});

exports.techSupportMail = 'tech@fuguchat.com';

exports.emailType = {
  REQUEST_MAIL         : 'REQUEST_MAIL',
  USER_INVITATION      : 'USER_INVITATION',
  BUSINESS_SIGNUP      : 'BUSINESS_SIGNUP',
  RESET_PASSWORD       : 'RESET_PASSWORD',
  WELCOME_MAIL         : 'WELCOME_MAIL',
  SEND_DOMAINS_TO_EMAIL: 'SEND_DOMAINS_TO_EMAIL',
  FEEDBACK             : 'FEEDBACK',
  GDPR_QUERY           : 'GDPR_QUERY',
  SIGN_UP              : 'SIGN_UP',
  INVOICE              : 'INVOICE',
  NEW_CONTACT_NUMBER   : 'NEW_CONTACT_NUMBER',
  SIMPLE_TEXT_MAIL     : 'SIMPLE_TEXT_MAIL',
  MESSAGE_MAIL         : 'MESSAGE_MAIL',
  LEAVE_MAIL           : 'LEAVE_MAIL',
  EMAIL_SIGNUP         : 'EMAIL_SIGNUP',
  PAYMENT_REMINDER_MAIL: 'PAYMENT_REMINDER_MAIL',
  SCHEDULE_EMAIL       : 'SCHEDULE_EMAIL'
};

exports.defaultEmailMessageBasedOnMessageType = {
  10: 'Image',
  11: 'File',
  12: 'Video'
};

exports.isOtpExpired = freeze({
  YES: 'YES',
  NO: 'NO'
});

exports.business = freeze({
  OTP_LENGTH: 6,
  USERID_LENGTH: 10,
  SIGNUP_TOKEN_KEY: 'signup_token'
});

exports.businessStatus = freeze({
  ENABLED           : 'ENABLED',
  DISABLED          : 'DISABLED',
  EXPIRED           : 'EXPIRED',
  USER_BASED_TRIAL  : 'USER_BASED_TRIAL',
  PERIOD_BASED_TRIAL: 'PERIOD_BASED_TRIAL'
});

exports.appCriticalVersion = freeze({
  IOS: 132,
  ANDROID: 151
});

exports.appLatestVersion = freeze({
  IOS: 163,
  ANDROID: 175
});

exports.appTempVersion = freeze({
  IOS: 116,
  ANDROID: 126
});

exports.appUpdateMessage = freeze({
  DEFAULT    : 'NO_UPDATE',
  SOFT_UPDATE: 'SOFT_UPDATE',
  HARD_UPDATE: 'HARD_UPDATE'
});

exports.tokenRefreshSecondsDuration = 24 * 60 * 60;

exports.userRole = freeze({
  GUEST       : 'GUEST',
  PAYING_GUETS: 'PAYING_GUETS',
  USER        : 'USER',
  ADMIN       : 'ADMIN',
  OWNER       : 'OWNER',
  MANAGER     : 'MANAGER'
});

exports.userRoleNumber = freeze({
  USER: 1,
  ADMIN: 2,
  OWNER: 3
});

exports.appUpdateLink = freeze({
  IOS: 'https://itunes.apple.com/in/app/fuguchat/id1336986136?mt=8',
  ANDROID: 'https://play.google.com/store/apps/details?id=com.officechat'
});

exports.appUpdateText = freeze({
  IOS: 'A new version of the app_name App is now available. To ensure the best experience, please update it now from App store.',
  ANDROID: 'A new version of the app_name App is now available. To ensure the best experience, please update it now from Google Play.'
});

exports.allowedWorkspaceStatus = {
  ENABLED           : 'ENABLED',
  DISABLED          : 'DISABLED',
  EXPIRED           : 'EXPIRED',
  USER_BASED_TRIAL  : 'USER_BASED_TRIAL',
  PERIOD_BASED_TRIAL: 'PERIOD_BASED_TRIAL',

};

exports.disallowWorkspaceEmail = ['aol.com', 'att.net', 'comcast.net', 'facebook.com', 'gmail.com', 'gmx.com', 'googlemail.com',
  'google.com', 'hotmail.com', 'hotmail.co.uk', 'mac.com', 'me.com', 'mail.com', 'msn.com',
  'live.com', 'sbcglobal.net', 'verizon.net', 'yahoo.com', 'yahoo.co.uk', 'fuguchat.com'];

exports.inviationType = freeze({
  PUBLIC_INVITATION: 'PUBLIC_INVITATION',   // public invite enabled or not
  OPEN_INVITATION  : 'OPEN_INVITATION',     // @domains.com
  ALREADY_INVITED  : 'ALREADY_INVITED'
});

exports.allowedInviationTypeEnum = freeze(
  commonFunctions.getAllValuesFromMap(exports.inviationType)
);

exports.expired = freeze({
  YES: 'YES',
  NO: 'NO'
});

exports.countryCodes = freeze([
  'US', 'AG', 'AI', 'AS', 'BB', 'BM', 'BS', 'CA', 'DM', 'DO', 'GD', 'GU', 'JM', 'KN', 'KY', 'LC', 'MP', 'MS', 'PR', 'SX',
  'TC', 'TT', 'VC', 'VG', 'VI', 'RU', 'KZ', 'EG', 'ZA', 'GR', 'NL', 'FR', 'ES', 'HU', 'IT', 'VA', 'RO', 'CH', 'AT',
  'GB', 'GG', 'IM', 'JE', 'DK', 'SE', 'NO', 'SJ', 'PL', 'DE', 'PE', 'MX', 'CU', 'AR', 'BR', 'CL', 'CO', 'VE', 'MY', 'AU',
  'CC', 'CX', 'ID', 'PH', 'NZ', 'SG', 'TH', 'JP', 'KR', 'VN', 'CN', 'TR', 'IN', 'PK', 'AF', 'LK', 'MM', 'IR', 'SS', 'MA',
  'EH', 'DZ', 'TN', 'LY', 'GM', 'SN', 'MR', 'ML', 'GN', 'CI', 'BF', 'NE', 'TG', 'BJ', 'MU', 'LR', 'SL', 'GH', 'NG', 'TD',
  'CF', 'CM', 'CV', 'ST', 'GQ', 'GA', 'CG', 'CD', 'AO', 'GW', 'IO', 'AC', 'SC', 'SD', 'RW', 'ET', 'SO', 'DJ', 'KE', 'TZ',
  'UG', 'BI', 'MZ', 'ZM', 'MG', 'RE', 'YT', 'ZW', 'NA', 'MW', 'LS', 'BW', 'SZ', 'KM', 'SH', 'TA', 'ER', 'AW', 'FO', 'GL',
  'GI', 'PT', 'LU', 'IE', 'IS', 'AL', 'MT', 'CY', 'FI', 'AX', 'BG', 'LT', 'LV', 'EE', 'MD', 'AM', 'BY', 'AD', 'MC', 'SM',
  'UA', 'RS', 'ME', 'XK', 'HR', 'SI', 'BA', 'MK', 'CZ', 'SK', 'LI', 'FK', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'PM',
  'HT', 'GP', 'BL', 'MF', 'BO', 'GY', 'EC', 'GF', 'PY', 'MQ', 'SR', 'UY', 'CW', 'BQ', 'TL', 'NF', 'BN', 'NR', 'PG', 'TO',
  'SB', 'VU', 'FJ', 'PW', 'WF', 'CK', 'NU', 'WS', 'KI', 'NC', 'TV', 'PF', 'TK', 'FM', 'MH', '001', 'KP', 'HK', 'MO', 'KH',
  'LA', 'BD', 'TW', 'MV', 'LB', 'JO', 'SY', 'IQ', 'KW', 'SA', 'YE', 'OM', 'PS', 'AE', 'IL', 'BH', 'QA', 'BT', 'MN', 'NP',
  'TJ', 'TM', 'AZ', 'GE', 'KG', 'UZ', 'NZ'
]);

exports.thumbnailMaxDimensionSize = 400;
exports.image_100x100             = 100;
exports.image_50x50               = 50;
exports.generalChatName           = '#Announcements';
exports.generalChatIntroMessage   = 'Welcome to ';

exports.API_END_POINT = freeze({
  NOTIFY_USERS              : '/api/fugu/notifyUsers',
  CREATE_GROUP              : '/api/chat/createGroupChat',
  ADD_MEMBER                : '/api/chat/addMember',
  REMOVE_MEMBER             : '/api/chat/removeMember',
  EDIT_INFO                 : '/api/chat/editInfo',
  GET_GROUP_INFO            : '/api/chat/getGroupInfo',
  DELETE_FROM_CHANNEL       : '/api/chat/deleteUsersFromChannel',
  UPDATE_APP_STATE          : '/api/apps/edit',
  ATTENDANCE_CLOCK_IN       : '/api/attendance/clockIn',
  ATTENDANCE_CLOCK_OUT      : '/api/attendance/clockOut',
  ATTENDANCE_TIMESHEET      : '/api/attendance/timesheet',
  ATTENDANCE_TEAM_REPORT    : '/api/attendance/teamPunchStatus',
  ATTENDANCE_MONTHLY_REPORT : '/api/attendance/getMonthlyReport',
  BUSINESS_REPORT           : '/api/attendance/getBusinessReport',
  LEAVE                     : '/api/attendance/leave',
  CHANGE_MANAGER_REQUEST    : '/api/attendance/changeManagerRequest',
  USER_LEAVE_BALANCE        : '/api/attendance/leaveBalance',
  GET_BUSINESS_LEAVES       : '/api/attendance/getBusinessLeaves',
  EDIT_USER_LEAVES          : '/api/attendance/editUserLeaves',
  EDIT_BUSINESS_LEAVE       : '/api/attendance/editBusinessLeave',
  EDIT_USER_INFO            : '/api/attendance/editUserInfo',
  GET_MEMBERS               : '/api/attendance/getMembers',
  EDIT_BUSINESS_INFO        : '/api/attendance/editBusinessInfo',
  GET_BUSINESS_INFO         : '/api/attendance/getBusinessInfo',
  EDIT_USER_PUNCH_STATUS    : '/api/attendance/editUserPunchStatus',
  GET_USERS_WORK_TIMESHEET  : '/api/attendance/getUsersWorkTimesheet',
  UPLOAD_DEFAULT_IMAGE      : '/api/attendance/uploadDefaultImage',
  CREATE_BUSINESS           : '/api/attendance/createBusiness',
  SIGN_UP                   : '/api/attendance/signup',
  INVITE_TO_CONFERENCE      : '/api/conversation/inviteToConference',
  MEMBERS_ON_LEAVE          : '/api/attendance/getMembersOnLeave',
  CREATE_NEW_SCRUM          : '/api/scrum/createNewScrum',
  EDIT_SCRUM_DETAILS        : '/api/scrum/editScrumDetails',
  GET_SCRUM_DETAILS         : '/api/scrum/getScrumDetails',
  CHECK_USER_AVAILABILITY   : '/api/scrum/checkUserAvailability',
  CREATE_SCRUM_BUSINESS     : '/api/scrum/createBusiness',
  INSERT_NEW_USER           : "/api/scrum/insertNewUser",
  INSERT_USER_ANSWER        : "/api/scrum/insertUserAnswer",
  SCRUM_CRON                : "/api/scrum/cron",
  REQUEST_IMPORT            : '/api/conversation/requestData',
  CREATE_STREAM             : '/api/stream/create',
  HRM_MONTHLY_REPORT        : "erpnext.hr.doctype.attendance.attendance.monthly_report",
  HRM_LEAVE_BALANCE         : 'erpnext.hr.doctype.leave_application.leave_application.get_leave_balance',
  HRM_LEAVE_APPLY           : 'erpnext.hr.doctype.leave_application.leave_application.apply_leave',
  HRM_USER_TIMESHEET        : 'erpnext.hr.doctype.attendance.attendance.get_timesheet',
  HRM_LEAVE_ACTION          : 'erpnext.hr.doctype.leave_application.leave_application.approve_leave',
  HRM_GET_LEAVE             : 'erpnext.hr.doctype.leave_application.leave_application.get_leaves',
  HRM_DELETE_LEAVE          : 'erpnext.hr.doctype.leave_application.leave_application.delete_leave',
  HRM_PAY_SLIP              : 'erpnext.hr.doctype.pay_slip.pay_slip.get_payslips',
  HRM_BUSINESS_REPORT       : "erpnext.hr.doctype.attendance.attendance.business_report",
  HRM_TEAM_REPORT           : 'erpnext.hr.doctype.employee.employee.get_team_hierarchy_punch_status',
  CHANGE_MANAGER            : 'erpnext.hr.doctype.attendance.attendance.change_manager',
  HRM_CHANGE_MANAGER_REQUEST: 'erpnext.hr.doctype.attendance.attendance.change_manager_request',
  GET_NEW_MANAGER_EMAIL     : 'erpnext.hr.doctype.attendance.attendance.get_new_manager',
  DOWNLOAD_PAY_SLIP         : 'erpnext.hr.doctype.pay_slip.pay_slip.get_payslip_link',
  UPDATE_PROFILE            : 'frappe.core.doctype.fugu_integration.fugu_integration.update_profile',
  GET_PUNCH_PERMISSION      : 'erpnext.hr.doctype.attendance.attendance.get_punch_auth',
  HRM_CLOCK_IN              : 'erpnext.hr.doctype.attendance.attendance.clockIn',
  HRM_UPLOAD_IMAGE          : 'erpnext.hr.doctype.attendance.attendance.upload_pic',
  HRM_ADD_COMMENT           : 'frappe.desk.form.utils.add_comment'
});

exports.validUserWorkspaceAttributs = new Set(['hide_email', 'hide_contact_number']);

exports.validGdprQueries = freeze({
  FORGOTTEN    : 'FORGOTTEN',
  RESTRICTION  : 'RESTRICTION',
  RECTIFICATION: 'RECTIFICATION',
  PORTABILITY  : 'PORTABILITY'
});

exports.validGdprQueries = freeze(commonFunctions.getAllValuesFromMap(exports.validGdprQueries));

exports.acceptedPolicies = freeze({
  YES: 'YES',
  NO: 'NO'
});

exports.constantHeaders = ['app_secret_key', 'device_type', 'app_version'];

exports.fuguConfiguration = ['clear_chat_history', 'delete_message', 'delete_message_duration', 'delete_message_role', 'edit_message', 'edit_message_duration', 'edit_message_role'];

exports.signUpMode = freeze({
  EMAIL : '1',
  INVITE: '0'
});

exports.workspaceProperties = freeze({
  SIGNUP_MODE: 'signup_mode'
});

exports.propertyStatus = freeze({
  ENABLED: '1',
  DISABLED: '0'
});

exports.getContactTypes = freeze({
  ALL     : 'ALL',
  CONTACTS: 'CONTACTS',
  GROUPS  : 'GROUPS'
});

exports.allowedContactTypes = freeze(commonFunctions.getAllValuesFromMap(exports.getContactTypes));

exports.notificationFor = freeze({
  INVITE_USERS: 'INVITE_USERS'
});

exports.validNotificationType = freeze(
  commonFunctions.getAllValuesFromMap(exports.notificationFor)
);

exports.invitationStatus = freeze({
  EXPIRED    : 'EXPIRED',
  NOT_EXPIRED: 'NOT_EXPIRED',
  RE_INVITED : 'RE_INVITED',
  REVOKED    : 'REVOKED'
});

exports.getMembers = freeze({
  DEFAULT                : "DEFAULT",
  ALL_MEMBERS            : "ALL_MEMBERS",
  INVITED_MEMBERS        : "INVITED_MEMBERS",
  PENDING                : "PENDING",
  ACCEPTED               : "ACCEPTED",
  DEACTIVATED_MEMBERS    : "DEACTIVATED_MEMBERS",
  GUEST_USERS            : "GUEST_USERS",
  GUEST_DEACTIVATED_USERS: "GUEST_DEACTIVATED_USERS",
  SEARCH_GUESTS          : "SEARCH_GUESTS"
});


exports.allowedUserStatus = freeze(commonFunctions.getAllValuesFromMap(exports.userStatus));

exports.allowedInvitationStatus = freeze(
  commonFunctions.getAllValuesFromMap(exports.invitationStatus)
);

exports.allowedMembersType = freeze(commonFunctions.getAllValuesFromMap(exports.getMembers));

exports.fugu_config = freeze({
  supported_file_type      : ['image', 'video', 'audio', 'file'],
  max_upload_file_size     : 104857600,
  socket_timeout           : 90,
  is_new_conference_enabled: 1
});

exports.getMaxResendLimit = 1440;

exports.countConstants = freeze({
  MAX_INVITE_RESEND_COUNT           : 3,
  MAX_PASSWORD_RESET_REQUESTS       : 2,
  MAX_CHANGE_CONTACT_NUMBER_REQUESTS: 2,
  MAX_MAIL_SENT_COUNT               : 5
});

exports.fuguBotMetric = new Set(['salary', 'contact_number', 'workspace_admins', 'workspace admin']);

exports.adminMetric = new Set(['workspace_admin', 'workspace admin']);


exports.deviceTypeLinkKeys = freeze({
  ANDROID: 'android_app_link',
  IOS: 'ios_app_link'
});

exports.deviceTypeLatestVersionKeys = freeze({
  ANDROID: 'android_latest_version',
  IOS: 'ios_latest_version'
});

exports.deviceType = {
  ANDROID: 1,
  IOS: 2,
  WEB: 3
};

exports.deviceTypeEnums = {
  "1": "ANDROID",
  "2": "IOS",
  "3": "WEB"
};

exports.deviceTypeCriticalVersionKeys = freeze({
  ANDROID: 'android_critical_version',
  IOS: 'ios_critical_version'
});

exports.defaultWorkspace = 'spaces';

exports.AUTH_API_END_POINT = freeze({
  REGISTER_USER      : '/jungle/registerUser',
  AUTHENTICATE_USER  : '/authenticate_user',
  GET_USER_DETAILS   : '/get_user_detail',
  VERIFY_PASSWORD    : '/jungle/verifyPassword',
  UPDATE_USER_DETAILS: '/update_user_detail',
  GET_USER_CARD      : '/get_user_card',
  ADD_USER_CARD      : '/billing/addCard',
  MAKE_USER_PAYMENT  : '/make_user_payment',
  SETUP_INTETNT      : '/billing/setupIntent',
  GET_LOGIN_OTP      : '/jungle/getLoginOtp',
  VALIDATE_LOGIN_OTP : '/jungle/validateLoginOtp',
  APPLE_CONNECT      : '/jungle/appleConnect'
});


exports.SERVER_AUTH_CONSTANTS = freeze({
  OFFERING_ID          : '6',
  LONGITUDE            : '30.7333',
  LATITUDE             : '76.7794',
  INTERNAL_USER        : 0,
  SETUP_WIZARD_STEP    : 1,
  LAYOUT_TYPE          : 1,
  COMPANY_ADDRESS      : 'CDCL Building',
  DASHBOARD_VERSION    : 1,
  VERIFICATION_STATUS  : 1,
  FUGU_CHAT_OFFERING_ID: '15',
});

exports.autoDownloadLevel = freeze({
  NONE          : 'NONE',
  WIFI          : 'WIFI',
  MOBILE_NETWORK: 'MOBILE_NETWORK',
  BOTH          : 'BOTH'
});

exports.validAutoDownloadLevel = freeze(
  commonFunctions.getAllValuesFromMap(exports.autoDownloadLevel)
);

exports.fuguBotImageURL = 'https://fuguchat.s3.ap-south-1.amazonaws.com/test/image/B4bkKEmzgN_1535969596640.png';

exports.fuguSupportImageURL = 'https://s3.ap-south-1.amazonaws.com/fuguchat/image/fugu-support.jpg';

//exports.defaultBotName = 'Fugu Bot';

exports.onBoardSource = freeze({
  GOOGLE: 'GOOGLE',
  FUGU: 'FUGU'
});

exports.defaultBotImage = {
  '1' : 'https://fuguchat.s3.ap-south-1.amazonaws.com/test/image/B4bkKEmzgN_1535969596640.png'
}

exports.defaultBotName = {
  '1' : 'Fugu'
};

exports.managerMessageForScrumBot = "Hey, I am ScrumBot and I will be posting questions of your scrum. \n Hot Features🔥 \n - Automate status meetings 🕰.  \n - Track work progress, business metrics, obstacles and team happiness 24x7.\n - Get Summary reports in app_name (DM/channel). \n - Customize questions  to support and improve team culture. \n- Type *'settings'* to make your own scrum. "

exports.maxFreeTrialUsers = 5;
exports.maxFreeTrialUsersForDomain = {
  '1': 50
};

exports.maxFreeTrialDays = 14;

exports.billingPeriod = freeze({
  MONTHLY : 'MONTHLY',
  QUATERLY: 'QUATERLY'
});

exports.planType = freeze({
  PER_USER    : 'PER_USER',
  SUBSCRIPTION: 'SUBSCRIPTION'
});

exports.billingType = freeze({
  FUGU: 'FUGU',
  APP : 'APP'
});

exports.inviteType = freeze({
  USER : 'USER',
  GUEST: 'GUEST',
});


exports.UserStatus = freeze({
  INVITED   : 'INVITED',
  REGISTERED: 'REGISTERED',
  ENABLED   : 'ENABLED'
});

exports.guestMaxDays = 15;

exports.saveNotificationFor = {
  TAGGED_MESSAGE   : true,
  MESSAGE          : false,
  THREAD_MESSAGE   : true,
  INVITE_USERS     : true,
  ADD_MEMBER       : true,
  CHANGE_GROUP_INFO: true,
  CREATE_GROUP     : true,
  MEET_CALL        : true
};

exports.messageType = {
  MESSAGE                  : 1,
  NOTE                     : 2,
  PRIVATE_MESSAGE          : 3,
  BUSINESS_SPECIFIC_MESSAGE: 4,
  PUBLIC_NOTE              : 5,
  IMAGE                    : 10,
  FILE_ATTACHMENT          : 11,
  VIDEO                    : 12,
  VIDEO_CALL               : 13,
  BUTTON                   : 14,
  POLL                     : 15
};


exports.channelType = freeze({
  DEFAULT_CHANNEL: 2,
  FUGU_BOT       : 3,
  DEFAULT        : 4
});

exports.userConversationStatus = freeze({
  DELETED_MESSAGE: 0,
  MESSAGE        : 1,
  CALL_MISSED    : 2,
  CALL_ANSWERED  : 3,
  EDIT_MESSAGE   : 4
});

exports.fieldsBasedOnMessageType = {
  default: [],
  1: ["tagged_user_ids", "tagged_all"],
  2: [],

  // private messages agent to agent
  3: [],

  // custom message type for business, business_flag is business defined property
  4: ['business_flag'],

  // public note
  5: [],

  // image related types 1X
  10: ['file_name', 'file_size', 'image_url_100x100', 'image_url', 'thumbnail_url', 'image_width', 'image_height', 'blur_image_url'],
  11: ['url', 'thumbnail_url', 'file_size', 'file_name', 'document_type'],
  12: ['url', 'thumbnail_url', 'width', 'height', 'file_name', 'file_size'],
  13: ['video_call_start_time', 'video_call_duration', 'call_type'],
  14: ['custom_actions', 'default_text_field', 'start_time', 'end_time', 'message_content', 'link', 'half_day', 'is_first_half'],
  15: ['question', 'comment', 'multiple_select', 'expire_time', 'is_expired']
};

exports.groupChatImageURL = {
  channel_image_url: 'https://fuguchat.s3.ap-south-1.amazonaws.com/default/WwX5qYGSEb_1518441286074.png',
  channel_thumbnail_url: 'https://fuguchat.s3.ap-south-1.amazonaws.com/default/WwX5qYGSEb_1518441286074.png'
};

exports.chatType = freeze({
  DEFAULT         : 0,
  P2P             : 1,
  O20_CHAT        : 2,
  PRIVATE_GROUP   : 3,
  PUBLIC_GROUP    : 4,
  GENERAL_CHAT    : 5,
  DEFAULT_GROUP   : 6,
  FUGU_BOT        : 7,
  RESTRICTED_GROUP: 8,
  CONFERENCE_BOT  : 9
});

exports.regExp = freeze({
  HTML: /<[a-z/][\s\S]*>/i,
  REPLACE_HTML_TAG: /(<([^>]+)>)/ig
});

exports.replaceHtmlTagWith = '';

exports.pushNotificationLevels = {
  ALL_CHATS      : 'ALL_CHATS',
  DIRECT_MESSAGES: 'DIRECT_MESSAGES',
  NONE           : 'NONE'
};

exports.pushNotification = freeze({
  DEFAULT_TITLE: 'Support',
  MUTED        : 'MUTED',
  UNMUTED      : 'UNMUTED',
  TEST_TITLE   : 'Notifications are good to go 👍',
  TEST_MESSAGE : 'This is how our notifications would look like'
});

exports.deviceType = {
  ANDROID: 'ANDROID',
  IOS    : 'IOS',
  WEB    : 'WEB'
};

exports.channelNotification = {
  MUTED          : 'MUTED',
  UNMUTED        : 'UNMUTED',
  DIRECT_MENTIONS: 'DIRECT_MENTIONS'
};

exports.validChannelNotification = freeze(commonFunctions.getAllValuesFromMap(exports.channelNotification));

exports.androidBatchPushLimit = 1000;
exports.getAttachmentPageSize = 20;
exports.getChatMembersPageSize = 50;

exports.AppIdCheck = freeze({
  FUGU_LIVE            : 1,
  TOOKAN_BOT_APP_ID    : 4,
  JIRA_BOT_APP_ID      : 5,
  BITBUCKET_APP_ID     : 6,
  TRELLO_BOT_APP_ID    : 9,
  VIDEO_CONFERENCE     : 8,
  ATTENDANCE_BOT_APP_ID: 7,
  SCRUM_BOT_APP_ID     : 10,
  HRM_APP_ID           : 12
});

exports.appState = freeze({
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED'
});

exports.pushMessage = freeze({
  NEW_GROUP    : ' added you to',
  CREATED_GROUP: ' created a new Group -',
  NEW_WORKSPACE: ' has invited you to join the new space - ',
  MEET_CALL    : ' has invited you to join the call'
});

exports.videoCallResponseTypes = freeze({
  START_CALL                     : 'START_CALL',
  CALL_HUNG_UP                   : 'CALL_HUNG_UP',
  VIDEO_ANSWER                   : 'VIDEO_ANSWER',
  USER_BUSY                      : 'USER_BUSY',
  READY_TO_CONNECT               : 'READY_TO_CONNECT',
  CALL_REJECTED                  : 'CALL_REJECTED',
  VIDEO_OFFER                    : 'VIDEO_OFFER',
  NEW_ICE_CANDIDATE              : 'NEW_ICE_CANDIDATE',
  SWITCH_TO_CONFERENCE           : 'SWITCH_TO_CONFERENCE',
  HOLD_CALL                      : 'HOLD_CALL',
  RESUME_CALL                    : 'RESUME_CALL',
  REFRESH_CALL                   : 'REFRESH_CALL',
  READY_TO_REFRESH               : 'READY_TO_REFRESH',
  START_CONFERENCE               : 'START_CONFERENCE',
  READY_TO_CONNECT_CONFERENCE    : 'READY_TO_CONNECT_CONFERENCE',
  ANSWER_CONFERENCE              : 'ANSWER_CONFERENCE',
  HUNGUP_CONFERENCE              : 'HUNGUP_CONFERENCE',
  OFFER_CONFERENCE               : 'OFFER_CONFERENCE',
  USER_BUSY_CONFERENCE           : 'USER_BUSY_CONFERENCE',
  REJECT_CONFERENCE              : 'REJECT_CONFERENCE',
  START_CONFERENCE_IOS           : 'START_CONFERENCE_IOS',
  READY_TO_CONNECT_CONFERENCE_IOS: 'READY_TO_CONNECT_CONFERENCE_IOS'
});

exports.sendVoipPushForVideoTypes = ['START_CALL', 'CALL_REJECTED', 'CALL_HUNG_UP'];
exports.attendanceMetric = freeze({
  IN               : 'in',
  OUT              : 'out',
  TIMESHEET        : 'timesheet',
  TEAM_REPORT      : 'my team report',
  REPORT           : 'report',
  BUSINESS_REPORT  : 'business report',
  HELP             : 'help',
  MY_MANAGER       : 'my manager',
  OK               : 'ok',
  LEAVE            : 'leave',
  DELETE           : 'delete',
  HOLIDAYS         : 'holiday',
  CHANGE_MY_MANAGER: 'change my manager',
  MY_LEAVE_BALANCE : 'my leave balance',
  QUOTAS           : 'quotas',
  LEAVE_BALANCE    : 'leave balance',
  SETTING          : 'setting',
  EMPLOYEE_CODE    : 'employee code',
  PAYSLIP          : 'pay slip'
});


exports.scrumMetric = freeze({
  SETTING: 'setting',
  HELP: 'help'
});

exports.leaveState = freeze({
  USER_LEAVE_CONFIRMATION       : 'USER_LEAVE_CONFIRMATION',
  MANAGER_LEAVE_APPROVAL        : 'MANAGER_LEAVE_APPROVAL',
  USER_DELETE_LEAVE_CONFIRMATION: 'USER_DELETE_LEAVE_CONFIRMATION',
  LEAVE_TYPE_SELECT             : 'LEAVE_TYPE_SELECT',
  VIDEO_CONFERENCE              : 'VIDEO_CONFERENCE',
  GET_PAY_SLIPS                 : 'GET_PAY_SLIPS'
});

exports.confirmationType = freeze({
  TIME                : 'TIME',
  MEETING_ROOM_CONFIRM: 'MEETING_ROOM_CONFIRM',
  DELETE_MEETING      : 'DELETE_MEETING',
  DEVICE_TYPE         : `DEVICE_TYPE`,
  NOTIFICATION_ISSUE  : 'NOTIFICATION_ISSUE',
  DISABLE_WORKSPACE   : 'DISABLE_WORKSPACE'
});

exports.buttonActionTypes = freeze({
  ACTION_PUBLISH : 'ACTION_PUBLISH',
  MESSAGE_PUBLISH: 'MESSAGE_PUBLISH',
  TEXT_FIELD     : 'TEXT_FIELD'
});

exports.buttonsForLeave = freeze({
  CONFIRM     : 'Confirm',
  CANCEL      : 'Cancel',
  APPROVE     : 'Approve',
  DENY        : 'Deny',
  COMMENT     : 'Add Comment',
  REMARK      : 'Add Remark',
  DELETE      : 'Delete',
  NOT_APPROVED: 'Not Approved',
  JOIN        : 'Join',
  END         : 'End',
  DOWNLOAD    : 'Download'
});

exports.buttonsForMeetingTime = freeze({
  '15' : 15,
  '30' : 30,
  '60' : '1 hr.',
  '120': '2 hr.'
});

exports.buttonStyles = freeze({
  DANGER : 'danger',
  DEFAULT: 'default',
  SUCCESS: 'success'
});

exports.leaveMetricTypes = freeze({
  FIRST_HALF    : 'first half',
  SECOND_HALF   : 'second half',
  WORK_FROM_HOME: 'work from home'
});

exports.leaveTypes = freeze({
  EARNED: 'EARNED',
  SICK  : 'SICK',
  CASUAL: 'CASUAL'
});

exports.halfDayTypes = freeze({
  FIRST_HALF: 'FIRST_HALF',
  SECOND_HALF: 'SECOND_HALF'
});

exports.workFromHome = 'WORK_FROM_HOME';

exports.textFieldAction = freeze({
  COMMENT: 'comment',
  REMARK: 'remark'
});

exports.leaveStatus = freeze({
  APPROVED : 'APPROVED',
  REJECTED : 'REJECTED',
  REQUESTED: 'REQUESTED',
  CANCELLED: 'CANCELLED',
  DISMISSED: 'DISMISSED'
});


exports.managerChange = freeze({
  MANAGER_CHANGE_CONFIRMATION: 'MANAGER_CHANGE_CONFIRMATION',
  NEW_MANAGER_APPROVAL       : 'NEW_MANAGER_APPROVAL'
});

exports.punchState = freeze({
  GEO_PUNCH_IN_FENCING          : 'GEO_PUNCH_IN_FENCING',
  GEO_PUNCH_OUT_FENCING         : 'GEO_PUNCH_OUT_FENCING',
  MANAGER_PUNCH_IN_CONFIRMATION : 'MANAGER_PUNCH_IN_CONFIRMATION',
  MANAGER_PUNCH_OUT_CONFIRMATION: 'MANAGER_PUNCH_OUT_CONFIRMATION'
});

exports.ATTENDANCE_AUTHENTICATION_LEVEL = freeze({
  NONE    : 'NONE',
  BOTH    : 'BOTH',
  LOCATION: 'LOCATION',
  CAMERA  : 'CAMERA'
});

exports.attendanceBotImageUrl = 'https://fuguchat.s3.ap-south-1.amazonaws.com/image/3A2WWS5Ht9.1540999624660.png';

exports.scrumBotImageUrl = 'https://fchat.s3.ap-south-1.amazonaws.com/test/image/FkNQ7byT0a.1561119029912.png'

exports.messageForNewAttendanceBotChannel = "- Type *'in'* to punch in and *'out'* to punch out.\n- Type *'Timesheet'* to view your punch in or punch Out of the day.\n- *'My team report'* to view your reportees status of the day.\n- Type *'report'* to download your monthly attendance report.\n- Want to know your manager, just type *'My manager'.*\n- Type *'leave'* (DD-MM) OR (DD-MM to DD-MM) to apply for leave.\n- Type *'delete leaves'* to delete your applied leaves.\n- Type *'change my manager @[username] '* to change your manager.\n- Type *'leave balance'* or *'Quotas'* to view your leave balance.";

exports.adminMessageForScrumBot = " \n - Customize questions  to support and improve team culture. \n- Type *'settings'* to make your own scrum.";

exports.userMessageForScrumBot = "Hey, I am ScrumBot and I will be posting questions of your scrum. \n Hot Features🔥 \n - Automate status meetings 🕰.  \n - Track work progress, business metrics, obstacles and team happiness 24x7.\n - Get Summary reports in app_name (DM/channel).";

exports.broadcast_user_type = freeze({
  ALL   : 'ALL',
  EXCEPT: 'EXCEPT',
  ONLY  : 'ONLY'
});

exports.getGroupInfoDataType = freeze({
  DEFAULT    : 'DEFAULT',
  MEMBERS    : 'MEMBERS',
  ATTACHMENTS: 'ATTACHMENTS'
});

exports.validGetGroupInfoDataType = freeze(
  commonFunctions.getAllKeysFromMap(exports.getGroupInfoDataType)
);

exports.channelsType = freeze({
  OPEN  : 'OPEN',
  JOINED: 'JOINED'
});

exports.workspaceConfig = freeze({
  enableGeneralChat    : 'chat-enable_general_chat',
  clearChatHistory     : 'clear_chat_history',
  deleteMessage        : 'delete_message',
  deleteMessageDuration: 'delete_message_duration',
  fuguBot              : 'fugu_bot',
  editMessageDuration  : 'edit_message_duration',
  editMessageRole      : 'edit_message_role'
});

exports.discourseEventType = freeze({
  PING    : 'ping',
  TOPIC    : 'topic',
  POST     : 'post',
  USER    : 'user'
});

exports.discourseEvent = freeze({
  PING    : 'ping',
  POST_CREATED    : 'post_created',
  POST_EDITED     : 'post_edited',
  POST_DELETED    : 'post_destroyed',
  TOPIC_CREATED   : 'topic_created',
  TOPIC_DELETED   : 'topic_destroyed',
  TOPIC_EDITED    : 'topic_edited',
  USER_CREATED    : 'user_created'
});

exports.trelloMessage = freeze({
  COMMENT_CARD                      : 'commentCard',
  ACTION_ARCHIVED_CARD              : 'action_archived_card',
  ACTION_ARCHIVED_LIST              : 'action_archived_list',
  CREATE_LIST                       : 'createList',
  CREATE_CARD                       : 'createCard',
  ADD_CHECKLIST_TO_CARD             : 'addChecklistToCard',
  CREATE_CHECK_ITEM                 : 'createCheckItem',
  ADD_ATTACHMENT_TO_CARD            : 'addAttachmentToCard',
  MOVE_CARD_FROM_BOARD              : 'moveCardFromBoard',
  ACTION_ADD_LABEL_TO_CARD          : 'action_add_label_to_card',
  ADD_MEMBER_TO_CARD                : 'addMemberToCard',
  ACTION_CHANGED_DESCRIPTION_OF_CARD: 'action_changed_description_of_card',
  UPDATE_CARD                       : 'updateCard',
  ACTION_CHANGED_A_DUE_DATE         : 'action_changed_a_due_date',
  REMOVE_CHECKLIST_FROM_CARD        : 'removeChecklistFromCard',
  ACTION_MOVE_CARD_FROM_LIST_TO_LIST: 'action_move_card_from_list_to_list',
  WEBHOOK                           : 'webhooks',
  TRELLO_URL                        : 'https://trello.com/',
  ACTION_ADDED_A_DUE_DATE           : 'action_added_a_due_date',
  FALSE                             : false,
  TRUE                              : true
});

exports.webhookStatus = freeze({
  DELETE: 2,
  DISABLE: 0,
  ENABLE: 1
});

exports.publishMessageTypesOfAttendanceBot = freeze({
  AUTO_PUNCH_OUT              : 'AUTO_PUNCH_OUT',
  AUTO_TEAM_REPORT            : 'AUTO_TEAM_REPORT',
  TEAM_LEAVE_STATUS           : 'TEAM_LEAVE_STATUS',
  ATTENDANCE_CREDENTIALS_CHECK: 'ATTENDANCE_CREDENTIALS_CHECK',
  DEFAULT_IMAGE_UPLOAD        : 'DEFAULT_IMAGE_UPLOAD',
  PUNCH_REMINDER              : 'PUNCH_REMINDER'
});

exports.selfieForAttendance = freeze({
  CLICK_SELFIE       : 'CLICK_SELFIE',
  CLICK_SELFIE_BUTTON: 'Click Selfie',
  OPEN_CAMERA        : 'OPEN_CAMERA'
});

exports.deleteMessage = freeze({
  FOR_ME    : 'You deleted this message',
  FOR_OTHERS: 'This message was deleted'
});

exports.getAttachmentTypes = [10, 11, 12];

exports.validPushNotificationLevels = freeze(commonFunctions.getAllValuesFromMap(exports.pushNotificationLevels));

exports.validUserProperties = new Set(['enable_vibration', 'push_notification_sound']);

exports.defaultTextFieldCharacterLength = 10;

exports.defaultScrumLength = 1;

exports.defaultTextFieldHint = 'Enter comment of min. 10 character';

exports.defaultScrumText = 'Enter comment of min. 1 character'

exports.unamedGroupMemberLength = 3;

exports.callTypes = freeze({
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO'
});

exports.videoCallExpirationTime = 40;     // in seconds
exports.presenceExpirationTime  = 21600;  // in seconds
exports.lastSeenExpirationTime  = 3600;   // in seconds
exports.lastSeenUpdateChunkSize = 100;
exports.getMessageCacheTime     = 21600;

exports.videoMessageForOldApps = 'You just received a video call ! Please update your app to answer it.';

exports.usersCount = freeze({
  USER: 'USER',
  ALL_USERS: 'ALL_USERS'
});

exports.defaultMessageBasedOntype = {
  1 : 'a message',
  2 : 'a note',
  3 : 'a private message',
  4 : 'a message',
  5 : 'a public note',
  10: 'an image',
  11: 'a file attachment',
  12: 'a video',
  17: 'a task'
};

exports.originalMaxDimensionSize = 1200;

exports.blurMaxDimensionSize = 100;

exports.redisExpireTime = 1;

exports.defaultMessageForFuguBot = 'Hi! 😀 Welcome to app_name Bot. I am your personal bot.';

exports.fuguSupport = freeze({
  DEFAULT_IMAGE  : 'https://s3.ap-south-1.amazonaws.com/fuguchat/image/fugu-support.jpg',
  DEFAULT_MESSAGE: 'Hi full_name, We are here to help you with anything on app_name. Just leave a message to directly chat with our support executives.'
});

exports.tookanBotAppId = 4;

exports.fuguBotTags = [ // Make sure to update conversationController accordingly when adding or removing tags from here.
    { tag: 'workspace_admin',    input_parameter: '',            description: 'To know the admins of your workspace.' },
    { tag: 'notification issue', input_parameter: '',            description: 'To report a notification related issue.' },
    { tag: 'COVID-19 handbook',  input_parameter: '',            description: 'To get the covid-19 handbook.' }
];

exports.exportDataTags = [{ tag: 'export chat', input_parameter: '', description: 'To export data of your workspace' },
{ tag: 'export chat 1 month', input_parameter: '', description: 'To export data of your workspace of last 1 month.' }]

exports.disableWorkspaceTags = [{ tag: 'disable workspace', input_parameter: '', description: 'To permanently delete your workspace' }]

exports.secretSantaTags = { tag: 'secret santa', input_parameter: '', description: 'To send gifts anonymously.' }

exports.maxAttendanceFreeTrial = 14;

exports.fuguBotMetricConstant = freeze({
  SALARY         : 'salary',
  CONTACT_NUMBER : 'contact_number',
  WORKSPACE_ADMIN: 'workspace_admins'
});

exports.fugu_bot_messages = freeze({
  INVITE : 'invite',
  MEMBERS: 'member',
  MEMBER : 'members',
  DEFAULT: 'default'
});

exports.userCurrentDayStatus = freeze({
  ABSENT: 'ABSENT',
  PRESENT: "PRESENT",
  WORK_FROM_HOME: "WORK_FROM_HOME",
});

exports.videoConference = 'VIDEO_CONFERENCE';

exports.attendanceBotTags = [{ tag: 'in', input_parameter: '', description: 'To clock In.' }, { tag: 'out', input_parameter: '', description: 'To clock Out.' }, { tag: 'my leave balance', input_parameter: '', description: 'To check your leave balance.' }, { tag: 'holidays', input_parameter: '', description: 'To check holidays of the year 2021.' },
{ tag: 'leave', input_parameter: '(DD-MM) OR (DD-MM to DD-MM) OR (first half or second half)', description: 'To leave.' }, { tag: 'work from home', input_parameter: '(DD-MM) OR (DD-MM to DD-MM)', description: 'To leave.' }, { tag: 'delete leave', input_parameter: '', description: 'To delete leave.' },
{ tag: 'change my manager', input_parameter: '[@username]', description: 'To change your manager.' },
{ tag: 'employee code', input_parameter: '', description: 'To check your employee id.' }];

exports.scrumBotMetric = [{ tag: 'settings', input_parameter: '', description: 'To make your own scrum. ' }, { tag: 'help', input_parameter: '', description: 'To know more about scrum bot.' }]

exports.pushTimeLimitForAllDevices = 60;

exports.halfDayLeaveDeduction = 0.5;

exports.getAllMembersPageSize = 20;

exports.remainingDaysForTrialExpires = 10;

exports.userMessageSeenChannelStatus = freeze({
  JOIN: 'JOIN',
  LEFT: 'LEFT',
  DEFAULT: 'DEFAULT'
});


exports.defaultSeenByMessage = 'No one has read your message yet.';

exports.promiseHash = 'message';

exports.scrumBot = freeze({
  SCRUM_QUESTION        : "SCRUM_QUESTION",
  SUBMIT                : "SUBMIT",
  PUBLISH_SCRUM_ANSWERS : "PUBLISH_SCRUM_ANSWERS",
  PUBLISH_SCRUM_QUESTION: "PUBLISH_SCRUM_QUESTION",
  PUBLISH_END_TIME_TEXT : "PUBLISH_END_TIME_TEXT",
  SCRUM_ENDED           : "SCRUM_ENDED"
});

exports.turnExpirationTime = 60; // in seconds

exports.timeRegex = /(\d+(\.|-|\/)\d+\s\d+(:)\d+)|(\d+(:)\d+)/gm;

exports.dateRegex = /(\d+(\.|-|\/)\d+(\.|-|\/)\d)|(\d+(\.|-|\/)\d+)/gm;

exports.publishMessageTypesOfFugueBot = freeze({
  MEETING_REMINDER: 'MEETING_REMINDER'
});

exports.androidDevices = freeze({
  'OPPO'   : 'OPPO',
  'VIVO'   : 'VIVO',
  'ONEPLUS': 'ONE PLUS',
  'XIAOMI' : 'XIAOMI / REDMI'
});

exports.androidDevicesNotificationString = freeze({
  'OPPO'   : '_Security Centre > Privacy Permissions > Startup Manager > in startup apps disallowed check_',
  'VIVO'   : '_iManager> App Manager > Permissions > AutoStart > in startup apps disallowed check Fugu_',
  'ONEPLUS': '_Go to Settings > Battery > Battery Optimization > Tap Fugu > Choose Don`t optimize > Done_',
  'XIAOMI' : '_Security > Permissions > AutoStart > in startup apps disallowed check Fugu_'
});

exports.ritTags = [{ tag: 'address', input_parameter: '', description: 'to view the address of our company' },
{ tag: 'bank',      input_parameter: '', description: 'to get bank details' },
{ tag: 'hours',     input_parameter: '', description: 'check company working hours' },
{ tag: 'statement', input_parameter: '', description: 'request your statement' },
{ tag: 'due',       input_parameter: '', description: 'request any pending invoice due' },
{ tag: 'cheque',    input_parameter: '', description: 'arrange cheque pickup' },
{ tag: 'gst',       input_parameter: '', description: 'get gst details' },
{ tag: 'email',     input_parameter: '', description: 'get email of our company' },
{ tag: 'phone',     input_parameter: '', description: 'get contact number of our company' },
{ tag: 'website',   input_parameter: '', description: 'check company website' },
{ tag: 'video',     input_parameter: '', description: 'to get our youtube channel link' }
];

exports.ritTagsReponses = {
  '/address'  : 'Head Office: 1402, Aggarwal Corporate Heights, A7, Netaji Subhash Place, Pitampura, New Delhi, 110034, INDIA',
  '/bank'     : 'Account Name: RI TEXSOLUTIONS PVT LTD\nAccount No. 0077452222\nCITI BANK\nIFSC CODE: CITI0000032\nSouth Extension Branch, New Delhi, 110049, INDIA',
  '/hours'    : 'Office Timings are Monday to Saturday 09:30 AM - 06:30 PM but we are available on this app 24x7.',
  '/statement': 'Thanks for requesting your statement, we are on it !',
  '/due'      : 'Thanks for requesting your due invoices, sending you the list in a jiffy !',
  '/cheque'   : 'Awesome ! We will arrange to pick the payment now.',
  '/gst'      : 'RI TEXSOLUTIONS PVT LTD\nDelhi 07AAICR3936M1ZV\nHaryana 06AAICR3936M1ZX\nPunjab 03AAICR3936M1Z3\nKarnataka 29AAICR3936M1ZP\nGujarat 24AAICR3936M1ZZ',
  '/email'    : 'orders@rit.in\naccounts@rit.in\nlogistics@rit.in',
  '/phone'    : '+911147085405\n+919899293660',
  '/website'  : 'www.rit.in',
  '/video'    : 'Our Youtube Channel https://www.youtube.com/channel/UCkan0vv7aoix8XAIBl2YA7A'
};


exports.conferenceBotTags = [
  { tag: 'video conference', input_parameter: '[@user name]', description: 'To start a video call.' }];


exports.conferenceMetric = freeze({
  VIDEO_CONF: 'video conference'
});

exports.selfBotDefaultMessage = `*Welcome to your personal space*\n✓ Forward message here to save them\n✓ Save your photos and documents\n✓ Take personal notes\n✓ Use search to find your items\n\nTo find your personal space just search with your name like any other chat and have a word with yourself!`

exports.defaltConferenceMessage = `Hey there, I am your Conference Bot to help you connect digitally with others:\n- Type /*video_conference* [@username] to initiate a video conference call`

exports.videoConferenceAction = freeze({
  JOIN: 'JOIN',
  END : 'END'
});

exports.notificationSnoozeTimeEnum = [
  { time_slot: "TWENTY_MINUTE",     description: "20 minutes" },
  { time_slot: "ONE_HOUR",          description: "1 hour" },
  { time_slot: "TWO_HOURS",         description: "2 hours" },
  { time_slot: "FOUR_HOURS",        description: "4 hours" },
  { time_slot: "EIGHT_HOURS",       description: "8 hours" },
  { time_slot: "TWENTY_FOUR_HOURS", description: "24 hours" }]

exports.notificationSnoozeTime = {
  "TWENTY_MINUTE"    : 20,
  "ONE_HOUR"         : 60,
  "TWO_HOURS"        : 120,
  "FOUR_HOURS"       : 240,
  "EIGHT_HOURS"      : 480,
  "TWENTY_FOUR_HOURS": 1440
}

exports.conversationStatus = {
  "PIN_CHAT"  : "PIN_CHAT",
  "UNPIN_CHAT": "UNPIN_CHAT"
}

exports.maxPinChannels = 3;

exports.maxExportDataCount = 3;

exports.quickCutzDefaultMessage = `“Hi!😀 Welcome to QuickCutz Connect! A community for the best barbers! I am the bot and here to help”`

exports.CONFERENCE_BOT_IMAGE = 'https://fchat.s3.ap-south-1.amazonaws.com/default/0azZ0mpjed.1574435010178.png';

exports.ATTENDANCE_STATUS = {
  PUNCH_IN: 1,
  NOT_PUNCH_IN: 0
}

exports.WORKING_DAYS = {
  DEFAULT: [1, 2, 3, 4, 5]
}

exports.LOGIN_BY = {
  FUGU: 1,
  LPU: 2
}

exports.AUTH_OTP_VALIDATION_TYPE = {
  LOGIN : 1,
  SIGNUP: 2
}

exports.WORKSPACE_PROPERTY = {
  SEND_MESSAGE_TO_HR : 'send_punch_in_confirm_hr',
  INVITE_PRICE       : 'per_user_invite_price',
  FREE_INVITE        : 'free_invite'
}

exports.OTP_STEP = {
  SEND   : 1,
  RESEND : 2,
  VALID  : 3,
  INVALID: 4
}

exports.STREAM_TYPES= ['PUBLISH', 'PLAY'];

exports.LIVE_STREAM_STATUS = {
  INITIATE: 0,
  START   : 1,
  END     : 2
}

exports.LIVE_STREAM_MAPPING = {
  START        : 'STREAM_STARTED',
  END          : 'STREAM_ENDED',
  RECORDING_URL: 'RECORDING_READY'
}

exports.LIVE_STREAM_EVENTS = ['STREAM_STARTED', 'STREAM_ENDED', 'RECORDING_READY'];



exports.WORKSPACE_PROPERTY = {
  LIVE_STREAM_PERMISSION: "livestream_permission",
  CONFERENCE_ROLE       : "create_conference_roles"
}

exports.DOMAIN_MAPPING = {
  FUGU          : 1
}


exports.jungleworksDomains = ['jungleworks.com', 'jungleworks.co', 'fatafat.me', 'jugnoo.in', 'deltaschool.in', 'click-labs.com', 'clicklabs.in', 'theroboticshomepage.com']

exports.JUNGLE_PAYMENT_ENDPOINT = {
  GET_RAZORPAY_URL : "/razorpay/get_redirect_url"
}

exports.PAYMENT_PRICE_TYPE = {
  DAY_WISE : 1,
  MONTH_WISE: 2
}

exports.PAYMENT_STATUS = {
  INITIATE : 1,
  COMPLETE : 2
}

exports.PAYMENT_EVENTS = {
  INITIATE_PAYMENT : 'INITIATE_PAYMENT',
  PAYMENT_WEBHOOK  : 'PAYMENT_WEBHOOK'
}

exports.FUGU_ICON = "https://fchat.s3.ap-south-1.amazonaws.com/default/2Ff7Y8HdHY.1592485552348.png";


exports.GOOGLE_CALENDAR_EVENTS = {
  ADD_EVENT  : "ADD_EVENT",
  SUBMIT_CODE: "SUBMIT_CODE",
  GET_CODE   : "GET_CODE"
}

exports.juggernautEndPoint = freeze({
  CLOCK_IN: 'http://13.235.76.91:8000/api/method/erpnext.hr.doctype.attendance.attendance.clockIn',
  UPLOAD_PHOTO: 'http://13.235.76.91:8000/api/method/erpnext.hr.doctype.attendance.attendance.upload_pic'
});

exports.hrmImageUrl = `https://fchat.s3.ap-south-1.amazonaws.com/default/i1lMOpO8ZQ.1568120263414.png`;

exports.hiringConstant = {
  FORWARD: 'FORWARD',
  ACCEPT : 'ACCEPT',
  REJECT : 'REJECT'
};

exports.buttonsForHiring = {
  FORWARD: 'Forward',
  ACCEPT : 'Confirm',
  REJECT : 'Cancel'
};
exports.APPLE_SIGNIN_STATUS = {
  SIGNUP: 1,
  LOGIN : 2
}


exports.REMINDER = freeze({
  TEN_MINUTES     : 10,
  FIFTEEN_MINUTES : 15,
  THIRTY_MINUTES  : 30,
  SIXTY_MINUTES   : 60
});

exports.validReminder = freeze(
    commonFunctions.getAllValuesFromMap(exports.REMINDER)
);

exports.FREQUENCY = freeze({
  DAILY     : 1,
  WEEKLY    : 2,
  WEEKDAYS  : 3,
  MONTHLY   : 4
});

exports.MEET_FREQUENCY = {
  DAILY     : 1,
  WEEKLY    : 2,
  WEEKDAYS  : 3,
  MONTHLY   : 4
}

exports.validFrequency = freeze(
    commonFunctions.getAllValuesFromMap(exports.FREQUENCY)
);

exports.WEEKDAYS = {
  MONDAY     : 1,
  TUESDAY    : 2,
  WEDNESDAY  : 3,
  THURSDAY   : 4,
  FRIDAY     : 5,
  SATURDAY   : 6,
  SUNDAY     : 7
};

exports.meetType = [
  "JITSI",
  "GOOGLE"
]

exports.NOTIFICATION_EVENT = {
  SCHEDULE_MEETING: 'SCHEDULE_MEETING'
}

exports.collapse_key = 'meet'
exports.baseMeetUrl = 'meet.';

exports.COVID_19_PDF = {
  PDF_LINK      : 'https://s3.fugu.chat/default/kEHe9jRzLH_1599130830513.pdf',
  FILE_NAME     : 'Covid 19 booklet.pdf',
  SIZE          : '13.4 MB',
  DOCUMENT_TYPE : 'file',
  TAG_TYPE      : 'COVID-19 handbook',
  WIDTH         : 435,
  HEIGHT        : 435
}

exports.WORKSPACE_ID = {
  JUNGLEWORKS_WORKSPACE : 9
}


