import amplitude from 'amplitude-js';


import { Experiment } from '@amplitude/experiment-js-client';


function initializeExperiment() {
// (1) Get your deployment's API key
const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv';

amplitude.getInstance().init("53d662ed165eae375ae4ade7767e238d");
// (2) Initialize the experiment client
const experiment = Experiment.initializeWithAmplitudeAnalytics(apiKey);

// (3) Fetch variants for a user

const expAssignment = experiment.fetch();

return expAssignment;

}

const initExperiment = initializeExperiment()

function showVariant() {
  console.log(initExperiment)
  initExperiment.then(experiment => {
    console.log(experiment)
    const variant = experiment.variant("background-color-experiment")
    console.log(variant);
    if (variant.value === 'treatment') {
      // Flag is on
      document.querySelector("body").classList.add("inverted");

    } else {
        // Flag is off
}
  });

}

showVariant();
