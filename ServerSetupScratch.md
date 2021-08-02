# Fugu Open Source

Fugu is an open source project developed by Jungleworks.

Use AWS cloud to run the Fugu-OpenSource setup

### Prerequisites needed to setup

- An AWS account on to run machine (t3a.medium minimum)
- Domain Provider to host domain
- SSL Certificates

### Steps

- Login into the account 
- Go to the EC2 under AWS services and choose the "Instances" on the left side options.
- Click on "Launch Instance" button on top of the window and then find the "ami-02913db388613c3e1" under "Commununity AMIs" option.
- Choose the minimum instance type (t3a.medium)
- Choose network as per requirement (default preferably)
- Add storage (minimum 20GB) you would like to add to the instance
- Add tag that you want to keep with the name of the instance
- Create a security group and add inbound rules with ports 22, 443 and 3012
  and outbound rule to be set will be 0.0.0.0/0
- Go ahead and press review and launch
- Confirm the specifications and press launch, it will ask for the key(pem)
  to create and confirm after choosing the key name
- Go to elastic ips in the left column under "Network & Security" where you would allocate an elastic ip to the instance
- Click allocate elastic ip address if you don't have any elastic ip availble to bind to the instance.
- Select IP and click actions upder it choose associate elastic ip address
- Choose the instance with name or it's id and select it, click associate
- Go to the IAM
- Choose roless and create a role
- Choose the service you want to bind it to ie: S3 service
- Select S3 in "select your use case"
- Attach policies by filtering s3 and click on the checkbox with "AmazonS3FullAcces"
- Attach policies by filtering and giving access of read & write in "Rekognition"
- Add tag that you want to keep with the name of the role
- Attach this role with the instance running by right clicking on the instance choosing security in which you would find "modify IAM role"
- Choose the role that was created and save it
- Now choose S3 service in it choose "Create bucket"
- Give it a name, choose region and create bucket.
- Attach the role created to the instance


#### SSH in to the Server
```sh
ssh -i abc.pem ec2-user@ip
sudo su 
```

```sh
yum update -y
```

#### Dependencies
```sh
yum groupinstall 'Development Tools'
yum-config-manager --enable epel
yum install epel-release
yum -y install httpd mod_ssl
service httpd stop
vi /etc/httpd/conf/httpd.conf  ##change port 80 with 81
service httpd start
service httpd status
yum install nginx
service nginx status
yum update -y
```

> sudo su would give you root privileges
> which would allow you to run any 
> command on your server as a root user
> yum update command will let you update 
> the package exiting 
> you would need to install additional 
> dependencies like epel-release
> changing port of httpd service to 81 from 80(default)

## Installation

To install :

##### Mysql

```sh
rpm -Uvh https://repo.mysql.com/mysql80-community-release-el6-3.noarch.rpm
sed -i 's/enabled=1/enabled=0/' /etc/yum.repos.d/mysql-community.repo
yum --enablerepo=mysql80-community install mysql-community-server
service mysqld start
grep "A temporary password" /var/log/mysqld.log
mysql_secure_installation
service mysqld restart
chkconfig mysqld on
mysql -uusername -ppassword   (login)

```

> you would be asked for a number of questions, in first option where it asks for
  changing the password for root provide no as 'n' and rest would be yes 'y'



##### Phpmyadmin

```sh
sudo yum install httpd php php-mysql php-mcrypt
yum install phpmyadmin
yum install php-fpm
service php-fpm start
service php-fpm status
service httpd stop
vi /etc/httpd/conf/httpd.conf    ## change port 80 to 81
service httpd start

```

> If user gets Error: 2059 (not able to authenticate) in phpmyadmin run below command
```sh
## login into mysql cli
mysql -uusername -ppassword
ALTER USER 'root@localhost' IDENTIFIED WITH mysql_native_password BY 'passsword';
exit
```



##### Elasticsearch

