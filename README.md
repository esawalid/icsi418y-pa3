# ICSI 418Y PA4

Project management app with user stories and a backlog, using React, Express, and MongoDB.

## How to run

Make a `.env` file in the `server` folder with:

```
MONGO_URI=your mongodb connection string
```

Start the backend:

```
cd server
npm install
node server.js
```

Start the frontend in another terminal:

```
cd client
npm install
npm run dev
```

then open http://localhost:5173

## Test data

1. Use Sign Up to create at least 3 users.
2. Use Create Project to make 2 projects with different Project Leads.
3. In Manage Members, add a nonlead member to each project. Have at least one user who is only in one of the projects.
4. In Backlog, pick a project and create stories. Make at least 5 stories across both projects.
5. Use Edit to set different statuses so there are stories in To Do, In Progress, and Done. Use all 3 priorities and have some assigned and some unassigned stories.