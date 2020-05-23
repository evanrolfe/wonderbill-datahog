const nock = require('nock');

const { Provider } = require('../../src/provider');
const { ServiceDownError } = require('../../src/worker_runner');

describe('Provider', () => {
  let provider;
  const providerUrl = 'http://gasprovider.com/api/mydetails.json';
  const callbackUrl = 'http://wonderbill.com/api/log_details.json';

  beforeEach(() => {
    provider = new Provider('gas', providerUrl);
  });

  describe('callAndCallback()', () => {
    context('when the provider API returns a successful response', () => {
      const successResponse = 'great_success';

      it('calls the callbackUrl with the response as body', async () => {
        // Mock the provider:
        nock('http://gasprovider.com').get('/api/mydetails.json').reply(200, successResponse);

        // Mock the callback:
        const callbackRequest = nock('http://wonderbill.com')
          .post('/api/log_details.json', successResponse)
          .reply(200, '{}');

        await provider.callAndCallback(callbackUrl);

        expect(callbackRequest.isDone()).to.eq(true);
      });
    });

    context('when the provider API returns a failed response', () => {
      const failResponse = '#fail';

      it('throws ServiceDownError', async () => {
        // Mock the provider:
        nock('http://gasprovider.com').get('/api/mydetails.json').reply(200, failResponse);

        const subject = provider.callAndCallback(callbackUrl);

        await expect(subject).to.be.rejectedWith(ServiceDownError)
      });
    });
  });
});
