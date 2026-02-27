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

app.get('/', (req, res) => {
    res.send("Hello world");
})

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
