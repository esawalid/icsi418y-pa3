import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
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
                <button onClick={() => setPage("projects")}>View Projects</button>
                <button onClick={() => setPage("members")}>Manage Members</button>
            </nav>

            {page === "login" && <Login />}
            {page === "signup" && <Signup />}
            {page === "createProject" && <CreateProject />}
            {page === "projects" && <ProjectList />}
            {page === "members" && <ProjectMembers />}
        </div>
    );
}

export default App;