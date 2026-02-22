import { jsonResponse, errorResponse } from '../utils';

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const seniorId = url.searchParams.get('seniorId');
    const id = url.searchParams.get('id');

    try {
        if (id) {
            const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
            if (post && post.tags) post.tags = JSON.parse(post.tags);
            return jsonResponse(post);
        }
        if (seniorId) {
            const posts = await env.DB.prepare('SELECT * FROM posts WHERE senior_id = ? ORDER BY created_at DESC').bind(seniorId).all();
            const results = posts.results.map(p => ({
                ...p,
                tags: JSON.parse(p.tags || '[]')
            }));
            return jsonResponse(results);
        }
        const posts = await env.DB.prepare('SELECT * FROM posts WHERE status = ? ORDER BY created_at DESC').bind('open').all();
        const results = posts.results.map(p => ({
            ...p,
            tags: JSON.parse(p.tags || '[]')
        }));
        return jsonResponse(results);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

export async function onRequestPost(context) {
    // Existing code ...
    const { request, env } = context;
    try {
        const data = await request.json();
        const { seniorId, title, description, tags } = data;
        const id = crypto.randomUUID();

        await env.DB.prepare(
            'INSERT INTO posts (id, senior_id, title, description, tags, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, seniorId, title, description, JSON.stringify(tags), 'open').run();

        return jsonResponse({ id, ...data });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

export async function onRequestPatch(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    try {
        const { status } = await request.json();
        await env.DB.prepare('UPDATE posts SET status = ? WHERE id = ?').bind(status, id).run();
        return jsonResponse({ success: true });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

export async function onRequestDelete(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    try {
        // Cleanup associated matches and requests first to avoid foreign key violations
        await env.DB.prepare('DELETE FROM matches WHERE post_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM requests WHERE post_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
