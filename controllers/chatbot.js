const { ChatBot } = require("../models/chatbot");
const {
  strict_assistant_create_user,
  strict_assistant_send,
  strict_assistant_messages
} = require("../GPT/strict_output");
const { get } = require("http");

// for now we will use a dummy user id
const userId = "5e8e4c1e6c2a2d1c2c7a1b7c";

exports.getMessages = async (req, res) => {
  // check if user is logged in
  // for now we will use a dummy user id

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
  // check if user is logged in
  // for now we will use a dummy user id

  // get message from client
  const { message: clientMessage } = req.body;
  if (!clientMessage) {
    return res.status(400).json({ msg: "No message provided" });
  }
  // get user from db chatbot collection
  let user = await ChatBot.findById(userId);
  if (!user) {
    user = await strict_assistant_create_user(userId);
    return res.status(200).json({ messages: [] });
  }
  if (!user.thread) {
    return res.status(400).json({ msg: "No thread found" });
  }

  // send message to openai
  const message = await strict_assistant_send(user.thread, clientMessage);

  // send messages to client
  return res.status(200).json({ message });
};
