

exports.ERROR = {
  eng : {
    DOMAIN_ALREADY_ALLOCATED : {
      statusCode    : 409,
      customMessage : "A space already exists at fuguchat.com. Please try a different URL. If you are trying to join it, please ask administrator of the space to send you an invite",
      type          : "DOMAIN_ALREADY_ALLOCATED"
    },
    VERSION_MISMATCH: {
      statusCode: 415,
      customMessage: 'Version Mismatch',
      type: "VERSION_MISMATCH"
    },
    TOO_MANY_ATTEMPTS : {
      statusCode    : 429,
      customMessage : 'Too many attempts.',
      type          : "TOO_MANY_ATTEMPTS"
    },
    REDIRECT_ERROR : {
      statusCode: 429,
      customMessage: 'Failed to serve hit.',
      type: "REDIRECT"
    },
    USER_DISABLED: {
      statusCode: 407,
      customMessage: 'User is disabled.',
      type: "USER_DISABLED"
    },
    INVALID_DATA: {
      statusCode: 409,
      customMessage: 'User and channel does not belong to same business!',
      type: "INVALID_DATA"
    },
    INVALID_PASSWORD : {
      statusCode    : 400,
      customMessage : "Invalid Password",
      type          : "INVALID_PASSWORD"
    },
    POLL_EXPIRED : {
      statusCode    : 414,
      customMessage : 'Poll Expired',
      type          : "POLL_EXPIRED"
    },
    OTP_ALREADY_SENT : {
      statusCode    : 410,
      customMessage : 'OTP already sent! Please check you mail.',
      type          : "OTP_ALREADY_SENT"
    },
    SYNONYM_ALREADY_EXIST: {
      statusCode: 454,
      customMessage: 'Synonym already exist.',
      type: "SYNONYM_ALREADY_EXIST"
    },
    TITLE_ALREADY_EXIST: {
      statusCode: 455,
      customMessage: 'Title already exist.',
      type: "TITLE_ALREADY_EXIST"
    },
    DUPLICATE_ENTRY: {
      statusCode: 412,
      customMessage: 'DUPLICATE ENTRY',
      type: "DUPLICATE_ENTRY"
    },
    BUSINESS_UNREGISTERED : {
      statusCode    : 401,
      customMessage : 'User has not yet registered his business yet',
      type          : "BUSINESS_UNREGISTERED"
    },
    WORKSPACE_DEACTIVATED : {
      statusCode    : 400,
      customMessage : 'Workspace has been deactivated',
      type          : "WORKSPACE_DEACTIVATED"
    },
    INVALID_WORKSPACE : {
      statusCode    : 400,
      customMessage : 'Invalid worksapce Id',
      type          : "INVALID_WORKSPACE"
    },
    EMAIL_TOKEN_NOT_VERIFIED : {
      statusCode    : 200,
      customMessage : 'Email Token is not valid',
      type          : "EMAIL_TOKEN_NOT_VERIFIED"
    },
    USER_ALREADY_EXISTS : {
      statusCode    : 402,
      customMessage : 'You are already registered with us. Please Sign in to create workspace!!',
      type          : "USER_ALREADY_EXISTS"
    },
    ALL_EMAILS_ALREADY_INVITED : {
      statusCode    : 200,
      customMessage : 'User(s) are already invited/registered',
      type          : "ALL_EMAILS_ALREADY_INVITED"
    },
    ALREADY_REGISTER : {
      statusCode    : 400,
      customMessage : 'Email already registered with us',
      type          : "ALREADY_REGISTER"
    },
    WRONG_LABEL_ID : {
      statusCode    : 400,
      customMessage : 'Wrong Label ID Passed',
      type          : "WRONG_LABEL_ID"
    },
    CHANNEL_ALREADY_CLOSED : {
      statusCode    : 400,
      customMessage : 'This channel is already closed',
      type          : "CHANNEL_ALREADY_CLOSED"
    },
    CHANNEL_ALREADY_OPEN : {
      statusCode    : 400,
      customMessage : 'This channel is already open',
      type          : "CHANNEL_ALREADY_OPEN"
    },
    TAG_ALREADY_ASSIGNED : {
      statusCode    : 400,
      customMessage : 'This tag is already assigned',
      type          : "TAG_ALREADY_ASSIGNED"
    },
    USER_DOES_NOT_EXIST : {
      statusCode    : 403,
      customMessage : 'This user email does not exist',
      type          : "USER_DOES_NOT_EXIST"
    },
    TAG_ALREADY_EXISTS : {
      statusCode    : 400,
      customMessage : 'This tag already exists',
      type          : "TAG_ALREADY_EXISTS"
    },
    ALREADY_REQUESTED : {
      statusCode    : 400,
      customMessage : 'Already made a request',
      type          : "ALREADY_REQUESTED"
    },
    ALREADY_REQUESTED_USER : {
      statusCode    : 400,
      customMessage : 'Your request is in progress, we will get back to you soon',
      type          : "ALREADY_REQUESTED_USER"
    },
    NO_CHANGES : {
      statusCode    : 401,
      customMessage : 'No changes made while editing',
      type          : "NO_CHANGES"
    },
    CHANNEL_ALREADY_EXISTS : {
      statusCode    : 400,
      customMessage : 'This channel already exists.',
      type          : "CHANNEL_ALREADY_EXISTS"
    },
    AGENT_ALREADY_EXISTS : {
      statusCode    : 400,
      customMessage : 'This agent email already exists.',
      type          : "AGENT_ALREADY_EXISTS"
    },
    AGENT_ALREADY_ASSIGNED : {
      statusCode    : 401,
      customMessage : 'This agent is already assigned to this channel.',
      type          : "AGENT_ALREADY_ASSIGNED"
    },
    CUSTOMER_ALREADY_REGISTER : {
      statusCode    : 401,
      customMessage : 'Customer phone number already registered with us.',
      type          : "CUSTOMER_ALREADY_REGISTER"
    },
    CHANNEL_NOT_FOUND: {
      statusCode: 407,
      customMessage: 'Channel not found',
      type: "CHANNEL_NOT_FOUND"
    },
    INCORRECT_PASSWORD : {
      statusCode    : 401,
      customMessage : 'Incorrect password',
      type          : 'INCORRECT_PASSWORD'
    },
    ACCOUNT_BLOCKED : {
      statusCode    : 401,
      customMessage : 'Your account has been deactivated by the Admin.',
      type          : 'ACCOUNT_BLOCKED'
    },
    ACCOUNT_NOT_REGISTERED : {
      statusCode    : 401,
      customMessage : 'Your account not registered with any business yet',
      type          : 'ACCOUNT_NOT_REGISTERED'
    },
    INCORRECT_DELIVERY_MODE : {
      statusCode    : 401,
      customMessage : 'Incorrect delivery mode selected',
      type          : 'INCORRECT_DELIVERY_MODE'
    },
    INVALID_TOKEN : {
      statusCode    : 403,
      customMessage : 'Your session has expired. Please login again.',
      type          : 'INVALID_TOKEN'
    },
    INVALID_TOKEN_ACCESS_DENIED : {
      statusCode    : 403,
      customMessage : 'Session Expired, Please Login Again',
      type          : 'INVALID_TOKEN'
    },
    ACCESS_DENIED : {
      statusCode    : 405,
      customMessage : 'Access Denied',
      type          : 'ACCESS_DENIED'
    },
    INVALID_OTP_TOKEN : {
      statusCode    : 400,
      customMessage : 'Invalid OTP token',
      type          : "INVALID_OTP_TOKEN"
    },
    TRIAL_EXPIRED_OWNER : {
      statusCode    : 402,
      customMessage : 'Your free trial has expired, Please navigate to your dashboard',
      type          : 'TRIAL_EXPIRED_OWNER'
    },
    TRIAL_EXPIRED : {
      statusCode    : 402,
      customMessage : 'Your free trial has expired, Please contact your business admin',
      type          : 'TRIAL_EXPIRED'
    },
    POS_NOT_ENABLED : {
      statusCode    : 401,
      customMessage : 'Currently you do not owe services of this facility. Please contact our customer care for enabling this feature',
      type          : 'POS_NOT_ENABLED'
    },
    NO_RECORD : {
      statusCode    : 404,
      customMessage : 'No record found.',
      type          : 'NO_RECORD'
    },
    USER_BLOCKED : {
      statusCode    : 400,
      customMessage : 'Your account has been blocked by the Admin user',
      type          : 'USER_BLOCKED'
    },
    ALREADY_EXIST : {
      statusCode    : 400,
      customMessage : 'Email/Phone number already exists.',
      type          : 'ALREADY_EXIST'
    },
    CATEGORY_ALREADY_EXIST : {
      statusCode    : 401,
      customMessage : 'This Category already exists.',
      type          : 'CATEGORY_ALREADY_EXIST'
    },
    USER_ALREADY_REGISTERED : {
      statusCode    : 401,
      customMessage : 'Email already exists.',
      type          : 'USER_ALREADY_REGISTERED'
    },
    UNAUTHORIZED : {
      statusCode    : 401,
      customMessage : 'You are not authorized to perform this action',
      type          : 'UNAUTHORIZED'
    },
    DELIVERY_MODE_NOT_SELECTED : {
      statusCode    : 401,
      customMessage : 'Please select a Delivery Mode for Delivery type order',
      type          : 'DELIVERY_MODE_NOT_SELECTED'
    },
    INVALID_EMAIL : {
      statusCode    : 400,
      customMessage : 'This email or mobile number is not associated with any account.',
      type          : 'INVALID_EMAIL'
    },
    INVALID_CREDENTIALS : {
      statusCode    : 401,
      customMessage : 'Oops! The Email or Password is incorrect.',
      type          : 'INVALID_CREDENTIALS'
    },
    NOT_REGISTERED : {
      statusCode    : 401,
      customMessage : 'Email is not registered with us !!',
      type          : 'INVALID_CREDENTIALS'
    },
    INVALID_ACCESS_TOKEN : {
      statusCode    : 401,
      customMessage : 'Oops! Your session has expired.',
      type          : 'INVALID_ACCESS_TOKEN'
    },
    INVALID_DOMAIN : {
      statusCode    : 405,
      customMessage : 'Invalid Domain!',
      type          : 'INVALID_ACCESS_TOKEN'
    },
    INVALID_SUPER_ADMIN_TOKEN : {
      statusCode    : 401,
      customMessage : ' Invalid Parameters / Super Admin Token ',
      type          : 'INVALID_SUPER_ADMIN_TOKEN'
    },
    INVALID_PARAMETERS : {
      statusCode    : 401,
      customMessage : ' Invalid Parameters / Bad Request ',
      type          : 'INVALID_PARAMETERS'
    },
    DEFAULT : {
      statusCode    : 400,
      customMessage : 'Something went wrong.',
      type          : 'DEFAULT'
    },
    INVALID_RESELLER_TOKEN : {
      status        : 401,
      customMessage : 'Reseller Token Invalid',
      type          : 'INVALID_TOKEN'
    },
    INVALID_BUSINESS_ID : {
      status        : 401,
      customMessage : 'Invalid Business Id',
      type          : 'INVALID_BUSINESS_ID'
    },
    RESELLER_DISABLED : {
      statusCode    : 401,
      customMessage : 'Reseller disabled',
      type          : 'RESELLER_DISABLED'
    },
    RESELLER_BUSINESS_INFO : {
      statusCode    : 400,
      customMessage : 'Error while fetching Reseller Business info',
      type          : 'RESELLER_INFO'
    },
    RESELLER_BUSINESS_UPDATE_FAILURE : {
      statusCode    : 400,
      customMessage : 'Error while updating Business info from Reseller',
      type          : 'RESELLER_BUSINESS_UPDATE_FAILURE'
    },
    RESELLER_CREATE_BUSINESS : {
      statusCode    : 400,
      customMessage : 'Error while creating a reseller business',
      type          : 'RESELLER_BUSINESS_CREATE'
    },
    RESELLER_UPDATE_FAILURE : {
      statusCode    : 400,
      customMessage : 'Error while updating a reseller info',
      type          : 'RESELLER_BUSINESS_CREATE'
    },
    RESELLER_CREATE_FAILURE : {
      statusCode    : 400,
      customMessage : 'Error while creating a reseller',
      type          : 'RESELLER_CREATE_FAILURE'
    },
    RESELLER_PRESENT : {
      statusCode    : 400,
      customMessage : 'Reseller already present',
      type          : 'RESELLER_PRESENT'
    },
    INVALID_COMPONENT_KEY : {
      statusCode    : 401,
      customMessage : 'Invalid component key',
      type          : 'INVALID_COMPONENT_KEY'
    },
    USER_NOT_FOUND : {
      statusCode    : 400,
      customMessage : 'User does not exist',
      type          : 'USER_NOT_FOUND'
    },
    USER_REQUIRED : {
      statusCode    : 400,
      customMessage : 'User Required',
      type          : 'USER_REQUIRED'
    },
    PARAMETER_REQUIRED : {
      statusCode    : 400,
      customMessage : 'Parameters Required',
      type          : 'PARAMETER_REQUIRED'
    },
    ALERT_NOT_FOUND : {
      statusCode    : 404,
      customMessage : 'Alert Not Found',
      type          : 'ALERT_NOT_FOUND'
    },
    ALERT_ALREADY_CLOSED : {
      statusCode    : 400,
      customMessage : 'Alert Already Closed',
      type          : 'ALERT_ALREADY_CLOSED'
    },
    DATA_UNAVAILABLE : {
      statusCode    : 406,
      customMessage : 'DATA UNAVAILABLE',
      type          : 1
    },
    USER_ALREADY_EXIST : {
      statusCode    : 409,
      customMessage : "Email/Contact Number already exists.",
      type          : "USER_ALREADY_EXIST"
    },
    PHONE_NUMBER_ALREADY_EXIST: {
      statusCode: 409,
      customMessage: 'Phone number already exists.',
      type: 'PHONE_NUMBER_ALREADY_EXIST'
    },
    EMAIL_ALREADY_EXIST: {
      statusCode: 410,
      customMessage: 'Email already exists.',
      type: 'EMAIL_ALREADY_EXIST'
    },
    INVALID_API_KEY: {
      statusCode: 401,
      customMessage: 'Invalid api key.',
      type: 'INVALID_API_KEY'
    },
    PAST_DATE_NOT_ALLOWED: {
      statusCode: 401,
      customMessage: 'Past date is not allowed.',
      type: 'PAST_DATE_NOT_ALLOWED'
    },
    INVALID_DATETIME: {
      statusCode: 401,
      customMessage: 'Datetime is invalid.',
      type: 'INVALID_DATETIME'
    },
  },
  USER_INVITE_ERROR:{
    type: 'INVITE_ERROR',
    statusCode: 400,
    customMessage:'You\'re not authorised to invite. Please Contact Workspace Admin!'
  }
};

