import { tool, createAgent } from "langchain";
import "dotenv/config"
import * as z from "zod";

const getWeather = tool((input) => {
    return 'its sunny in $(input.city)';
},
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
            city: z.string()
        })
    },
);
const getTime = tool((input) => {
    return 'the time in $(input.city) is 5 PM';
},
    {
        name: "get_time",
        description: "Get the time of a given city",
        schema: z.object({
            city: z.string()
        })
    },
);

const agent = createAgent(
    {
        model: "claude-sonnet-4-6",
        tools: [getWeather, getTime]
    }
);

const response = await agent.invoke({
    //messages: [{ role: "human", content: "What is the time of New York?" }]
    messages: [{ role: "human", content: "What is the time and weather of New York?" }]
});
console.log(response)
// const output = response.messages[response.messages.length - 1]
// console.log(output.content)