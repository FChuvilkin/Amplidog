import "core-js/stable";
import "regenerator-runtime/runtime";

import * as tracking from "./eventTracking.js";
import * as experimenting from "./experimentInit.js";

tracking.analyticsInit();
tracking.analyticsTracking();

const experiment = experimenting.initializeExperiment();
const expAssignment = experimenting.fetchAssignmnets(experiment);

function landingPageJs() {
  if (document.querySelector("body").classList.contains("landing-page")) {

    // Experiment №1 background-color-experiment
    // Apply experiment
    const variantExp1 = experimenting.showVariant(experiment, "background-color-experiment");

    // Act based on variant
    if (variantExp1.value === 'treatment') {
      document.querySelector("body").classList.add("inverted");
    } else {
      // no action
    }

    // Experiment №2 link-to-twitter
    // Apply experiment
    const variantExp2 =
      document.getElementById("footer-twtr").addEventListener('click', function() {
        const t = experimenting.showVariant(experiment, "link-to-twitter");
        localStorage.setItem("link-to-twitter", t.value);
        return t;
      });
  }
}

function secondPageJs() {
  if (document.querySelector("body").classList.contains("second-page")) {

    if (localStorage.getItem("link-to-twitter") === 'treatment') {
      document.getElementById("experiment-header").innerHTML = "You are in treatment group";
    } else {
      document.getElementById("experiment-header").innerHTML = "You are in control group, experiment is working";
    };
}}


landingPageJs();
secondPageJs();

console.log("script runs till the end")
