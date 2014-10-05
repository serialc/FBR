// Copyright (C) 2014 Cyrille Medard de Chardon, Geoffrey Caruso

//global variable
var CmGm = {
	//Google maps
	directionsDisplay: '',
	directionsService: new google.maps.DirectionsService(),
	map: {},
	query_status: '',
	mode: 'friendly' // 'friendly', 'strong', is set on initialization
	};

CmGm.initialize = function () {
	// bind onclick handling
	CmGm.interactionInit();
	//setup Google Maps
    CmGm.directionsDisplay = new google.maps.DirectionsRenderer();
    var latlng = new google.maps.LatLng(49.61, 6.1296);
    var myOptions = {
      zoom: 10,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    CmGm.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	CmGm.directionsDisplay.setMap(CmGm.map);
	
};
 
// Sets up all the interactions
CmGm.interactionInit = function () {
	// selecting the FBR mode
	$('.fbr_selectable').click(function(event) {
			if(this.attributes.for.value === 'fbrm_sf') {
				CmGm.setFBRMode('friendly');
			} else {
				CmGm.setFBRMode('strong');
			}
			$('#fbr_mode_sel_text').hide('slow');
		});

	// display the fbr modes info
	$('#mode_toggle').click(function(event) {
		if( $('#fbr_mode_sel_text').is(':visible') ) {
			$('#fbr_mode_sel_text').hide('slow');
		} else {
			$('#fbr_mode_sel_text').show('slow');
		} });

	// toggle the options window
	$('#options_toggle').click(function(event) {
		if( $('#optwin').is(':visible') ) {
			$('#optwin').hide('slow');
			$('#options_toggle').html('Show');
		} else {
			$('#optwin').show('slow');
			$('#options_toggle').html('Hide');
		} });

	// start in friendly mode
	CmGm.setFBRMode('friendly');

	// check journey list textarea values when they change
	$('#journeylist').on("change keyup paste focus", CmGm.countRecords);
}

CmGm.setFBRMode = function (mode) {
	// set the global variable mode
	CmGm.mode = mode;

	// remove any warnings
	$('#topwarn').html('').hide();

	// hide the results sections
	$('#fbr_res_sf').hide('fast');
	$('#fbr_res_fas').hide('fast');

	// server free mode but limited functionality
	if( mode === 'friendly' ) {
		// display the mode and set the global param.
		$('#mode_toggle').html('Super friendly');

		// disable the record path coordinates
		$('#getPath').attr('disabled', true);
		$('#getPath').prop('checked', false);
		
		// display the correct results section
		$('#fbr_res_sf').show('fast');

		// force check box selection in case the was done other than actually clicking on 'button'
		$('#fbrm_sf').prop('checked', true);
	}
	// heavy lifting, server needed full functionality
	if( mode === 'strong' ) {
		// display the mode and set the global param.
		$('#mode_toggle').html('Friendly and strong')
		
		// enable the record path coordinates
		$('#getPath').removeAttr('disabled');

		// display the correct results section
		$('#fbr_res_fas').show('fast');
		
		// check if the FBR is being used on a proper server
		if (window.location.protocol === 'file:') {
			$('#topwarn').html("<div class='tb'><h3>Error</h3><p>You MUST place FBR on a server and access it through http protocol.</p><p>Your URL should resemble the form <em><strong>http://localhost/FBR/index.html</strong></em></p><p>While FBR may display the route on the map, <strong>your results will not be saved</strong>.</p><p>Either correct the URL or use the <span class='msel button_like fbr_selectable' onclick=\"CmGm.setFBRMode('friendly')\">Super friendly</span> version.</p></div>");
			$("#topwarn").show('fast');
		}

		// force check box selection in case the was done other than actually clicking on 'button'
		$('#fbrm_fas').prop('checked', true);
	}
}

// counts the number of rows/records submited
CmGm.countRecords = function () {
	if( CmGm.journey_list && $(this).val() == CmGm.journeylist ) {
		// contents are the same as before, do not process, skip
		return;
	}

	// new contents of textarea - parse
	CmGm.journey_list = $(this).val();

	// local variables for parsing
	var recs, bad_recs = 0, valid_recs,
		line_array,
		errors_or_warnings = '',
		skipped_blank_lines = 0,
		line_counter = 0,
		semi_colon_check,
		orig, dest,
		index;

	//Determine the length (number of lines) entered
	line_array = CmGm.journey_list.split('\n');
	recs = line_array.length;
	
	//go through each line and check for existence and correct syntax
	for (index in line_array) {
		if (line_array[index].length === 0) {
			skipped_blank_lines += 1;
			continue;
		} else {
			//not a blank line so check validity

			// check number of semi colons
			semi_colon_check = line_array[index].match(/;/g);

			// if wrong number of semi colons send warning
			if ( semi_colon_check == null || semi_colon_check.length !== 2 ) {
				errors_or_warnings += "Line " + line_counter + " has incorrect semi-colon syntax. There should be two semi colons per line. Correct syntax is: id;origin;destination<br>";
				bad_recs += 1;
			} else {
				// Has correct number of semi-colons, check commas on origin and destination

				// if lat/lng for origin and destination need to check number of commas 
				if( $('#origtype').prop('checked') === true ) {
					orig = line_array[index].split(';')[1].match(/,/g);
					if( orig === null || orig.length !== 1) {
						errors_or_warnings += "Line " + line_counter + " [<em>" + line_array[index] + "</em>] has <strong>incorrect origin comma syntax</strong>. The <strong>origin</strong> latitude and longitude should be separated by a comma. Correct syntax is: latitude,longitude<br>";
						bad_recs += 1;
					}
				}
				// for destination, only check if there is no problem with the origin
				if( $('#desttype').prop('checked') === true ) {
					dest = line_array[index].split(';')[2].match(/,/g);
					if( dest === null || dest.length !== 1) {
						errors_or_warnings += "Line " + line_counter + " [<em>" + line_array[index] + "</em>] has <strong>incorrect destination comma syntax</strong>. The <strong>destination</strong> latitude and longitude should be separated by a comma. Correct syntax is: latitude,longitude<br>";
						bad_recs += 1;
					}
				}
			}
		}

		line_counter += 1;
	} // end of going through lines/records
	
	// print out any errors from parsing
	valid_recs = recs - skipped_blank_lines - bad_recs;

	$("#rec_count").html("<small>" + valid_recs + " valid record(s), " +
		skipped_blank_lines + " blank line(s), " +
		bad_recs + " error(s).</small>");

	// if we are in super friendly mode give warning about too many requests
	if (recs > 50 && CmGm.mode === 'friendly') {
		errors_or_warnings = "<p>Warning: Too many requests in FBR Super friendly mode can slow down your browser. Your results will not be saved automatically. You will need to copy and paste the results from the textarea below or the results will be lost. We suggest using FBR Friendly and strong mode for more than 50 requests.<p>";
		errors_or_warnings += "<p>Warning: The Google Maps API will not complete more than 50-100 sequential requests unless you use an API key.</p>";
	}
	
	// Prepare and print error/warning messages regarding count or format of input
	if (recs > 2500 && CmGm.mode === 'strong') {
		errors_or_warnings += "<p>Warning: The Google Maps API has a query <a href='http://code.google.com/intl/fr/apis/maps/documentation/directions/#Limits'>limit</a> of 2,500 direction requests per day. <strong>If you have enabled billing THIS MAY COST YOU MONEY.</strong></p>";
	}
	
	if (errors_or_warnings) {
		$("#warn").html(errors_or_warnings);
		$("#warn").show('fast');
	} else {
		$("#warn").hide('fast');
	}
};

//stops route calculations
CmGm.stopCalc = function () {
	$("#b_stop").hide();
	CmGm.query_status = false;
	// Force display of maximize buttons
	CmGm.lockdown(false);
};

// lockdown mode, no options can be changed while processing
CmGm.lockdown = function( lock_it_down ) {
	if( lock_it_down ) {
		$('#optwin').hide('slow');
		$('#fbr_mode_sel_text').hide('slow');
		$('#options_toggle').hide('slow');
		$('#mode_toggle').hide('slow');
	} else {
		$('#options_toggle').show('slow');
		$('#mode_toggle').show('slow');
	}
};

//user clicks button to call this function
CmGm.calcRoute = function () {
	// NEED TO disable all checkboxes and mode change
	CmGm.lockdown(true);
	// jump to top of page otherwise hidding the options panels will scroll us to the bottom of the page
	window.location.hash = 'mode_toggle';

	// init vars
	var orig, dest, journey, journies,
		ttl_journies, num_journies, process_progress,
		request_state = 0, request, request_result, request_line,
		i, dump, an_error, error_count, print_results,
		theleg,
		fbr_opts = { 
			// get the 'friendly' or 'strong' mode name
			mode: CmGm.mode,
			//  create a code to send to server for correspondence to a file
			file_code:  Math.random().toString(36).substr(2),
			// get the value to separate data items with
			spacer: $('input[name=fbr_op_sepval]:checked').val(),
			// Get the the type of travel the user desires
			ttype: $('input[name=fbr_op_tt]:checked').val(),
			// Get the status of the highway avoid checkbox
			hwavoid: $('#hwavoid').prop('checked'),
			// Get the paths of the directions
			getpaths: $('#getPath').prop('checked'),
			// Pause time between requests
			wait_time: 500 + parseInt(Math.abs($("#waittime").val()),10),
			// Get format type of origin/destination: address || lat, long
			origtypelatlong: $("#origtype").prop('checked'),	//true, false value
			desttypelatlong: $("#desttype").prop('checked'),	//true, false value
			// Get the selected output separator
			sepval: $("input:radio[name='sepval']:checked").val()},
		// functions declared to be defined later
		getDirection, sendRequest, parseDirectionResults;
		
	// need to keep global track of errors
	error_count = 0

	// add headings to results page and wipe clear the results
	$('#sf_res_textarea').val($('#sf_res_textarea').val() +
					'id'+ fbr_opts.spacer +
					'olat' + fbr_opts.spacer +
					'olng' + fbr_opts.spacer +
					'dlat' + fbr_opts.spacer +
					'dlng' + fbr_opts.spacer +
					'time_s' + fbr_opts.spacer +
					'dist_m' + fbr_opts.spacer +
					'inst_steps' + '\n');	//the number of instruction steps / complexity?.
	
	// clear previous results
	$("#jdist").val(''); // holds the input data of the problem record (these can be copy/pasted into the input window)
	$("#warn_error_msg").val(''); // shows the error messages
	$('#error_section').hide('fast');
	
	// set status to true, this is used to stop processing if needed
	CmGm.query_status = true;
	$("#b_stop").show();	//show the button to stop process
	$("#prog_box").show();	//show the progress bar
	
	// get the input from the textarea
	journies = $("#journeylist").val().split('\n');

	// get the number of journies to process, set variables needed to keep track of progress
	num_journies = ttl_journies = journies.length;
	request_line = 0;
	process_progress = 0

	// function variable name declared earlier
	getDirection = function() {

		// if finished processing a route but the user terminated the job...
		if(request_state === 0 && CmGm.query_status === false) {
			// num_journies contains the number of records left to process
			// rebuild the list of unprocessed journies
			while(num_journies--) {
				dump += journies[ request_line++ ] + '\n';
			}
			// place the unfinished jobs in the main input text area
			$("#journeylist").val(dump);
			
			// At end of processing show options and modes maximize buttons
			CmGm.lockdown(false);

			return;	// exit the function 
		}
		
		// The switch statements, based on request_state, is the main control flow of the program
		// Process next result if previous finished (0), otherwise wait (1), stop if an error has occurred (2).
		switch(request_state) {
			case 0:
				//everything normal, ask for next record
				// num_journies is false when 0
				if(num_journies--) {
					//split the row based on semi-colons
					journey = journies[ request_line++ ].split(';');
					
					// reset error detection variable
					an_error = false;
					
					//determine the type of the origin, assume it is a number if not then it must be an address
					if(fbr_opts.origtypelatlong && isNaN(journey[1].split(',')[0])) {
						//user indicated lat/long but text submitted rather than a number
						fbr_opts.origtypelatlong = false;
						$("#warn").html("Warning: Origin format has been changed to String<br>");
						$("#warn").show('fast');
						$("#origtype").attr('checked', false);//unchecks the checkbox
						an_error = true;
					} else {
						//do nothing the user has indicated correctly the format
						//hide the warning message whether it is visible or not
						$("#warn").hide('fast');
					}
					
					//determine the type of the destination, assume it is a number if not then it must be an address
					if(fbr_opts.desttypelatlong && isNaN(journey[2].split(',')[0])) {
						// Failed a string was entered but a number expected
						fbr_opts.desttypelatlong = false;
						
						// If we already had an error we must not overwrite message
						if(an_error) {
							$("#warn").html($("#warn").html() + "Warning: Destination format has been changed to String");
						} else {
							$("#warn").html("Warning: Destination format has been changed to String");
						}
						
						$("#warn").show('fast');
						$("#desttype").attr('checked', false);//unchecks the checkbox
					} else {
						// Hide the warning message whether it is visible or not
						if(!an_error) {
							$("#warn").hide('fast');
						}
					}
					
					// Give origin the appropriate value type
					if(fbr_opts.origtypelatlong) {	//lat/long
						orig = journey[1].split(',');
						orig = new google.maps.LatLng(orig[0], orig[1]);
					} else {	// string
						orig = journey[1];
					}
					
					// Give destination the appropriate value type
					if(fbr_opts.desttypelatlong) {	// lat/long
						dest = journey[2].split(',');
						dest = new google.maps.LatLng(dest[0],dest[1]);
					} else {	// string
						dest = journey[2];
					}
					
					// Prepare request object
					request = {
						origin: orig,
						destination: dest,
						avoidHighways: fbr_opts.hwavoid,
						travelMode: google.maps.DirectionsTravelMode[fbr_opts.ttype]
					};
					
					// Update the progress bar
					process_progress = (ttl_journies - num_journies) * 100 / ttl_journies;
					$("#prog_bar_size").css("width", process_progress + "%");
					$("#prog_text").html("Process " + process_progress.toFixed(1) + "% complete (" + (ttl_journies - num_journies) + "/" + ttl_journies + ")")
					
					// Call the function that sends the request to Google
					sendRequest(request,journey[0],i);
					
					// Call this function (in which we are in now) again in a set amount of time
					setTimeout(getDirection, fbr_opts.wait_time);
					
					// indicate we are in a waiting state
					request_state = 1;
				} else {
					request_state = 4;
					setTimeout(getDirection, 0);
				}

				break;

			case 1:
				// Still waiting for results
				setTimeout(getDirection, fbr_opts.wait_time);
				break;

			case 2:
				// Important error has occured, stop processing
				document.getElementById('warn_error_msg').value += "Stopped data gathering due to error. Remove completed and problematic records from input and resume.\n";
				request_state = 4;
				setTimeout(getDirection, 0);
				break;

			case 4:
				// Finished processing all records/journies, hide appropriate content.
				$("#cmpper").show();
				if ( error_count > 0 ) {
					$("#cmpper").html("Processing complete but with " + error_count + " retrieval errors.");
					$("#cmpper").css("background-color", "orange")
				} else {
					$("#cmpper").html("Processing complete without any retrieval errors.");
					$("#cmpper").css("background-color", "lightgreen")
				}
				
				// Hide the progress bar
				setTimeout(function() { $("#prog_box").hide("slow"); }, 3000);
				
				// At end of processing show options and modes maximize buttons
				CmGm.lockdown(false);

				if( fbr_opts.mode === 'strong' ) {
					// Ajax command to delete file key
					$.ajax({
						type: 'POST',
						url: 'writeGMdata.php',
						data: {type: 'finished', file: fbr_opts.file_code}
					});
				}

				// Hide the stop button again
				$("#b_stop").hide();

				break;
		}
	}; //end of method function call

	// define the sendRequest function here so we can access the 'request_state' variable from the callback function of the GMaps API request.
	//Needs to be placed in a seperate function so that each sendRequest function object has different olat/olong data
	sendRequest = function (request, LLid, query_num) {
		print_results = '';
		
		parseDirectionResults = function(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				
				// we do not display friendly and strong results
				if (fbr_opts.mode == 'friendly') {
					CmGm.directionsDisplay.setDirections(result);
				}
				
				// for simplicity copy
				theleg = result.routes[0].legs[0];
				
				//display any warnings related to the route
				for( i = 0; i < result.routes[0].warnings.length; i++ ) {

					//Google pedestrian warning regarding the absence of sidewalks
					if(fbr_opts.ttype === 'WALKING') {
						$("#warn").html(result.routes[0].warnings[0]).show('slow');
					} else {
						document.getElementById('warn_error_msg').value += LLid + fbr_opts.spacer + result.routes[0].warnings[i] + '\n';
					}
				}
		
				//combine and format all the data into one string
				if ( typeof(theleg.start_location.lat) === 'function' ) {
					print_results =
						LLid + fbr_opts.spacer +
						theleg.start_location.lat() + fbr_opts.spacer +
						theleg.start_location.lng() + fbr_opts.spacer +
						theleg.end_location.lat() + fbr_opts.spacer +
						theleg.end_location.lng() + fbr_opts.spacer +
						theleg.duration.value + fbr_opts.spacer +
						theleg.distance.value + fbr_opts.spacer +
						theleg.steps.length;	//the number of instruction steps / complexity?.
				} else {
					print_results =
						LLid + fbr_opts.spacer +
						theleg.start_location.lat + fbr_opts.spacer +
						theleg.start_location.lng + fbr_opts.spacer +
						theleg.end_location.lat + fbr_opts.spacer +
						theleg.end_location.lng + fbr_opts.spacer +
						theleg.duration.value + fbr_opts.spacer +
						theleg.distance.value + fbr_opts.spacer +
						theleg.steps.length;	//the number of instruction steps / complexity?.
				}

				// See if we are in Super friendly or Friendly and strong mode
				if( fbr_opts.mode == 'friendly' ) {
					// Append results to text area, simple
					$('#sf_res_textarea').val($('#sf_res_textarea').val() + print_results + '\n');
				}
				if( fbr_opts.mode == 'strong' ) {
					//try to send results to file using jquery AJAX
					$.ajax({
						type: 'POST',
						url: 'writeGMdata.php',
						data: {results: print_results, file: fbr_opts.file_code, type: 'main'}
					})
					.done(function( message ) {
						if( message.length != 0 ) {
							$('#warn_error_msg').val(LLid + fbr_opts.spacer + 'Failed search query number: ' +
								query_num + ' - An error occurred while trying to submit data to server! Message: ' +
								message + '\'\n');
							$('#error_section').show('fast');
							$("#warn").html('Error encountered see details in Errors section below.');
							$("#warn").show('fast');
							// Retrieved data from Google Maps API successfully, but failed to save results!
							request_state = 2; // Abort/quit/stop
							// increment error_count
							error_count += 1
						}
					})
					.fail( function(request, status, error) {
						$('#warn_error_msg').val(LLid + fbr_opts.spacer + 'Failed search query number: ' +
							query_num + ' - An error occurred while trying to submit data to server! Message: ' +
							error + '\n');
						$('#error_section').show('fast');
						$("#warn").html('Error encountered see details in Errors section below.');
						$("#warn").show('fast');
						// Retrieved data from Google Maps API successfully, but failed to save results!
						request_state = 2; // Abort/quit/stop
						// increment error_count
						error_count += 1
					});// End of fail/error function
		
					// Try to send lat/long path data to server (AJAX)
					if(fbr_opts.getpaths) {
						// Clean up print_results to put in path info
						print_results = '';

						// convert the path to points (for simplicity we simply add to the result object)
						result.routes[0].overview_path = google.maps.geometry.encoding.decodePath(result.routes[0].overview_polyline.points)

						// Print the lat/long of each step in the following format
						for( i = 0; i < result.routes[0].overview_path.length; i++ ) {
							var latlng = result.routes[0].overview_path[i];
							print_results += LLid + fbr_opts.spacer + (i+1) + fbr_opts.spacer + latlng.lat() + fbr_opts.spacer + latlng.lng() + '\n';
						}
						
						// Send the line path data to server using jquery AJAX
						$.ajax({
							type: 'POST',
							url: 'writeGMdata.php',
							data: {results: print_results, file: fbr_opts.file_code, type: 'path'}
						})
						.done(function( message ) {
							if( message.length != 0 ) {
								$('#warn_error_msg').val(LLid + fbr_opts.spacer + 'Failed search query number: ' +
									query_num + ' - An error occurred while trying to submit data to server! Message: ' +
									message + '\'\n');
								$('#error_section').show('fast');
								$("#warn").html('Error encountered see details in Errors section below.');
								$("#warn").show('fast');
		
								// Retrieved data from Google Maps API successfully, but failed to save results!
								request_state = 2; // Abort/quit/stop
								// increment error_count
								error_count += 1
							}
						})
						.fail(function(request, status, error) {
							$('#warn_error_msg').val( $('#warn_error_msg').val() +
								LLid + fbr_opts.spacer + 'Failed search query number: ' +
								query_num + ' - An error occurred while trying to submit path data to server! Message: ' +
								error + '\n' );
							$("#warn").html('Error encountered see details in Errors section below.');
							$("#warn").show('fast');
							// Retrieved data from Google Maps API successfully, but failed to save results!
							request_state = 2; // Abort/quit/stop
							// increment error_count
							error_count += 1
						});//end of fail/error function
					}
				}

				// Retrieved data from Google Maps API successfully, get ready to do next record
				request_state = 0;

			} else {
				//encountered error - begin error handling
				
				// count errors
				error_count += 1
				
				var out_string = LLid + ';';
				
				//if there are no lat/long coordinates than a string was submitted
				if(isNaN(request.origin.b)) {
					out_string += request.origin + ';';
				} else {
					out_string += request.origin.lat() + ',' + request.origin.lng() + ';';
				}
				
				//if there are no lat/long coordinates then a string destination was submitted
				if(isNaN(request.destination.b)) {
					out_string += request.destination + '\n';
				} else {
					out_string += request.destination.lat() + ',' + request.destination.lng() + '\n';
				}
				
				//clean the output string of parantheses
				out_string = out_string.replace(/[\)\(]/g, "")

				//write/append to the error text areas
				$('#jdist').val($('#jdist').val() + out_string);
				$('#warn_error_msg').val($('#warn_error_msg').val() + LLid + fbr_opts.spacer + 'Failed search query number: ' + query_num + ' Status: ' + status + '\n');
				
				// show the error sections
				$('#error_section').show('fast');
				
				// Failed to retrieved data from Google Maps API for some reason, error is displayed - do next record
				request_state = 0;
			}
		};

		// Ajax request to PHP to use Directions API
		if ( fbr_opts.mode == 'strong' ) {

			request.otypell = fbr_opts.origtypelatlong;
			request.dtypell = fbr_opts.desttypelatlong;

			$.ajax({
				type: 'POST',
				url: 'getDirections.php',
				data: {json: JSON.stringify(request)},
				dataType: 'json'
			})
			.done( function( data ) {
				data = JSON.parse(data);
				parseDirectionResults(data, data['status']);
			})
			.fail( function( data ) {
				$('#warn_error_msg').val(LLid + fbr_opts.spacer + 'Failed search query number: ' +
					query_num + ' - An error occurred while trying to submit request to Google Directions API using getDirections.php Message: ' + data + '\n');
				$('#error_section').show('fast');
				$("#warn").html('Error encountered see details in Errors section below.');
				$("#warn").show('fast');
				// Unable to send request to getDirections.php correctly
				request_state = 2; // Abort/quit/stop
				// increment error_count
				error_count += 1
			});
		}

		// Ajax request to directionsService directly
		if ( fbr_opts.mode == 'friendly' ) {
			CmGm.directionsService.route(request, parseDirectionResults);
		}
	};

	// start the setTimeout loop
	getDirection();

};//end of function calcRoute();

