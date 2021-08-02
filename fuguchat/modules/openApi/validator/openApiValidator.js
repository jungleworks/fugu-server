
const Joi       = require('joi');
const validator = require('../../../Routes/validator');

const getMeetUrl = (req, res, next) => {

    req.logHandler = {
      uuid: req.uuid,
      apiModule: 'openApi',
      apiHandler: 'getMeetUrl'
    };

    const querySchema = Joi.object().keys({
      secret_api_key: Joi.string().required()
    });

    const validFields = validator.validateFields(req, res, querySchema);
    if (validFields) {
     next();
    }
};

module.exports = {
    getMeetUrl
}