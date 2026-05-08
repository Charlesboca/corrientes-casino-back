const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE FIREBASE
// Aquí tenés que pegar tu serviceAccountKey.json que bajás de Firebase Console
const serviceAccount = require("./path-to-your-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ENDPOINT PARA OBTENER SALDO
app.get('/api/balance/:userId', async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.params.userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).send("Usuario no encontrado");
        res.json({ balance: doc.data().balance });
    } catch (e) { res.status(500).send(e.message); }
});

// LÓGICA DE JUEGO (MVP)
app.post('/api/play', async (req, res) => {
    const { userId, betAmount } = req.body;
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const balance = userDoc.data().balance;

            if (balance < betAmount) throw "Saldo insuficiente";

            const win = Math.random() > 0.7; // 30% prob de ganar
            const prize = win ? betAmount * 2 : 0;
            const newBalance = balance - betAmount + prize;

            t.update(userRef, { balance: newBalance });
            res.json({ win, prize, newBalance });
        });
    } catch (e) { res.status(400).send(e); }
});

app.listen(3001, () => console.log("Backend corriendo en puerto 3001 fix"));