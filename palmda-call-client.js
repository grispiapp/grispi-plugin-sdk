{// ================= Call Plugin Library =================
  const CALL_VERSION = "0.1.0";
  if (typeof PalmdaClient !== "undefined") {
    throw new Error('E6 PalmdaClient is not defined. Call Plugin Library should be added to the page after PalmdaClient is defined.');
  }

  // All phone numbers are in E164 format (+905051234567)
  function init() {
    PalmdaClient.prototype.incomingCall = function (phoneNumber) {
      sendMessage({id: 'pluginId', type: 'incomingCall', auth: 'token', data: {phoneNumber: phoneNumber}});
    };

    PalmdaClient.prototype.answeredCall = function (phoneNumber) {
      sendMessage({id: 'pluginId', type: 'answeredCall', auth: 'token', data: {phoneNumber: phoneNumber}});
    };

    PalmdaClient.prototype.endedCall = function (phoneNumber) {
      sendMessage({id: 'pluginId', type: 'endedCall', auth: 'token', data: {phoneNumber: phoneNumber}});
    };

    Object.defineProperty(PalmdaClient.instance(), 'callVersion', {
      value: CALL_VERSION,
      writable: false
    });
  }

  console.log(`PalmdaCallClient v${VERSION} (using PalmdaClient v${VERSION}) initialized successfully.`)
}// end of client library

/*
  function waitForPalmdaClient(){
    if(typeof PalmdaClient !== "undefined"){
        init();
    }
    else{
      console.warn("Waiting for PalmdaClient to be defined. This shouldn't ");
        setTimeout(waitForElement, 50);
    }
  }
*/
