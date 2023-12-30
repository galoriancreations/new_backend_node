const { Router } = require("express");
const { registerUser, loginUser } = require("../controllers/users");

const router = Router();

router.post("/register", registerUser);
router.post("/signIn", loginUser);

module.exports = router;
