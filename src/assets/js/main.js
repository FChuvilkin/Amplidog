import "core-js/stable";
import "regenerator-runtime/runtime";

import * as tracking from "./eventTracking.js";
import * as experimenting from "./experimentInit.js";

// Imported functions to initialize analytics and track all events
tracking.analyticsInit();
tracking.analyticsTracking();

// Step 1. Initializing Experiment using imported function
const experiment = experimenting.initializeExperiment();

// Step 2. Fetch variants for all experiments
const expAssignment = experimenting.fetchAssignmnets(experiment);

// Additional function used for passing Experiment 2 data to local storage
// Function to track Exposures
// Not relevant for Experiment 1
function exposureTrackerExperiment2() {
  const variantExp2 =
    document.getElementById("footer-twtr").addEventListener('click', function() {
      const t = experimenting.showVariant(experiment, "link-to-twitter");
      localStorage.setItem("link-to-twitter", t.value);
      return t;
    });
}


// Instrumenting Experiment 1 (Background color change) on Landing page
if (document.querySelector("body").classList.contains("landing-page")) {

  // Step 3. Show variant for 'Background color' Experiment
  expAssignment.then(f => {
    const variantExp1 = experimenting.showVariant(experiment, "background-color-experiment");

    // Step4. Act based on variant (Experiment 1)
    if (variantExp1.value === 'treatment') {
      document.querySelector("body").classList.add("inverted");
      console.log("--> treatment applied")

    } else if (variantExp1.value === 'control') {
      console.log("control applied")

    } else {
      console.log("no variant fatched yet")
    }

  })
  // Adding exposure tracker aka Step 3 for Experiment 2
  exposureTrackerExperiment2()
}

// Instrumenting Experiment 2 (Link to twitter) on second page
if (document.querySelector("body").classList.contains("second-page")) {

  //Step 4. Act based on the variant
  if (localStorage.getItem("link-to-twitter") === 'treatment') {
    document.getElementById("experiment-header").innerHTML = "You are in treatment group";
  } else {
    document.getElementById("experiment-header").innerHTML = "You are in control group, experiment is working";
  }
}

// For debugging
// console.log("Script has run till the end")
