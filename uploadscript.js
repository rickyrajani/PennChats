function readBlob(opt_startByte, opt_stopByte) {

	Parse.initialize("eKsGI0gYt6LobUiG66gHWCgjuLx9ZmeWn9XKyVDW", "ewHQdR7hLUgfIqxvUwiCnxnt7ZOjkb325rd1IeUt");
	var currentUser = Parse.User.current();

	// if currentUser... else ...


	var files = document.getElementById('files').files;
	if (!files.length) {
	  alert('Please select a file!');
	  return;
	}

	var file = files[0];
	var start = parseInt(opt_startByte) || 0;
	var stop = parseInt(opt_stopByte) || file.size - 1;

	var reader = new FileReader();

	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function(evt) {
	  	if (evt.target.readyState == FileReader.DONE) { // DONE == 2
		    var icaltext = evt.target.result;

		    icalParser.parseIcal(icaltext);

	    	var CourseRoom = Parse.Object.extend("CourseRoom");

		    for (event of icalParser.icals[0].events) {
		    	
	    		var courseRoom = new CourseRoom();
		    	
		    	courseRoom.set("course_section_name", event.summary[0].value);
		    	courseRoom.set("start_date", event.dtstart[0].value.substring(0,8));
		    	courseRoom.set("start_time", event.dtstart[0].value.substring(9, 13));
		    	courseRoom.set("end_time", event.dtend[0].value.substring(9, 13));
		    	courseRoom.set("description", event.description[0].value);
		    	
				var repeat_details = event.rrule[0].value.split(";");
		    	var enddate = repeat_details[3].split("=");
		    	var sessionday = repeat_details[4].split("=");

				courseRoom.set("end_date", enddate[1]);
		    	courseRoom.set("day_of_week", sessionday[1]);
				
				courseRoom.save();
			}
  		}
	};

	reader.readAsText(file);
}

document.getElementById("read_button").addEventListener('click', function(evt) {
	if (evt.target.tagName.toLowerCase() == 'button') {
	  var startByte = evt.target.getAttribute('data-startbyte');
	  var endByte = evt.target.getAttribute('data-endbyte');
	  readBlob(startByte, endByte);
	}
}, false);