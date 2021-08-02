var otpController                            = require('./controllers/otpController');
var otpValidator                             = require('./validators/otpValidator');

app.post('/jungle/getLoginOtp',       otpValidator.sendOtp,otpController.sendOtp);
app.post('/jungle/validateLoginOtp',    otpValidator.verifyOtp,otpController.verifyOtp);
