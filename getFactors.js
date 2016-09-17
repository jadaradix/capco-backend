"use strict";

const ueber = require("ueber");

// [ { name: 'mondo', count: 180, spend: -1666899 },
//   { name: 'holidays', count: 85, spend: 272579 },
//   { name: 'eating_out', count: 401, spend: 511493 },
//   { name: 'groceries', count: 156, spend: 215243 },
//   { name: 'cash', count: 9, spend: 33000 },
//   { name: 'entertainment', count: 105, spend: 306130 },
//   { name: 'transport', count: 120, spend: 61070 },
//   { name: 'general', count: 78, spend: 113223 },
//   { name: 'bills', count: 28, spend: 14348 },
//   { name: 'shopping', count: 31, spend: 89605 },
//   { name: 'expenses', count: 37, spend: 60146 } ]

const noSpend = {
  "name": "dont-care",
  "count": 0,
  "spend": 0
};

const factors = {


  "protector": (categories) => {

    let sum1 = 
      (categories.find(category => (category.name === "bills")) || noSpend).spend
      +
      (categories.find(category => (category.name === "groceries")) || noSpend).spend
      +
      (categories.find(category => (category.name === "transport")) || noSpend).spend;

    let sum2 = 
      (categories.find(category => (category.name === "eating_out")) || noSpend).spend
      +
      (categories.find(category => (category.name === "entertainment")) || noSpend).spend
      +
      (categories.find(category => (category.name === "shopping")) || noSpend).spend;

    let r;
    if (sum1 === 0) {
      r = 0;
    } else {
      r = (sum1 - sum2) / sum1;
    }
    if (r < 0) r = 0;

    return {
      "name": "Protector",
      "percent": Math.floor(r * 100)
    };

  },


  "planner": (categories) => {

    let r = 0;
    return {
      "name": "planner",
      "percent": Math.floor(r * 100)
    };

  },


  "pleaser": (categories) => {

    let sum1 = 
      (categories.find(category => (category.name === "eating_out")) || noSpend).spend
      +
      (categories.find(category => (category.name === "shopping")) || noSpend).spend
      +
      (categories.find(category => (category.name === "entertainment")) || noSpend).spend
      +
      (categories.find(category => (category.name === "holidays")) || noSpend).spend;

    let sum2 = 0;
    categories.forEach(category => {
      sum2 += category.spend;
    });

    let r;
    if (sum1 === 0) {
      r = 0;
    } else {
      r = sum1 / sum2;
    }
    if (r < 0) r = 0;

    return {
      "name": "Protector",
      "percent": Math.floor(r * 100)
    };

  },


  "player": (categories) => {

    let sum1 = 
      (categories.find(category => (category.name === "eating_out")) || noSpend).count
      +
      (categories.find(category => (category.name === "shopping")) || noSpend).count
      +
      (categories.find(category => (category.name === "entertainment")) || noSpend).count
      +
      (categories.find(category => (category.name === "holidays")) || noSpend).count;

    let sum2 = 0;
    categories.forEach(category => {
      sum2 += category.count;
    });

    let r;
    if (sum1 === 0) {
      r = 0;
    } else {
      r = sum1 / sum2;
    }
    if (r < 0) r = 0;

    return {
      "name": "Player",
      "percent": Math.floor(r * 100)
    };

  }


};

const getFactors = function getFactors (transactions, callback) {
  let categories = [];
  transactions.forEach((transaction) => {
    if (transaction.category === "mondo") return;
    let existingCategory = categories.find(category => (category.name === transaction.category));
    if (!existingCategory) {
      categories.push({
        "name": transaction.category,
        "count": 1,
        "spend": transaction.amount * -1
      });
    } else {
      existingCategory.count++;
      existingCategory.spend += (transaction.amount * -1);
    }
  });
  let results = Object.keys(factors).map((factorKey) => {
    return factors[factorKey](categories);
  });
  results = ueber.sortByKey(results, "percent", true);
  return callback(false, results);
};

module.exports = getFactors;