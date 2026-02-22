import { jsonResponse, errorResponse } from '../utils';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const db = env.DB;

    try {
        if (id && !type) {
            const match = await db.prepare('SELECT * FROM matches WHERE id = ?').bind(id).first();
            if (!match) return errorResponse('Match not found', 404);

            // Parse JSON fields
            return jsonResponse({
                ...match,
                senior_timetable: JSON.parse(match.senior_timetable || '[]'),
                junior_timetable: JSON.parse(match.junior_timetable || '[]'),
                senior_location: JSON.parse(match.senior_location || 'null'),
                junior_location: JSON.parse(match.junior_location || 'null'),
                confirmed_time: JSON.parse(match.confirmed_time || 'null'),
                confirmed_location: JSON.parse(match.confirmed_location || 'null'),
                selected_restaurant: JSON.parse(match.selected_restaurant || 'null')
            });
        }

        if (type === 'request' && id) {
            const matches = await db.prepare('SELECT * FROM matches WHERE request_id = ?').bind(id).all();
            return jsonResponse(matches.results.map(m => ({
                ...m,
                senior_timetable: JSON.parse(m.senior_timetable || '[]'),
                junior_timetable: JSON.parse(m.junior_timetable || '[]'),
                senior_location: JSON.parse(m.senior_location || 'null'),
                junior_location: JSON.parse(m.junior_location || 'null'),
                confirmed_time: JSON.parse(m.confirmed_time || 'null'),
                confirmed_location: JSON.parse(m.confirmed_location || 'null'),
                selected_restaurant: JSON.parse(m.selected_restaurant || 'null')
            })));
        }

        if (type === 'post' && id) {
            const matches = await db.prepare('SELECT * FROM matches WHERE post_id = ?').bind(id).all();
            return jsonResponse(matches.results.map(m => ({
                ...m,
                senior_timetable: JSON.parse(m.senior_timetable || '[]'),
                junior_timetable: JSON.parse(m.junior_timetable || '[]'),
                senior_location: JSON.parse(m.senior_location || 'null'),
                junior_location: JSON.parse(m.junior_location || 'null'),
                confirmed_time: JSON.parse(m.confirmed_time || 'null'),
                confirmed_location: JSON.parse(m.confirmed_location || 'null'),
                selected_restaurant: JSON.parse(m.selected_restaurant || 'null')
            })));
        }

        return errorResponse('Invalid query');
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

export async function onRequestPatch(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const db = env.DB;

    try {
        const data = await request.json();
        const { senior_timetable, junior_timetable, senior_location, junior_location, confirmed_time, confirmed_location, status } = data;

        const updates = [];
        const params = [];

        if (senior_timetable !== undefined) {
            updates.push('senior_timetable = ?');
            params.push(JSON.stringify(senior_timetable));
        }
        if (junior_timetable !== undefined) {
            updates.push('junior_timetable = ?');
            params.push(JSON.stringify(junior_timetable));
        }
        if (senior_location !== undefined) {
            updates.push('senior_location = ?');
            params.push(JSON.stringify(senior_location));
        }
        if (junior_location !== undefined) {
            updates.push('junior_location = ?');
            params.push(JSON.stringify(junior_location));
        }
        if (confirmed_time !== undefined) {
            updates.push('confirmed_time = ?');
            params.push(JSON.stringify(confirmed_time));
        }
        if (confirmed_location !== undefined) {
            updates.push('confirmed_location = ?');
            params.push(JSON.stringify(confirmed_location));
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) return errorResponse('No updates provided');

        params.push(id);
        await db.prepare(`UPDATE matches SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

        return jsonResponse({ success: true });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const requestId = url.searchParams.get('requestId');
    const db = env.DB;

    try {
        // 1. Get the request
        const req = await db.prepare('SELECT * FROM requests WHERE id = ?').bind(requestId).first();
        if (!req) return errorResponse('Request not found', 404);

        // 2. Update request status
        await db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('accepted', requestId).run();

        // 3. Create match
        const matchId = crypto.randomUUID();
        await db.prepare(
            'INSERT INTO matches (id, post_id, request_id, status, senior_timetable, junior_timetable) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(matchId, req.post_id, requestId, 'coordinating', '[]', '[]').run();

        return jsonResponse({ id: matchId, status: 'coordinating' });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
