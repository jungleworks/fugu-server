

const Promise          = require('bluebird');
const fs               = require('fs');
const Handlebars       = require('handlebars');
const request          = require('request');
const requireg         = require('requireg');
const _                = require('underscore');
const commonFunctions  = require('../Utils/commonFunctions');
const constants        = require('../Utils/constants');
const { logger }           = require('../libs/pino_logger');
const UniversalFunc    = require('../Utils/universalFunctions');
const workspaceService = require('../services/workspace');
const moment           = require('moment');

const dbHandler          = require('../database').dbHandler;
const userService        = require('../services/user');
const domainService      = require('../services/domain');
const dns                = require('dns');
const plivo              = require('plivo');
const thumbler           = require('video-thumb');
const getVideoDimensions = require('get-video-dimensions');
const sharp              = require('sharp');
const imageSizeOf        = require('image-size');
const pdfTemplates       = require('../Config/pdfTemplates');
const { URL }            = require('url');
const axios              = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

exports.uploadFile               = uploadFile;
exports.getAddressFromGeoCoder   = getAddressFromGeoCoder;
exports.insertIntoLogException   = insertIntoLogException;
exports.sendHttpRequest          = sendHttpRequest;
exports.getAppVersion            = getAppVersion;
exports.createDomainAtCloudFlare = createDomainAtCloudFlare;
exports.checkUsingGoogleApps     = checkUsingGoogleApps;
exports.sendSmsUsingBumbl        = sendSmsUsingBumbl;
exports.shortnerUrl              = shortnerUrl;
exports.createPdf                = createPdf;
exports.uploadFileV2             = uploadFileV2;
exports.createThumbnailFromImage = createThumbnailFromImage;
exports.getDateFormat            = getDateFormat;
exports.addTimeInShiftTime       = addTimeInShiftTime;
exports.getDayIdFromDate         = getDayIdFromDate;
exports.getRoomFromMeetUrl       = getRoomFromMeetUrl;
exports.sendRequestToExternalServer = sendRequestToExternalServer;
exports.genrateRandomString      = genrateRandomString;

function uploadFile(logHandler, payload) {
  return new Promise((resolve, reject) => {
    if (!payload.file) {
      logger.error(logHandler, "Invalid file content", payload.file);
      return resolve();
    }
    let taskArray = [];
    let options = {};
    options.files = [];
    options.files.push(payload.file);
    if (!payload.keepOriginalFileName) {
      options.replacefileName = UniversalFunc.generateRandomString(10) + "_" + (new Date()).getTime();
    }

    taskArray.push(Promise.promisify(prepareFileAndUpload).call(null, logHandler, options));
    let thumbnailObj = commonFunctions.cloneObject(payload);
    taskArray.push(createThumbnailAndUpload(logHandler, thumbnailObj, constants.thumbnailMaxDimensionSize));
    taskArray.push(createThumbnailAndUpload(logHandler, thumbnailObj, constants.image_100x100));
    taskArray.push(createThumbnailAndUpload(logHandler, thumbnailObj, constants.image_50x50));
    Promise.all(taskArray).then((result) => {
      let imageResult = result[0];
      let resizedImage = result[1];
      let image_100x100 = result[2];
      let image_50x50 = result[3];
      imageResult.thumbnail_url = (resizedImage && resizedImage.url) ? resizedImage.url : imageResult.url;
      imageResult.image_100x100 = (image_100x100 && image_100x100.url) ? image_100x100.url : imageResult.url;
      imageResult.image_50x50 = (image_50x50 && image_50x50.url) ? image_50x50.url : imageResult.url;
      resolve(imageResult);
    }, (error) => {
      logger.error(logHandler, "Error occurred while uploading file", error);
      reject(error);
    });
  });
}


