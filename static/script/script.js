var table = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var username = form.dataset.username;

var socket = io(window.location.origin, {query: "username=" + username});

function gotMessage(msg, id) {
    var row = document.createElement('tr');
    var username = document.createElement('td');
    var message = document.createElement('td');
    username.textContent = id;
    username.className = "username";
    message.textContent = msg;
    message.innerHTML = message.innerHTML.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)[-A-Z0-9+&@#%?\/=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
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
            if (argv[0] == "/help") {
                gotMessage("There are not any commands yet.", "System");
            } else {
                var message = gotMessage("Unknown command " + argv[0], "System");
                setTimeout(function () {
                    message.parentNode.removeChild(message);
                }, 3000);
            }
            input.value = '';
        } else {
            socket.emit('chat message', input.value, username);
            input.value = '';
        }
    }
});

socket.on('chat message', function (msg, id) {
    gotMessage(msg, id);
});