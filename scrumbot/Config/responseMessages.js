/**
 * Created by gagandeep on 31/01/19.
 */


exports.ERROR = {
    eng : {
        DEFAULT : {
            statusCode    : 400,
            customMessage : 'Something went wrong.',
            type          : 'DEFAULT'
        }
        
    }
};

exports.SUCCESS = {
    DEFAULT : {
        statusCode    : 200,
        customMessage : 'Success',
        type          : 'DEFAULT'
    },
    USER_DATA_NOT_FOUND : {
        statusCode    : 204,
        customMessage : 'User Data Not Found',
        type          : 'USER_DATA_NOT_FOUND'
      }
};

exports.swaggerDefaultResponseMessages = [
    { code : 200, message : 'OK' },
    { code : 201, message : 'CREATED' },
    { code : 400, message : 'Bad Request' },
    { code : 401, message : 'Unauthorized' },
    { code : 403, message : 'Forbidden' },
    { code : 404, message : 'Data Not Found' },
    { code : 500, message : 'Something went wrong, try again' }
];
