//original python code transformed into JS

// const fs = require("fs");
// const fetch = require("node-fetch");
// const base64 = require("base-64");

// const API_URL =
// 	"https://api-inference.huggingface.co/models/jinhybr/OCR-DocVQA-Donut";


// async function query(payload) {
// 	const imgBuffer = fs.readFileSync(payload.inputs.image);
// 	const imgBase64 = imgBuffer.toString("base64");
// 	payload.inputs.image = base64.encode(imgBase64);

// 	const response = await fetch(API_URL, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Authorization: `Bearer ${API_TOKEN}`,
// 		},
// 		body: JSON.stringify(payload),
// 	});

// 	const jsonResponse = await response.json();
// 	return jsonResponse;
// }

// async function main() {
// 	const output = await query({
// 		inputs: {
// 			image: "cat.png",
// 			question: "What is in this image?",
// 		},
// 	});

// 	console.log(output);
// }

// main();
