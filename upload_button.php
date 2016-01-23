<!DOCTYPE html>

<html>
	<head>

		<link href="css/dropzone.css" type="text/css" rel="stylesheet" />

		<script src="dropzone.js"></script>

	</head>

	<body>

		<form action="upload.php" method="post" enctype="multipart/form-data">
		    <input type="file" name="file" id="file">
		    <input type="submit" value="Upload File" name="submit">
		</form>


		<div>
			<!-- Change /upload-target to your upload address -->
			<form action="upload.php" class="dropzone" method="post" enctype="multipart/form-data"></form>

		</div>
	</body>
</html>