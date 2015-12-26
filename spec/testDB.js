var db =
{
  name: 'testDB',
  tables:
  [
    {
      name: 'users',
      columns:
      [
        {
          name: 'userID',
          alias: 'ID',
          isPrimary: true
        },
        {
          name: 'firstName',
          alias: 'first'
        },
        {
          name: 'lastName',
          alias: 'last'
        }
      ]
    },
    {
      name: 'phone_numbers',
      alias: 'phoneNumbers',
      columns:
      [
        {
          name: 'phoneNumberID',
          alias: 'ID',
          isPrimary: true
        },
        {
          name: 'userID'
        },
        {
          name: 'phoneNumber'
        },
        {
          name: 'type'
        }
      ]
    }
  ]
};

module.exports = db;

