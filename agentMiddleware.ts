import { createAgent, createMiddleware, initChatModel, tool } from "langchain";
import "dotenv/config";
import * as z from "zod";
import { MemorySaver } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";

const systemPrompt = `You are an expert weather forecaster who also speaks in a humorous way.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location first.
If you can tell from the question that they mean wherever they are, use the
get_user_location tool to find their location.`;

const getUserLocation = tool(
    (_, config) => {
        const user_id = config.context?.user_id;

        // Once you get the user ID, run a DB query
        // or API call to get the location.

        return user_id === "123" ? "Bangalore" : "New York";
    },
    {
        name: "get_user_location",
        description: "Retrieve the user's location based on their user ID",
        schema: z.object({})
    }
);

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

const baseModel = new ChatAnthropic({
    model: "claude-haiku-4-5"
})
const advancedModel = new ChatAnthropic({
    model: "claude-sonnet-4-5"
})
const dynamicModelSelection = createMiddleware({
    name: "DynamicModelSelection",
    wrapModelCall: (request, handler) => {
        const messageCount = request.messages.length;
        return handler({
            ...request,
            model: messageCount > 3 ? advancedModel : baseModel
        })
    }
});
const config = {
    configurable: {
        // Required by MemorySaver
        // Same thread_id = same conversation
        thread_id: "user-123"
    },

    context: {
        // Application-specific context available to tools
        user_id: "123"
    }
};

const responseFormat = z.object({
    humour_response: z.string(),
    weather_conditions: z.string()
});

//if message count is less than 3 then use cheaper model
const model = await initChatModel(
    "claude-sonnet-4-6",
    {
        temperature: 0.7,
        timeout: 30,
        max_tokens: 1000
    }
);

const checkpointer = new MemorySaver();

const agent = createAgent({
    model,
    tools: [getUserLocation, getWeather],
    systemPrompt,
    responseFormat,
    checkpointer,
    middleware: [dynamicModelSelection]
});


const response = await agent.invoke(
    {
        messages: [
            {
                role: "user",
                content: "What is the weather outside?"
            }
        ]
    },
    config
);

const response1 = await agent.invoke(
    {
        messages: [
            {
                role: "user",
                content: "What location did you just tell me about?"
            }
        ]
    },
    config
);


const response2 = await agent.invoke(
    {
        messages: [
            {
                role: "user",
                content: "Suggest me good places in that location"
            }
        ]
    },
    config
);

const response3 = await agent.invoke(
    {
        messages: [
            {
                role: "user",
                content: "Suggest me good places in that location"
            }
        ]
    },
    config
);
console.log(response3)