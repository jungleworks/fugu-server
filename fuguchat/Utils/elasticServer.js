const elasticsearch = require('elasticsearch');
const config = require('config');

const esClient = new elasticsearch.Client({
  host:`http://${config.get("elasticServer")}:9200`,
  log: 'error'
});

global.esClient = esClient;
esClient.ping({
  requestTimeout: 30000
}, (error) => {
  if (error) {
    console.error('>>>>>>>>>>>', error);
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Elastic Connected');
  }
});

esClient.cluster.health({}, function (err, resp, status) {
    console.log("--Elastic Client Health --", resp);
});

module.exports = esClient;