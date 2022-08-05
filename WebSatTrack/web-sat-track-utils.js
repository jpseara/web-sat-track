function rev(angle) {
	return angle - Math.floor(angle / 360.0) * 360.0;
}

function sind(angle) {
	return Math.sin((angle * Math.PI) / 180.0);
}

function cosd(angle) {
	return Math.cos((angle * Math.PI) / 180.0);
}

function tand(angle) {
	return Math.tan((angle * Math.PI) / 180.0);
}

function asind(c) {
	return (180.0 / Math.PI) * Math.asin(c);
}

function acosd(c) {
	return (180.0 / Math.PI) * Math.acos(c);
}

function atan2d(y, x) {
	return (180.0 / Math.PI) * Math.atan(y / x) - 180.0 * (x < 0);
}

function labelCoords(latitude, longitude) {

	var latitude_label = 0;
	var longitude_label = 0;

	if (latitude < 0)
		latitude_label = parseFloat(roundToPrecisionDeg(Math.abs(latitude))) + "S";
	if (latitude > 0)
		latitude_label = parseFloat(roundToPrecisionDeg(latitude)) + "N";
	if (longitude < 0)
		longitude_label = parseFloat(roundToPrecisionDeg(Math.abs(longitude))) + "W";
	if (longitude > 0)
		longitude_label = parseFloat(roundToPrecisionDeg(longitude)) + "E";

	return {
		latitude_label: latitude_label,
		longitude_label: longitude_label
	};

}

function roundToPrecisionDeg(deg) {
	return +(Math.round(deg + "e+" + precision_deg) + "e-" + precision_deg);
}

function roundToPrecisionKm(km) {
	if (Math.abs(km) >= 100000) // If distance is too big, then use expontentials
		return km.toExponential(precision_km);
	else
		return +(Math.round(km + "e+" + precision_km) + "e-" + precision_km);
}

function roundToPrecisionDoppler(doppler) {
	if (doppler <= 0) // Invalid Doppler factor
		return 0;
	else {
		if (doppler < 1) // Smaller than 1
			return doppler.toExponential(precision_doppler);
		else // If Doppler is bigger than 1 we have to simplify is notation (eg.: 1.0002348 becomes 1+2.348e-4)
		if (doppler - doppler.toFixed(0) == 0) // Integer (no decimals)
			return doppler.toFixed(0);
		else
			return doppler.toFixed(0) + "+" + ((doppler - doppler.toFixed(0)).toExponential(precision_doppler));
	}
}

function deg2rad(deg) {
	return deg * (Math.PI / 180);
}

function rad2deg(rad) {
	return rad / (Math.PI / 180);
}

function normalizeDegrees(degree) {
	while (degree < 0 || degree > 360) {
		if (degree < 0) {
			degree = degree + (Math.abs(Math.round(degree / 360.0)) + 1) * 360.0;
		} else {
			degree = degree - Math.abs(Math.round(degree / 360.0)) * 360.0;
		}
	}
	return degree;
}

