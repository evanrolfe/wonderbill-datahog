const request = require('request');

const callDatahogJob = async (job) => {
  const { params } = job;

  return new Promise((resolve, reject) => {
    request(`http://datahog:3000/providers/${params.provider}`, { json: true }, (err, res, body) => {
      if (err) {
        reject(err);
      }

      if (body == '#fail') {
        reject('Provider returned failure');
      } else {
        console.log(`[callDatahogJob] Received response! Calling callbackUrl: ${params.callbackUrl} with body: ${body}`)
        console.log(body);

        const requestParams = {
          url: params.callbackUrl,
          body: body,
          json: true
        };
        request.post(requestParams, (err, res, body) => {
          console.log(`Recieved response from the callaback!`)
          console.log(body);
        });
      }
      resolve();
    });
  });
};

module.exports = { callDatahogJob };
