import os
from openai import OpenAI

# Please ensure you have stored your API Key in the environment variable VC_API_KEY
# Initialize the OpenAI client, reading your API Key from the environment variable
client = OpenAI(
    # This is the default path, you can configure it based on your business region
    base_url="https://vanchin.streamlake.ai/api/gateway/v1/endpoints",
    # Get your API Key from the environment variable
    api_key=os.environ.get("Hg4Su9ie6yoSHgTPJMwJ2_YUmeUwqOVwCXQgvJqFmc0")
)

# Single-round:
print("----- standard request -----")
completion = client.chat.completions.create(
    model="ep-sqvjsk-1760192177970975123",  # ep-sqvjsk-1760192177970975123 is your current agent application ID
    messages=[
        {"role": "system", "content": "You are an AI assistant"},
        {"role": "user", "content": "Please introduce the eight planets of the solar system"},
    ],
)
print(completion.choices[0].message.content)
