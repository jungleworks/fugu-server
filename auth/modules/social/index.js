/**
 * Created by sumeet on 07/03/19.
 */
var universalValidator                          = require('./../../validators/validator');
var appleController                            = require('./controllers/appleController');
var appleValidator                             = require('./validators/appleValidator');

app.post('/jungle/appleConnect',        appleValidator.jungleAppleConnect, universalValidator.trimFields, appleController.jungleAppleConnect);
