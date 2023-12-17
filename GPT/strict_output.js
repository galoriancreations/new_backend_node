/**
 * This file contain functions that generate output from the OpenAI API
 * The output is strictly checked to ensure that it adheres to the output format
 */
const fs = require('fs');
const OpenAI = require('openai');
const { jsonrepair } = require('jsonrepair');

const openai = new OpenAI({
  // organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate output from the OpenAI CHATGPT-3 API with a strict output format checking
// Version 2 of the function, which is more robust, accept any type of output_format, but less output checking
async function strict_output2(
  system_prompt,
  user_prompt,
  output_format,
  {
    num_tries = 3,
    temperature = 1,
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
    const response = await openai.chat.completions.create({
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
    });

    fs.writeFileSync('GPT/json/strict_output2.json', JSON.stringify(response));

    if (response.choices[0].finish_reason === 'length') {
      console.error('Error: response length is too long');
    }

    let res = response.choices[0].message?.content?.replace(/'/g, "'");

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
          `Trying again, strict_output attempt ${i + 2} of ${num_tries}`
        );
      } else if (num_tries !== 1) {
        console.log('No more tries left');
      }
    }
  }

  return null;
}

// Function to generate image from the OpenAI DALL-E API
async function strict_image(prompt, n = 1, size = '1024x1024') {
  const response = await openai.images.generate({
    prompt,
    n,
    size,
  });
  const imageUrl = response.data;

  return imageUrl;
}

// // Function to generate audio from the OpenAI API
// async function strict_audio(prompt: string) {
//   const transcription = await openai.audio.transcriptions.create({
//     file: fs.createReadStream('audio.mp3'),
//     model: 'whisper-1',
//   });

//   console.log(transcription.text);
// }

module.exports = { strict_output2 };
