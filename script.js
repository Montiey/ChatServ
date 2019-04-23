const server = "54.157.206.188";

var lastMessageIndex = -1;	//Index of the latest message in the client's posession

$("#send").click(postMessage);
setInterval(getMessages, 3000);	//TODO: This is awful... but it works w/o server acknowledgement of clients
getMessages();

function writeMessages(json){
	var o = $("#output");
	for(var msg of json){
		o.append("[" + msg.user + "] " + msg.content + "\n");
	}
}

function postMessage(){
    console.log("Sending...");
    if(!$("#input").val() || !$("#name").val()){
    	console.log("Blank fields");
    	return;
    }
    var req = new XMLHttpRequest();
    req.open("POST", "https://cors-anywhere.herokuapp.com/" + server + "/postMessage");
    req.setRequestHeader("Content-Type", "application/json");

    content = {
    	"content": $("#input").val(),
    	"user": $("#name").val()
    }

    console.log("Sending: " + JSON.stringify(content));
    req.send(JSON.stringify(content));

    req.onreadystatechange = function(){
    	if(this.readyState == XMLHttpRequest.DONE && this.status == 200){
    		console.log("Success sending message");
    		$("#input").val("");
    	}
    }
}

function getMessages(){
	console.log("Getting...");
	var req = new XMLHttpRequest();
	req.open("POST", "http://" + server + "/getMessages?getFrom=" + (lastMessageIndex + 1));
	req.setRequestHeader("Content-Type", "application/json");

	req.send();

	req.onreadystatechange = function(){
		if(this.readyState == XMLHttpRequest.DONE && this.status == 200){
			var nextMessages = JSON.parse(this.response);
			lastMessageIndex += nextMessages.length;
			writeMessages(nextMessages);
		}
	}
}
