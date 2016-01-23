function parse_ical_file(ical_file) { /* filename string param */

	new icalparser(ical_file, function(cal){
			//When ical parser has loaded file
			//get future events
			events = cal.getFutureEvents();
			//And display them
			displayDemo(events);
		});			
	}, false);
}

function displayDemo(events) {
	events.forEach(function(event){
		var list_item = document.createElement('list_item');

		list_item.innerHTML = '<strong>' + event.SUMMARY + '</strong><br/>'+
					event.day + ': ' +event.start_time + ' - ' + event.end_time + ' ('+event.start_date+ ')' ;

		document.getElementById('calendar').appendChild(li);
	})
}