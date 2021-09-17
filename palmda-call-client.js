{// ================= Call Plugin Library =================
  const CALL_VERSION = "0.2.1";
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

      messageHandler: function (e) {

        if ('grispi.call.request.makeCall' === e.data.type) {
          const phoneNumber = e.data.phoneNumber;

          if (typeof phoneNumber !== 'string') {
            console.error(`Invalid phone number for 'grispi.call.request.makeCall': '${phoneNumber}'`)
          }
          this.makeCall(phoneNumber);
          return true;
        }

        if (e.data.type.startsWith('grispi.call.fn')) {
          const fnName = e.data.type.replace('grispi.call.fn.', '');

          if (typeof this[fnName] === 'function') {
            this[fnName].apply(this, e.data.parameters);
          }
          return true;
        }

        return false;
      },

      // Make sure all XXXCall methods are implemented by the plugin
      validateImplementation: function() {
        // Note that at this point: this === PalmdaClient.instance().call

        // Following methods are expected to be implemented by the plugin.
        // Following methods will be called by the parent page (Grispi UI) in order to execute an action.
        // Data flow: Grispi => Library
        // In Grispi, you're expected to call following functions by sending a specific message to the plugin iframe as follows:
        // iFrameEl.current.contentWindow.postMessage({type: 'grispi.call.fn.<function_name>', parameters: [...]}, targetOrigin);
        const requiredMethods = {
          'makeCall': false,  // has 1 parameter (string): phone number in E164 format
          'answerCall': false,// has no parameter
          'hangupCall': false,// has no parameter
          'muteCall': false,  // has no parameter
          'unmuteCall': false,// has no parameter
          'holdCall': false,  // has no parameter
          'unholdCall': false,// has no parameter
          'setStatus': false, // has 1 parameter (string): the status
          'userIdentifiedForCall': false, // has 1 parameter (object): the user
        };

        const missingMethods = [];

        Object.keys(requiredMethods).forEach(methodName => {
          if (typeof this[methodName] !== 'function') {
            missingMethods.push(methodName)
          }
        });

        if (missingMethods.length === 0) return true;

        throw new Error(`E8 Following methods are not not implemented.\n${missingMethods.join(', ')}\nImplement them via 'PalmdaClient.prototype.call.<methodName> = aFunction'`);
      },

      // Following methods will be called by plugin code in order to inform the parent page (Grispi UI) about an event or to retrieve some info
      // Data flow: Library => Grispi
      // ----------------
      callIncoming: function (phoneNumber, extras) {
        sendMessage('grispi.call.event.incoming', {phoneNumber, extras});
        // Grispi window should handle grispi.call.event.incoming event and send a request to backend to initiate upsert ticket operation for phone number
      },
      /**
       * Outgoing call has ringtone and not answered yet by the customer
       * @param phoneNumber
       */
      callDialing: function (phoneNumber, extras) {
        sendMessage('grispi.call.event.dialing', {phoneNumber, extras});
      },
      /**
       * This method should be called when an incoming call answered or an outgoing call is started (even in ringing state)
       * @param phoneNumber
       */
      callStarted: function (phoneNumber, extras) {
        sendMessage('grispi.call.event.started', {phoneNumber, extras});
      },
      callEnded: function (phoneNumber, extras) {
        sendMessage('grispi.call.event.ended', {phoneNumber, extras});
      },
      statusSet: function (status, extras) {
        //TODO validate status string
        sendMessage('grispi.call.event.statusSet', {status, extras});
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
