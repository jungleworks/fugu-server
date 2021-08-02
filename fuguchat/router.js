const express = require('express');
const multer = require('multer');

const router = express.Router({ caseSensitive: true });
const routehandler = require('./Routes/routehandler');
const validator = require('./Routes/validator');

const uploader = multer({ dest: './uploads/' });

// TODO : remove redundant code
router.get('/user/getUserInfo', validator.getUserInfo, routehandler.getUserInfo);
router.get('/user/verifyToken', validator.verifyToken, routehandler.verifyToken);
router.get('/user/verifyPasswordResetToken', validator.verifyPasswordResetToken, routehandler.verifyPasswordResetToken);
router.get('/user/getUsers', validator.getUsers, routehandler.getUsers);
router.post('/user/setPassword', validator.setPassword, routehandler.setPassword);
router.post('/user/v1/userLogin', validator.userLoginValidation, routehandler.userLoginV1);
router.post('/user/v2/userLogin', validator.userLoginValidationV2, routehandler.userLoginV2);
router.post('/user/v1/loginViaAccessToken', validator.loginViaAccessTokenV1, routehandler.loginViaAccessTokenV1);
router.get('/conversation/getBotConfiguration', validator.getBotConfiguration, routehandler.getBotConfiguration);
router.post('/user/updateDeviceToken', validator.updateDeviceToken, routehandler.updateDeviceToken);
router.post('/user/userLogout', validator.userLogoutValidation, routehandler.userLogout);
router.post('/user/editUserInfo', uploader.any(), validator.editUserInfo, routehandler.editUserInfo);
router.patch('/user/editUserInfo', uploader.any(), validator.editUserInfo, routehandler.editUserInfo);
router.post('/user/inviteUser', validator.inviteUser, routehandler.inviteUser);
router.post('/user/resendInvitation', validator.resendInvitation, routehandler.resendInvitation);
router.post('/user/verifySignUpToken', validator.verifySignUpToken, routehandler.verifySignUpToken);
router.post('/user/changePassword', validator.changePassword, routehandler.changePassword);
router.post('/user/resetPassword', validator.resetPassword, routehandler.resetPassword);
router.post('/user/resetPasswordRequest', validator.resetPasswordRequest, routehandler.resetPasswordRequest);
router.post('/user/changeContactNumberRequest', validator.changeContactNumberRequest, routehandler.changeContactNumberRequest);
router.post('/user/changeContactNumber', validator.changeContactNumber, routehandler.changeContactNumber);
router.get('/user/getUserInvites', validator.getUserInvites, routehandler.getUserInvites);
router.post('/user/sendFeedback', validator.sendFeedback, routehandler.sendFeedback);
router.post('/user/submitGdprQuery', validator.submitGdprQuery, routehandler.submitGdprQuery);
router.patch('/user/manageUserRole', validator.manageUserRole, routehandler.manageUserRole);
router.get('/user/verifyInfo', validator.verifyInfo, routehandler.verifyInfo);
router.get('/user/getUserContacts', validator.getUserContacts, routehandler.getUserContacts);
router.post('/user/revokeInvitation', validator.revokeInvitation, routehandler.revokeInvitation);
router.post('/user/verifyAndRegisterGoogleUser', validator.verifyAndRegisterGoogleUser, routehandler.verifyAndRegisterGoogleUser);
router.post('/user/registerPhoneNumber', validator.registerPhoneNumber, routehandler.registerPhoneNumber);
router.post('/user/checkInvitedContacts', validator.checkInvitedContacts, routehandler.checkInvitedContacts);
router.post('/user/updateDeviceTokenWeb', validator.updateDeviceTokenWeb, routehandler.updateDeviceTokenWeb);
router.get('/users/getInfo', validator.getInfo, routehandler.getInfo);
router.post('/users/testPushNotification', validator.testPushNotification, routehandler.testPushNotification);
router.post('/users/editInfo', uploader.any(), validator.editInfo, routehandler.editFuguUserInfo);
router.post('/users/sendMessageEmail', validator.sendMessageEmail, routehandler.sendMessageEmail);
router.get('/users/getUserChannelsInfo', validator.getUserChannelsInfo, routehandler.getUserChannelsInfo);
router.get('/user/getPushNotifications', validator.getPushNotifications, routehandler.getPushNotifications);

