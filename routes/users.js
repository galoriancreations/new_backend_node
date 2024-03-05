const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  editProfile,
  getAvailableTemplates,
  getPublicTemplates
} = require("../controllers/users");

const router = Router();

router.post("/register", registerUser);
router.post("/signIn", loginUser);
router.post("/editProfile", auth, editProfile);
router.get("/getAvailableTemplates", auth, getAvailableTemplates);
router.get("/getPublicTemplates", getPublicTemplates);

module.exports = router;
