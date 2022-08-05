function calculateSatPresentCoords() {

	if (sat_name == null || sat_tle_line_1 == null || sat_tle_line_2 == null)
		return;

	var earthR = 6378.137; // Earth radius in Km
	var earthD = 2 * earthR;

	var now = new Date(current_time);

	// Calculate satellite orbital parameters using satellite-js

	//var tleLine1 = '1 25544U 98067A   13149.87225694  .00009369  00000-0  16828-3 0  9031',
	//    tleLine2 = '2 25544 051.6485 199.1576 0010128 012.7275 352.5669 15.50581403831869';

	var tleLine1 = sat_tle_line_1,
		tleLine2 = sat_tle_line_2;

	// Initialize a satellite record
	var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	//  Propagate satellite using time since epoch (in minutes) or using a calendar date and time (obtained from Javascript Date).
	//var positionAndVelocity = satellite.sgp4 (satrec, timeSinceTleEpochMinutes);


	// Note: while Javascript Date returns months in range 0-11, all satellite.js methods require
	// months in range 1-12.
	var positionAndVelocity = satellite.propagate(
		satrec,
		now.getUTCFullYear(),
		now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
		now.getUTCDate(),
		now.getUTCHours(),
		now.getUTCMinutes(),
		now.getUTCSeconds()
	);

	// The position_velocity result is a key-value pair of ECI coordinates.
	// These are the base results from which all other coordinates are derived.
	var positionEci = positionAndVelocity.position,
		velocityEci = positionAndVelocity.velocity;

	// The coordinates are all stored in key-value pairs.
	// ECI and ECF are accessed by `x`, `y`, `z` properties.
	var positionX = positionEci.x,
		positionY = positionEci.y,
		positionZ = positionEci.z,
		velocityX = velocityEci.x,
		velocityY = velocityEci.y,
		velocityZ = velocityEci.z;

	// Set the Observer location, in RADIANS
	var observerGd = {
		//latitude: deg2rad(38.7),
		//longitude: deg2rad(-9),
		//height: 0.5 // Km
		latitude: deg2rad(base_latitude),
		longitude: deg2rad(base_longitude),
		height: base_height // Km
	};

	// GMST for some of the coordinate transforms.
	// Note: GMST, though a measure of time, is defined as an angle in radians.
	// Month range is 1-12, not 0-11.
	var gmst = satellite.gstimeFromDate(
		now.getUTCFullYear(),
		now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
		now.getUTCDate(),
		now.getUTCHours(),
		now.getUTCMinutes(),
		now.getUTCSeconds()
	);

	// Calculate ECF, Geodetic, Look Angles, Doppler Factor and Footprint
	var positionEcf = satellite.eciToEcf(positionEci, gmst),
		velocityEcf = satellite.eciToEcf(velocityEci, gmst),
		observerEcf = satellite.geodeticToEcf(observerGd),
		positionGd = satellite.eciToGeodetic(positionEci, gmst),
		lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf),
		velocityMgntd = Math.sqrt((velocityX * velocityX) + (velocityY * velocityY) + (velocityZ * velocityZ)), // Converting XYZ to magnitude speed
		doppler = satellite.dopplerFactor(observerEcf, positionEcf, velocityEcf),
		footprint = earthD * Math.acos(earthR / (earthR + positionGd.height));

	// Geodetic coords are accessed via `longitude`, `latitude`, `height`.
	var latitude = positionGd.latitude;
	var longitude = positionGd.longitude;
	var height = positionGd.height;

	// Look Angles may be accessed by `azimuth`, `elevation`, `range_sat` properties.
	var azimuth = rad2deg(lookAngles.azimuth);
	var elevation = rad2deg(lookAngles.elevation);
	var rangeSat = lookAngles.rangeSat;

	//  Convert the RADIANS to DEGREES for pretty printing.
	var latitudeStr = satellite.degreesLat(latitude);
	var longitudeStr = satellite.degreesLong(longitude);

	// Calculate satellite transit using jspredict

	var tle = sat_name + '\n' + sat_tle_line_1 + '\n' + sat_tle_line_2;
	var bsc = [base_latitude, base_longitude, base_height];
	var s = new Date(current_time);
	s = s.toISOString(); // Start of the interval of the transit analysis
	var e = new Date(current_time);
	e.setDate(e.getDate() + 1); // Analyse the transit for the next 1 day
	e = e.toISOString(); // End of the interval of the transit analysis
	var transit = jspredict.transits(tle, bsc, s, e, 0.1, 1); // Minimum elevation at 0.1 (if we define it at 0, jspredict will assume a different default value for the minimum elevation value); Max transits to be calculated is 1
	var transitStart = null;
	var transitEnd = null;
	if (transit.length > 0) { // Check if transits are to happen
		transitStart = new Date(transit[0].start);
		transitEnd = new Date(transit[0].end);
	}

	// Is the base station on the footprint now?
	var baseOnFootprint = false;
	var distanceBaseSat = getDistanceAndCenteredAngleBetweenTwoPoints(sat_latitude, sat_longitude, base_latitude, base_longitude).distance;
	if (distanceBaseSat <= footprint / 2) // We divide the footprint by 2 to convert a diameter to radius
		baseOnFootprint = true;

	// Update global variables
	sat_latitude = latitudeStr;
	sat_longitude = longitudeStr;
	sat_azimuth = azimuth;
	sat_elevation = elevation;
	sat_range = rangeSat;
	sat_altitude = height;
	sat_footprint = footprint;
	sat_velocity = velocityMgntd; // Km/s
	sat_doppler = doppler;
	sat_transit_start = transitStart;
	sat_transit_end = transitEnd;
	sat_base_on_footprint = baseOnFootprint;

	// Update labels
	sat_latitude_label = labelCoords(sat_latitude, sat_longitude).latitude_label;
	sat_longitude_label = labelCoords(sat_latitude, sat_longitude).longitude_label;
	sat_azimuth_label = roundToPrecisionDeg(sat_azimuth);
	sat_elevation_label = roundToPrecisionDeg(sat_elevation);
	sat_range_label = roundToPrecisionDeg(sat_range);
	sat_altitude_label = roundToPrecisionKm(sat_altitude);
	sat_footprint_label = roundToPrecisionKm(sat_footprint);
	sat_velocity_label = roundToPrecisionDeg(sat_velocity);
	sat_doppler_label = roundToPrecisionDoppler(sat_doppler);
	sat_transit_start_label = timeStringShort(sat_transit_start);
	if (sat_transit_start_label == timeStringShort(current_time)) // The transit start time is aprox. now
		sat_transit_start_label = "Now";
	sat_transit_end_label = timeStringShort(sat_transit_end);
}

