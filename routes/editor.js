const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  saveTemplate,
  saveDraft,
  getTemplateData,
  deleteDraft,
  createChallenge,
  getChallengeData,
  deleteChallenge,
  deleteTemplate
} = require("../controllers/editor");

const router = Router();

router.post("/saveTemplate", auth, saveTemplate);
router.post("/saveDraft", auth, saveDraft);
router.post("/getTemplateData", auth, getTemplateData);
router.post("/deleteDraft", auth, deleteDraft);
router.post("/createChallenge", auth, createChallenge);
router.post("/getChallengeData", auth, getChallengeData);
router.post("/deleteChallenge", auth, deleteChallenge);
router.post("/deleteTemplate", auth, deleteTemplate);

module.exports = router;
