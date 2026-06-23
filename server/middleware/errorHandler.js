module.exports = (err, req, res, next) => {
  console.error('âŒ Error:', err.stack || err.message);
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  const message = (status >= 400 && status < 500) || isDev
    ? (err.message || 'Internal server error')
    : 'Internal server error';

  res.status(status).json({
    error: message,
    ...(isDev && { stack: err.stack }),
  });
};
