const router = require('../../router')

const controller        = require('./controller/meetingController');
const validator         = require('./validator/meetingValidator');
const middleware        = require('../../middleware/middleware');

router.post('/meeting/scheduleMeeting',   validator.scheduleMeeting, middleware.getUserDataFromAccessToken, controller.scheduleMeeting);
router.get('/meeting/getMeetings',        validator.getMeetings,     middleware.getUserDataFromAccessToken, controller.getMeetings);
router.post('/meeting/editMeeting',       validator.editMeeting,     middleware.getUserDataFromAccessToken, controller.editMeeting);
router.post('/meeting/reminder/cron',     controller.reminderCron);









