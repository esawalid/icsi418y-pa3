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

        // the project lead can't be removed
        if (project.project_lead_id.toString() === userId) {
            return res.status(400).json({
                message: "The Project Lead cannot be removed from the project"
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