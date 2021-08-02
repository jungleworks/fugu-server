/**
 * Created by sumeet on 14/02/19.
 */

const swaggerUi                    =      require('swagger-ui-express');
const path                         =      require('path');
const fs                           =      require('fs');
let  swaggerAPIFolderIsEmpty       =      true;

exports.initialize                 =      initialize;

function initialize() {
  try {
    var finalJson = JSON.parse(fs.readFileSync("./swagger/boiler.json"));
    fs.readdirSync(path.join(__dirname, './api')).forEach(function (file) {
      let api = JSON.parse(fs.readFileSync(path.join(__dirname, './api', file)));
      api.data.post.parameters = defaultEntries(api.data.post.parameters);
      finalJson.paths[api.path] = api.data;
      swaggerAPIFolderIsEmpty = false
    });
    finalJson.host = config.get('apiURL');

    if (!swaggerAPIFolderIsEmpty) {
      let swaggerData = JSON.stringify(finalJson, null, 2);
      fs.writeFileSync('./swagger/boiler.json', swaggerData, err => {
        if (err) {
          throw new Error("Cannot Write to Swagger File")
        }
      });
      const swaggerDocument = JSON.parse(fs.readFileSync('./swagger/boiler.json'));
      const options =
            {
              customCss: '.swagger-ui .topbar { display: none }',
              customSiteTitle : 'Jungle Auth',
              customfavIcon : 'https://3ewwlw1m6nye2hxpj916rtwa-wpengine.netdna-ssl.com/wp-content/uploads/2018/02/jw-blue-favicon.png'
            };
      app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
      console.log("Swagger File is successfully loaded");
    }
    else {
      console.error("Swagger API Folder is Empty");
      throw new Error();
    }
  }
  catch (exception) {
    console.error("Swagger File Not Loaded ! ", exception);
  }
}

function defaultEntries(params) {
  return params.concat([
    {
    "type"       : "string",
    "description": "Auth Key",
    "name"       : "auth_key",
    "in"         : "formData",
    "example"    : "Key",
    "required"   : true
  },
  {
    "type"       : "number",
    "description": "Offering",
    "name"       : "offering",
    "in"         : "formData",
    "example"    : "1",
    "required"   : true
  }])
}