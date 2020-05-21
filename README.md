# Datahog Gateway

## Notes on my solution:

Trying my best to get this done within 3 hours, but realisitically coding somethign like this in the evenings
after spending 8 hours coding for my job during the day has been pretty challening. Everything is working, but there
are a few lose ends I haven't had the time to tie up:

- `npm test` does not run all the test files in the test dir, despire `recursive: true` being set in .mocharc.yml
- `test/unit/worker_runner_test.js` the failure spec does not work properly, needs fixing.
- Need to add validation on the server for the POST request payload

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