function timeString(date) {

	if (date == null)
		return "-";

	var timeString;

	var yyyy = date.getFullYear();
	var MM = date.getMonth() + 1; //January is 0!
	var dd = date.getDate();
	var hh = date.getHours();
	var mm = date.getMinutes();
	var ss = date.getSeconds();
	var off = (-(date.getTimezoneOffset() / 60)).toFixed(0);

	if (MM < 10) {
		MM = '0' + MM;
	}

	if (dd < 10) {
		dd = '0' + dd;
	}

	if (hh < 10) {
		hh = '0' + hh;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	if (ss < 10) {
		ss = '0' + ss;
	}

	if (off > 0) {
		off = '+' + off;
	} else if (off == 0)
		off = "";

	timeString = yyyy + '/' + MM + '/' + dd + ' | ' + hh + ':' + mm + ':' + ss + ' | UTC' + off;

	return timeString;
}

function timeStringShort(date) {

	if (date == null)
		return "-";

	var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var timeStringShort;

	var MMM = monthNames[date.getMonth()]; // January is 0!
	var dd = date.getDate();
	var hh = date.getHours();
	var mm = date.getMinutes();
	var ss = date.getSeconds();
	var off = (-(date.getTimezoneOffset() / 60)).toFixed(0);

	if (dd < 10) {
		dd = '0' + dd;
	}

	if (hh < 10) {
		hh = '0' + hh;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	if (ss < 10) {
		ss = '0' + ss;
	}

	if (off > 0) {
		off = '+' + off;
	} else if (off == 0)
		off = "";

	timeStringShort = MMM + ' ' + dd + ' ' + hh + ':' + mm;

	return timeStringShort;
}

function sideralSunTime(date, longitude) {
	var T_elapsedDays = date2julian(date) - 2451545.0;
	var T_decHours = (date2julian(date) - date2julianAtMidnightGreenwich(date)) * 24;
	var gmst = 6.6974243242 + 0.0657098283 * T_elapsedDays + T_decHours;
	var lmst = deg2rad(gmst * 15 + longitude);
	return lmst;
}

function sideralMoonTime(date, longitude) {
	var T_elapsedDays = date2julian(date) - 2451545.0;
	var meanAnomalyEarth = normalizeDegrees(357.529 + 0.985608 * T_elapsedDays);
	var piEarth = 102.937;
	var decHour = date.getUTCHours() + date.getUTCMinutes() / 60.0 + date.getUTCSeconds() / 3600.0;
	return normalizeDegrees(meanAnomalyEarth + piEarth + 15 * decHour + longitude);
}

function date2julian(date) {
	var j = date2julianAtMidnightGreenwich(date);
	j += (date.getHours() + ((date.getMinutes() + date.getTimezoneOffset()) / 60.0) + (date.getSeconds() / 3600.0)) / 24;
	return j;
}

function date2julianAtMidnightGreenwich(date) {
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	if (m < 3) {
		m += 12;
		y -= 1;
	}
	var a = Math.floor(y / 100);
	var b = 2 - a + Math.floor(a / 4);
	var j = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + date.getDate() + b - 1524.5;
	return j;
}

function getDistanceAndCenteredAngleBetweenTwoPoints(lat1, lng1, lat2, lng2) {
	var earthR = 6378.137; // Km
	var dLat = deg2rad(lat2 - lat1); // deg2rad below
	var dLng = deg2rad(lng2 - lng1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = earthR * c; // Distance in km
	return {
		distance: d,
		angle: rad2deg(c)
	};
}

function getDestinyPointGivenStartAndAngle(startLat, startLng, distance, angleDeg) {
	var earthR = 6378.137; // Km
	var angleRad = deg2rad(angleDeg); // Bearing is 90 degrees converted to radians.

	var startLatRad = deg2rad(startLat); //Current lat point converted to radians
	var startLngRad = deg2rad(startLng); //Current long point converted to radians

	var destinyLat = Math.asin(Math.sin(startLatRad) * Math.cos(distance / earthR) + Math.cos(startLatRad) * Math.sin(distance / earthR) * Math.cos(angleRad));
	var destinyLng = startLngRad + Math.atan2(Math.sin(angleRad) * Math.sin(distance / earthR) * Math.cos(startLatRad), Math.cos(distance / earthR) - Math.sin(startLatRad) * Math.sin(destinyLat));

	destinyLat = rad2deg(destinyLat);
	destinyLng = rad2deg(destinyLng);

	return {
		latitude: destinyLat,
		longitude: destinyLng
	};
}

function refreshCurrentTimeHtml() {
	document.getElementById('current_time').innerHTML = timeString(current_time);
}

function enableAllHtmlInteractions() {
	document.getElementById('satellite_list').disabled = false;
	document.getElementById('serial_port_list').disabled = false;
	document.getElementById('tle_file_input').disabled = false;
}

function disableAllHtmlInteractions() {
	document.getElementById('satellite_list').disabled = true;
	document.getElementById('serial_port_list').disabled = true;
	document.getElementById('tle_file_input').disabled = true;
}

chrome.commands.onCommand.addListener(function(command) { // Handles user keyboard combinations
	switch (command) {
		case "focus":
			if (sat_name != null) {
				focus_sat_auto = !focus_sat_auto;
				redrawSatellite(); // Force popup to show or to hide right away (better use experience)
				if (focus_sat_auto)
					focusSatellite(); // Focus the image on the satellite right away (better user experience)
			} else
				focus_sat_auto = false;
			break;
		case "fullscreen":
			chrome.app.window.current().fullscreen();
			break;
		default:
			break;
	}
});