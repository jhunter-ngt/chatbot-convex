"use client";

import { useState, useEffect, useRef, useCallback, React } from "react";
import Chatbot from "./components/Chatbot/chatbot";
//import { useQuery } from "convex/react";
//import { api } from "../convex/_generated/api";

export default function Home() {
	//const tasks = useQuery(api.tasks.get);
	// Move state variables inside the component
	const [result, setResult] = useState(null);
	const [ready, setReady] = useState(null);

	// Create a reference to the worker object.
	const worker = useRef(null);

	// We use the `useEffect` hook to set up the worker as soon as the `Home` component is mounted.
	useEffect(() => {
		if (!worker.current) {
			// Create the worker if it does not yet exist.
			worker.current = new Worker(new URL("./worker.js", import.meta.url), {
				type: "module",
			});
		}

		// Create a callback function for messages from the worker thread.
		const onMessageReceived = (e) => {
			switch (e.data.status) {
				case "initiate":
					setReady(false);
					break;
				case "ready":
					setReady(true);
					break;
				case "complete":
					setResult(e.data.output[0]);
					break;
			}
		};

		// Attach the callback function as an event listener.
		worker.current.addEventListener("message", onMessageReceived);

		// Define a cleanup function for when the component is unmounted.
		return () =>
			worker.current.removeEventListener("message", onMessageReceived);
	}, []); // Empty dependency array to ensure the effect runs only once

	const classify = useCallback((text) => {
		if (worker.current) {
			worker.current.postMessage({ text });
		}
	}, []);

	return (
		<div>
			<title>Chatbot</title>
			<link />
			<meta name="description" content="NGT Chatbot" />
			<main>
				<Chatbot />
				<main className="flex min-h-screen flex-col items-center justify-center p-12">
					{/* convexDB */}
					{/* {tasks?.map(({ _id, text }) => (
						<div key={_id}>{text}</div>
					))} */}
					<h1 className="text-5xl font-bold mb-2 text-center">
						Transformers.js
					</h1>
					<h2 className="text-2xl mb-4 text-center">Next.js template</h2>

					<input
						className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4"
						type="text"
						placeholder="Enter text here"
						onInput={(e) => {
							classify(e.target.value);
						}}
					/>

					{ready !== null && (
						<pre className="bg-gray-100 p-2 rounded">
							{!ready || !result
								? "Loading..."
								: JSON.stringify(result, null, 2)}
						</pre>
					)}
				</main>
			</main>
		</div>
	);
}
