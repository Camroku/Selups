require("dotenv").config();

const express = require("express"),
    ses = require("express-session"),
    rl = require("express-rate-limit"),
    cm = require("connect-mongo"),
    config = require("./config.json"),
    bcrypt = require("bcrypt"),
    mongoose = require("mongoose"),
    app = express(),
    { PORT = 3000, MONGO_DB_URL, SESSION_SECRET } = process.env,
    users = {},
    sessionMiddleware = ses({
        store: cm.create({
            clientPromise: mongoose.connect(MONGO_DB_URL)
                .then(m => m.connection.getClient()),
            stringify: false
        }),
        secret: SESSION_SECRET, resave: false, saveUninitialized: true
    }),
    MessageModel = require("./models/message.js"),
    UserModel = require("./models/user.js"),
    { Server } = require("socket.io"),
    http = require('http'),
    server = http.createServer(app),
    io = new Server(server);




app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }), sessionMiddleware, express.static('static'),
    async (req, res, next) => {
        if (req.session.userID)
            req.user = await UserModel.findById(req.session.userID);

        res.reply = (file, options = {}) => res.render(file, { user: req.user, error: null, ...options });
        next();
    }
);

app.get('/', (req, res) => res.redirect(req.user ? "/chat" : '/login'));

app.get("/register", (req, res) => res.render("register", { error: null }));
app.post("/register", rl({ windowMs: 1000 * 60 * 60 * 24, max: 5 }), async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.reply("register", { error: "Kullanıcı adı/şifre boş" });

    if (username === config.System) return res.reply("register", { error: "Kullanıcı adı " + config.System + " olamaz" });

    if (await UserModel.exists({ username })) return res.send(`${username} adı çoktan alınmış!`)
    const user = new UserModel({ username });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    req.session.userID = user._id;
    return res.redirect("/chat");
});

app.get("/api/messages/:id", async (req, res) => {
    const message = await MessageModel.findById(req.params.id);
    if (message)
        return res.json(message);
    else
        return res.status(404).json({ error: "Mesaj bulunamadı!" });

});
app.get("/api/users/:id", async (req, res) => {
    const user = await UserModel.findById(req.params.id);
    if (user)
        return res.json({
            _id: user._id,
            username: user.username,
            avatar: user.avatar
        });
    else
        return res.status(404).json({ error: "Kullanıcı bulunamadı!" });
});


app.get("/api/messages", async (req, res) => {
    const { limit = 50, skip = 0 } = req.query;
    const messages = await MessageModel.find().limit(limit).skip(skip);
    return res.json(messages);
});

app.get('/login', (req, res) => req.user
    ? res.reply('/chat')
    : res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.reply("login", { error: "Kullanıcı adı/şifre boş" });

    const user = await UserModel.findOne({ username });
    if (!user) return res.reply("login", { error: "Sistemde böyle bir kullanıcı yok!" });

    if (!await bcrypt.compare(password, user.password))
        return res.reply("login", { error: "Şifre yanlış!" });

    req.session.userID = user._id;
    return res.redirect('/chat');
});

app.get('/logout', (req, res) => {
    req.session.userID = null;
    req.session.destroy();
    return res.redirect('/');
});

app.get('/chat', async (req, res) => {
    if (!req.user)
        return res.redirect('/login');

    res.reply('chat', { messages: await MessageModel.find().limit(50), SYSTEM: config.System });
});



io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

io.use(async (socket, next) => {
    const _id = socket.request.session.userID;
    const user = await UserModel.findOne({ _id });
    if (!user)
        return next(new Error("unauthorized"));
    socket.user = user;
    next();

});

io.on('connection', async socket => {
    const { username, _id } = socket.user;
    users[socket.id] = username;

    io.emit('chat message', await MessageModel.create({ content: `User ${username} has joined.` }));

    socket.on('disconnect', async () => {
        delete users[socket.id];
        io.emit('chat message', await MessageModel.create({ content: `User ${username} has left.` }));
    });
    socket.on('chat message', async m => {
        const mesaj = await MessageModel.create({
            authorID: _id,
            content: m.content
        });
        io.emit('chat message', mesaj);
    });

    socket.on('bot', async args => {
        // example args = ["/bot","online",...String];
        const command = args.shift();
        // command = "/bot", args  = ["online", ...String];

        let content = "Unknown command";
        if (command === "/who")
            content = `Online: ${Object.values(users).join(", ")}`;
        else if (command === "/ping")
            content = `Your ping to server: ${Date.now() - args[0]}ms`;


        io.to(socket.id).emit('sys message', await MessageModel.create({ content, authorID: config.System }));

    });
});

server.listen(PORT, () => console.log('listening on port', PORT));