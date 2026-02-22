import { jsonResponse, errorResponse } from '../utils';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const db = env.DB;

    try {
        if (id) {
            const user = await db.prepare('SELECT id, username, role, name, department, intro, emoji FROM users WHERE id = ?').bind(id).first();
            if (!user) return errorResponse('User not found', 404);
            return jsonResponse(user);
        }

        // List all seniors (useful for juniors browsing)
        const seniors = await db.prepare('SELECT id, name, department, intro, emoji FROM users WHERE role = ?').bind('senior').all();
        return jsonResponse(seniors.results);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
