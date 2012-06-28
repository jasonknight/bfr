/*
  BFR Philosophy
  
  Rule #1: No funny stuff. Magic is evil, DRY and modularization and metaprogramming can become a barrier to efficiency and comprehension. Things should be obvious, consistent,
  and code should appear near to where it will be used, variable names should be verbose and self-explanitory, and code should be commented thoroughly.
  
  Rule #2: The direct approach is always easier to understand, implement, and maintain.
  
  Rule #3: Nothing is perfect, life is too short to obsess over what-ifs. Due dilligence aside, never make something more complex than it needs to be. You can't please everyone,
  so don't try to. Do what works for you in the here and now.
  
 */



/* Requires */

global.HTTP = require('http');
global.HTTPS = require('https');
global.URL = require('url');
global.FS = require('fs');
global.UTIL = require('util');
global.CRYPTO = require('crypto');

global.FORMIDABLE = require('formidable');


/* Global Variables 
 
 */

global.EVENTS = {}
global.SECRET = "adkfk:;aofopw034ifa85thflkjaf387&53d9hfdy%";
global.SERVER = null;
global.SECURE_SERVER = null;
global.USE_CSRF = true;
// 

/* Global Functions */
global.include = function (path) {
  eval(FS.readFileSync(path).toString());
}

include('./includes/mime_types.js');
include('./includes/utils.js');
include('./includes/render.js');

/* The Master Object */
global.controller = function (type,req,res) {
  try {
    res.bench = {start: new Date(), handler_start: null,handler_end: null, render_file_start: null, render_file_end: null};
    var parsed = URL.parse(req.url);
    res.cookies = global.get_cookies(req);
    res.data = {};
    if (type == "https")
      req.secure = true
    else
      req.secure = false
    try {
      if (res.cookies['session-id']) {
        res.session = global.load_session(res.cookies['session-id'],req);
      } else {
        res.session = global.create_session(req);
        res.cookies["session-id"] = res.session.ident;
      }
    } catch (err) {
      console.log("Controller failed to setup cookies.");
      if (!req.attempts)
        req.attempts = 1;
      else
        req.attempts += 1;
      if (req.attemtps >= 3) {
        global.controller(type,req,res);
      } else {
        console.log('attempted to handle request 3 times, giving up');
        global.emit("error.500", {request: req, response: res, error: e});
      }
    }
    try {
      if (req.method.toLowerCase() == "post") {
        try {
          var data = '';
          var form = new FORMIDABLE.IncomingForm();
          form.parse(req, function (err,fields,files) {
            if (global.USE_CSRF) {
              console.log("Using csrf");
              console.log(global.UTIL.inspect(fields));
              if (res.session.csrf == fields["_csrf"]) {
                req.form = {fields: fields, files: files};
                global.emit(parsed.pathname, {request: req, response: res});
              } else {
                global.emit("error.csrf",{fields: fields, files: files, response: res, request: req});
              }
            } else {
              req.form = {fields: fields, files: files};
              global.emit(parsed.pathname, {request: req, response: res});
            }
          });
        } catch (e) {
          console.log(e);
          global.emit("error.500", {request: req, response: res, error: e});
        }
      } else {
        global.emit(parsed.pathname, {request: req, response: res});
      }
    } catch (err) {
      console.log("Controller failed to decide type of request.");
    }
  } catch (err) {
    console.log("controller failed",err);
  }
}
global.http_handler = function (req,res) {
  global.controller("http",req,res);
}
global.https_handler = function (req,res) {
  global.controller("https",req,res);
}
var BFR = function () {
  var self = this;
  SERVER = HTTP.createServer(global.http_handler);
  var options = {
    key: FS.readFileSync('./application/static/certs/localhost.pem'),
    cert: FS.readFileSync('./application/static/certs/localhost.pem')
  };
  SECURE_SERVER = HTTPS.createServer(options,global.https_handler);
  
  if (arguments[0].match(/\d\.\d\.\d\.\d\:\d+/)) {
    var reg = /([\d\.]+)\:(\d+)/;
    var match = reg.exec(arguments[0]);
    var callback = arguments[1];
    SERVER.listen(parseInt(match[2]),match[1],function () {
      global.emit("server.started");
      if (callback) {
        callback.call();
      }
    });
    SECURE_SERVER.listen(parseInt(match[2]) + 1,match[1],function () {
      global.emit("secure_server.started");
      if (callback) {
        callback.call();
      }
    });
  }
  return self;
}

/* And Finally */
global.include('./app.js');