# node-data-mapper

A lightweight object-relational mapper for node.js using the data mapper pattern.

### Getting Started

###### Install node-data-mapper

```bash
$ npm install node-data-mapper --save
```

###### Install a Supported Driver

The following drivers are supported.

* mysql
```bash
$ npm install mysql --save
```
Support for other database drivers is underway, but at this time only mysql is supported.
Extending node-data-mapper to support a new driver is trivial.  Refer the the [Extending](#extending) section.

###### Define a Database

The easiest way to define a database is using a simple object.  Here's a basic example for a bike shop database.  A database is made up of an array of tables, and each table is made up of an array of columns.  Each table must have a primary key column defined.  Tables and columns can be aliased; an alias defines how a table or column will be serialized.

More advanced configurations are presented later.

```js
'use strict';

var db =
{
  name: 'bike_shop',
  tables:
  [
    {
      // The name of the database table.
      name: 'bike_shops',
      // When a query is mapped to an object or array, by default the object
      // will use the alias.  In this case, selecting from bike_shops will
      // result in an array of bikeShops.
      alias: 'bikeShops',
      columns:
      [
        // Each table must have a primary key.  Support for composite keys is
        // underway.
        {name: 'bikeShopID', isPrimary: true},
        {name: 'name'},
        {name: 'address'}
      ]
    },
    {
      name: 'staff',
      columns:
      [
        {name: 'staffID', isPrimary: true},
        {name: 'firstName'},
        {name: 'lastName'},
        {name: 'age'},
        // Columns can also be aliased.  Here, the column "sex" will be 
        // serialized as "gender."
        {name: 'sex', alias: 'gender'},
        {name: 'hasStoreKeys'},
        {name: 'hireDate'},
        {name: 'bikeShopID'}
      ]
    },
    {
      name: 'bonuses',
      columns:
      [
        {name: 'bonusID', isPrimary: true},
        {name: 'reason'},
        {name: 'amount'},
        {name: 'dateGiven'},
        {name: 'staffID'}
      ]
    },
    {
      name: 'bikes',
      columns:
      [
        {name: 'bikeID', isPrimary: true},
        {name: 'brand'},
        {name: 'model'},
        {name: 'msrp'}
      ]
    },
    {
      name: 'bikeShopBikes',
      columns:
      [
        {name: 'bikeShopBikeID', isPrimary: true},
        {name: 'bikeShopID'},
        {name: 'bikeID'}
      ]
    }
  ]
};

module.exports = db;
```

###### Define a DataContext Instance

A DataContext instance is the interface through which queries are executed.  The DataContext constructor takes two parameters: a Database instance and a connection pool.

```js
'use strict';

var ndm   = require('node-data-mapper');
var mysql = require('mysql');

// Create a database instance.  The easiest way is to define the database
// in an object, but one can also add tables and columns manually.
var db = new ndm.Database(require('./bikeShop'));

// Create a connection pool.  In this case we're using a MySQL connection
// pool with a 10 connection limit.  (Refer to the mysql documentation.)
var pool = mysql.createPool
({
  host:            'localhost',
  user:            'example',
  password:        'secret',
  database:        db.getName(),
  connectionLimit: 10
});

// Export an instance of a DataContext object.  This is what will be used
// throughout your application for database access.
module.exports = new ndm.MySQLDataContext(db, pool);
```

## Examples

The following examples--all of which are contained in the "examples" directory--use the bike_shop database.  To import this database run the SQL in bike_shop.sql. To do so, log in to your MySQL server, then run:

```
source bike_shop.sql
```

The database contains a series of bike shops.  Each bike shop has staff, and staff can get bonuses.  Each bike shop sells bikes. When you source bike_shop.sql, two queries are run to show what data have been added.  The first shows all the bike shops, the staff for each, and each staff member's bonuses.  (Most staff members have not received any bonuses.)  The second query shows all the bike shops with all the bikes sold by each shop.  Note that some of the bikes are sold by multiple shops.

The bike_shop.sql script creates a user "example" with a password of "secret". If you change the credentials then you will need to update the bikeShopDataContext.js file accordingly.

### Selecting

The simplest query one can perform is selecting all data from a single table.

```js
'use strict';

var bikeShopDC = require('../bikeShopDataContext');

// Select all columns from the bike_shops table.
var query = bikeShopDC.from('bike_shops');

// This is the query that will be executed.
console.log('Query:');
console.log(query.toString(), '\n');

// Executing a query returns a promise, as defined by the deferred API.
// https://www.npmjs.com/package/deferred
query.execute().then(function(result)
{
  console.log('Result:');
  console.log(result);
})
.catch(function(err)
{
  console.log(err);
}).finally(function()
{
  // Close the connection.
  bikeShopDC.getQueryExecuter().getConnectionPool().end();
});
```
Running this code (```node example/retrieve/allFromSingleTable.js```) yields the following output.
```js
Query:
SELECT  `bikeShops`.`bikeShopID` AS `bikeShops.bikeShopID`, `bikeShops`.`name` AS `bikeShops.name`, `bikeShops`.`address` AS `bikeShops.address`
FROM    `bike_shops` AS `bikeShops` 

Result:
{ bikeShops: 
   [ { bikeShopID: 1,
       name: 'Bob\'s Bikes',
       address: '9107 Sunrise Blvd' },
     { bikeShopID: 2,
       name: 'Zephyr Cove Cruisers',
       address: '18271 Highway 50' },
     { bikeShopID: 3,
       name: 'Cycle Works',
       address: '3100 La Riviera Wy' } ] }
```
Note the table "bike_shops" is aliased (refer to the [Define a Database](#define-a-database) section); hence, the serialized object is named "bikeShops." 

###### Limiting Columns

The selected columns can be limited by using the ```select``` method.  The ```select``` method is variadic, and in its simplest form it can be passed an array of fully-qualified column names.  A fully-qualified column name takes the form ```<table-alias>.<column-name>```.  For example, the ```bike_shops``` table is aliased ```bikeShops```, so limiting the above query to ```bikeShopID``` and ```address```:

```js
var query = bikeShopDC
  .from('bike_shops')
  .select('bikeShops.bikeShopID', 'bikeShops.name');
```
It's important to note that if any columns are selected from a table, then the primary key must also be selected.  If the primary key is not selected then an exception will be raised.

###### Ad-Hoc Aliasing

Tables and columns can be aliased in the Database definition, but often it's convenient to alias on the fly.  Both ```from``` and ```select``` can be given objects to describe the serialization.  The ```from``` method takes a meta object with the following properties:

```js
{
  table:  string, // The name of the table to select from.
  as:     string  // An alias for the table.  This is needed if, for example,
                  // the same table is joined in multiple times.
                  // This defaults to the table's alias.
}
```

Likewise, the ```select``` method can be passed multiple column meta objects with the following properties:

```js
{
  column:   string, // The fully-qualified column name in the
                    // form: <table-alias>.<column-name>
  as:       string  // An alias for the column, used for serialization.
                    // If not provided this defaults to the column's alias.
}
```

Building on the previous examples, the table and columns can be aliased as follows:

```js
var query = bikeShopDC
  .from({table: 'bike_shops', as: 'shops'})
  .select({column: 'shops.bikeShopID', as: 'id'}, {column: 'shops.name', as: 'shopName'});
```

Running this example (```example/retrieve/adHocAlias.js```) yields the following output:

```
Query:
SELECT  `shops`.`bikeShopID` AS `shops.id`, `shops`.`name` AS `shops.shopName`
FROM    `bike_shops` AS `shops` 

Result:
{ shops: 
   [ { id: 1, shopName: 'Bob\'s Bikes' },
     { id: 2, shopName: 'Zephyr Cove Cruisers' },
     { id: 3, shopName: 'Cycle Works' } ] }
```

## Extending

The node-data-mapper module is designed to be extendable.  Adding support for a new database dialect is simple, and involves extending and specializing the DataContext class.  The DataContext defines a standard interface for escaping and executing queries.  Refer to the MySQLDataContext implementation for an example.