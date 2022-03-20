function logToAmpl(eventName) {
  var event = eventName;
  amplitude.getInstance().logEvent(event);
}
