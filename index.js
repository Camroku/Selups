const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'put-a-really-secret-key-here',
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    req.session.username = req.body.username;
    res.redirect('/chat');
});

app.get('/chat', (req, res) => {
    if (req.session.username == null) {
        res.redirect('/login');
    }
    res.render('chat', { username: req.session.username });
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