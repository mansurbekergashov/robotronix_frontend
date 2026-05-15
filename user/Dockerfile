FROM nginx:1.27-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets
COPY src /usr/share/nginx/html/src
# public/ files are referenced with absolute paths (/robologo.png, /default-image.svg)
# so copy contents directly to html root, not as a public/ subdirectory
COPY public/ /usr/share/nginx/html/
# nginx Docker image processes /etc/nginx/templates/*.template with envsubst
# at container start — ${BACKEND_URL} and ${BACKEND_WS_URL} are substituted
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1
