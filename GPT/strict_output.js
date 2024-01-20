/**
 * @file This file contains functions that generate output from the OpenAI API.
 * The output is strictly checked to ensure that it adheres to the output format.
 * @module strict_output
 */
require("dotenv").config();
const fs = require("fs");
const OpenAI = require("openai");
const { jsonrepair } = require("jsonrepair");
const { ChatBot } = require("../models/chatbot");

const openai = new OpenAI({
  // organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Executes a strict output generation using OpenAI's chat completions API.
 *
 * @param {string} system_prompt - The system prompt to be used in the conversation.
 * @param {string} user_prompt - The user prompt to be used in the conversation.
 * @param {object} output_format - The desired output format.
 * @param {object} options - Optional parameters for the output generation.
 * @param {number} options.num_tries - The number of attempts to generate a valid output. Default is 3.
 * @param {number} options.temperature - The temperature parameter for output randomness. Default is 0.8.
 * @param {string} options.model - The model to be used for output generation. Default is 'gpt-3.5-turbo-1106'.
 * @param {boolean} options.verbose - Whether to log verbose output. Default is false.
 *
 * @returns {object} - The generated output in the specified format.
 * @throws {string} - If the output format is invalid or missing keys.
 * @throws {string} - If an exception occurs during the output generation process.
 */
exports.strict_output = async (
  system_prompt,
  user_prompt,
  output_format,
  {
    num_tries = 3,
    temperature = 0.8,
    model = "gpt-3.5-turbo-1106",
    verbose = false
  } = {}
) => {
  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt = `\nYou are a helpful assistant designed to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;

    let error_msg = "";

    // Use OpenAI to get a response
    const data = {
      temperature,
      model,
      messages: [
        {
          role: "system",
          content: system_prompt + output_format_prompt + error_msg
        },
        { role: "user", content: user_prompt.toString() }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096
    };
    fs.writeFileSync("GPT/json/strict_output_data.json", JSON.stringify(data));

    let response;
    try {
      response = await openai.chat.completions.create(data);
    } catch (e) {
      console.log("An exception occurred:", e);
      return { error: true, msg: e };
    }
    fs.writeFileSync("GPT/json/strict_output.json", JSON.stringify(response));

    if (response.choices[0].finish_reason === "length") {
      console.error("Error: response length is too long");
    }

    let res = response.choices[0].message?.content?.replace(/'/g, "'");
    res = res.replace(/\/&/g, "&");

    if (!res) {
      console.log("Invalid json format, trying to fetch again");
      continue;
    }

    // ensure that we don't replace away apostrophes in text
    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    // try-catch block to ensure output format is adhered to
    try {
      if (res[0] !== "{") {
        console.log("Invalid json format, trying to find first {");
        while (res[0] !== "{") {
          res = res.slice(1);
        }
      }
      const repaired = jsonrepair(res);
      let output = JSON.parse(repaired);

      // check for all keys and nested keys in output is according to output_format structure and log the key that is missing
      const check_keys = (output, output_format) => {
        if (typeof output !== "object") {
          return;
        }
        for (const key in output_format) {
          if (!(key in output)) {
            // save output to file for debugging
            fs.writeFileSync("GPT/json/failed_format.json", repaired);
            throw `Key ${key} is missing in output`;
          } else {
            check_keys(output[key], output_format[key]);
          }
        }
      };
      check_keys(output, output_format);

      return output;
    } catch (e) {
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.log("An exception occurred:", e);
      if (verbose) {
        console.log("Current invalid json format:", res);
      }
      if (i < num_tries - 1) {
        console.log(
          `Trying again\nstrict_output attempt ${i + 2} of ${num_tries}`
        );
      } else if (num_tries !== 1) {
        console.log("No more tries left");
      }
    }
  }

  return { error: true, msg: "No valid output generated" };
};

/**
 * Generates or edits images using OpenAI's GPT model.
 * @async
 * @function strict_image
 * @param {Object} options - The options for generating or editing images.
 * @param {string} options.prompt - The prompt for generating or editing the image.
 * @param {number} [options.n=1] - The number of images to generate.
 * @param {string} [options.size='1024x1024'] - The size of the generated image.
 * @param {string} [options.model='dall-e-3'] - The model to use for generating or editing the image.
 * @param {string} [options.imagePath=null] - The path to the image file to be edited.
 * @returns {Promise<Object>} - The generated or edited image data.
 */
exports.strict_image = async ({
  prompt,
  n = 1,
  size = "1024x1024",
  model = "dall-e-3",
  imagePath = null,
  maskPath = null
}) => {
  let response;
  try {
    if (imagePath) {
      response = await openai.images.edit({
        image: fs.createReadStream(imagePath),
        mask: maskPath ? fs.createReadStream(maskPath) : "null",
        model,
        prompt,
        n,
        size
      });
    } else {
      response = await openai.images.generate({
        model,
        prompt,
        n,
        size
      });
    }
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }

  // save response to file for debugging
  fs.writeFileSync("GPT/json/strict_image.json", JSON.stringify(response));

  return response.data;
};

/**
 * Generates audio using OpenAI's text-to-speech model.
 * @param {Object} options - The options for generating audio.
 * @param {string} options.input - The input text to convert to audio.
 * @param {string} options.path - The path where the generated audio file will be saved.
 * @param {string} [options.model='tts-1'] - The model to use for generating audio.
 * @param {string} [options.voice='alloy'] - The voice to use for generating audio.
 * @returns {Promise<string>} - A promise that resolves with the path of the generated audio file.
 */
exports.strict_audio = async ({
  input,
  path,
  model = "tts-1",
  voice = "alloy"
}) => {
  console.log("Generating audio");
  try {
    const mp3 = await openai.audio.speech.create({
      model,
      voice,
      input
    });
    console.log("Finished generating audio.");
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(path, buffer);

    return path;
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }
};

/**
 * Creates a new run using the given thread ID and assistant ID.
 *
 * @param {string} threadId - Thread ID.
 * @param {string} content - The content of the message.
 * @param {string} instructions - The instructions for the assistant.
 * @returns {Promise<Object>} - A promise that resolves with the message object.
 */
exports.strict_assistant_send = async (
  assistantId,
  threadId,
  content,
  instructions
) => {
  try {
    // find thread by id
    const thread = await openai.beta.threads.retrieve(threadId);
    if (!thread) {
      return { error: true, msg: "No thread found" };
    }

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions
    });
    let retrieve = { status: "queued" };
    const failStatus = ["expired", "cancelling", "cancelled", "failed"];
    while (retrieve.status === "queued" || retrieve.status === "in_progress") {
      // wait for run to finish
      if (failStatus.includes(retrieve.status)) {
        throw new Error("Run failed");
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("Waiting for run to finish");
      retrieve = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    const messagesResult = await openai.beta.threads.messages.list(thread.id);

    // save response to file for debugging
    fs.writeFileSync(
      "GPT/json/strict_assistant_messages.json",
      JSON.stringify(messagesResult)
    );

    // save message to file for debugging
    fs.writeFileSync(
      "GPT/json/strict_assistant_message.json",
      JSON.stringify(message)
    );

    console.log(
      'Finished creating thread run. save to file "GPT/json/strict_assistant_messages.json"'
    );
    const messages = messagesResult.data.map(message => {
      return {
        role: message.role,
        text: message.content[0].text.value,
        id: message.id,
        createdAt: message.created_at
      };
    });

    return messages[0];
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }
};

/**
 * Creates a chatbot user with a new thread.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<ChatBotUser>} The newly created chatbot user object.
 */
exports.strict_assistant_create_user = async (userId, assistantId) => {
  // create thread
  const thread = await this.strict_assistant_create_thread();
  // create new user with thread in ChatBot collection
  const newUser = new ChatBot({
    _id: userId,
    assistants: [
      {
        id: assistantId,
        created_at: Date.now(),
        threads: [
          {
            id: thread.id,
            created_at: Date.now()
          }
        ]
      }
    ]
  });
  await newUser.save();
  console.log("create thread", thread.id);
  return newUser;
};

/**
 * Creates a new thread.
 * @returns {Promise<object>} object of thread.
 */
exports.strict_assistant_create_thread = async () => {
  const thread = await openai.beta.threads.create();
  return thread;
};

/**
 * Get all messages from a thread.
 * @param {object} thread - Thread object.
 * @returns {Promise<object>} object of messages.
 */
exports.strict_assistant_messages = async thread => {
  if (!thread || !thread?.id) {
    return { error: true, msg: "No thread found" };
  }

  try {
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    const messages = threadMessages.data.map(message => {
      return {
        role: message.role,
        text: message.content[0].text.value,
        id: message.id,
        createdAt: message.created_at
      };
    });

    return messages;
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }
};

/**
 * Delete a thread.
 * @param {string} threadId - Thread ID.
 * @returns {Promise<object>} object of thread delete.
 */
exports.strict_assistant_delete_thread = async threadId => {
  try {
    const threadDelete = await openai.beta.threads.del(threadId);
    return threadDelete;
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }
};

exports.strict_assistant_check = async assistantId => {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (e) {
    console.log("An exception occurred:", e);
    return { error: true, msg: e };
  }
};
