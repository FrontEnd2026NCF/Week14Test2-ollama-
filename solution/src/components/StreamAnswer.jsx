// bring in the useState hook from React
import { useState } from "react";

// where to send the question; comes from the .env file
const CHAT_URL = import.meta.env.VITE_CHAT_URL;
// the open-source model to use: Llama 3.2 from Meta
const MODEL = "llama3.2";

// read one line of the stream and return its new text
function readLine(line) {
  // useful lines start with "data: "; skip anything else
  if (!line.startsWith("data: ")) {
    // no new text on this line
    return "";
  }
  // cut off the "data: " part (6 characters)
  const jsonText = line.slice(6);
  // the very last line says [DONE]; it holds no text
  if (jsonText === "[DONE]") {
    // no new text on this line
    return "";
  }
  // turn the JSON text into an object
  const data = JSON.parse(jsonText);
  // take the first choice, as before
  const firstChoice = data.choices[0];
  // in a stream, the new piece is called delta
  const delta = firstChoice.delta;
  // the new words, if this piece has any
  const newText = delta.content;
  // some pieces carry no words; count those as ""
  if (!newText) {
    // no new text on this line
    return "";
  }
  // hand back the new words
  return newText;
}

// ask the model and show the answer as it is written
function StreamAnswer() {
  // state: the question in the box
  const [question, setQuestion] = useState("");
  // state: the answer so far; it grows as pieces arrive
  const [answer, setAnswer] = useState("");
  // state: is the answer still arriving?
  const [isStreaming, setIsStreaming] = useState(false);
  // state: what went wrong; empty means nothing did
  const [errorMessage, setErrorMessage] = useState("");

  // runs every time the question box changes
  function handleQuestionChange(event) {
    // read the text that is now in the box
    const typedText = event.target.value;
    // store it; React draws StreamAnswer again
    setQuestion(typedText);
  }

  // async: send the question, then read the answer piece by piece
  async function streamModel() {
    // the answer is on its way
    setIsStreaming(true);
    // clear the last answer
    setAnswer("");
    // clear the last error
    setErrorMessage("");

    // the rules for the model
    const systemMessage = { role: "system", content: "Answer in two sentences or fewer." };
    // the question from the box
    const userMessage = { role: "user", content: question };
    // the rules, then the question
    const messages = [systemMessage, userMessage];
    // the one change from AskOnce: stream is true
    const requestBody = { model: MODEL, messages: messages, stream: true };
    // turn the object into JSON text
    const bodyText = JSON.stringify(requestBody);
    // a POST request, as before
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    };

    // try: run these lines; if one fails, jump to catch
    try {
      // send the request; this resolves as soon as the first bytes arrive
      const response = await fetch(CHAT_URL, options);
      // check the status ourselves
      if (!response.ok) {
        // stop here and jump to catch with a message
        throw new Error("The server answered " + response.status);
      }
      // a reader lets us take the body one chunk at a time
      const reader = response.body.getReader();
      // a decoder turns raw bytes into text
      const decoder = new TextDecoder();
      // a chunk can end in the middle of a line; keep that part here
      let leftover = "";
      // the whole answer so far
      let fullText = "";

      // keep reading until the stream says it is done
      while (true) {
        // wait for the next chunk
        const chunk = await reader.read();
        // done is true once the server has sent everything
        if (chunk.done) {
          // leave the loop
          break;
        }
        // turn this chunk's bytes into text
        const piece = decoder.decode(chunk.value, { stream: true });
        // put the unfinished line from last time in front
        const text = leftover + piece;
        // split the text into lines
        const lines = text.split("\n");
        // the last line may be unfinished; save it for next time
        leftover = lines.pop();
        // go through each finished line
        for (const line of lines) {
          // pull the new words out of this line
          const newText = readLine(line);
          // add them to the answer so far
          fullText = fullText + newText;
        }
        // store the answer so far; React draws it right away
        setAnswer(fullText);
      }
    } catch (error) {
      // read the message out of the error
      const message = error.message;
      // store it so we can show it
      setErrorMessage(message);
    }
    // worked or failed, the stream is over
    setIsStreaming(false);
  }

  // runs when the button is clicked
  function handleAskClick() {
    // start the work; we do not wait for it here
    streamModel();
  }

  // return the box
  return (
    <section className="box">
      {/* the heading */}
      <h2>Streaming answer</h2>
      {/* the label for the question box */}
      <label htmlFor="stream-question">Your question</label>
      {/* the question box; React owns its value */}
      <input
        id="stream-question"
        value={question}
        onChange={handleQuestionChange}
      />
      {/* the button; turned off while the answer arrives */}
      <button onClick={handleAskClick} disabled={isStreaming}>
        Ask
      </button>
      {/* if something went wrong, say so */}
      {errorMessage !== "" && (
        <p className="error">Could not reach the model. ({errorMessage})</p>
      )}
      {/* the answer so far; it grows while we watch */}
      {answer !== "" && <p className="answer">{answer}</p>}
      {/* while words are still arriving, say so */}
      {isStreaming && <p className="status">Writing...</p>}
    </section>
  );
}

// make StreamAnswer available to other files
export default StreamAnswer;
