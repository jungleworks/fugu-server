# Fugu Open Source

Fugu is an open source project developed by Jungleworks.

### Prerequisites needed to setup

Use AWS cloud provider to run the Fugu-OpenSource setup 


### Steps
- Login into the AWS account
- Go to the "Mumbai" region under the AWS.
- Click on the EC2 under AWS services and choose "AMI" in the left side bar.
- Find the "Public images" under AMI section “ami-024d2fddef02768cb” and then click on launch.
- Choose minimum instance type (t3a.medium)
- Next configure instance details (default preferably)
- Add storage (minimum 20GB) you would like to add to the instance
- Add tag that you want to keep with the name of the instance
- Create a security group and add inbound rules with ports 22, 443 and 3012 and outbound rule to be set will be 0.0.0.0/0
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

#### Changes

> Change URLs
```sh
vi /etc/nginx/conf.d/domain-name1.conf
vi /etc/nginx/conf.d/domain-name2.conf 
vi /etc/nginx/conf.d/pma.conf
```
> Create a directory where you want to store your node projects (Ex. /apps/node-apps)

```sh
service nginx restarts
service nginx status
```

### Change username and password in "production.json" under following paths

```sh
/apps/node-apps/fugu-server/attendance/configuration
/apps/node-apps/fugu-server/auth/config
/apps/node-apps/fugu-server/fuguchat/configuration
/apps/node-apps/fugu-server/scrumbot/configuration
```

#### Change urls inside the path provided below 
```sh
/apps/node-apps/fugu-server/fuguchat/configuration

"baseDomain": "domain name",
"frontEndUrl": "https://frontendurlname.com",
"socketBaseUrl": "https://backendbaseurl.com",
"ocBaseUrl": "https://backendbaseurl.com"
```

#### Reload pm2 instances
```sh
su - node
pm2 reload 0
pm2 reload 1
pm2 reload 2
pm2 reload 3
exit
```