```sh
sudo rpm -i https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/rpm/elasticsearch/2.3.3/elasticsearch-2.3.3.rpm
sudo chkconfig --add elasticsearch
cd /usr/share/elasticsearch/
sudo bin/plugin install cloud-aws -y
sudo service elasticsearch start
curl localhost:9200/_cluster/health?pretty
```

> above commands will install elasticsearch
> and it will start the elasticsearch service


##### Git

```sh
yum install git -y
```
> this command will install git


##### Redis

```sh
yum install epel-release
yum install redis -y
chkconfig redis on
service redis restart
```
> these above commands will install redis service


##### Change Permissions

```sh
whoami   
visudo   ## need to be root for it
%node ALL=(ALL) NOPASSWD: ALL      ## add this line in viudo file
:wq    ## save and quit 
```


##### NVM
###### Creating a user to install node
```sh
adduser node
su - node
```
> adduser will create a user
> switch to the user where nvm will be installed

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install v12.14
nvm --version
node --version
exit
```


###### URLs to add

```sh
vi /etc/nginx/conf.d/domain-name1.conf

server {
    listen      80;
    listen      [::]:80;
    server_name domain-name1.com;
    return 301 https://domain-name1.com;
}
server {
    listen              443 http2 ssl;
    listen              [::]:443 ssl http2;
    server_name         domain-name1.com;
    ssl_certificate     /etc/ssl/ssl.crt;
    ssl_certificate_key  /etc/ssl/ssl.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    underscores_in_headers on;
    location / {
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "Upgrade";
          proxy_set_header Host $host;
        proxy_pass         http://localhost:3012;
       # include proxy_params;
       # proxy_redirect off;
    }
}

```

```sh
vi /etc/nginx/conf.d/domain-name2.conf

server {
        listen       80;
        server_name domain-name2.com;
        rewrite ^ https://$http_host$request_uri? permanent;    # force redirect http to https
    }

server {

        listen 443 ssl http2;
        server_name domain-name2.com;
#    ssl on;
    ssl_certificate /etc/ssl/ssl.crt ;        # path to your cacert.pem
    ssl_certificate_key /etc/ssl/ssl.key;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header Cache-Control "no-cache, max-age=0";
       root /var/www/angular/office-chat-web/dist;
        index  index.html;

           location ~* \.(css|js)$ {
       access_log off;
        add_header Cache-Control "max-age=604800, must-revalidate";
  }

   location ~* \.(gif|jpeg|jpg|png|woff|ttf|otf|svg|woff2|eot)$ {
       access_log off;
       add_header Cache-Control "max-age=1209600, must-revalidate";
   }

underscores_in_headers on;
location /fugu-api/ {
                resolver 8.8.8.8 ipv6=off;
                proxy_pass http://localhost:3012/;
                proxy_pass_request_headers      on;
                proxy_set_header   Host               $host;
                proxy_set_header   X-Real-IP          $remote_addr;
                proxy_set_header   X-Forwarded-Proto  $scheme;
                proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
        }

location /api-oc/ {
                resolver 8.8.8.8 ipv6=off;
                proxy_set_header  X-Forwarded-For $remote_addr;
                proxy_pass http://localhost:3012;
                proxy_pass_request_headers      on;
                }

location /fugu/ {
                resolver 8.8.8.8 ipv6=off;
                proxy_set_header  X-Forwarded-For $remote_addr;
                proxy_pass http://localhost:3012;
                proxy_pass_request_headers      on;

        }

   location / {
                try_files $uri $uri/ /index.html?$query_string;
   }

}

```

```sh
vi /etc/nginx/conf.d/pma.conf

