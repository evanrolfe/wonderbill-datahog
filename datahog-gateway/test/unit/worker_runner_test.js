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
      promise1Resolved = () => {
        orderResolved.push(1);
        resolve();
      };
    });
    const promise2 = new Promise((resolve) => {
      promise2Resolved = () => {
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

    let promise1Resolved;
    let jobAttempts = 0;

    const promise1 = new Promise((resolve) => {
      promise1Resolved = () => {
        jobAttempts += 1;
        resolve();
        throw new Error('Something went wrong!');
      };
    });

    workers.enqueueJob(promise1Resolved, {callbackUrl: 'http://localhost:3002'});

    await promise1;

    expect(jobAttempts).to.eql(6);
  });
});
