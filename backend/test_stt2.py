import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=os.getenv("GITHUB_TOKEN"),
)

print("Starting test...")
try:
    with open("test_audio.wav", "wb") as f:
        # A tiny valid wav block
        f.write(b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00w\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    
    with open("test_audio.wav", "rb") as f:
        audio_data = f.read()
        encoded_audio = base64.b64encode(audio_data).decode("utf-8")
        
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Please transcribe this audio."},
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": encoded_audio,
                            "format": "wav"
                        }
                    }
                ]
            }
        ],
        max_tokens=100
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error:", e)
finally:
    if os.path.exists("test_audio.wav"):
        os.remove("test_audio.wav")
