console.log('Whispers.')
const super_secret = String(Math.random()).substring(2)
const isle_id = `island${super_secret}`
console.log(`I am ${isle_id}`)
const navigator_port = 3000

const navigator = new Peer(isle_id, {
    host: 'localhost',
    port: navigator_port,
    path: '/navigator'
})
let islands_known = new Set()

var socket = io()

socket.on('islands', function(isls) {
    console.log(isls)
    islands_known = new Set(isls)
    console.log(islands_known)
})