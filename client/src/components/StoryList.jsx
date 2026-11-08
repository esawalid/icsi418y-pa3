function StoryList({ stories, getUserName, onEdit, onDelete }) {
    if (stories.length === 0) {
        return <p>This project has no stories yet.</p>;
    }

    return (
        <div>
            {stories.map((story) => (
                <div key={story._id} className="project-card">
                    <h3>{story.title}</h3>
                    <p>{story.description}</p>
                    <p><strong>Priority:</strong> {story.priority}</p>
                    <p><strong>Status:</strong> {story.status}</p>
                    <p>
                        <strong>Assigned To:</strong>{" "}
                        {story.assigned_user_id ? getUserName(story.assigned_user_id) : "Unassigned"}
                    </p>
                    <button type="button" onClick={() => onEdit(story)}>Edit</button>
                    <button type="button" onClick={() => onDelete(story)}>Delete</button>
                </div>
            ))}
        </div>
    );
}

export default StoryList;