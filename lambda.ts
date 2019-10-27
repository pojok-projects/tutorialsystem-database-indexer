import AWS = require('aws-sdk');
import elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: process.env.ES_ENDPOINT,
  log: 'error',
});

const index = 'Content';
const type = 'Metadata';

exports.handler = (event: any, context: any, _callback: any) => {
  console.log('Receive event:', JSON.stringify(event));

  let bulkBody: any[] = [];

  event.Records.forEach((item: any) => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: unmarshall(item.Keys).id,
      },
    });

    bulkBody.push(unmarshall(item.NewImage));
  });

  esClient
    .bulk({body: bulkBody})
    .then(response => {
      let errorCount = 0;
      response.items.forEach(item => {
        if (item.index && item.index.error) {
          console.log(++errorCount, item.index.error);
        }
      });
      console.log(`Successfully indexed items`);
    })
    .catch(console.error);
};

function unmarshall(data: any) {
  return AWS.DynamoDB.Converter.unmarshall(data);
}
