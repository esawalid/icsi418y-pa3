import { useState } from "react";

// used for both creating and editing a story
// if a story is passed in, the form is in edit mode
function StoryForm({ projectId, members, getUserName, story, onSaved, onCancel }) {
    const [title, setTitle] = useState(story ? story.title : "");
    const [description, setDescription] = useState(story ? story.description : "");
    const [priority, setPriority] = useState(story ? story.priority : "");
    const [status, setStatus] = useState(story ? story.status : "To Do");
    const [assignedUserId, setAssignedUserId] = useState(
        story && story.assigned_user_id ? story.assigned_user_id : ""
    );
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        // "" in the dropdown means Unassigned, which is null in the database
        const storyData = {
            title: title,
            description: description,
            priority: priority,
            assigned_user_id: assignedUserId === "" ? null : assignedUserId
        };

        let url = "http://localhost:9000/api/projects/" + projectId + "/stories";
        let method = "POST";

        if (story) {
            url = url + "/" + story._id;
            method = "PUT";
            storyData.status = status;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(storyData)
            });

            const data = await response.json();

            if (response.ok) {
                if (story) {
                    onSaved(data.message);
                } else {
                    setTitle("");
                    setDescription("");
                    setPriority("");
                    setAssignedUserId("");
                    setMessage(data.message);
                    onSaved("");
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div className="project-card">
            <h3>{story ? "Edit Story" : "New Story"}</h3>
            <form onSubmit={handleSubmit}>
                <label htmlFor="storyTitle">Title</label>
                <input
                    id="storyTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <label htmlFor="storyDescription">Description</label>
                <textarea
                    id="storyDescription"
                    placeholder="As a [type of user], I want [goal], so that [benefit]."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <label htmlFor="storyPriority">Priority</label>
                <select
                    id="storyPriority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option value="">-- Select a priority --</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>

                {/* status can only be changed when editing, new stories always start as To Do */}
                {story && (
                    <div>
                        <label htmlFor="storyStatus">Status</label>
                        <select
                            id="storyStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>
                )}

                <label htmlFor="storyAssigned">Assigned Member</label>
                <select
                    id="storyAssigned"
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                        <option key={member._id} value={member.user_id}>
                            {getUserName(member.user_id)}
                        </option>
                    ))}
                </select>

                <button type="submit">{story ? "Save Changes" : "Create Story"}</button>
                {story && (
                    <button type="button" onClick={onCancel}>Cancel</button>
                )}
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default StoryForm;