exports.SUCCESS = {
  REPORT_FETCHED_SUCCESS : {
    statusCode: 200,
    customMessage: 'Report sent to bot sucessfully,',
    type: 'REPORT_FETCHED_SUCCESS'
  },
  NO_RECORD : {
    statusCode    : 200,
    customMessage : 'No such record found',
    type          : 'NO RECORD'
  },
  GROUP_DELETED: {
    statusCode: 200,
    customMessage: 'Group deleted',
    type: 'GROUP_DELETED'
  },
  WEBHOOK_CREATED: {
    statusCode: 200,
    customMessage: 'Webhook Created Successfully.',
    type: 'WEBHOOK_CREATED'
  },
  FACE_MATCHED: {
    statusCode: 200,
    customMessage: 'Face Recognized Successfully.',
    type: 'DEFAULT'
  },
  DATA_FETCHED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Data Fetched Successfully',
    type          : 'DATA_FETCHED_SUCCESSFULLY'
  },
  OTP_SENT_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'OTP sent successfully !!',
    type          : "OTP_SENT_SUCCESSFULLY"
  },
  ENTRY_ADDED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Entry Added Successfully',
    type          : 'ENTRY_ADDED_SUCCESSFULLY'
  },
  BUSINESS_SIGNUP_SUCCESSFULL : {
    statusCode    : 200,
    customMessage : 'Business SignUp Successfully! Please check your email/mobile',
    type          : 'BUSINESS_SIGNUP_SUCCESSFULL'
  },
  BUSINESS_ACTIVATION_SUCCESSFUL : {
    statusCode    : 200,
    customMessage : 'Business Activation Successful',
    type          : 'BUSINESS_ACTIVATION_SUCCESSFUL'
  },
  BUSINESS_DEACTIVATION_SUCCESSFUL : {
    statusCode    : 200,
    customMessage : 'Business Deactivation Successful',
    type          : 'BUSINESS_DEACTIVATION_SUCCESSFUL'
  },
  BUSINESS_INFO_UPDATE_SUCCESSFUL : {
    statusCode    : 200,
    customMessage : 'Business Info Updated ',
    type          : 'BUSINESS_INFO_UPDATE_SUCCESSFUL'
  },
  ENTRY_EDIT_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Entry Edited',
    type          : 'ENTRY_EDITED_SUCCESSFULLY'
  },
  TAG_CREATED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Tag Created Successfully',
    type          : 'TAG_CREATED_SUCCESSFULLY'
  },
  TAGS_FETCHED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Tags Fetched Successfully',
    type          : 'TAGS_FETCHED_SUCCESSFULLY'
  },
  TAGS_EDITED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Tag Edited Successfully',
    type          : 'TAGS_EDITED_SUCCESSFULLY'
  },
  TAGS_ASSIGNED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Tag Assigned Successfully',
    type          : 'TAGS_ASSIGNED_SUCCESSFULLY'
  },
  AGENT_ASSIGNED : {
    statusCode    : 200,
    customMessage : 'Agent Assigned Successfully',
    type          : 'AGENT_ASSIGNED'
  },
  CONVERSATION_MARKED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Conversation Marked Successfully',
    type          : 'CONVERSATION_MARKED_SUCCESSFULLY'
  },
  ORDER_ADDED : {
    statusCode    : 201,
    customMessage : 'Order Added Successfully',
    type          : 'ORDER SUCCESSFUL'
  },
  DISCOUNT_ADDED : {
    statusCode    : 201,
    customMessage : 'Discount Added Successfully',
    type          : 'DISCOUNT_ADDED'
  },
  RECEIVED_USERS : {
    statusCode    : 200,
    customMessage : 'Received Users Successfully',
    type          : 'RECEIVED_USERS'
  },
  RECEIVED_CHANNELS : {
    statusCode    : 200,
    customMessage : 'Received Channels Successfully',
    type          : 'RECEIVED_CHANNELS'
  },
  DELIVERY_PROCESS_INITIATED : {
    statusCode    : 200,
    customMessage : 'Delivery Process Initiated',
    type          : 'DELIVERY_PROCESS_INITIATED'
  },
  ORDER_EDITED : {
    statusCode    : 201,
    customMessage : 'Order Edited Successfully',
    type          : 'ORDER_EDITED'
  },
  ADDRESS_DELETED : {
    statusCode    : 201,
    customMessage : 'Address Deleted Successfully',
    type          : 'ADDRESS_DELETED'
  },
  PASSWORD_CHANGED : {
    statusCode    : 201,
    customMessage : 'Password Changed Successfully',
    type          : 'PASSWORD_CHANGED'
  },
  EMAIL_CHANGED : {
    statusCode    : 201,
    customMessage : 'Email Changed Successfully',
    type          : 'EMAIL_CHANGED'
  },
  REGISTERED : {
    statusCode    : 201,
    customMessage : 'Registered Successfully',
    type          : 'REGISTERED'
  },
  REGISTERED_DOCTOR : {
    statusCode    : 201,
    customMessage : 'Thanks for registering, we’ll be in touch soon to approve your request.',
    type          : 'REGISTERED_DOCTOR'
  },
  UPLOADED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Uploaded Successfully.',
    type          : 'UPLOADED_SUCCESSFULLY'
  },
  UPDATED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Updated Successfully.',
    type          : 'UPDATED_SUCCESSFULLY'
  },
  EMAIL_SENT : {
    statusCode    : 200,
    customMessage : 'Reset password link has been sent to your registered email address/phone number',
    type          : 'EMAIL_SENT'
  },
  RESEND_OTP : {
    statusCode    : 200,
    customMessage : 'OTP has been sent successfully.',
    type          : 'RESEND_OTP'
  },
  NOTES_ADDED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Notes Added Successfully',
    type          : 'NOTES_ADDED_SUCCESSFULLY'
  },
  CARD_ADDED : {
    statusCode    : 200,
    customMessage : "Card added successfully",
    type          : 'CARD_ADDED'
  },
  ITEM_ADDED : {
    statusCode    : 200,
    customMessage : "Item added successfully",
    type          : 'ITEM_ADDED'
  },
  ITEMS_IMPORTED : {
    statusCode    : 200,
    customMessage : "Items imported successfully",
    type          : 'ITEMS_IMPORTED'
  },
  CATEGORY_ADDED : {
    statusCode    : 200,
    customMessage : "Category added successfully",
    type          : 'CATEGORY_ADDED'
  },
  GROUP_ADDED : {
    statusCode    : 200,
    customMessage : "Permission Group added successfully",
    type          : 'GROUP_ADDED'
  },
  SUBCATEGORY_ADDED : {
    statusCode    : 201,
    customMessage : "Sub Category added successfully",
    type          : 'SUBCATEGORY_ADDED'
  },
  USER_ADDED : {
    statusCode    : 200,
    customMessage : "User added successfully",
    type          : 'USER_ADDED'
  },
  BUSINESS_ADDED : {
    statusCode    : 200,
    customMessage : "Business added successfully",
    type          : 'BUSINESS_ADDED'
  },
  REQUEST_ADDED : {
    statusCode    : 200,
    customMessage : "Business request added successfully",
    type          : 'REQUEST_ADDED'
  },
  MEMBERSHIP_ALREADY_EXIST : {
    statusCode    : 200,
    customMessage : "Membership already added.",
    type          : 'MEMBERSHIP_ALREADY_EXIST'
  },
  EDITED : {
    statusCode    : 200,
    customMessage : "User Info Updated",
    type          : 'EDITED'
  },
  INVITATION_REVOKED : {
    statusCode    : 200,
    customMessage : "Your invitation to email has been revoked.",
    type          : 'INVITATION_REVOKED'
  },
  APPOINTMENT_CANCELLED : {
    statusCode    : 200,
    customMessage : "Appointment cancelled successfully",
    type          : 'APPOINTMENT_CANCELLED'
  },
  BANK_ACCOUNT_ADDED : {
    statusCode    : 201,
    customMessage : "Bank account added successfully",
    type          : 'BANK_ACCOUNT_ADDED'
  },
  DEFAULT_CARD : {
    statusCode    : 201,
    customMessage : "Default card changed successfully.",
    type          : 'DEFAULT_CARD'
  },
  SERVICE_STARTED : {
    statusCode    : 201,
    customMessage : "Booking started successfully.",
    type          : 'SERVICE_STARTED'
  },
  SERVICE_ENDED : {
    statusCode    : 201,
    customMessage : "Booking ended successfully.",
    type          : 'SERVICE_ENDED'
  },
  RATING_DONE : {
    statusCode    : 200,
    customMessage : 'Rating done successfully.',
    type          : 'RATING_DONE'
  },
  BOOKING_REJECTED : {
    statusCode    : 201,
    customMessage : "Booking rejected successfully.",
    type          : 'BOOKING_REJECTED'
  },
  PROFILE_UPDATED : {
    statusCode    : 200,
    customMessage : 'Your profile has been updated.',
    type          : 'PROFILE_UPDATED'
  },
  PHONE_NUMBER_UPDATE : {
    statusCode    : 200,
    customMessage : 'Please enter OTP for verify your phone number.',
    type          : 'PHONE_NUMBER_UPDATE'
  },
  PHONE_NUMBER_UPDATE_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Phone number updated',
    type          : 'PHONE_NUMBER_UPDATE_SUCCESSFULLY'
  },
  BOOKING_ACCEPTED : {
    statusCode    : 200,
    customMessage : 'Booking accepted successfully',
    type          : "BOOKING_ACCEPTED"
  },
  EMAIL_TOKEN_VERIFIED : {
    statusCode    : 200,
    customMessage : 'Token Verified',
    type          : "EMAIL_TOKEN_VERIFIED"
  },
  OTP_TOKEN_VERIFIED : {
    statusCode    : 200,
    customMessage : 'Otp Verified',
    type          : "OTP_TOKEN_VERIFIED"
  },
  APPOINTMENT_MADE_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Appointment made successfully.',
    type          : 'APPOINTMENT_MADE_SUCCESSFULLY'
  },
  BOOKING_CANCELLED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : "Booking cancelled successfully",
    type          : 'BOOKING_CANCELLED_SUCCESSFULLY'
  },
  OUT_FOR_SERVICE : {
    statusCode    : 200,
    customMessage : 'Out for service.',
    type          : 'OUT_FOR_SERVICE'
  },
  DEFAULT : {
    statusCode    : 200,
    customMessage : 'Success',
    type          : 'DEFAULT'
  },
  DEFAULT_TEMP : {
    statusCode    : 402,
    customMessage : 'Success',
    type          : 'DEFAULT'
  },
  INVITATION_SENT : {
    statusCode    : 200,
    customMessage : 'Invitation Sent',
    type          : 'INVITATION_SENT'
  },
  INVITATION_SENT_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Invitation Sent Successfully, Please check your mail !!',
    type          : 'INVITATION_SENT_SUCCESSFULLY'
  },
  MEMBERSHIP_SUBSCRIBED : {
    statusCode    : 200,
    customMessage : 'Membership Subscribed Successfully.',
    type          : 'MEMBERSHIP_SUBSCRIBED'
  },
  MEMBERSHIP_END : {
    statusCode    : 200,
    customMessage : 'Membership ended successfully.',
    type          : 'MEMBERSHIP_END'
  },
  SET_AVAILABILITY : {
    statusCode    : 200,
    customMessage : 'Thanks, your availability has now been updated.',
    type          : 'SET_AVAILABILITY'
  },
  LOGGED_IN : {
    statusCode    : 200,
    customMessage : 'Logged In Successfully.',
    type          : 'LOGGED_IN'
  },
  LOGGED_OUT : {
    statusCode    : 200,
    customMessage : 'Logged Out Successfully.',
    type          : 'LOGGED_OUT'
  },
  USER_SAVED : {
    statusCode    : 200,
    customMessage : 'User Saved Successfully.',
    type          : 'USER_SAVED'
  },
  PROMO_CODE_CREATED : {
    statusCode    : 201,
    customMessage : 'Promo code created successfully.',
    type          : "PROMO_CODE_CREATED"
  },
  PROMO_CODE_APPLIED : {
    statusCode    : 200,
    customMessage : 'Promotion code applied successfully.',
    type          : 'PROMO_CODE_APPLIED'
  },
  LOGOUT : {
    statusCode    : 200,
    customMessage : 'Logged out successfully.',
    type          : 'LOGOUT'
  },
  NEW_PASSWORD_LINK_SENT : {
    statusCode    : 200,
    customMessage : 'Password reset link has been sent to your registered email.',
    type          : 'NEW_PASSWORD_LINK_SENT'
  },
  PASSWORD_RESET_TOKEN_VERIFIED : {
    statusCode    : 200,
    customMessage : 'Token Verified',
    type          : 'PASSWORD_RESET_TOKEN_VERIFIED'
  },
  WEB_TOKEN_ADD : {
    statusCode    : 200,
    customMessage : 'Web Token added successfully',
    type          : 'NEW_TOKEN_ADDED'
  },
  WEB_TOKEN_DELETE : {
    statusCode    : 200,
    customMessage : 'Web Token deleted successfully',
    type          : 'TOKEN_DELETED'
  },
  RESELLER_BUSINESS_INFO : {
    status        : 200,
    customMessage : 'Reseller Business info fetched',
    type          : 'RESELLER_BUSINESS_INFO'
  },
  RESELLER_BUSINESS_INFO_UPDATED : {
    status        : 200,
    customMessage : 'Reseller Business info updated',
    type          : 'RESELLER_BUSINESS_INFO_UPDATED'
  },
  RESELLER_INFO_UPDATED : {
    statusCode    : 200,
    customMessage : 'Reseller info updated successfully',
    type          : 'RESELLER_INFO_UPDATED'
  },
  RESELLER_DISABLED : {
    statusCode    : 200,
    customMessage : 'Reseller disabled successfully',
    type          : 'RESELLER_DISABLED'
  },
  RESELLER_CREATED : {
    statusCode    : 200,
    customMessage : 'Reseller created successfully',
    type          : 'RESELLER_CREATED'
  },
  MESSAGE_RECEIVED : {
    status        : 200,
    customMessage : 'Message received by server',
    type          : 'MESSAGE_RECEIVED'
  },
  MESSAGE_UPDATED: {
    statusCode: 200,
    customMessage: 'Message updated.',
    type: 'MESSAGE_UPDATED'
  },
  FEEDBACK_SUCCESSFULL : {
    statusCode    : 200,
    customMessage : 'Feedback Sent ',
    type          : 'FEEDBACK_SUCCESSFULL'
  },
  QUERY_RECEIVED : {
    statusCode    : 200,
    customMessage : 'Query Received',
    type          : 'QUERY_RECEIVED'
  },
  INVITATION_RESENT : {
    statusCode    : 200,
    customMessage : 'Your invitation to email has been resent.',
    type          : 'INVITATION_SENT'
  },
  ALREADY_EXIST_FROM_GOOGLE : {
    statusCode    : 201,
    customMessage : 'Email/Contact Number already exists.',
    type          : 'ALREADY_EXIST_FROM_GOOGLE'
  },
  ALREADY_EXIST_FROM_FUGU : {
    statusCode    : 202,
    customMessage : 'Email/Contact Number already exists.',
    type          : 'ALREADY_EXIST_FROM_FUGU'
  },
  REDIRECT_TO_SET_PASSWORD : {
    statusCode : 402,
    customMessage: 'User Password is not set',
    type         : 'ALREADY_EXIST_FROM_FUGU'
  },
  WORKSPACE_CREATED_SUCCESSFULLY : {
    statusCode    : 200,
    customMessage : 'Space Created Successfully.',
    type          : 'WORKSPACE_CREATED_SUCCESSFULLY'
  },
  PHONE_NUMBER_EMPTY : {
    statusCode    : 206,
    customMessage : 'Please provide your phone number',
    type          : "PHONE_NUMBER_DOES_NOT_EXIST"
  },
  MESSAGE_STARRED: {
    statusCode: 200,
    customMessage: 'Message starred',
    type: 'DEFAULT'
  },
  MESSAGE_UNSTARRED: {
    statusCode: 200,
    customMessage: 'Message unstarred',
    type: 'DEFAULT'
  },
  ALL_MESSAGES_UNSTARRED: {
    statusCode: 200,
    customMessage: 'All messages unstarred',
    type: 'DEFAULT'
  },
  GROUP_CREATED_SUCCESSFULLY: {
    statusCode: 200,
    customMessage: "Group created ",
    type: 'GROUP_CREATED_SUCCESSFULLY'
  },
  USER_REMOVED: {
    statusCode: 200,
    customMessage: 'User Removed',
    type: 'DEFAULT'
  },
  MESSAGE_DELETED: {
    statusCode: 200,
    customMessage: 'Message Deleted',
    type: 'DEFAULT'
  },
  UPGRADED_GUEST: {
    statusCode: 200,
    customMessage: 'Guest upgraded to team member',
    type: 'DEFAULT'
  },
  USER_TO_ADMIN: {
    statusCode: 200,
    customMessage: 'User made Admin',
    type: 'DEFAULT'
  },
  ADMIN_TO_USER: {
    statusCode: 200,
    customMessage: 'User removed as Admin',
    type: 'DEFAULT'
  },
  OWNERSHIP_TRANSFERRED: {
    statusCode: 200,
    customMessage: 'Ownership transferred',
    type: 'DEFAULT'
  },
  CHANNELS_ADDED_SUCESSFULLY: {
    statusCode: 200,
    customMessage: 'Default Channels added',
    type: 'DEFAULT'
  },
  CHANNELS_REMOVED_SUCESSFULLY: {
    statusCode: 200,
    customMessage: 'Default Channels removed',
    type: 'DEFAULT'
  },
  ANY_USER_CAN_INVITE: {
    statusCode: 200,
    customMessage: 'Everyone can invite',
    type: 'DEFAULT'
  },
  ONLY_ADMINS_CAN_INVITE: {
    statusCode: 200,
    customMessage: 'Only Admins can invite',
    type: 'DEFAULT'
  },
  BUSINESS_INFO_CHANGED: {
    statusCode: 200,
    customMessage: 'Business Information updated',
    type: 'DEFAULT'
  },
  BUSINESS_SIGNUP_MODE: {
    statusCode: 200,
    customMessage: 'Workspace Signup Mode Updated',
    type: 'DEFAULT'
  },
  WORKSPACE_DEFAULT_MANAGER: {
    statusCode: 200,
    customMessage: 'Default manager updated',
    type: 'DEFAULT'
  },
  MESSAGE_DELETION: {
    statusCode: 200,
    customMessage: 'Message deletion enabled',
    type: 'DEFAULT'
  },
  MESSAGE_DELETION_TIME: {
    statusCode: 200,
    customMessage: 'Message deletion time limit updated',
    type: 'DEFAULT'
  },
  MESSAGE_DELETION_DISABLED: {
    statusCode: 200,
    customMessage: 'Message deletion disabled',
    type: 'DEFAULT'
  },
  EDIT_MESSAGE_DISABLED: {
    statusCode: 200,
    customMessage: 'Message editing disabled',
    type: 'DEFAULT'
  },
  EDIT_MESSAGE_TIME: {
    statusCode: 200,
    customMessage: 'Message editing time updated',
    type: 'DEFAULT'
  },
  EDIT_MESSAGE: {
    statusCode: 200,
    customMessage: 'Message editing enabled',
    type: 'DEFAULT'
  },
  WORKSPACE_ICON_UPDATED: {
    statusCode: 200,
    customMessage: 'Workspace icon updated',
    type: 'DEFAULT'
  },
  WORKSPACE_NAME_UPDATED: {
    statusCode: 200,
    customMessage: 'Workspace name updated',
    type: 'DEFAULT'
  },
  WORKSPACE_IMAGE_REMOVED : {
    statusCode: 200,
    customMessage: 'Workspace image removed',
    type: 'DEFAULT'
  },
  WORKSPACE_EMAILS_HIDDEN : {
    statusCode: 200,
    customMessage: 'Emails hidden for this workspace',
    type: 'DEFAULT'
  },
  WORKSPACE_EMAILS_VISIBLE : {
    statusCode: 200,
    customMessage: 'Emails visible for this workspace',
    type: 'DEFAULT'
  },
  WORKSPACE_NUMBERS_HIDDEN : {
    statusCode: 200,
    customMessage: 'Contact number hidden for this workspace',
    type: 'DEFAULT'
  },
  WORKSPACE_NUMBERS_VISIBLE : {
    statusCode: 200,
    customMessage: 'Contact number visible for this workspace',
    type: 'DEFAULT'
  },
  CHAT_DELETED : {
    statusCode: 200,
    customMessage: 'Chat deleted',
    type: 'DEFAULT'
  },
  REMOVE_PROFILE_PICTURE : {
    statusCode: 200,
    customMessage: 'Profile picture removed',
    type: 'DEFAULT'
  },
  PROFILE_PICTURE_UPLOADED : {
    statusCode: 200,
    customMessage: 'Profile picture uploaded',
    type: 'DEFAULT'
  },
  MESSAGE_BROADCAST : {
    statusCode: 200,
    customMessage: 'Message Broadcasted',
    type: 'DEFAULT'
  },
  SEND_EMAIL : {
    statusCode: 200,
    customMessage: 'Email sent.',
    type: 'DEFAULT'
  },
  EMPTY : {
    statusCode: 200,
    customMessage: '',
    type: 'DEFAULT'
  },
  LEFT_GROUP: {
    statusCode: 200,
    customMessage: 'Left group',
    type: 'DEFAULT'
  },
  GROUP_PHOTO_UPDATED: {
    statusCode: 200,
    customMessage: 'Group photo updated',
    type: 'DEFAULT'
  },
  GROUP_NAME_CHANGED: {
    statusCode: 200,
    customMessage: 'Group name changed',
    type: 'DEFAULT'
  },
  NO_DATA_RECORD: {
    statusCode: 204,
    customMessage: 'Message info not found',
    type: 'NO_DATA_RECORD'
  },
  NOTIFICATION_CHANGED : {
    statusCode: 200,
    customMessage: 'Notification preference changed',
    type: 'NOTIFICATION_CHANGED'
  },
  EDIT_GROUP_CREATION_ENABLED: {
    statusCode: 200,
    customMessage: 'Everyone can create group in this workspace.',
    type: 'DEFAULT'
  },
  EDIT_GROUP_CREATION_DISABLED: {
    statusCode: 200,
    customMessage: 'No one is allowed to create group in this workspace.',
    type: 'DEFAULT'
  },
  ENABLED_ONE_TO_ONE_CHAT: {
    statusCode: 200,
    customMessage: 'enabled one to one chat for this workspace.',
    type: 'DEFAULT'
  },
  DISABLED_ONE_TO_ONE_CHAT: {
    statusCode: 200,
    customMessage: 'disabled one to one chat for this workspace.',
    type: 'DEFAULT'
  },
  VERIFICATION_LINK_SENT : {
    statusCode    : 200,
    customMessage : 'Verification Link has been Sent to  your Email. Please Check !!',
    type          : "VERIFICATION_LINK_SENT"
  },
  MEETING_SCHEDULED : {
    statusCode    : 200,
    customMessage : 'Meeting Scheduled Successfully',
    type          : "MEETING_SCHEDULED"
  },
  MEETING_SCHEDULED_UPDATED : {
    statusCode    : 200,
    customMessage : 'Meeting Updated Successfully',
    type          : "MEETING_SCHEDULED_UPDATED"
  },
  MEETING_DOES_NOT_EXIST : {
    statusCode    : 200,
    customMessage : 'Meeting does not exist',
    type          : "MEETING_DOES_NOT_EXIST"
  },
  TASK_SUBMITTED : {
    statusCode    : 200,
    customMessage : 'Task has been submitted Successfully.',
    type          : "TASK_SUBMITTED"
  },
  TASK_UPDATED : {
    statusCode    : 200,
    customMessage : 'Task Updated Successfully',
    type          : "TASK_UPDATED"
  },
  DEACTIVATED_IN_ALL_SPACES : {
    statusCode    : 200,
    customMessage : 'User(s) deactivated in all spaces.',
    type          : 'DEACTIVATED_IN_ALL_SPACES'
  }
};

exports.swaggerDefaultResponseMessages = [
  { code : 200, message : 'OK' },
  { code : 201, message : 'CREATED' },
  { code : 400, message : 'Bad Request' },
  { code : 401, message : 'Unauthorized' },
  { code : 403, message : 'Forbidden' },
  { code : 404, message : 'Data Not Found' },
  { code : 500, message : 'Something went wrong, try again' }
];
