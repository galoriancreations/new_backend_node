const { Router } = require("express");
const auth = require("../middleware/auth");
const { saveTemplate, saveDraft } = require('../controllers/editor');

const router = Router();

router.post("/saveTemplate", auth, saveTemplate);
router.post("/saveDraft", auth, saveDraft);

module.exports = router;
