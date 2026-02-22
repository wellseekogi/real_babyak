export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export function errorResponse(message, status = 400) {
    return jsonResponse({ error: message }, status);
}

/**
 * Hash a password using PBKDF2 (Web Crypto API).
 * This is suitable for use in Cloudflare Workers.
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // We'll use a hardcoded salt for this demonstration/MVP. 
    // In a real production app, you'd use a unique salt per user and store it.
    const salt = encoder.encode('knu-meal-meetup-salt');

    const baseKey = await crypto.subtle.importKey(
        'raw',
        data,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    const hashBuffer = new Uint8Array(exportedKey);

    // Convert to hex string
    return Array.from(hashBuffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
