const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // El token debe venir en los headers bajo la clave "Authorization"
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        // Separar la palabra "Bearer" del token en sí
        const tokenLimpio = authHeader.split(' ')[1];
        
        // Verificar usando el secreto de tu archivo .env
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // Guardar los datos desencriptados en la request
        req.usuario = verificado; 
        next(); // El token es válido, continúa a la ruta solicitada
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = { verificarToken };