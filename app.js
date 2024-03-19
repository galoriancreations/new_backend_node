const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const { cleanupTempDir } = require("./utils/general");
dotenv.config();

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(fileUpload({ createParentPath: true }));
app.use(cors());

cleanupTempDir();

// app.use("/api", require("./routes/api"));
// app.use("/xapi", require("./routes/xapi"));
app.use("/users", require("./routes/users"));
app.use("/register", require("./routes/register"));
app.use("/progress", require("./routes/progress"));
app.use("/uploads", require("./routes/uploads"));
app.use("/chatbot", require("./routes/chatbot"));
app.use("/editor", require("./routes/editor"));
app.use("/group", require("./routes/group"));
app.use("/certifications", require("./routes/certifications"));
app.use("/generate", require("./routes/generate"));
app.use("/magicgame", require("./routes/magicgame"));
app.use("/clone",require("./routes/clone"));

const startServer = async () => {
  const PORT = process.env.PORT || 3000;
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`, new Date())
  );
};

startServer();

// start article generator schedule to run every Monday at 9:00
// scheduleArticleJob(1, 9, 0);
