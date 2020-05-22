# Datahog Gateway

## Notes on my solution:

I'm not sure if we were expected to code a background job processor from scratch but it says "Only use tools and frameworks you are familiar with!" and although I have a lot of experience with background jobs, most of that experience is in other languages and frameworks. I have not used any npm packages for background processing ,so I decided to roll my own. It was quite a challenge to complete all that within 3 hours, I'm sure I used more time than that but I was also doing it in the evenings after working during the day so please keep that in mind! The majority of my time was spent on coding the job queue processor which meant I didn't have as much time to really think about the best way to test this, and to get a complete test coverage, to think about the API format etc. Also my git commits are also not as methodical as they usually.

## Install

```
$ git clone git@github.com:evanrolfe/wonderbill-datahog.git
$ cd wonderbill-datahog
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
