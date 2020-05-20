# Summary #
At WonderBill we do a lot of data collection and processing from 3rd-party APIs.
We also experience various issues with those APIs - long scheduled maintenance, temporary bad gateway errors due to load etc.
In order to make our data collection tools scalable and fault-tolerant we've devised a webhook-based asynchronous approach. 

## Task at hand ##
We would like you to build a webhook-based API, which accepts a POST payload with the name of the provder to collect the data from ("gas" or "internet"), and a publicly accessible endpoint to call back, once the data for the provider is collected.

## Pre-requisites ##
Before you start you should run:
```
npm install && npm run start
```
This will provide you with a running server, that provides the mock "gas" (`http://localhost:3000/providers/gas`) and "internet" (`http://localhost:3000/providers/internet`) endpoints you will be collecting the data from.

When you attempt to load the endpoints in Postman or even just `curl` them you will see an occasional `500` error - this is intended to simulate outages with our data providers. You will have to work around this and provide a fault-tolerant way of fetching the data as part of completing this task.

## Requirements ##
**_Only use tools and frameworks you are familiar with!_**

**_As our data providers can go offline for extended period of time, the naive implementations of this task using retry mechanisms are not going to be accepted!_**

* Build an API endpoint using Node.js (the likes of Express and Hapi are perfect for this job). You can use TypeScript if you wish;
* The API should accept a POST with two fields `provider` (`gas` or `internet`) and the `callbackUrl`. The payload should be validated accordingly;
* Once payload is accepted, collect the data from the mock endpoint described previously and call the `callbackUrl` with the collected data;
* Use Git whilst working on this task - this will help us understanding how you work;
* Use docker-compose to bootstrap other services you may need to complete the task;
* We expect decent test coverage for the code produced.

## Bonus points ##
* Implemented API endpoint in a self-documented way;
* Consider accepting a payload with multiple providers to collect data from, aggregate from all providers before sending back to the `callbackUrl`;
* Consider `callbackUrl` also being a point of failure.

## Submission ##
Please provide a URL to a github/bitbucket repository for the completed task.

### 🙏🙏THANK YOU FOR YOUR TIME AND EFFORT! 🙏🙏 ###