// bring in the useState hook from React
import { useState } from "react";

// where to send the question; comes from the .env file
const CHAT_URL = import.meta.env.VITE_CHAT_URL;
// the open-source model to use: Llama 3.2 from Meta
const MODEL = "llama3.2";

// ask the model one question and show the whole answer
function AskOnce() {
  // state: the question in the box
  const [question, setQuestion] = useState("");
  // state: the model's answer; empty until it arrives
  const [answer, setAnswer] = useState("");
  // state: are we waiting for the model?
  const [isLoading, setIsLoading] = useState(false);
  // state: what went wrong; empty means nothing did
  const [errorMessage, setErrorMessage] = useState("");

  // runs every time the question box changes
  function handleQuestionChange(event) {
    // read the text that is now in the box
    const typedText = event.target.value;
    // store it; React draws AskOnce again
    setQuestion(typedText);
  }

  // async: send the question and wait for the answer
  async function askModel() {
    // we are waiting now
    setIsLoading(true);
    // clear the last answer
    setAnswer("");
    // clear the last error
    setErrorMessage("");

    // the system message sets the rules for the model
    const systemMessage = { role: "system", content: "Answer in two sentences or fewer." };
    // the user message is the question from the box
    const userMessage = { role: "user", content: question };
    // the conversation so far: the rules, then the question
    const messages = [systemMessage, userMessage];
    // the body: which model, the messages, and no streaming
    const requestBody = { model: MODEL, messages: messages, stream: false };
    // fetch sends text, so turn the object into JSON text
    const bodyText = JSON.stringify(requestBody);
    // a POST request: we are sending data, not only asking for it
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    };

    // try: run these lines; if one fails, jump to catch
    try {
      // send the request; wait here until the response arrives
      const response = await fetch(CHAT_URL, options);
      // fetch does not fail on a 404, so check the status ourselves
      if (!response.ok) {
        // stop here and jump to catch with a message
        throw new Error("The server answered " + response.status);
      }
      // read the body as JSON; wait again
      const data = await response.json();
      // the answers come in a list called choices; take the first
      const firstChoice = data.choices[0];
      // the choice holds the model's message
      const replyMessage = firstChoice.message;
      // the message holds the text
      const replyText = replyMessage.content;
      // store it; React draws AskOnce again
      setAnswer(replyText);
    } catch (error) {
      // read the message out of the error
      const message = error.message;
      // store it so we can show it
      setErrorMessage(message);
    }
    // worked or failed, the wait is over
    setIsLoading(false);
  }

  // runs when the button is clicked
  function handleAskClick() {
    // start the work; we do not wait for it here
    askModel();
  }

  // return the box
  return (
    <section className="box">
      {/* the heading */}
      <h2>Ask once</h2>
      {/* the label for the question box */}
      <label htmlFor="ask-once-question">Your question</label>
      {/* the question box; React owns its value */}
      <input
        id="ask-once-question"
        value={question}
        onChange={handleQuestionChange}
      />
      {/* the button; turned off while we wait */}
      <button onClick={handleAskClick} disabled={isLoading}>
        Ask
      </button>
      {/* while we wait, say so */}
      {isLoading && <p>Thinking...</p>}
      {/* if something went wrong, say so */}
      {errorMessage !== "" && (
        <p className="error">Could not reach the model. ({errorMessage})</p>
      )}
      {/* the answer, once it arrives */}
      {answer !== "" && <p className="answer">{answer}</p>}
    </section>
  );
}

// make AskOnce available to other files
export default AskOnce;
