module.exports = ({ preloader, logger }) => {

  logger.info('Start');

  return preloader.loadAllTables()
    .then(() => logger.info('Done'));
};
