const authRoutes = require('./auth.router');
const echoRouter = require('./echo.router');

const initRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api', echoRouter);
}

module.exports = initRoutes;