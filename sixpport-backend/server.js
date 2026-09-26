const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const rolesRoutes = require('./src/routes/rolesRoutes');
const listaNegraRoutes = require('./src/routes/listaNegraRoutes');
const vehiculosRoutes = require('./src/routes/vehiculosRoutes');
const conductoresRoutes = require('./src/routes/conductoresRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/lista-negra', listaNegraRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/reportes', reportesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Sixpport Ops corriendo en el puerto ${PORT}`);
});
