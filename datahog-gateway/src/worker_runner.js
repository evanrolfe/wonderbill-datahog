const EventEmitter = require('events');
const uuid = require('uuid');
const { JobsQueue } = require('./jobs_queue');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class WorkerRunner {
  constructor(maxConcurrency, retryLimit) {
    this.events = new EventEmitter();
    this.jobsQueue = new JobsQueue();
    this.busyWorkers = 0;
    this.maxConcurrency = maxConcurrency;
    this.retryLimit = retryLimit;
  }

  start() {
    this.events.on('jobQueued', this._onJobQueuedEvent.bind(this));
  }

  enqueueJob(jobFunc, jobParams) {
    const job = { id: uuid.v4(), func: jobFunc, params: jobParams, attempts: 0 };
    this._enqueueJobObj(job);
  }

  _onJobQueuedEvent(jobId) {
    const job = this.jobsQueue.dequeue(jobId);

    console.log(`[WorkerRunner] Job ${job.id} trying to process...`);

    if (this._workerIsAvailable()) {
      this._processJob(job);
    } else {
      console.log(`[WorkerRunner] Job ${job.id} no worker available for processing.`);
      setTimeout(() => {
        this.jobsQueue.enqueue(job);
        this.events.emit('jobQueued', jobId);
      }, 500);
    }
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
      console.log(`[WorkerRunner] Job ${job.id} failed`);
      this.busyWorkers -= 1;
      this._retryJob(job);
    } finally {
      console.log(`\n`);
    }
  }

  async _retryJob(job) {
    if (job.attempts >= this.retryLimit) {
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

module.exports = { WorkerRunner };

