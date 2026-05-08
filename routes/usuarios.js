const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// --- HELPER PARA VALIDAR APUESTA ---
const validarApuesta = (apuesta) => {
    const monto = Number(apuesta);
    return (!isNaN(monto) && monto > 0) ? monto : null;
};

// 1. CARACRUZ
router.post('/caracruz', async (req, res) => {
    const { usuario, apuesta, tipoJuego, eleccion } = req.body;
    const montoApuesta = validarApuesta(apuesta);

    if (!usuario || montoApuesta === null) 
        return res.status(400).json({ error: "Datos o apuesta inválidos" });

    const db = admin.firestore();
    const userRef = db.collection('usuarios').doc(usuario);

    try {
        let resultadoFinal = null;
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("El usuario no existe");

            const saldoActual = Number(userDoc.data().saldo) || 0;
            if (saldoActual < montoApuesta) throw new Error("Saldo insuficiente");

            // Lógica: 50/50 o probabilidad ajustada
            const opciones = ['cara', 'cruz'];
            const resultadoAzar = opciones[Math.floor(Math.random() * 2)];
            let gano = (tipoJuego === 'cara_cruz') 
                ? (eleccion === resultadoAzar) 
                : Math.random() > 0.7; // Modo alternativo

            const premio = gano ? montoApuesta * 2 : 0;
            const nuevoSaldo = saldoActual - montoApuesta + premio;

            t.update(userRef, { saldo: nuevoSaldo });
            resultadoFinal = { gano, premio, nuevoSaldo, mensaje: gano ? "¡Ganaste!" : "Perdiste" };
        });
        return res.json(resultadoFinal);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

// 2. RULETA (REFORMULADA CON TRANSACCIÓN)
router.post('/ruleta', async (req, res) => {
    const { usuario, tipo, valor } = req.body;
    const apuesta = validarApuesta(req.body.monto || req.body.apuesta);

    if (!usuario || apuesta === null) 
        return res.status(400).json({ error: "Datos de apuesta inválidos" });

    const db = admin.firestore();
    const userRef = db.collection('usuarios').doc(usuario);

    try {
        let resultadoFinal = null;
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("Usuario no existe");

            const saldoActual = Number(doc.data().saldo) || 0;
            if (saldoActual < apuesta) throw new Error("Saldo insuficiente");

            const numeroSalio = Math.floor(Math.random() * 37);
            const esRojo = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(numeroSalio);
            const esPar = numeroSalio !== 0 && numeroSalio % 2 === 0;

            let gano = false;
            if (tipo === 'color') {
                if (valor === 'rojo' && esRojo) gano = true;
                if (valor === 'negro' && !esRojo && numeroSalio !== 0) gano = true;
            } else if (tipo === 'paridad') {
                if (valor === 'par' && esPar) gano = true;
                if (valor === 'impar' && !esPar && numeroSalio !== 0) gano = true;
            }

            const premio = gano ? apuesta * 2 : 0;
            const nuevoSaldo = saldoActual - apuesta + premio;

            t.update(userRef, { saldo: nuevoSaldo });
            resultadoFinal = { gano, numeroSalio, nuevoSaldo, premio };
        });
        return res.json(resultadoFinal);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

// 3. SLOT (REFORMULADA CON TRANSACCIÓN)
router.post('/slot', async (req, res) => {
    const { usuario } = req.body;
    const apuesta = validarApuesta(req.body.apuesta);

    if (!usuario || apuesta === null) 
        return res.status(400).json({ error: "Apuesta inválida" });

    const db = admin.firestore();
    const userRef = db.collection('usuarios').doc(usuario);

    try {
        let resultadoFinal = null;
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("Usuario no existe");

            const saldoActual = Number(doc.data().saldo) || 0;
            if (saldoActual < apuesta) throw new Error("Saldo insuficiente");

            const simbolos = ['🍒', '🔔', '💎'];
            const resultado = [
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)]
            ];

            let multiplicador = 0;
            if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                multiplicador = 10;
            } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
                multiplicador = 2;
            }

            const premio = apuesta * multiplicador;
            const nuevoSaldo = saldoActual - apuesta + premio;

            t.update(userRef, { saldo: nuevoSaldo });
            resultadoFinal = { resultado, multiplicador, nuevoSaldo, premio };
        });
        return res.json(resultadoFinal);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

// 4. OBTENER DATOS (GET)
router.get('/:username', async (req, res) => {
    try {
        const db = admin.firestore();
        const doc = await db.collection('usuarios').doc(req.params.username).get();
        if (!doc.exists) return res.status(404).json({ error: "Usuario no encontrado" });
        
        const { clave, ...datosSeguros } = doc.data();
        return res.json(datosSeguros);
    } catch (e) {
        return res.status(500).json({ error: "Error interno" });
    }
});

module.exports = router;