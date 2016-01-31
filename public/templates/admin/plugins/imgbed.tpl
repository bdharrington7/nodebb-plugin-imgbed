<div class="row">
  <div class="col-lg-12">
    <div class="panel panel-group">
      <h2>Imgbed Settings</h2>
      <!-- <div class="panel-body"> -->
        <form id="imgbed_acp" class="form imgbed-settings">
          <div class="row">
            <div class="col-lg-6 col-md-6">
              <div class="form-group">
                <div class="panel panel-primary">
                  <div class="panel-heading">Allowed Extensions</div>
                  <div class="panel-body">
                  Comma-separated list of image extensions that are allowed:
                  <input
                    id="extensions"
                    class="form-control"
                    type="text"
                    placeholder="jpeg,jpg,gif,gifv,png,svg"
                    data-key="strings.extensions" />
                  </div>
                </div>
                <div class="panel panel-primary">
                  <div class="panel-heading">Parsing Mode</div>
                  <div class="panel-body">
                    <select
                      id="parseMode"
                      class="form-control"
                      data-key="strings.parseMode">
                      <option>markdown</option>
                      <option>bbcode</option>
                      <option>html</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 col-md-6">
              <div class="panel panel-primary">
                <div class="panel-heading">Imgbed Control Panel</div>
                <div class="panel-body">
                  <button class="btn btn-primary" id="save">Save Settings</button>
                </div>
              </div>
              <div class="panel panel-warning">
                <div class="panel-heading">
                  <strong><i class="icon-warning-sign"></i>Clear the posts cache</strong>
                </div>
                <div class="panel-body">
                  To have your changes take effect immediately, you will need to clear the
                  posts cache, which can have a short-term effect on performance.<br/>
                  <button class="btn btn-warning" id="clearPostCache">Clear Posts cache</button>
                </div>
              </div>
            </div>
          </div>
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
          });
        </script>
      <!-- </div> -->
    </div>
  </div>
</div>
