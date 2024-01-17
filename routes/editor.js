const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  saveTemplate,
  saveDraft,
  getTemplateData,
  deleteDraft,
  createChallenge
} = require("../controllers/editor");

const router = Router();

router.post("/saveTemplate", auth, saveTemplate);
router.post("/saveDraft", auth, saveDraft);
router.post("/getTemplateData", auth, getTemplateData);
router.post("/deleteDraft", auth, deleteDraft);
router.post("/createChallenge", auth, createChallenge);

module.exports = router;
