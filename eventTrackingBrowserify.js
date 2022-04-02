import amplitude from 'amplitude-js';

amplitude.getInstance().init("53d662ed165eae375ae4ade7767e238d");

/* Top Download buttons */
document.getElementById("apple-download-btn-top").onclick = function() {
  amplitude.getInstance().logEvent("Download App", {
    "Download_Store": "AppStore",
    "Button_Place": "Top"
  })
};
document.getElementById("android-download-btn-top").onclick = function() {
  amplitude.getInstance().logEvent("Download App", {
    "Download_Store": "Google Play",
    "Button_Place": "Top"
  })
};

/*Bottom Download buttons */
document.getElementById("apple-download-btn-bottom").onclick = function() {
  amplitude.getInstance().logEvent("Download App", {
    "Download_Store": "AppStore",
    "Button_Place": "Bottom"
  })
};
document.getElementById("android-download-btn-bottom").onclick = function() {
  amplitude.getInstance().logEvent("Download App", {
    "Download_Store": "Google Play",
    "Button_Place": "Bottom"
  })
};

/*Interact with testimonials*/
document.getElementById("carousel-left").onclick = function() {
  amplitude.getInstance().logEvent("Browse testimonials", {
    "Navigation": "Previous"
  })
};
document.getElementById("carousel-right").onclick = function() {
  amplitude.getInstance().logEvent("Browse testimonials", {
    "Navigation": "Next"
  })
};

/*Clickouts to social networks and sending email*/
document.getElementById("footer-twtr").onclick = function() {
  amplitude.getInstance().logEvent("Open Social Networks", {
    "Social_Account": "Twitter"
  })
};
document.getElementById("footer-fb").onclick = function() {
  amplitude.getInstance().logEvent("Open Social Networks", {
    "Social_Account": "Facebook"
  })
};
document.getElementById("footer-insta").onclick = function() {
  amplitude.getInstance().logEvent("Open Social Networks", {
    "Social_Account": "Instagram"
  })
};
document.getElementById("footer-mail").onclick = function() {
  amplitude.getInstance().logEvent("Send Email")
};


/*Tracking revenue*/
document.getElementById("free-tier").onclick = function() {
  var revenue = new amplitude.Revenue().setRevenueType('Free').setPrice(0).setQuantity(1)
  amplitude.getInstance().logRevenueV2(revenue)
};

document.getElementById("regular-tier").onclick = function() {
  var revenue = new amplitude.Revenue().setRevenueType('Regular').setPrice(49).setQuantity(1)
  amplitude.getInstance().logRevenueV2(revenue)
};

document.getElementById("premium-tier").onclick = function() {
  var revenue = new amplitude.Revenue().setRevenueType('Premium').setPrice(99).setQuantity(1)
  amplitude.getInstance().logRevenueV2(revenue)
};
