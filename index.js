const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/chat/:username', (req, res) => {
    res.render('chat', { username: req.params.username });
});

app.use(express.static('static'))

io.on('connection', (socket) => {
    var username = socket.request._query['username'];
    io.emit('chat message', "User " + username + " has joined.", "System");
    socket.on('disconnect', () => {
        io.emit('chat message', "User " + username + " has left.", "System");
    });
    socket.on('chat message', (msg, id) => {
        io.emit('chat message', msg, id);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});