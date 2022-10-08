const { Router } = require('express');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth.middleware');
const { isUTCZeroDateString } = require('./../utils/dates');
const { isNaturalNumber } = require('./../utils/numberValidator');
const isValidIdString = require('../utils/idValidator');
const isValidHexColorString = require('../utils/hexColorCodeValidator');

const router = Router();

// /api/tracker/tasks
router.get(
    '/tasks',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            const tasks = user.tracker.tasks;
            let populatedTasks = tasks;

            if (tasks.length && user.tracker.categories.length) {
                populatedTasks = tasks.map(({id, category, date, minutesSpent}) => {
                    const categoryToPopulate = user.tracker.categories.id(category);

                    return {
                        _id: id,
                        date,
                        minutesSpent,
                        category: categoryToPopulate ? categoryToPopulate : null
                    }
                });
            }

            res.json(populatedTasks);
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/tasksByMonths
router.get(
    '/tasksByMonths',
    authMiddleware,
    async (req, res) => {
        // require daysAmount: number = 24, year: number, month: number (counted from 0)
        const { daysAmount, year, month } = req.body;

        if (!isNaturalNumber(daysAmount)) {
            return res.status(400).json({ message: 'Некорректное количество дней' })
        }

        if (!isNaturalNumber(year)) {
            return res.status(400).json({ message: 'Некорректный год' })
        }

        if (month >= 12 || !isNaturalNumber(month)) {
            return res.status(400).json({ message: 'Некорректный месяц' })
        }

        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            const tasks = user.tracker.tasks;
            const categories = user.tracker.categories;

            // начальное значение
            // описание объекта ниже
            const result = {
                totalDays: 0,
                totalEarlierDays: 0,
                collectedDays: 0,
                months: []
            };
            /*
            * {
            *   totalDays: 123, // всего дней с хотя бы одной задачей
            *   totalEarlierDays: 89, // всего дней, начиная с последнего дня запрашиваемого месяца, в порядке к более ранним
            *   collectedDays: 30, // сколько всего дней было найдено
            *   months: [
            *       {
            *           year: 2022,
            *           month: 10,
            *           tasks: [
            *               {
            *                   ...
            *               }
            *           ]
            *       }
            *   ]
            * }
            *
            * */

            // если задач или категорий просто нет, вернуть начальное значение
            if (!tasks.length || !categories.length) {
                return res.json(result);
            }


            // timestamp даты типа <год>-<месяц>-<последний день месяца>T00:00:00.000Z; Date.UTC на всякий случай
            const startDayTimestamp = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0, 0)).getTime();

            // коллекции просто чтобы не держать массив, по которому нужно пробегаться
            // ранние дни (с последнего дня запрашиваемого месяца включительно по более ранние дни)
            const earlierDaysMap = new Set();
            // поздние дни (от первого дня месяца, следующего за запрашиваемым, включительно по более поздние)
            const laterDaysMap = new Set();

            // получить задачи с дней, начиная с последнего дня запрашиваемого месяца по более ранние,
            // и учесть ранние и поздние дни
            const earlierTasks = tasks.reduce((acc, task) => {
                if (!task || !task.date) {
                    return acc;
                }

                const taskDateTimestamp = task.date.getTime();
                if (taskDateTimestamp <= startDayTimestamp) {
                    earlierDaysMap.add(taskDateTimestamp);

                    const {id, category, date, minutesSpent} = task;

                    // найти объект категории задачи
                    const taskCategory = categories.id(task.category);

                    // заполнить объект задачи с объектом категории
                    const populatedTask = {
                        _id: id,
                        date,
                        minutesSpent,
                        category: taskCategory ?? null
                    }

                    return [
                        ...acc,
                        populatedTask
                    ];
                }

                laterDaysMap.add(taskDateTimestamp);

                return acc;
            }, []);

            let collectedDays = 0; // всего собрано дней
            let currentYearToCollect = year; // текущий год, в котором рассматриваем задачи
            let currentMonthToCollect = month; // текущеий месяц, в котором рассматриваем задачи
            while (collectedDays < daysAmount) {
                const daysCollectedCurrentMonthMap = new Set(); // коллекция timestamp'ов уже учтённых в это месяце дней

                // получить задачи в текущем месяце и учесть, сколько дней собрано в этом месяце
                const tasksToCollect = earlierTasks.reduce((acc, task) => {
                    if (!task || !task.date) {
                        return acc;
                    }

                    const taskDate = task.date;

                    if (
                        taskDate.getMonth() === currentMonthToCollect &&
                        taskDate.getFullYear() === currentYearToCollect
                    ) {
                        const currentTaskDayTimestamp = taskDate.getTime();

                        daysCollectedCurrentMonthMap.add(currentTaskDayTimestamp);

                        return [
                            ...acc,
                            task
                        ]
                    }

                    return acc;
                }, []);

                // если в этом месяце было собрано сколько-то дней, учесть это
                if (daysCollectedCurrentMonthMap.size) {
                    result.months.push({
                        month: currentMonthToCollect,
                        year: currentYearToCollect,
                        tasks: tasksToCollect,
                    });
                    collectedDays += daysCollectedCurrentMonthMap.size;
                }

                // если уже собраны всё задачи, идущие в запрашиваемом месяце и раньше,
                // или собрано необходимое количество дней, выйти из цикла и отдать, что есть
                if (collectedDays >= earlierDaysMap.size || collectedDays >= daysAmount) {
                    break;
                }

                // вычисляю следующий месяц и год (то есть более ранние) (номер дня неважен)
                const nextDate = new Date(Date.UTC(currentYearToCollect, currentMonthToCollect - 1, 1, 0, 0, 0, 0));
                currentMonthToCollect = nextDate.getMonth();
                currentYearToCollect = nextDate.getFullYear();
            }

            result.totalEarlierDays = earlierDaysMap.size;
            result.totalDays = earlierDaysMap.size + laterDaysMap.size;
            result.collectedDays = collectedDays;

            res.json(result);
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/addTask
router.post(
    '/addTask',
    authMiddleware,
    async (req, res) => {
        try {
            // required: categoryId, date, minutesSpent
            // categoryId should be 24 characters hex string
            // date should be as "2022-04-21T00:00:00.000Z" string (with zeros in time)
            const { categoryId, date, minutesSpent } = req.body;

            if (!isNaturalNumber(minutesSpent)) {
                return res.status(400).json({ message: 'Некорректное затраченное время' })
            }

            if (!isUTCZeroDateString(date)) {
                return res.status(400).json({ message: "Некорректная дата" })
            }

            if(!isValidIdString(categoryId)) {
                return res.status(400).json({ message: 'Некорректный id категории' })
            }

            const user = await User.findOne({ _id: req.userId });;

            const existingCategory = user.tracker.categories.id(categoryId);
            if (!existingCategory) {
                return res.status(404).json({ message: 'Категория по заданному id не найдена' })
            }

            // if there is equalTask (with same date and category)...
            const equalTask = user.tracker.tasks.find((task) =>
                task.date.valueOf() === new Date(date).valueOf()
                && String(task.category) === categoryId);

            // ...add received minutes to it
            if (equalTask) {
                equalTask.minutesSpent += minutesSpent;
                await user.save();

                return res.json({
                    _id: equalTask.id,
                    date: equalTask.date,
                    minutesSpent: equalTask.minutesSpent,
                    category: existingCategory
                });
            }

            const toPush = {
                category: categoryId,
                date,
                minutesSpent
            };

            user.tracker.tasks.push(toPush);

            await user.save();

            const created = user.tracker.tasks[user.tracker.tasks.length - 1];

            res.json({
                _id: created.id,
                date: created.date,
                minutesSpent: created.minutesSpent,
                category: existingCategory
            });
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/deleteTask
router.post(
    '/deleteTask',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id задачи' })
            }

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.tracker.tasks.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Задача по указанному id не найдена' });
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

// /api/tracker/editTask
router.post(
    '/editTask',
    authMiddleware,
    async (req, res) => {
        try {
            // required: toEditId
            // date should be as "2022-04-21T16:00:00.000Z" string, with zeros and Z at the end
            // minutesSpent should be natural
            const {
                toEditId,
                categoryId,
                date,
                minutesSpent
            } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id задачи' })
            }

            if (categoryId !== undefined && !isValidIdString(categoryId)) {
                return res.status(400).json({ message: 'Некорректный id категории' })
            }

            if (minutesSpent !== undefined && !isNaturalNumber(minutesSpent)) {
                return res.status(400).json({ message: 'Некорректное затраченное время' })
            }

            if (date !== undefined && !isUTCZeroDateString(date)) {
                return res.status(400).json({ message: "Некорректная дата" })
            }

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.tracker.tasks.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Задача по указанному id не найдена' });
            }

            let categoryObj;
            if (categoryId) {
                categoryObj = user.tracker.categories.id(categoryId);

                if (!categoryObj) {
                    return res.status(404).json({ message: "Категория по указанному id не была найдена" })
                }
            } else {
                categoryObj = user.tracker.categories.id(toEdit.category)
            }

            const equalTask = user.tracker.tasks.find(
                (task) =>
                    task.date.valueOf() === (date ? new Date(date) : toEdit.date).valueOf()
                    && String(task.category) === (categoryId ? categoryId : String(toEdit.category))
                    && task.id !== toEdit.id
            );

            if (equalTask) {
                return res.status(409).json({ message: "Уже существует задача с аналогичными датой и категорией" })
            }

            toEdit.date = date ? new Date(date) : toEdit.date;
            toEdit.minutesSpent = minutesSpent ? minutesSpent : toEdit.minutesSpent;
            toEdit.category = categoryId ? categoryId : toEdit.category;

            const response = {
                _id: toEditId,
                date: toEdit.date,
                minutesSpent: toEdit.minutesSpent,
                category: categoryObj,
            };

            await user.save();

            res.json(response);
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/categories
router.get(
    '/categories',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            const categories = user.tracker.categories;

            res.json(categories);
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/createCategory
router.post(
    '/createCategory',
    authMiddleware,
    async (req, res) => {
        try {
            // required: name, color
            // color should be #123ABC | #123abc | #F1E | #f1e string
            const { name, color } = req.body;

            if (!isValidHexColorString(color)) {
                return res.status(400).json({ message: 'Некорректный HEX-код цвета' })
            }

            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Некорректное значение имени категории' })
            }

            const trimmedName = name.trim();

            const user = await User.findOne({ _id: req.userId });

            if (user.tracker.categories.find(
                (category) => category.name === trimmedName
            )) {
                return res.status(409).json({ message: 'Уже существует категория с таким именем' })
            }

            const toPush = {
                name: trimmedName,
                color,
            };

            user.tracker.categories.push(toPush);

            await user.save();

            const created = user.tracker.categories[user.tracker.categories.length - 1];

            res.json({
                _id: created.id,
                name: created.name,
                color: created.color,
            });
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/deleteCategory
router.post(
    '/deleteCategory',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id категории' })
            }

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.tracker.categories.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Категория по указанному id не найдена' });
            }

            const tasksWithCategory = user.tracker.tasks.filter(
                ({category}) => category == toDeleteId // without type comparing because of ObjectId
            );

            if (tasksWithCategory.length) {
                tasksWithCategory.forEach(task => task.remove());
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

// /api/tracker/editCategory
router.post(
    '/editCategory',
    authMiddleware,
    async (req, res) => {
        try {
            // required: toEditId
            // date should be as "2022-04-21T16:00:00.000Z" string
            // color should be #123ABC | #123abc | #F1E | #f1e string
            const {
                toEditId,
                name,
                color,
                isArchived,
            } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id категории' })
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное значение имени категории' })
            }

            if (color !== undefined && !isValidHexColorString(color)) {
                return res.status(400).json({ message: 'Некорректный HEX-код цвета' })
            }

            if (isArchived !== undefined && typeof isArchived !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное значение поля isArchived' })
            }

            const trimmedName = name ? name.trim() : undefined;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.tracker.categories.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Задача по указанному id не найдена' });
            }

            if (trimmedName !== undefined && trimmedName !== toEdit.name) {
                if (user.tracker.categories.find(
                    (category) => category.name === trimmedName
                )) {
                    return res.status(409).json({ message: 'Уже существует категория с таким именем' })
                }
            }

            toEdit.name = trimmedName ? trimmedName : toEdit.name;
            toEdit.color = color ? color : toEdit.color;
            toEdit.isArchived = isArchived !== undefined ? isArchived : toEdit.isArchived;

            const response = {
                _id: toEditId,
                name: toEdit.name,
                color: toEdit.color,
                isArchived: toEdit.isArchived,
            };

            await user.save();

            res.json(response);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/tracker/reset
router.post(
    '/reset',
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.userId });

            user.tracker.categories = [];
            user.tracker.tasks = [];

            await user.save();

            res.status(200).json({ message: "Вы öбнулились" });
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

module.exports = router;