const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let initialized = false;

const initFirebase = () => {
    try {
        if (getApps().length === 0) {
            let credentialConfig;
            if (process.env.FIREBASE_CREDENTIALS) {
                credentialConfig = cert(JSON.parse(process.env.FIREBASE_CREDENTIALS));
            } else {
                const path = require('path');
                const rutaKey = path.join(process.cwd(), 'firebase-key.json');
                credentialConfig = cert(require(rutaKey));
            }
            
            initializeApp({ credential: credentialConfig });
            console.log("Firebase inicializado con éxito.");
            initialized = true;
        }
    } catch (error) {
        console.error("Fallo en la inicialización de Firebase:", error);
    }
};

const getFirebaseMessaging = () => {
    if (!initialized) {
        initFirebase();
    }
    return getMessaging();
};

module.exports = { initFirebase, getFirebaseMessaging };