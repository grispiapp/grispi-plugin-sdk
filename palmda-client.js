{
// ------------------ CLIENT LIBRARY ----------------------
  const VERSION = "0.1.0";

  if (typeof window.PalmdaClient !== "undefined") {
    throw new Error(`E0 PalmdaClient is already defined. Existing version: '${window.PalmdaClient.version}' and this version: '${VERSION}'.`);
  }

  const origin = window.location.hash.replace('#origin=', '');
  if (!origin) {
    throw new Error('E1 Origin is empty!');
  }

  let initializing = false;
  let initMethodCalled = false;
  let instance = null;
  let pluginConfig = null;

  function sendMessage(data) {
    window.parent.postMessage(data, origin);
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

    /**
     * Internal usage, don't use this method.
     * This must be the first method ever called on this object. This method is called by the library itself and users should not call this method.
     */
    _init() {
      if (pluginConfig) {
        return Promise.resolve(pluginConfig);
      }

      if (initMethodCalled) {
        return new Promise((resolve, reject) => {
          //TODO do we need a wait timeout?
          const intervalHandle = setInterval(() => {
            if (pluginConfig != null) {
              clearInterval(intervalHandle);
              resolve(pluginConfig);
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
              console.error(`Origins does not match. Expected '${origin}' but found '${e.origin}'!`);
              reject(new Error(`E3 Origins does not match. Expected '${origin}' but found '${e.origin}'!`));
              return;
            }

            if (!e.data) {
              console.error(`Event data (event.data) is missing.`, e);
              reject(new Error(`E4 Event data (event.data) is missing.`));
              return;
            }

            if (!e.data.type) {
              console.error(`Event data type (event.data.type) is missing.`, e);
              reject(new Error(`E5 Event data type (event.data.type) is missing.`));
              return;
            }

            switch (e.data.type) {
              case 'init': {
                pluginConfig = e.data.data;
                resolve(pluginConfig);
                return;
              }
              default: {
                const type = e.data.type;

                return;
              }
            }
          },
          false,
        );
        sendMessage({
          id: 'pluginId',//FIXME
          type: 'init',
          auth: 'token',
          note: 'Send me the pluginConfig data to connect WS',
        });
      });
    }

    getConfig() {
      return this._init();
    }
  }

  PalmdaClient.instance()
    ._init()
    .then((data) => (pluginConfig = data));

  window.PalmdaClient = PalmdaClient;
}
