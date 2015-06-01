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
							})
						});
					});
				</script>
			</div>
		</div>
	</div>
</div>
