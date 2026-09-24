const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

// ¡ESTA LÍNEA ES LA QUE SUELE FALTAR!
module.exports = router;