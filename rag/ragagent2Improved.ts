import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import {
    createAgent,
    dynamicSystemPromptMiddleware
} from "langchain";
import "dotenv/config";


const loader = new PDFLoader(
    "D:/Prep_2026/ProjectDocs/nke-10k-2023.pdf"
);

const docs = await loader.load();


const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
});

const allSplits = await textSplitter.splitDocuments(docs);

console.log("Total chunks:", allSplits.length);


const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text"
});


const vectorStore = new MemoryVectorStore(embeddings);

await vectorStore.addDocuments(allSplits);


const ragMiddleware = dynamicSystemPromptMiddleware(async (state) => {

    // Get latest user message
    const userMessage =
        state.messages[state.messages.length - 1].content;

    const query =
        typeof userMessage === "string"
            ? userMessage
            : "";

    console.log("\nQUESTION:");
    console.log(query);


    // Retrieve top 5 chunks
    const retrievedDocs =
        await vectorStore.similaritySearch(query, 5);


    // Debug retrieval
    console.log("\n========== RETRIEVED DOCUMENTS ==========");

    retrievedDocs.forEach((doc, index) => {

        console.log(`\n--- Document ${index + 1} ---`);

        console.log("Metadata:");
        console.log(doc.metadata);

        console.log("Content:");
        console.log(doc.pageContent);
    });


    const docsContent = retrievedDocs
        .map((doc) => doc.pageContent)
        .join("\n\n");


    return `You are a helpful assistant.

Answer the user's question using ONLY the context provided below.

If the answer is not present in the context, say:
"I don't know based on the provided document."

Context:
${docsContent}

Question:
${query}

Answer:`;
});


const agent = createAgent({
    model: "claude-sonnet-4-6",
    tools: [],
    middleware: [ragMiddleware]
});


const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "When was Nike incorporated?"
        }
    ]
});


console.log("\n========== FINAL RESULT ==========");
console.log(result);