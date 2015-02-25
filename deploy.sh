scp -r ./public/* yanlong.li@192.168.10.9:/var/www/html/wifi-vis/
ssh yanlong.li@192.168.10.9 "uptime; chmod -R a+r /var/www/html/wifi-vis/; uptime;"
