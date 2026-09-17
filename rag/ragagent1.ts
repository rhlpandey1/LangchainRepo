import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config"



const loader = new PDFLoader("D:/Prep_2026/ProjectDocs/nke-10k-2023.pdf")
const docs = await loader.load()
// console.log(docs.length);
// console.log(docs[0].pageContent);

const textSplitter = new RecursiveCharacterTextSplitter(
    {
        chunkSize: 1000,
        chunkOverlap: 200
    }
)
const allSplits = await textSplitter.splitDocuments(docs)
console.log(allSplits.length);

const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text"
})

const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(allSplits);

const results = await vectorStore.similaritySearch("When was Nike incorporated?");
console.log(results)
// const retriever = vectorStore.asRetriever(
//     {
//         searchType: "mmr",
//         searchKwargs: {
//             fetchK: 1,
//         }
//     }
// )

// console.log(retriever);






















