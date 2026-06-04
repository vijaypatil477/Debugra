module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Strip sensitive request config and request objects from Axios/HTTP errors to prevent leaking keys/headers
  if (err.config) {
    delete err.config;
  }
  if (err.request) {
    delete err.request;
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
