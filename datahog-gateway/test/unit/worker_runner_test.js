const { WorkerRunner } = require('../../src/worker_runner');

describe('WorkerRunner', () => {
  it('processing jobs in the correct order', async () => {
    const workers = new WorkerRunner(1);
    workers.start();

    let promise1Resolved;
    let promise2Resolved;
    const orderResolved = [];

    // TODO: Write a function to return these promises
    const promise1 = new Promise((resolve) => {
      promise1Resolved = (job) => {
        orderResolved.push(1);
        resolve();
      };
    });
    const promise2 = new Promise((resolve) => {
      promise2Resolved = (job) => {
        orderResolved.push(2);
        resolve();
      };
    });

    workers.enqueueJob(promise1Resolved, {callbackUrl: 'http://localhost:3002'});
    workers.enqueueJob(promise2Resolved, {callbackUrl: 'http://localhost:3002'});

    await Promise.all([promise1, promise2]);

    expect(orderResolved).to.eql([1, 2]);
  });

  it('retries failed jobs within the retry limit', async () => {
    const workers = new WorkerRunner(1, 5);
    workers.start();

    let jobFunc;
    let jobAttempts = 0;

    // This promise is only resolved once the function return has been attempted
    // 5 times by the WorkerRunner, otherwise it throws an error
    const jobFuncCalled6Times = new Promise((resolve) => {
      jobFunc = (job) => {
        jobAttempts += 1;

        if (job.attempts >= 5) {
          resolve();
        } else {
          throw new Error('Something went wrong!');
        }
      };
    });

    workers.enqueueJob(jobFunc, {callbackUrl: 'http://localhost:3002'});

    await jobFuncCalled6Times;

    expect(jobAttempts).to.eql(6);
  });

  describe('processing a single job', () => {
    context('when the state is up', () => {
      context('and the job completes', () => {
        it('leaves the state as up', () => {
          // TODO
        });
      });

      context('and the job throws ServiceDownError', () => {
        it('sets the state to down', () => {
          // TODO
        });
      });

      context('and the job throws an Error', () => {
        it('leaves the state as up', () => {
          // TODO
        });
      });
    });

    context('when the state is down', () => {
      context('and the job completes', () => {
        it('sets the state to up', () => {
          // TODO
        });
      });

      context('and the job throws ServiceDownError', () => {
        it('leaves the state as down', () => {
          // TODO
        });
      });
    });
  });
});
