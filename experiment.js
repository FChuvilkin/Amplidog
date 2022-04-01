import { Experiment } from '@amplitude/experiment-js-client';

// (1) Get your deployment's API key
const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv';

// (2) Initialize the experiment client
const experiment = Experiment.initialize(apiKey);

// (3) Fetch variants for a user
const user = {
  user_id: 'USER-ID',
  device_id: 'DEVICE-ID',
  user_properties: {
    'custom': 'value',
  },
};
await experiment.fetch(user);
