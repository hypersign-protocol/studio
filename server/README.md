## Server

### Pre-requisite

* You must setup the [core](https://github.com/hypersign-protocol/core) project before proceeding.
* Make sure you build the client project first. Follow instructions [here](../client/README.md#build) to build the client app.
* NPM and Node is required.

### Setup and Building

```bash
cd server
npm i
npm run setup // to setup env and database
npm run start  // to run the server
npm run dev // to run the server in dev env
```

The server runs on port `9000`. Please look into `.env` file to change paramaters. 

### Docker

#### Pull the image

```bash
docker pull hypersignprotocol/studio-server:<tag>
```


#### Building the image

```bash
docker build -t hypersignprotocol/studio-server:v1.0 .
```

#### Running the container

```bash
docker run \
    --env PORT=9000 \
    --env LOG_FILEPATH="../log/studio-server.log" \
    --env LOG_DIR="./log" \
    --env LOG_TIMESTAMP_FORMAT="YYYY-MM-DD HH:mm:ss.SSS" \
    --env LOG_LEVEL="debug" \
    --env DATABASE_FILEPATH="../db/studio-server.db" \
    --env JWT_SECRET="my\$ecreEtKeY@123" \
    --env NODE_SERVER_BASE_URL="http://core:5000/"  \
    --env NODE_SERVER_DID_CREATE_EP="api/did/create_tmp"  \
    --env MAIL_HOST=<mail host>  \
    --env MAIL_PORT=<mail port>  \
    --env MAIL_USERNAME=<mail emailid>  \
    --env MAIL_PASSWORD=<mail port>  \
    --env MAIL_NAME=Hypersign Admin  \
    -p 9000:9000 hypersignprotocol/studio-server:v1.0
```


