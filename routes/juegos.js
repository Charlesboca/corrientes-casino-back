const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Endpoint: POST /api/juegos/apostar-slot
router.post('/apostar-slot', async (req, res) => {
    const { userId, betAmount } = req.body;
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            
            if (!userDoc.exists) throw new Error("Usuario no encontrado");
            
            const currentBalance = userDoc.data().balance;

            if (currentBalance < betAmount) {
                throw new Error("Saldo insuficiente");
            }

            // Lógica del juego: 20% de probabilidad de ganar
            const win = Math.random() > 0.8;
            const multiplier = 3; // Paga el triple
            const prize = win ? (betAmount * multiplier) : 0;
            
            const newBalance = currentBalance - betAmount + prize;

            // Actualizamos la base de datos
            t.update(userRef, { balance: newBalance });

            res.json({ 
                success: true, 
                win, 
                prize, 
                newBalance 
            });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;