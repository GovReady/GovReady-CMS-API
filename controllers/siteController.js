// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');

var helpers = require('../controllers/helpersController');


// Create endpoint /site/{siteId}/posts for GET
exports.getSiteSettings = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    // @todo: check that sites[0] is valid

    console.log(site);
    var out = {
      ID: site._id,
      URL: site.url,
      description: '',//site.location.city +' '+ site.location.stateFull,
      lang: "en-US",
      name: site.name,//site.options.city,
      settings: {
        admin_url: site.url + '/helpers-admin/'
      }
    }

    request(helpers.helpersProxyUrl(req, site, 'options'), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        merge(out.settings, json);
        out.description = json.blogdescription;
        //out.name = json.blogname; // @todo: temp?
        res.helpersEnvelope(out);
      }
    });
  });
}



// Create endpoint /site/{siteId}/post-types for GET
exports.getSitePostTypes = function(req, res) {


  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    
    /*
    // @todo: check that sites[0] is valid
    var client = xmlrpc.createClient({ host: 'wordpress.albatrossdemos.com', port: 80, path: '/xmlrpc.php?for=jetpack'})
    var params = [["GET","https:\/\/public-api.wordpress.com\/rest\/v1.1\/sites\/wordpress.albatrossdemos.com\/posts?http_envelope=1&status=publish%2Cprivate&type=page&site_visibility=visible&modified_after=2015-12-07T07%3A09%3A09%2B00%3A00","",103415197,[],""],["internal","1"]];
    // Sends a method call to the XML-RPC server
    client.methodCall('jetpack.jsonAPI', params, function (error, value) {
      // Results of the method response
      console.log('Method response for \'anAction\': ' + value+error)
    })
    */

    request(helpers.helpersProxyUrl(req, site, 'types'), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var out = {
          found: json.length,
          post_types: []
        };
        var postTypes = {};
        for(var key in json){
          var entity = json[key];
          postTypes[entity.slug] = {
            api_queryable: false,
            label: entity.name,
            name: entity.slug,
            capabilities: {
              create_posts: "edit_posts",
              delete_others_posts: "delete_others_posts",
              delete_post: "delete_post",
              delete_posts: "delete_posts",
              delete_private_posts: "delete_private_posts",
              delete_published_posts: "delete_published_posts",
              edit_others_posts: "edit_others_posts",
              edit_post: "edit_post",
              edit_posts: "edit_posts",
              edit_private_posts: "edit_private_posts",
              edit_published_posts: "edit_published_posts",
              publish_posts: "publish_posts",
              read: "read",
              read_post: "read_post",
              read_private_posts: "read_private_posts"
            },
            description: '',
            labels: entity.labels,

            map_meta_cap: true,
            supports: {title: true, editor: true, thumbnail: true, excerpt: true},
          };
        } // for

        // Hack to change menu labels
        //postTypes.post.labels.menu_name = 'Posts';
        //postTypes.question.labels.menu_name = 'Answers';

        // We cycle through a pre-ordered and filtered set of the post types we want to show
        var allowedTypes = ['page', 'agency', 'question', 'payment', 'post', 'event', 'job_listing', 'staff-member', 'document'];
        for(var key in allowedTypes){
          if (postTypes[allowedTypes[key]] != undefined) {
            out.post_types.push(postTypes[allowedTypes[key]]);
          }
        }

        res.helpersEnvelope(out);
      }
    }); // request
  });
}


// Create endpoint /site/{siteId}/posts for GET
exports.getSitePosts = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    // @todo: check that sites[0] is valid
    request(helpers.helpersProxyUrl(req, site, 'posts'), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var out = {
          meta: {data: {counts: {}}},
          found: json.length,
          posts: [],
        };
        for(var key in json){
          var entity = json[key];


          out.posts.push({
            ID: entity.id,
            URL: entity.link,
            label: entity.name,
            name: entity.slug,
            api_queryable: true,
            capabilities: {
              delete_post: true,
              edit_post: true,
              publish_post: true
            },
            description: '',
            map_meta_cap: true,
            global_ID: entity.guid.rendered,
            author: {
              'username': 'jeff',
              'avatar_URL': '',
            },
            featured_image: '',
            content: entity.content.rendered,
            excerpt: entity.excerpt.rendered,
            title: entity.title.rendered,
            discussion: {
              "comments_open": false,
              "comment_status": "closed"
            }
          });
          // @todo: canonical_image, featured_media
        }
        res.helpersEnvelope(out);
      }
    });
  });
}


