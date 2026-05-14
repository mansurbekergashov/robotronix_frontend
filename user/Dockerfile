FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets
COPY src /usr/share/nginx/html/src
COPY public /usr/share/nginx/html/public
# nginx Docker image processes /etc/nginx/templates/*.template with envsubst
# at container start — ${BACKEND_URL} and ${BACKEND_WS_URL} are substituted
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
