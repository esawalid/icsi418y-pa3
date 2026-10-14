import { useState, useEffect } from "react";

function CreateProject() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("");
    const [projectLeadId, setProjectLeadId] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    // load the registered users for the Project Lead dropdown
    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch("http://localhost:9000/api/users");
                const data = await response.json();

                if (response.ok) {
                    setUsers(data);
                } else {
                    setMessage(data.message);
                }
            } catch (error) {
                setMessage("Could not connect to the server");
            }
        }

        loadUsers();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                        status: status,
                        project_lead_id: projectLeadId
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Project created successfully");
                setName("");
                setDescription("");
                setStatus("");
                setProjectLeadId("");
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>Create Project</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="projectName">Project Name</label>
                <input
                    id="projectName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <label htmlFor="projectDescription">Description</label>
                <textarea
                    id="projectDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <label htmlFor="projectStatus">Status</label>
                <select
                    id="projectStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">-- Select a status --</option>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>

                <label htmlFor="projectLead">Project Lead</label>
                <select
                    id="projectLead"
                    value={projectLeadId}
                    onChange={(e) => setProjectLeadId(e.target.value)}
                >
                    <option value="">-- Select a user --</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.f_name} {user.l_name} ({user.username})
                        </option>
                    ))}
                </select>

                <button type="submit">Create Project</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default CreateProject;