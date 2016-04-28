# GovReady CMS API
The GovReady CMS API Service is used in conjuction with the [GovReady WordPress Agent](https://github.com/GovReady/GovReady-WordPress-Agent) to provide cybersecurity, compliance, and 
operations and maintenance status information. 

The GovReady CMS API uses [Auth0](http://auth0.com) as the user authentication store, mongo db as the 
database, and RabbitMQ as the task queue.

When a new Agent -- such as a [WordPress](https://github.com/GovReady/GovReady-WordPress-Agent/issues/13)
 or Drupal (@todo, coming soon) plugin -- is initialized, a new site is created in the GovReady CMS API.  
The API will then begin collecting information about the site by requesting information 
from the Agent (WordPress site), or polling site site.  It also serves as a store for 
information collected manually within the Agent user interface.

Here is an overview of the data collected and the source for the information:
* `agent` Stack (OS, application version, database)
* `agent` Accounts (permissions, last login)
* `agent` Plugins (version)
* `whois` Domain (expiration)
* `request` SSL (expiration, status)
* `request` Uptime
* `manual` Manual measures
* `manual` Contact matrix


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
