"use strict";

var _experimentJsClient = require("@amplitude/experiment-js-client");

// (1) Get your deployment's API key
const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv'; // (2) Initialize the experiment client

const experiment = _experimentJsClient.Experiment.initializeWithAmplitudeAnalytics(apiKey); // (3) Fetch variants for a user


await experiment.fetch();
