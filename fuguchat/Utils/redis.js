const { promisify } = require('util');
const config = require('config');
const redis = require('ioredis');

const redisOptions = {
  host: config.get('redisServer'),
  port: 6379,
  return_buffers: true
};

const redis_client = new redis(redisOptions);

class Redis {
  constructor() {
    console.log('initializing redis');
  }

  static async get(keyPattern) {
    const getPromisified = promisify(redis_client.get).bind(redis_client);
    // console.log("getting key: ", keyPattern);

    return new Promise((resolve, reject) => {
      getPromisified(keyPattern).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }
  static async getBuffer(keyPattern) {
    const getPromisified = promisify(redis_client.getBuffer).bind(redis_client);
    // console.log("getting key: ", keyPattern);

    return new Promise((resolve, reject) => {
      getPromisified(keyPattern).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async keys(keyPattern) {
    const getPromisified = promisify(redis_client.keys).bind(redis_client);

    return new Promise((resolve, reject) => {
      getPromisified(keyPattern).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async set(key, value) {
    const setPromisified = promisify(redis_client.set).bind(redis_client);
    // console.log("string in redis key:", key);

    return new Promise((resolve, reject) => {
      setPromisified(key, value).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async setex(key, time, value) {
    const setPromisified = promisify(redis_client.setex).bind(redis_client);
    // console.log("string in redis key:", key);

    return new Promise((resolve, reject) => {
      setPromisified(key, time, value).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async expire(key, seconds) {
    const expirePromisified = promisify(redis_client.expire).bind(redis_client);

    return new Promise((resolve, reject) => {
      expirePromisified(key, seconds).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async expireat(key, expireUnixTimestampSeconds) {
    const expireatPromisified = promisify(redis_client.expireat).bind(redis_client);
    console.log('setting expire unixtimestamp for', key);

    return new Promise(expireatPromisified(key, expireUnixTimestampSeconds));
  }

  static async del(key) {
    const deletePromisified = promisify(redis_client.del).bind(redis_client);
    console.log('deleting key', key);

    return new Promise((resolve, reject) => {
      deletePromisified(key).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async hset(key, field, value) {
    const hsetPromisified = promisify(redis_client.hset).bind(redis_client);
    console.log('hset key: field', key, ' : ', field);

    return new Promise((resolve, reject) => {
      hsetPromisified(key, field, value).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async hget(key, field) {
    const hgetPromisified = promisify(redis_client.hget).bind(redis_client);
    console.log('hget key: field', key, ' : ', field);

    return new Promise((resolve, reject) => {
      hgetPromisified(key, field).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async hincrby( object, key, value) {
    const hincrbyPromisified = promisify(redis_client.hincrby).bind(redis_client);

    return new Promise((resolve, reject) => {
      hincrbyPromisified(object, key, value).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  static async hgetall(key) {
    const hgetallPromisified = promisify(redis_client.hgetall).bind(redis_client);
    return new Promise((resolve, reject) => {
      hgetallPromisified(key).then((result) => {
       return resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }
}
// (async () => await Redis.hset("accountSettings#1", "testkey", "value"))();

exports.redis = redis_client;
exports.Redis = Redis;
