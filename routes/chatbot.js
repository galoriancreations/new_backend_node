const { Router } = require("express");
const {
  getMessages,
  sendMessage,
  getThreads,
  createThread,
  deleteThread
} = require("../controllers/chatbot");
const auth = require("../middleware/auth");

const router = Router();

router.use(auth);

router.get("/messages/:threadId", getMessages);
router.post("/message/:threadId", sendMessage);
router.get("/threads", getThreads);
router.post("/thread", createThread);
router.delete("/thread/:threadId", deleteThread);

module.exports = router;
