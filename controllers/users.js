const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloneDeep = require("clone-deep");

exports.registerUser = async (req, res) => {
  try {
    const {
      username,
      phone,
      fullName,
      organization,
      country,
      memberName,
      memberRole,
      email,
      language,
      accountType,
      password
    } = req.body;
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ msg: "This username already exists" });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ msg: "A user with this phone nummer already exists" });
    }
    const user = new User({
      username,
      phone,
      fullName,
      organization,
      country,
      memberName,
      memberRole,
      email,
      language,
      accountType
    });
    user.password = await bcrypt.hash(password, 12);
    const createdUser = await user.save();
    const clonedUser = cloneDeep(createdUser._doc);
    delete clonedUser.password;
    const token = jwt.sign({ user: clonedUser }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d"
    });
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 1);
    res
      .status(201)
      .json({ user: clonedUser, access_token: token, exp: expiresIn });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("login req.body", req.body);
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(401)
        .json({ msg: "Phone number or password are incorrect" });
    }
    console.log("user phone", user.phone);
    if (user.password) {
      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        return res
          .status(401)
          .json({ message: "Phone number or password are incorrect" });
      }
    }
    const clonedUser = cloneDeep(user._doc);
    delete clonedUser.password;
    const token = jwt.sign({ user: clonedUser }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d"
    });
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 1);
    res.json({ user: clonedUser, access_token: token, exp: expiresIn });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
};
