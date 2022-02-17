const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./Routes/index.js')
const app = express()
app.use(bodyParser.json())
const port = 5000
//handle CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

//start using this routes
app.use('/', routes)

// require('./routes')(app)

app.listen(port, () => {
    console.log(`Server is running localhost:5000`)
})
