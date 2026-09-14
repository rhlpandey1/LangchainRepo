import { MemorySaver } from "@langchain/langgraph";
import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools";
import { createAgent, initChatModel } from "langchain";
import { z } from "zod";
import "dotenv/config"
//import process from "process";
const SYSTEM_PROMPT = `You are a literary data assistant.


## Capabilities

- \`fetch_text_from_url\`: loads document text from a URL into the conversation.
Do not guess line counts or positions—ground them in tool results from the saved file.`;

const fetchTextFromUrl = tool(
    async ({ url }: { url: string }): Promise<string> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120_000);
        try {
            const resp = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; quickstart-research/1.0)",
                },
                signal: controller.signal,
            });
            if (!resp.ok) {
                return `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;
            }
            return await resp.text();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return `Fetch failed: ${msg}`;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    {
        name: "fetch_text_from_url",
        description: "Fetch the document from a URL.",
        schema: z.object({ url: z.string().url() }),
    },
);

const model = await initChatModel("claude-sonnet-4-6", {
    modelProvider: "anthropic",
    temperature: 0.5,
    timeout: 600_000,
    maxTokens: 25000,
    streaming: true,
});

const checkpointer = new MemorySaver();

async function main() {
    const agent = createAgent({
        model,
        tools: [fetchTextFromUrl],
        systemPrompt: SYSTEM_PROMPT,
        checkpointer,
    });

    const deepAgent = createDeepAgent({
        model,
        tools: [fetchTextFromUrl],
        systemPrompt: SYSTEM_PROMPT,
        checkpointer,
    });

    const content = `Project Gutenberg hosts a full plain-text copy of F. Scott Fitzgerald's The Great Gatsby.
    URL: https://www.gutenberg.org/files/64317/64317-0.txt

    Answer as much as you can:

    1) How many lines in the complete Gutenberg file contain the substring \`Gatsby\` (count lines, not occurrences within a line, each line ends with a line break).
    2) The 1-based line number of the first line in the file that contains \`Daisy\`.
    3) A two-sentence neutral synopsis.

    Do your best on (1) and (2). If at any point you realize you cannot **verify** an exact answer with
    your available tools and reasoning, do not fabricate numbers: use \`null\` for that field and spell out
    the limitation in \`how_you_computed_counts\`. If you encounter any errors please report what the error was and what the error message was.`;

    const agentResult = await agent.invoke(
        { messages: [{ role: "user", content }] },
        { configurable: { thread_id: "great-gatsby-lc" } },
    );
    const deepAgentResult = await deepAgent.invoke(
        { messages: [{ role: "user", content }] },
        { configurable: { thread_id: "great-gatsby-da" } },
    );

    const agentMessages = agentResult.messages;
    const deepMessages = deepAgentResult.messages;
    console.log(agentMessages[agentMessages.length - 1]!.contentBlocks);
    console.log("\n");
    console.log(deepMessages[deepMessages.length - 1]!.contentBlocks);
}

main().catch((err) => {
    console.error(err);
    //process.exitCode = 1;
});