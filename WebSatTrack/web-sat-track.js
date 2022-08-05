// Defining main WebGL objects to be shown
var earth_webgl = null;
var base_polygon = null;
var sun_marker = null;
var moon_marker = null;
var sat_marker = null;
var footprint_polygon = null;
var orbit_line = null,
	orbit_line_aux = null,
	orbit_line_aux2 = null;

// Defining base station global variables
var base_latitude = 38.7; // Lisbon latitude
var base_longitude = -9; // Lisbon longitude
var base_height = 0.1; // Lisbon mean height (Km)
var base_latitude_label = null;
var base_longitude_label = null;
var base_height_label = null;

// Defining satellite global variables
var sat_name = null;
var sat_tle_file_all_lines = [];
var sat_tle_line_1 = null,
	sat_tle_line_2 = null;
var sat_latitude = 0;
var sat_longitude = 0;
var sat_azimuth = 0;
var sat_elevation = 0;
var sat_range = 0;
var sat_altitude = 0;
var sat_footprint = 0;
var sat_velocity = 0;
var sat_doppler = 0;
var sat_transit_start = null;
var sat_transit_end = null;
var sat_latitude_label = null;
var sat_longitude_label = null;
var sat_azimuth_label = null;
var sat_elevation_label = null;
var sat_range_label = null;;
var sat_altitude_label = null;
var sat_footprint_label = null;
var sat_velocity_label = null;
var sat_doppler_label = null;
var sat_transit_start_label = null;
var sat_transit_end_label = null;
var sat_base_on_footprint = false;

// Defining Sun global variables
var sun_latitude = 0;
var sun_longitude = 0;
var sun_distance = 149600000; // Km
var sun_azimuth = 0;
var sun_elevation = 0;
var sun_base_daylight = false;
var sun_latitude_label = null;
var sun_longitude_label = null;
var sun_azimuth_label = null;
var sun_elevation_label = null;
var sun_distance_label = null;

// Defining Moon global variables
var moon_latitude = 0;
var moon_longitude = 0;
var moon_azimuth = 0;
var moon_elevation = 0;
var moon_distance = 384000; // Km
var moon_latitude_label = null;
var moon_longitude_label = null;
var moon_azimuth_label = null;
var moon_elevation_label = null;
var moon_distance_label = null;

// Defining serial port global variables
var serial_port = null;
var serial_port_list = null;
var serial_connection_id = 0;
var serial_az_i = 0;
var serial_az_d = 0;
var serial_elev_i = 0;
var serial_elev_d = 0;

// Other global variables
var draw_sat_footprint = true;
var earth_zoom = 1.75;
var draw_sat_orbit = true;
var data_refresh_rate = 5; // Seconds
var precision_deg = 2;
var precision_km = 3;
var precision_doppler = 3;
var antenna_min_elevation = 1;
var focus_sat_auto = false;
var current_time = new Date();

function initialize() {

	console.log("### WEBSATTRACK STARTUP ###");

	// Deactivate HTML elements while the WebGL API starts
	disableAllHtmlInteractions();

	var options = {
		sky: true, // Real sky background (this will override the CSS background)
		atmosphere: true,
		dragging: true,
		tilting: true,
		zooming: true,
		center: [46.8011, 8.2266],
		zoom: earth_zoom
	};

	earth_webgl = new WE.map('earth_div', options);

	WE.tileLayer('./data/images/tiles_openstreetmap/{z}/{x}/{y}.png', {
		tileSize: 128,
		bounds: [
			[-85, -180],
			[85, 180]
		],
		minZoom: 0,
		maxZoom: 16,
		attribution: 'WebSatTrack',
		tms: false,
		zoom: 2
	}).addTo(earth_webgl);

	// Start animation
	var before = null;
	requestAnimationFrame(function animate(now) {
		var c = earth_webgl.getPosition();
		var elapsed = before ? now - before : 0;
		before = now;
		if (!focus_sat_auto) // Don't rotate the earth if focusing on the satellite
			earth_webgl.setCenter([c[0], c[1] + 0.1 * (elapsed / 100)]);
		requestAnimationFrame(animate);
	});

	// Define default base station and satellite, Sun and Moon
	createDefaultBaseStation();
	createDefaultSatellite();
	createSun();
	createMoon();

	// Show serial port list
	getSerialPorts();

	// Activate HTML elements
	enableAllHtmlInteractions();

	// Start program loop
	var l = 0;
	var boot = true;
	window.setInterval(function() {

		console.log("(Iterating...)");

		// Get current time
		current_time = new Date();
		console.log("Time: " + timeString(current_time));

		// Get current base station location
		getBaseStationLocation();
		console.log("Base station: " + base_latitude + "|" + base_longitude + "|" + base_height + "|" + sun_base_daylight + "|" + sat_base_on_footprint);

		if (l % data_refresh_rate == 0) {

			// Calculate satellite, Sun and Moon info
			calculateSatPresentCoords();
			calculateSunPresentCoords();
			calculateMoonPresentCoords();

			// Set satellite, Sun and Moon position on the screen and change popups
			if (!boot)
				redrawSatellite();
			redrawSun();
			redrawMoon();

			// Draw satellite footprint polygon and orbit lines
			createSatelliteFootprintPolygon();
			createSatelliteOrbitLine();

			// Refresh HTML tables
			refreshSatelliteHtmlTable();
			refreshSunHtmlTable();
			refreshMoonHtmlTable();

			// Debug logs
			console.log("Satellite: " + sat_name + "|" + sat_latitude + "|" + sat_longitude + "|" + sat_azimuth + "|" + sat_elevation + "|" + sat_range + "|" + sat_altitude + "|" + sat_footprint + "|" + sat_velocity + "|" + sat_doppler);
			console.log("Sun: " + sun_latitude + "|" + sun_longitude + "|" + sun_azimuth + "|" + sun_elevation + "|" + sun_distance);
			console.log("Moon: " + moon_latitude + "|" + moon_longitude + "|" + moon_azimuth + "|" + moon_elevation + "|" + moon_distance);

			// Serial port communication
			sendAzElevToSerialPort();

			l = 0;
		}

		// Focus on the satellite
		if (focus_sat_auto)
			focusSatellite();

		// Write auxiliary information on the screen
		refreshCurrentTimeHtml();
		refreshBaseHtmlTable();

		l++;
		boot = false;

	}, 1000); // Repeat (polling in ms)

}

window.addEventListener('load', initialize);