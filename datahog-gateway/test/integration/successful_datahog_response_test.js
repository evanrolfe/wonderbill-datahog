const request = require('request');
const nock = require('nock');

const { startServer, serverPorts } = require('../../src/server');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Datahog-Gateway', () => {
  let server;
  const callbackUrl = 'http://test/'
  let callbackRequest;
  const gasSuccessResponse = 'This is a successful gas response!';
  const gasFailResponse = '#fail';

  context('when datahog returns a successful response', () => {
    before(() => {
      // Mock datahog:
      nock('http://datahog:3000')
        .get('/providers/gas')
        .reply(200, gasSuccessResponse);

      // Mock the callback url:
      callbackRequest = nock(callbackUrl).post('/').reply(200, '{}');

      server = startServer();
    });

    after(() => {
      // TODO: Find a better way of closing the server! This means that the integration
      // tests always have to come last in the test order execution.
      process.exit(0);
    });

    it('works', async () => {
      const port = serverPorts.test;

      const response = await new Promise((resolve) => {
        const requestParams = {
          url: `http://localhost:${port}/`,
          json: true,
          body: {provider: 'gas', callbackUrl: callbackUrl}
        };

        request.post(requestParams, (err, res, body) => {
          resolve(body);
        });
      });

      console.log(`[TEST] response received from server:`)
      console.log(response);

      // TODO: Find  a better way of waiting until the callback has been called
      await sleep(100);
      expect(callbackRequest.isDone()).to.eq(true);
    });
  });

  context('when datahog returns a failed response', () => {
    // TODO
  });
});
