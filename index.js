"use strict";

const async = require("async");
const ueber = require("ueber");
const _ = require("lodash");
const getFactors = require("./getFactors.js");

const TEST_MODE = true;
const testTransactions = require("./test-transactions.json");

let profiles = [];

const PORT = 8080;

//
// GET READY
//
const restify = require("restify");
const server = restify.createServer();
server.use(
  function crossOrigin (req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);
server.use(restify.queryParser());

//
// MONZO
//
const mondo = require("mondo-bank");
const MONDO_CLIENT_ID = process.env.MONDO_CLIENT_ID || "";
const MONDO_CLIENT_SECRET = process.env.MONDO_CLIENT_SECRET || "";

server.get("/:accessToken/profile", (request, resource, next) => {
  console.log("XXX");
  let accessToken = request.params.accessToken;
  let name = request.query.name;
  async.waterfall([
    (next) => {
      return mondo.accounts(accessToken, (err, accounts) => {
        if (err) return next(err);
        return next(false, accounts.accounts[0].id);
      });
    },
    (accountId, next) => {
      if (TEST_MODE === true) {
        return next(false, {
          "transactions": _.sampleSize(testTransactions, 100)
        });
      } else {
        return mondo.transactions(accountId, accessToken, next);
      }
    },
    (transactions, next) => {
      return getFactors(transactions.transactions, next);
    }
  ], (err, factors) => {
    if (err) {
      resource.status(500);
      resource.send(`Failed (${err}). Sorry.`);
      return next();
    }
    let profile = {
      "name": name,
      "id": `${accessToken}-${name}`,
      "accessToken": accessToken,
      "factors": factors
    }
    profiles.push(profile);
    resource.send(profile);
    return next();
  });
});

server.get("/:accessTokenName/matches", (request, resource, next) => {
  let accessTokenName = request.params.accessTokenName;
  let profile = profiles.find(profile => (profile.id === accessTokenName));
  if (!profile) {
    resource.status(500);
    resource.send(`No profile found - you are cheating`);
    return next();
  }
  let matches = profiles.filter(potentialMatch => {
    // matching with yourself is creepy
    return (potentialMatch.id !== accessTokenName);
  });
  matches = matches.map(eachProfile => {
    let lowestFactorDiff = 100000;
    profile.factors.forEach(profileFactor => {
      let x = Math.abs(profileFactor.percent - eachProfile.factors.find(factor => (factor.name === profileFactor.name)).percent)
      if (x < lowestFactorDiff) lowestFactorDiff = x;
    });
    return Object.assign(eachProfile, {
      "strength": Math.random()
    });
  });
  matches = ueber.sortByKey(matches, "strength");
  resource.send(matches);
  return next();
});

//
// GO
//
server.listen(PORT, function () {
  console.log("Listening on port %s.", PORT);
});