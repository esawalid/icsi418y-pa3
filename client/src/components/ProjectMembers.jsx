import { useState, useEffect } from "react";

function ProjectMembers() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [userToAdd, setUserToAdd] = useState("");
    const [message, setMessage] = useState("");

    // load the projects and users for the dropdowns
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
                    setMessage("Could not load projects and users");
                }
            } catch (error) {
                setMessage("Could not connect to the server");
            }
        }

        loadData();
    }, []);

    async function loadMembers(projectId) {
        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + projectId + "/members"
            );
            const data = await response.json();

            if (response.ok) {
                setMembers(data);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    function handleProjectChange(e) {
        const projectId = e.target.value;

        setSelectedProjectId(projectId);
        setMembers([]);
        setMessage("");

        if (projectId) {
            loadMembers(projectId);
        }
    }

    async function handleAddMember(event) {
        event.preventDefault();

        if (!userToAdd) {
            setMessage("Please select a user to add");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + selectedProjectId + "/members",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: userToAdd
                    })
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setUserToAdd("");
                loadMembers(selectedProjectId);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    async function handleRemoveMember(userId) {
        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + selectedProjectId + "/members/" + userId,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                loadMembers(selectedProjectId);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    // memberships only store ids, so look up the user to show a name
    function getUserName(userId) {
        const user = users.find((u) => u._id === userId);

        if (user) {
            return user.f_name + " " + user.l_name + " (" + user.username + ")";
        }

        return "Unknown user";
    }

    const selectedProject = projects.find((project) => project._id === selectedProjectId);

    return (
        <div>
            <h2>Project Members</h2>

            <label htmlFor="selectProject">Select a Project</label>
            <select
                id="selectProject"
                value={selectedProjectId}
                onChange={handleProjectChange}
            >
                <option value="">-- Select a project --</option>
                {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                        {project.name}
                    </option>
                ))}
            </select>

            {selectedProject && (
                <div>
                    <h3>Members of {selectedProject.name}</h3>
                    <ul>
                        {members.map((member) => (
                            <li key={member._id}>
                                {getUserName(member.user_id)}
                                {member.user_id === selectedProject.project_lead_id ? (
                                    <span> - Project Lead (cannot be removed)</span>
                                ) : (
                                    <button
                                        type="button"
                                        className="remove-button"
                                        onClick={() => handleRemoveMember(member.user_id)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={handleAddMember}>
                        <label htmlFor="addUser">Add a Member</label>
                        <select
                            id="addUser"
                            value={userToAdd}
                            onChange={(e) => setUserToAdd(e.target.value)}
                        >
                            <option value="">-- Select a user --</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.f_name} {user.l_name} ({user.username})
                                </option>
                            ))}
                        </select>

                        <button type="submit">Add Member</button>
                    </form>
                </div>
            )}

            {message && <p>{message}</p>}
        </div>
    );
}

export default ProjectMembers;