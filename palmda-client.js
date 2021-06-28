{
// ------------------ CLIENT LIBRARY ----------------------
  const VERSION = "0.1.0";

  if (typeof window.PalmdaClient === "function") {
    throw new Error(`E0 PalmdaClient is already defined. Existing version: '${window.PalmdaClient.version}' and this version: '${VERSION}'.`);
  }

  const parsedHash = new URLSearchParams(window.location.hash.substr(1)); // skip the first char (#)

  const origin = parsedHash.get('origin');
  if (!origin) {
    throw new Error('E1 Origin is empty!');
  }

  const pluginId = parsedHash.get('pluginId');
  if (!origin) {
    throw new Error('E9 pluginId is empty!');
  }

  const iframeAuth = parsedHash.get('iframeAuth');
  if (!origin) {
    throw new Error('E10 iframeAuth is empty!');
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
          id: pluginId,
          type: 'init',
          iframeAuth: iframeAuth
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
  console.log(`PalmdaClient v${VERSION} initialized successfully.`)
}
