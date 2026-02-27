const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({extended:True}))
app.use(cors())

app.get('/', (req,res) =>{
    res.send("Hello world");
})

app.listen(3000)