module.exports = function (response,request) {
  var text = "Hello world from a handler!";
  if (response.cookies["test"]) {
      text += " Cookie value exists!";
      response.cookies["anothervalue"] = "This is another value!";
  } else {
    response.cookies["test"] = "Hello Cookie Monster";
  }
  response.session["test"] = {crap: "tacular!"};
  response.bench.handler_end = new Date();
  response.data.items = [1,2,3];
  render('hello',response,request);
}
