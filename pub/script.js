const server = "54.157.206.188";
const protocol = "http://";
const getDelay = 3000;
var getInterval = setInterval(getMessages, 3000);
var lastMessageIndex = -1;	//Index of the latest message in the client's posession
$("#send").click(postMessage);
getMessages();

function getTime(epoch){
	var d = new Date()
	d.setTime(epoch);
	var mins = d.getMinutes();
	var hours = d.getHours()%12;
	return (hours < 10 ? "0" + hours : hours) + ":" + (mins < 10 ? "0" + mins : (mins == 0 ? "12" : mins));
}

function writeMessages(json){
	var o = $("#output");
	var temp = o.text();
	for(var msg of json){
		var time = getTime(msg.time);
		
		temp += time + " " + 
		(msg.type == "info" ? "<INFO>" : "") +
		(msg.type == "person" ? "[" + msg.name + "]" : "") + 
		" " +
		msg.content.toString() + "\n";
		
		o.text(temp);	//No cross-site scripting for you!
	}
	
	if(json.length && $("#autoscroll")[0].checked){
		var o = $("#output");
    	o.scrollTop(o[0].scrollHeight - o.height());
	}
}

function getMessages(){
	console.log("Getting...");
	var req = new XMLHttpRequest();
	req.open("POST", protocol + server + "/getMessages?getFrom=" + (lastMessageIndex + 1));
	
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
	clearInterval(getInterval);
    if(!$("#input").val() || !$("#name").val()){
    	console.log("Blank fields");
    	return;
    }
    var req = new XMLHttpRequest();
    req.open("POST", protocol + server + "/postMessage");
	req.setRequestHeader("content-type", "application/json");

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
		getInterval = setInterval(getMessages, getDelay);
    	}
    }
}
