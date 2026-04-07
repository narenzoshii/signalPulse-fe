#!/usr/bin/env sh
find '/usr/share/nginx/html' -name 'main-*.js' -exec sed -i -e 's,BACKEND_ENDPOINT,'"$BACKEND_ENDPOINT"',g' {} \;
nginx -g "daemon off;"
