const { Router } = require("express");
const auth = require("../middleware/auth");
const { loadGroup, sendMessage } = require('../controllers/group');

const router = Router();

router.post("/loadGroup", auth, loadGroup);
router.post("/sendMessage", auth, sendMessage);

module.exports = router;
