//const https = require("https");
const http = require("http");
const nStatic = require("node-static");
const urlParser = require("url");
const fs = require("fs");
const port = 80;

var messages = [
]

function Message(user, content){
	this.content = content;
	this.user = user;
}

messages.push(new Message("Welcome", "to ChatServ"));

function getDate(){
	var d = new Date();
	return (d.getMonth() + 1) + "-" + d.getDate() + "-" + d.getFullYear();
}


const fServer = new nStatic.Server("./pub"); //Hot fresh HTML


const requestHandler = function(request, response){
	console.log(getDate() + " [" + request.connection.remoteAddress + "]" + request.url);

	var url = urlParser.parse(request.url, true);

	response.setHeader("access-control-allow-origin", "*");
	response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
	response.setHeader("access-control-allow-headers", "x-requested-with, content-type");	
	

	if(url.pathname == "/getMessages"){
		var fromIndex = url.query.getFrom;
		var newMessages = messages.slice(fromIndex);
		response.setHeader("content-type", "application/json");
		response.write(JSON.stringify(newMessages));
		response.end();
	} else if(url.pathname == "/postMessage" && request.headers["content-type"] == "application/json"){
		var content = "";
		request.on("data", function(data){
			content += data;
			if(content.length > 1e6){
				request.connection.destroy();
				console.log("!!! Data overflow !!!");
			} else{
			}
		});
		request.on("end", function(){
			console.log("Received msg: " + content);
			var msg = null;
			try{
				msg = JSON.parse(content);
			} catch(e){
				console.log("JSON: " + e);
			}

			if(msg){
				if(msg.user && msg.content){
					messages.push(new Message(msg.user, msg.content));
				} else{
					console.log("Ignoring blank");
				}
			}
		});
		response.end();
	} else{
		fServer.serve(request, response);
	}
}

//const server = https.createServer(auth, requestHandler);
const server = http.createServer(requestHandler);
server.listen(port);

console.log("ChatServ started on port " + port);
