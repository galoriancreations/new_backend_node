const { Router } = require("express");
const { getMessages, sendMessage } = require('../controllers/chatbot');
const auth = require('../middleware/auth');

const router = Router();

router.use(auth);

router.get("/messages", getMessages);
router.post("/message", sendMessage);

module.exports = router;
