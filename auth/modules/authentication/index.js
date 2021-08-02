/**
 * Created by ashishprasher on 11/01/18.
 */

var userValidator                               = require('./validators/userValidator');
var userController                              = require('./controllers/userController');
var universalValidator                          = require('./../../validators/validator');

app.post('/jungle/registerUser',                userValidator.jungleRegisterUser, universalValidator.trimFields, userController.jungleRegisterUser);
app.post('/authenticate_user',                  userValidator.authenticateUser, userController.authenticateUser);
app.post('/get_user_detail',                    userValidator.getUserDetail, userController.getUserDetail);
app.post('/jungle/verifyPassword',              userValidator.verifyPassword, userController.verifyPassword);
app.post('/update_user_detail',                 userValidator.updateUserDetail, userController.updateUserDetail);