function uploadFileV2(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (!payload.file) {
        logger.error(logHandler, "Invalid file content", payload.file);
        return resolve();
      }
      let taskArray = [];
      let options = {};
      options.files = [];
      options.files.push(payload.file);
      options.file_name = payload.file_name;
      if (!payload.keepOriginalFileName) {
        options.replacefileName = UniversalFunc.generateRandomString(10) + "_" + (new Date()).getTime();
      }
      let thumbnailObj = commonFunctions.cloneObject(payload);
      let allowedVideoTypes = new Set(constants.fileTypes.video);
      let allowedImageTypes = new Set(constants.fileTypes.image);
      if ((allowedImageTypes.has(payload.file.mimetype) || payload.message_type == constants.messageType.IMAGE) && payload.file.mimetype != "image/gif") {
        //taskArray.push(Promise.promisify(prepareFileAndUpload).call(null, logHandler, options));
        taskArray.push(createThumbnailFromImage(logHandler, thumbnailObj, constants.originalMaxDimensionSize));
        taskArray.push(createThumbnailFromImage(logHandler, thumbnailObj, constants.thumbnailMaxDimensionSize));
        taskArray.push(createThumbnailFromImage(logHandler, thumbnailObj, constants.blurMaxDimensionSize));
      } else if (allowedVideoTypes.has(payload.file.mimetype) || payload.message_type == constants.messageType.VIDEO) {
        taskArray.push(Promise.promisify(prepareFileAndUpload).call(null, logHandler, options));
        taskArray.push(createThumbnailFromVideo(logHandler, thumbnailObj, constants.thumbnailMaxDimensionSize));
        taskArray.push(createThumbnailFromVideo(logHandler, thumbnailObj, constants.blurMaxDimensionSize));
      } else {
        taskArray.push(Promise.promisify(prepareFileAndUpload).call(null, logHandler, options));
      }
      let result = yield Promise.all(taskArray);
      let response = {
        url: result[0].url,
        image_url: result[0].url,
        thumbnail_url: result[1] ? result[1].url : result[0].url,
        blur_image_url: result[2] ? result[2].url : result[0].url
      }
      result[0].image_size ? response.image_size = result[0].image_size : 0;
      return response;
    })().then((response) => {
      resolve(response);
    }, (error) => {
      logger.error(logHandler, "ERROR IN UPLOADING VIDEO THUMBNAIL ", error);
      resolve(constants.defaultThumbForVideo);
    });
  });
}


function prepareFileAndUpload(logHandler, req, callback) {
  let error;
  if (!(req.files && req.files.length)) {
    error = new Error("No file found");
    return callback(error);
  }


  let parentFolder = !commonFunctions.isEnv('production') ? 'test/' : "";
  let file = req.files[0];
  let s3Folder = parentFolder + constants.getAWSFolder(file.mimeType);
  const opts = {
    filePath: file.path,
    fileName: file.originalname,
    s3Folder: s3Folder.split(' ').join('_'),
    file_name: req.file_name
  };

  opts.fileName = (req.replacefileName) ? req.replacefileName + '.' + opts.fileName.split('.').pop() : opts.fileName;

  commonFunctions.uploadFileToS3Bucket(opts, (error, urlObj) => {
    if (error) {
      logger.error(logHandler, { Error: error.message });
      return callback(error);
    }
    let response = {
      url: urlObj.url
    };
    callback(null, response);
  });
}

function getAddressFromGeoCoder(logHandler, latLong) {
  return new Promise((resolve, reject) => {
    latLong = latLong.split(',');
    geocoder.reverse({ lat: latLong[0], lon: latLong[1] }).then((data) => {
      let address = data;
      resolve({
        city: address[0].city,
        zip_code: address[0].zipcode,
        latitude: address[0].latitude,
        country: address[0].country,
        country_code: address[0].countryCode,
        longitude: address[0].longitude,
        region_name: address[0].administrativeLevels.level2long,
        state: address[0].administrativeLevels.level1long
      });
    }, (error) => {
      logger.error("Error while fetching geo location", error);
    });
  });
}

