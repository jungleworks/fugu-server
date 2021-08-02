/**
 * Created by gagandeep on 31/01/19.
 */

const express = require('express');

const router = express.Router();// { caseSensitive: true }
const routehandler = require('./Routes/routehandler');
const validator = require('./Routes/validator');


router.post('/scrum/createBusiness', validator.createBusiness, routehandler.createBusiness);
router.post('/scrum/insertNewUser', validator.insertNewUser, routehandler.insertNewUser);
router.post('/scrum/createNewScrum', validator.createNewScrum, routehandler.createNewScrum);
router.get('/scrum/cron', validator.scrumCron, routehandler.scrumCron)
router.get('/scrum/insertUserAnswer', validator.insertUserAnswers, routehandler.insertUserAnswers);
router.post('/scrum/getScrumDetails', validator.getScrumDetails, routehandler.getScrumDetails);
router.post('/scrum/editScrumDetails', validator.editScrumDetails, routehandler.editScrumDetails);
router.get('/scrum/publishScrumAnswers', validator.publishScrumAnswers, routehandler.publishScrumAnswers);
router.get('/scrum/checkUserAvailability', validator.checkUserAvailability, routehandler.checkUserAvailability);

module.exports = router;

