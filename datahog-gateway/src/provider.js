const request = require('request');
const { WorkerRunner, ServiceDownError } = require('./worker_runner');

class Provider {
  constructor(name, providerUrl) {
    this.name = name;
    this.providerUrl = providerUrl;
  }

  async callAndCallback(callbackUrl) {
    return new Promise((resolve, reject) => {
      request(this.providerUrl, { json: true }, (err, res, body) => {
        if (err) {
          reject(err);
        } else {
          if (body == '#fail') {
            reject(new ServiceDownError());
          } else {
            console.log(`[Provider-${this.name}] Received response! Calling callbackUrl: ${callbackUrl} with body: ${body}`);

            const requestParams = {
              url: callbackUrl,
              body: body
            };
            request.post(requestParams, (err, res, body) => {
              console.log(`[Provider-${this.name}] Recieved response from the callback! ${callbackUrl}`);
              console.log(body);
              resolve(body);
            });
          }
        }
      });
    });
  }
}

module.exports = { Provider };
