/* If you want to override stuff, do it here. */


/* Leave this alone, unless you know what you are doing. */
global.app = BFR('127.0.0.1:3001');
global.connect('request.complete',function (response,request) {
  if (response)
    response.end();
});
global.connect('error.404',function (response,request) {
  if (response) {
    render_file('.static/html/404.html',response,request);
  }
});
global.connect('error.500',function (response,request,packet) {
  if (response) {
    render_text(global.UTIL.inspect(packet));
  }
});
global.connect("error.csrf",function (response,request,packet) {
  render_text("Uh-Oh",response,request);
});

/* Your App code goes here */

connect('/returnjson', function (response,request) {
  render_json(global.MIME_TYPES, response,request)
});