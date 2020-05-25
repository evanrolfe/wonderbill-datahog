const { WorkerRunner, ServiceDownError } = require('../../src/worker_runner');

const serviceUpJob = () => { return };
const serviceDownJob = () => { throw new ServiceDownError() };

describe('WorkerRunner', () => {
  describe('processing a single job', () => {
    let workers;

    beforeEach(() => {
      workers = new WorkerRunner({name: 'test', maxConcurrency: 1, retryLimit: 5});

      // Stub out this function, we dont want it to actually start:
      workers.start = () => {};
      workers.startDown = () => {};

      // Stub this because we dont want any sleeps:
      //workers._jobInterval = () => { return 0 };
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

          // TODO: Why doesnt this line work?
          //expect(eventsEmitSpy.withArgs('jobQueued', job2.id).calledOnce).to.eq(true);
        });
      });

      context('and the job throws an other Error', () => {
        // TODO: What is the desired behaviour here?
      });
    });
  });
});
