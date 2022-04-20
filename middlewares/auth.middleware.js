const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next;
    }

    try {
        const token = req.headers.authorization.split(' ')[1]; // Bearer <TOKEN>

        if (!token) {
            return res.status(401).json({ message: 'Нет авторизации' });
        }

        // should get { userId: ..., ... }
        const { userId } = jwt.verify(token, config.get('jwtSecret'));

        req.userId = userId;

        next();

    } catch (e) {
        res.status(401).json({ message: 'Нет авторизации' });
    }
}