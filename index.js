var fs = require('fs');
var url = require('url');
var readline = require('readline');

var chalk = require('chalk'); // colored text
var deasync = require('deasync'); // de-async-ifyer
var request = require('request'); // http requests
var WebSocketClient = require('websocket').client; // websocket client
var Gitter = require('node-gitter'); // gitter lib

function log (text) { // log to stdout w/o newline
	process.stdout.write(text);
}

var VoteActionEnum = {"FORWARD":0, "BACKWARD":1, "LEFT":2, "RIGHT": 3};
Object.freeze(VoteActionEnum);

var SpecialActionEnum = {"LOOK": 0}
Object.freeze(SpecialActionEnum);

// setup
log(chalk.blue("Checking CWD connection.txt..."));
var connectionFileExists = fs.existsSync("connection.txt"); // check if connection.txt exists in cwd
console.log(chalk.green(" OK!"));

var connectionFile;
if (connectionFileExists) {
	connectionFile = "connection.txt";
	console.log(chalk.green("CWD connection.txt found."));
} else {
	connectionFile = process.env.TUCOCHAT_CONNECTION_FILE
	console.log(chalk.yellow("CWD connection.txt not found, using TUCOCHAT_CONNECTION_FILE."));
}

log(chalk.blue("Reading connection.txt... (UTF-8)"));
var connectionFileContents = fs.readFileSync(connectionFile, "UTF-8");
console.log(chalk.green(" OK!"));

log(chalk.blue("Filtering QR Code from file..."));
var connectionFileLines = connectionFileContents.split("\n"); // split by newlines
var connectionAddr = connectionFileLines[0].trim(); // get 1st line and trim whitespaces from start to end
console.log(chalk.green(" OK!"));

log(chalk.blue(`Parsing "${connectionAddr}"...`));
var connectionURL = url.parse(connectionAddr);
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
deasync.loopWhile(function(){return wsUrl == null});

log(chalk.blue("Initializing Gitter..."));
var gitter = new Gitter(process.env.TUCOCHAT_GITTER_TOKEN);
console.log(chalk.green(" OK!"));

log(chalk.blue("Checking user..."));
var x = false;
gitter.currentUser().then(function(user) {
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Logged in as "${user.username}".`));
	x = true;
});

deasync.loopWhile(function(){return !x});

log(chalk.blue("Joining room..."));
var x = false;
gitter.rooms.join('TucoFlyer/test').then(function(room) {
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Joined room "${room.name}".`));
	log(chalk.blue("Registering event handler for messages."));
	var events = room.streaming().chatMessages();
	events.on('chatMessages', function(message) {
		if (message.operation == "create") {
			console.log(chalk.magenta(`New chat message: ${message.model.text}`));
			var sanitizedMessage = message.model.text.trim().toLowerCase();
			var voteAction;
			var specialAction;
			var specialActionData = {};
			if (sanitizedMessage.startsWith("!look ")){
				specialAction = SpecialActionEnum.LOOK;
				specialActionData = {
					target: sanitizedMessage.substring("!look ".length)
				}
				console.log(chalk.magenta(`LOOK action triggered by message. (TARGET: ${specialActionData.target})`));
			} else {
				switch(sanitizedMessage) {
					case "w":
						console.log(chalk.magenta("FORWARD action triggered by message."));
						voteAction = VoteActionEnum.FORWARD;
						break;
					case "s":
						console.log(chalk.magenta("BACKWARD action triggered by message."));
						voteAction = VoteActionEnum.BACKWARD;
						break;
					case "a":
						console.log(chalk.magenta("LEFT action triggered by message."));
						voteAction = VoteActionEnum.LEFT;
						break;
					case "d":
						console.log(chalk.magenta("RIGHT action triggered by message."));
						voteAction = VoteActionEnum.RIGHT;
						break;
					default:
						console.log(chalk.magenta("Non-action message, skipping."));
						return; // ignore this message
				}
			}
		}
	});
	console.log(chalk.green(" OK!"));
	/*log(chalk.blue("Sending test message..."));
	room.send("TucoChat-Gitter operational.");
	console.log(chalk.green(" OK!"));*/
	x = true;
}).catch(function(err) {
	console.log(chalk.red(" FAIL!"));
	throw err;
})

deasync.loopWhile(function(){return !x});