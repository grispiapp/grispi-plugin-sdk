{
// ------------------ CLIENT LIBRARY ----------------------
  const VERSION = "0.2.0";

  if (typeof window.PalmdaClient === "function") {
    throw new Error(`E0 PalmdaClient is already defined. Existing version: '${window.PalmdaClient.version}' and this version: '${VERSION}'.`);
  }

  const parsedHash = new URLSearchParams(window.location.hash.substr(1)); // skip the first char (#)

  const origin = parsedHash.get('origin');
  if (!origin) {
    throw new Error('E1 Origin is empty!');
  }

  const pluginId = parsedHash.get('pluginId');
  if (!pluginId) {
    throw new Error('E9 pluginId is empty!');
  }

  const iframeAuth = parsedHash.get('iframeAuth');
  if (!iframeAuth) {
    throw new Error('E10 iframeAuth is empty!');
  }

  let initializing = false;
  let initMethodCalled = false;
  let instance = null;
  let pluginSettings = null;
  let currentTicketResolveFn = null;

  function sendMessage(type, data) {

    if (typeof type !== 'string') {
      console.error(`Cannot send message without a 'type'!`, type, data);
      throw new Error(`Cannot send message without a 'type'!`);
    }

    const message = {
      data,
      type,
      pluginId,
      iframeAuth
    }
    window.parent.postMessage(message, origin);
  }

  class PalmdaClient {
    constructor() {
      if (!initializing) {
        throw new Error('E2 The constructor is private, please use instance() method.');
      }
      initializing = false;

      if (!instance) {
        instance = this;
      }

      Object.defineProperty(instance, 'version', {
        value: VERSION,
        writable: false
      });

      return instance;
    }

    static instance() {
      initializing = true;
      return new PalmdaClient();
    }

    validateImplementation() {
      // Note that at this point: this === PalmdaClient.instance().call

      // Following methods are expected to be implemented by the plugin.
      // Following methods will be called by the parent page (Grispi UI) in order to execute an action.
      // Data flow: Grispi => Library
      // In Grispi, you're expected to call following functions by sending a specific message to the plugin iframe as follows:
      // iFrameEl.current.contentWindow.postMessage({type: 'grispi.plugin.fn.<function_name>', data: {...}}, targetOrigin);
      const requiredMethods = {
        'activeTicketChanged': false, //activeTicketChanged(currentTicketKey)
      };

      const missingMethods = [];

      Object.keys(requiredMethods).forEach(methodName => {
        if (typeof this[methodName] !== 'function') {
          missingMethods.push(methodName)
        }
      });

      if (missingMethods.length === 0) return true;

      throw new Error(`E8 Following methods are not not implemented.\n${missingMethods.join(', ')}\nImplement them via 'PalmdaClient.prototype.call.<methodName> = aFunction'`);
    }

    // Following methods will be called by plugin code in order to inform the parent page (Grispi UI) about an event or to retrieve some info
    // Data flow: Library => Grispi
    // ----------------

    //<editor-fold desc="_init()" defaultstate="collapsed">
    /**
     * Internal usage, don't use this method.
     * This must be the first method ever called on this object. This method is called by the library itself and users should not call this method.
     */
    _init() {
      if (pluginSettings) {
        return Promise.resolve(pluginSettings);
      }

      if (initMethodCalled) {
        return new Promise((resolve, reject) => {
          //TODO do we need a wait timeout?
          const intervalHandle = setInterval(() => {
            if (pluginSettings != null) { // Wait for the previous init method to set the pluginSettings so that we can call resolve with it
              clearInterval(intervalHandle);
              resolve(pluginSettings);
            }
          }, 50);
        });
      }
      initMethodCalled = true;

      return new Promise((resolve, reject) => {
        window.addEventListener(
          'message',
          (e) => {
            if (e.origin !== origin) {
              const msg = `E3 Origins does not match. Expected '${origin}' but found '${e.origin}'!`;
              console.error(msg);
              reject(new Error(msg));
              return;
            }

            if (!e.data) {
              const msg = `E4 Event data (event.data) is missing.`;
              console.error(msg);
              reject(new Error(msg));
              return;
            }

            if (!e.data.type) {
              const msg = `E5 Event data type (event.data.type) is missing.`;
              console.error(msg);
              reject(new Error(msg));
              return;
            }

            if (e.data.type === 'grispi.plugin.response.init') {
              pluginSettings = e.data.data;
              resolve(pluginSettings);
              return;
            }

            if (e.data.type === 'grispi.plugin.response.currentTicket') {
              const currentTicketKey = e.data.data;
              if (typeof currentTicketResolveFn === 'function') {
                currentTicketResolveFn(currentTicketKey);
              }
              return;
            }

            if (e.data.type.startsWith('grispi.plugin.fn')) {
              const fnName = e.data.type.replace('grispi.plugin.fn.', '');

              if (typeof this[fnName] === 'function') {
                this[fnName].apply(this, e.data.parameters);
              }
              return;
            }

            // Other plugin libs' event handlers
            const hasHandled = this.call?.messageHandler(e);

            // Events other than above should be handled by individual apps.
            // For example, call-client handles events with prefix 'grispi.call.'
          });
        sendMessage('grispi.plugin.request.init');
      });
    }
    //</editor-fold>

    getSettings() {
      return this._init();
    }

    currentTicket() {
      sendMessage('grispi.plugin.request.currentTicket');
      return new Promise((resolve, reject) => {
        currentTicketResolveFn = resolve;
        //FIXME implement timeout, and think about multiple calls of this method
      });
    }
  }

  PalmdaClient.instance()
    ._init()
    .then((data) => (pluginSettings = data));

  window.PalmdaClient = PalmdaClient;
  console.log(`PalmdaClient v${VERSION} initialized successfully.`)
}
