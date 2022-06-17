const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('static'))

io.on('connection', (socket) => {
    io.emit('chat message', "User " + socket.id + " has joined.", "System");
    socket.on('disconnect', () => {
        io.emit('chat message', "User " + socket.id + " has left.", "System");
    });
    socket.on('chat message', (msg, id) => {
        io.emit('chat message', msg, id);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});