function insertIntoLogException(logHandler, payload) {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO log_exception set  ? `;
    let insertObj = {
      device_details: commonFunctions.objectStringify(payload.device_details),
      device_type: payload.device_type,
      error: commonFunctions.objectStringify(payload.error)
    };
    let queryObj = {
      query: query,
      args: [insertObj],
      event: "Inserting new log exception "
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}


function sendHttpRequest(logHandler, options) {
  return new Promise((resolve, reject) => {
    options.gzip = true;
    let error;
   // logger.trace(logHandler, { HTTP_REQUEST: options });
    request(options, (error, response, body) => {
      if (error) {
        logger.error(
          logHandler, { EVENT: 'Error from external server' },
          { OPTIONS: options }, { ERROR: error }, { RESPONSE: response }, { BODY: body }
        );
        return reject(error);
      }

      if (options.attendance) {
        resolve(body)
      }

      if (response == undefined) {
        error = new Error('No response from external server');
        return reject(error);
      }

      // logger.trace(
      //   logHandler, { EVENT: 'Response from external server', OPTIONS: options, ERROR: error },
      //   { RESPONSE: response }, { BODY: body }
      // );

      if (commonFunctions.isString(body)) {
        body = commonFunctions.jsonToObject(logHandler, body);
      }

      resolve(body);
    });
  });
}


function getAppVersion(logHandler, deviceType) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * from app_version where device_type = ?`;
    let values = [deviceType];
    let queryObj = {
      query: query,
      args: values,
      event: "getAppVersion"
    };

    dbHandler.executeQuery(logHandler, queryObj).then((result) => {
      resolve(result[0]);
    }, (error) => {
      reject(error);
    });
  });
}

function createDomainAtCloudFlare(logHandler, payload) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {


      let domainOptions = payload.domainOptions;
      domainOptions.workspace = payload.workspace;
      domainOptions.zone_id = yield domainService.getZoneId(logHandler, domainOptions);
      try {
        yield domainService.createDomain(logHandler, domainOptions);
      } catch (e) {
        throw new Error("A space already exists with specified url. Please try a different URL. If you are trying to join it, please ask administrator of the space to send you an invite");
      }
    })().then((data) => {
      logger.trace(logHandler, { EVENT: "createDomainAtCloudFlare", data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function checkUsingGoogleApps(logHandler, email) {
  return new Promise((resolve, reject) => {
    let domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        resolve(false);
      } else if (addresses && addresses.length > 1) {
        logger.debug(logHandler, "RESPONSE FROM GOOGLE APIS FOR USING GOOGLE OR NOT", addresses);
        resolve(true);
      }
      resolve(false);
    });
  });
}

// function sendSmsUsingPlivo(logHandler, opts) {
//   return new Promise((resolve, reject) => {
//     const plivoAuthId = config.get('SMSCredentials.Plivo.authId');
//     const plivoAuthToken = config.get('SMSCredentials.Plivo.authToken');
//     const plivoSecret = config.get('SMSCredentials.Plivo.secret');
//     const plivoSrc = config.get('SMSCredentials.Plivo.src');
//     if(_.isEmpty(plivoAuthId) || _.isEmpty(plivoAuthToken) || _.isEmpty(plivoSecret) || _.isEmpty(plivoSrc)) {
//       throw new Error("Plivo credentials missing in configuration");
//     }
//     let message = opts.message;
//     let phoneNumbers = opts.phoneNumbers;
//     if (!phoneNumbers.length) {
//       throw new Error("No valid number found for sms");
//     }
//     let srcNumber = plivoSrc[Math.floor((Math.random() * plivoSrc.length))]  // Caller Id
//     let params = {
//       src: srcNumber,
//       dst: phoneNumbers.join('<'),
//       text: message
//     };
//     let plivoRestAPI = plivo.RestAPI({
//       authId: plivoAuthId,
//       authToken: plivoAuthToken
//     });
//     plivoRestAPI.send_message(params, (status, response) => {
//       logger.info(logHandler, { PLIVO_STATUS: status }, { PLIVO_RESPONSE: response });
//       if (status != 202) {
//         return reject("Something went wrong");
//       }
//       return resolve(response);
//     });
//   });
// }

function sendSmsUsingBumbl(logHandler, opts) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      const bumblUserId = config.get('SMSCredentials.Bumbl.userId');
      const bumblApiKey = config.get('SMSCredentials.Bumbl.apiKey');
      const bumblOffering = config.get('SMSCredentials.Bumbl.offering');
      if(!bumblUserId || !bumblApiKey || !bumblOffering || bumblUserId == -1 || bumblOffering == -1) {
        throw new Error("Bumbl credentials not available.");
      }
      let phoneNumbers = opts.phoneNumbers;
      if (!phoneNumbers.length) {
        throw new Error("No valid number found for sms");
      }
      if (phoneNumbers[0].includes("+32")) {
        console.log("RETURNING PLIVO----------------", phoneNumbers[0])
        return {}
      }
      let options = {
        url: `https://prod-api.bumbl.it/jungle/sendSms`,
        method: 'POST',
        json: {
            sms: opts.message,
            user_id: bumblUserId,
            api_key: bumblApiKey,
            offering: bumblOffering,
            phoneno: phoneNumbers[0]
        }
      };
      let result = yield sendHttpRequest(logHandler, options);
      if(result.data.invalid) {
        throw new Error("INVALID NUMBER")
      }
      return {};
    })().then((data) => {
      logger.trace(logHandler, { EVENT: "createDomainAtCloudFlare", data });
      resolve(data);
    }, (error) => {
      logger.error(logHandler, { ERROR: error });
      reject(error);
    });
  });
}

