const express = require('express');
const { callDatahogJob } = require('./jobs/call_datahog_job');
const { WorkerRunner } = require('./worker_runner');


const workers = new WorkerRunner(1, 10);
workers.start();

const serverPorts = {
  'production': 3001,
  'test': 4001,
}

const handlePostRequest = (req, res) => {
  console.log('Received post request!');
  const jobParams = {provider: req.body.provider, callbackUrl: req.body.callbackUrl};
  console.log(jobParams);
  workers.enqueueJob(callDatahogJob, jobParams);

  const response = {'status': 'queued'};
  res.send(JSON.stringify(response));
};

const startServer = () => {
  const server = express();
  const port = serverPorts[process.env.NODE_ENV];

  server.use(express.json());
  server.get('/', (req, res) => res.send('Welcome to the Datahog Gateway! Enjoy!'));
  server.post('/', handlePostRequest);
  server.listen(port, () => console.log(`Datahog-Gateway listening at http://localhost:${port}`));

  return server;
};

module.exports = { startServer, serverPorts };

