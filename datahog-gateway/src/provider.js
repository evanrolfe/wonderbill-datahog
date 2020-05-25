const request = require('request');
const { WorkerRunner, ServiceDownError } = require('./worker_runner');

class Provider {
  constructor(name, providerUrl) {
    this.name = name;
    this.providerUrl = providerUrl;
    this.workers = new WorkerRunner({name: name, maxConcurrency: 1, retryLimit: 3});
    this.workers.start();
  }

  requestCallback(callbackUrl) {
    const jobFunc = this.callAndCallback.bind(this, callbackUrl);
    const job = this.workers.enqueueJob(jobFunc);
    return job;
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
            console.log(`[Provider] Received response! Calling callbackUrl: ${callbackUrl} with body: ${JSON.stringify(body)}`);

            const requestParams = { url: callbackUrl, json: true, body: body };
            request.post(requestParams, (err, res, body) => {
              console.log(`[Provider] Recieved response from the callback! ${callbackUrl}`);
              //console.log(body);
              resolve();
            });
          }
        }
      });
    });
  }

  state() {
    return 'up';
  }
}

module.exports = { Provider };
