const request = require('request');

const callDatahogJob = () => {
  request('http://datahog:3000/providers/gas', { json: true }, (err, res, body) => {
    if (err) {
      throw new Error(err);
    }

    if (body == '#fail') {
      throw new Error('Provider returned failure');
    } else {
      console.log(`Received response!`)
      console.log(body);
    }
  });
};

module.exports = { callDatahogJob };
