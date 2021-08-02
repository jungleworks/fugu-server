
const redis                  = require('../Utils/redis').Redis;
const helperUtility          = require('../Utils/helperUtility');
const constants              = require('../Utils/constants');


exports.apiCount = async(req, res, next)=> {
    try{
      if(req.method !== 'OPTIONS'){
        let url = (req.url).split('?')[0];
        redis.hincrby("apiRates", url, 1);
      }
      next();
    }catch(error){
      next();
    }
}

exports.getApiCountFromRedis = (logHandler)=> {
   return new Promise(async(resolve, reject)=> {
       try{
        let data = await redis.hgetall("apiRates");
        return resolve(data);
       }catch(error){
        return reject(error);
       }
   })  
}   

exports.deleteApiCountFromRedis = (logHandler)=> {
    return new Promise(async(resolve, reject)=> {
        let data = await redis.hgetall("apiRates");

        redis.del("apiRates").then((result)=> {
           return resolve(result);
        }).catch((error)=> {
           return reject(error);
        })
    })
}
