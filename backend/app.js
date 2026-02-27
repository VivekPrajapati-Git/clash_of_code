const express = require('express')
const app = express()
const cors = require('cors')

// MongoDB Connection
const connectMongo = require('./config/mongodb');
connectMongo();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// Routes
const presenceRoutes = require('./routes/presenceRoutes');
app.use('/api/presence', presenceRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);


const neo4jRoutes = require('./routes/neo4jRoutes');
app.use('/api/neo4j', neo4jRoutes);

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

const doctorRoutes = require('./routes/doctorRoutes');
app.use('/api/doctor', doctorRoutes);

const techRoutes = require('./routes/techRoutes');
app.use('/api/tech', techRoutes);

const interactionRoutes = require('./routes/interactionRoutes');
app.use('/api/interactions', interactionRoutes);

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all origins for the hackathon
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // Make 'io' attached to app so controllers can use it

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A client disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send("Hello world");
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
