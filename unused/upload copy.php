<?php

require 'vendor/autoload.php';
require 'class.iCalReader.php';

use Parse\ParseClient;
use Parse\ParseObject;
 
ParseClient::initialize('eKsGI0gYt6LobUiG66gHWCgjuLx9ZmeWn9XKyVDW', '1xcE35URxyInO9APEXTxvK2XItaa3UCELcDJXhAc', '4XzUmOtUwYAc81kcHLQfXvofEyTbBcZ78nXdJSIB');

$ical = new ICAL($_FILES["file"]["tmp_name"]);
$events = $ical -> events();

$date = $events[0]['DTSTART'];
echo "The ical date: ";
echo $date;
echo "<br/>";

echo "The Unix timestamp: ";
echo $ical->iCalDateToUnixTimestamp($date);
echo "<br/>";

echo "The number of events: ";
echo $ical->event_count;
echo "<br/>";

echo "The number of todos: ";
echo $ical->todo_count;
echo "<br/>";
echo "<hr/><hr/>";

foreach ($events as $event) {
    $courseRoom = ParseObject::create("CourseRoom");

    echo "SUMMARY: ".$event['SUMMARY']."<br/>";
    $courseRoom->set("course_section_name", $event['SUMMARY']);

    echo "DTSTART: ".$event['DTSTART']." - UNIX-Time: ".$ical->iCalDateToUnixTimestamp($event['DTSTART'])."<br/>";
    $courseRoom->set("start_date", substr($event['DTSTART'], 0, 8));

    echo substr($event['DTSTART'], 0, 8);

    $courseRoom->set("start_time", substr($event['DTSTART'], 9, 4));

    echo "DTEND: ".$event['DTEND']."<br/>";
    $courseRoom->set("end_time", substr($event['DTEND'], 9, 4));

    echo "DTSTAMP: ".$event['DTSTAMP']."<br/>";
    echo "UID: ".$event['UID']."<br/>";
    echo "DESCRIPTION: ".$event['DESCRIPTION']."<br/>";
    $courseRoom->set("description", $event['DESCRIPTION']);

    echo "LOCATION: ".$event['LOCATION']."<br/>";

    echo "RRULE: ".$event['RRULE']."<br/>";
    $repeatDetails = explode(";", $event['RRULE']);

    $enddate = explode("=", $repeatDetails[3]);
    $sessionday = explode("=", $repeatDetails[4]);

    $courseRoom->set("end_date", $enddate[1]);

    $courseRoom->set("day_of_week", $sessionday[1]);

    $courseRoom -> save();

    echo "<hr/>";
}

?>
