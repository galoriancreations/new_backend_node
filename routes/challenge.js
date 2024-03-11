const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  getChallengesByName,
  getPublicTemplateID
} = require("../controllers/challenge");

const router = Router();

router.post("/getPublicTemplateID", auth, getPublicTemplateID);
router.post("/getChallengesByName", auth, getChallengesByName);

module.exports = router;
