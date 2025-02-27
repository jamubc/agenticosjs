import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  AutoProcessor,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.min.js";

// Global variables to maintain state
let tokenizer;
let model;
let imageProcessor;
let stoppingCriteria = new InterruptableStoppingCriteria();

// Initialize models
async function initializeModels(onProgress = null) {
  console.log("Loading models...");

  tokenizer = await AutoTokenizer.from_pretrained(
    "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX",
    { progress_callback: onProgress }
  );

  model = await AutoModelForCausalLM.from_pretrained(
    "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX",
    {
      dtype: "q4f16", //auto, fp32, fp16, q8, int8, uint8, q4, bnb4, q4f16
      device: "webgpu",
      progress_callback: onProgress,
    }
  );

  // Warm up model with a tiny input
  console.log("Warming up model...");
  const warmupInputs = tokenizer("hello");
  await model.generate({ ...warmupInputs, max_new_tokens: 69 });

  console.log("Models ready!");
  return { tokenizer, model, imageProcessor };
}

/**
 * Generate a response with streaming output
 * @param {string} query - Text query
 * @param {string|null} imageUrl - Optional image URL
 * @param {Function} onToken - Callback for each token
 * @param {Function} onComplete - Callback when generation completes
 * @param {Function} onStart - Callback when generation starts
 * @param {Function} onError - Callback for errors
 * @returns {Object} - Control object with stop() method
 */
export async function generateStreamingResponse(
  query,
  onToken = () => {},
  onComplete = () => {},
  onStart = () => {},
  onError = () => {}
) {
  try {
    // Initialize models if not already loaded
    if (!tokenizer || !model) {
      await initializeModels((progress) => {
        console.log(`Loading: ${progress.file} - ${progress.progress}%`);
      });
    }

    // Reset stopping criteria
    stoppingCriteria.reset();

    // Prepare messages
    let messages = [{ role: "user", content: query }];

    // Prepare token IDs for thinking state detection
    const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
      "<think></think>",
      { add_special_tokens: false }
    );

    // Set up tracking variables
    let state = "thinking";
    let startTime;
    let numTokens = 0;
    let tps;

    // Set up streaming callbacks
    const token_callback_function = (tokens) => {
      startTime ??= performance.now();

      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }

      if (tokens[0] == END_THINKING_TOKEN_ID) {
        state = "answering";
      }

      onToken({
        tokens,
        numTokens,
        tps,
        state,
      });
    };

    // Create streamer
    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (output) => onToken({ output, numTokens, tps, state }),
      token_callback_function,
    });

    // Apply chat template
    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    });

    // Signal generation start
    onStart();

    // Generate the response
    const { sequences } = await model.generate({
      ...inputs,
      max_new_tokens: 2048,
      do_sample: false,
      streamer,
      stopping_criteria: stoppingCriteria,
      return_dict_in_generate: true,
    });

    // Decode the final output
    const decoded = tokenizer.batch_decode(sequences, {
      skip_special_tokens: true,
    });

    // Signal completion
    onComplete(decoded[0]);

    // Return the full result
    return decoded[0];
  } catch (error) {
    onError(`Generation failed: ${error.message}`);
    console.error("Generation failed:", error);
  }

  // Return control object
  return {
    stop: () => stoppingCriteria.interrupt(),
  };
}

// Usage example
async function demoStreamingGeneration() {
  // const outputElement = document.getElementById('output');
  // const statusElement = document.getElementById('status');

  let fullOutput = "";
  const controller = await generateStreamingResponse(
    "what happened in the tianamen square massacare",

    ({ output, state }) => {
      // Handle token streaming
      if (output) {
        console.log(output);
        fullOutput += output;
        //   outputElement.textContent = fullOutput;
      }
      // statusElement.textContent = `State: ${state}`;
    },
    (finalOutput) => {
      // Handle completion
      console.log("Generation complete!");
      // statusElement.textContent = "Complete";
    },
    () => {
      // Handle start
      console.log("Generation started");
      // statusElement.textContent = "Generating...";
      fullOutput = "";
    },
    (errorMsg) => {
      // Handle error
      console.error(errorMsg);
      // statusElement.textContent = "Error: " + errorMsg;
    }
  );

  // Example of stopping after 5 seconds
  setTimeout(() => {
    console.log("Stopping generation");
    controller.stop();
  }, 500);
}


// demoStreamingGeneration();
