# GovReady API
The GovReady API.  It users [Auth0](http://auth0.com) as the user authentication store, and mongo db as the database.


## API Documentation
You can view all of their endpoints and associated parameters at [/docs](http://plugin.govready.com/docs).

The API is scaffolded with [Swagger](http://swagger.io). You can edit, preview and export the YAML file in an online editor at:
http://editor.swagger.io/#/?import=https://raw.githubusercontent.com/GovReady/GovReady-CMS-API/master/swagger.yaml


## Installing and Running

Copy the `.env` file.  Then run with forever:
```
forever -w ./bin/www 
```

Commands to run to setup Ubuntu 14.04 server:
```
apt-get update
apt-get install git
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
nvm install 5.0
node -v
npm install -g forever
cd /var/local
git clone https://github.com/GovReady/GovReady-CMS-API.git
cd GovReady-CMS-API
nano .env
npm install
forever -w ./bin/www 
```
