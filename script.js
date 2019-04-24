const server = "54.157.206.188:443";

var lastMessageIndex = -1;	//Index of the latest message in the client's posession

$("#send").click(postMessage);
setInterval(getMessages, 3000);
getMessages();

$("#ssl").click(function(){
	window.location = "https://" + server;
});

function writeMessages(json){
	var o = $("#output");

	for(var msg of json){
		o.append("[" + msg.user + "] " + msg.content + "\n");
	}

	if(json.length && $("#autoscroll")[0].checked){
		var o = $("#output");
    	o.scrollTop(o[0].scrollHeight - o.height());
	}
}

function getMessages(){
	console.log("Getting...");
	var req = new XMLHttpRequest();
	req.open("POST", "https://" + server + "/getMessages?getFrom=" + (lastMessageIndex + 1));
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

function postMessage(){
    console.log("Sending...");
    if(!$("#input").val() || !$("#name").val()){
    	console.log("Blank fields");
    	return;
    }
    var req = new XMLHttpRequest();
    req.open("POST", "https://" + server + "/postMessage");
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
			getMessages();
    	}
    }
}
