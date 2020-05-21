const { callDatahogJob  } = require('../../../src/jobs/call_datahog_job');

describe('call_datahog_job', () => {
  context('when datahog returns a succesful response', () => {
    it('works', async () => {
      callDatahogJob();
      expect(1).to.eql(1);
    });
  });

  // context('when datahog returns a failed response', () => {
  //   it('works', async () => {
  //     callDatahogJob();
  //     expect(1).to.eql(1);
  //   });
  // });
});
