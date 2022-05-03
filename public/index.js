const navigator = new Peer({
    host: 'localhost',
    port: 9000,
    path: '/navigator'
});
let islands_known = new Set()

console.log('Whispers.')