function removeSatellite() {

	if (sat_marker != null) {
		sat_marker.removeFrom(earth_webgl);
		sat_marker = null;
	}

	sat_name = null;
	sat_tle_line_1 = null;
	sat_tle_line_2 = null;
	sat_latitude = 0;
	sat_longitude = 0;
	sat_azimuth = 0;
	sat_elevation = 0;
	sat_range = 0;
	sat_altitude = 0;
	sat_velocity = 0;
	sat_doppler = 0;
	sat_footprint = 0;
	sat_transit_start = null;
	sat_transit_end = null;
	sat_latitude_label = null;
	sat_longitude_label = null;
	sat_azimuth_label = null;
	sat_elevation_label = null;
	sat_range_label = null;
	sat_altitude_label = null;
	sat_footprint_label = null;
	sat_velocity_label = null;
	sat_doppler_label = null;
	sat_transit_start_label = null;
	sat_transit_end_label = null;
	sat_base_on_footprint = false;

	clearSatelliteHtmlTable();

	focus_sat_auto = false;
	removeSatelliteFootprintPolygon();
	removeSatelliteOrbitLine();

}

function createDefaultSatellite() {

	sat_tle_file_all_lines = [];

	sat_tle_file_all_lines[0] = "ISS (ZARYA)";
	sat_tle_file_all_lines[1] = "1 25544U 98067A   16121.52487927  .00004786  00000-0  78775-4 0  9998";
	sat_tle_file_all_lines[2] = "2 25544  51.6441 295.7874 0001942  82.6477  18.8608 15.54381658997568";

	sat_name = sat_tle_file_all_lines[0];
	sat_tle_line_1 = sat_tle_file_all_lines[1];
	sat_tle_line_2 = sat_tle_file_all_lines[2];

	var satellitesHTML = document.getElementById("satellite_list");

	satellitesHTML.options.length = 0; // Clean satellite list to recreate it later

	var option = document.createElement("option");
	option.text = "(None)";
	satellitesHTML.add(option);

	option = document.createElement("option");
	option.text = "ISS (ZARYA)"
	satellitesHTML.add(option);

	satellitesHTML.selectedIndex = "1";

	initializeNewSatellite();
}

