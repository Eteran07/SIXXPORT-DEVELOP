const express = require('express');
const router = express.Router();
const { getListaNegra, getBloqueoById, createBloqueo, updateBloqueo, deleteBloqueo } = require('../controllers/listaNegraController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getListaNegra);
router.get('/:id', verificarToken, getBloqueoById);
router.post('/', verificarToken, createBloqueo);
router.put('/:id', verificarToken, updateBloqueo);
router.delete('/:id', verificarToken, deleteBloqueo);

module.exports = router;
