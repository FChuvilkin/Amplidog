// This file initializes both Analytics and Experiment SDKs

// Import Analytics SDK
import amplitude from 'amplitude-js';

// Import Experiment SDK
import {
  Experiment
} from '@amplitude/experiment-js-client';


function initializeExperiment() {

  // Initialize Analytics instance
  amplitude.getInstance().init("53d662ed165eae375ae4ade7767e238d");

  // Experiment flow
  // (1) Get your deployment's API key
  const apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv';

  // (2) Initialize the experiment client
  const experiment = Experiment.initializeWithAmplitudeAnalytics(apiKey);

  // (3) Fetch variants for a user
  const expAssignment = experiment.fetch();
  return expAssignment;

}
const initExperiment = initializeExperiment();


// (4) Function that calls variant and create an automatic Exposure event

function showVariant() {
  console.log(initExperiment)
  initExperiment.then(experiment => {
    console.log(experiment);

    const variant = experiment.variant("background-color-experiment");
    console.log(variant);

    if (variant.value === 'treatment') {

      // Experiment is treatment
      document.querySelector("body").classList.add("inverted");

    } else {
      // Flag is off
    }
  });

}

showVariant();

// Launch of the second experiment

function showVariant1() {
  console.log(initExperiment)
  initExperiment.then(experiment => {
    console.log(experiment);

    const variant = experiment.variant("link-to-twitter");
    console.log(variant);

    if (variant.value === 'treatment') {

      // Experiment is treatment
      document.getElementById("experiment-header").innerHTML = "You are in treatment group";

    } else {
      // Flag is off
    }
  });

}

// Tracking on a button

document.getElementById("footer-twtr").onclick = function() {
  amplitude.getInstance().logEvent("Open Social Networks", {
    "Social_Account": "Twitter"
  });
  showVariant1();
}
