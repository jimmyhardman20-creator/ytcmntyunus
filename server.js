// Express Server with Socket.io for Real-time Memory Storage
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serving the static frontend (Build folder)
app.use(express.static(path.join(__dirname, 'dist')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// In-memory data structures
let comments = [];
let jobs = [];

// --- API Endpoints for Extension ---

// Extension can post comments here
app.post('/api/comments', (req, res) => {
    const { userName, text } = req.body;
    if (!userName || !text) return res.status(400).send("Missing data");

    const newComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        userName,
        text,
        timestamp: new Date()
    };
    
    comments.push(newComment);
    io.emit('new_comment', newComment); // Notify dashboard
    res.status(201).json(newComment);
});

// Extension checks for jobs here
app.get('/api/jobs', (req, res) => {
    res.json(jobs.filter(j => j.status === 'pending'));
});

// Dashboard adds a new job
app.post('/api/jobs', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).send("URL required");
    
    const newJob = { id: Date.now().toString(), url, status: 'pending' };
    jobs.push(newJob);
    io.emit('new_job', newJob);
    res.status(201).json(newJob);
});

// Dashboard clears data
app.delete('/api/comments', (req, res) => {
    comments = [];
    io.emit('clear_comments');
    res.send("Cleared successfully");
});

// Fallback to index.html for React routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});
