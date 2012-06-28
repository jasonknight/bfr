/* 
 * Because Browsers implement different client side storage schemes, this library aims to implement something consistent for users,
 * and handle the nitty gritty details of each vendors retardation and lazyness.
 */
  
/* 
 *  Field Data Type
 *  {
 *    type: boolean|function|string|object,
 *    value: ...
 *  }
 *  Everything is stored in a large JSON object, or series of Objects that represent collections. Collections can have several fields.
 */

/* 
 * Storage is the main interface into the localstorage system.
 */


var Storage = function (collection_name) {
  var self = this;
  this.config = {
    collection_name: collection_name,
    foreign_key: collection_name + "_id"
  };
  
  this.data = localStorage.getItem(collection_name);
  if (!this.data) {
    this.data = {rows: [],joins: {}};
  } else {
    this.data = JSON.parse(this.data);
  }
  this.joins = [];
  this.encode_data = function (record) {
    record._collection_name = self.config.collection_name;
    for (var key in record) {
      if (typeof record[key] == 'function') {
        record[key] = '*F' + record[key].toString();
      }
    }
    return JSON.stringify(record);
  };
  this.decode_data = function (record) {
    record = JSON.parse(record);
    try {
      for (var key in record) {
        if (record[key][0] == '*' && record[key][1] == 'F') {
          var func = '';
          for (var i = 2; i < record[key].length; i++) {
            func += record[key][i];
          }
          var _evaled_func = '';
          eval("_evaled_func = " + func + ";");
          record[key] = _evaled_func;
        }
      }
    } catch (err) {
      console.log(err);
    }
    return record;
  };
  this.insert = function (record) {
    var id = this.data.rows.length - 1;
    record.id = id;
    record = this.encode_data(record);
    this.data.rows.push(record);
    return record;
  }
  this.update = function (id,record) {
    var record = this.encode_data(record);
    if (this.data.rows[id]) {
      this.data.rows[id] = record;
      return record;
    } else {
      var id = this.data.rows.length - 1;
      record.id = id;
      this.data.rows.push(record);
      return record;
    }
  }
  this.find = function (id,field) {
    var record = this.decode_data(this.data.rows[id]);
    return record;
  };
  this.where = function (fields,callback,start,results) {
    if (!results)
      results = [];
    if (!start)
      start = 0;
    var start_time = new Date();
    var current_time;
    for (var i = start; i < this.data.rows.length; i++) {
      record = this.data.rows[i];
      for (var key in fields) {
        if (typeof fields[key] == 'string') {
          var str = '"'+key+'":"' + fields[key] ;
        } else {
          var str = '"'+key+'":' + fields[key].toString();
        }
        if (record.indexOf(str) != -1) {
          results.push(this.decode_data(record));
        }
      }
      current_time = new Date();
      if ((current_time.getTime() - start_time.getTime()) > 250) {
        setTimeout(function () {
          self.where(fields,callback,i,results);
        });
      }
    }
    callback.call(self,results);
  }
  this.join = function (record_1,record_2) {
    var cname_1 = record_1._collection_name + '_' + record_2._collection_name;
    var cname_2 = record_2._collection_name + '_' + record_1._collection_name;
    var join_name;
    if (!this.data.joins[cname_1] && !this.data.joins[cname_2]) {
      join_name = cname_1;
    } else if (this.data.joins[cname_1]) {
      join_name = cname_1;
    } else if (this.data.joins[cname_2]) {
      join_name = cname_2;
    }
    if (!this.data.joins[join_name]) {
      this.data.joins[join_name] = {};
    }
    this.data.joins[record_1._collection_name]
  };
  this.close = function () {
    localStorage.setItem(collection_name,JSON.stringify(this.data));
    return null;
  }
}
function insert_lots() {
  var items = new Storage('items');
  for (var i = 0; i < 1000; i++) {
    items.insert({name: "Jason " + parseInt(Math.random() * 1000) });
  }
  items.close();
}