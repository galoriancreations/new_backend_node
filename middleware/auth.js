const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.get("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Not authenticated" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decodedToken?.user) {
      return res.status(403).json({ msg: "Not authorized" });
    }
    req.user = decodedToken.user;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'error accured' });
  }
};
