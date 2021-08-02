const router = require('../../router')

const controller        = require('./controller/taskController');
const validator         = require('./validator/taskValidator');
const middleware        = require('../../middleware/middleware');


router.post('/task/assignTask',         validator.assignTask,       middleware.getUserDataFromAccessToken,  controller.assignTask);
router.get('/task/getAssignedTask',     validator.getAssignedTask,  middleware.getUserDataFromAccessToken,  controller.getAssignedTask);
router.post('/task/submitTask',         validator.submitTask,       middleware.getUserDataFromAccessToken,  controller.submitTask);
router.post('/task/reminder/cron',      controller.reminderCron);
router.get('/task/getTaskDetails',      validator.getTaskDetails,    middleware.getUserDataFromAccessToken,  controller.getTaskDetails);
router.post('/task/editTaskDetails',    validator.editTaskDetails,   middleware.getUserDataFromAccessToken,  controller.editTaskDetails);










