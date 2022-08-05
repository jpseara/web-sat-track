function getSerialPorts() {

	var onGetDevices = function(ports) {

		console.log("List of serial ports:");
		serial_port_list = ports;
		//serial_port_list.sort();

		var found = false;

		var serialPortsHTML = document.getElementById("serial_port_list");
		serialPortsHTML.options.length = 0; // Clean list of COM ports (to recreate it again)

		var option = document.createElement("option");
		option.text = "(Off)";
		serialPortsHTML.add(option);

		for (var i = 0; i < serial_port_list.length; i++) {
			option = document.createElement("option");
			option.text = serial_port_list[i].path;
			serialPortsHTML.add(option);
			console.log(serial_port_list[i].path);
			found = true;
		}

		if (!found)
			console.log("No serial ports found.");

		if (!found || sat_name == null)
			serialPortsHTML.disabled = true;
		else
			serialPortsHTML.disabled = false;

		serialPortsHTML.selectedIndex = "0";
		serial_port = null;

	}

	disconnectFromSerialPort(); // In case there are still connections opened
	chrome.serial.getDevices(onGetDevices);
}

function connectToSerialPort() {

	if (serial_port == null)
		return;

	if (serial_connection_id != 0)
		disconnectFromSerialPort();

	var onConnect = function(connectionInfo) {
		serial_connection_id = connectionInfo.connectionId;
		console.log("Connected to serial port [" + serial_port + "] with the id: " + serial_connection_id);
	}

	// Connect to the serial port
	chrome.serial.connect(serial_port, {
		bitrate: 9600,
		dataBits: "eight",
		stopBits: "one",
		parityBit: "no"
	}, onConnect);
}

function disconnectFromSerialPort() {

	if (serial_connection_id == 0)
		return;

	var onFlush = function(result) {}

	var onDisconnect = function(result) {
		if (result) {
			console.log("Disconnected from the serial port.");
			serial_connection_id = 0;
		} else {
			console.log("Could not disconnect from the serial port.");
		}
	}

	chrome.serial.flush(serial_connection_id, onFlush);
	chrome.serial.disconnect(serial_connection_id, onDisconnect);
}

function sendAzElevToSerialPort() {

	if (serial_connection_id == 0)
		return;

	var onSend = function(result) {
		if (result) {
			console.log("Sent data: \"" + serial_az_i + "," + serial_az_d + "," + serial_elev_i + "," + serial_elev_d + "\" to serial port [" + serial_port + "]");
		} else {
			console.log("Could not send data to serial port [" + serial_port + "]");
		}
	}

	/* The ISCTE-IUL Arduino driver receives a 4 Signed Int32 array via RS232: [Integer part of azimuth, Decimal part of azimuth, Integer part of elevation, Decimal part of elevation] */

	// Convert azimuth and elevation to ArrayBuffer
	var convertAzElevToArrayBuffer = function() {
		var buf = new ArrayBuffer(4 * 4); // Num variables * int32 (4 byte)
		var bufView = new Int32Array(buf);
		bufView[0] = serial_az_i;
		bufView[1] = serial_az_d;
		bufView[2] = serial_elev_i;
		bufView[3] = serial_elev_d;
		return buf;
	}

	if (!sat_base_on_footprint || sat_elevation < antenna_min_elevation) { // Don't send azimuth/elevation values if the satellite is out of sight or a minimum elevation is not verified
		serial_az_i = 0;
		serial_az_d = 0;
		serial_elev_i = 0;
		serial_elev_d = 0;
	} else {
		serial_az_i = Math.floor(sat_azimuth); // Integer part of azimuth
		serial_az_d = Math.round((Math.abs(sat_azimuth) - Math.abs(serial_az_i)) * 100); // Decimal part of azimuth
		serial_elev_i = Math.floor(sat_elevation); // Integer part of elevation
		serial_elev_d = Math.round((Math.abs(sat_elevation) - Math.abs(serial_elev_i)) * 100); // Decimal part of elevation
	}

	chrome.serial.send(serial_connection_id, convertAzElevToArrayBuffer(), onSend);
}


document.getElementById("serial_port_list").onchange = function() {
	var index = this.selectedIndex;

	if (index == 0) { // OFF selected
		serial_port = null;
		disconnectFromSerialPort();
	} else {
		serial_port = this.children[index].innerHTML.trim();
		connectToSerialPort();
	}
}