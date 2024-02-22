const { Router } = require("express");

const {
    checkUsername,
    checkPhone,
    checkEmail
} = require("../controllers/register");

const router = Router();


router.post("/checkUsername",checkUsername);
router.post("/checkPhone",checkPhone);
router.post("/checkEmail",checkEmail);

module.exports = router;