import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import CreateProject from "./components/CreateProject";
import "./App.css";

function App() {
    const [page, setPage] = useState("login");

    return (
        <div className="container">
            <h1>Project Manager</h1>

            <nav>
                <button onClick={() => setPage("login")}>Login</button>
                <button onClick={() => setPage("signup")}>Sign Up</button>
                <button onClick={() => setPage("createProject")}>Create Project</button>
            </nav>

            {page === "login" && <Login />}
            {page === "signup" && <Signup />}
            {page === "createProject" && <CreateProject />}
        </div>
    );
}

export default App;