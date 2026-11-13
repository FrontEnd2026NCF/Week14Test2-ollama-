// bring in the useState hook from React
import { useState } from "react";
// bring in the tool descriptions and the code that runs them
import { TOOLS, runTool } from "../agent/leagueTools.js";

// where to send the messages; comes from the .env file
const CHAT_URL = import.meta.env.VITE_CHAT_URL;
// the open-source model to use: Llama 3.2 from Meta
const MODEL = "llama3.2";
// stop after this many trips to the model, so the loop cannot run forever
const MAX_TURNS = 5;
// the rules for the agent
const RULES = "You answer questions about the 2025/26 Premier League. "
  + "Use the get_team_record tool for any team's results. "
  + "Answer in two sentences or fewer.";

// send the conversation so far; return the model's next message
async function callModel(messages) {
  // the body: the model, the conversation, and the tool list
  const requestBody = {
    model: MODEL,
    messages: messages,
    tools: TOOLS,
    stream: false,
  };
  // turn the object into JSON text
  const bodyText = JSON.stringify(requestBody);
  // a POST request, as in AskOnce
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyText,
  };
  // send it; wait for the response
  const response = await fetch(CHAT_URL, options);
  // check the status ourselves
  if (!response.ok) {
    // stop here and jump to the caller's catch
    throw new Error("The server answered " + response.status);
  }
  // read the body as JSON
  const data = await response.json();
  // take the first choice
  const firstChoice = data.choices[0];
  // hand back the model's message
  return firstChoice.message;
}

// show one step of the agent's work as a list item
function makeStepItem(step) {
  // return the list item
  return (
    <li key={step.id} className={step.kind}>
      {/* a short label, then the detail */}
      <strong>{step.label}</strong> {step.text}
    </li>
  );
}

// a small agent that answers Premier League questions with a tool
function LeagueAgent() {
  // state: the question in the box
  const [question, setQuestion] = useState("");
  // state: every step the agent has taken so far
  const [steps, setSteps] = useState([]);
  // state: is the agent still working?
  const [isWorking, setIsWorking] = useState(false);
  // state: what went wrong; empty means nothing did
  const [errorMessage, setErrorMessage] = useState("");

  // runs every time the question box changes
  function handleQuestionChange(event) {
    // read the text that is now in the box
    const typedText = event.target.value;
    // store it; React draws LeagueAgent again
    setQuestion(typedText);
  }

  // async: the agent loop
  async function runAgent() {
    // the agent is working
    setIsWorking(true);
    // clear the last error
    setErrorMessage("");
    // a plain list we add steps to, then copy into state
    const stepList = [];
    // clear the steps on screen
    setSteps([]);

    // add one step and show it right away
    function addStep(kind, label, text) {
      // the step's position doubles as its key
      const id = stepList.length;
      // put the new step on the end
      stepList.push({ id: id, kind: kind, label: label, text: text });
      // copy the list so React sees a new array
      const copy = stepList.slice();
      // store it; React draws the steps again
      setSteps(copy);
    }

    // the rules for the agent
    const systemMessage = { role: "system", content: RULES };
    // the question from the box
    const userMessage = { role: "user", content: question };
    // the conversation; it grows on every trip
    const messages = [systemMessage, userMessage];

    // try: run these lines; if one fails, jump to catch
    try {
      // the loop: at most MAX_TURNS trips to the model
      for (let turn = 1; turn <= MAX_TURNS; turn = turn + 1) {
        // ask the model what to do next
        const reply = await callModel(messages);
        // add its reply to the conversation
        messages.push(reply);
        // did it ask for any tools?
        const toolCalls = reply.tool_calls;
        // no tools: the reply is the final answer
        if (!toolCalls || toolCalls.length === 0) {
          // show the answer
          addStep("answer", "Answer:", reply.content);
          // stop the loop
          break;
        }
        // run each tool the model asked for
        for (const call of toolCalls) {
          // the model's request is under function
          const request = call.function;
          // the tool's name
          const toolName = request.name;
          // its arguments, as JSON text
          const argsText = request.arguments;
          // show what the model asked for
          addStep("tool", "Model asked for:", toolName + " " + argsText);
          // run the tool in our code; wait for the result
          const result = await runTool(call);
          // turn the result into JSON text for the model
          const resultText = JSON.stringify(result);
          // show what the tool found
          addStep("result", "Tool answered:", resultText);
          // the tool's answer, linked to the model's request by id
          const toolMessage = { role: "tool", tool_call_id: call.id, content: resultText };
          // add it to the conversation; the next trip will read it
          messages.push(toolMessage);
        }
        // on the last turn with no answer yet, say so
        if (turn === MAX_TURNS) {
          // show the stop
          addStep("stop", "Stopped:", "the agent used all " + MAX_TURNS + " turns");
        }
      }
    } catch (error) {
      // read the message out of the error
      const message = error.message;
      // store it so we can show it
      setErrorMessage(message);
    }
    // worked or failed, the agent is done
    setIsWorking(false);
  }

  // runs when the button is clicked
  function handleAskClick() {
    // start the work; we do not wait for it here
    runAgent();
  }

  // turn each step into a list item
  const stepItems = steps.map(makeStepItem);
  // return the box
  return (
    <section className="box">
      {/* the heading */}
      <h2>League agent</h2>
      {/* the label for the question box */}
      <label htmlFor="agent-question">Ask about a team</label>
      {/* the question box; React owns its value */}
      <input
        id="agent-question"
        value={question}
        onChange={handleQuestionChange}
      />
      {/* the button; turned off while the agent works */}
      <button onClick={handleAskClick} disabled={isWorking}>
        Ask the agent
      </button>
      {/* if something went wrong, say so */}
      {errorMessage !== "" && (
        <p className="error">Could not reach the model. ({errorMessage})</p>
      )}
      {/* every step, in order */}
      <ol className="steps">{stepItems}</ol>
      {/* while the agent works, say so */}
      {isWorking && <p className="status">Working...</p>}
    </section>
  );
}

// make LeagueAgent available to other files
export default LeagueAgent;
