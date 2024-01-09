const { Router } = require("express");
const {
  getMessages,
  sendMessage,
  getThreads,
  createThread,
  deleteThread,
  editThread
} = require("../controllers/chatbot");
const auth = require("../middleware/auth");

const router = Router();

router.use(auth);

router.get("/messages/:threadId", getMessages);
router.post("/message/:threadId", sendMessage);
router.get("/threads", getThreads);
router.post("/thread", createThread);
router.delete("/thread/:threadId", deleteThread);
router.put("/thread/:threadId", editThread);

module.exports = router;
