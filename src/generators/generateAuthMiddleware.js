/**
 * Generates auth middleware files.
 * @param {string} framework — "express" or "fastify"
 * @returns {{ verifyToken: string, requireRole: string, apiKeyCheck: string }}
 */
export function generateAuthMiddleware(framework) {
    return {
        verifyToken: generateVerifyToken(framework),
        requireRole: generateRequireRole(framework),
        apiKeyCheck: generateApiKeyCheck(framework),
    };
}

function generateVerifyToken(framework) {
    if (framework === 'express') {
        return `import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT verification middleware.
 * Extracts Bearer token from Authorization header,
 * verifies it using JWT_SECRET, and attaches decoded
 * payload to req.user.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
      message: 'Include a Bearer token in the Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;

    // TODO: Add any custom claims validation here
    // e.g., check if user is active, check token version, etc.

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
      message: error.message,
    });
  }
}
`;
    }

    return `import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT verification hook for Fastify.
 * Extracts Bearer token from Authorization header,
 * verifies it using JWT_SECRET, and attaches decoded
 * payload to request.user.
 */
export async function verifyToken(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      error: 'Access denied. No token provided.',
      message: 'Include a Bearer token in the Authorization header.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    request.user = decoded;

    // TODO: Add any custom claims validation here
    // e.g., check if user is active, check token version, etc.
  } catch (error) {
    reply.code(401).send({
      error: 'Invalid or expired token.',
      message: error.message,
    });
  }
}
`;
}

function generateRequireRole(framework) {
    if (framework === 'express') {
        return `/**
 * Role guard middleware factory.
 * Returns middleware that checks req.user.role against required role.
 *
 * @param {string} role — required role (e.g. "admin", "user")
 * @returns {Function} — Express middleware
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required before role check.',
      });
    }

    // TODO: Customize role hierarchy logic here
    // e.g., admin might have access to "user" routes too

    if (req.user.role !== role) {
      return res.status(403).json({
        error: \`Access denied. Required role: \${role}.\`,
        message: \`Your role "\${req.user.role || 'none'}" does not have sufficient permissions.\`,
      });
    }

    next();
  };
}
`;
    }

    return `/**
 * Role guard hook factory for Fastify.
 * Returns a preHandler that checks request.user.role
 * against required role.
 *
 * @param {string} role — required role (e.g. "admin", "user")
 * @returns {Function} — Fastify preHandler
 */
export function requireRole(role) {
  return async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({
        error: 'Authentication required before role check.',
      });
      return;
    }

    // TODO: Customize role hierarchy logic here
    // e.g., admin might have access to "user" routes too

    if (request.user.role !== role) {
      reply.code(403).send({
        error: \`Access denied. Required role: \${role}.\`,
        message: \`Your role "\${request.user.role || 'none'}" does not have sufficient permissions.\`,
      });
    }
  };
}
`;
}

function generateApiKeyCheck(framework) {
    if (framework === 'express') {
        return `import { env } from '../config/env.js';

/**
 * API Key verification middleware.
 * Checks x-api-key header against API_KEY from env.
 */
export function apiKeyCheck(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required.',
      message: 'Include an x-api-key header in your request.',
    });
  }

  if (apiKey !== env.API_KEY) {
    return res.status(401).json({
      error: 'Invalid API key.',
    });
  }

  next();
}
`;
    }

    return `import { env } from '../config/env.js';

/**
 * API Key verification hook for Fastify.
 * Checks x-api-key header against API_KEY from env.
 */
export async function apiKeyCheck(request, reply) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey) {
    reply.code(401).send({
      error: 'API key required.',
      message: 'Include an x-api-key header in your request.',
    });
    return;
  }

  if (apiKey !== env.API_KEY) {
    reply.code(401).send({
      error: 'Invalid API key.',
    });
  }
}
`;
}
