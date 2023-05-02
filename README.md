# Selups
A chat application written Node.js.

## Running
You need `npm` and `nodejs`.

1. Clone the repository.
2. Enter your MONGO_DB_URL to `.env`
2. Run `npm i` in the repository.
3. Run `node index.js` to start the app.

## Chat commands
Commands are special types of messages that do something other than sending a message. They may send system messages that other users don't see to indicate the result of that command. Commands start with `/`. You can type `/help` to get a list of commands with their descriptions.

## TODO:
- [ ] Add a class for messages.
- [ ] Add latelimit and limit for search
- [ ] Add fetch older messages button
- [ ] Local Bootstrap