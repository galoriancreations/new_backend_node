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
    model = 'gpt-3.5-turbo',
    verbose = false,
  } = {}
) {
  for (let i = 1; i <= num_tries; i++) {
    let output_format_prompt = `\nYou are to output the following in json format: ${JSON.stringify(
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
      // response_format: { type: 'json_object' },
    });

    fs.writeFileSync('GPT/json/strict_output2.json', JSON.stringify(response));
    
    let res = response.choices[0].message?.content?.replace(/'/g, "'");

    if (!res) {
      // if (verbose) {
      console.log('Invalid json format, trying to fetch again');
      // }
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
        // if (verbose) {
        console.log('Invalid json format, trying to find first {');
        // }
        while (res[0] !== '{') {
          res = res.slice(1);
        }
      }
      const repaired = jsonrepair(res);
      let output = JSON.parse(repaired);
      // return output;

      // check for each element in the output_list, the format is correctly adhered to
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          // unable to ensure accuracy of dynamic output header, so skip it
          if (/<.*?>/.test(key)) {
            continue;
          }

          // if output field missing, raise an error
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          // if inner output field missing, raise an error
          if (Array.isArray(output_format[key])) {
            for (let i = 0; i < output_format[key].length; i++) {
              if (!(output_format[key][i] in output[index][key])) {
                throw new Error(
                  `${output_format[key][i]} not in json output ${key}`
                );
              }
            }
          }
        }
      }

      return output;
    } catch (e) {
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.log('An exception occurred:', e);
      console.log('Current invalid json format:', res);
      if (num_tries > 1) {
        console.log(`Trying again, attempt ${i + 1} of ${num_tries}`);
      } else {
        console.log('No more tries left');
      }
    }
  }

  return null;
}

// Function to generate output from the OpenAI CHATGPT-3 API with a strict output format checking
async function strict_output(
  system_prompt,
  user_prompt,
  output_format,
  {
    default_category = '',
    output_value_only = false,
    model = 'gpt-3.5-turbo',
    temperature = 1,
    num_tries = 3,
    verbose = false,
  } = {}
) {
  // if the user input is in a list, we also process the output as a list of json
  const list_input = Array.isArray(user_prompt);
  // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
  const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
  // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
  const list_output = /\[.*?\]/.test(JSON.stringify(output_format));

  // start off with no error message
  let error_msg = '';

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    // if output_format contains dynamic elements, process it accordingly
    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    // if input is in a list format, ask it to generate json in a list
    if (list_input) {
      output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
    }

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
    });

    let res = response.choices[0].message?.content?.replace(/'/g, '"') ?? '';

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
      let output = JSON.parse(res);

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error('Output format not in a list of json');
        }
      } else {
        output = [output];
      }

      // check for each element in the output_list, the format is correctly adhered to
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          // unable to ensure accuracy of dynamic output header, so skip it
          if (/<.*?>/.test(key)) {
            continue;
          }

          // if output field missing, raise an error
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          // check that one of the choices given for the list of words is an unknown
          if (Array.isArray(output_format[key])) {
            const choices = output_format[key];
            // ensure output is not a list
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            // output the default category (if any) if GPT is unable to identify the category
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            // if the output is a description format, get only the label
            if (output[index][key].includes(':')) {
              output[index][key] = output[index][key].split(':')[0];
            }
          }
        }

        // if we just want the values for the outputs
        if (output_value_only) {
          output[index] = Object.values(output[index]);
          // just output without the list if there is only one element
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.log('An exception occurred:', e);
      console.log('Current invalid json format:', res);
    }
  }
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
