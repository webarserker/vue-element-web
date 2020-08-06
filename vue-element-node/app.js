const express = require('express')
const router = require('./router')
const fs = require('fs')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(cors())

app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

app.use('/', router)

const privateKey = fs.readFileSync('./https/4254871_luxingxing.xyz.key', 'utf-8')
const certificate = fs.readFileSync('./https/4254871_luxingxing.xyz.pem', 'utf-8')

const credentials = { key: privateKey, cert: certificate }

const httpServer = https.createServer(credentials, app)

// app.get('/', function(req, res) {
//     res.send('xxxxxx')
//     // throw new Error('error...')--------------------
// })

// function errorHandler(err, req, res, next) {
//     console.log(err)
//     res.status(400).json({
//         error: -1,
//         msg: err.toSting()
//     })
// }


// app.use(errorHandler)

const server =  app.listen(5000, function() {
    const {address, port } = server.address()
    // console.log(address, port)
    console.log('HTTP启动成功：http://%s:%s', address, port)
})

httpServer.listen(18009, function() {
    console.log('http server is running on: https://localhost"%s', 18009)
})