var mysql = require('mysql'),
    _ = require('lodash'),
    adapter = require('../../../lib/adapter');

var Support = module.exports = {};

Support.SqlOptions = {
  parameterized: true,
  caseSensitive: true,
  escapeCharacter: '"',
  casting: true,
  canReturnValues: true,
  escapeInserts: true,
  declareDeleteAlias: false
};

Support.Config = {
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: 'sails_unitTest',
  port: 3306
};

// Fixture Collection Def
Support.Collection = function(name, def) {
  var schemaDef = {};
  schemaDef[name] = Support.Schema(name, def);
  return {
    identity: name,
    tableName: name,
    connection: 'test',
    definition: def || Support.Definition,
    waterline: { schema: schemaDef }
  };
};

// Fixture Table Definition
Support.Definition = {
  field_1: { type: 'string' },
  field_2: { type: 'string' },
  id: {
    type: 'integer',
    autoIncrement: true,
    size: 64,
    primaryKey: true
  }
};

Support.Schema = function(name, def) {
  return {
    connection: 'test',
    identity: name,
    tableName: name,
    attributes: def || Support.Definition
  };
}

// Register and Define a Collection
Support.Setup = function(tableName, cb) {

  var collection = Support.Collection(tableName);

  var collections = {};
  collections[tableName] = collection;

  var connection = _.cloneDeep(Support.Config);
  connection.identity = 'test';

  adapter.registerConnection(connection, collections, function(err) {
    if(err) return cb(err);
    adapter.define('test', tableName, Support.Definition, function(err) {
      if(err) return cb(err);
      cb();
    });
  });
};

// Just register a connection
Support.registerConnection = function(tableNames, cb) {
  var collections = {};

  tableNames.forEach(function(name) {
    var collection = Support.Collection(name);
    collections[name] = collection;
  });

  var connection = _.cloneDeep(Support.Config);
  connection.identity = 'test';

  adapter.registerConnection(connection, collections, cb);
};

// Remove a table
Support.Teardown = function(tableName, cb) {
  var client = mysql.createConnection(this.Config);
  
  dropTable(tableName, client, function(err) {
    if(err) {
      return cb(err);
    }
    
    adapter.teardown('test', function(err) {
      cb();
    });
    
  });
};

// Return a client used for testing
Support.Client = function(cb) {
  var connection = mysql.createConnection(this.Config);
  connection.connect(function(err) {
    if(err) { cb(err); }
    cb(null, connection);
  });
};

// Seed a record to use for testing
Support.Seed = function(tableName, cb) {
  this.Client(function(err, client) {
    createRecord(tableName, client, function(err) {
      if(err) {
        return cb(err);
      }
      cb();
    });
  });
};

function dropTable(table, client, cb) {
  client.connect();

  var query = "DROP TABLE " + table + ';';
  client.query(query, cb);
}

function createRecord(table, client, cb) {
  var query = [
  "INSERT INTO " + table + " (field_1, field_2) " +
  "values ('foo', 'bar');"
  ].join('');

  client.query(query, cb);
}