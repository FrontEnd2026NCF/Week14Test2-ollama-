// import the function that starts React
import { createRoot } from "react-dom/client";
// import the global styles
import "./index.css";
// import the App component from App.jsx
import App from "./App.jsx";

// find the empty div with id root
const rootElement = document.getElementById("root");
// create a React root attached to that div
const root = createRoot(rootElement);
// draw the App component inside the root
root.render(<App />);
