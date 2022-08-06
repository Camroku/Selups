const tbody = document.getElementById('mtb');
const form = document.getElementById('form');
const input = document.getElementById('input');

const { username } = form.dataset;
const socket = io(window.location.origin, { query: `username=${username}` });

window.scrollTo(0, document.body.scrollHeight);

let context = new AudioContext();
function beep(freq, duration, vol) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    oscillator.frequency.value = freq;
    oscillator.type = "square";
    gain.connect(context.destination);
    gain.gain.value = vol * 0.01;
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration * 0.001);
}


form.addEventListener('submit', e => {
    e.preventDefault();
    if (!input.value) return;
    if (input.value[0] == '/') {
        const argv = input.value.split(/ +/g).filter(Boolean);
        if (argv[0] == "/help") {
            // client side, epermal, no body can see
            gotMessage({ msg: "Commands:<br>who - Get a list of online users" });
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
    const row = document.createElement('tr');

    const username = document.createElement('td');
    const when = document.createElement('td');
    const message = document.createElement('td');

    username.textContent = id;
    username.className = "info";

    when.textContent = new Date(date).toLocaleString("tr");
    when.className = "info";

    message.textContent = msg;
    message.innerHTML = message.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>")
        .replace(/&lt;br&gt;/g, "<br>");

    message.className = "message";

    row.appendChild(username);
    row.appendChild(when);
    row.appendChild(message);

    tbody.appendChild(row);
    window.scrollTo(0, document.body.scrollHeight);
    return row;
}


socket.on('chat message', m => {
    gotMessage(m);
    beep(75, 45, 5);
});

socket.on('sys message', gotMessage);