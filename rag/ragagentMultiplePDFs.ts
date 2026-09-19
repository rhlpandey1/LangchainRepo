import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import "dotenv/config"

const pdfPaths = [
    "D:/Prep_2026/ProjectDocs/nke-10k-2023.pdf",
    "D:/Prep_2026/ProjectDocs/Nike-Inc-2025_10K.pdf",
    "D:/Prep_2026/ProjectDocs/nike-growth-story.pdf"
]
const allDocs = []
for (const pdfPath of pdfPaths) {
    const loader = new PDFLoader(pdfPath)
    const docs = await loader.load()
    allDocs.push(...docs)
}

const textSplitter = new RecursiveCharacterTextSplitter(
    {
        chunkSize: 1000,
        chunkOverlap: 200
    }
)
const allSplits = await textSplitter.splitDocuments(allDocs)
console.log(allSplits.length);
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
    messages: [{ role: "user", content: "What was Nike revenue in 2023 & 2025 and from which town Nike has grown into world famous footwear?" }]
})

console.log(result);




