function createThumbnailAndUpload(logHandler, opts, imageMaxDimension) {
  // crop image in particular ratio
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let result = {};
      let allowedVideoTypes = new Set(constants.fileTypes.video);
      let allowedImageTypes = new Set(constants.fileTypes.image);

      if (allowedImageTypes.has(opts.file.mimetype)) {
        return yield createThumbnailFromImage(logHandler, opts, imageMaxDimension);
      }

      if (allowedVideoTypes.has(opts.file.mimetype)) {
        return yield createThumbnailFromVideo(logHandler, opts);
      }
    })().then((result) => {
      resolve(result);
    }, (error) => {
      resolve(error);
    });
  });
}


function createThumbnailFromImage(logHandler, opts, imageMaxDimension) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      let outputFilePath = 'uploads/' + commonFunctions.generateRandomString(10) + "_" + (new Date()).getTime();
      // let imageSize = imageSizeOf(opts.file.path);
      // let width = Math.round(imageSize.width);
      // let height = Math.round(imageSize.height);
      // let resizeHeight = constants.thumbnailMaxDimensionSize;
      // let resizeWidth = constants.thumbnailMaxDimensionSize;
      // if(width > height) {
      //   resizeHeight = Math.max(1, Math.round(height * constants.thumbnailMaxDimensionSize / width));
      // } else {
      //   resizeWidth = Math.max(1, Math.round(width * constants.thumbnailMaxDimensionSize / height));
      // }
      // yield sharp(opts.file.path).resize(resizeWidth, resizeHeight).toFile(outputFilePath);

      let imageInfo = yield sharp(opts.file.path).resize(imageMaxDimension, imageMaxDimension, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        fit: "inside"
      }).rotate().withMetadata().toFile(outputFilePath)
      opts.file.path = outputFilePath;
      let imageUrl = yield Promise.promisify(prepareFileAndUpload).call(null, logHandler, {
        files: [opts.file],
        replacefileName: UniversalFunc.getRandomString(),
        file_name: opts.file_name
      });

      return response = {
        url: imageUrl.url,
        image_size: imageInfo.size,
        files: [opts.file]
      }
    })().then((result) => {
      logger.trace(logHandler, "RESULT THUMBNAIL UPLOAD", result);
      resolve(result);
    }, (error) => {
      console.error(">>>>>>>>>>>>>>>>.", error)
      logger.error(logHandler, "ERROR IN UPLOADING THUMBNAIL", error);
      resolve();
    });
  });
}

