export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || 'Something went wrong. Please try again.' });
}
