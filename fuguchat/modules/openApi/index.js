const router = require('../../router')

const controller        = require('./controller/openApiController');
const validator         = require('./validator/openApiValidator');
const middleware        = require('../../middleware/middlewareOpenApi');


router.get('/openApi/getMeetUrl',        validator.getMeetUrl,      middleware.getUserDataBySecretApiKey,  controller.getMeetUrl);
