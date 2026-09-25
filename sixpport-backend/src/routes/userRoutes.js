const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, changePassword, deleteUser } = require('../controllers/userController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta GET /api/usuarios (Protegida)
router.get('/', verificarToken, getUsers);

// Ruta GET /api/usuarios/:id (Protegida)
router.get('/:id', verificarToken, getUserById);

// Ruta POST /api/usuarios (Protegida)
router.post('/', verificarToken, createUser);

// Ruta PUT /api/usuarios/:id (Protegida)
router.put('/:id', verificarToken, updateUser);

// Ruta PATCH /api/usuarios/:id/password (Protegida)
router.patch('/:id/password', verificarToken, changePassword);

// Ruta DELETE /api/usuarios/:id (Protegida)
// Query ?permanente=true para borrado físico, por defecto inactiva
router.delete('/:id', verificarToken, deleteUser);

module.exports = router;
