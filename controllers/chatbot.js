const { ChatBot } = require("../models/chatbot");
const {
  strict_assistant_create_user,
  strict_assistant_send,
  strict_assistant_messages
} = require("../GPT/strict_output");

exports.getMessages = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await ChatBot.findById(userId);
    if (!user) {
      await strict_assistant_create_user(userId);
      return res.status(200).json({ messages: [] });
    }

    if (!user.thread) {
      return res.status(400).json({ msg: "No thread found" });
    }

    // send messages to client
    const messages = await strict_assistant_messages(user.thread);
    return res.status(200).json({ messages });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  // check if message is provided
  const { message: clientMessage } = req.body;
  if (!clientMessage) {
    return res.status(400).json({ msg: "No message provided" });
  }
  // check if user exists
  const userId = req.user._id;
  let user = await ChatBot.findById(userId);
  if (!user) {
    user = await strict_assistant_create_user(userId);
    return res.status(200).json({ messages: [] });
  }
  if (!user.thread) {
    return res.status(400).json({ msg: "No thread found" });
  }

  // get user details
  const { fullName, language, accountType, organization, country, isAdmin } =
    req.user;

  const instructions = `Please address the user as a Ting Global website ${
    isAdmin ? "admin" : "user"
  }. User details: Name: ${fullName}, Language: ${language}, Account Type: ${accountType}, ${
    organization.length ? `Organization: ${organization}, ` : ""
  }Country: ${country}`;

  // send message to openai
  const message = await strict_assistant_send(
    user.thread,
    clientMessage,
    instructions
  );

  // send messages to client
  return res.status(200).json({ message });
};