server {
        listen 80;
        server_name pma-domainname3;     ##phpmyadmin url
        return 301 https://pma-domainname3.com;
}
server {

    # Listen on port 81
    listen 443 ssl http2;

    # Server name being used (exact name, wildcards or regular expression)
    server_name pma-domain3.com;
    ssl_certificate     /etc/ssl/ssl.crt;
    ssl_certificate_key  /etc/ssl/ssl.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www;
    location /phpMyAdmin {
        root /usr/share/;
        index index.php;

    location ~\.php$ {
        try_files $uri =404;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include /etc/nginx/fastcgi_params;
        }

    location ~* ^/phpmyadmin/(.+\.(jpg|jpeg|gif|css|png|js|ico|html|xml|txt))$ {
     root /usr/share/;
        }
    }

location /phpmyadmin {
    rewrite ^/* /phpMyAdmin last;
    }
}
```


```sh

vi /etc/httpd/conf.d/phpMyAdmin.conf

Alias /phpMyAdmin /usr/share/phpMyAdmin
Alias /phpmyadmin /usr/share/phpMyAdmin

<Directory /usr/share/phpMyAdmin/>
   AddDefaultCharset UTF-8

   <IfModule mod_authz_core.c>
     # Apache 2.4
     <RequireAny>
       Require all granted
      #Require ip ::1
     </RequireAny>
   </IfModule>
   <IfModule !mod_authz_core.c>
     # Apache 2.2
     Order Allow,Deny
    #Deny from All
     Allow from all
    #Allow from ::1
   </IfModule>
</Directory>

<Directory /usr/share/phpMyAdmin/setup/>
   <IfModule mod_authz_core.c>
     # Apache 2.4
     <RequireAny>
       Require all granted
      #Require ip ::1
     </RequireAny>
   </IfModule>
   <IfModule !mod_authz_core.c>
     # Apache 2.2
     Order Allow,Deny
    #Deny from All
     Allow from all
    #Allow from ::1
   </IfModule>
</Directory>

# These directories do not require access over HTTP - taken from the original
# phpMyAdmin upstream tarball
#
<Directory /usr/share/phpMyAdmin/libraries/>
    Order Deny,Allow
    Deny from All
    Allow from None
</Directory>

<Directory /usr/share/phpMyAdmin/setup/lib/>
    Order Deny,Allow
    Deny from All
    Allow from None
</Directory>

<Directory /usr/share/phpMyAdmin/setup/frames/>
    Order Deny,Allow
    Deny from All
    Allow from None
</Directory>

```

> These are the dependencies which will be installed to run the application


> You need to have a domain purchased from any domain provider like godaddy,    namecheap etc.
Once you have purchased the domain, you need to buy SSLs for it
References:-
https://www.ssls.com/knowledgebase/how-to-install-an-ssl-certificate-in-godaddy-cpanel/
https://in.godaddy.com/help/manually-install-an-ssl-certificate-on-my-cpanel-hosting-12027
https://in.godaddy.com/help/how-do-i-install-an-ssl-certificate-on-my-server-172

> Once ssls are puchased, you need to login into the server and go to the path
/etc/ssl where you would have to create abc.crt and abc.key
(abc.crt and abc.key are the certificate and the key that we need to provide in config of the url you wnat to keep)
> Copy certs in the above respective files

> Go to the url in the path as below
/etc/nginx/conf.d where you have to change the config names with the name of the urls that you want to keep
example - abc.xyz.conf changing to qwerty.xyz.conf

> Open config and change path of the ssls in the configuration files
> To point dns to the server we need to create an 'A' record to IP of the server
> Once pointed to the server restart/reload webserver(nginx)

```sh
service nginx reload
```


#### Steps to deploy FuguChat on your server

> Install pm2 on your server
```sh
su - node
npm install -g pm2
```

> Create a directory where you want to store your node projects (Ex. /apps/node-apps)

```sh
sudo mkdir -p /apps/node-apps
sudo chown node: /apps/node-apps
cd /apps/node-apps
```

#### Go to the projects directory and clone the repo to your server
```sh
cd /apps/node-apps
git clone https://github.com/jungleworks/fugu-server
```

#### Use npm to install all the required dependencies for apps
```sh
cd /apps/node-apps/fugu-server/auth & npm i
cd /apps/node-apps/fugu-server/fuguchat & npm i
cd /apps/node-apps/fugu-server/attendance & npm i
cd /apps/node-apps/fugu-server/scrumbot & npm i
```


#### Create the databases
```sh
Create the databases
mysql -uusername -ppasssword    ##username & password from mysql installation
create database fugu_auth;
create database office_chat_prod;
create database attendance_prod;
create database scrum_prod;
show databases;     ## shows databases
exit     ##exit out of mysql
```

#### Import the schemas located in schemas directory
```sh
cd /apps/node-apps/fugu-server/schemas

## provide password to import schemas in each case
mysql -u root -ppassword fugu_auth < fugu_auth.sql
mysql -u root -p office_chat_prod < office_chat_prod.sql
mysql -u root -p scrum_prod < scrum_prod.sql
mysql -u root -p attendance_prod < attendance_prod.sql

```
### Change the sql-mode in /etc/my.cnf file and place the following code below [mysqld]
```sh
sql-mode=''

After you set the value of sql-mode make sure to restart mysql with sudo service mysql restart or sudo service mysqld restart

```

#### Copy the sample.json files as production.json in configuration directory of each app

```sh
## run commands as it is
cd /apps/node-apps/fugu-server/auth/config && cp sample.json production.json
cd /apps/node-apps/fugu-server/fuguchat/configuration && cp sample.json production.json
cd /apps/node-apps/fugu-server/attendance/configuration && cp sample.json production.json
cd /apps/node-apps/fugu-server/scrumbot/configuration && cp sample.json production.json
```


#### Deploying instances
```sh
su - node

cd /apps/node-apps/fugu-server/auth
NODE_ENV=production pm2 start app.js -n "auth"

cd /apps/node-apps/fugu-server/fuguchat
NODE_ENV=production pm2 start app.js -n "fugu"

cd /apps/node-apps/fugu-server/attendance
NODE_ENV=production pm2 start server.js -n "attendance"

cd /apps/node-apps/fugu-server/scrumbot
NODE_ENV=production pm2 start server.js -n "scrumbot"

pm2 l      ## shows pm2 intances running
```


#### Edit following columns present in office_chat_prod.domain_credentials

Reference - https://gist.github.com/cHAuHaNz/1da5cc10c01d0b14e376dc6e93af9369

```sh
{   
    host: "smtp.host.com",
    port: 587,
    senderEmail: AppName <support@yourdomain.com>
    auth: {
      user: SmtpUsername, // generated ethereal user
      pass: SmtpPassword, // generated ethereal password
    }
}
```

```sh
{
    "client_secret": "",
    "app_redirect_url": "https://yourdomain.com/oauth_sucess",
    "web_redirect_url": "postmessage",
    "googleIosClientId": "0000000000000-GetThisKeyFromGoogleCloudConsole.apps.googleusercontent.com",
    "googleWebClientId": "0000000000000-GetThisKeyFromGoogleCloudConsole.apps.googleusercontent.com",
    "googleAndroidClientId": "0000000000000-GetThisKeyFromGoogleCloudConsole.apps.googleusercontent.com"
}
```

#### Ensure below changes are done

```sh
## Edit the production.json files you just created above

/apps/node-apps/fugu-server/auth/config/production.json
"databaseSettings" : {
    "host" : "127.0.0.1",
    "user" : "root", // Update username
    "password": "", // Update password
    "database": "fugu_auth"
},
"slaveDatabaseSettings" : {
    "mysqlPORT": "",
    "host" : "127.0.0.1",
    "user" : "root", // Update username
    "password": "", // Update password
    "database": "fugu_auth"
},
/apps/node-apps/fugu-server/fuguchat/configuration/production.json
  "MYSQL": {
    "host": "localhost",
    "user": "root", // Update username
    "password": "", // Update password
    "database": "office_chat_prod"
  },
  "SLAVE_MYSQL": {
    "host": "localhost",
    "user": "root", // Update username
    "password": "", // Update password
    "database": "office_chat_prod"
  },
  ...
 "baseDomain": "fuguchat.com", // Place your parent domain here
 "frontEndUrl": "https://open.fuguchat.com", // Change 'open.fuguchat.com' to the frontend your url
 "ocBaseUrl": "http://localhost:3012", // Change 'http://localhost:3012' to actual api domain pointing of your fugu-server for webhooks to work
 ...
 "authWebhookSecret": "fuguChatSecret", // Change this to something random but equavalent to 'fuguchat.secret_key' in fugu-server/auth/config/production.json
 "authKey": "c#4ng3T#isS3cR3tK3Y", // Change this to something random but put same key in 'SECRET_API_KEY' array in fugu-server/auth/config/production.json
 "firebaseFcmKey": "", // Get this key from Firebase Project you created for frontend to enable Push Notifications on Web Platform
 "openApiSecretKey": "", // Change this super secret key to something random and minimum 32 Characters
 ...
  "SMSCredentials" : { // Integrate your app with bumbl to be able to send otps 
    "Bumbl" : {
      "userId" : -1,
      "apiKey" : "",
      "offering" : -1
    }
  }
  "AWSSettings": { // Add required AWS credentials to be able to upload media
    "baseURL": "",
    "accessKey":  "", // Access key is not required if you've attached IAM role to the server with access to the specified bucket
    "secretKey": "", // Secret key is not required if you've attached IAM role to the server with access to the specified bucket
    "region" : "",
    "awsBucket": "",
    "options": {
      "storageType": "STANDARD",
      "acl": "public-read", // Make your your bucket has public-read access
      "checkMD5": true
    }
  }

```
```ssh
## /apps/node-apps/fugu-server/attendance/configuration/production.json
"MYSQL" : {
    "host": "localhost",
    "user": "root", // Update username
    "password": "", // Update password
    "database" : "attendance_prod"
 },
 ...
"AWSSettings" : { // Add AWS credentials to store faces for face recognition in Attendance Bot
    "accessKey" : "", // Access key is not required if you've attached IAM role to the server with access to the specified bucket
    "secretKey" : "", // Secret key is not required if you've attached IAM role to the server with access to the specified bucket
    "bucket"  : "",
    "region"       : "",
    "options "     : {
      "storageType": "STANDARD",
      "acl"        : "public-read", // Make your your bucket has public-read access
      "checkMD5"   : true
    }
  }
```

#### Edit the json files in configuration directory of each app
```sh
/apps/node-apps/fugu-server/auth/config/live.json
/apps/node-apps/fugu-server/fuguchat/configuration/production.json
/apps/node-apps/fugu-server/attendance/configuration/production.json
/apps/node-apps/fugu-server/scrumbot/configuration/production.json
```

#### Enable New Relic for metrics (Optional)
```sh
set newRelicEnabled to 1 in configuration json file
set licenseKey in newrelic.js file situated in root directory of apps (Required)
```

#### Specify the node environment and start the server using
```sh
NODE_ENV=live pm2 start /apps/node-apps/fugu-server/auth/server.js -n "auth"
NODE_ENV=production pm2 start /apps/node-apps/fugu-server/fuguchat/server.js -n "fugu"
NODE_ENV=production pm2 start /apps/node-apps/fugu-server/attendance/server.js -n "attendance"
NODE_ENV=production pm2 start /apps/node-apps/fugu-server/scrumbot/server.js -n "scrumbot"
```

#### Save the instances
```sh
pm2 save
```
If changes are made to production.json files after creating their pm2 instances use pm2 reload instance_name to make the changes effective

### Schedule cron jobs for some automation tasks to work properly

Use crontab -e to open the /etc/crontab and create the following cron jobs

```sh

#scrum cron
*/1 * * * * curl -X GET http://localhost:3003/api/scrum/cron -H 'Content-Type: application/json' -H 'Postman-Token: 85581683-ae71-47d5-8ba7-b1fe6225139b'-H 'cache-control: no-cache'

#export data
*/5 * * * * curl -X GET http://localhost:3012/api/conversation/exportData -H 'Postman-Token: 0212ea0a-f1fd-4c4f-9108-e6e8619c51cc'-H 'app_version: 1' -H 'cache-control: no-cache' -H 'device_type: WEB'

#update snooze
*/20 * * * * curl -X PATCH http://localhost:3012/api/user/endSnooze -H 'Postman-Token: 8897f8df-ed4c-4dd6-8b79-4d5ea978106e' -H 'cache-control: no-cache'

# fugu bot cron
*/5 * * * * curl -X POST http://localhost:3012/api/bot/fuguCronMessages -H 'Postman-Token: 1489d60e-31fb-435b-8086-c2d123c4881f' -H 'cache-control: no-cache'

# auto clock out user
*/5 * * * * curl -X POST http://localhost:3004/api/attendance/v1/autoClockOutUser -H 'Content-Type: application/json' -H 'Postman-Token: 2c5dd23e-4f52-4da0-bbea-2ccc8b21e854' -H 'cache-control: no-cache' -d '{"clock_out" : true}'

# punch-outreminder
*/5 * * * * curl -X POST http://localhost:3004/api/attendance/reminderCron -H 'Content-Type: application/json' -H 'Postman-Token: 2c5dd23e-4f52-4da0-bbea-2ccc8b21e854' -H 'cache-control: no-cache' -d '{"clock_out" : true}'

# punch-in reminder
*/5 * * * * curl -X POST http://localhost:3004/api/attendance/reminderCron -H 'Content-Type: application/json' -H 'Postman-Token: 85581683-ae71-47d5-8ba7-b1fe6225139b'-H 'cache-control: no-cache'

```

## Frontend Deployment

#### Steps to deploy fugu-frontend on your server

Create a directory where you want to store your angular project (Ex. /var/www/angular)

```ssh 
mkdir /var/www/angular
```
Go to the project directory and clone the repo to your server
```ssh 
cd /var/www/angular
git clone https://github.com/jungleworks/fugu-frontend
```

Use npm to install all the required dependencies
```ssh 
cd /var/www/angular/fugu-frontend && npm i
```
Change the Angular version

```ssh
npm install --global @angular/cli@9.1.6
```

Edit the env files in src/environments directory (REQUIRED)
```ssh 
/var/www/angular/fugu-frontend/src/environment/environment.prod.ts

  FUGU_CONFERENCE_URL: 'https://meet.jit.si', // Deploy your own jitsi instance and change this url to yours
  FUGU_API_ENDPOINT: 'https://openapi.fuguchat.com/api/', // Change 'openapi.fuguchat.com' to the api pointing of your fugu-server
  SOCKET_ENDPOINT: 'https://openapi.fuguchat.com', // Change 'openapi.fuguchat.com' to the api pointing of your fugu-server
  ...
  BRANCH_KEY: '', // SignUp and create a new app on https://dashboard.branch.io/ and place your live branch key here
  ...
  GOOGLE_MAPS_KEY: '', // Place your Google Maps key here to use with attendance bot. Key needs access to 2 libraries - drawing & places
  GIF_API_KEY:'Create a GIPHY API Key', // Place your Giphy key here for sharing gifs in chats
  TRELLO_API_KEY: '', // Place a Trello API key to be used for trello integration
```

Edit the src/environments/environment.prod.ts and src/sw.js to add firebase configuration
- Register new account or to log in with existing account
- Once logged in, click on Add Project. Provide a project name, and other detaisl  and Create Project.
- Once the project has been created, it will automatically redirect to Firebase  dashboard screen
- Add project/application to the firebase project.
- After the project has been added go to Project Settings > General and select   CDN from SDK setup and configuration at the bottom of the page
-  Copy this object and add to your application
```sh
FIREBASE_CONFIG:{
    apiKey: '[PROJECT_API_KEY]',
    authDomain: '[PROJECT_AUTH_DOMAIN]',
    databaseURL: '[PROJECT_DB_URL]',
    projectId: '[PROJECT_ID]',
    storageBucket: '[STORAGE_BUCKET]',
    messagingSenderId: '[MESSAGE_ID]',
    appId: '[WEB_APP_ID]',
    measurementId: '[MEASUREMENT_ID]'
}
```
Now build your angular project
```sh
ng build --prod
```
To run your project in development mode use ng serve and navigate to http://localhost:4200

