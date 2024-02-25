const { Router } = require("express");
const auth = require("../middleware/auth");
const { generateTemplate, generateDay } = require('../controllers/generate');


const router = Router();

router.post("/template", auth, generateTemplate);
router.post("/day", auth, generateDay)

module.exports = router;
