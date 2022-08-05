function calculateMoonPresentCoords() {

	var T = date2julian(current_time) - 2451545.0; // J2000 offset

	var L = 218.316 + 13.176396 * T; // Mean geocentric ecliptic longitude
	var M = 134.963 + 13.064993 * T; // Mean anomaly
	var F = 93.272 + 13.229350 * T; // Mean distance from ascending node

	var ecLatitude = 5.128 * sind(F); // Ecliptic latitude
	var ecLongitude = L + 6.289 * sind(M); // Ecliptic longitude
	var ecDistance = 385001 - 20905 * cosd(M); // Ecliptic distance

	var rightAscension = normalizeDegrees(rad2deg(Math.atan2(sind(ecLongitude) * cosd(23.4397) - tand(ecLatitude) * sind(23.4397), cosd(ecLongitude)))); // Right ascension
	var declination = rad2deg(Math.asin(sind(ecLatitude) * cosd(23.4397) + cosd(ecLatitude) * sind(23.4397) * sind(ecLongitude))); // Declination

	var thetaEarth = sideralMoonTime(current_time, 0); // Sideral time of earth at longitude 0 (Greenwich)
	var thetaBase = sideralMoonTime(current_time, base_longitude); // Sideral time of base station
	var hourAngleEarth = thetaEarth - rightAscension; // Hour angle of earth at longitude 0 (Greenwich)
	var hourAngleBase = thetaBase - rightAscension; // Hour angle of base station

	var latitude = declination;
	if (hourAngleEarth % 360 < 180)
		var longitude = -hourAngleEarth % 360;
	else
		var longitude = -hourAngleEarth % 360 + 360; // Longitude value correction

	var distance = ecDistance;

	var azimuth = rad2deg(Math.atan2(sind(hourAngleBase), cosd(hourAngleBase) * sind(base_latitude) - tand(declination) * cosd(base_latitude))); // Azimuth
	var elevation = rad2deg(Math.asin(sind(base_latitude) * sind(declination) + cosd(base_latitude) * cosd(declination) * cosd(hourAngleBase))); // Elevation

	elevation = elevation + 0.017 / tand(elevation + 10.26 / (elevation + 5.10)); // Apparent elevation (due to atmosphere refraction)

	azimuth = azimuth + 180;
	if (azimuth > 360)
		azimuth = azimuth - 180; // Azimuth quadrant correction

	// Update global variables
	moon_latitude = latitude;
	moon_longitude = longitude;
	moon_azimuth = azimuth;
	moon_elevation = elevation;
	moon_distance = distance;

	// Update labels
	moon_latitude_label = labelCoords(moon_latitude, moon_longitude, moon_distance).latitude_label;
	moon_longitude_label = labelCoords(moon_latitude, moon_longitude, moon_distance).longitude_label;
	moon_azimuth_label = roundToPrecisionDeg(moon_azimuth);
	moon_elevation_label = roundToPrecisionDeg(moon_elevation);
	moon_distance_label = roundToPrecisionKm(moon_distance);

}

function createMoon() {
	calculateMoonPresentCoords();
	drawMoon();
}

function drawMoon() {
	moon_marker = WE.marker([moon_latitude - 4, moon_longitude + 0.5], './data/images/moon.png', 35, 35).addTo(earth_webgl); // Small adjustment to center the icon exactly on the coordinates ;-)
}

function redrawMoon() {
	moon_marker.setLatLng([moon_latitude - 4, moon_longitude + 0.5]); // Small adjustment to center the icon exactly on the coordinates ;-)
	moon_marker.bindPopup('<b>' + "Moon" + '</b><br>' + moon_latitude_label + '&deg; ' + moon_longitude_label + '&deg; ' + moon_distance_label + ' Km', {
		maxWidth: 125,
		closeButton: false
	});
}

function refreshMoonHtmlTable() {
	document.getElementById('table_moon_latitude').innerHTML = moon_latitude_label;
	document.getElementById('table_moon_longitude').innerHTML = moon_longitude_label;
	document.getElementById('table_moon_azimuth').innerHTML = moon_azimuth_label;
	document.getElementById('table_moon_elevation').innerHTML = moon_elevation_label;
	document.getElementById('table_moon_distance').innerHTML = moon_distance_label;
}