const { Router } = require('express');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth.middleware');
const { isNaturalNumber } = require('./../utils/numberValidator');
const isValidIdString = require('../utils/idValidator');
const { isUTCDateString } = require('../utils/dateValidators');

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
            // required: name, pomodorosAmount
            const { name, pomodorosAmount } = req.body;

            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Некорректное имя помидора' })
            }

            if (!isNaturalNumber(pomodorosAmount)) {
                return res.status(400).json({ message: 'Некорректное количество помидоров' })
            }

            const trimmedName = name.trim();

            const toPush = {
                name: trimmedName,
                pomodorosAmount
            };

            const user = await User.findOne({ _id: req.userId });

            user.pomodoros.plan.push(toPush);

            await user.save();

            const created = user.pomodoros.plan[user.pomodoros.plan.length - 1];

            res.json({
                _id: created.id,
                name: created.name,
                pomodorosAmount: created.pomodorosAmount,
            });
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
            // date should be as "2022-04-21T16:31:32.325Z" | "2022-04-21T16:31:32.325" | "2022-04-21T16:31:32" string
            // all required
            const { plannedId, minutesSpent, startTime, endTime } = req.body;

            if (!isValidIdString(plannedId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

            if (!isNaturalNumber(minutesSpent)) {
                return res.status(400).json({ message: 'Некорректное затраченное время' })
            }

            if (!isUTCDateString(startTime)) {
                return res.status(400).json({ message: 'Некорректное значение времени начала выполнения' })
            }

            if (!isUTCDateString(endTime)) {
                return res.status(400).json({ message: 'Некорректное значение времени конца выполнения' })
            }

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

            const created = user.pomodoros.done[user.pomodoros.done.length - 1];

            res.json({
                _id: created.id,
                name: created.name,
                minutesSpent: created.minutesSpent,
                startTime: created.startTime,
                endTime: created.endTime,
            });
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

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

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

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

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

// /api/pomodoro/deleteAllPlanned
router.post(
    '/deleteAllPlanned',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.pomodoros.plan.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Помидоры по указанному id не найдены' });
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

// /api/pomodoro/editDone
router.post(
    '/editDone',
    authMiddleware,
    async (req, res) => {
        try {
            // date should be as "2022-04-21T16:31:32.325Z" | "2022-04-21T16:31:32.325" | "2022-04-21T16:31:32" string
            // required: toEditId
            const { toEditId, name, minutesSpent, startTime, endTime } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное имя помидора' })
            }

            if (minutesSpent !== undefined && !isNaturalNumber(minutesSpent)) {
                return res.status(400).json({ message: 'Некорректное затраченное время' })
            }

            if (startTime !== undefined && !isUTCDateString(startTime)) {
                return res.status(400).json({ message: 'Некорректное значение времени начала выполнения' })
            }

            if (endTime !== undefined && !isUTCDateString(endTime)) {
                return res.status(400).json({ message: 'Некорректное значение времени конца выполнения' })
            }

            const trimmedName = name ? name.trim() : undefined;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.pomodoros.done.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            toEdit.name = trimmedName ? trimmedName : toEdit.name;
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
            // required: toEditId
            const { toEditId, name, pomodorosAmount } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id помидора' })
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное имя помидора' })
            }

            if (pomodorosAmount !== undefined && !isNaturalNumber(pomodorosAmount)) {
                return res.status(400).json({ message: 'Некорректное количество помидоров' })
            }

            const trimmedName = name ? name.trim() : undefined;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.pomodoros.plan.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Помидор по указанному id не найден' });
            }

            toEdit.name = trimmedName ? trimmedName : toEdit.name;
            toEdit.pomodorosAmount = pomodorosAmount ? pomodorosAmount : toEdit.pomodorosAmount;

            await user.save();

            res.json(toEdit);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/pomodoro/reset
router.post(
    '/reset',
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.userId });

            user.pomodoros.plan = [];
            user.pomodoros.done = [];

            await user.save();

            res.status(200).json({ message: "Вы öбнулились" });
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

module.exports = router;