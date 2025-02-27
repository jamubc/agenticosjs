// import *  as gradio from "https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js";
// console.log(gradio);


import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.12.0/dist/index.min.js";

 



export async function generateText(q, imageUrl) {
//   generates text without image
if (!imageUrl){
    imageUrl = "https://upload.wikimedia.org/wikipedia/commons/c/c9/Gamlehaugen_bergen_tunliweb.jpg"
}

  const client = await Client.connect("deepseek-ai/Janus-Pro-7B");
const response_0 = await fetch(imageUrl);
const exampleImage = await response_0.blob();
console.log(exampleImage);

  const result2 = await client.predict("/multimodal_understanding", { 
    image: exampleImage, 		
question: q, 		
seed: 3, 		
top_p: 0, 		
temperature: 0, 
});

  return result2.data;
}