"use strict";

const async = require("async");
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
          "transactions": _.sampleSize(testTransactions, 20)
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
      "accessToken": accessToken,
      "factors": factors
    }
    profiles.push(profile);
    resource.send(profile);
    return next();
  });
});

server.get("/:accessToken/matches", (request, resource, next) => {
  let accessToken = request.params.accessToken;
  let profile = profiles.find(profile => (profile.accessToken === accessToken));
  if (!profile) {
    resource.status(500);
    resource.send(`No profile found - you are cheating`);
    return next();
  }
  let matches = profiles.filter(potentialMatch => {
    // matching with yourself is creepy
    if (potentialMatch.accessToken === accessToken) return false;
    return true;
  });
  resource.send(matches);
  return next();
});

//
// GO
//
server.listen(PORT, function () {
  console.log("Listening on port %s.", PORT);
});