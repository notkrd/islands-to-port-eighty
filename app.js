const express = require('express')
const { ExpressPeerServer } = require('peer')
const http = require('http')
const app = express()
const port = 3000
const nav_port = 9000
const server = http.createServer(app)
const navigator = ExpressPeerServer(server, { port: nav_port, path: '/navigator'})

app.set('view engine', 'pug')
app.use('/public', express.static('public'))
app.use(navigator)

app.get('/', (_req, res) => {
    res.render('index', {title: 'A Port', message: 'Welcome, friend! You may rest and eat here'})
})

app.listen(port, () => {
    console.log(`Waiting here at port ${port}`)
})
server.listen(nav_port)
