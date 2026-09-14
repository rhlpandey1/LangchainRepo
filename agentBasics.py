import os

from dotenv import load_dotenv # type: ignore
from langchain.tools import tool # type: ignore
from langchain.agents import create_agent # type: ignore

load_dotenv()


@tool
def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return f"its sunny in {city}"


@tool
def get_time(city: str) -> str:
    """Get the time of a given city."""
    return f"the time in {city} is 5 PM"


agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[get_weather, get_time]
)


response = agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "What is the time and weather of New York?"
            }
        ]
    }
)

print(response)

# Get the final AI response
# output = response["messages"][-1]

# print(output.content)