router.get('/workspace/checkEmail', validator.checkEmail, routehandler.checkEmail);
router.post('/workspace/switchWorkspace', validator.switchWorkspace, routehandler.switchWorkspace);
router.post('/workspace/v1/signup', validator.signupV1, routehandler.signupV1);
router.post('/workspace/v2/signup', validator.signupV2, routehandler.signupV2);
router.post('/workspace/googleSignup', validator.googleSignup, routehandler.googleSignup);
router.post('/workspace/syncGoogleContacts', validator.syncGoogleContacts, routehandler.syncGoogleContacts);
router.post('/workspace/v1/verifyOtp', validator.verifyOtp, routehandler.verifyOtpV1);
router.post('/workspace/v1/setPassword', validator.setWorkspacePasswordV1, routehandler.setWorkspacePasswordV1);
router.post('/workspace/createWorkspace', validator.createWorkspace, routehandler.createWorkspace);
router.post('/workspace/editConfiguration', validator.editConfiguration, routehandler.editConfiguration);
router.get('/workspace/getConfiguration', validator.getConfiguration, routehandler.getConfiguration);
router.get('/workspace/getPublicInfo', validator.getPublicInfo, routehandler.getPublicInfo);
router.post('/workspace/publicInvite', validator.publicInvite, routehandler.publicInvite);
router.post('/workspace/join', validator.joinWorkspace, routehandler.joinWorkspace);
router.post('/workspace/addPublicEmailDomain', validator.addPublicEmailDomain, routehandler.addPublicEmailDomain);
router.post('/workspace/editPublicEmailDomain', validator.editPublicEmailDomain, routehandler.editPublicEmailDomain);
router.get('/workspace/getPublicEmailDomains', validator.getPublicEmailDomains, routehandler.getPublicEmailDomains);
router.get('/workspace/getOpenAndInvited', validator.getOpenAndInvited, routehandler.getOpenAndInvited);
router.get('/workspace/getAllMembers', validator.getAllMembers, routehandler.getAllMembers);
router.get('/workspace/getInvitedUsers', validator.getInvitedUsers, routehandler.getInvitedUsers);
router.post('/workspace/leave', validator.leave, routehandler.leave);
router.post('/workspace/editInfo', validator.editWorkspaceInfo, routehandler.editWorkspaceInfo);
router.get('/workspace/getWorkspaceDetails', validator.getWorkspaceDetails, routehandler.getWorkspaceDetails);
router.post('/workspace/updateAuthUser', routehandler.updateAuthUser);
router.post('/workspace/deactivateUser', validator.deactivateUser, routehandler.deactivateUser);

router.get('/billing/getPaymentDetails', validator.getPaymentDetails, routehandler.getPaymentDetails);
router.post('/billing/addUserCard', validator.addUserCards, routehandler.addUserCards);
router.post('/billing/buyPlan', validator.buyPlan, routehandler.buyPlan);
router.post('/billing/updatePlan', routehandler.updatePlan);
router.post('/billing/addCard', validator.addUserCards, routehandler.addUserCards);
// router.post('/webhook', routehandler.authorizePayment);
router.get('/billing/getIntentToken', validator.getIntentToken, routehandler.getIntentToken);