function drawSatellite() {
	sat_marker = WE.marker([sat_latitude - 4, sat_longitude + 0.5], './data/images/satellite.png', 50, 50).addTo(earth_webgl); // Small adjustment to center the icon exactly on the coordinates ;-)
	sat_marker.bindPopup('<b>' + sat_name + '</b><br>' + sat_latitude_label + '&deg; ' + sat_longitude_label + '&deg; ' + sat_altitude_label + ' Km', {
		maxWidth: 125,
		closeButton: false
	}).openPopup(); // Show the satellite popup for the first time it is loaded
}

function createDefaultBaseStation() {
	removeBaseStation();
	base_latitude_label = labelCoords(base_latitude, base_longitude).latitude_label;
	base_longitude_label = labelCoords(base_latitude, base_longitude).longitude_label;
	base_height_label = roundToPrecisionKm(base_height);
	drawBaseStation();
}

function drawBaseStation() {
	base_polygon = WE.polygon([
		[base_latitude, base_longitude]
	], {
		color: '#00f',
		opacity: 1,
		fillColor: '#00f',
		fillOpacity: 0,
		editable: true,
		weight: 3
	}).addTo(earth_webgl);
}

function removeBaseStation() {
	if (base_polygon != null) {
		base_polygon.destroy();
		base_polygon = null;
	}
	base_latitude_label = null;
	base_longitude_label = null;
	base_height_label = null;
}

function createSatelliteFootprintPolygon() {

	if (!draw_sat_footprint || sat_name == null)
		return;

	removeSatelliteFootprintPolygon();

	var footprint_points = [];
	var circlePoints = 24;
	var circlePointsIntervalInDeg = Math.round(360 / circlePoints);

	var angle = 0;
	for (p = 0; p < circlePoints; p++) {
		var destiny = getDestinyPointGivenStartAndAngle(sat_latitude, sat_longitude, sat_footprint / 2, angle);
		footprint_points.push([destiny.latitude, destiny.longitude]);
		angle = angle + circlePointsIntervalInDeg;
	}

	drawSatelliteFootprintPolygon(footprint_points);
}

function drawSatelliteFootprintPolygon(footprint_points) {

	if (footprint_points < 3)
		return;

	footprint_polygon = WE.polygon(footprint_points, {
		color: '#f00',
		opacity: 0.001,
		fillColor: '#f00',
		fillOpacity: 0.25,
		editable: false,
		weight: 1
	}).addTo(earth_webgl);
}

function createSatelliteOrbitLine() {

	if (!draw_sat_orbit || sat_name == null || sat_tle_line_1 == null || sat_tle_line_2 == null)
		return;

	removeSatelliteOrbitLine();

	if (sat_altitude > 35000) // Geostationary satellites orbit at around 35786 Km altitude, don't draw an orbit line for these
		return;

	var orbit_points = [];
	var time = new Date(current_time);

	var latOrbit = sat_latitude;
	var lngOrbit = sat_longitude;
	var latLast = latOrbit;
	var lngLast = lngOrbit;
	var deltaDegLng = 0;

	var tleLine1 = sat_tle_line_1,
		tleLine2 = sat_tle_line_2;

	// Initialize a satellite record
	var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

	while (deltaDegLng < 360) { // Make a complete lap around earth in longitude

		orbit_points.push([latOrbit, lngOrbit]);

		time.setMinutes(time.getMinutes() + 5); // Time interval of each orbit point: 5 min
		if (sat_altitude > 10000)
			time.setMinutes(time.getMinutes() + 10); // If altitude bigger than 10000 Km: raise the time interval to 15 min (performance optimization)
		if (sat_altitude > 20000)
			time.setMinutes(time.getMinutes() + 15); // If altitude bigger than 20000 Km: raise the time interval to 30 min (performance optimization)
		if (sat_altitude > 30000)
			time.setMinutes(time.getMinutes() + 30); // If altitude bigger than 30000 Km: raise the time interval to 60 min (performance optimization)

		var positionAndVelocity = satellite.propagate(
			satrec,
			time.getUTCFullYear(),
			time.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			time.getUTCDate(),
			time.getUTCHours(),
			time.getUTCMinutes(),
			time.getUTCSeconds()
		);

		var gmst = satellite.gstimeFromDate(
			time.getUTCFullYear(),
			time.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			time.getUTCDate(),
			time.getUTCHours(),
			time.getUTCMinutes(),
			time.getUTCSeconds()
		);

		// Store satellite new predicted position
		var positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
		latOrbit = satellite.degreesLat(positionGd.latitude);
		lngOrbit = satellite.degreesLong(positionGd.longitude);

		// Calculate longitude delta till now
		var aLng = getDistanceAndCenteredAngleBetweenTwoPoints(0, lngOrbit, 0, lngLast).angle;
		deltaDegLng = deltaDegLng + aLng;

		latLast = latOrbit;
		lngLast = lngOrbit;

	}

	drawSatelliteOrbit(orbit_points);
}

