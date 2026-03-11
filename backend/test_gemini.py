import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Starting test for Gemini API...")

try:
    # A tiny valid wav block
    with open("test_audio.wav", "wb") as f:
        f.write(b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00w\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    
    print("Uploading file to Gemini...")
    audio_file = genai.upload_file(path="test_audio.wav")
    print(f"File uploaded successfully: {audio_file.name}")
    
    print("Generating content...")
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content([
        "Please provide a highly accurate, verbatim transcript of this audio file. Do not add any extra commentary or introductory text.",
        audio_file
    ])
    
    print("Success! Transcript snippet:")
    print(response.text[:200])
    
    print("Cleaning up stored file...")
    genai.delete_file(audio_file.name)
except Exception as e:
    print(f"Error: {e}")
finally:
    if os.path.exists("test_audio.wav"):
        os.remove("test_audio.wav")
