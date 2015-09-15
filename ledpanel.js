
var url = 'ws://192.168.1.150:7681/';

 url = 'ws://192.168.1.27:7681/';

var frame = 0;
var cols = 32 * 5;
var rows = 32;

var ctx;
var socket;

var down = 0;
var last_x = 0, last_y = 0;

var prepareFrameCallback;
var framebuffer = [];
for (var i=0; i<rows*cols*3; i++) framebuffer.push(0);//Math.floor(Math.random() * 255));

function ev_mousedown (ev) {
	down = 1;
}

function ev_mouseup(ev) {
	down = 0;
}

function blurb(ox,oy) {
	var o = (oy * cols + ox) * 3;
	framebuffer[o + 0] = Math.floor(Math.random() * 255);
	framebuffer[o + 1] = Math.floor(Math.random() * 255);
	framebuffer[o + 2] = Math.floor(Math.random() * 255);
}

function ev_mousemove (ev) {
	var x = ev.offsetX;
	var y = ev.offsetY;

	if (!down)
		return;

	var ox = Math.floor(x / 8);
	var oy = Math.floor(y / 8);

	for(var dx=-3; dx<=3; dx++)
		for(var dy=-3; dy<=3; dy++)
			blurb(ox+dx, oy+dy);

	last_x = x;
	last_y = y;
}

function queueFrame(delay) {
	setTimeout(sendFrame, delay || 0);
}

var outframe = 0;

var _gamma = function(r) {
	return (r * r) / 800;
}

function updateCanvas() {
	for(var j=0; j<rows; j++) {
		for(var i=0; i<cols; i++) {
			var o = (j * cols + i) * 3;
			var x = i * 8;
			var y = j * 8;
			ctx.fillStyle = 'rgb(' + Math.floor(framebuffer[o+0])+','+Math.floor(framebuffer[o+1])+','+Math.floor(framebuffer[o+2])+')';
			ctx.fillRect(x,y,8,8);
		}
	}
}

var scan = 0;

var scanorder = [];
for(var i=0; i<rows; i++) {
	scanorder.push(i);
}

for(var i=0; i<rows; i++) {
	var i1 = Math.floor(Math.random() * rows);
	var i2 = Math.floor(Math.random() * rows);
	var r1 = scanorder[i1];
	var r2 = scanorder[i2];
	scanorder[i1] = r2;
	scanorder[i2] = r1;
}

var queueLines = 1;
var queueInterval = 60;

function sendFrame() {
	prepareFrameCallback(function() {

		//
		// full frames
		//
		var dummydata = [];
		for(var j=0; j<rows; j++) {
			for(var i=0; i<cols; i++) {
				var o = (j * cols + i) * 3;
				var _r = Math.round(_gamma(framebuffer[o + 0]));
				var _g = Math.round(_gamma(framebuffer[o + 1]));
				var _b = Math.round(_gamma(framebuffer[o + 2]));
				if (_r < 0) _r = 0; if (_r > 255) _r = 255;
				if (_g < 0) _g = 0; if (_g > 255) _g = 255;
				if (_b < 0) _b = 0; if (_b > 255) _b = 255;
				dummydata.push(String.fromCharCode(0 + Math.floor(_r / 1)));
				dummydata.push(String.fromCharCode(0 + Math.floor(_g / 1)));
				dummydata.push(String.fromCharCode(0 + Math.floor(_b / 1)));
			}
		}

		dummydata[2] = String.fromCharCode(outframe % 128);
		dummydata[3] = String.fromCharCode(outframe >> 8);

		dummydata = dummydata.join('');

		console.log(dummydata[0], dummydata[1], dummydata[2], dummydata[3], dummydata[4]);
		dummydata = 'B' + window.btoa(dummydata);

		console.log('sending data', dummydata.length);
		socket.send(dummydata);

		outframe ++;

		updateCanvas();
		queueFrame(queueInterval);
	});
}

function connectWebsocket() {
	socket = new WebSocket(url, "ledpanel-frame");

	socket.onopen = function() {
		document.getElementById("wsdi_status").textContent = " websocket connection opened ";
		queueFrame(200);
	}

	socket.onmessage =function got_packet(msg) {
		document.getElementById("number").textContent = msg.data + "\n";
	}

	socket.onclose = function(){
		document.getElementById("wsdi_status").textContent = " websocket connection CLOSED ";
	}
}

function reset() {
	socket.send("reset\n");
}

// function waitNextFrame(callback) {
// }

function updateFrame(callback) {
	callback();
}

// initCanvas();
// connectWebsocket();


function initLedpanel(prepareFrame) {
	prepareFrameCallback = prepareFrame;
	initCanvas();
	connectWebsocket();
}
