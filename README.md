# Datahog Gateway

## Notes on my solution:

There are two WorkerRunners for each provider (gas and internet). Effectively these are two job queues. Each WorkerRunner can be in either a state of "up" or "down". The WorkerRunner starts of in state "up", and if the provider returns a "#fail" response, it puts it into state "down". If the provider continues to respond with "#fail" then it leaves it in the down state, but if returns a succesful response then it goes back to the up state again. The behaviour for each state is this:

- up state: process jobs concurrently, depending on the maxConcurrency parameter
- down state: process jobs one-at-a-time, with 1 sec interval between jobs, if a job succeeds then go back to the up state

## Install

```
$ git clone git@github.com:evanrolfe/wonderbill-datahog.git
$ docker-compose build
$ docker-compose up
```

## Usage
```
$ curl --location --request POST 'http://localhost:3001' \
--header 'Content-Type: application/json' \
--data-raw '{"provider": "gas", "callbackUrl": "http://callback-server:3002"}'
```

## Example Response:
```
{
  "job": {
    "id":"8746ea4d-85ea-4e93-8207-40f8352020cd",
    "state":"queued"
  },
  "provider_state":"up"
}
```

## Test
```
$ docker-compose exec datahog-gateway npm test
```
