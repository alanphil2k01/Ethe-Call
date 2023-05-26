# Ethe-Call

## Development
### Start socket.io server
```sh
yarn build:server
yarn start:server
```
### Running Next.js app
```sh
yarn dev:web
```
### Running smart contract in local hardhat node
Start hardhat node in one terminal by:-
```sh
yarn hh:node
```
In another terminal deploy the contract by:-
```sh
yarn hh:deploy
```

## Production
### Run socket.io server using docker
```sh
docker build -t ethe-call .
docker run -d --rm --name ethe-call \
    -p 80:80 \
    -p 443:443 \
    -e HTTPS="yes" \
    -e HTTP_PORT=80 \
    -e HTTPS_PORT=443 \
    -e NODE_ENV="production" \
    -e CERT_DIR="/cert" \
    -v "./cert:/cert" \
    ethe-call
```

### Deploy Next.js app to GCP App Engine
```sh
yarn deploy:gcp
```

### Deploy smart contract to Sepolia
```sh
yarn deploy:contract
```
