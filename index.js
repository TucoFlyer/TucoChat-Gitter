var fs = require('fs');
var url = require('url');

var chalk = require('chalk'); // colored text
var deasync = require('deasync'); // de-async-ifyer
var request = require('request'); // http requests
var WebSocketClient = require('websocket').client; // websocket client
var Gitter = require('node-gitter'); // gitter lib

function log (text) { // log to stdout w/o newline
	process.stdout.write(text);
}

// create vote action "enum"
var VoteActionEnum = {"FORWARD":0, "BACKWARD":1, "LEFT":2, "RIGHT": 3};
Object.freeze(VoteActionEnum);

// create special action "enum"
var SpecialActionEnum = {"LOOK": 0}
Object.freeze(SpecialActionEnum);

// SETUP
log(chalk.blue("Checking CWD connection.txt..."));
var connectionFileExists = fs.existsSync("connection.txt"); // check if connection.txt exists in cwd
console.log(chalk.green(" OK!"));

var connectionFile; // path of connection file
if (connectionFileExists) {
	connectionFile = "connection.txt";
	console.log(chalk.green("CWD connection.txt found."));
} else {
	connectionFile = process.env.TUCOCHAT_CONNECTION_FILE
	console.log(chalk.yellow("CWD connection.txt not found, using TUCOCHAT_CONNECTION_FILE."));
}

log(chalk.blue("Reading connection.txt... (UTF-8)"));
var connectionFileContents = fs.readFileSync(connectionFile, "UTF-8"); // read connection file
console.log(chalk.green(" OK!"));

log(chalk.blue("Filtering QR Code from file..."));
var connectionFileLines = connectionFileContents.split("\n"); // split by newlines
var connectionAddr = connectionFileLines[0].trim(); // get 1st line and trim whitespaces from start to end
console.log(chalk.green(" OK!"));

log(chalk.blue(`Parsing "${connectionAddr}"...`));
var connectionURL = url.parse(connectionAddr); // parse URL with experimental url package
console.log(chalk.green(" OK!"));

log(chalk.blue(`Requesting WS addr from "${connectionURL.host}"...`));
var wsUrl = null;
request(`${connectionURL.protocol}//${connectionURL.host}/ws`, function (err, request, body) {
	if (err) {
		console.log(chalk.red(" FAIL!"));
		throw err;
	}
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Response code: ${request.statusCode}`));
	wsUrl = JSON.parse(body).uri;
	console.log(chalk.green(`WS URL: ${wsUrl}`));
});

deasync.loopWhile(function(){return wsUrl == null}); // wait until async request finishes

log(chalk.blue("Initializing Gitter..."));
var gitter = new Gitter(process.env.TUCOCHAT_GITTER_TOKEN); // initialize gitter
console.log(chalk.green(" OK!"));

log(chalk.blue("Checking user..."));
var x = false; // loop var
gitter.currentUser().then(function(user) { // get logged-in-as user data
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Logged in as "${user.username}".`));
	x = true; // end loop
});

deasync.loopWhile(function(){return !x}); // wait until logged current user

log(chalk.blue("Joining room..."));
var x = false; // loop var
gitter.rooms.join('TucoFlyer/test').then(function(room) {
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Joined room "${room.name}".`));
	log(chalk.blue("Registering event handler for messages."));
	var events = room.streaming().chatMessages(); // get chat message events var
	events.on('chatMessages', function(message) { // register eventhandler
		if (message.operation == "create") { // on new chat message
			console.log(chalk.magenta(`New chat message: ${message.model.text}`));
			var sanitizedMessage = message.model.text.trim().toLowerCase(); // sanitize: trim start&end whitespaces, change text to lowercase
			var voteAction; // var for vote action ENUM
			var specialAction; // var for special action ENUM
			var specialActionData = {}; // var for special action data
			if (sanitizedMessage.startsWith("!look ")){ // check for special action LOOK
				specialAction = SpecialActionEnum.LOOK; // set sp-action var to LOOK action
				specialActionData = {
					target: sanitizedMessage.substring("!look ".length) // trim message of "!look ", leave object to look at
				}
				console.log(chalk.magenta(`LOOK action triggered by message. (TARGET: ${specialActionData.target})`));
			} else { // if not special action
				switch(sanitizedMessage) { // check sanitized message
					case "w": // if the message is "w"
						console.log(chalk.magenta("FORWARD action triggered by message."));
						voteAction = VoteActionEnum.FORWARD; // set vote FORWARD
						break;
					case "s": // if message is "s"
						console.log(chalk.magenta("BACKWARD action triggered by message."));
						voteAction = VoteActionEnum.BACKWARD; // set vote BACKWARD
						break;
					case "a": // if message is "a"
						console.log(chalk.magenta("LEFT action triggered by message."));
						voteAction = VoteActionEnum.LEFT; // set vote LEFT
						break;
					case "d": // if message is "d"
						console.log(chalk.magenta("RIGHT action triggered by message."));
						voteAction = VoteActionEnum.RIGHT; // set vote RIGHT
						break;
					default: // if not direction vote
						console.log(chalk.magenta("Non-action message, skipping."));
						return; // ignore this message, don't go through sorting & sending.
				}
			}
		}
	});
	console.log(chalk.green(" OK!"));
	/*log(chalk.blue("Sending test message..."));
	room.send("TucoChat-Gitter operational.");
	console.log(chalk.green(" OK!"));*/ // test message, not needed but left here for debugging purposes. needs deasync.
	x = true; // end loop
}).catch(function(err) {
	console.log(chalk.red(" FAIL!"));
	throw err;
})

deasync.loopWhile(function(){return !x}); // wait until joining room (and doing other stuff)