const express = require('express');
const { callDatahogJob } = require('./jobs/call_datahog_job');
const { WorkerRunner } = require('./worker_runner');


const workers = new WorkerRunner({maxConcurrency: 1, retryLimit: 10});
workers.start();

const serverPorts = {
  'production': 3001,
  'test': 4001,
}

const handlePostRequest = (req, res) => {
  console.log('[Server] Received POST request with body:');
  console.log(`[Server] ${JSON.stringify(req.body)}`);
  let response;
  const provider = req.body.provider;
  const callbackUrl = req.body.callbackUrl;

  // Validate provider and callbackUrl are in payload:
  if (provider == undefined || callbackUrl == undefined) {
    response = {'error': 'Must supply the provider and callbackUrl values in the request JSON payload'};
    res.send(JSON.stringify(response));
    return;
  }

  // Validate provider is an acceptable value:
  if (!['gas', 'internet'].includes(provider)) {
    response = {'error': `The provider given is not valid, it must be either 'gas' or 'internet'`};
    res.send(JSON.stringify(response));
    return;
  }

  const jobParams = {provider: provider, callbackUrl: callbackUrl};
  workers.enqueueJob(callDatahogJob, jobParams);

  response = {'job_status': 'queued'};
  res.send(JSON.stringify(response));
};

const startServer = () => {
  const server = express();
  const port = serverPorts[process.env.NODE_ENV];

  server.use(express.json());
  server.get('/', (req, res) => res.send('Welcome to the Datahog Gateway! Enjoy!'));
  server.post('/', handlePostRequest);
  server.listen(port, () => console.log(`[Server] Datahog-Gateway listening at http://localhost:${port}`));

  return server;
};

module.exports = { startServer, serverPorts };

