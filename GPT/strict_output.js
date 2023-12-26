/**
 * This file contain functions that generate output from the OpenAI API
 * The output is strictly checked to ensure that it adutilsheres to the output format
 */
require('dotenv').config();
const fs = require('fs');
const OpenAI = require('openai');
const { jsonrepair } = require('jsonrepair');

const openai = new OpenAI({
  // organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Executes a strict output generation using OpenAI's chat completions API.
 * 
 * @param {string} system_prompt - The system prompt for the chat conversation.
 * @param {string} user_prompt - The user prompt for the chat conversation.
 * @param {object} output_format - The desired output format.
 * @param {object} options - Optional parameters for the strict output generation.
 * @param {number} options.num_tries - The number of attempts to generate the output (default: 3).
 * @param {number} options.temperature - The temperature parameter for controlling randomness (default: 0.8).
 * @param {string} options.model - The model to use for generating the output (default: 'gpt-3.5-turbo-1106').
 * @param {boolean} options.verbose - Whether to log verbose output (default: false).
 * 
 * @returns {object|null} The generated output in the specified format, or null if generation fails.
 */
async function strict_output2(
  system_prompt,
  user_prompt,
  output_format,
  {
    num_tries = 3,
    temperature = 0.8,
    model = 'gpt-3.5-turbo-1106',
    verbose = false,
  } = {}
) {
  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt = `\nYou are a helpful assistant designed to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;

    let error_msg = '';

    // Use OpenAI to get a response
    const data = {
      temperature,
      model,
      messages: [
        {
          role: 'system',
          content: system_prompt + output_format_prompt + error_msg,
        },
        { role: 'user', content: user_prompt.toString() },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    };
    fs.writeFileSync('GPT/json/strict_output2_data.json', JSON.stringify(data));

    const response = await openai.chat.completions.create(data);
    fs.writeFileSync('GPT/json/strict_output2.json', JSON.stringify(response));

    if (response.choices[0].finish_reason === 'length') {
      console.error('Error: response length is too long');
    }

    let res = response.choices[0].message?.content?.replace(/'/g, "'");
    res = res.replace(/\/&/g, '&');

    if (!res) {
      console.log('Invalid json format, trying to fetch again');
      continue;
    }

    // ensure that we don't replace away apostrophes in text
    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    if (verbose) {
      console.log(
        'System prompt:',
        system_prompt + output_format_prompt + error_msg
      );
      console.log('\nUser prompt:', user_prompt);
      console.log('\nGPT response:', res);
    }

    // try-catch block to ensure output format is adhered to
    try {
      if (res[0] !== '{') {
        console.log('Invalid json format, trying to find first {');
        while (res[0] !== '{') {
          res = res.slice(1);
        }
      }
      const repaired = jsonrepair(res);
      let output = JSON.parse(repaired);

      // check for all keys and nested keys in output is according to output_format structure and log the key that is missing
      const check_keys = (output, output_format) => {
        if (typeof output !== 'object') {
          return;
        }
        for (const key in output_format) {
          if (!(key in output)) {
            // save output to file for debugging
            fs.writeFileSync('GPT/json/failed_format.json', repaired);
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
      console.log('An exception occurred:', e);
      if (verbose) {
        console.log('Current invalid json format:', res);
      }
      if (i < num_tries - 1) {
        console.log(
          `Trying again\nstrict_output attempt ${i + 2} of ${num_tries}`
        );
      } else if (num_tries !== 1) {
        console.log('No more tries left');
      }
    }
  }

  return null;
}

/**
 * Generates strict images using OpenAI's image generation model.
 * @param {string} prompt - The prompt for generating the image.
 * @param {number} [n=1] - The number of images to generate.
 * @param {string} [size='1024x1024'] - The size of the generated image.
 * @param {string} [model='dall-e-3'] - The model to use for image generation.
 * @returns {Promise<Array>} - A promise that resolves to an array of generated images.
 */
async function strict_image(
  prompt,
  n = 1,
  size = '1024x1024',
  model = 'dall-e-3'
) {
  const response = await openai.images.generate({
    model,
    prompt,
    n,
    size,
  });

  // save response to file for debugging
  fs.writeFileSync('GPT/json/strict_image.json', JSON.stringify(response));

  return response.data;
}

/**
 * Generates audio using OpenAI's text-to-speech model.
 * @param {Object} options - The options for generating audio.
 * @param {string} options.input - The input text to convert to audio.
 * @param {string} options.path - The path where the generated audio file will be saved.
 * @param {string} [options.model='tts-1'] - The model to use for generating audio.
 * @param {string} [options.voice='alloy'] - The voice to use for generating audio.
 * @returns {Promise<string>} - A promise that resolves with the path of the generated audio file.
 */
async function strict_audio({ input, path, model = 'tts-1', voice = 'alloy' }) {
  console.log('Generating audio');
  const mp3 = await openai.audio.speech.create({
    model,
    voice,
    input,
  });
  console.log('Finished generating audio.');
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(path, buffer);

  return path;
}

module.exports = { strict_output2, strict_image, strict_audio };
