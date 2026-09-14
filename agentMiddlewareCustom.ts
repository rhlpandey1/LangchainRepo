import { createAgent, llmToolSelectorMiddleware, modelFallbackMiddleware, summarizationMiddleware, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";
const searchTool = tool((query) => {
    return `search results for "${query}" : Found 5 results and retruned`
},
    {
        name: "search",
        description: "search the internet for information",
        schema: z.object({
            query: z.string()
        })
    }

)
const emailTool = tool(({ recipient, subject }) => {
    `Email sent to ${recipient} with subject ${subject}`
}, {
    name: "send_email",
    description: "send an email to some one",
    schema: z.object({
        recipient: z.string(),
        subject: z.string()
    })
})
const getWeather = tool(
    (input) => {
        return `It's sunny in ${input.city}`;
    },
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
            city: z.string()
        })
    }
);
const agent = createAgent({
    model: "claude-haiku-4-5",
    tools: [searchTool, emailTool, getWeather],
    middleware: [
        modelFallbackMiddleware("claude-sonnet-4-6"),
        summarizationMiddleware({
            model: "claude-haiku-4-5",
            maxTokensBeforeSummary: 8000,
            messagesToKeep: 20
        }),
        llmToolSelectorMiddleware({
            model: "claude-haiku-4-5",
            maxTools: 2
        })
    ]
})

const response = await agent.invoke({
    messages: [{ role: "user", content: "what is the weather in tokyo and email to rhlpandey121@gmail.com with subject weather" }]
})
console.log(response)