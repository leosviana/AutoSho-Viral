const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const caminho = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json');
let db = null;

if (fs.existsSync(caminho)) {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(require(caminho)) });
  }
  db = admin.firestore();
} else {
  console.warn(`Firebase não configurado: arquivo de credenciais não encontrado em ${caminho}. O catálogo ficará indisponível.`);
}

module.exports = { db };
