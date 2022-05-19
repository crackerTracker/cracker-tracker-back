const { Router } = require('express');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth.middleware');
const { isUTCEdgeDateString } = require('../utils/dateValidators');
const isValidIdString = require('../utils/idValidator');

const router = Router();

// /api/todo/todos
router.get(
    '/todos',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            const todos = user.todoSection.todos;
            let populatedTodos = todos;

            if (todos.length && user.todoSection.groups.length) {
                populatedTodos = todos.map(({id, name, done, deadline, note, isImportant, group, today, subTodos}) => {
                    const groupToPopulate = user.todoSection.groups.id(group);

                    return {
                        _id: id,
                        name,
                        done,
                        deadline,
                        note,
                        isImportant,
                        today,
                        group: groupToPopulate ? groupToPopulate : null,
                        subTodos: subTodos ? subTodos : [],
                    }
                });
            }

            res.json(populatedTodos);
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/createTodo
router.post(
    '/createTodo',
    authMiddleware,
    async (req, res) => {
        try {
            // required: name
            // groupId should be 24 characters hex string or null
            // deadline should be as "2017-06-01T23:59:59.999Z" string or null
            // if subTodos is passed, it should be array of subTodo objects, in a subTodo object name is required
            const { name, done, deadline, note, isImportant, groupId, today, subTodos } = req.body;

            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Некорректное имя todo' })
            }

            if (done !== undefined && typeof done !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное значение done' })
            }

            if (deadline !== undefined && deadline !== null && !isUTCEdgeDateString(deadline)) {
                return res.status(400).json({ message: 'Некорректное значение deadline' })
            }

            if (note !== undefined && (typeof note !== 'string' || note.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное поле note' })
            }

            if (isImportant !== undefined && typeof isImportant !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное поле isImportant' })
            }

            if (groupId !== undefined && groupId !== null && !isValidIdString(groupId)) {
                return res.status(400).json({ message: 'Некорректный id группы' })
            }

            if (today !== undefined && typeof today !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное поле today' })
            }

            if (subTodos !== undefined && !Array.isArray(subTodos)) {
                return res.status(400).json({ message: 'subTodos не является массивом' })
            }

            if (subTodos !== undefined) {
                for (let i = 0; i < subTodos.length; i++) {
                    const subTodo = subTodos[i];
                    const fields = Object.keys(subTodos[i]);

                    if (fields.length === 2) {
                        if (
                            !fields.includes('name')
                            || !fields.includes('done')
                            || typeof subTodo.name !== 'string'
                            || subTodo.name.trim() === ''
                            || typeof subTodo.done !== 'boolean'
                        ) {
                            return res.status(400).json({ message: 'Некорректные значения subTodo' });
                        }
                    }
                    else if (fields.length === 1) {
                        if (
                            !fields.includes('name')
                            || typeof subTodo.name !== 'string'
                            || subTodo.name.trim() === ''
                        ) {
                            return res.status(400).json({ message: 'Некорректные значения subTodo' });
                        }
                    }
                    else {
                        return res.status(400).json({ message: 'Некорректные значения subTodo' });
                    }

                    subTodos[i].name = subTodos[i].name.trim();
                }
            }

            const user = await User.findOne({ _id: req.userId });;

            let existingGroup = null;
            if (groupId) {
                existingGroup = user.todoSection.groups.id(groupId);

                if (!existingGroup) {
                    return res.status(404).json({ message: 'Группа по заданному id не найдена' })
                }
            }

            const toPush = {
                name: name.trim(),
                done,
                deadline,
                note: note ? note.trim() : undefined,
                isImportant,
                group: groupId,
                today,
                subTodos,
            };

            user.todoSection.todos.push(toPush);

            await user.save();

            const created = user.todoSection.todos[user.todoSection.todos.length - 1];

            res.json({
                _id: created.id,
                name: created.name,
                done: created.done,
                deadline: created.deadline,
                note: created.note,
                isImportant: created.isImportant,
                today: created.today,
                group: existingGroup, // object or null
                subTodos: created.subTodos ? created.subTodos : [],
            });
        }
        catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/deleteTodo
router.post(
    '/deleteTodo',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id todo' })
            }

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.todoSection.todos.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Todo по указанному id не найден' });
            }

            // to populate field if subTodos is undefined
            toDelete.subTodos = toDelete.subTodos ? toDelete.subTodos : [];

            toDelete.remove();

            await user.save();

            res.json(toDelete);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/editTodo
router.post(
    '/editTodo',
    authMiddleware,
    async (req, res) => {
        try {
            // required: toEditId
            // date should be as "2022-04-21T23:59:59.999Z" string or null
            // groupId should be 24 characters hex string or null
            // if subTodos is passed, it should be array of subTodo objects, in a subTodo object name is required
            const {
                toEditId,
                name,
                done,
                deadline,
                note,
                isImportant,
                today,
                groupId,
                subTodos
            } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id todo' })
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное имя todo' })
            }

            if (done !== undefined && typeof done !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное значение done' })
            }

            if (deadline !== undefined && deadline !== null && !isUTCEdgeDateString(deadline)) {
                return res.status(400).json({ message: 'Некорректное значение deadline' })
            }

            if (note !== undefined && (typeof note !== 'string' || note.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное поле note' })
            }

            if (isImportant !== undefined && typeof isImportant !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное поле isImportant' })
            }

            if (groupId !== undefined && groupId !== null && !isValidIdString(groupId)) {
                return res.status(400).json({ message: 'Некорректный id группы' })
            }

            if (today !== undefined && typeof today !== 'boolean') {
                return res.status(400).json({ message: 'Некорректное поле today' })
            }

            // todo разрабраться с тем, что айди передавать не надо и таким образом создаются новые сабтуду, а не изменяются новые
            if (subTodos !== undefined && !Array.isArray(subTodos)) {
                return res.status(400).json({ message: 'subTodos не является массивом' })
            }

            if (subTodos !== undefined) {
                for (let i = 0; i < subTodos.length; i++) {
                    const subTodo = subTodos[i];
                    const fields = Object.keys(subTodos[i]);

                    if (fields.length === 2) {
                        if (
                            !fields.includes('name')
                            || !fields.includes('done')
                            || typeof subTodo.name !== 'string'
                            || subTodo.name.trim() === ''
                            || typeof subTodo.done !== 'boolean'
                        ) {
                            return res.status(400).json({ message: 'Некорректные значения subTodo' });
                        }
                    }
                    else if (fields.length === 1) {
                        if (
                            !fields.includes('name')
                            || typeof subTodo.name !== 'string'
                            || subTodo.name.trim() === ''
                        ) {
                            return res.status(400).json({ message: 'Некорректные значения subTodo' });
                        }
                    }
                    else {
                        return res.status(400).json({ message: 'Некорректные значения subTodo' });
                    }

                    subTodos[i].name = subTodos[i].name.trim();
                }
            }

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.todoSection.todos.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Todo по указанному id не найден' });
            }

            let groupObj;
            if (groupId) {
                groupObj = user.todoSection.groups.id(groupId);

                if (!groupObj) {
                    return res.status(404).json({ message: "Группа по указанному id не была найдена" })
                }
            }
            else if (groupId !== null) {
                groupObj = user.todoSection.groups.id(toEdit.group); // object or null
            }
            else {
                groupObj = null;
            }

            toEdit.name = name ? name.trim() : toEdit.name;
            toEdit.done = done !== undefined ? done : toEdit.done;
            toEdit.deadline = deadline !== undefined ? (deadline === null ? null : new Date(deadline)) : toEdit.deadline;
            toEdit.note = note ? note.trim() : toEdit.note;
            toEdit.isImportant = isImportant !== undefined ? isImportant : toEdit.isImportant;
            toEdit.today = today !== undefined ? today : toEdit.today;
            toEdit.group = groupId || (groupId === null) ? groupId : toEdit.group;
            toEdit.subTodos = subTodos ? subTodos : toEdit.subTodos;

            const response = {
                _id: toEditId,
                name: toEdit.name,
                done: toEdit.done,
                deadline: toEdit.deadline,
                note: toEdit.note,
                isImportant: toEdit.isImportant,
                today: toEdit.today,
                group: groupObj,
                subTodos: toEdit.subTodos ? toEdit.subTodos : [],
            };

            await user.save();

            res.json(response);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/groups
router.get(
    '/groups',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findOne({ _id: userId });

            res.json(user.todoSection.groups);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/createGroup
router.post(
    '/createGroup',
    authMiddleware,
    async (req, res) => {
        try {
            const { name } = req.body;

            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Некорректное имя группы' })
            }

            const trimmedName = name.trim();

            const toPush = {
                name: trimmedName,
            };

            const user = await User.findOne({ _id: req.userId });

            if (user.todoSection.groups.find(
                (group) => group.name === trimmedName
            )) {
                return res.status(409).json({ message: 'Уже существует группа с таким именем' })
            }

            user.todoSection.groups.push(toPush);

            await user.save();

            res.json(user.todoSection.groups[user.todoSection.groups.length - 1]);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/deleteGroup
router.post(
    '/deleteGroup',
    authMiddleware,
    async (req, res) => {
        try {
            const { toDeleteId } = req.body;

            if (!isValidIdString(toDeleteId)) {
                return res.status(400).json({ message: 'Некорректный id группы' })
            }

            const user = await User.findOne({ _id: req.userId });

            const toDelete = user.todoSection.groups.id(toDeleteId);

            if (!toDelete) {
                return res.status(404).json({ message: 'Группа по указанному id не найдена' });
            }

            const todosInGroup = user.todoSection.todos.filter(
                ({group}) => group == toDeleteId // without type comparing because of ObjectId
            );

            if (todosInGroup.length) {
                todosInGroup.forEach(todo => todo.group = null);
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

// /api/todo/editGroup
router.post(
    '/editGroup',
    authMiddleware,
    async (req, res) => {
        try {
            // required: toEditId
            const { toEditId, name } = req.body;

            if (!isValidIdString(toEditId)) {
                return res.status(400).json({ message: 'Некорректный id группы' })
            }

            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                return res.status(400).json({ message: 'Некорректное имя группы' })
            }

            const trimmedName = name ? name.trim() : undefined;

            const user = await User.findOne({ _id: req.userId });

            const toEdit = user.todoSection.groups.id(toEditId);

            if (!toEdit) {
                return res.status(404).json({ message: 'Группа по указанному id не найдена' });
            }

            if (trimmedName) {
                if (user.todoSection.groups.find(
                    (group) =>
                        group.name === trimmedName
                        && group.id !== toEdit.id
                )) {
                    return res.status(409).json({ message: 'Уже существует группа с таким именем' })
                }
            }

            toEdit.name = trimmedName ? trimmedName : toEdit.name;

            await user.save();

            res.json(toEdit);
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

// /api/todo/reset
router.post(
    '/reset',
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.userId });

            user.todoSection.todos = [];
            user.todoSection.groups = [];

            await user.save();

            res.status(200).json({ message: "Вы öбнулились" });
        }
        catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    }
);

module.exports = router;