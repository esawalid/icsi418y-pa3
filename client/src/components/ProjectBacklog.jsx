import { useState, useEffect } from "react";
import StoryForm from "./StoryForm";
import StoryList from "./StoryList";

function ProjectBacklog() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [stories, setStories] = useState([]);
    const [members, setMembers] = useState([]);
    const [editingStory, setEditingStory] = useState(null);
    const [message, setMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    // load the projects and users once when the page opens
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

    // load the stories and members whenever the project changes or the backlog needs a refresh
    useEffect(() => {
        if (!selectedProjectId) {
            return;
        }

        // if the user switches projects before this finishes, ignore the old response
        let ignore = false;

        async function loadBacklog() {
            try {
                const storiesResponse = await fetch(
                    "http://localhost:9000/api/projects/" + selectedProjectId + "/stories"
                );
                const storiesData = await storiesResponse.json();

                const membersResponse = await fetch(
                    "http://localhost:9000/api/projects/" + selectedProjectId + "/members"
                );
                const membersData = await membersResponse.json();

                if (ignore) {
                    return;
                }

                if (storiesResponse.ok && membersResponse.ok) {
                    setStories(storiesData);
                    setMembers(membersData);
                } else {
                    setMessage("Could not load the backlog");
                }
            } catch (error) {
                if (!ignore) {
                    setMessage("Could not connect to the server");
                }
            }
        }

        loadBacklog();

        return () => {
            ignore = true;
        };
    }, [selectedProjectId, reloadCount]);

    function refreshBacklog() {
        setReloadCount(reloadCount + 1);
    }

    function handleProjectChange(e) {
        // clear everything from the old project
        setSelectedProjectId(e.target.value);
        setStories([]);
        setMembers([]);
        setEditingStory(null);
        setMessage("");
    }

    function getUserName(userId) {
        const user = users.find((u) => u._id === userId);

        if (user) {
            return user.f_name + " " + user.l_name + " (" + user.username + ")";
        }

        return "Unknown user";
    }

    function handleSaved(savedMessage) {
        setEditingStory(null);
        setMessage(savedMessage);
        refreshBacklog();
    }

    function handleEdit(story) {
        setEditingStory(story);
        setMessage("");
    }

    async function handleDelete(story) {
        const confirmed = window.confirm("Delete the story \"" + story.title + "\"?");

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + selectedProjectId + "/stories/" + story._id,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                // close the edit form if it was showing the deleted story
                if (editingStory && editingStory._id === story._id) {
                    setEditingStory(null);
                }

                refreshBacklog();
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>Project Backlog</h2>

            <label htmlFor="backlogProject">Select a Project</label>
            <select
                id="backlogProject"
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

            {!selectedProjectId && <p>Select a project to see its backlog.</p>}

            {selectedProjectId && (
                <div>
                    {/* the key makes React start a fresh form for each project or story */}
                    {editingStory ? (
                        <StoryForm
                            key={editingStory._id}
                            projectId={selectedProjectId}
                            members={members}
                            getUserName={getUserName}
                            story={editingStory}
                            onSaved={handleSaved}
                            onCancel={() => setEditingStory(null)}
                        />
                    ) : (
                        <StoryForm
                            key={selectedProjectId}
                            projectId={selectedProjectId}
                            members={members}
                            getUserName={getUserName}
                            story={null}
                            onSaved={handleSaved}
                        />
                    )}

                    {message && <p>{message}</p>}

                    <h3>Stories</h3>
                    <StoryList
                        stories={stories}
                        getUserName={getUserName}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            )}
        </div>
    );
}

export default ProjectBacklog;