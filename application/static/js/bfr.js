/* 
 * SmartArrays are just collections with convenience functions.
 */
/* 
 * Common options used for making elements.
 */
window.$opts = {
  tables: {
    rows: {
      striped: [{class: 'odd'},{class:'even'}],
      thriped: [{class: 'odd'},{class:'even'},{class: 'out'}]
    }
  }
}
window.SmartArray = (function () {
  function SmartArray() {
    var self = Object.create(Array.prototype);
    self = (Array.apply(self,arguments) || self);
    self = SmartArray.addClassMethods(self);
    return self;
  }
  SmartArray.addClassMethods = function (sm) {
    for (var m in SmartArray.prototype) {
      if (SmartArray.prototype.hasOwnProperty(m)) {
        sm[m] = SmartArray.prototype[m];
      }
    }
    return sm;
  }
  SmartArray.fromArray = function (array) {
    var sm = SmartArray.apply(null,array);
    return sm;
  }
  SmartArray.prototype = {
    to_divs: function (opts) {
      if (!opts) {
        opts = {};
      }
      return this.create_elements('div',opts);
    },
    to_cols: function (opts) {
      if (!opts) {
        opts = {};
      }
      return this.create_elements('td',opts);
    },
    to_rows: function (opts) {
      if (!opts) {
        opts = {};
      }
      return this.create_elements('tr',opts);
    },
    /* 
     * .to_table takes an array for the headers, like ['header1', 'header2', ...], then options options for each type of object
     *  to be created, table, row, and columns, col_opts and row_opts can be an array. You can take some helper options from $opts
     */
    to_table: function (headers,table_opts,row_opts,col_opts) {
      if (!table_opts)
        table_opts = {}
      if (!row_opts)
        row_opts = {}
      if (!col_opts)
        col_opts = {}
      var table = create_dom_element('table',table_opts,'','');
      if (headers instanceof Array && headers.length > 0) {
        var header_row = create_dom_element('tr',{},'',table);
        for (jj = 0; jj < headers.length; jj++) {
          create_dom_element('th',{},headers[jj],header_row);
        }
      }
      var ii = 0;
      for (var i = 0; i < this.length; i++ ) {
        if (row_opts instanceof Array) {
          var row = create_dom_element('tr',row_opts[ii],'',table);
          ii++;
          if (ii == row_opts.length)
            ii = 0;
        } else {
          var row = create_dom_element('tr',row_opts,'',table);
        }
        if (this[i] instanceof Array && !this[i].is_smart_array) {
          this[i] = SmartArray.fromArray(this[i]);
          var cols = this[i].to_cols(col_opts);
          for (var j = 0; j < cols.length; j++) {
            row.append(cols[j]);
          }
        } else {
          create_dom_element('td',col_opts,this[i],row);
        }
      }
      return table;
    },
    create_elements: function (type,opts) {
      var div_array = [];
      var j = 0;
      for (var i = 0; i < this.length; i++ ) {
        if (opts instanceof Array) {
          div_array.push(create_dom_element(type,opts[j],this[i],''));
          j++;
          if (j == opts.length)
            j = 0;
        } else {
          div_array.push(create_dom_element(type,opts,this[i],''));
        }
      }
      return div_array;
    },
    is_smart_array: true
  }
  return SmartArray;
}).call({});
/* 
 * _get and _set are convenience functions that wrap jQuery.data.
 * they are functionally equivalent to: jQuery.date('name',value) etc. 
 */
window._get = function (name,context) {
  if (context) {
    // if you pass in a 3rd argument, which should be an html element, then that is set as the context.
    // this ensures garbage collection of the values when that element is removed.
    return $.data(context[0],name);
  } else {
    return $.data(document.body,name);
  }
}
window._set = function (name,value,context) {
  if (context) {
    // if you pass in a 3rd argument, which should be an html element, then that is set as teh context.
    // this ensures garbage collection of the values when that element is removed.
    return $.data(context[0],name,value);
  } else {
    return $.data(document.body,name,value);
  } 
}
/* Allows you to fetch a single cookie value by key */
window.get_cookie_value = function (key) {
    var i,x,y;
    var _cookies = document.cookie.split(";");
    for (i = 0; i < _cookies.length; i++)
    {
      x = _cookies[i].substr(0,_cookies[i].indexOf("="));
      value = _cookies[i].substr(_cookies[i].indexOf("=") + 1);
      cookie_key = x.replace(/^\s+|\s+$/g,"");
      if (cookie_key == key)
      {
        return unescape(value);
      }
    }
}
/* 
 * Create a DOM Element, set attributes, and initialize content. Finally, if
 * a jquery object is passed as the final argument, it will be appended.
 */
