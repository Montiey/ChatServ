const http = require("http");
const nStatic = require("node-static");
const urlParser = require("url");
const fs = require("fs");

const port = 8001;
const qrFile = "config/qrref.json";
const messageFile = "config/messages.json";
const refFile = "config/ref.json"

function getTimestamp(){
	var d = new Date();
	return (d.getMonth() + 1) + "-" + d.getDate() + "-" + d.getFullYear() + " " +
	(d.getHours == 0 ? "12" : (d.getHours() < 10 ? "0" + d.getHours() : d.getHours())) + ":" +
	(d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()) + ":" +
	(d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds());
}

function newMessage(name, content, address, time, type){
	return {
		name: name,
		content: content,
		address: address,
		time: time,
		type: type
	};
}

function editJSON(path, callback){
	var content;

	if(fs.existsSync(path)){
		content = JSON.parse(fs.readFileSync(path));
	} else{
		console.log("Update: File doesn't exist");
		return;
	}

	callback(content);
	fs.writeFileSync(path, JSON.stringify(content, null, 4));
}

function readJSON(path){
	if(fs.existsSync(path)){
		return JSON.parse(fs.readFileSync(path));
	} else{
		console.log("Read: File doesn't exist: " + path);
		return;
	}
}


const fServer = new nStatic.Server("./pub"); //Hot fresh HTML

const requestHandler = function(request, response){
	console.log(getTimestamp() + " [" + request.connection.remoteAddress + " T: " + request.headers["content-type"] + "] " + request.url);

	try{
		var url = urlParser.parse(request.url, true);
		
		
		response.setHeader("access-control-allow-origin", "*");
		response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
		response.setHeader("access-control-allow-headers", "x-requested-with, content-type");	
		


		if(url.pathname == "/getMessages"){
			var fromIndex = url.query.getFrom;
			var readMessages = readJSON(messageFile).list.slice(fromIndex);
			for(var msg of readMessages){	//strip all other data but what the client should get
				delete msg.address
			}
			response.setHeader("content-type", "application/json");
			response.write(JSON.stringify(readMessages));
			response.end();
		} else if(url.pathname == "/postMessage"){
			var content = "";
			request.on("data", function(data){
				content += data;
				if(content.length > 500){
					request.connection.destroy();
					console.log("!!! Data overflow !!!");
				} else{
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
								editJSON(messageFile, function(json){	
									json.list.push(newMessage(msg.user, msg.content, request.connection.remoteAddress, (new Date).getTime(), "person"));
								});
							} else{
								console.log("Ignoring blank");
							}
						}
					});
				}
			});
			
			response.end();
		} else{
			if(url.query.ref != undefined){		
				editJSON(refFile, function(json){
					var exists = false;
					console.log("Query: " + url.query.ref);
					for(var entry of json[url.query.ref]){
						if(entry.address == request.connection.remoteAddress){
							entry.count++;
							exists = true;
							break;
						}
					}
					if(!exists){
						json[url.query.ref].push({
							address: request.connection.remoteAddress,
							count: 1
						});
					}
					
				});

				editJSON(messageFile, function(json){
					json.list.push(newMessage(null, "Someone just scanned a QR code! Say hi!", null, null, "info"));
				});

				
				response.writeHead(302, {
					"location": url.pathname	//Remove query string
				});
				response.end();
			} else{
				console.log("Serving files");
				fServer.serve(request, response);
			}
		}
	} catch(e){
		console.log("!!!!!!!! Couldn't respond to request: " + e);
	}
}

const server = http.createServer(requestHandler);
server.listen(port);


process.on("SIGINT", () => {
	console.log("SIGINT - restarting");
	process.exit(0);
});
console.log("ChatServ started on port " + port);
