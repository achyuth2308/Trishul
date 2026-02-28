/**
 * Parses an auth field value and returns the middleware stack.
 * @param {false|string} auth — the auth field value
 * @returns {{ middlewares: string[], imports: Set<string> }}
 */
export function parseAuth(auth) {
    const middlewares = [];
    const imports = new Set();

    if (auth === false || auth === undefined) {
        return { middlewares, imports };
    }

    if (auth === 'jwt') {
        middlewares.push('verifyToken');
        imports.add('verifyToken');
        return { middlewares, imports };
    }

    if (auth === 'apiKey') {
        middlewares.push('apiKeyCheck');
        imports.add('apiKeyCheck');
        return { middlewares, imports };
    }

    if (typeof auth === 'string' && auth.startsWith('role:')) {
        const role = auth.substring(5);
        middlewares.push('verifyToken');
        middlewares.push(`requireRole("${role}")`);
        imports.add('verifyToken');
        imports.add('requireRole');
        return { middlewares, imports };
    }

    return { middlewares, imports };
}

/**
 * Resolves the effective auth for an endpoint.
 * Endpoint-level auth ALWAYS overrides module-level auth.
 * @param {object} endpoint
 * @param {object} moduleDef
 * @returns {false|string}
 */
export function resolveAuth(endpoint, moduleDef) {
    if (endpoint.auth !== undefined) {
        return endpoint.auth;
    }
    if (moduleDef.auth !== undefined) {
        return moduleDef.auth;
    }
    return false;
}
