const EventEmitter = require('events');
const uuid = require('uuid');
const { JobsQueue } = require('./jobs_queue');

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

    console.log(`[WorkerRunner] A job has been queued! ${job.id}`);

    if (this._workerIsAvailable()) {
      this._processJob(job);
    } else {
      console.log(`[WorkerRunner] No worker available for job ${job.id}`)
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
    console.log(`[WorkerRunner] Processing ${job.id}`)

    try {
      await job.func();
      this.busyWorkers -= 1;
      console.log(`[WorkerRunner] Job ${job.id} done.`);
    } catch(e) {
      console.log(`[WorkerRunner] Job ${job.id} ${e.name}: ${e.message}`);
      this.busyWorkers -= 1;
      this._retryJob(job);
    }
  }

  _retryJob(job) {
    if (job.attempts >= this.retryLimit) {
      console.error(`[WorkerRunner] Job ${job.id} has failed ${job.attempts} attempts! Discarding job.`);
      return;
    }

    console.log(`[WorkerRunner] Retrying job ${job.id} (${job.attempts})`)
    job.attempts += 1;
    this._enqueueJobObj(job);
  }

  _enqueueJobObj(job) {
    this.jobsQueue.enqueue(job);
    this.events.emit('jobQueued', job.id);
  }
}

module.exports = { WorkerRunner };

