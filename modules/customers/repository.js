const Repository = require("../../core/db/repository");

module.exports = (store) => new Repository(store, "customers");