// conversation API'sxx
router.post('/conversation/uploadFile', uploader.any(), validator.uploadFileValidation, routehandler.uploadFile);
router.get('/conversation/getMessages', validator.getMessages, routehandler.getMessages);
router.get('/conversation/getConversations', validator.getConversations, routehandler.getConversations);
router.get('/conversation/getThreadMessages', validator.getThreadMessages, routehandler.getThreadMessages);
router.get('/conversation/getLatestThreadMessage', validator.getLatestThreadMessage, routehandler.getLatestThreadMessage);
router.post('/conversation/sendMessage', validator.conversationSendMessage, routehandler.conversationSendMessage);
router.get('/conversation/searchMessages', validator.searchMessages, routehandler.searchMessages);
router.post('/conversation/starMessage', validator.starMessage, routehandler.starMessage);
router.get('/conversation/getStarredMessages', validator.getStarredMessages, routehandler.getStarredMessages);
router.post('/conversation/inviteToConference', validator.inviteToConference, routehandler.inviteToConference);
router.post('/conversation/verifyTurnCreds', validator.verifyTurnCreds, routehandler.verifyTurnCreds);
router.post('/conversation/updateStatus', validator.updateStatus, routehandler.updateStatus);
router.get('/conversation/exportData', validator.exportData, routehandler.exportData);
router.post('/conversation/requestData', validator.requestExport, routehandler.requestExport);
router.get('/conversation/getExportData', validator.getExportData, routehandler.getExportData);
router.post('/conversation/updateConferenceCall', validator.updateConferenceCall, routehandler.updateConferenceCall);

router.post('/map', routehandler.map)


router.get('/chat/groupChatSearch', validator.groupChatSearch, routehandler.groupChatSearch);
router.post('/chat/createGroupChat', uploader.any(), validator.createGroupChat, routehandler.createGroupChat);
router.post('/chat/createOneToOneChat', validator.createO2OChat, routehandler.createO2OChat);
router.post('/chat/addMember', validator.addChatMember, routehandler.addChatMember);
router.post('/chat/removeMember', validator.removeChatMember, routehandler.removeChatMember);
router.post('/chat/join', validator.joinChat, routehandler.joinChat);
router.post('/chat/leave', validator.leaveChat, routehandler.leaveChat);
router.get('/chat/getGroupInfo', validator.getChatGroupInfo, routehandler.getChatGroupInfo);
router.get('/chat/getChatGroups', validator.getChatGroups, routehandler.getChatGroups);
router.delete('/chat/clearChatHistory', validator.clearChatHistory, routehandler.clearChatHistory);
router.delete('/chat/deleteMessage', validator.deleteMessage, routehandler.deleteMessage);
router.put('/chat/changeFollowingStatus', validator.changeFollowingStatus, routehandler.changeFollowingStatus);
router.post('/chat/changeGroupInfo', validator.changeGroupInfo, routehandler.changeGroupInfo);
router.post('/chat/editInfo', uploader.any(), validator.editChatInfo, routehandler.editChatInfo);
router.get('/chat/getChannelInfo', validator.getChannelInfo, routehandler.getChannelInfo);
router.post('/chat/editMessage', validator.editMessage, routehandler.editMessage);
router.patch('/chat/updateGuest', validator.updateGuest, routehandler.updateGuest);
router.delete('/chat/deleteUsersFromChannel', validator.deleteFromChannel, routehandler.deleteFromChannel);
router.get('/chat/getGuestChannels', validator.getGuestChannels, routehandler.getGuestChannels);
router.get('/chat/userSearch', validator.userSearch, routehandler.userSearch);
router.get('/chat/pendingAndAcceptedUserSearch', validator.pendingAndAcceptedUserSearch, routehandler.pendingAndAcceptedUserSearch);
router.get('/chat/getMessageSeenBy', validator.getMessageSeenBy, routehandler.getMessageSeenBy);
router.post('/chat/requestMessage', validator.requestMessage, routehandler.requestMessage);

// APPS AND WEBHOOK API's
router.post('/apps/install', validator.installApps, routehandler.installApps);
router.get('/apps/get', validator.getApps, routehandler.getApps);
router.patch('/apps/edit', validator.installApps, routehandler.installApps);
router.post('/webhook/create', validator.createWebhook, routehandler.createWebhook);
router.get('/webhook/get', validator.getWebhooks, routehandler.getWebhooks);
router.patch('/webhook/edit', validator.editWebhook, routehandler.editWebhook);
router.post('/webhook', validator.conversationSendMessage, routehandler.conversationSendMessage);
router.head('/webhook', routehandler.installApps1);




