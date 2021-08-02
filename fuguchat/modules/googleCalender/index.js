const router = require('../../router')

const controller        = require('./controller/googleCalenderController');
const validator         = require('./validator/googleCalenderValidator');
const middleware        = require('../../middleware/middleware');

router.get('/googleCalendar/getAuthorizeUrl',        validator.getAuthorizeUrl,      middleware.getUserDataFromAccessToken,  controller.getAuthorizeUrl);
router.post('/googleCalendar/submitAuthorizeCode',   validator.submitAuthorizeCode,  middleware.getUserDataFromAccessToken,  controller.submitAuthorizeCode);
router.post('/googleCalendar/addEvent',              validator.addCalendarEvent,     middleware.getUserDataFromAccessToken,  controller.addEvent);
