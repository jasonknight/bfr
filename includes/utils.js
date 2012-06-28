global.encrypt = function (text) {
    var cipher = CRYPTO.createCipher("aes192",SECRET);
    var final = cipher.update(text,"utf8","hex") + cipher.final("hex");
    return final;
}
global.decrypt = function (text) {
  var decipher = CRYPTO.createDecipher("aes192",SECRET);
  var final = decipher.update(text,"hex","utf8") + decipher.final("utf8");
  return final;
}
global.get_cookies = function (request) {
  var cookies = {};
  request.headers.cookie && request.headers.cookie.split(';').forEach( function( cookie ) {
    var parts = cookie.split('=');
    // i.e. cookie values are encrypted, always.
    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
  });
  return cookies;
}
global.set_cookies = function (response) {
  if (response) {
    var values = [];
    var cookies = response.cookies;
    cookies['_csrf'] = response.session.csrf;
    for (key in cookies) {
      values.push(key + "=" + cookies[key]);
    }
    if (values.length > 0) {
      response.setHeader("Set-Cookie",values);
    }
  }
}
global.create_session = function (request) {
  var ip_address = null;
  try {
    ip_address = request.headers['x-forwarded-for'];
  }
  catch ( error ) {
    ip_address = request.connection.remoteAddress;
  }
  var d = new Date();
  var ident = CRYPTO.createHash("md5").update(d + ip_address).digest("hex");
  
  session = {
    ident: ident,
    data: {}
  }
  session = global.assign_csrf(session,request);
  return session;
}
global.assign_csrf = function (session,request) {
  var ip_address = null;
  try {
    ip_address = request.headers['x-forwarded-for'];
  }
  catch ( error ) {
    ip_address = request.connection.remoteAddress;
  }
  var d = new Date();
  var csrf = CRYPTO.createHash("md5").update(d + ip_address + Math.random()).digest("hex");
  session.csrf = csrf;
  return session;
}
global.load_session = function (ident,request) {
  var path = './sessions/' + ident;
  var session = null;
  if (FS.existsSync(path)) {
    session = JSON.parse(FS.readFileSync(path));
  } else {
    return create_session(request);
  }
  if (!session) {
    return create_session(request);
  }
  if (!session.csrf) {
    session = global.assign_csrf(session,request);
  }
  return session;
}
global.save_session = function (response,request) {
  if (!response.session) {
    response.session = create_session(request);
    response.cookies["session-id"] = response.session.ident;
  }
  var data = JSON.stringify(response.session);
  var path = './sessions/' + response.session.ident;
  global.writeFile(path,data);
}
/*
 * This function is an asynch write file, when you just want to set it and forget it.
 * it also takes a callback, allowing you to do some post processing if you like. 
 */
global.writeFile = function (path,buffer,callback) {
  var stream = FS.createWriteStream(path);
  stream.once('open', function(fd) {
    stream.write(buffer);
    if (typeof callback == "function") {
      callback.call(this,path);
    }
  });
}
global.emit = function (msg,packet) {
  try {
    var handled = false;
    if (EVENTS[msg]) {
      if (packet.response)
        packet.response.bench.handler_start = new Date();
      EVENTS[msg].call(this,packet.response,packet.request,packet);
    } else if (msg.indexOf('/') != -1) {
      // No handler is specified
      var tmsg;
      if (msg == '/')
        tmsg = '/index';
      else
        tmsg = msg;
      if (FS.existsSync('./application/static/images' + tmsg)) {
        render_file('./application/static/images' + tmsg, packet.response,packet.request);
      } else if (FS.existsSync('./application/static/js' + tmsg)) {
        render_file('./application/static/js' + tmsg, packet.response,packet.request);
      } else if (FS.existsSync('./application/static/css' + tmsg)) {
        render_file('./application/static/css' + tmsg, packet.response,packet.request);
      } else if (tmsg.indexOf('.html') != -1 && FS.existsSync('./static/html' + tmsg)) {
        render_file('./application/static/html' + tmsg, packet.response,packet.request);
      } else if (FS.existsSync('./application/static/html' + tmsg + '.html')) {
        render_file('./application/static/html' + tmsg + '.html', packet.response,packet.request);
      } else  if (FS.existsSync('./application/handlers' + msg + '.js')) {
        var filename = './application/handlers' + msg + '.js';
        EVENTS[msg] = require('./application/handlers' + msg);
        packet.response.bench.handler_start = new Date();
        EVENTS[msg].call(this,packet.response,packet.request,packet);
      } else if (tmsg && tmsg == '/index' && FS.existsSync('./application/static/html/example.html')) {
        render_file('./application/static/html/example.html', packet.response,packet.request);
      } else {
        console.log("Received: %s but no handler is specified.",msg);
        global.emit('error.404',{});
      }     
    }
  } catch (err) {
    console.log("global.emit failed with error ",err, msg, global.UTIL.inspect(packet));
  }
}
global.connect = function (msg,func) {
  EVENTS[msg] = func;
}
global.log_request = function (response,request) {
  console.log(request.method + ": " + URL.parse(request.url).pathname);
  if (response.bench.handler_start && response.bench.handler_end) {
    console.log("Handler:\t\t\t\t\t\t" + (response.bench.handler_end - response.bench.handler_start) + "ms");
  }
  if (response.bench.render_file_start && response.bench.render_file_end) {
    console.log("Render File:\t\t\t\t\t\t" + (response.bench.render_file_end - response.bench.render_file_start) + "ms");
  }
  var n = new Date();
  console.log("\Response Total Time:\t\t\t\t\t" + (n - response.bench.start) + "ms");
  console.log("* ---------------------------------------------------- *\n\n");
}