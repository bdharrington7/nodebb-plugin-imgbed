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
								Please input a comma-separated list of image extensions that are allowed
								<input
									id="extensions"
									class="form-control"
									type="text"
									placeholder="jpeg,jpg,gif,gifv,png,svg"
									data-key="strings.extensions" />
							</div>
						</div>
						<div class="col-lg-4 col-md-6">
							<div class="panel panel-default">
								<div class="panel-heading">Imgbed Control Panel</div>
								<div class="panel-body">
									<!-- <div class="row"> -->
										<button class="btn btn-primary" id="save">Save Settings</button>
									<!-- </div>
									<div class="row"> -->
										<div class="alert alert-warning">
											<strong><i class="icon-warning-sign"></i>Clear the posts cache</strong>
											<p>
												To have your changes take effect immediately, you will need to clear the
												posts cache, which can have an effect on performance.
											</p>
											<button class="btn btn-primary" id="clearPostCache">Clear Posts cache</button>
										</div>
									<!-- </div class="row"> -->
								</div>
							</div>
						</div>
					</div>
					<!-- <button class="btn btn-lg btn-primary" id="save">Save</button> -->
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
						$('#clearPostCache').click(function(event) {
							event.preventDefault();
							socket.emit('admin.settings.clearPostCache');
							app.alert({
								type: 'success',
								alert_id: 'imgbed-post-cache-cleared',
								title: 'Success',
								message: 'Posts cache cleared successfully'
							});
						});
						// can we communicate the other direction?
						// socket.on('admin.settings.postCacheCleared', function(data){
						// 	app.alert({
						// 		type: 'success',
						// 		alert-id: 'imgbed-post-cache-cleared',
						// 		title: 'Success',
						// 		message: 'Posts cache cleared successfully'
						// 	});
						// });
					});
				</script>
			</div>
		</div>
	</div>
</div>
