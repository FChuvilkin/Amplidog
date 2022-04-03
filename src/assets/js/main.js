import "core-js/stable";
import "regenerator-runtime/runtime";

import * as tracking from "./eventTracking.js";
import * as experimenting from "./experimentInit.js";

tracking.analyticsInit();
tracking.analyticsTracking();

const experiment = experimenting.initializeExperiment();

function fetchAndExpose() {
  const expAssignment = experimenting.fetchAssignmnets(experiment);
  expAssignment.then(f => {
      const variantExp1 = experimenting.showVariant(experiment, "background-color-experiment");
      console.log("One of the variants will be applied");

      // Act based on variant
      if (variantExp1.value === 'treatment') {
        document.querySelector("body").classList.add("inverted");
        console.log("--> treatment applied")
      } else if (variantExp1.value === 'control') {
        console.log("control applied")
      } else {
        console.log("no variant fatched yet")
      }
    }
  )
}

function onlyFetch() {
  const expAssignment = experimenting.fetchAssignmnets(experiment);
}

function addFirstPageListener(){
  const variantExp2 =
    document.getElementById("footer-twtr").addEventListener('click', function() {
      const t = experimenting.showVariant(experiment, "link-to-twitter");
      localStorage.setItem("link-to-twitter", t.value);
      return t;
    });
}

if (document.querySelector("body").classList.contains("landing-page")) {
  fetchAndExpose();
  addFirstPageListener();
} else if (document.querySelector("body").classList.contains("second-page")){
  onlyFetch()
}
  else {
    console.log("It is not first or second page")
}


console.log("Script has run till the end")
