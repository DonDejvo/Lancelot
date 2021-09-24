# USER MANUAL - HOW TO USE NPM AND GIT COMMANDS
-----------
## Git

### Pulling the repo from github to your computer
1. Open a cmd shell
2. Move to your project's directory (run ```cd yourProjectFolderPath```)
3. If you haven't initialised git for your project on your computer yet, run ```git init```
4. If you didn't already, add your github repo as a remote origin to your git folder: ```git remote add origin https://github.com/yourUsername/yourRepo.git```
5. Pull the repo's content by running ```git pull origin main``` (if your branch isnt called main, then use the name you gave it)

### Pushing the repo with changes back to github
1 - 4. Same as above

5. Add the changes to stage them ```git add .```
6. Commit the changes ```git commit -m 'Your commit message'```
7. Push the changes to github ```git push origin main```

## npm

#### Quick disclaimer
This is only a guide on how to use npm for development, not on how to publish packages, install them and all the other stuff.

### Package.json
This is essencially the main file of your entire project: Everything regarding metadata belongs in here.
As you can see when checking the file, you can set multiple things like name, version, author, license etc.
Feel free to change them like you want, but please don't publish it yet as I dont really know how that works either, lol.

### Npm commands
In ```package.json```, you can see an object called "scripts". Inside of it, commands can be added to be executed by npm:
```json
scripts: {
    "someTestCommand": "echo 'Joe mama' && exit 1"
}
```
Running commands works like this:
1. Open a cmd shell
2. Run ```npm run someTestCommand```

For Lancelot, there are currently two commands:
```npm run dev``` - opens a snowpack server and a browser window for testing.
```npm run build``` - creates new bundled version of all files linked to the entry file in "src" and puts it into "dist"
