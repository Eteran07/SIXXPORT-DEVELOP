const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes'); // 1. AGREGAR ESTA LÍNEA

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes); // 2. AGREGAR ESTA LÍNEA

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Sixpport Ops corriendo en el puerto ${PORT}`);
});