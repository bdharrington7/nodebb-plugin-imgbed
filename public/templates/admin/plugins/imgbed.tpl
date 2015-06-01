<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Imgbed Settings</div>
				<div class="panel-body">

			<!-- <h3>Options</h3> -->

				<form id="imgbed_acp" class="form imgbed-settings">
					<div class="row">
						<div class="col-lg-4 col-md-6">
							<div class="form-group">
								<h3>Allowed Extensions</h3>
								<input
									id="extensions"
									class="form-control"
									type="text"
									placeholder="jpeg,jpg,gif,gifv,png,svg"
									data-key="strings.extensions" />
							</div>
						</div>
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
								// this probably isn't necessary, even when utilizing this feature, the posts wouldn't change until reboot
								// probably some cache needs to be invalidated
								// app.alert({
								// 	type: 'success',
								// 	alert_id: 'imgbed-saved',
								// 	title: 'Reload Required',
								// 	message: 'Please reload your NodeBB to have your changes take effect',
								// 	clickfn: function() {
								// 		socket.emit('admin.reload');
								// 	}
								// });
							})
						});
					});
				</script>
			</div>
		</div>
	</div>
</div>
