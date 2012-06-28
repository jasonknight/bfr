/* 
 * Rendering the header is done separately, because we want to be able
 * to do stuff here that is pretty generic across all requests, like save
 * the session, and write cookie values. 
 */
global.render_header = function (code,headers,response,request) {
  global.set_cookies(response);
  response.writeHead(code,headers);
}
/* 
 * If you want to render a file, such as an .mp3, or any other type really, use
 * this function.
 */
global.render_file = function (path,response,request) {
  response.bench.render_file_start = new Date();
  if (FS.existsSync(path)) {
    var parts = path.split('.');
    var mime = global.MIME_TYPES["." + parts[parts.length -1]];
    render_header(200,{ 'Transfer-Encoding': 'chunked', 'Content-Type': mime},response,request);
    global.render_actual_file(path,response,request);
  }
}
/* 
 * We use this functionality in a few different functions, so we move it out to a single function that streams the file. 
 * this really isn't necessary for small files, but then again, its probably just a better way to do it all around.
 */
global.render_actual_file = function (path,response,request) {
  var stream = global.FS.createReadStream(path);
  stream.on('data',function (data) {
    response.write(data);
  });
  stream.on('close',function () {
    render_end(response,request);
  });
  stream.on('error',function (err) {
    console.log(err);
  });
}
/* 
 * Usefule for rendering our JSON objects. 
 */
global.render_json = function (object,response,request) {
  data = JSON.stringify(object);
  var mime = global.MIME_TYPES[".json"];
  render_header(200,{ 'Content-Length': data.length, 'Content-Type': mime},response,request);
  response.write(data);
  render_end(response,request);
}
global.render_js = function (data,response,request) {
  var mime = global.MIME_TYPES[".js"];
  render_header(200,{ 'Content-Length': data.length, 'Content-Type': mime},response,request);
  response.write(data);
  render_end(response,request);
}
/* 
 * On the off chance that you just want to render some plain text.
 */
global.render_text = function (data,response,request) {
  var mime = global.MIME_TYPES[".text"];
  render_header(200,{ 'Content-Length': data.length, 'Content-Type': mime},response,request);
  response.write(data);
  render_end(response,request);
}
/* 
 * And here we have the end of the request where we write the session to disk, and then bail out.
 */
global.render_end = function (response,request) {
  global.save_session(response,request);
  global.log_request(response,request);
  response.end();
}
/* 
 * General rendering function, call this at the end of handlers unless you want
 * some special behavior with the other renderers.
 * 
 * js_file is the javascript handler that you wish to send to the client, it should be located in
 * ./application/static/js/
 */
global.render = function (js_file,response,request) {
  var data_object = {data: response.data};
  var data_object_string = "window.response = " + JSON.stringify(data_object) + ";";
  var path = "./application/static/js/" + js_file + ".js";
  var mime = global.MIME_TYPES[".js"];
  if (!global.FS.existsSync(path)) {
    throw "js_file passed to render does not exist, I expect it to be at this location: " + path;
  } else {
    render_header(200,{ 'Transfer-Encoding': 'chunked', 'Content-Type': mime},response,request);
    response.write(data_object_string + "\n");
    global.render_actual_file(path,response,request);
  }
}