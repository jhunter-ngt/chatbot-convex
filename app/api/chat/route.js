import { NextResponse } from "next/server";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { PlaywrightWebBaseLoader } from "langchain/document_loaders/web/playwright";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createRetrieverTool } from "langchain/tools/retriever";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

export async function POST(req) {
	const client = createClient(url, privateKey);

	const body = await req.text();
	const userInput = JSON.parse(body).userInput;

	//CHECK IF STRING
	if (typeof userInput !== "string") {
		console.error("Error: The userInput must be a string.");
		return NextResponse.json({
			error: "The userInput must be a string.",
		});
	}

	try {
		// load documents
		const loader = new PlaywrightWebBaseLoader(
			"https://docs.smith.langchain.com/overview",
			{
				launchOptions: {
					headless: true,
				},
				gotoOptions: {
					waitUntil: "domcontentloaded",
				},
			}
		);

		const pdfLoader = new PDFLoader("app/documents/cdc_fitness.pdf", {
			splitPages: false,
		  });


		const docs = await loader.load();

		console.log("Load PDF documents");

		const pdfDocs = await pdfLoader.load();

		console.log("PDF loaded successfully");
		console.log(pdfDocs);

		// Fetch documents from Supabase table instead of loader
		const { data: documents, error } = await client.from("documents").select("*");


		// splitting into chunks
		const splitter = new RecursiveCharacterTextSplitter();
		const splitDocs = await splitter.splitDocuments(docs);

		// index documents, input into vector store
		const embeddings = new OpenAIEmbeddings();
		// const vectorstore = await MemoryVectorStore.fromDocuments(
		// 	splitDocs,
		// 	embeddings
		// );

		// Assuming you have a function to embed text into vectors
// const vector1 = embeddings.embedQuery("Text for Document 1");
// const vector2 = embeddings.embedQuery("Text for Document 2");

		// const vectorstore = new SupabaseVectorStore(client, "documents", "embedding");

		// const vectorstore = await SupabaseVectorStore.fromTexts(
		// 	['Hello world', 'Hello world', 'Hello world'],
		// 	[{ user_id: 2 }, { user_id: 1 }, { user_id: 3 }],
		// 	new OpenAIEmbeddings(),
		// 	{
		// 		client,
		// 		tableName: 'documents',
		// 		queryName: 'match_documents'
		// 	}
		// )

		  // Update the vector store with user input
		  const vectorstore = await SupabaseVectorStore.fromTexts(
			[userInput],  //  user input as  array
			[{ user_id: 1 }],  // adjust the user_id to what?
			new OpenAIEmbeddings(),
			{
			  client,
			  tableName: 'documents',
			  queryName: 'match_documents',
			}
		  )

// Ensure that 'embedQuery' is a method in the embeddings object
// if (typeof embeddings.embedQuery !== 'function') {
// 	console.error("Error: 'embedQuery' method not found in the embeddings object.");
// 	return NextResponse.json({
// 	  error: "'embedQuery' method not found in the embeddings object.",
// 	});
//   }


// Store vectors in the 'documents' table
// const { data } = await client
//   .from('documents')
//   .upsert([
//     { embedding: vector1, content: 'Document 1' },
//     { embedding: vector2, content: 'Document 2' },
//     // ... add more documents
//   ]);

//   const calculateSimilarity = (queryVector, documentVector) => {
// 	// Implement your similarity calculation logic here
//   };
  
  // Example usage:
  //const userInputVector = embeddings.embedQuery(userInput);
  //const similarDocuments = documents.filter(doc => calculateSimilarity(userInputVector, doc.embedding) > threshold);
	


		// Index documents into Supabase vector store
		//const supaResult = await vectorstore.similaritySearch(documents, embeddings);
  		const supaResult = await vectorstore.similaritySearch(userInput, 1, {
			user_id: 1,
		  })
		console.log(supaResult)
		
		// retriever
		const retriever = vectorstore.asRetriever();

		// creating prompt
		const historyAwarePrompt = ChatPromptTemplate.fromMessages([
			new MessagesPlaceholder("chat_history"),
			["user", "{input}"],
			[
				"user",
				"Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
			],
		]);

		// initialize retrieval chain
		const chatModel = new ChatOpenAI({});
		const historyAwareRetrieverChain = await createHistoryAwareRetriever({
			llm: chatModel,
			retriever,
			rephrasePrompt: historyAwarePrompt,
		});

		const chatHistory = [
			new HumanMessage("Can LangSmith help test my LLM applications?"),
			new AIMessage("Yes!"),
		];

		// call retriever chain
		await historyAwareRetrieverChain.invoke({
			chat_history: chatHistory,
			input: { userInput },
		});

		// create Retrieval Prompt with chat history
		const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
			[
				"system",
				"Answer the user's questions based on the below context:\n\n{context}",
			],
			new MessagesPlaceholder("chat_history"),
			["user", "{input}"],
		]);

		const historyAwareCombineDocsChain = await createStuffDocumentsChain({
			llm: chatModel, // llm model defined by langchain
			prompt: historyAwareRetrievalPrompt,
		});

		const conversationalRetrievalChain = await createRetrievalChain({
			retriever: historyAwareRetrieverChain,
			combineDocsChain: historyAwareCombineDocsChain,
		});

		const result = await conversationalRetrievalChain.invoke({
			chat_history: [
				new HumanMessage("Can LangSmith help test my LLM applications?"),
				new AIMessage("Yes!"),
			],
			input: userInput,
		});

		console.log(result.answer);

		return NextResponse.json({
			text: result.answer,
			type: "bot",
		});
	} catch (error) {
		console.log(error);
		return NextResponse.json({
			error,
		});
	}
}
