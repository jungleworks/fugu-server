#!/bin/bash
NODE_ENV=<ENV> PORT=PORT_NUMBER pm2 start /<PATH>/server.js --name fugu-chat -i 2;
sleep 2s;

