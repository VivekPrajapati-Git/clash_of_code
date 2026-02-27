const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})