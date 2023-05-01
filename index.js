const MessageModel = require("./models/message.js");
const session = require('express-session');
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const express = require('express');
const http = require('http');

// MessageModel.deleteMany({}).then(console.log)
const app = express();
const server = http.createServer(app);
const io = new Server(server);
require("dotenv").config();
const { PORT = 3000, MONGO_DB_URL } = process.env;
const users = {};

mongoose.connect(MONGO_DB_URL);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'put-a-really-secret-key-here',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static('static'));


app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => req.session.username
    ? res.redirect('/chat')
    : res.render('login'));

app.post('/login', (req, res) => {
    // TODO: auth with req.body.password
    req.session.username = req.body.username;
    return res.redirect('/chat');
});

app.get('/logout', (req, res) => {
    delete req.session.username;
    return res.redirect('/');
});

app.get('/chat', async (req, res) => {
    if (!req.session.username)
        return res.redirect('/login');

    res.render('chat', { username: req.session.username, messages: await MessageModel.find() });
});


io.on('connection', async socket => {
    const { username } = socket.request._query;
    users[socket.id] = username;

    io.emit('chat message', await MessageModel.create({ msg: `User ${username} has joined.` }));

    socket.on('disconnect', async () => {
        delete users[socket.id];
        io.emit('chat message', await MessageModel.create({ msg: `User ${username} has left.` }));
    });
    socket.on('chat message', async m => io.emit('chat message', await MessageModel.create(m)));

    socket.on('bot', async args => {
        // example args = ["/bot","online",...String];
        const command = args.shift();
        // command = "/bot", args  = ["online", ...String];

        let msg = "Unknown command";
        if (command === "/who")
            msg = `Online: ${Object.values(users).join(", ")}`;
        else if (command === "/ping")
            msg = `Your ping to server: ${Date.now() - args[0]}ms`;


        io.to(socket.id).emit('sys message', await MessageModel.create({ msg }));

    });
});

server.listen(PORT, () => console.log('listening on port', PORT));