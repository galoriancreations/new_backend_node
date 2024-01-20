const { Router } = require("express");
const {
  getMessages,
  sendMessage,
  getThreads,
  createThread,
  deleteThread,
  editThread,
  getCouncil
} = require("../controllers/chatbot");
const auth = require("../middleware/auth");

const router = Router();

router.use(auth);

router.get("/messages/:assistantId/:threadId", getMessages);
router.post("/message/:assistantId/:threadId", sendMessage);

router.get("/:assistantId/threads", getThreads);
router.post("/thread", createThread);
router.delete("/thread/:threadId", deleteThread);
router.put("/thread/:assistantId/:threadId", editThread);

router.get("/council/:assistantId", getCouncil);

module.exports = router;
