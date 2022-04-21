const { Router } = require('express');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// /api/pomodoro/pomodoros
router.get(
    '/pomodoros',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            res.json(user.pomodoros);
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/createPlanned
router.post(
    '/createPlanned',
    authMiddleware,
    async (req, res) => {
        try {
            const { name, pomodorosAmount } = req.body;

            const toPush = {
                name,
                pomodorosAmount
            };

            const user = await User.findOne({ _id: req.userId });

            user.pomodoros.plan.push(toPush);

            await user.save();

            res.json(toPush);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/markDone
router.post(
    '/markDone',
    authMiddleware,
    async (req, res) => {
        try {
            // date should be as "2022-04-21T16:00:00.000Z" string
            const { plannedId, minutesSpent, startTime, endTime } = req.body;

            const user = await User.findOne({ _id: req.userId });

            const toProcess = user.pomodoros.plan.id(plannedId);

            if (!toProcess) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            if (toProcess.pomodorosAmount === 1) {
                toProcess.remove();
            }
            else {
                toProcess.pomodorosAmount--;
            }

            const toPush = {
                name: toProcess.name,
                minutesSpent,
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            }

            user.pomodoros.done.push(toPush);

            await user.save();

            res.json(toPush);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/deleteDone
router.post(
    '/deleteDone',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.pomodoros.done.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            toDelete.remove();

            await user.save();

            res.json(toDelete);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/deletePlanned
router.post(
    '/deletePlanned',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            const user = await User.findOne({ _id: req.userId });

            const toProcess = user.pomodoros.plan.id(toDeleteId);

            if (!toProcess) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            if (toProcess.pomodorosAmount === 1) {
                toProcess.remove()
                await user.save();
                return res.json(null)
            }
            else {
                toProcess.pomodorosAmount--;
                await user.save();
                return res.json(toProcess);
            }
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/editDone
router.post(
    '/editDone',
    authMiddleware,
    async (req, res) => {
        try {
            // date should be as "2022-04-21T16:00:00.000Z" string
            const { toEditId, name, minutesSpent, startTime, endTime } = req.body;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.pomodoros.done.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            toEdit.name = name ? name : toEdit.name;
            toEdit.minutesSpent = minutesSpent ? minutesSpent : toEdit.minutesSpent;
            toEdit.startTime = startTime ? new Date(startTime) : toEdit.startTime;
            toEdit.endTime = startTime ? new Date(endTime) : toEdit.endTime;

            await user.save();

            res.json(toEdit);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/editPlanned
router.post(
    '/editPlanned',
    authMiddleware,
    async (req, res) => {
        try {
            // date should be as "2022-04-21T16:00:00.000Z" string
            const { toEditId, name, pomodorosAmount } = req.body;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.pomodoros.plan.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            toEdit.name = name ? name : toEdit.name;
            toEdit.pomodorosAmount = pomodorosAmount ? pomodorosAmount : toEdit.pomodorosAmount;

            await user.save();

            res.json(toEdit);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

module.exports = router;