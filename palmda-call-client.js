{// ================= Call Plugin Library =================
  const CALL_VERSION = "0.1.3";
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
        // this === PalmdaClient.instance().call

        // Palmda => iFrame
        const requiredMethods = {
          'makeCall': false,
          'answerCall': false,
          'hangupCall': false,
          'muteCall': false,
          'unmuteCall': false,
          'holdCall': false,
          'unholdCall': false,
          'setStatus': false
        };

        const missingMethods = [];

        Object.keys(requiredMethods).forEach(methodName => {
          if (typeof this[methodName] === 'function') {
            missingMethods.push(methodName)
          }
        });

        if (missingMethods.length === 0) return true;

        throw new Error(`E8 Following methods are not not implemented.\n${missingMethods.join(', ')}\nImplement them via 'PalmdaClient.prototype.call.<methodName> = aFunction'`);
      },

      // iFrame => Palmda :: Following methods will be called by plugin code in order to inform the parent page
      // ----------------
      callIncoming: function (phoneNumber) {
        sendMessage('grispi.call.event.incoming', {phoneNumber: phoneNumber});
      },
      callAnswered: function (phoneNumber) {
        sendMessage('grispi.call.event.answered', {phoneNumber: phoneNumber});
      },
      /**
       * This method should be called when an incoming call answered or an outgoing call is started (even in ringing state)
       * @param phoneNumber
       */
      callStarted: function (phoneNumber) {
        sendMessage('grispi.call.event.started', {phoneNumber: phoneNumber});
      },
      callEnded: function (phoneNumber) {
        sendMessage('grispi.call.event.ended', {phoneNumber: phoneNumber});
      },
      statusSet: function (status) {
        //TODO validate status string
        sendMessage('grispi.call.event.statusSet', {status: status});
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
