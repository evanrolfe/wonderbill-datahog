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
  constructor({name, maxConcurrency, retryLimit}) {
    this.name = name;
    this.maxConcurrency = maxConcurrency;
    this.retryLimit = retryLimit;

    this.events = new EventEmitter();
    this.jobsQueue = new JobsQueue();
    this.busyWorkers = 0;
    this.state = 'up';
  }

  start() {
    this._log(`Starting in state: UP`);
    this.events.on('jobQueued', this._onJobQueuedEventUp.bind(this));

    // If there are already jobs in the queue then we have to emit events for each job,
    // this happens if the service is down but then goes back up again
    this.jobsQueue.jobs.forEach((job) => {
      this.events.emit('jobQueued', job.id);
    });
  }

  startDown() {
    this._log(`Starting in state: DOWN`);
    this.events.on('jobQueued', this._onJobQueuedEventDown.bind(this));
  }

  stop() {
    this.events.removeAllListeners('jobQueued');
    this._log(`Stopped.`);
  }

  enqueueJob(jobFunc, jobParams) {
    const job = { id: uuid.v4(), func: jobFunc, params: jobParams, attempts: 0 };
    this._enqueueJobObj(job);
    return job;
  }

  async _onJobQueuedEventUp(jobId) {
    const job = this.jobsQueue.dequeue(jobId);

    // NOTE: Sometimes when you stop/start the events, there are some stale ones left over that
    // still get called so we need to check that the job actually exists first:
    if (job === undefined) return;

    this._log(`trying to process...`, job);

    if (this._workerIsAvailable()) {
      await this._processJobUp(job);
    } else {
      this._log(`no worker available for processing.`, job);
      setTimeout(() => {
        this.jobsQueue.enqueue(job);
        this.events.emit('jobQueued', jobId);
      }, this._jobInterval());
    }
  }

  async _onJobQueuedEventDown(jobId) {
    const job = this.jobsQueue.dequeue(jobId);
    if (job === undefined) return;

    this._log(`trying to process...`, job);

    await this._processJobDown(job);
  }

  // Processing a single job in the UP state
  // TODO: Get rid of the duplicated coded bewtween this function and _processJobDown()
  async _processJobUp(job) {
    this.busyWorkers += 1;
    this._log(`processing...`, job);

    try {
      // TODO: Probably a nicer way of doing this like using .bind()...
      await job.func();
      this.busyWorkers -= 1;
      this._log(`done.`, job);

    } catch(e) {
      this.busyWorkers -= 1;
      this._log(`failed - ${e.message}`, job);

      if (e instanceof ServiceDownError) {
        this._setDownState();
        this._enqueueJobObj(job)
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
    this._log(`processing...`, job);

    try {
      await job.func();
      this.busyWorkers -= 1;
      this._log(`done.`, job);

      // The service is Up again so we can go back to the UP state:
      this._setUpState();

    } catch(e) {
      this.busyWorkers -= 1;
      this._log(`failed - ${e.message}`, job);

      this.jobsQueue.enqueue(job);

      // Process the next job in the queue:
      const nextJob = this.jobsQueue.getNextJob(job);

      //await sleep(this._jobInterval());
      this.events.emit('jobQueued', nextJob.id);

    } finally {
      console.log(`\n`);
    }
  }

  _setDownState() {
    this._log(`Setting DOWN state...`);
    this.stop();
    this.state = 'down';
    this.startDown();
  }

  _setUpState() {
    this._log(`Setting UP state...`);
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
      console.error(`[WorkerRunner-${this.name}] Job ${job.id} has failed ${job.attempts} attempts! Discarding job.`);
      return;
    }

    const wait = job.attempts * 250;
    await sleep(wait);

    this._log(`retrying (attempt ${job.attempts}) after waiting ${wait} ms`, job)
    job.attempts += 1;
    this._enqueueJobObj(job);
  }

  _enqueueJobObj(job) {
    this.jobsQueue.enqueue(job);
    this.events.emit('jobQueued', job.id);
  }

  _log(message, job) {
    if (job !== undefined) {
      console.log(`[WorkerRunner-${this.name}] Job ${job.id} ${message}`);
    } else {
      console.log(`[WorkerRunner-${this.name}] ${message}`);
    }
  }
}

module.exports = { WorkerRunner, ServiceDownError };
