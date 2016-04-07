# GovReday API
The GovReday API.  It users [Auth0](http://auth0.com) as the user authentication store, and mongo db as the database.


## Swagger file
The API is scaffolded with [Swagger](http://swagger.io). You can edit, preview and export the YAML file in an online editor at:
http://editor.swagger.io/#/?import=https://raw.githubusercontent.com/GovReady/GovReady-CMS-API/master/swagger.yaml


---

### Installing and Running

Copy the `.env` file and `keys` directory from https://github.com/proudcity/proud-recipes/tree/master/proudcity-api-keys into `./proudcity-api`.  Then run with forever:
```
forever -w ./bin/www 
```

See https://github.com/proudcity/wp-calypso/blob/feb2016/WORKING/README.md for essential modifications you need to make to wp-calypso to make it work with proudcity-api.

### Helpful mongo commands
Note: only use double quotes in mongo (" not ')

```
mongo ds029595.mongolab.com:29595/proudcity_api -u proudcityapi -p senSEjtD9c6EnBya

db.sites.insert({  
   "type":"proudcity",
   "description":"Corte Madera, CA, USA{\"lat\":37.92548060000001,\"lng\":-122.52747549999998}",
   "slug":"example",
   "options":{  
      "lng":-122.52747549999998,
      "lat":37.92548060000001,
      "stateFull":"California",
      "state":"CA",
      "county":"Marin County",
      "city":"Corte Madera"
   },
   "url":"https://example.proudcity.com"
});

db.users.insert({
  "username": "Support",
  "email": "test@proudcity.com",
  "sub": 'auth0|56a2948c3ea210e00ab31dc6',
  "sites": [{
    "siteId": ObjectId("56c2c0d774a20fbf145a0aa9"),
    "role": "editor"
  }]
});

db.users.remove({"email": {"$ne": "info@proudcity.com"}});


# Add a site to a user
db.users.update(
   { "email": "support@proudcity.com" },
   { $push:
      {
        sites: {
          "siteId": ObjectId("56c2cba75f5c259840c388a5"),
          "role": "editor"
        }
      }
   }
);

# Update values
# The $set makes is not reset all values to undefined!
db.sites.update(
   { "url" : "https://example.proudcity.com" },
   { $set:
      {
        'description': 'ProudCity example website for demonstrations'
      }
   }
);

db.users.update(
   { "email" : "support@proudcity.com" },
   { $set:
      {
        "avatar" : "https://s.gravatar.com/avatar/0a2422c613082908dcf432308ec73911?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fsu.png",
      }
   }
);

```

