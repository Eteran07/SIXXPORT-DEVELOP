const express = require('express');
const router = express.Router();
const { getConductores, getConductorById, createConductor, updateConductor, deleteConductor } = require('../controllers/conductoresController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getConductores);
router.get('/:id', verificarToken, getConductorById);
router.post('/', verificarToken, createConductor);
router.put('/:id', verificarToken, updateConductor);
router.delete('/:id', verificarToken, deleteConductor);

module.exports = router;
