import "core-js/stable";
import "regenerator-runtime/runtime";

import * as tracking from "./eventTracking.js";
import * as experimenting from "./experimentInit.js";

// Imported functions to initialize analytics and track all events
tracking.analyticsInit();
tracking.analyticsTracking();

// Step 1. Initializing Experiment using imported function
const experiment = experimenting.initializeExperiment();

// Instrumenting Experiment 1 (Background color change)
// Fetch and Exposure happen at the same time
function fetchAndExpose() {

  //Step 2. Fetch variants for all experiments
  const expAssignment = experimenting.fetchAssignmnets(experiment);

  //Step 3. Show variant for 'Background color' Experiment
  expAssignment.then(f => {
    const variantExp1 = experimenting.showVariant(experiment, "background-color-experiment");
    console.log("One of the variants will be applied");

    // Step4. Act based on variant
    if (variantExp1.value === 'treatment') {
      document.querySelector("body").classList.add("inverted");
      console.log("--> treatment applied")
    } else if (variantExp1.value === 'control') {
      console.log("control applied")
    } else {
      console.log("no variant fatched yet")
    }
  })
}

// Step 1-2 will already be done by the function above
// Step 3. Executed by the function below. Calling variant when the twitter button is clicked
function addFirstPageListener() {
  const variantExp2 =
    document.getElementById("footer-twtr").addEventListener('click', function() {
      const t = experimenting.showVariant(experiment, "link-to-twitter");
      localStorage.setItem("link-to-twitter", t.value);
      return t;
    });
}


// This script executes the functions on the pages
if (document.querySelector("body").classList.contains("landing-page")) {
  fetchAndExpose();
  addFirstPageListener();
} else if (document.querySelector("body").classList.contains("second-page")) {

  //Step 4. Act based on the variant
  if (localStorage.getItem("link-to-twitter") === 'treatment') {
    document.getElementById("experiment-header").innerHTML = "You are in treatment group";
  } else {
    document.getElementById("experiment-header").innerHTML = "You are in control group, experiment is working";
  }
} else {
  console.log("It is not first or second page")
}

// This is Fetch only - currently not used
function onlyFetch() {
  const expAssignment = experimenting.fetchAssignmnets(experiment);
}


console.log("Script has run till the end")
