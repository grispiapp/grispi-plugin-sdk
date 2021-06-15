{
// ------------------ CLIENT LIBRARY ----------------------
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
            throw new Error('The constructor is private, please use instance() method.');
        }
        initializing = false;

        if (!instance) {
            instance = this;
        }

        return instance;
    }

    static instance() {
        initializing = true;
        return new PalmdaClient();
    }

    _init() {
        if (pluginConfig) {
            return Promise.resolve(pluginConfig);
        }

        if (initMethodCalled) {
            return new Promise((resolve, reject) => {
                const intervalHandle = setInterval(() => {
                    if (pluginConfig != null) {
                        clearInterval(intervalHandle);
                        resolve(pluginConfig);
                    }
                }, 50);
            });
        }
        initMethodCalled = true;

        return new Promise((resolutionFunc, rejectionFunc) => {
            window.addEventListener(
                'message',
                (e) => {
                    if (e.origin !== origin) return;

                    if (!e.data || !e.data.type) return;

                    switch (e.data.type) {
                        case 'init': {
                            pluginConfig = e.data.data;
                            resolutionFunc(pluginConfig);
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
                id: 'pluginId',
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
