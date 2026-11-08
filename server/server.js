require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("pa2");
const usersCollection = db.collection("users");
const projectsCollection = db.collection("projects");
const membershipsCollection = db.collection("projectMemberships");
const storiesCollection = db.collection("userStories");

const priorities = ["High", "Medium", "Low"];
const storyStatuses = ["To Do", "In Progress", "Done"];

app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

// signup and login from PA2

app.post("/signup", async (req, res) => {
    const f_name = req.body.f_name;
    const l_name = req.body.l_name;
    const username = req.body.username;
    const password = req.body.password;

    if (!f_name || !l_name || !username || !password) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    try {
        const existingUser = await usersCollection.findOne({
            username: username
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        const user = {
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        };

        await usersCollection.insertOne(user);

        res.status(201).json({
            message: "User created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    try {
        const user = await usersCollection.findOne({
            username: username
        });

        if (!user) {
            return res.status(401).json({
                message: "Username does not exist"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Login successful"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// get all users

app.get("/api/users", async (req, res) => {
    try {
        // don't send passwords to the frontend
        const users = await usersCollection.find(
            {},
            { projection: { password: 0 } }
        ).toArray();

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// projects

app.post("/api/projects", async (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const status = req.body.status;
    const projectLeadId = req.body.project_lead_id;

    if (!name || !description || !status || !projectLeadId) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    if (!ObjectId.isValid(projectLeadId)) {
        return res.status(400).json({
            message: "Invalid Project Lead"
        });
    }

    try {
        const leadId = new ObjectId(projectLeadId);

        const lead = await usersCollection.findOne({
            _id: leadId
        });

        if (!lead) {
            return res.status(404).json({
                message: "Selected Project Lead does not exist"
            });
        }

        const project = {
            name: name,
            description: description,
            status: status,
            project_lead_id: leadId
        };

        const result = await projectsCollection.insertOne(project);

        // the project lead is also a member of the project
        await membershipsCollection.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        res.status(201).json({
            message: "Project created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/api/projects", async (req, res) => {
    try {
        const projects = await projectsCollection.find({}).toArray();

        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// project members

app.get("/api/projects/:projectId/members", async (req, res) => {
    const projectId = req.params.projectId;

    if (!ObjectId.isValid(projectId)) {
        return res.status(400).json({
            message: "Invalid project id"
        });
    }

    try {
        const project = await projectsCollection.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const members = await membershipsCollection.find({
            project_id: new ObjectId(projectId)
        }).toArray();

        res.status(200).json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/api/projects/:projectId/members", async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.body.user_id;

    if (!userId) {
        return res.status(400).json({
            message: "Please select a user"
        });
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return res.status(400).json({
            message: "Invalid project or user id"
        });
    }

    try {
        const project = await projectsCollection.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const user = await usersCollection.findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const existingMembership = await membershipsCollection.findOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(userId)
        });

        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this project"
            });
        }

        await membershipsCollection.insertOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(userId)
        });

        res.status(201).json({
            message: "Member added successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.params.userId;

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return res.status(400).json({
            message: "Invalid project or user id"
        });
    }

    try {
        const project = await projectsCollection.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const user = await usersCollection.findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const membership = await membershipsCollection.findOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(userId)
        });

        if (!membership) {
            return res.status(404).json({
                message: "User is not a member of this project"
            });
        }

        // the project lead can't be removed
        if (project.project_lead_id.toString() === userId) {
            return res.status(409).json({
                message: "The Project Lead cannot be removed from the project"
            });
        }

        // can't remove someone who still has stories in this project (Done stories count too)
        const assignedStory = await storiesCollection.findOne({
            project_id: new ObjectId(projectId),
            assigned_user_id: new ObjectId(userId)
        });

        if (assignedStory) {
            return res.status(409).json({
                message: "Reassign, unassign, or delete this member's stories before removing them from the project."
            });
        }

        await membershipsCollection.deleteOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(userId)
        });

        res.status(200).json({
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// user stories

// checks title, description, and priority
// returns an error message, or null if everything is ok
function checkStoryFields(title, description, priority) {
    if (typeof title !== "string" || title.trim() === "") {
        return "Title is required";
    }

    if (typeof description !== "string" || description.trim() === "") {
        return "Description is required";
    }

    if (!priorities.includes(priority)) {
        return "Priority must be High, Medium, or Low";
    }

    return null;
}

// makes sure the assigned user exists and is a member of the project
// returns an error object, or null if the assignment is ok
async function checkAssignedUser(projectId, assignedUserId) {
    const user = await usersCollection.findOne({
        _id: assignedUserId
    });

    if (!user) {
        return { status: 404, message: "Assigned user does not exist" };
    }

    const membership = await membershipsCollection.findOne({
        project_id: projectId,
        user_id: assignedUserId
    });

    if (!membership) {
        return { status: 400, message: "Assigned user is not a member of this project" };
    }

    return null;
}

app.get("/api/projects/:projectId/stories", async (req, res) => {
    const rawProjectId = req.params.projectId;

    if (!ObjectId.isValid(rawProjectId)) {
        return res.status(400).json({
            message: "Invalid project id"
        });
    }

    const projectId = new ObjectId(rawProjectId);

    try {
        const project = await projectsCollection.findOne({
            _id: projectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const stories = await storiesCollection
            .find({ project_id: projectId })
            .toArray();

        res.status(200).json(stories);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/api/projects/:projectId/stories", async (req, res) => {
    const rawProjectId = req.params.projectId;
    const title = req.body.title;
    const description = req.body.description;
    const priority = req.body.priority;
    const rawAssignedId = req.body.assigned_user_id;

    if (!ObjectId.isValid(rawProjectId)) {
        return res.status(400).json({
            message: "Invalid project id"
        });
    }

    const projectId = new ObjectId(rawProjectId);

    const fieldError = checkStoryFields(title, description, priority);

    if (fieldError) {
        return res.status(400).json({
            message: fieldError
        });
    }

    // null means Unassigned
    let assignedUserId = null;

    if (rawAssignedId !== null && rawAssignedId !== undefined) {
        if (typeof rawAssignedId !== "string" || !ObjectId.isValid(rawAssignedId)) {
            return res.status(400).json({
                message: "Invalid assigned user"
            });
        }

        assignedUserId = new ObjectId(rawAssignedId);
    }

    try {
        const project = await projectsCollection.findOne({
            _id: projectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (assignedUserId) {
            const assignError = await checkAssignedUser(projectId, assignedUserId);

            if (assignError) {
                return res.status(assignError.status).json({
                    message: assignError.message
                });
            }
        }

        // build the story ourselves instead of inserting req.body
        const story = {
            project_id: projectId,
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: "To Do",
            assigned_user_id: assignedUserId
        };

        await storiesCollection.insertOne(story);

        res.status(201).json({
            message: "Story created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.put("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    const rawProjectId = req.params.projectId;
    const rawStoryId = req.params.storyId;
    const title = req.body.title;
    const description = req.body.description;
    const priority = req.body.priority;
    const status = req.body.status;
    const rawAssignedId = req.body.assigned_user_id;

    if (!ObjectId.isValid(rawProjectId) || !ObjectId.isValid(rawStoryId)) {
        return res.status(400).json({
            message: "Invalid project or story id"
        });
    }

    const projectId = new ObjectId(rawProjectId);
    const storyId = new ObjectId(rawStoryId);

    const fieldError = checkStoryFields(title, description, priority);

    if (fieldError) {
        return res.status(400).json({
            message: fieldError
        });
    }

    if (!storyStatuses.includes(status)) {
        return res.status(400).json({
            message: "Status must be To Do, In Progress, or Done"
        });
    }

    let assignedUserId = null;

    if (rawAssignedId !== null && rawAssignedId !== undefined) {
        if (typeof rawAssignedId !== "string" || !ObjectId.isValid(rawAssignedId)) {
            return res.status(400).json({
                message: "Invalid assigned user"
            });
        }

        assignedUserId = new ObjectId(rawAssignedId);
    }

    try {
        const project = await projectsCollection.findOne({
            _id: projectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (assignedUserId) {
            const assignError = await checkAssignedUser(projectId, assignedUserId);

            if (assignError) {
                return res.status(assignError.status).json({
                    message: assignError.message
                });
            }
        }

        // use both ids so a story can only be edited through its own project
        const storyQuery = {
            _id: storyId,
            project_id: projectId
        };

        const updates = {
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: status,
            assigned_user_id: assignedUserId
        };

        const result = await storiesCollection.updateOne(
            storyQuery,
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Story not found in this project"
            });
        }

        res.status(200).json({
            message: "Story updated successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.delete("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    const rawProjectId = req.params.projectId;
    const rawStoryId = req.params.storyId;

    if (!ObjectId.isValid(rawProjectId) || !ObjectId.isValid(rawStoryId)) {
        return res.status(400).json({
            message: "Invalid project or story id"
        });
    }

    try {
        const result = await storiesCollection.deleteOne({
            _id: new ObjectId(rawStoryId),
            project_id: new ObjectId(rawProjectId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Story not found in this project"
            });
        }

        res.status(200).json({
            message: "Story deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

connectDatabase();

app.listen(9000, () => {
    console.log("Server running on port 9000");
});