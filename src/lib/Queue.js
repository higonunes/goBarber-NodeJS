import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redis from '../config/redis';

const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queues = {};
    this.init();
  }

  init() {
    jobs.forEach(({ key, hand }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis,
        }),
        hand,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach((job) => {
      const { bee, hand } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(hand);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
