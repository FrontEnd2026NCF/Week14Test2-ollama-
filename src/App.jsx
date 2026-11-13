// import the stylesheet for this page
import "./App.css";
// bring in PageHeader from the components folder
import PageHeader from "./components/PageHeader.jsx";
// bring in AskOnce from the components folder
import AskOnce from "./components/AskOnce.jsx";
// bring in StreamAnswer from the components folder
import StreamAnswer from "./components/StreamAnswer.jsx";
// bring in LeagueAgent from the components folder
import LeagueAgent from "./components/LeagueAgent.jsx";

// define the App component as a function
function App() {
  // return one parent div that holds everything
  return (
    <div>
      {/* the header at the top of the page */}
      <PageHeader title="League Agent" subtitle="Week 14: calling an LLM from React" />
      {/* example 1: one question, one whole answer */}
      <AskOnce />
      {/* example 2: the answer arrives piece by piece */}
      <StreamAnswer />
      {/* example 3: an agent that can use a tool */}
      <LeagueAgent />
    </div>
  );
}

// make App available to main.jsx
export default App;
