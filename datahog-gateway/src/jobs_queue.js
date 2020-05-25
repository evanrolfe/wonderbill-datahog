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

  getNextJob(job) {
    const currentIndex = this.jobs.indexOf(job);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= this.jobs.length - 1) {
      nextIndex = 0;
    }

    return this.jobs[nextIndex];
  }
}

module.exports = { JobsQueue };

