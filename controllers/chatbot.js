const { ChatBot } = require("../models/chatbot");
const {
  strict_assistant_create_user,
  strict_assistant_send,
  strict_assistant_messages,
  strict_assistant_create_thread,
  strict_assistant_delete_thread,
  strict_assistant_check
} = require("../GPT/strict_output");

exports.getMessages = async (req, res) => {
  try {
    console.log("getMessages from controller/chatbot.js");

    const { assistantId, threadId } = req.params;
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      await strict_assistant_create_user(userId, assistantId);
      return res.status(200).json({ messages: [] });
    }
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }

    // check if assistant exists
    if (!user.assistants.length) {
      return res.status(400).json({ msg: "No assistant found" });
    }

    // check if thread is belong to assistant
    const assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }

    // check if thread exists
    if (!assistant.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }

    // get thread
    const thread = assistant.threads.find(thread => thread.id === threadId);
    if (!thread) {
      return res.status(400).json({ msg: "Invalid thread id" });
    }
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
    console.log("sendMessage from controller/chatbot.js");

    // check if message is provided
    const { message: clientMessage } = req.body;
    const { assistantId, threadId } = req.params;

    if (!clientMessage) {
      return res.status(400).json({ msg: "No message provided" });
    }
    // check if user exists
    const userId = req.user._id;
    let user = await ChatBot.findById(userId);
    if (!user) {
      user = await strict_assistant_create_user(userId, assistantId);
      return res.status(200).json({ messages: [] });
    }

    // check if assistant exists
    if (!user.assistants.length) {
      return res.status(400).json({ msg: "No assistant found" });
    }
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }
    let assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      // check if assistant exists in openai
      const response = await strict_assistant_check(assistantId);
      if (!response.id) {
        return res.status(400).json({ msg: "Invalid assistant id" });
      }
      assistant = {
        id: assistantId,
        threads: [await strict_assistant_create_thread()]
      };
      user.assistants.push(assistant);
    }
    // check if thread exists
    if (!assistant.threads.length) {
      return res.status(400).json({ msg: "No thread found" });
    }
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }

    // check if thread is belong to assistant
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }
    const thread = assistant.threads.find(thread => thread.id === threadId);
    if (!thread) {
      console.log("found threadId: ", threadId);
      console.log("found thread: ", thread);
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
      assistantId,
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
    console.log("getThreads from controller/chatbot.js");

    const userId = req.user._id;
    const { assistantId } = req.params;
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }
    const user = await ChatBot.findById(userId);
    if (!user) {
      await strict_assistant_create_user(userId, assistantId);
      return res.status(200).json({ threads: [] });
    }
    const assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }
    if (!user) {
      await strict_assistant_create_user(userId, assistantId);
      return res.status(200).json({ threads: assistant.threads });
    }

    const threads = assistant.threads;
    return res.status(200).json({ threads });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.createThread = async (req, res) => {
  try {
    console.log("createThread from controller/chatbot.js");

    const { assistantId } = req.body;
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }

    const userId = req.user._id;
    const thread = await strict_assistant_create_thread(userId);

    // save thread to user
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }

    assistant.threads.push({ ...thread, created_at: new Date() / 1000 });
    await user.save();

    return res.status(200).json({ thread });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteThread = async (req, res) => {
  try {
    console.log("deleteThread from controller/chatbot.js");

    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const { assistantId, threadId } = req.params;
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    const assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }
    const thread = assistant.threads.find(thread => thread.id === threadId);
    if (!thread) {
      return res.status(400).json({ msg: "Thread not found" });
    }

    // delete thread from user
    const index = assistant.threads.indexOf(thread);
    assistant.threads.splice(index, 1);
    await user.save();

    // delete thread from openai
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
    console.log("editThread from controller/chatbot.js");
    
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const { assistantId, threadId } = req.params;
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }
    if (!threadId) {
      return res.status(400).json({ msg: "No thread id provided" });
    }
    const assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      return res.status(400).json({ msg: "Invalid assistant id" });
    }
    const thread = assistant.threads.find(thread => thread.id === threadId);
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

exports.getAssistant = async (req, res) => {
  try {
    const { assistantId } = req.params;
    if (!assistantId) {
      return res.status(400).json({ msg: "No assistant id provided" });
    }

    // get user
    const userId = req.user._id;
    const user = await ChatBot.findById(userId);
    if (!user) {
      // create user
      const newUser = await strict_assistant_create_user(userId, assistantId);
      return res.status(200).json({ assistant: newUser.assistants[0] });
    }

    if (!user.assistants.length) {
      return res.status(400).json({ msg: "No assistant found" });
    }

    let assistant = user.assistants.find(
      assistant => assistant.id === assistantId
    );
    if (!assistant) {
      const response = await strict_assistant_check(assistantId);
      if (!response.id) {
        return res.status(400).json({ msg: "Invalid assistant id" });
      }
      assistant = {
        id: assistantId,
        threads: [await strict_assistant_create_thread()],
        created_at: new Date() / 1000
      };
      user.assistants.push(assistant);
      await user.save();
    }

    return res.status(200).json({ assistant });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};
