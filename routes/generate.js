const { Router } = require("express");
const auth = require("../middleware/auth");
const { generateTemplate } = require('../controllers/generate');

const router = Router();

router.post("/template", auth, generateTemplate);

module.exports = router;
