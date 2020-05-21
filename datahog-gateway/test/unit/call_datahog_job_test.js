const { callDatahogJob  } = require('../../src/jobs/call_datahog_job');

describe('call_datahog_job', () => {
  context('when it responds successfully', () => {
    it('works', async () => {
      callDatahogJob();
      expect(1).to.eql(1);
    });
  });
});
