const EventEmitter = require('events');
const uuid = require('uuid');
const { JobsQueue } = require('./jobs_queue');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ServiceDownError extends Error {
  constructor() {
    super('The service is down!');
  }
}

// TODO: This class is very monolithic, should be broken up according to behaviour,
// i.e. split the code between the UP state and the DOWN state behaviour
class WorkerRunner {
  constructor({maxConcurrency, retryLimit}) {
    this.events = new EventEmitter();
    this.jobsQueue = new JobsQueue();
    this.busyWorkers = 0;
    this.maxConcurrency = maxConcurrency;
    this.retryLimit = retryLimit;
    this.state = 'up';
  }

  start() {
    console.log(`[WorkerRunner] Starting in state: UP`);
    this.events.on('jobQueued', this._onJobQueuedEventUp.bind(this));

    // If there are already jobs in the queue then we have to emit events for each job,
    // this happens if the service is down but then goes back up again
    this.jobsQueue.jobs.forEach((job) => {
      console.log(`Emitting jobQueued ${job.id}`)
      this.events.emit('jobQueued', job.id);
    });
  }

  startDown() {
    console.log(`[WorkerRunner] Starting in state: DOWN`);
    this.events.on('jobQueued', this._onJobQueuedEventDown.bind(this));
  }

  stop() {
    this.events.removeAllListeners('jobQueued');
    console.log(`[WorkerRunner] Stopped.`);
  }

  enqueueJob(jobFunc, jobParams) {
    const job = { id: uuid.v4(), func: jobFunc, params: jobParams, attempts: 0 };
    this._enqueueJobObj(job);
    return job;
  }

  async _onJobQueuedEventUp(jobId) {
    const job = this.jobsQueue.dequeue(jobId);

    console.log(`[WorkerRunner] Job ${job.id} trying to process...`);

    if (this._workerIsAvailable()) {
      await this._processJobUp(job);
    } else {
      console.log(`[WorkerRunner] Job ${job.id} no worker available for processing.`);
      setTimeout(() => {
        this.jobsQueue.enqueue(job);
        this.events.emit('jobQueued', jobId);
      }, this._jobInterval());
    }
  }

  async _onJobQueuedEventDown(jobId) {
    const job = this.jobsQueue.dequeue(jobId);

    console.log(`[WorkerRunner] Job ${job.id} trying to process...`);

    await this._processJobDown(job);
  }

  // Processing a single job in the UP state
  // TODO: Get rid of the duplicated coded bewtween this function and _processJobDown()
  async _processJobUp(job) {
    this.busyWorkers += 1;
    console.log(`[WorkerRunner] Job ${job.id} processing...`);

    try {
      // TODO: Probably a nicer way of doing this like using .bind()...
      await job.func(job);
      this.busyWorkers -= 1;
      console.log(`[WorkerRunner] Job ${job.id} done.`);

    } catch(e) {
      this.busyWorkers -= 1;
      console.log(`[WorkerRunner] Job ${job.id} failed - ${e.message}`);

      if (e instanceof ServiceDownError) {
        this._setDownState();
        this.jobsQueue.enqueue(job);
      } else {
        this._retryJob(job);
      }
    } finally {
      console.log(`\n`);
    }
  }

  // Processing a single job in the DOWN state
  async _processJobDown(job) {
    this.busyWorkers += 1;
    console.log(`[WorkerRunner] Job ${job.id} processing...`);

    try {
      await job.func(job);
      this.busyWorkers -= 1;
      console.log(`[WorkerRunner] Job ${job.id} done.`);

      // The service is Up again so we can go back to the UP state:
      this._setUpState();

    } catch(e) {
      this.busyWorkers -= 1;
      console.log(`[WorkerRunner] Job ${job.id} failed - ${e.message}`);

      this.jobsQueue.enqueue(job);

      // Process the next job in the queue:
      const nextJob = this.jobsQueue.getNextJob(job);

      await sleep(this._jobInterval());
      this.events.emit('jobQueued', nextJob.id);

    } finally {
      console.log(`\n`);
    }
  }

  _setDownState() {
    console.log(`[WorkerRunner] Setting DOWN state...`);
    this.stop();
    this.state = 'down';
    this.startDown();
  }

  _setUpState() {
    console.log(`[WorkerRunner] Setting UP state...`);
    this.stop();
    this.state = 'up';
    this.start();
  }

  _jobInterval() {
    return (this.state == 'up') ? 100 : 1000;
  }

  _workerIsAvailable() {
    return (this.busyWorkers < this.maxConcurrency);
  }

  async _retryJob(job) {
    if (job.attempts >= this.retryLimit) {
      // TODO: Make this go into a dead-letter queue
      console.error(`[WorkerRunner] Job ${job.id} has failed ${job.attempts} attempts! Discarding job.`);
      return;
    }

    const wait = job.attempts * 250;
    await sleep(wait);

    console.log(`[WorkerRunner] Job ${job.id} retrying (attempt ${job.attempts}) after waiting ${wait} ms`)
    job.attempts += 1;
    this._enqueueJobObj(job);
  }

  _enqueueJobObj(job) {
    this.jobsQueue.enqueue(job);
    if (this.state == 'up') {
      this.events.emit('jobQueued', job.id);
    }
  }
}

module.exports = { WorkerRunner, ServiceDownError };
