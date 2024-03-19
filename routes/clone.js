const { Router } = require("express");
const auth = require("../middleware/auth");

const { cloneTemplate } = require("../controllers/clone");

const router = Router();
router.use(auth);

router.post("/", (req, res) => cloneTemplate(req, res));

module.exports = router;