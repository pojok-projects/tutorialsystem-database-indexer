const AWS = require('aws-sdk');
const path = require('path');
const httpClient = new AWS.HttpClient();
const zlib = require('zlib');

const host = process.env.ES_ENDPOINT;
const region = process.env.ES_REGION;
const endpoint = new AWS.Endpoint(host);

const creds = new AWS.Credentials(
  process.env.ACCESS_KEY,
  process.env.SECRET_KEY
);

const index = 'Content';
const type = 'Metadata';

// See details from:
// https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/search-example.html
// https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-indexing.html

exports.handler = (event: any, _: any, _callback: any) => {
  console.log('Receive event:', JSON.stringify(event));

  event.Records.forEach((item: any) => {
    console.log('item:', item);
    const keys = unmarshall(item.Keys);

    console.log('keys:', keys);

    const params = {
      httpMethod: 'PUT',
      requestPath: 'content-metadata',
      payload: {
        // see link above for details
        settings: {
          index: {
            _index: index,
            _type: type,
            _id: keys.id,
          },
        },
      },
    };

    console.log('params:', params);
    sendRequest(params).then(response => {
      console.info(response);
    });

    /*const cleanUp = function(err) {
      if (err instanceof Error === false) {
        err = void 0;
      }
    };

    const request = new AWS.HttpRequest(endpoint);
    request.region = region;
    request.body = JSON.stringify({
      index: {
        _index: index,
        _type: type,
        _id: unmarshall(item.Keys).id,
      },
    });
    request.headers['presigned-expires'] = false;
    request.headers['Host'] = host;

    // Sign the request (Sigv4)
    const signer = new AWS.Signers.V4(request, 'es');
    signer.addAuthorization(creds, new Date());

    const send = new AWS.NodeHttpClient();
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

        console.log('Response:', response);
        incoming.on('error', cleanUp);
        incoming.on('end', cleanUp);
      },
      cleanUp
    );

    req.on('error', cleanUp);

    req.setNoDelay(true);
    req.setSocketKeepAlive(true);*/
  });
};

function sendRequest({httpMethod, requestPath, payload}) {
  const request = new AWS.HttpRequest(endpoint, region);

  request.method = httpMethod;
  request.headers['Content-Type'] = 'application/json';
  request.headers['Host'] = host;

  if (requestPath) {
    request.path = path.join(request.path, requestPath);
  }

  console.log('payload:', payload);
  if (payload) {
    request.body = JSON.stringify(payload);
  }

  const signer = new AWS.Signers.V4(request, 'es');
  signer.addAuthorization(creds, new Date());

  return new Promise((resolve, reject) => {
    httpClient.handleRequest(
      request,
      null,
      response => {
        const {statusCode, statusMessage, headers} = response;
        let body = '';
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => {
          const data: any = {
            statusCode,
            statusMessage,
            headers,
          };
          if (body) {
            data.body = JSON.parse(body);
          }
          resolve(data);
        });
      },
      err => {
        reject(err);
      }
    );
  });
}

function unmarshall(data: any) {
  return AWS.DynamoDB.Converter.unmarshall(data);
}