function drawSatelliteOrbit(orbit_points) {

	if (orbit_points < 2)
		return;

	orbit_line = WE.polygon(orbit_points, {
		color: '#f00',
		opacity: 0.9,
		fillColor: '#fff',
		fillOpacity: 0.001,
		editable: false,
		weight: 1
	}).addTo(earth_webgl);

	// The following two polygons (lines) will "hide" the last section of the orbit line by making it white (to create an interval between the beginning and the end). We use 2 lines so that the hiding is more efficient

	var orbit_points_aux = [orbit_points[0], orbit_points[orbit_points.length - 1], orbit_points[0]];
	var orbit_points_aux2 = [orbit_points[orbit_points.length - 1], orbit_points[0], orbit_points[orbit_points.length - 1]];

	orbit_line_aux = WE.polygon(orbit_points_aux, {
		color: '#fff',
		opacity: 1,
		fillColor: '#fff',
		fillOpacity: 1,
		editable: false,
		weight: 2.5
	}).addTo(earth_webgl);

	orbit_line_aux2 = WE.polygon(orbit_points_aux2, {
		color: '#fff',
		opacity: 1,
		fillColor: '#fff',
		fillOpacity: 1,
		editable: false,
		weight: 2.5
	}).addTo(earth_webgl);
}

function removeSatelliteFootprintPolygon() {
	if (footprint_polygon != null) {
		footprint_polygon.destroy();
		footprint_polygon = null;
	}
}

function removeSatelliteOrbitLine() {
	if (orbit_line != null) {
		orbit_line.destroy();
		// Remove also auxiliary lines
		orbit_line = null;
		orbit_line_aux.destroy(),
			orbit_line_aux2.destroy();
		orbit_line_aux = null,
			orbit_line_aux2 = null;
	}
}

function getBaseStationLocation() {
	base_latitude = base_polygon.getPoints()[0].lat;
	base_longitude = base_polygon.getPoints()[0].lng;
	base_latitude_label = labelCoords(base_latitude, base_longitude).latitude_label;
	base_longitude_label = labelCoords(base_latitude, base_longitude).longitude_label;
	base_height_label = roundToPrecisionKm(base_height);
}

function redrawSatellite() {
	if (sat_name == null)
		return; // To avoid problems if the satellite eventually is removed right before redrawing

	sat_marker.setLatLng([sat_latitude - 4, sat_longitude + 0.5]); // Small adjustment to center the icon exactly on the coordinates ;-)
	sat_marker.bindPopup('<b>' + sat_name + '</b><br>' + sat_latitude_label + '&deg; ' + sat_longitude_label + '&deg; ' + sat_altitude_label + ' Km', {
		maxWidth: 125,
		closeButton: false
	});

	if (focus_sat_auto)
		sat_marker.openPopup(); // Always show the satellite popup
}

function focusSatellite() {
	if (sat_name != null)
		earth_webgl.setView([sat_latitude, sat_longitude]);
}

function initializeNewSatellite() {
	calculateSatPresentCoords();
	drawSatellite(); // Create the satellite marker and put it on the screen
	createSatelliteFootprintPolygon();
	createSatelliteOrbitLine();
	refreshSatelliteHtmlTable();
	focusSatellite(); // Focus viewing angle on the satellite
}

