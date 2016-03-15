<?php
/*
 * Copyright (C) 2014 Cyrille Medard de Chardon, Geoffrey Caruso
 * writeGMdata.php is called through AJAX from fbr.html
 */

date_default_timezone_set('UTC');

$data = '';
$file_code = '';
$data_type = '';

$data = $_POST['results'];
$file_code= $_POST['file'];
$data_type = $_POST['type'];

// Sanitization
// File code must contain only [0-9], preg_replace omits all other characters
$file_code_clean = preg_replace('/[^0-9a-z]/', '', $file_code);

//content must contain only \t, commas (,), space ( ), underscore (_), digits, periods/decimal (.) and letters a-z,A-Z.
$clean_data = preg_replace('/[^a-zA-Z0-9\_\t\-\. \n,]/', '', $data);

if ($clean_data != $data) {
	//do not create or append to any file, any data
	echo("The input data cannot be written to the server. It is not valid (Contains characters we do not allow for safety reasons!). If you believe this to be a bug please contact the developer.");
	return;
}

// ----- Filename retrieval start -------------
# check if keyfile and output folder are writable
if( !is_writable('key_file.txt') ) {
	print("FBR requires writing permission on 'key_file.txt' for Friendly and strong mode.");
	return;
}
if( !is_writable('output') ) {
	print("FBR requires writing permission on 'output' folder/directory for Friendly and strong mode.");
	return;
}

// Lookup file code correspondance date_time filename
$keyfile = file_get_contents('key_file.txt');
$keylines = explode("\n", $keyfile);

// Compare $file_code_clean against each key to retrieve filename
$filename = '';
$new_file_contents = '';

foreach( $keylines as $fkey ) {
	$fkeyp = explode("\t", $fkey);
	if( $fkeyp[0] == $file_code_clean ) {
		$filename = $fkeyp[1];
	} else {
		// Only keep the records we do not match - in case this is a 'finished' type command
		$new_file_contents .= $fkey . "\n";
	}
}

// We want to delete the filename we found from the key_file.txt
if( $data_type == 'finished' && $filename != '' ) {
	file_put_contents('key_file.txt', $new_file_contents);
	exit();
}

// This is the first request of the set, create new file
if( $filename == '' ) {
	// Didn't find a file with this key, probably new file - create filename and add to keyfile
	$filename = date("Y-m-d_H-i-s");
	$keyfile .= $file_code_clean . "\t" . $filename . "\n";
	file_put_contents('key_file.txt', $keyfile);
}
// ----- Filename retrieval end -------------

//open appropriate file for writing only
switch ($data_type) {
	case "main":
		$fp = fopen('output/' . $filename . '_maindata.txt', 'a');
		break;
		
	case 'path':
		$fp = fopen('output/' . $filename . '_pathdata.txt', 'a');
		break;
}

if($fp) {
	//write data to file
	fwrite($fp, $clean_data . "\n");

	//close file
	fclose($fp);
} else {
	print("Failed to open target file for writing.");
}

?>
