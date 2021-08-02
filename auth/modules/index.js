/**
 * Created by sumeet on 04/03/19.
 */

require('./authentication');
require('./billing');
require('./social');
require('./otpAuthentication');

app.get('/ping_authserver', function(req, res) {
  res.send("OK");
});