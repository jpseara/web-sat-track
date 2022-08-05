function calculateSunPresentCoords() {

	var earthR = 6378.137; // Earth radius in Km
	var astrUnit = 149597871; // Astronomical Unit (mean distance from the Earth to the Sun in Km)

	var T = date2julian(current_time) - 2451545.0;
	var omega = 2.1429 - 0.0010394594 * T; // Longitude of the ascending node
	var meanLongitude = 4.8950630 + 0.017202791698 * T; // Mean longitude
	var meanAnomaly = 6.2400600 + 0.0172019699 * T; // Mean longitude
	var ecLongitude = meanLongitude + 0.03341607 * Math.sin(meanAnomaly) + 0.00034894 * Math.sin(2 * meanAnomaly) - 0.0001134 - 0.0000203 * Math.sin(omega); // Ecliptic longitude
	var ecObliquity = 0.4090928 - Math.pow(6.2140, -9) * T + 0.0000396 * Math.cos(omega); // Ecliptic obliquity

	var dX = Math.cos(ecLongitude); // Rectangular equator coordinate X
	var dY = Math.cos(ecObliquity) * Math.sin(ecLongitude); // Rectangular equator coordinate Y
	var dZ = Math.sin(ecObliquity) * Math.sin(ecLongitude); // Rectangular equator coordinate Z

	var declination = Math.asin(dZ); // Latitude of the Sun in the Earth surface
	var rightAscension = Math.atan2(dY, dX);
	if (rightAscension < 0.0)
		rightAscension = rightAscension + 2 * Math.PI;
	var hourAngleEarth = sideralSunTime(current_time, 0) - rightAscension; // Hour angle of the Earth at longitude 0 (Greenwich)
	var hourAngleBase = sideralSunTime(current_time, base_longitude) - rightAscension; // Hour angle of the base station

	var latitude = rad2deg(declination); // The declination of the Earth's position is the latitude of the Sun in the Earth's surface

	if (rad2deg(hourAngleEarth) % 360 < 180)
		var longitude = -rad2deg(hourAngleEarth) % 360;
	else
		var longitude = -rad2deg(hourAngleEarth) % 360 + 360; // The hour angle of the Earth's position at current time is the longitude of the Sun in the Earth's surface

	var distance = astrUnit; // 1AU = Distance from the Earth to the Sun

	var dX2 = Math.tan(declination) * Math.cos(deg2rad(base_latitude)) - Math.sin(deg2rad(base_latitude)) * Math.cos(hourAngleBase); // Rectangular coordinate X at the base station coordinates
	var dY2 = -Math.sin(hourAngleBase); // Rectangular coordinate Y at the base station coordinates

	var azimuth = Math.atan2(dY2, dX2);
	if (azimuth < 0.0)
		azimuth = azimuth + 2 * Math.PI;
	azimuth = rad2deg(azimuth); // Azimuth calculation

	var zenith = Math.acos(Math.cos(deg2rad(base_latitude)) * Math.cos(hourAngleBase) * Math.cos(declination) + Math.sin(declination) * Math.sin(deg2rad(base_latitude))); // Sun zenith and base station angle calculation
	var parallax = (earthR / astrUnit) * Math.sin(zenith); // Parallax correction calculations to fix discrepancies in the Sun apparent position
	var elevation = 90 - rad2deg(zenith + parallax); // Elevation calculation

	var daylight = false;
	if (elevation > 0)
		daylight = true;

	// Update global variables
	sun_latitude = latitude;
	sun_longitude = longitude;
	sun_azimuth = azimuth;
	sun_elevation = elevation;
	sun_distance = distance;
	sun_base_daylight = daylight;

	// Update labels
	sun_latitude_label = labelCoords(sun_latitude, sun_longitude).latitude_label;
	sun_longitude_label = labelCoords(sun_latitude, sun_longitude).longitude_label;
	sun_azimuth_label = roundToPrecisionDeg(sun_azimuth);
	sun_elevation_label = roundToPrecisionDeg(sun_elevation);
	sun_distance_label = roundToPrecisionKm(sun_distance);
}

function createSun() {
	calculateSunPresentCoords();
	drawSun();
}

function drawSun() {
	sun = WE.marker([sun_latitude - 4, sun_longitude + 0.5], './data/images/sun.png', 35, 35).addTo(earth_webgl); // Small adjustment to center the icon exactly on the coordinates ;-)
}

function redrawSun() {
	sun.setLatLng([sun_latitude - 4, sun_longitude + 0.5]); // Small adjustment to center the icon exactly on the coordinates ;-)
	sun.bindPopup('<b>' + "Sun" + '</b><br>' + sun_latitude_label + '&deg; ' + sun_longitude_label + '&deg; ' + sun_distance_label + ' Km', {
		maxWidth: 125,
		closeButton: false
	});
}

function refreshSunHtmlTable() {
	document.getElementById('table_sun_latitude').innerHTML = sun_latitude_label;
	document.getElementById('table_sun_longitude').innerHTML = sun_longitude_label;
	document.getElementById('table_sun_azimuth').innerHTML = sun_azimuth_label;
	document.getElementById('table_sun_elevation').innerHTML = sun_elevation_label;
	document.getElementById('table_sun_distance').innerHTML = sun_distance_label;

	// Update the base station HTML also with information about daylight incidence
	if (sun_base_daylight)
		document.getElementById('table_base_sunlight').innerHTML = "Yes";
	else
		document.getElementById('table_base_sunlight').innerHTML = "No";
}