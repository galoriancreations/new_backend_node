const { Router } = require("express");
const {
    getQuestion,
    updateAnswer,
    updateLikes
} = require("../controllers/magicgame");
const auth = require("../middleware/auth");

const router = Router();

router.use(auth);

router.post("/getQuestion", getQuestion);
router.post("/updateAnswer", updateAnswer);
router.put("/updateLikes", updateLikes);

module.exports = router;