// Create endpoint /site/{siteId}/posts for GET
exports.getSiteMenus = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    request(helpers.helpersProxyUrl(req, site, 'menus'), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var out = {
          meta: {data: {counts: {}}},
          locations: [
            {
              defaultState: "empty",
              description: "Social Menu",
              name: "social"
            }
          ],
          menus: [],
        };
        for(var key in json){
          var entity = json[key];
          request(helpers.helpersProxyUrl(req, site, 'menus/' + entity.ID), function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var menuData = JSON.parse(body);
              console.log(menuData);
              out.menus.push({
                description: menuData.description,
                id: menuData.ID,
                items: menuData.items,
                locations: [],
                name: menuData.name
              });
              // Wait until we have fetched all of the menus
              if (out.menus.length >= json.length) {
                res.helpersEnvelope(out);
              }
            }
          }); // request

        } // for
        
      }
    });
  });
}



// Create endpoint /site/{siteId}/posts for GET
exports.getSitePlugins = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    // @todo: check that sites[0] is valid

    request(helpers.helpersProxyUrl(req, site, 'plugins'), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var out = {
          plugins: [],
        };
        // Get the list of allowed plugins
        request(process.env.APPSTORE_REPO + '/distributions/proudcity.json', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var allowed = JSON.parse(body);
            for(var key in json){
              var keyArr = key.split('/');
              var index = allowed.indexOf(keyArr[0]);
              if (index !== -1) {
                var entity = json[key];
                out.plugins[index] ={
                  active: entity.Active,
                  author: entity.Author,
                  author_url: entity.AuthorURI,
                  autoupdate: false,
                  description: entity.Description,
                  id: key,
                  name: entity.Name,
                  network: false,//entity.network,
                  plugin_url: entity.PluginURI,
                  slug: key,
                  version: entity.Version
                };
              }
            }
            res.helpersEnvelope(out);
          }
          
        });



        
      }
    });
  });
}


// Create endpoint /site/{siteId}/posts for GET
exports.postSitePlugin = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);
    // @todo: check that sites[0] is valid
    var data = {
      plugin: req.params.plugin,
      action: req.body.active ? 'activate' : 'deactivate'
    }
    console.log(data);
    request.post(helpers.helpersProxyUrl(req, site, 'plugins', data), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        
        var json = JSON.parse(body);
        json.active = req.body.active;
        json.id = json.plugin;
                console.log(json);

        res.helpersEnvelope(json);
      }
    });

  });
}

// Create endpoint /site/{siteId}/posts for GET
exports.postSiteSettings = function(req, res) {
  helpers.findSite(req, function(err, site) {
    if (err)
      res.send(err);

    // @todo: check that sites[0] is valid
    request.post(helpers.helpersProxyUrl(req, site, 'options', req.body), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        if (json.blogname != undefined) {
          site.name = json.blogname;
          site.description = json.blogdescription;
          site.save();
        }
        res.helpersEnvelope(json);

      }
    });


  });
}

// Create endpoint /site/{siteId}/roles for GET
exports.getSiteRoles = function(req, res) {
  out = {roles:
    [
      {
        capabilities: {}, //@todo: {switch_themes: true, edit_themes: true, activate_plugins: true, edit_plugins: true, edit_users: true,…}
        display_name: "Editor",
        name: "editor",
      },
      {
        capabilities: {},
        display_name: "Author",
        name: "author",
      },
      {
        capabilities: {},
        display_name: "Contributor",
        name: "contributor",
      }
    ]
  };
  res.helpersEnvelope(out);
}

