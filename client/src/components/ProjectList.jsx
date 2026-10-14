import { useState, useEffect } from "react";

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    // load the projects and users when this page opens
    useEffect(() => {
        async function loadData() {
            try {
                const projectsResponse = await fetch("http://localhost:9000/api/projects");
                const projectsData = await projectsResponse.json();

                const usersResponse = await fetch("http://localhost:9000/api/users");
                const usersData = await usersResponse.json();

                if (projectsResponse.ok && usersResponse.ok) {
                    setProjects(projectsData);
                    setUsers(usersData);
                } else {
                    setMessage("Could not load projects");
                }
            } catch (error) {
                setMessage("Could not connect to the server");
            }
        }

        loadData();
    }, []);

    // project_lead_id is just an id, so find the matching user to show their name
    function getLeadName(leadId) {
        const lead = users.find((user) => user._id === leadId);

        if (lead) {
            return lead.f_name + " " + lead.l_name + " (" + lead.username + ")";
        }

        return "Unknown user";
    }

    return (
        <div>
            <h2>Projects</h2>

            {projects.length === 0 && !message && <p>No projects yet.</p>}

            {projects.map((project) => (
                <div key={project._id} className="project-card">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                    <p><strong>Project Lead:</strong> {getLeadName(project.project_lead_id)}</p>
                </div>
            ))}

            {message && <p>{message}</p>}
        </div>
    );
}

export default ProjectList;