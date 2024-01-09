const { ChatBot } = require("../models/chatbot");
const {
  strict_assistant_create_user,
  strict_assistant_send,
  strict_assistant_messages,
  strict_assistant_create_thread,
  strict_assistant_delete_thread
} = require("../GPT/strict_output");

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      await strict_assistant_create_user(userId);
      return res.status(200).json({ messages: [] });
    }
    const threadId = req.params.threadId;
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    if (!user.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }
    if (!user.threads.find(thread => thread.id === threadId)) {
      return res.status(400).json({ msg: "Invalid thread id" });
    }
    // get thread
    const thread = user.threads.find(thread => thread.id === threadId);
    // send messages to client
    const messages = await strict_assistant_messages(thread);
    return res.status(200).json({ messages });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
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
    if (!user.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }
    const { threadId } = req.params;
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    if (!user.threads.find(thread => thread.id === threadId)) {
      return res.status(400).json({ msg: "Invalid thread id" });
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
      threadId,
      clientMessage,
      instructions
    );

    // send messages to client
    return res.status(200).json({ message });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      const user = await strict_assistant_create_user(userId);
      return res.status(200).json({ threads: user.threads });
    }
    const threads = user.threads;
    return res.status(200).json({ threads });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.createThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const thread = await strict_assistant_create_thread(userId);
    // save thread to user
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    user.threads.push(thread);
    await user.save();
    return res.status(200).json({ thread });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    if (!user.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }
    const { threadId } = req.params;
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    if (!user.threads.find(thread => thread.id === threadId)) {
      return res.status(400).json({ msg: "Invalid thread id" });
    }
    // delete thread
    user.threads = user.threads.filter(thread => thread.id !== threadId);
    await user.save();

    const response = await strict_assistant_delete_thread(threadId);
    if (!response.deleted) {
      return res.status(400).json({ msg: "Error deleting thread" });
    }

    return res.status(200).json({ msg: "Thread deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.editThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    if (!user.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }
    const { threadId } = req.params;
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    if (!user.threads.find(thread => thread.id === threadId)) {
      return res.status(400).json({ msg: "Invalid thread id" });
    }
    const thread = user.threads.find(thread => thread.id === threadId);
    if (!thread) {
      return res.status(400).json({ msg: "Thread not found" });
    }
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ msg: "No title provided" });
    }
    thread.title = title;
    await user.save();
    return res.status(200).json({ thread });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};
