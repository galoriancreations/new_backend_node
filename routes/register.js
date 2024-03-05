const { Router } = require("express");

const { checkAttribute } = require("../controllers/register");

const router = Router();

router.post("/checkUsername", (req, res) => checkAttribute(req, res, "username"));
router.post("/checkPhone", (req, res) => checkAttribute(req, res, "phone"));
router.post("/checkEmail", (req, res) => checkAttribute(req, res, "email"));

module.exports = router;
