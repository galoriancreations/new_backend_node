const { Router } = require("express");
const { getMessages, sendMessage } = require('../controllers/chatbot');

const router = Router();

router.get("/messages", getMessages);
router.post("/message", sendMessage);

module.exports = router;
