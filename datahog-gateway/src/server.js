const express = require('express');
const { callDatahogJob } = require('./jobs/call_datahog_job');
const { WorkerRunner } = require('./worker_runner');
const { Provider } = require('./provider');

const serverPorts = {
  'production': 3001,
  'test': 4001,
}

const gasProvider = new Provider('gas', 'http://datahog:3000/providers/gas');
const internetProvider = new Provider('internet', 'http://datahog:3000/providers/internet');
const providers = {
  'gas': gasProvider,
  'internet': internetProvider,
};

const handlePostRequest = (req, res) => {
  console.log('[Server] Received POST request with body:');
  console.log(`[Server] ${JSON.stringify(req.body)}`);
  let response;
  const providerKey = req.body.provider;
  const callbackUrl = req.body.callbackUrl;

  // Validate providerKey and callbackUrl are in payload:
  if (providerKey == undefined || callbackUrl == undefined) {
    response = {'error': 'Must supply the provider and callbackUrl values in the request JSON payload'};
    res.send(JSON.stringify(response));
    return;
  }

  // Validate providerKey is an acceptable value:
  const avilableProviders = Object.keys(providers);
  if (!avilableProviders.includes(providerKey)) {
    response = {'error': `The provider given is not valid, it must be either 'gas' or 'internet'`};
    res.send(JSON.stringify(response));
    return;
  }

  // Request a callback from the Provider:
  const provider = providers[providerKey];
  const job = provider.requestCallback(callbackUrl);

  response = {
    job: {
      id: job.id, state: 'queued'
    },
    provider_state: provider.state()
  };
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