function createThumbnailFromVideo(logHandler, opts) {
  let outputFileName = commonFunctions.generateRandomString(10) + "_" + (new Date()).getTime() + ".png";
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      if (!(opts.file.path)) {
        let error = new Error("No file found");
        return reject(error);
      }

      yield getscreenshot(logHandler, {filepath : opts.file.path, path: "./uploads/", outputFileName: outputFileName})

      let sharpNewName = commonFunctions.generateRandomString(10) + "_" + (new Date()).getTime() + ".png";
      yield sharp("./uploads/" + outputFileName).resize(constants.thumbnailMaxDimensionSize, constants.thumbnailMaxDimensionSize, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        fit: "inside"
      }).rotate().withMetadata().toFile("uploads/" + sharpNewName)

      opts.file.path = "uploads/" + sharpNewName;
      opts.file.originalname = sharpNewName;
      opts.file.mimetype = 'image/jpg';
      return yield Promise.promisify(prepareFileAndUpload).call(null, logHandler, {
        files: [opts.file],
        replacefileName: commonFunctions.generateRandomString(10)
      });
    })().then((result) => {
      logger.trace(logHandler, "RESULT THUMBNAIL UPLOAD", result);
      resolve(result);
    }, (error) => {
      logger.error(logHandler, "ERROR IN UPLOADING VIDEO THUMBNAIL ", error);
      resolve();
    });
  });
}



function shortnerUrl(logHandler, longUrl) {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      try {
        const dynamicLinks = config.get('DynamicLinks')
        let options = {
          url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' + dynamicLinks.key,
          method: 'POST',
          "Content-Type": "application/json",
          json: {
            "dynamicLinkInfo": {
              "domainUriPrefix": dynamicLinks.domainUriPrefix,
              "link": longUrl
            },
            "suffix": {
              "option": "SHORT"
            }
          }
        };
        let response = yield sendHttpRequest(logHandler, options);
        return { shortUrl: response.shortLink };
      } catch (error) {
        logger.error(logHandler, "Error occurred while shortening url ", error);
        return {};
      }
    })().then((data) => {
      logger.trace(logHandler, "final response going", data);
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}


function createPdf(logHandler, template, params) {
  const pdf = Promise.promisifyAll(requireg('html-pdf'));
  return new Promise((resolve, reject) => {
    Promise.coroutine(function* () {
      logger.trace(logHandler, "Creating pdf", { TEMPLATE: template, PARAMS: params });
      let fileName = UniversalFunc.generateRandomString(10) + '.pdf';
      let localPath = './uploads/' + fileName;
      let renderedHtml;

      switch (template) {
        case 'INVOICE':
          renderedHtml = Handlebars.compile(pdfTemplates.invoice)(params);
          break;
        default:
          let error = new Error("No case matched while creating pdf " + template);
          logger.error(logHandler, error);
          throw error;
      }

      let pdfResponse = yield pdf.createAsync(renderedHtml, { format: 'A4', filename: localPath });
      let upload = {};
      upload.file = {
        path: pdfResponse.filename,
        originalname: fileName
      };
      logger.error(logHandler, "uploading file", upload);
      return yield uploadFile(logHandler, upload);
    })().then(
      (data) => { resolve(data); },
      (error) => { reject(error); }
    );
  });
}

 function getscreenshot(logHandler, params) {
  return new Promise((resolve, reject) => {
   ffmpeg(params.filepath)
     .on('end', function () {
       resolve()
     }).screenshots({
        timestamps: ["1"],
        filename: params.outputFileName,
        folder: params.path
   })
  })
}

function getDateFormat(date, format){
  return moment(date).format(format);
}

function addTimeInShiftTime(shift_time, addtime){
  if(!shift_time){
    return;
  }
  return moment(shift_time,["HH:mm:ss"]).add(addtime,'minute').format('HH:mm:ss');
}

function getDayIdFromDate(date){
   let dateWithTimezone =  moment(date).add(330, 'minute').toDate();
   let currentDay =  dateWithTimezone.getDay();
   return currentDay;
}

function getRoomFromMeetUrl(url){
    if(!url){
      return;
    }
    try{
      const myUrl = new URL(url);
      let room_name = myUrl.pathname
      return room_name;
    }catch(error){
      return false;
    }
}

function sendRequestToExternalServer(logHandler, endPoint, body){
   return new Promise((resolve, reject)=>{
    axios({
      method: 'POST',
      url: endPoint,
      data: body
    })
    .then(function (response) {
       return resolve(response.data);
    })
    .catch(function (error) {
       return reject(error.response);
    });
   })
}

function genrateRandomString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
