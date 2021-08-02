/**
 * Created by gagandeep on 31/01/19.
 */

function freeze(object) {
    return Object.freeze(object);
}

exports.serverInitMessage = `
              _,     _   _     ,_
          .-'' /     \\'-'/     \\ ''-.
         /    |      |   |      |    \\
        ;      \\_  _/     \\_  _/      ;
       |         ''         ''         |
       |         Up And Running        |
        ;    .-.   .-.   .-.   .-.    ;
         \\  (   '.'   \\ /   '.'   )  /
          '-.;         V         ;.-'
`;

exports.defaultPhoneNumber = '+1111111111';

exports.enableZlibCompression = true;

exports.cache = {
    BUSINESS_DETAILS         : 'business_details',
    BUSINESS_PROPERTY        : 'business_property',
    BUSINESS_DEVICE_MAPPINGS : "business_device_mappings",
    SERVER_LOGGING           : "server_logging",
    BROADCAST_SERVICE        : "broadcast_service",
    EXPORT_PROCESS           : "EXPORT_PROCESS"
};


exports.API_END_POINT = freeze({

    PUBLISH_MESSAGE_ON_SCRUM_BOT : "/api/bot/publishMessageOnScrumBot"
  });

exports.PUBLISH_MESSAGE_TYPE = freeze({
    PUBLISH_SCRUM_ANSWERS : "PUBLISH_SCRUM_ANSWERS",
    PUBLISH_SCRUM_ANSWERS_TO_CHANNELS : "PUBLISH_SCRUM_ANSWERS_TO_CHANNELS",
});


exports.scrumBot = freeze({
    PUBLISH_SCRUM_QUESTION:"PUBLISH_SCRUM_QUESTION",
    PUBLISH_END_TIME_TEXT:"PUBLISH_END_TIME_TEXT"
});

exports.EMAIL_MAX_SIZE = 60;

exports.MIN_DOTAT = 2;

exports.MAX_INTEGER = Number.MAX_SAFE_INTEGER;
