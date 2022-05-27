# First Initialization
1. Create collections.
   ```
   db.createCollection('users');
   db.createCollection('profiles');
   ```
2. Create Index for them.
   ```
   db.users.createIndex({'email_hash': 1}, {unique: true});
   db.profiles.createIndex({'cuid': 1}, {unique: true});
   ```
