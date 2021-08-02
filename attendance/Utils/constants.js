
const commonFunctions       = require('../Utils/commonFunctions');

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
  ANDROID : "ANDROID",
  IOS     : "IOS",
  WEB     : "WEB",
};

exports.validDeviceTypes = freeze(commonFunctions.getAllValuesFromMap(exports.enumDeviceType));

exports.enumTeamReport = {
  SINGLE_USER : "SINGLE_USER",
  ALL_USER    : "ALL_USER"
}

exports.getFuguDeviceType = function (deviceType) {
  if(deviceType == exports.enumDeviceType.ANDROID) {
    return 1;
  }
  if(deviceType == exports.enumDeviceType.IOS) {
    return 2;
  }
  if(deviceType == exports.enumDeviceType.WEB) {
    return 3;
  }
  return 0;
};


exports.notificationFlags = {
  DISPLAY_MESSAGE : 21
};

exports.EMAIL_MAX_SIZE = 60;

exports.MIN_DOTAT = 2;

exports.MAX_INTEGER = Number.MAX_SAFE_INTEGER;

exports.cache = {
  BUSINESS_DETAILS         : 'business_details',
  BUSINESS_PROPERTY        : 'business_property',
  BUSINESS_DEVICE_MAPPINGS : "business_device_mappings",
  SERVER_LOGGING           : "server_logging"
};

exports.enableZlibCompression = true;

exports.userStatus = freeze({
  ENABLED  : "ENABLED",
  DISABLED : "DISABLED",
  LEFT     : "LEFT"
});

exports.status = freeze({
  ENABLED  : 1,
  DISABLED : 0
});

exports.userRole = freeze({
  USER    : "USER",
  ADMIN   : "ADMIN",
  OWNER   : "OWNER",
  MANAGER : "MANAGER",
  HR      : "HR"
});

exports.expired = freeze({
  YES : "YES",
  NO  : "NO"
});

exports.countryCodes = freeze([
  'US', 'AG', 'AI', 'AS', 'BB', 'BM', 'BS', 'CA', 'DM', 'DO', 'GD', 'GU', 'JM', 'KN', 'KY', 'LC', 'MP', 'MS', 'PR', 'SX',
  'TC', 'TT', 'VC', 'VG', 'VI', 'RU', 'KZ', 'EG', 'ZA', 'GR', 'NL', 'BE', 'FR', 'ES', 'HU', 'IT', 'VA', 'RO', 'CH', 'AT',
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

exports.thumbnailMaxDimensionSize = 150;

exports.API_END_POINT = freeze({
  PUBLISH_MESSAGE_ON_ATTENDANCE_BOT : "/api/bot/publishMessageOnAttendanceBot"
});

exports.getMembers = freeze({
  DEFAULT         : "DEFAULT",
  ALL_MEMBERS     : "ALL_MEMBERS",
  INVITED_MEMBERS : "INVITED_MEMBERS"
});

exports.allowedUserStatus = freeze(commonFunctions.getAllValuesFromMap(exports.userStatus));

exports.allowedInvitationStatus = freeze(commonFunctions.getAllValuesFromMap(exports.invitationStatus));

exports.allowedMembersType = freeze(commonFunctions.getAllValuesFromMap(exports.getMembers));

exports.leaveStatus = freeze({
  APPROVED  : "APPROVED",
  REJECTED  : "REJECTED",
  REQUESTED : "REQUESTED",
  CANCELLED : "CANCELLED",
  DISMISSED : "DISMISSED"
});

exports.allowedLeaveStatusEnum  = freeze(commonFunctions.getAllValuesFromMap(exports.leaveStatus));

exports.leaveTypes =  freeze({
  EARNED  : "EARNED",
  SICK    : "SICK",
  CASUAL  : "CASUAL"
});

exports.vacationType = freeze({
  FIRST_HALF      : "FIRST_HALF",
  SECOND_HALF     : "SECOND_HALF",
  WORK_FROM_HOME  : "WORK_FROM_HOME",
  HALF_DAY        : "HALF_DAY",
  FULL_DAY: "FULL_DAY"
})

exports.usersCount = freeze({
  USER      : "USER",
  ALL_USERS : "ALL_USERS"
});

exports.allowedUsersCount = freeze(commonFunctions.getAllValuesFromMap(exports.usersCount));


exports.accrualInterval = freeze({
  ANNUALLY    : 12,
  HALF_YEARLY : 6,
  QUARTERLY   : 3,
  MONTHLY     : 1
});

exports.getUsersWorkTimesheet = 10;

exports.TYPE_OF_MESSAGES_ATTENDANCE_BOT = freeze({
  AUTO_PUNCH_OUT            : "AUTO_PUNCH_OUT",
  TEAM_LEAVE_STATUS         : "TEAM_LEAVE_STATUS",
  AUTO_TEAM_REPORT          : "AUTO_TEAM_REPORT",
  GEO_FENCING               : "GEO_FENCING",
  ATTENDANCE_REMINDER: "ATTENDANCE_REMINDER",
  PUNCH_REMINDER: "PUNCH_REMINDER"

});

exports.ATTENDANCE_AUTHENTICATION_LEVEL = freeze({
  BOTH : "BOTH",
  CAMERA   : "CAMERA",
  LOCATION : "LOCATION",
  NONE   : "NONE"
});

exports.webhookEnumLeave = freeze({
  APPROVED  : "LEAVE_APPROVED",
  REJECTED  : "LEAVE_REJECTED",
  DISMISSED : "LEAVE_DISMISSED"
});

exports.userPresentStatus = freeze({
  ABSENT  : "ABSENT",
  WORK_FROM_HOME : "WORK_FROM_HOME"
});