// ATTENDANCE API's
router.get('/attendance/getUserDetails', validator.getLeaveBalance, routehandler.getLeaveBalance);
router.post('/attendance/editBusinessLeave', validator.editBusinessLeave, routehandler.editBusinessLeave);
router.get('/attendance/getBusinessLeaves', validator.getBusinessLeaves, routehandler.getBusinessLeaves);
router.post('/attendance/editUserLeaves', validator.editUserLeaves, routehandler.editUserLeaves);
router.patch('/attendance/editUserInfo', validator.editUserInfoInAttendance, routehandler.editUserInfoInAttendance);
router.get('/attendance/getMembers', validator.getMembers, routehandler.getMembers);
router.patch('/attendance/editBusinessInfo', validator.editBusinessInfoInAttendance, routehandler.editBusinessInfoInAttendance);
router.get('/attendance/getBusinessInfo', validator.getBusinessInfo, routehandler.getBusinessInfo);
router.patch('/attendance/editUserPunchStatus', validator.editUserPunchStatus, routehandler.editUserPunchStatus);
router.get('/attendance/getUsersTimesheet', validator.getUsersTimesheet, routehandler.getUsersTimesheet);
router.post('/attendance/verifyAttendanceCredentials', uploader.any(), validator.verifyAttendanceCredentials, routehandler.verifyAttendanceCredentials);
router.post('/attendance/uploadDefaultImage', uploader.any(), validator.uploadDefaultImage, routehandler.uploadDefaultImage);
router.get('/attendance/getBusinessReport', validator.getBusinessReport, routehandler.getBusinessReport);
router.post('/attendance/deleteExpiredLeaves',validator.deleteExpiredLeaves, routehandler.deleteExpiredLeaves);
router.post('/attendance/updateMembersOnLeave',validator.updateMembersOnLeave, routehandler.updateMembersOnLeave);
router.get('/attendance/getToken', validator.getToken, routehandler.getToken);


// Open Apis
router.post('/workspace/createUser', validator.createUser, routehandler.createUser);
router.post('/workspace/createGroup', validator.createGroup, routehandler.createGroup);
router.post('/workspace/addMemberInGroup', validator.addMemberInGroup, routehandler.addMemberInGroup);
router.post('/workspace/disableUser', validator.disableUser, routehandler.disableUser);
router.post('/workspace/renameGroup', validator.renameGroup, routehandler.renameGroup);
router.post('/workspace/removeMemberFromGroup', validator.removeMemberFromGroup, routehandler.removeMemberFromGroup);
router.post('/workspace/deleteGroup', validator.deleteGroup, routehandler.deleteGroup);
router.get('/workspace/getGroupInfo', validator.getGroupInfo, routehandler.getGroupInfo);
router.post('/createSelfChat', routehandler.createSelfChat);
router.get('/workspace/getAllUserUnreadCount', validator.getAllUserUnreadCount, routehandler.getAllUserUnreadCount);

// Notifications API's
router.post('/notification/markReadAll', validator.markReadAll, routehandler.markReadAll);
router.get('/notification/getNotifications', validator.getNotifications, routehandler.getNotifications);
router.get('/notification/getUnreadNotifications', validator.getUnreadNotifications, routehandler.getUnreadNotifications);

// Apps/Bots API's

router.post('/onBoardTookanUser', validator.onBoardUser, routehandler.onBoardUser);
router.post('/editWorkspace', validator.editWorkspace, routehandler.editWorkspace);
router.get('/fugu/whatsNewFeature', validator.whatsNewFeature, routehandler.whatsNewFeature);
router.post('/fugu/notifyUsers', validator.notifyUsers, routehandler.notifyUsers);
router.post('/socketData', validator.socketData, routehandler.socketData);

// BOT Api's

