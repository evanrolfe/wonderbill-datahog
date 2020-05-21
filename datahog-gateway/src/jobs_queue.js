class JobsQueue {
  constructor() {
    this.jobs = [];
  }

  enqueue(job) {
    this.jobs.push(job);
  }

  dequeue(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    this.jobs = this.jobs.filter(j => j.id !== jobId);
    return job;
  }

  length() {
    return this.jobs.length;
  }

  alreadyQueued(url) {
    //return includes(this.queuedUrls, url);
  }
}

module.exports = { JobsQueue };

