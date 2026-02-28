/**
 * Generates global error handler middleware.
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — error middleware content
 */
export function generateErrorMiddleware(framework) {
    if (framework === 'express') {
        return `/**
 * Global error handler middleware for Express.
 * Catches all errors passed via next(error).
 */
export function errorHandler(err, req, res, _next) {
  console.error('\\x1b[31m[ERROR]\\x1b[0m', err.message);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.flatten?.() || err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: err.message,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
`;
    }

    return `/**
 * Global error handler for Fastify.
 * @param {import('fastify').FastifyInstance} fastify
 */
export function setupErrorHandler(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    console.error('\\x1b[31m[ERROR]\\x1b[0m', error.message);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return reply.status(401).send({
        error: 'Invalid token',
        message: error.message,
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        error: 'Token expired',
        message: error.message,
      });
    }

    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });
}
`;
}
