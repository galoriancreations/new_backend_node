const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  editProfile,
  loadAvailableTemplates,
  loadPublicTemplates
} = require("../controllers/users");

const router = Router();

router.post("/register", registerUser);
router.post("/signIn", loginUser);
router.post("/editProfile", auth, editProfile);
router.get("/loadAvailableTemplates", auth, loadAvailableTemplates);
router.get("/loadPublicTemplates", loadPublicTemplates);

module.exports = router;
