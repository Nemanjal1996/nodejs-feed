const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');
const Auth = require('../middleware/auth');

router.get('/status', Auth, userController.getUserStatus)
router.put('/status', Auth, userController.updateUserStatus)

module.exports = router;
