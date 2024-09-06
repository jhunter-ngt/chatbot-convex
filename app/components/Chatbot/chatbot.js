"use client";
import React, { useState } from "react";
import {
	Grid,
	Typography,
	Box,
	Card,
	TextField,
	Button,
	IconButton,
	InputAdornment,
	CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { gray } from "@mui/material/colors";

export default function Chatbot() {
	const [userInput, setUserInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [chatHistory, setChatHistory] = useState([
		// Initial bot message
		{
			text: "Hello! I'm here to help you",
			type: "bot",
		},
	]);

	async function handleSend(e, userInput) {
		e.preventDefault();
		// Clear user input
		setChatHistory((prevChatHistory) => [
			...prevChatHistory,
			{ text: userInput, type: "user" },
		]);
		setUserInput("");
		setTimeout(() => {
			setLoading(true);
		}, 500);
		// if (userInput.trim() === "") return;

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userInput }),
			});
			const botResponse = await response.json();
			if (botResponse.text) {
				setChatHistory((prevChatHistory) => [
					...prevChatHistory,
					{ text: botResponse.text, type: "bot" }, // Add bot response to chat history
				]);
			} else {
				setChatHistory((prevChatHistory) => [
					...prevChatHistory,
					{
						text: "I'm sorry. I'm not able to respond. Please try again later.",
						type: "bot",
					}, // Add bot response to chat history
				]);
			}
		} catch (error) {
			console.error(error);
			return NextResponse.json({
				error: error.message || "An unexpected error occurred.",
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Grid container justifyContent={"center"} sx={{ textalign: "center" }}>
			<Grid item lg={5} md={8} sm={10} xs={10} my={6}>
				<Card
					variant="outlined"
					aligncontent="center"
					textalign="center"
					sx={{
						p: 6,
					}}
				>
					<Typography textalign="left">NextGenTek Chatbot</Typography>

					{/* Display chat history */}
					{chatHistory.map((message, index) => (
						<Grid
							key={index}
							container
							justifyContent={
								message.type === "bot" ? "flex-start" : "flex-end"
							}
							my={2}
							pt={2}
						>
							<Grid
								item
								lg={10}
								borderRadius={6}
								p={3}
								textalign={message.type === "bot" ? "left" : "right"}
								backgroundColor={message.type === "bot" ? "#E1E6E9" : "#e1bee7"}
								sx={{
									borderTopLeftRadius:
										message.type === "bot" || index === 0 ? "0px" : "20px",
									borderTopRightRadius:
										message.type === "user" ? "0px" : "20px",
								}}
							>
								{message.text}
							</Grid>
						</Grid>
					))}

					{/* User input TextField */}
					<Grid container justifyContent="flex-end" my={2} pt={2}>
						<Grid item lg={12}>
							<Box
								sx={{
									width: 500,
									maxWidth: "100%",
								}}
							>
								{/* Loading indicator */}
								{loading && (
									<Box display="flex" justifyContent="center" mb={4}>
										Loading...
									</Box>
								)}
								<form>
									<TextField
										fullWidth
										name="userInput"
										value={userInput}
										onChange={(e) => setUserInput(e.target.value)}
										variant="outlined"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleSend(e, userInput);
											}
										}}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														color="primary"
														aria-label="send"
														onClick={(e) => handleSend(e, userInput)}
													>
														<SendIcon />
													</IconButton>
												</InputAdornment>
											),
										}}
									/>
								</form>
							</Box>
						</Grid>
					</Grid>
				</Card>
			</Grid>
		</Grid>
	);
}
