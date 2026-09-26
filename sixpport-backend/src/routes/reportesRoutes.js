const express = require('express');
const router = express.Router();
const { getDashboard, getReportes, createReporte, downloadReporte } = require('../controllers/reportesController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/dashboard', verificarToken, getDashboard);
router.get('/', verificarToken, getReportes);
router.post('/', verificarToken, createReporte);
router.get('/:id/download', verificarToken, downloadReporte);

module.exports = router;