document.getElementById('tle_file_input').onchange = function() {

	var file = this.files[0];
	var reader = new FileReader();
	reader.onload = function(progressEvent) {

		console.log("List of satellites found in TLE file:");
		sat_tle_file_all_lines = this.result.split(/\r?\n/);
		//sat_tle_file_all_lines.sort(); 

		var bad_format = false;
		var satellitesHTML = document.getElementById("satellite_list");
		var option = document.createElement("option");

		satellitesHTML.options.length = 0; // Clean satellite list to recreate it later

		option.text = "(None)";
		satellitesHTML.add(option);

		if (sat_tle_file_all_lines.length < 3 || (sat_tle_file_all_lines.length - 1) % 3 != 0) // See if the TLE files has a bare minimum number of lines, and if the total number of lines is a multiple of 3
			bad_format = true;

		if (!bad_format) // Check if the file is in the TLE format (a very simplistic check...)
			if (!sat_tle_file_all_lines[0].match(/^\S+/) || !sat_tle_file_all_lines[1].match(/^1\s+/) || !sat_tle_file_all_lines[2].match(/^2\s+/))
				bad_format = true;

		if (!bad_format)
			for (var s = 0; s < sat_tle_file_all_lines.length - 1; s = s + 3) {
				console.log(sat_tle_file_all_lines[s]);
				option = document.createElement("option");
				option.text = sat_tle_file_all_lines[s];
				satellitesHTML.add(option);
			}

		if (bad_format) {
			satellitesHTML.disabled = true;
			console.log("No satellites found.");
		} else
			satellitesHTML.disabled = false;

		removeSatellite();
		satellitesHTML.selectedIndex = "0";

		getSerialPorts(); // Refresh serial ports

	};

	reader.readAsText(file);

}

document.getElementById("satellite_list").onchange = function() {

	if (sat_tle_file_all_lines.length == 0)
		return;

	var index = this.selectedIndex;

	removeSatellite();

	if (index != 0) { // Any option but "None"
		sat_name = sat_tle_file_all_lines[(index * 3) - 3]; // The '-3' is necessary to ignore the first field of the select list ("none")
		sat_tle_line_1 = sat_tle_file_all_lines[(index * 3 + 1) - 3];
		sat_tle_line_2 = sat_tle_file_all_lines[(index * 3 + 2) - 3];
		initializeNewSatellite();
	}

	getSerialPorts(); // Refresh serial ports

}

function refreshBaseHtmlTable() {
	document.getElementById('table_base_latitude').innerHTML = base_latitude_label;
	document.getElementById('table_base_longitude').innerHTML = base_longitude_label;
	document.getElementById('table_base_height').innerHTML = base_height_label;
}

function refreshSatelliteHtmlTable() {
	if (sat_name != null) { // Fill the table only if a satellite is select
		document.getElementById('table_sat_name').innerHTML = sat_name;
		document.getElementById('table_sat_latitude').innerHTML = sat_latitude_label;
		document.getElementById('table_sat_longitude').innerHTML = sat_longitude_label;
		document.getElementById('table_sat_azimuth').innerHTML = sat_azimuth_label;
		document.getElementById('table_sat_elevation').innerHTML = sat_elevation_label;
		document.getElementById('table_sat_range').innerHTML = sat_range_label;
		document.getElementById('table_sat_altitude').innerHTML = sat_altitude_label;
		document.getElementById('table_sat_footprint').innerHTML = sat_footprint_label;
		document.getElementById('table_sat_velocity').innerHTML = sat_velocity_label;
		document.getElementById('table_sat_doppler').innerHTML = sat_doppler_label;
		document.getElementById('table_sat_transit_start').innerHTML = sat_transit_start_label;
		document.getElementById('table_sat_transit_end').innerHTML = sat_transit_end_label;
		// Update the base station HTML also with information about satellite footprint incidence
		if (sat_base_on_footprint)
			document.getElementById('table_base_on_footprint').innerHTML = "Yes";
		else
			document.getElementById('table_base_on_footprint').innerHTML = "No";
	} else // If a satellite is not defined, then empty the table
		clearSatelliteHtmlTable();
}

function clearSatelliteHtmlTable() {
	document.getElementById('table_sat_name').innerHTML = "-";
	document.getElementById('table_sat_latitude').innerHTML = "-";
	document.getElementById('table_sat_longitude').innerHTML = "-";
	document.getElementById('table_sat_azimuth').innerHTML = "-";
	document.getElementById('table_sat_elevation').innerHTML = "-";
	document.getElementById('table_sat_range').innerHTML = "-";
	document.getElementById('table_sat_altitude').innerHTML = "-";
	document.getElementById('table_sat_footprint').innerHTML = "-";
	document.getElementById('table_sat_velocity').innerHTML = "-";
	document.getElementById('table_sat_doppler').innerHTML = "-";
	document.getElementById('table_sat_transit_start').innerHTML = "-";
	document.getElementById('table_sat_transit_end').innerHTML = "-";
	document.getElementById('table_base_on_footprint').innerHTML = "No";
}