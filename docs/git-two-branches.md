## Maintaining two branches
1. Create PR form issue branch to test branch.
2. Select "Squash and merge" and merge, then click "Delete branch" of issue branch.
3. Create PR from test branch to main branch.
4. Select "Create a merge commit" and merge.
5. In local git repo. Execute the following commands.
   ```
   git checkout origin main
   git pull origin main
   git checkout origin test
   git pull origin test
   git push origin test
   ```
6. The main branch and test branch are synced at this stage. Then, create issue branch from test branch.
   ```
   git checkout test
   git checkout -b issue
   ```
