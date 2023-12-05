#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d intex.us-east-2.elasticbeanstalk.com --nginx --agree-tos --email nathanmoore101@gmail.com