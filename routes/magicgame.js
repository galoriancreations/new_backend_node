const { Router } = require("express");
const {
    getQuestion,
    getAnswer,
    updateLikes
} = require("../controllers/magicgame");
const auth = require("../middleware/auth");

const router = Router();

router.use(auth);

router.post("/getQuestion", getQuestion);
router.post("/getAnswer", getAnswer);
router.put("/updateLikes", updateLikes);

module.exports = router;