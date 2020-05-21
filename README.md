# Datahog Gateway

## Install

```
$ git clone ...
$ docker-compose build
$ docker-compose up
```

## Usage
```
$ curl --location --request POST 'http://localhost:3001' \
--header 'Content-Type: application/json' \
--data-raw '{"provider": "gas", "callbackUrl": "http://callback-server:3002"}'
```

## Test
```
$ docker-compose exec datahog-gateway npm test
```
