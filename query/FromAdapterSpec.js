describe('FromAdapterAdapter test suite.', function()
{
  'use strict';

  var FromAdapter  = require('./FromAdapter');
  var From         = require('./From');
  var Database     = require('../database/Database');
  var MySQLEscaper = require('./MySQLEscaper');
  var db           = new Database(require('../spec/testDB'));
  var escaper      = new MySQLEscaper();
  var qryExec;

  beforeEach(function()
  {
    qryExec = jasmine.createSpyObj('qryExec', ['select', 'delete']);
  });

  describe('FromAdapter constructor test suite.', function()
  {
    // Checks the constructor.
    it('checks the constructor.', function()
    {
      var fa = new FromAdapter(db, escaper, {table: 'users'});

      expect(fa instanceof From).toBe(true);
    });

    // Checks the basic getters.
    it('checks the basic getters.', function()
    {
      var fa = new FromAdapter(db, escaper, {table: 'users'});

      expect(fa.getDatabase()).toBe(db);
      expect(fa.getEscaper()).toBe(escaper);
    });
  });

  describe('FromAdapter select test suite.', function()
  {
    // Checks that select selects all by default.
    it('checks that select selects all by default.', function()
    {
      var sel = new FromAdapter(db, escaper, {table: 'users'}, qryExec)
        .select();

      expect(sel.toString()).toBe
      (
        'SELECT  `users`.`userID` AS `users.ID`, `users`.`firstName` AS `users.first`, `users`.`lastName` AS `users.last`\n' +
        'FROM    `users` AS `users`'
      );
    });

    // Checks that columns can be limited.
    it('checks that columns can be limited.', function()
    {
      var sel = new FromAdapter(db, escaper, {table: 'users'}, qryExec)
        .select('users.userID', 'users.firstName');

      expect(sel.toString()).toBe
      (
        'SELECT  `users`.`userID` AS `users.ID`, `users`.`firstName` AS `users.first`\n' +
        'FROM    `users` AS `users`'
      );

      // As an array.
      sel = new FromAdapter(db, escaper, {table: 'users'}, qryExec)
        .select(['users.userID', 'users.firstName']);

      expect(sel.toString()).toBe
      (
        'SELECT  `users`.`userID` AS `users.ID`, `users`.`firstName` AS `users.first`\n' +
        'FROM    `users` AS `users`'
      );
    });

    // Checks that a query can be executed.
    it('checks that a query can be executed.', function()
    {
      new FromAdapter(db, escaper, {table: 'users'}, qryExec)
        .select('users.userID', 'users.firstName')
        .execute();

      expect(qryExec.select).toHaveBeenCalled();
    });
  });
});

