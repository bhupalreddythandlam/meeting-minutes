import os
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
        f.write(b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00w\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00") # Dummy empty wav
    
    with open("test_audio.wav", "rb") as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f
        )
    print("Success:", transcript)
except Exception as e:
    print("Error:", e)
finally:
    if os.path.exists("test_audio.wav"):
        os.remove("test_audio.wav")
