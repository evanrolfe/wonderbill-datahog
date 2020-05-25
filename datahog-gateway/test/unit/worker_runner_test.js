const { WorkerRunner, ServiceDownError } = require('../../src/worker_runner');

const serviceUpJob = () => { return };
const serviceDownJob = () => { throw new ServiceDownError() };

describe('WorkerRunner', () => {

  describe('processing multiple jobs', () => {
    it('processing jobs in the correct order', async () => {
      const workers = new WorkerRunner({maxConcurrency: 1});
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
      const workers = new WorkerRunner({maxConcurrency: 1, retryLimit: 5});
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
  });

  describe('processing a single job', () => {
    let workers;

    beforeEach(() => {
      workers = new WorkerRunner({maxConcurrency: 1, retryLimit: 5});
    });

    context('when the state is up', () => {
      context('and the job completes', () => {
        it('leaves the state as up', async () => {
          const job = workers.enqueueJob(() => {}, {});
          await workers._onJobQueuedEventUp(job.id);

          expect(workers.state).to.eq('up');
          expect(workers.jobsQueue.length()).to.eq(0);
        });
      });

      context('and the job throws ServiceDownError', () => {
        it('sets the state to down and re-queues the same job', async () => {
          const job = workers.enqueueJob(() => {
            throw new ServiceDownError();
          }, {});
          await workers._onJobQueuedEventUp(job.id);

          expect(workers.state).to.eq('down');
          expect(workers.jobsQueue.length()).to.eq(1);
        });
      });

      context('and the job throws an other Error', () => {
        it('leaves the state as up', async () => {
          const job = workers.enqueueJob(() => {
            throw new Error('The service is down!');
          }, {});
          await workers._onJobQueuedEventUp(job.id);

          expect(workers.state).to.eq('up');
        });
      });
    });

    context('when the state is down', () => {
      context('and the job completes', () => {
        it('sets the state to up', async () => {
          workers.state = 'down';
          const eventsEmitSpy = sinon.spy(workers.events, 'emit');

          const job1 = workers.enqueueJob(serviceUpJob, {});
          const job2 = workers.enqueueJob(serviceUpJob, {});
          const job3 = workers.enqueueJob(serviceUpJob, {});

          await workers._onJobQueuedEventDown(job1.id);

          expect(workers.state).to.eq('up');

          expect(eventsEmitSpy.withArgs('jobQueued', job2.id).calledOnce).to.eq(true);
          expect(eventsEmitSpy.withArgs('jobQueued', job3.id).calledOnce).to.eq(true);
        });
      });

      context('and the job throws ServiceDownError', () => {
        it('leaves the state as down and queues the next job', async () => {
          workers.state = 'down';
          const eventsEmitSpy = sinon.spy(workers.events, 'emit');

          const job1 = workers.enqueueJob(serviceDownJob, {});
          const job2 = workers.enqueueJob(serviceDownJob, {});

          await workers._onJobQueuedEventDown(job1.id);

          expect(workers.state).to.eq('down');
          expect(workers.jobsQueue.length()).to.eq(2);
          expect(eventsEmitSpy.withArgs('jobQueued', job2.id).calledOnce).to.eq(true);
        });
      });

      context('and the job throws an other Error', () => {
        // TODO: What is the desired behaviour here?
      });
    });
  });
});
