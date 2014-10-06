<?php
/*
 * getDirections.php
 * gets directions from google using API key
 */

date_default_timezone_set('UTC');

# Geth the key, and default regions
include('config.php');

$req = '';

if(isset($_POST['json'])) {
	# get the json from FBR javascript ajax call
	$req = json_decode($_POST['json']);
} else {
	print("Error");
	return;
}

# Build url from parameters
$url = 'https://maps.googleapis.com/maps/api/directions/json?' .
	'key=' . DAPIKEY . '&' .
	'region=' . REGION . '&' .
	'mode=' . $req->travelMode . '&';

# avoid HW? Can add additonal options such as tolls and ferries but requires work upstream as well
if ( $req->avoidHighways ) {
	$url .= 'avoid=highways&';
}

# set origin type
if ( $req->otypell ) {
	$url .= 'origin=' . $req->origin->k . ',' . $req->origin->B . '&';
} else {
	$url .= 'origin=' . $req->origin . '&';
}

# set destination type
if ( $req->dtypell ) {
	$url .= 'destination=' . $req->destination->k . ',' . $req->destination->B;
} else {
	$url .= 'destination=' . $req->destination;
}

# Check output
# print('{"sent":"'.$url.'"}');

# Request directions from API
# create curl request handler
$ch = curl_init();

# set options
curl_setopt($ch, CURLOPT_URL, str_replace(' ', '', $url)); # convert spaces in url
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); # return result, don't print
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0); # don't certify, gets too complicated

# print any curl errors if they occured
print(curl_error($ch));

$json_dir = curl_exec($ch);
curl_close($ch);

print(json_encode($json_dir));
?>
