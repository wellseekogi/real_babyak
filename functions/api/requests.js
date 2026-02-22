import { jsonResponse, errorResponse } from '../utils';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'post' or 'senior'
    const id = url.searchParams.get('id');

    try {
        if (id && !type) {
            const request = await env.DB.prepare('SELECT * FROM requests WHERE id = ?').bind(id).first();
            return jsonResponse(request);
        }
        if (type === 'post') {
            const requests = await env.DB.prepare('SELECT * FROM requests WHERE post_id = ?').bind(id).all();
            return jsonResponse(requests.results);
        }
        if (type === 'junior') {
            const requests = await env.DB.prepare('SELECT * FROM requests WHERE junior_id = ?').bind(id).all();
            return jsonResponse(requests.results);
        }
        return jsonResponse([]);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { postId, juniorId, connectionNote } = await request.json();
        const id = crypto.randomUUID();

        await env.DB.prepare(
            'INSERT INTO requests (id, post_id, junior_id, status, connection_note) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, postId, juniorId, 'pending', connectionNote).run();

        return jsonResponse({ id, postId, juniorId, status: 'pending', connection_note: connectionNote });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

