

git:
	git push -u github yanlong.li

bb:
	git push -u origin yanlong.li

wifivis:
	git push -u origin wifi-vis
	git push -u github wifi-vis

deploy:
	scp -r ./public/* yanlong.li@192.168.10.9:/var/www/html/wifi-vis/
	ssh yanlong.li@192.168.10.9 "uptime; chmod -R a+r /var/www/html/wifi-vis/; uptime;"
