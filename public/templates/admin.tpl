<h1>ImgBed</h1>

<h3>Options</h3>

<form class="form">
	<div class="form-group">
		<label for="upload">
			<input type="checkbox" data-field="nodebb-plugin-imgbed:options:upload" id="upload" />
			Upload linked pictures automatically to the forum server
		</label>
		<div class="alert alert-warning">
			<strong><i class="fa-warning-sign"></i> Careful!</strong>
			<p>
				Make sure you have enough disk space and bandwidth on your server before you enable this.
			</p>
		</div>
	</div>
	<!-- TODO: make group to choose between uploading to the server, or imgur -->
	<div class="form-group">
		<label for="extensions">
			Allowed Extensions (comma separated)
		</label>
		<input class="form-control" placeholder="jpeg,jpg,gif,png" type="text" data-field="nodebb-plugin-imgbed:options:extensions" id="extensions" />
	</div>

	<button class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['forum/admin/settings'], function(Settings) {
		Settings.prepare();
	});
</script>
