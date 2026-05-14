import sys
import os
import json
import subprocess
import wave
from vosk import Model, KaldiRecognizer

# Configuration
MODEL_PATH = os.path.join(os.getcwd(), "models", "vosk-model-small-cn-0.22")
# You can also use English model: vosk-model-small-en-us-0.15

def download_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}. Downloading small Chinese model...", file=sys.stderr)
        os.makedirs("models", exist_ok=True)
        import requests
        import zipfile
        url = "https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip"
        target_zip = os.path.join("models", "model.zip")
        
        response = requests.get(url, stream=True)
        with open(target_zip, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        with zipfile.ZipFile(target_zip, 'r') as zip_ref:
            zip_ref.extractall("models")
        
        os.remove(target_zip)
        print("Model downloaded and extracted.", file=sys.stderr)

def transcribe(file_path):
    if not os.path.exists(MODEL_PATH):
        download_model()
    
    model = Model(MODEL_PATH)
    
    # Preprocess audio with ffmpeg to 16kHz mono PCM
    # Vosk expects specific format
    process = subprocess.Popen(
        ['ffmpeg', '-loglevel', 'quiet', '-i', file_path,
         '-ar', '16000', '-ac', '1', '-f', 's16le', '-'],
        stdout=subprocess.PIPE
    )
    
    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    
    results = []
    while True:
        data = process.stdout.read(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            part_result = json.loads(rec.Result())
            results.append(part_result.get("text", ""))
    
    final_result = json.loads(rec.FinalResult())
    results.append(final_result.get("text", ""))
    
    return " ".join([r for r in results if r])

if __name__ == "__main__":
    # Set encoding for Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
    
    input_file = sys.argv[1]
    try:
        text = transcribe(input_file)
        print(json.dumps({"text": text}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
