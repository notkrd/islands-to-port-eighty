const express = require('express')
const { ExpressPeerServer } = require('peer')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const port = 3000
const nav_port = 3000
const io = new Server(server)

app.set('view engine', 'pug')
app.use('/public', express.static('public'))

app.get('/', (_req, res, _next) => {
    res.render('index', {title: 'A Port', message: 'Welcome, friend! You may rest here'})
})

io.on('connection', (_socket) => {
    console.log('a user connected')
    io.sockets.emit('islands', Array.from(islands_known))
})

server.listen(port, () => {
    console.log(`Waiting, here, at port ${port}`)
})

const navigator = ExpressPeerServer(server, {
    debug: true,
    port: nav_port,
    path: ''
})

let islands_known = new Set()
app.use('/navigator', navigator)

navigator.on('connection', function (client)
{
    islands_known.add(client.id);
    console.log(`A route to island ${client.id} found`)
})

navigator.on('disconnect', function (client)
{
    islands_known.delete(client.id);
    console.log(`Island ${client.id} lost`)
    io.sockets.emit('islands', Array.from(islands_known))
    // console.log(islands_known)
})