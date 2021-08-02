
const express                  = require('express');
const router                   = express.Router({ caseSensitive : true });
const routehandler             = require('./Routes/routehandler');
const validator                = require('./Routes/validator');

router.post('/attendance/signup',                    validator.signup,                 routehandler.signup);
router.post('/attendance/clockIn',                   validator.clockIn,                routehandler.clockIn);
router.post('/attendance/clockOut',                  validator.clockOut,               routehandler.clockOut);
router.post('/attendance/timesheet',                 validator.timesheet,              routehandler.timesheet);
router.post('/attendance/teamPunchStatus',           validator.teamPunchStatus,        routehandler.teamPunchStatus);
router.post('/attendance/getMonthlyReport',          validator.getMonthlyReport,       routehandler.getMonthlyReport);
router.post('/attendance/editUserInfo',              validator.editUserInfo,           routehandler.editUserInfo);
router.get('/attendance/getBusinessReport',          validator.getBusinessReport,      routehandler.getBusinessReport);
router.post('/attendance/leave',                     validator.leave,                  routehandler.leave);
router.post('/attendance/changeManagerRequest',      validator.changeManagerRequest,   routehandler.changeManagerRequest);
router.post('/attendance/changeEmail',               validator.changeEmail,            routehandler.changeEmail);
router.get('/attendance/leaveBalance',               validator.leaveBalance,           routehandler.leaveBalance);
router.post('/attendance/editBusinessLeave',         validator.editBusinessLeave,      routehandler.editBusinessLeave);
router.post('/attendance/getBusinessLeaves',         validator.getBusinessLeaves,      routehandler.getBusinessLeaves);
router.post('/attendance/editUserLeaves',            validator.editUserLeaves,         routehandler.editUserLeaves);
router.get('/attendance/getMembers',                 validator.getMembers,             routehandler.getMembers);
router.patch('/attendance/editBusinessInfo',         validator.editBusinessInfo,       routehandler.editBusinessInfo);
router.get('/attendance/getBusinessInfo',            validator.getBusinessInfo,        routehandler.getBusinessInfo);
router.patch('/attendance/editUserPunchStatus',      validator.editUserPunchStatus,    routehandler.editUserPunchStatus);
router.get('/attendance/getUsersWorkTimesheet',      validator.getUsersWorkTimesheet,  routehandler.getUsersWorkTimesheet);
router.post('/attendance/autoClockOutUser',          routehandler.autoClockOutUser);
router.get('/attendance/teamLeaveStatus',            validator.teamLeaveStatus,        routehandler.teamLeaveStatus);
router.post('/attendance/uploadDefaultImage',        validator.uploadDefaultImage,     routehandler.uploadDefaultImage);
router.post('/attendance/createBusiness',            validator.createBusiness,         routehandler.createBusiness);
router.post('/attendance/v1/autoClockOutUser', routehandler.autoClockOutUserV1);
router.post('/attendance/getMembersOnLeave' , routehandler.getMembersOnLeave );
router.post('/attendance/reminderCron',              validator.reminderCron,           routehandler.reminderCron)
router.get('/workspace/getAllMembers',          validator.getAllMembers,                    routehandler.getAllMembers);

module.exports = router;




