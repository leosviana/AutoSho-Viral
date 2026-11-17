const path = require('path');
const admin = require('firebase-admin');

const caminho = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(caminho)) });
}

const db = admin.firestore();

module.exports = { db };
