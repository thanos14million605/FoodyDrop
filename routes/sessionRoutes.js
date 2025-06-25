const express = require('express');
const { protectRoute } = require('./../middlewares/protectRoute');
const sessionController = require('./../controllers/sessionController');

const router = express.Router();

router.use(protectRoute);

router.get(
    '/devices', 
    sessionController.getAllActiveSessions
);

router.get(
    '/devices/:id', 
    sessionController.getSession
);

router.delete(
    '/revoke-session/:id', 
    sessionController.revokeSession
);

router.delete(
    '/revoke-all-sessions',
    sessionController.revokeAllSessions
);

module.exports = router;