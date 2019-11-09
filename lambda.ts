const AWS = require('aws-sdk');
const creds = new AWS.Credentials(
  process.env.ACCESS_KEY,
  process.env.SECRET_KEY
);
const zlib = require('zlib');

const host = process.env.ES_ENDPOINT;
const region = process.env.ES_REGION;
const endpoint = new AWS.Endpoint(host);

const index = 'Content';
const type = 'Metadata';

exports.handler = (event: any, _: any, _callback: any) => {
  console.log('Receive event:', JSON.stringify(event));

  event.Records.forEach((item: any) => {
    /*
    const cleanUp = function(err) {
      if (err instanceof Error === false) {
        err = void 0;
      }
    };*/

    const request = new AWS.HttpRequest(endpoint);
    request.region = region;
    request.body = {
      index: {
        _index: index,
        _type: type,
        _id: unmarshall(item.Keys).id,
      },
    };
    request.headers['presigned-expires'] = false;
    request.headers['Host'] = host;

    // Sign the request (Sigv4)
    const signer = new AWS.Signers.V4(request, 'es');
    signer.addAuthorization(creds, new Date());
    console.log('signer:', signer);

    /*const send = new AWS.NodeHttpClient();
    const req = send.handleRequest(
      request,
      null,
      function(_incoming) {
        let incoming = _incoming;
        status = incoming.statusCode;
        const headers = incoming.headers;
        let response = '';

        const encoding = (headers['content-encoding'] || '').toLowerCase();
        if (encoding === 'gzip' || encoding === 'deflate') {
          incoming = incoming.pipe(zlib.createUnzip());
        }

        incoming.setEncoding('utf8');
        incoming.on('data', function(d) {
          response += d;
        });

        incoming.on('error', cleanUp);
        incoming.on('end', cleanUp);

        console.log('Response:', response);
      },
      cleanUp
    );

    req.on('error', cleanUp);

    req.setNoDelay(true);
    req.setSocketKeepAlive(true);*/
  });
};

function unmarshall(data: any) {
  return AWS.DynamoDB.Converter.unmarshall(data);
}
