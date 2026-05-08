require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. INICIALIZACIÓN DE FIREBASE (Configuración única)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Reemplaza los saltos de línea para que funcione en cualquier entorno
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
    console.log("🔥 Firebase conectado con éxito");
}

// 2. IMPORTACIÓN DE RUTAS
// Las importamos después de inicializar Firebase para evitar errores de conexión
const juegosRoutes = require('../routes/juegos');
const usuariosRoutes = require('../routes/usuarios');

// 3. RUTAS DE LA API
app.use('/api/juegos', juegosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de prueba para saber si el backend responde
app.get('/', (req, res) => {
    res.send('Servidor del Casino funcionando correctamente 🚀');
});

// 4. DETERMINAR SI ES LOCAL O PRODUCCIÓN
// Vercel no necesita el app.listen(), pero tu PC sí.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor local corriendo en http://localhost:${PORT}`);
    });
}

// Exportamos para que Vercel pueda manejar el servidor
module.exports = app;