const { Router } = require('express');

const router = Router();

// /api/echo
router.get(
    '/echo',
    (req, res) => {
        try {
            res.json(req.query);
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'});
        }
    });

module.exports = router;