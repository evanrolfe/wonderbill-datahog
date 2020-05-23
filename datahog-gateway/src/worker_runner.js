const EventEmitter = require('events');
const uuid = require('uuid');
const { JobsQueue } = require('./jobs_queue');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ServiceDownError extends Error {}

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
    this.events.on('jobQueued', this._onJobQueuedEvent.bind(this));
  }

  stop() {
    this.events.removeAllListeners('jobQueued');
    console.log(`[WorkerRunner] Stopped.`);
  }

  startDown() {
    console.log(`[WorkerRunner] Starting in state: DOWN`);
    // TODO
  }

  enqueueJob(jobFunc, jobParams) {
    const job = { id: uuid.v4(), func: jobFunc, params: jobParams, attempts: 0 };
    this._enqueueJobObj(job);
    return job;
  }

  async _onJobQueuedEvent(jobId) {
    const job = this.jobsQueue.dequeue(jobId);

    console.log(`[WorkerRunner] Job ${job.id} trying to process...`);

    if (this._workerIsAvailable()) {
      await this._processJob(job);
    } else {
      console.log(`[WorkerRunner] Job ${job.id} no worker available for processing.`);
      setTimeout(() => {
        this.jobsQueue.enqueue(job);
        this.events.emit('jobQueued', jobId);
      }, this._jobInterval());
    }
  }

  _jobInterval() {
    return (this.state == 'up') ? 100 : 1000;
  }

  _workerIsAvailable() {
    return (this.busyWorkers < this.maxConcurrency);
  }

  async _processJob(job) {
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

  _setDownState() {
    console.log(`[WorkerRunner] Setting down state...`);
    this.stop();
    this.state = 'down';
    this.startDown();
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
    this.events.emit('jobQueued', job.id);
  }
}

module.exports = { WorkerRunner, ServiceDownError };

