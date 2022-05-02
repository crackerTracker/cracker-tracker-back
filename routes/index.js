const authRoutes = require('./auth.router');
const pomodoroRouter = require('./pomodoro.router');
const todoRouter = require('./todo.router');
const trackerRouter = require('./tracker.router');
const echoRouter = require('./echo.router');

const initRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/pomodoro', pomodoroRouter);
    app.use('/api/todo', todoRouter);
    app.use('/api/tracker', trackerRouter);
    app.use('/api', echoRouter);
}

module.exports = initRoutes;