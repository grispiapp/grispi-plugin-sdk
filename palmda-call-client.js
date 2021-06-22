{// ================= Call Plugin Library =================
  const CALL_VERSION = "0.1.0";
  if (typeof PalmdaClient !== "function") {
    throw new Error('E6 PalmdaClient is not defined. Call Plugin Library should be added to the page after PalmdaClient is defined.');
  }

  if (typeof PalmdaClient.prototype.incomingCall === "function") {
    throw new Error(`E7 PalmdaCallClient is already defined. Existing version: '${window.PalmdaClient.callVersion}' and this version: '${VERSION}'.`);
  }

  // All phone numbers are in E164 format (+905051234567)
  function init() {

    // Palmda => iFrame XXXCall()
    // iFrame => Palmda CallXXX()

    PalmdaClient.prototype.call = {

      // Make sure all XXXCall methods are implemented by the plugin
      validateImplementation: function() {
        debugger
        console.log(this)

        'makeCall'
        'answerCall'
        'hangupCall'
        'muteCall'
        'unmuteCall'
        'holdCall'
        'unholdCall'
        'setStatus'
      },

      // iFrame => Palmda :: Following methods will be called by plugin code in order to inform the parent page
      // ----------------
      callIncoming: function (phoneNumber) {
        sendMessage({id: 'pluginId', type: 'callIncoming', auth: 'token', data: {phoneNumber: phoneNumber}});
      },
      callAnswered: function (phoneNumber) {
        sendMessage({id: 'pluginId', type: 'callAnswered', auth: 'token', data: {phoneNumber: phoneNumber}});
      },
      callEnded: function (phoneNumber) {
        sendMessage({id: 'pluginId', type: 'callEnded', auth: 'token', data: {phoneNumber: phoneNumber}});
      },
      statusSet: function (status) {
        //TODO validate status string
        sendMessage({id: 'pluginId', type: 'statusSet', auth: 'token', data: {status: status}});
      },

    };

    Object.defineProperty(PalmdaClient.instance(), 'callVersion', {
      value: CALL_VERSION,
      writable: false
    });
  }

  init();

  console.log(`PalmdaCallClient v${CALL_VERSION} (using PalmdaClient v${PalmdaClient.instance().version}) initialized successfully.`)
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
