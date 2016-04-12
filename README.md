# GovReday API
The GovReday API.  It users [Auth0](http://auth0.com) as the user authentication store, and mongo db as the database.


## API Documentation
You can view all of their endpoints and associated parameters at [/docs](http://workhorse.albatrossdigital.com:4000).

The API is scaffolded with [Swagger](http://swagger.io). You can edit, preview and export the YAML file in an online editor at:
http://editor.swagger.io/#/?import=https://raw.githubusercontent.com/GovReady/GovReady-CMS-API/master/swagger.yaml


## Installing and Running

Copy the `.env` file.  Then run with forever:
```
forever -w ./bin/www 
```