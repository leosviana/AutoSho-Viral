const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const caminho = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, 'serviceAccountKey-firebase.json'));
const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://autosho-viral-default-rtdb.firebaseio.com';
let db = null;
let realtimeDb = null;

if (fs.existsSync(caminho)) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(caminho)),
      databaseURL: databaseUrl,
    });
  }
  db = admin.firestore();
  realtimeDb = admin.database();
} else {
  console.warn(`Firebase não configurado: arquivo de credenciais não encontrado em ${caminho}. Firestore e Realtime Database ficarão indisponíveis.`);
}

module.exports = { db, realtimeDb, databaseUrl };
