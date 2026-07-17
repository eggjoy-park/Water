const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Visitor-Id',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getVisitorId(request) {
  const headerId = request.headers.get('X-Visitor-Id');
  if (headerId) return headerId;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/visitor_id=([^;]+)/);
  return match ? match[1] : null;
}

function parseBody(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return { ok: true, data: null };

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    return { ok: false, data: null, error: 'Content-Type must be application/json' };
  }
  return request.json().then(data => ({ ok: true, data })).catch(() => ({ ok: false, data: null, error: 'Invalid JSON' }));
}

async function handlePosts(request, env) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM posts').first();
    const total = countResult?.total || 0;

    const { results } = await env.DB.prepare(
      `SELECT p.id, p.title, p.created_at, p.updated_at, p.like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
       FROM posts p
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return json({ posts: results, total, page, totalPages: Math.ceil(total / limit) });
  }

  if (request.method === 'POST') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { title, content, password } = body.data;
    if (!title || !content || !password) return error('제목, 내용, 비밀번호를 모두 입력해주세요.');

    const hashedPw = await hashPassword(password);

    const result = await env.DB.prepare(
      'INSERT INTO posts (title, content, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(title, content, hashedPw, now(), now()).run();

    return json({ id: result.meta.last_row_id, message: '글이 작성되었습니다.' }, 201);
  }

  return error('Method not allowed', 405);
}

async function handlePost(request, env, postId) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const { results: comments } = await env.DB.prepare(
      'SELECT id, post_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC'
    ).bind(postId).all();

    return json({ post, comments });
  }

  if (request.method === 'PUT') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { title, content, password } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare('SELECT password FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);
    if (post.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare(
      "UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = ? WHERE id = ?"
    ).bind(title || null, content || null, now(), postId).run();

    return json({ message: '글이 수정되었습니다.' });
  }

  if (request.method === 'DELETE') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { password } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare('SELECT password FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);
    if (post.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(postId).run();
    await env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(postId).run();
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

    return json({ message: '글이 삭제되었습니다.' });
  }

  return error('Method not allowed', 405);
}

async function handleComments(request, env, postId) {
  if (request.method === 'POST') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { content, password } = body.data;
    if (!content || !password) return error('내용과 비밀번호를 입력해주세요.');

    const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO comments (post_id, content, password, created_at) VALUES (?, ?, ?, ?)'
    ).bind(postId, content, hashedPw, now()).run();

    return json({ id: result.meta.last_row_id, message: '댓글이 작성되었습니다.' }, 201);
  }

  return error('Method not allowed', 405);
}

async function handleCommentDelete(request, env, postId, commentId) {
  if (request.method === 'DELETE') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { password } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const comment = await env.DB.prepare(
      'SELECT password FROM comments WHERE id = ? AND post_id = ?'
    ).bind(commentId, postId).first();
    if (!comment) return error('댓글을 찾을 수 없습니다.', 404);
    if (comment.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();

    return json({ message: '댓글이 삭제되었습니다.' });
  }

  return error('Method not allowed', 405);
}

async function handleLike(request, env, postId) {
  if (request.method === 'POST') {
    const visitorId = getVisitorId(request);
    if (!visitorId) return error('방문자 정보가 없습니다.', 400);

    const post = await env.DB.prepare('SELECT id, like_count FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const existing = await env.DB.prepare(
      'SELECT 1 FROM likes WHERE post_id = ? AND visitor_id = ?'
    ).bind(postId, visitorId).first();

    if (existing) {
      await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND visitor_id = ?').bind(postId, visitorId).run();
      await env.DB.prepare('UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?').bind(postId).run();
      const updated = await env.DB.prepare('SELECT like_count FROM posts WHERE id = ?').bind(postId).first();
      return json({ liked: false, like_count: updated.like_count });
    } else {
      await env.DB.prepare('INSERT INTO likes (post_id, visitor_id) VALUES (?, ?)').bind(postId, visitorId).run();
      await env.DB.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').bind(postId).run();
      const updated = await env.DB.prepare('SELECT like_count FROM posts WHERE id = ?').bind(postId).first();
      return json({ liked: true, like_count: updated.like_count });
    }
  }

  return error('Method not allowed', 405);
}

async function handleLikeStatus(request, env, postId) {
  const visitorId = getVisitorId(request);
  const liked = visitorId ? !!(await env.DB.prepare('SELECT 1 FROM likes WHERE post_id = ? AND visitor_id = ?').bind(postId, visitorId).first()) : false;
  const post = await env.DB.prepare('SELECT like_count FROM posts WHERE id = ?').bind(postId).first();
  return json({ liked, like_count: post?.like_count || 0 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Ensure visitor_id cookie
    const visitorId = getVisitorId(request);
    let setCookieHeader = null;
    if (!visitorId) {
      const newId = crypto.randomUUID();
      setCookieHeader = `visitor_id=${newId}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }

    try {
      let response;

      // Route: /api/posts
      if (url.pathname === '/api/posts') {
        response = await handlePosts(request, env);
      }
      // Route: /api/posts/:id
      else if (url.pathname.match(/^\/api\/posts\/(\d+)$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)$/)[1]);
        response = await handlePost(request, env, postId);
      }
      // Route: /api/posts/:id/comments
      else if (url.pathname.match(/^\/api\/posts\/(\d+)\/comments$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)\/comments$/)[1]);
        response = await handleComments(request, env, postId);
      }
      // Route: /api/posts/:id/comments/:cid
      else if (url.pathname.match(/^\/api\/posts\/(\d+)\/comments\/(\d+)$/)) {
        const match = url.pathname.match(/^\/api\/posts\/(\d+)\/comments\/(\d+)$/);
        response = await handleCommentDelete(request, env, parseInt(match[1]), parseInt(match[2]));
      }
      // Route: /api/posts/:id/like
      else if (url.pathname.match(/^\/api\/posts\/(\d+)\/like$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)\/like$/)[1]);
        if (request.method === 'GET') {
          response = await handleLikeStatus(request, env, postId);
        } else {
          response = await handleLike(request, env, postId);
        }
      }
      else {
        return error('Not found', 404);
      }

      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader);
      }

      return response;
    } catch (err) {
      console.error(err);
      return error('Internal server error', 500);
    }
  },
};
