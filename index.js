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

var users = {};
var messages = [];

app.get('/', (req, res) => {
    return res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.session.username != null) {
        return res.redirect('/chat');
    }
    res.render('login');
});

app.post('/login', (req, res) => {
    req.session.username = req.body.username;
    return res.redirect('/chat');
});

app.get('/chat', (req, res) => {
    if (req.session.username == null) {
        return res.redirect('/login');
    }
    res.render('chat', { username: req.session.username, messages: messages });
});

app.use(express.static('static'))

io.on('connection', (socket) => {
    var username = socket.request._query['username'];
    users[socket.id] = username;
    var msg = "User " + username + " has joined.";
    messages.push({id: "System", msg: msg});
    io.emit('chat message', msg, "System");
    socket.on('disconnect', () => {
        delete users[socket.id];
        var msg = "User " + username + " has left.";
        messages.push({id: "System", msg: msg});
        io.emit('chat message', msg, "System");
    });
    socket.on('chat message', (msg, id) => {
        messages.push({id: id, msg: msg});
        io.emit('chat message', msg, id);
    });
    socket.on('get online', () => {
        var userstr = Object.values(users).join(", ")
        io.to(socket.id).emit('sys message', "Online: " + userstr, "System");
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});