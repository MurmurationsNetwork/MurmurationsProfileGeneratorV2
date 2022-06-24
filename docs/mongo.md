# Hosted MongoDB Setup with Digital Ocean

1. Add hosted MongoDB to project (basic $15/month setup)
   1. Name it in a memorable way (e.g., db-mongodb-lon1-murmlive)
2. .... wait several minutes for the DB to finish deploying ...
3. Don't restrict inbound connections
4. Note `host` value to store in `.env`
   1. Also note either connection parameters or connection string depending on your DB client
5. Create `mpg` user and `mpgdata` DB
   1. Add `mpg` user and password to env vars
6. Use connection details from step 4.1 to login to the DB using your Mongo client
7. Create collections & indices
   ```
   db.createCollection('users');
   db.createCollection('profiles');
   db.users.createIndex({'email_hash': 1}, {unique: true});
   db.profiles.createIndex({'cuid': 1}, {unique: true});
   ```
