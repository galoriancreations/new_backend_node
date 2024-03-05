const EventEmitter = require("events");

const progressEmitter = new EventEmitter();
exports.progressEmitter = progressEmitter;

exports.progressEmit = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const progressListener = (attempt, maxAttempts, type) => {
    // calculate progress percentage
    const progress = Math.floor((attempt / maxAttempts) * 100);
    const data = {
      progress,
      attempts: attempt,
      maxAttempts: maxAttempts,
      type: type || "template"
    };
    if (progress === 100) {
      data.done = true;
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  progressListener();

  progressEmitter.on("progressAttemptsChanged", progressListener);
  req.on("close", () => {
    progressEmitter.removeListener("progressAttemptsChanged", progressListener);
  });
};
