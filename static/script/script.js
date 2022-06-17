var socket = io();
var username = "unknown";
socket.on("connect", () => {
    username = socket.id;
});

var table = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

function gotMessage(msg, id) {
    var row = document.createElement('tr');
    var username = document.createElement('td');
    var message = document.createElement('td');
    username.textContent = id;
    username.className = "username";
    message.textContent = msg;
    message.className = "message";
    row.appendChild(username);
    row.appendChild(message);
    table.appendChild(row);
    window.scrollTo(0, document.body.scrollHeight);
    return row;
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        if (input.value[0] == '/') {
            var argv = input.value.split(" ");
            if (argv[0] == "/un") {
                username = argv[1];
                var message = gotMessage("Successfully changed username to " + argv[1], "System");
            } else {
                var message = gotMessage("Unknown command " + argv[0], "System");
            }
            input.value = '';
            setTimeout(function () {
                message.parentNode.removeChild(message);
            }, 3000);
        } else {
            socket.emit('chat message', input.value, username);
            input.value = '';
        }
    }
});

socket.on('chat message', function (msg, id) {
    gotMessage(msg, id);
});