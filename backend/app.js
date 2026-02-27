const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// Routes
const presenceRoutes = require('./routes/presenceRoutes');
app.use('/api/presence', presenceRoutes);

app.get('/', (req, res) => {
    res.send("Hello world");
})

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})
