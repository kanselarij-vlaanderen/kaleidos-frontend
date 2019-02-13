FROM nginx:1.9.12

ARG EMBER_ENV=development

RUN apt-get update \
	&& apt-get install -y curl git bzip2 libfontconfig1-dev xz-utils

ENV NPM_CONFIG_LOGLEVEL info

ENV NODE_VERSION 10.8.0

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz"

RUN \
	npm install -g ember-cli@3.6.1

ADD package.json /tmp/client/

RUN cd /tmp/client && npm install 
ADD . /tmp/client
RUN cd /tmp/client && ember build --environment=${EMBER_ENV} && mv dist/* /usr/share/nginx/html/ && rm -rf /tmp/client
ADD nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8081
CMD /bin/bash -c "nginx -g 'daemon off;'"
