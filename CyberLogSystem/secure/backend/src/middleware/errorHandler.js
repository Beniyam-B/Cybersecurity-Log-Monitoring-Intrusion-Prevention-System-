const { StatusCodes } = require('http-status-codes')

module.exports = function errorHandler(err, req, res, next) {
  /* eslint-disable no-console */
  if (process.env.NODE_ENV !== 'test') {
    console.error(err)
  }

  const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ message })
}

