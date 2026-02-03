// Express Server with Socket.io - Fixed Worker Tracking Logic
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Static file serving - 'dist' folder check
const publicPath = path.join(__dirname, 'dist');
app.use(express.static(publicPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Memory stores
let comments = [];
let jobs = [];
let activeWorkers = {}; // Key: socket.id, Value: worker info

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Dashboard connect hole existing data pathano
    socket.emit('worker_update', Object.values(activeWorkers));
    socket.emit('initial_jobs', jobs);

    // Worker registration logic
    socket.on('register_worker', (data) => {
        console.log('Worker Registered:', data.name);
        activeWorkers[socket.id] = {
            id: socket.id,
            name: data.name || 'Anonymous Worker',
            status: 'online',
            connectedAt: new Date()
        };
        // Sobai ke update pathano
        io.emit('worker_update', Object.values(activeWorkers));
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        if (activeWorkers[socket.id]) {
            console.log('Worker Offline:', activeWorkers[socket.id].name);
            delete activeWorkers[socket.id];
            io.emit('worker_update', Object.values(activeWorkers));
        }
    });
});

// --- API for Extension Data Post ---
app.post('/api/comments', (req, res) => {
    const { userName, text, workerId } = req.body;
    if (!userName || !text) return res.status(400).send("Data missing");

    const newComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        userName,
        text,
        workerId: workerId || 'Unknown',
        timestamp: new Date()
    };
    
    comments.push(newComment);
    io.emit('new_comment', newComment); 
    res.status(201).json(newComment);
});

// Job management APIs
app.post('/api/jobs', (req, res) => {
    const { url } = req.body;
    const newJob = { id: Date.now().toString(), url, status: 'pending' };
    jobs.push(newJob);
    io.emit('new_job', newJob);
    res.status(201).json(newJob);
});

app.get('/api/jobs', (req, res) => {
    res.json(jobs.filter(j => j.status === 'pending'));
});

app.delete('/api/comments', (req, res) => {
    comments = [];
    io.emit('clear_comments');
    res.send("Dashboard Cleared");
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) res.status(500).send("Build folder 'dist' khuje pawa jachche na. Please run build script.");
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});
