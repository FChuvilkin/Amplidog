// Import Experiment SDK
import { Experiment } from '@amplitude/experiment-js-client';

// Initialize the experiment client with the API key
export function initializeExperiment() {
  const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv';
  const experiment = Experiment.initializeWithAmplitudeAnalytics(apiKey);
  // console.log(experiment + "is initialized");
  // console.log(typeof experiment)
  return experiment;
}

// Creating a function that fetches experiments for a user
export async function fetchAssignmnets(experiment){
  const all = await experiment.fetch();
  // console.log("Async function returned response");
  // console.log(all);
}


// Creating a function that shows variant
export function showVariant(experiment, key) {
  const variant = experiment.variant(key);
  // console.log(variant);
  return variant;
};