window.create_dom_element = function (tag, /* tag name, like div, span etc.*/
                                      attrs, /* attrs object, like {id: 'myId'} etc*/
                                      content, /* content to insert */
                                      append_to /*jquery element to append it to*/ ) {
  element = $(document.createElement(tag));
  $.each(attrs, function (k,v) {
    element.attr(k, v);
  });
  element.html(content);
  if (append_to != '')
    $(append_to).append(element);
  return element;
}
window.table = function (attrs,append_to) {
  if (!append_to)
    append_to = '';
  return create_dom_element('table',attrs,'',append_to);
}
window.row = function (attrs,append_to) {
  if (!append_to)
    append_to = '';
  return create_dom_element('tr',attrs,'',append_to);
}
window.col = function (attrs,append_to) {
  if (!append_to)
    append_to = '';
  return create_dom_element('td',attrs,'',append_to);
}
/* 
 * POST a form using ajax. Make sure to pass, at minimum a success_callback. Success Callbacks should NOT be
 * anonymous functions, they should be defined like normal functions and be passed by name.
 * <form onsubmit="return post(this);> ..."  
 */
window.post = function (form_id,/* form_id or this */ 
                        success_callback, /* function to call on success */ 
                        error_callback) {
  if (typeof form_id == 'string') {
    var the_form = $('#' + form_id);
  } else {
    var the_form = $(form_id);
  }
  var data = the_form.serialize();
  data = data + "&_csrf=" + get_cookie_value("_csrf");
  $.ajax({
    url: the_form.attr('action'),
    type: "post",
    data: data,
    error: error_callback
  })
  .done(function (data) {
      success_callback.call(the_form,data);
  })
  .fail(function (jqXHR, status) {
      error_callback.call(the_form,jqXHR,status);
  });
  // We return false here to stop the form from submitting.
  // Form cleanup should happen in the callback.
  return false;
}
/* 
 * Same as above, but for multipart forms, this will post the form to a dynamically created iframe.
 * The iframe is removed once the success callback is called. No error_callback is possible in this function.
*/
window.post_multipart = function (form_id,success_callback) {
  if (typeof form_id == 'string') {
    var the_original_form = $('#' + form_id);
  } else {
    var the_original_form = $(form_id);
  }
  var the_iframes_name = '__submit_iframe' + Math.random();
  var the_iframe = window.create_dom_element('iframe',{src: 'javascript:false;',name: the_iframes_name},'',$('body'));
  the_iframe.css({width: 1, height: 1});
  the_original_form.attr('target',the_iframes_name);
  var old_onsubmit = the_original_form.attr('onsubmit');
  the_original_form.attr('onsubmit',function () { return true;});
  var csrf_input = window.create_dom_element('input', {type: 'hidden',value: get_cookie_value("_csrf"), name: '_csrf'},'', the_original_form);
  window._set('callback',success_callback,the_iframe);
  the_iframe.on('load',function (content) {
      var content = $('body > pre',this.contentWindow.document).html();
      var cb = window._get("callback",$(this));
      if (typeof cb == 'function') {
        cb.call(this,content);
      }
      setTimeout(function () {$(this).remove();},200);
    }   
  );
  the_original_form.submit();
  the_original_form.attr('onsubmit',old_onsubmit);
  return false;
}
/* 
 * Fetches something from the server, if it is a script, it will be executed. It should generally always be a js or json object
 */
window.fetch = function (path,callback) {
  $.ajax({
   url: path,
   type: 'get',
   success: callback
  });
}