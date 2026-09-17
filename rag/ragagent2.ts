import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import "dotenv/config"



const loader = new PDFLoader("D:/Prep_2026/ProjectDocs/nke-10k-2023.pdf")
const docs = await loader.load()

const textSplitter = new RecursiveCharacterTextSplitter(
    {
        chunkSize: 1000,
        chunkOverlap: 200
    }
)
const allSplits = await textSplitter.splitDocuments(docs)

const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text"
})

const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(allSplits);

const ragMiddleware = dynamicSystemPromptMiddleware(async (state) => {
    const userMessage = state.messages[0].content;
    const query = typeof userMessage === "string" ? userMessage : ""
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const docsContent = retrievedDocs.map((doc) => doc.pageContent
    ).join("\n\n");

    return `You are a helpful assistant. Use the following context from the document to answer the user's question:\n\n${docsContent}`;


});

const agent = createAgent({
    model: "claude-sonnet-4-6",
    tools: [],
    middleware: [ragMiddleware]

})
const result = await agent.invoke({
    messages: [{ role: "user", content: "What are the main factors that affect demand for NIKE's products, services, and experiences?" }]
})

console.log(result);




















