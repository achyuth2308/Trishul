/**
 * Generates named axios API functions from client definitions.
 * Groups functions by module (inferred from URL prefix).
 * @param {Array} clientDefs — array of endpoint definitions
 * @returns {Map<string, string>} — map of moduleName → file content
 */
export function generateAxiosClient(clientDefs) {
    // Group endpoints by module (first URL segment)
    const modules = new Map();

    for (const def of clientDefs) {
        const moduleName = getModuleName(def.url);
        if (!modules.has(moduleName)) {
            modules.set(moduleName, []);
        }
        modules.get(moduleName).push(def);
    }

    const files = new Map();

    for (const [moduleName, endpoints] of modules) {
        let code = `import axiosInstance from '../axiosInstance.js';\n\n`;

        for (const ep of endpoints) {
            code += generateFunction(ep);
        }

        files.set(moduleName, code);
    }

    return files;
}

function generateFunction(ep) {
    const { name, method, url, payload, response, auth } = ep;
    const payloadKeys = Object.keys(payload || {});
    const responseKeys = Object.keys(response || {});
    const params = (url.match(/:(\w+)/g) || []).map((p) => p.slice(1));
    const needsAuth = auth && auth !== false;

    // Build JSDoc
    let code = `/**\n`;
    code += ` * ${method} ${url}\n`;

    const allParams = [...params];
    if (['POST', 'PUT', 'PATCH'].includes(method) && payloadKeys.length) {
        allParams.push('data');
    }
    if (needsAuth) {
        allParams.push('token');
    }

    if (params.length) {
        for (const p of params) {
            code += ` * @param {string} ${p} — URL parameter\n`;
        }
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && payloadKeys.length) {
        code += ` * @param {Object} data — ${JSON.stringify(payload)}\n`;
    }
    if (needsAuth) {
        code += ` * @param {string} [token] — Bearer token (optional if stored)\n`;
    }
    code += ` * @returns {Promise<${JSON.stringify(response)}>}\n`;
    code += ` */\n`;

    // Build function
    const funcParams = allParams.length ? `{ ${allParams.join(', ')} }` : '';
    code += `export async function ${name}(${funcParams}) {\n`;

    // Replace URL params
    let resolvedUrl = url;
    for (const p of params) {
        resolvedUrl = resolvedUrl.replace(`:${p}`, `\${${p}}`);
    }

    // Headers for auth
    if (needsAuth) {
        code += `  const headers = {};\n`;
        code += `  if (token) {\n`;
        code += `    headers.Authorization = \`Bearer \${token}\`;\n`;
        code += `  }\n\n`;
    }

    const headerArg = needsAuth ? ', { headers }' : '';
    const methodLower = method.toLowerCase();

    if (['post', 'put', 'patch'].includes(methodLower)) {
        const dataArg = payloadKeys.length ? 'data' : '{}';
        if (needsAuth) {
            code += `  const response = await axiosInstance.${methodLower}(\`${resolvedUrl}\`, ${dataArg}, { headers });\n`;
        } else {
            code += `  const response = await axiosInstance.${methodLower}(\`${resolvedUrl}\`, ${dataArg});\n`;
        }
    } else {
        code += `  const response = await axiosInstance.${methodLower}(\`${resolvedUrl}\`${headerArg});\n`;
    }

    code += `  return response.data;\n`;
    code += `}\n\n`;

    return code;
}

function getModuleName(url) {
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 0) return 'api';
    // Use first real segment, remove trailing 's' for conventional naming
    const first = segments[0];
    return first.endsWith('s') ? first.slice(0, -1) : first;
}
