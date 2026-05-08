require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

app.use(cors());
app.use(express.json());

// 1. INICIALIZACIÓN DE FIREBASE
if (!admin.apps.length) {
    try {
        // Validamos que las variables existan para que no crashee
        if (!process.env.FIREBASE_PRIVATE_KEY) {
            throw new Error("Falta la variable FIREBASE_PRIVATE_KEY");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // El replace es clave para las claves privadas de Firebase en Vercel
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
        console.log("🔥 Firebase conectado con éxito");
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error.message);
    }
}

// 2. IMPORTACIÓN DE RUTAS
const juegosRoutes = require('../routes/juegos');
const usuariosRoutes = require('../routes/usuarios');

// 3. RUTAS DE LA API
app.use('/api/juegos', juegosRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
    res.send('Servidor del Casino funcionando correctamente 🚀');
});

// Vercel maneja el puerto, por eso exportamos el app
module.exports = app;

// Solo para desarrollo local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor local corriendo en http://localhost:${PORT}`);
    });
}