# # Separate builder stage to compile SASS, so we can copy just the resulting CSS files.
# FROM rubygem/compass AS builder
# COPY ./src/public /dist
# WORKDIR /dist
# RUN compass compile
# # Output: css/app.css
FROM node:16.17.0-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Defaults to production, docker-compose overrides this to development on build and run.
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY --chown=node:node . .

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# Install dependencies first, as they change less often than code.

RUN npm install -g npm@latest

ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && \
   npm ci --only=production; \
   rm -rf .npmrc

# # Copy compiled CSS styles from builder image.
# COPY --from=builder /dist/css ./dist/css

USER node
CMD [ "npm", "start" ]

EXPOSE 8070
