# League Agent

A React app that calls Llama 3.2, an open-source AI model, running on your own computer through Ollama.

## 1. Install Ollama (once)

**Mac**
1. Go to ollama.com/download and click **Download for macOS**
2. Open the download and drag **Ollama** into your **Applications** folder

Or, in Terminal: `curl -fsSL https://ollama.com/install.sh | sh`

**Windows**
1. Go to ollama.com/download and click **Download for Windows**
2. Run the installer (`OllamaSetup.exe`)

## 2. Download the model (once, about 2 GB)

In a terminal (Terminal on Mac, PowerShell on Windows):

```
ollama pull llama3.2
```

## 3. Start Ollama (every time you use the app)

**Mac:** open **Ollama** from your Applications folder, or run this in Terminal:

```
open -a Ollama
```

**Windows:** open **Ollama** from the Start menu. Its icon appears in the system tray at the bottom right.

**Check it is running:** open http://localhost:11434 in your browser. It should say **Ollama is running**.

## 4. Set up the app (once)

Copy `.env.example` and name the copy `.env`. The app will not work without this file.

**Mac:** `cp .env.example .env`
**Windows (PowerShell):** `copy .env.example .env`

## 5. Run the app

```
npm install
npm run dev
```

Open the address it prints, usually http://localhost:5173.

## If something goes wrong

- **"Could not reach the model. (Failed to fetch)":** Ollama is not running. Go back to step 3.
- **"Could not reach the model. (The server answered 404)":** the `.env` file is missing, or you made it while the app was running. Do step 4, stop the app with Ctrl + C, and run `npm run dev` again.