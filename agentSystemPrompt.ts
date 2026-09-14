import { context, createAgent, tool } from "langchain";
import "dotenv/config"
import * as z from "zod";

const systemPrompt = `You are an expert weather forecaster.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location first. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

const getUserLocation = tool((_, config) => {
    const user_id = config.context.user_id;
    //once you get the user ID , run a DB query to get the location based on the user id
    //or API call
    return user_id == "123" ? "Bangalore" : "New York"
},
    {
        name: "get_user_location",
        description: "Retrieve user info based on user location",
        schema: z.object({})

    });

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
const config = {
    //fetch the user ID from the token or something , we need to write a method for the same.
    context: { user_id: "123" }
}
const agent = createAgent({
    model: "claude-sonnet-4-6",
    tools: [getUserLocation, getWeather],
    systemPrompt
});

const response = await agent.invoke({
    messages: [{
        role: "user",
        content: "what is the weather outside?"
    }]
}, config);
console.log(response)