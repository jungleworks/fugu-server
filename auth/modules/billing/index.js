const billingController                          = require('./controllers/billingController');
const billingValidator                           = require('./validators/billingValidator');

app.post('/make_user_payment',           billingValidator.makeUserPayment, billingController.makeUserPayment);
app.post('/get_user_card',               billingValidator.getUserCard, billingController.getUserCard);
app.post('/billing/setupIntent',         billingValidator.setupIntent, billingController.setupIntent);
app.post('/billing/addCard',             billingValidator.addUserCardV2, billingController.addUserCardV2);