router.post('/bot/handleBot', validator.handleBot, routehandler.handleBot);
router.post('/bot/publishMessageOnFuguBot', uploader.any(), validator.publishMessageOnFuguBot, routehandler.publishMessageOnFuguBot);
router.post('/bot/attendanceCron', validator.attendanceCron, routehandler.attendanceCron);
router.post('/bot/publishMessageOnAttendanceBot', validator.publishMessageOnAttendanceBot, routehandler.publishMessageOnAttendanceBot);
router.post('/bot/publishMessageOnFuguBotChannel', validator.publishMessageOnFuguBotChannel, routehandler.publishMessageOnFuguBotChannel);
router.post('/bot/publishMessageOnHrmBot', validator.publishMessageOnHrmBot, routehandler.publishMessageOnHrmBot);
router.post('/bot/publishMessageOnScrumBot',   validator.publishMessageOnScrumBot, routehandler.publishMessageOnScrumBot);
router.post('/bot/fuguCronMessages', routehandler.fuguCronMessages);
router.post('/publishMessageOnFuguBotChannelForAndroid', validator.publishMessageOnFuguBotChannelForAndroid, routehandler.publishMessageOnFuguBotChannelForAndroid);
router.post('/bot/secretSanta', validator.publishSecretSanta, routehandler.publishSecretSanta);

// crons
router.post('/server/logException', validator.logException, routehandler.logException);
router.delete('/user/deletePendingRequests', validator.deletePendingRequests, routehandler.deletePendingRequests);
router.patch('/user/endSnooze', routehandler.endSnooze);

// JWT
router.get('/user/tokenVerification',validator.verifyAttendanceToken, routehandler.verifyAttendanceToken);

// fugu API's

router.post('/scrum/insertScrumDetails', validator.insertScrumDetails, routehandler.insertScrumDetails );
router.post('/scrum/editScrumDetails',    validator.editScrumDetails , routehandler.editScrumDetails       );
router.get( '/scrum/getScrumDetails' ,          validator.getScrumDetails     , routehandler.getScrumDetails);
router.post( '/scrum/checkUserAvailability' ,  validator.checkUserAvailability , routehandler.checkUserAvailability);
router.post('/scrum/cron' , validator.scrumCron , routehandler.scrumCron )

//Yelo Integration APIs

router.post('/workspace/inviteUsers', validator.inviteUsers, routehandler.inviteUser);
router.post('/insertElasticMessages', routehandler.insertElasticMessages);

router.post('/meet/callLogs',       validator.meetCount,         routehandler.meetCount);


//Onboarding New OTP Flow
router.post('/get_login_otp',                      validator.getLoginOtp,       routehandler.getLoginOtp);
router.post('/validate_login_otp',                 validator.validateLogInOtp,  routehandler.validateOtpOrToken);
router.post('/user/updateUserAndWorkspaceDetails', validator.updateUserDetails, routehandler.updateUserDetails);


router.post('/calculateInviteTotalPrice',           validator.calculateInvitePrice, routehandler.calculateInvitePrice);
router.post('/payment/initiatePayment',             validator.initiatePayment,      routehandler.initiatePayment);
router.post('/payment/webhook',                     validator.razorpayPaymentWebhook, routehandler.razorpayPaymentWebhook);


router.get('/auth/getAccessToken',                  validator.getAccessToken,       routehandler.getAccessToken);
router.get('/getDomainViaAccessToken',              validator.getWhiteLabelDomain,  routehandler.getWhiteLabelDomain);
router.get('/getPlanExpiry',                        validator.getPlanExpiry,        routehandler.getPlanExpiry);

router.get('/getApiCountRedis',                     routehandler.getApiCountFromRedis);
router.get('/deleteApiCountKeyRedis',               routehandler.deleteApiCountFromRedis);


// HRM CUSTOMIZATIONS
router.post('/hrm/getUserChannelMessages',          validator.getUserChannelMessages,  routehandler.getUserChannelMessages);
router.post('/hrm/postMessage',                     validator.postMessage,             routehandler.postMessage);
//apple signin
router.post('/apple/signIn',                        validator.appleSignIn,          routehandler.appleSignIn);

module.exports = router;
