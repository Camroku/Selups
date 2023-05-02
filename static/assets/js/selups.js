const msgbody = document.getElementById('msgbody');
const form = document.getElementById('form');
const input = document.getElementById('input');

const socket = io(window.location.origin);
const userCache = new Map();
userCache.set(SYSTEM, { username: SYSTEM });
window.scrollTo(0, document.body.scrollHeight);

const lookCache = async _id => userCache.get(_id) ||
    await fetch(`/api/users/${_id}`).then(res => res.json())
        .then(user => userCache.set(_id, user)).then(() => userCache.get(_id));

const messages = await fetch("/api/messages").then(res => res.json());

for (const m of messages) await gotMessage(m);

form.addEventListener('submit', e => {
    e.preventDefault();
    input.focus();
    if (!input.value) return;
    if (input.value[0] == '/') {
        const argv = input.value.split(/ +/g).filter(Boolean);
        if (argv[0] == "/help") {
            // client side, epermal, no body can see
            gotMessage({ content: "Commands:<br>who - Get a list of online users<br>ping - Server-Client ping" });
        } else if (argv[0] == "/who") {
            // server side, global
            socket.emit('bot', argv);
        } else if (argv[0] == "/ping") {
            // server side, global
            socket.emit('bot', ["/ping", Date.now()]);
        } else {
            const message = gotMessage({ content: `Unknown command ${argv[0]}` });
            setTimeout(() => {
                message.parentNode.removeChild(message);
            }, 3000);
        }
    } else
        socket.emit('chat message', { content: input.value });

    input.value = '';
});

async function gotMessage({ content, authorID = SYSTEM, date = Date.now(), _id }) {
    const messageGroup = document.createElement('li');
    messageGroup.dataset.author = authorID;
    messageGroup.classList.add("message-group"); // fill in css

    const card = document.createElement('div');
    card.classList.add('card');
    messageGroup.appendChild(card);

    if (msgbody.children.length > 100) msgbody.removeChild(msgbody.children[0]);


    //
    const cardtext = document.createElement('p');
    cardtext.dataset.id = _id;
    cardtext.classList.add('card-text', 'dark-hover', 'my-0', 'py-1', 'px-4', "message"); // fill in css
    //

    // no title if last message is from same user
    const lastMessageGroup = msgbody.lastElementChild;

    if (lastMessageGroup?.dataset?.author !== authorID) {

        //
        const cardbody = document.createElement('div');
        cardbody.classList.add('card-body');
        cardbody.classList.add('px-0');
        card.appendChild(cardbody);
        //


        const cardtitle = document.createElement('h6');
        cardtitle.classList.add('text-muted', 'card-subtitle', 'mb-2', 'px-2');

        cardtitle.innerText = await lookCache(authorID).then(user => user.username);

        messageGroup.dataset.author = authorID;
        cardtitle.innerHTML += "<span class=\"visible-hover\"> - " + new Date(date).toLocaleString("tr") + "</span>";
        cardbody.appendChild(cardtitle);
        cardbody.appendChild(cardtext);


        cardtext.innerText = content;
        cardtext.innerHTML = cardtext.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>").replace(/&lt;br&gt;/g, "<br>");

        msgbody.appendChild(messageGroup);
    }
    else {
        const cardbody = lastMessageGroup.querySelector(".card-body");
        cardbody.appendChild(cardtext);
        cardtext.innerText = content;
        cardtext.innerHTML = cardtext.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>").replace(/&lt;br&gt;/g, "<br>");
    }
    window.scrollTo(0, document.body.scrollHeight);
    return messageGroup;
}


socket.on('chat message', gotMessage);
socket.on('sys message', gotMessage);