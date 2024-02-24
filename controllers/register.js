const { User } = require("../models/user");

exports.checkAttribute = async (req, res, attribute) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ msg: "No data provided" });
    }

    const userExists = await User.exists({ [attribute]: data });
    if (userExists) {
      return res.status(200).json({
        result: false,
        msg: `Sorry, ${attribute} ${data} is already taken, please try another one.`
      });
    }

    return res.status(200).json({
      result: true,
      msg: `Great! you can register with ${attribute}: ${data}`
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ msg: "Internal server error" });
  }
};
