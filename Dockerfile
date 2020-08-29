FROM node:14.4.0-slim

RUN apt-get update -y && apt-get upgrade -y

RUN apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/lighthouse-exporter/

COPY package.json package-lock.json /opt/lighthouse-exporter/
RUN npm ci

COPY main.js /opt/lighthouse-exporter/main.js

RUN echo 'lighthouse-exporter:x:60000:60000::/nonexistent:/usr/sbin/nologin' >> /etc/passwd
RUN echo 'lighthouse-exporter:x:60000:' >> /etc/group
USER lighthouse-exporter

ENTRYPOINT ["node", "/opt/lighthouse-exporter/main.js"]
