const express = require('express');
const router = express.Router();
const { getVehiculos, getVehiculoById, createVehiculo, updateVehiculo, deleteVehiculo } = require('../controllers/vehiculosController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getVehiculos);
router.get('/:id', verificarToken, getVehiculoById);
router.post('/', verificarToken, createVehiculo);
router.put('/:id', verificarToken, updateVehiculo);
router.delete('/:id', verificarToken, deleteVehiculo);

module.exports = router;
