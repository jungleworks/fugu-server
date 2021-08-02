
class PromiseManager {
  constructor(key) {
    if (!global[key]) {
      global[key] = new Map();
    }

    this.key = key;
    this.map = global[key];
    
  }

  // eslint-disable-next-line consistent-return
  async fetchAndExecute(hash) {
    if (global[this.key].has(hash)) {
      // eslint-disable-next-line no-return-await
      return await global[this.key].get(hash).get('execute');
    }
  }

  store(promise, metadata, hash) {
    metadata.set('execute', promise);

    global[this.key].set(hash, metadata);
  }

  remove(hash) {
    global[this.key].delete(hash);
  }

  list() {
    return [...global[this.key].values()];
  }

  has(hash) {
    return global[this.key].has(hash);
  }
}

exports.promiseManager = PromiseManager;
