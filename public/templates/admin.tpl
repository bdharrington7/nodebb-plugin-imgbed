<h1>Imgbed Settings</h1>

<!-- <h3>Options</h3> -->

<form id="imgbed_acp">
	<div class="row">
		<h3>Allowed Extensions</h3>
		<input
			id="extensions"
			class="form-control"
			type="text"
			placeholder="jpeg,jpg,gif,gifv,png,svg"
			data-key="strings.extensions" />
	</div>
	<button class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['settings'], function(settings) {
		var wrapper = $('#imgbed_acp');
		// [1]
		settings.sync('imgbed', wrapper);
		$('#save').click(function(event) {
			event.preventDefault();
			// TODO clean and organize extensions
			settings.persist('imgbed', wrapper, function persistImgbed() {
				socket.emit('admin.settings.syncImgbed');
			})
		});
	});
</script>
