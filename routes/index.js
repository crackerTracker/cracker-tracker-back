const authRoutes = require('./auth.router');
const pomodoroRouter = require('./pomodoro.router');
const echoRouter = require('./echo.router');

const initRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/pomodoro', pomodoroRouter);
    app.use('/api', echoRouter);
}

module.exports = initRoutes;