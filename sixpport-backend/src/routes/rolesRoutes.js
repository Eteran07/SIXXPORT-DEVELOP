const express = require('express');
const router = express.Router();
const { getRoles, getRolById, createRol, updateRol, deleteRol } = require('../controllers/rolesController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getRoles);
router.get('/:id', verificarToken, getRolById);
router.post('/', verificarToken, createRol);
router.put('/:id', verificarToken, updateRol);
router.delete('/:id', verificarToken, deleteRol);

module.exports = router;
