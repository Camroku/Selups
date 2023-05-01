const msgbody = document.getElementById('msgbody');
const form = document.getElementById('form');
const input = document.getElementById('input');

const { username } = form.dataset;
const socket = io(window.location.origin, { query: `username=${username}` });

window.scrollTo(0, document.body.scrollHeight);

form.addEventListener('submit', e => {
    e.preventDefault();
    input.focus();
    if (!input.value) return;
    if (input.value[0] == '/') {
        const argv = input.value.split(/ +/g).filter(Boolean);
        if (argv[0] == "/help") {
            // client side, epermal, no body can see
            gotMessage({ msg: "Commands:<br>who - Get a list of online users<br>ping - Server-Client ping" });
        } else if (argv[0] == "/who") {
            // server side, global
            socket.emit('bot', argv);
        } else if (argv[0] == "/ping") {
            // server side, global
            socket.emit('bot', ["/ping", Date.now()]);
        } else {
            const message = gotMessage({ msg: `Unknown command ${argv[0]}` });
            setTimeout(() => {
                message.parentNode.removeChild(message);
            }, 3000);
        }
    } else
        socket.emit('chat message', { msg: input.value, id: username });

    input.value = '';
});


function gotMessage({ msg, id = "System", date = Date.now() }) {
    const li = document.createElement('li');

    const card = document.createElement('div');
    card.classList.add('card');
    li.appendChild(card);
    
    if (msgbody.children.length > 100) msgbody.removeChild(msgbody.children[0]);
    
    const cardtext = document.createElement('p');
    cardtext.classList.add('card-text');
    cardtext.classList.add('dark-hover');
    cardtext.classList.add('my-0');
    cardtext.classList.add('py-1');
    cardtext.classList.add('px-4');
    
    // no title if last message is from same user
    if (!(msgbody.children.length > 0 && msgbody.children[msgbody.children.length - 1].children[0].children[0].children[0].innerText.split(" - ")[0] == id)) {
        const cardbody = document.createElement('div');
        cardbody.classList.add('card-body');
        cardbody.classList.add('px-0');
        card.appendChild(cardbody);

        const cardtitle = document.createElement('h6');
        cardtitle.classList.add('text-muted');
        cardtitle.classList.add('card-subtitle');
        cardtitle.classList.add('mb-2');
        cardtitle.classList.add('px-2');
        cardtitle.innerText = id;
        cardtitle.innerHTML += "<span class=\"visible-hover\"> - " + new Date(date).toLocaleString("tr") + "</span>";
        cardbody.appendChild(cardtitle);
        cardbody.appendChild(cardtext);
        cardtext.innerText = msg;
        cardtext.innerHTML = cardtext.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>").replace(/&lt;br&gt;/g, "<br>");
        msgbody.appendChild(li);
    }
    else {
        const cardbody = msgbody.children[msgbody.children.length - 1].children[0].children[0];
        cardbody.appendChild(cardtext);
        cardtext.innerText = msg;
        cardtext.innerHTML = cardtext.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>").replace(/&lt;br&gt;/g, "<br>");
    }
    window.scrollTo(0, document.body.scrollHeight);
    return li;
}


socket.on('chat message', m => {
    gotMessage(m);
});

socket.on('sys message', gotMessage);