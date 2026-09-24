const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta GET /api/usuarios (Protegida)
router.get('/', verificarToken, getUsers);

module.exports = router;