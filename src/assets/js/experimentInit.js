// Import Experiment SDK
import { Experiment } from '@amplitude/experiment-js-client';


export function initializeExperiment() {

  // Experiment flow
  // (1) Get your deployment's API key
  const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv';

  // (2) Initialize the experiment client
  const experiment = Experiment.initializeWithAmplitudeAnalytics(apiKey);
  console.log(experiment);
  console.log(typeof experiment)
  return experiment;
}

export async function fetchAssignmnets(experiment){
  // (3) Fetch variants for a user
  const all = await experiment.fetch();
  console.log("Async function returned response");
  console.log(all);
}

export function showVariant(experiment, key) {
  const variant = experiment.variant(key);
  console.log(variant);
  return variant;
};
