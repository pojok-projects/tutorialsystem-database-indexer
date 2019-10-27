const AWS = require('aws-sdk');
const path = require('path');
const creds = new AWS.EnvironmentCredentials('AWS');
const esDomain = {
  endpoint: process.env.ES_ENDPOINT,
  region: process.env.ES_REGION,
  index: 'search',
  doctype: 'ContentMetadata',
};
const endpoint = new AWS.Endpoint(esDomain.endpoint);
exports.handler = (event, context, _callback) => {
  event.Records.forEach(record => {
    postDocumentToES(record.dynamodb.NewImage, context);
  });
};
function postDocumentToES(doc, context) {
  const req = new AWS.HttpRequest(endpoint);
  req.method = 'POST';
  req.path = path.join('/', esDomain.index, esDomain.doctype);
  req.region = esDomain.region;
  req.body = JSON.stringify(doc);
  req.headers['presigned-expires'] = false;
  req.headers['Host'] = endpoint.host;
  // Sign the request (Sigv4)
  const signer = new AWS.Signers.V4(req, 'es');
  signer.addAuthorization(creds, new Date());
  // Post document to ES
  const send = new AWS.NodeHttpClient();
  send.handleRequest(
    req,
    null,
    function(httpResp) {
      let body = '';
      httpResp.on('data', chunk => (body += chunk));
      httpResp.on('end', () => context.succeed());
      console.log('Body:', body);
    },
    function(err) {
      console.log('Error:', err);
      context.fail();
    }
  );
}
