import { jsonResponse, errorResponse, hashPassword } from '../utils';

export async function onRequestGet(context) {
    // Simple session check (mocked for now)
    return jsonResponse({ user: null });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { action, ...data } = await request.json();
        const db = env.DB;

        if (action === 'signup') {
            const { username, password, role, name, department, intro, emoji } = data;

            if (!username || !password || !role) {
                return errorResponse('아이디, 비밀번호, 역할은 필수 항목입니다.');
            }

            const password_hash = await hashPassword(password);
            const id = crypto.randomUUID();

            try {
                await db.prepare(
                    'INSERT INTO users (id, username, password_hash, role, name, department, intro, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                ).bind(id, username, password_hash, role, name || null, department || null, intro || null, emoji || null).run();

                return jsonResponse({ user: { id, username, role, name, department, intro, emoji } });
            } catch (e) {
                if (e.message.includes('UNIQUE')) {
                    return errorResponse('이미 존재하는 아이디입니다.');
                }
                throw e;
            }
        }

        if (action === 'login') {
            const { username, password } = data;
            const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

            if (!user) {
                return errorResponse('아이디 또는 비밀번호가 잘못되었습니다.', 401);
            }

            const input_hash = await hashPassword(password);
            if (user.password_hash !== input_hash) {
                return errorResponse('아이디 또는 비밀번호가 잘못되었습니다.', 401);
            }

            const { password_hash, ...safeUser } = user;
            return jsonResponse({ user: safeUser });
        }

        return errorResponse('Invalid action');
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
