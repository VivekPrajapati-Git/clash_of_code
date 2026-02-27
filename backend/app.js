const express = require('express')
const app = express()
const cors = require('cors')

// MongoDB Connection
const connectMongo = require('./config/mongodb');
connectMongo();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// Routes
const presenceRoutes = require('./routes/presenceRoutes');
app.use('/api/presence', presenceRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

app.get('/', (req, res) => {
    res.send("Hello world");
})

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
