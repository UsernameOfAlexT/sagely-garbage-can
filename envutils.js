'use strict';
/**
 * A single point of truth for deciding env related variables
 */
// TODO move other process.env.* things into this, export as an object
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3
};
const setup = () => {
  try {
    require('dotenv').config(); // TODO consider preloading this
    console.log('dotenv found. loading from .env');
  } catch(e) {
    console.info('dotenv not found. Environment variables should be set by other methods');
  }
};

// TODO refactor uses to use general logger instead
const useDetailedLogging = () => shouldLog("verbose");
const shouldLog = (level) => 
  LOG_LEVELS[process.env.LOGGING_LEVEL] >= LOG_LEVELS[level];

module.exports = exports = {setup, useDetailedLogging};
