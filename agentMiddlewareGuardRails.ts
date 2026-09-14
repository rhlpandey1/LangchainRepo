import {
    createAgent,
    piiMiddleware,
    tool,
} from "langchain";

import * as z from "zod";
import "dotenv/config";

// ----------------------------------------
// Search Tool
// ----------------------------------------

const searchTool = tool(
    (query) => {
        return `Search results for "${query}": Found 5 results and returned.`;
    },
    {
        name: "search",
        description: "Search the internet for information.",
        schema: z.object({
            query: z.string(),
        }),
    }
);

// ----------------------------------------
// Email Tool
// ----------------------------------------

const emailTool = tool(
    ({ recipient, subject }) => {
        return `Email sent to ${recipient} with subject "${subject}".`;
    },
    {
        name: "send_email",
        description: "Send an email to someone.",
        schema: z.object({
            recipient: z.string(),
            subject: z.string(),
        }),
    }
);

// ----------------------------------------
// Weather Tool
// ----------------------------------------

const getWeather = tool(
    ({ city }) => {
        return `It's sunny in ${city}.`;
    },
    {
        name: "get_weather",
        description: "Get the weather for a given city.",
        schema: z.object({
            city: z.string(),
        }),
    }
);

// ----------------------------------------
// Agent Configuration
// ----------------------------------------

const agent = createAgent({
    model: "anthropic:claude-haiku-4-5-20251001",

    tools: [
        searchTool,
        emailTool,
        getWeather,
    ],

    middleware: [

        // Built-in credit card detection
        piiMiddleware("credit_card", {
            strategy: "redact",
            applyToInput: true,
        }),

        // Custom SSN detection
        piiMiddleware("ssn", {
            detector: /\b\d{3}-\d{2}-\d{4}\b/g,
            strategy: "redact",
            applyToInput: true,
        }),

        // Custom phone number detection
        piiMiddleware("phone", {
            detector: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            strategy: "redact",
            applyToInput: true,
        }),
    ],
});

// ----------------------------------------
// Invoke Agent
// ----------------------------------------

// const response = await agent.invoke({
//     messages: [
//         {
//             role: "user",
//             content:
//                 "My card is 4532-1234-5678-9010. Is it Mastercard or Visa?",
//         },
//     ],
// });
const response = await agent.invoke({
    messages: [{ role: "user", content: "my ssn is 123-45-6789 & My email is gmail provider. is this good?" }]
})
console.log(response)
console.log(response.messages[1].content);