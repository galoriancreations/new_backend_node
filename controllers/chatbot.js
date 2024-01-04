const { create } = require("domain");
const { ChatBot } = require("../models/chatbot");
const { strict } = require("assert");
const { createChatBotUser, strict_assistant } = require('../GPT/strict_output');

// for now we will use a dummy user id
const userId = "5e8e4c1e6c2a2d1c2c7a1b7c";

exports.getMessages = async (req, res) => {
  // check if user is logged in
  // for now we will use a dummy user id

  // get user from db chatbot collection
  const user = await ChatBot.findById(userId);
  if (!user) {
    await createChatBotUser(userId);
    return res.status(200).json({ messages: [] });
  }

  if (!user.thread) {
    return res.status(400).json({ msg: "No thread found" });
  }

  // send messages to client
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
    user = await createChatBotUser(userId);
    console.log({user});
    return res.status(200).json({ messages: [] });
  }
  if (!user.thread) {
    return res.status(400).json({ msg: "No thread found" });
  }
  
  // send message to openai
  const messages = await strict_assistant(user.thread, clientMessage);

  // send messages to client
  res.status(200).json({ messages });
};
