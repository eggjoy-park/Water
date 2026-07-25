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
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseBody(request) {
  return request.json().then(data => ({ ok: true, data })).catch(() => ({ ok: false, error: 'Invalid JSON' }));
}

function getVisitorId(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/visitor_id=([^;]+)/);
  return match ? match[1] : request.headers.get('X-Visitor-Id') || null;
}

async function handleGalleryPosts(request, env) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 12;
    const offset = (page - 1) * limit;

    const totalResult = await env.DB.prepare('SELECT COUNT(*) as count FROM gallery_posts').first();
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const { results: posts } = await env.DB.prepare(
      'SELECT id, title, content, image_url, created_at, like_count, (SELECT COUNT(*) FROM gallery_comments WHERE post_id = gallery_posts.id) as comment_count FROM gallery_posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();

    return json({ posts, total, totalPages, page });
  }

  if (request.method === 'POST') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { title, content, password, image_url } = body.data;
    if (!title || !content || !password) return error('제목, 내용, 비밀번호를 모두 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO gallery_posts (title, content, password, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(title, content, hashedPw, image_url || null, now(), now()).run();

    return json({ id: result.meta.last_row_id, message: '갤러리 글이 작성되었습니다.' }, 201);
  }

  return error('Method not allowed', 405);
}

async function handleGalleryPost(request, env, postId) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const post = await env.DB.prepare('SELECT * FROM gallery_posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const { results: comments } = await env.DB.prepare(
      'SELECT id, post_id, content, created_at FROM gallery_comments WHERE post_id = ? ORDER BY created_at ASC'
    ).bind(postId).all();

    return json({ post, comments });
  }

  if (request.method === 'PUT') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { title, content, password, image_url } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare('SELECT password FROM gallery_posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);
    if (post.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare(
      "UPDATE gallery_posts SET title = COALESCE(?, title), content = COALESCE(?, content), image_url = COALESCE(?, image_url), updated_at = ? WHERE id = ?"
    ).bind(title || null, content || null, image_url || null, now(), postId).run();

    return json({ message: '글이 수정되었습니다.' });
  }

  if (request.method === 'DELETE') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { password } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare('SELECT password FROM gallery_posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);
    if (post.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare('DELETE FROM gallery_comments WHERE post_id = ?').bind(postId).run();
    await env.DB.prepare('DELETE FROM gallery_likes WHERE post_id = ?').bind(postId).run();
    await env.DB.prepare('DELETE FROM gallery_posts WHERE id = ?').bind(postId).run();

    return json({ message: '글이 삭제되었습니다.' });
  }

  return error('Method not allowed', 405);
}

async function handleGalleryComments(request, env, postId) {
  if (request.method === 'POST') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { content, password } = body.data;
    if (!content || !password) return error('내용과 비밀번호를 입력해주세요.');

    const post = await env.DB.prepare('SELECT id FROM gallery_posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO gallery_comments (post_id, content, password, created_at) VALUES (?, ?, ?, ?)'
    ).bind(postId, content, hashedPw, now()).run();

    return json({ id: result.meta.last_row_id, message: '댓글이 작성되었습니다.' }, 201);
  }

  return error('Method not allowed', 405);
}

async function handleGalleryCommentDelete(request, env, postId, commentId) {
  if (request.method === 'DELETE') {
    const body = await parseBody(request);
    if (!body.ok) return error(body.error);

    const { password } = body.data;
    if (!password) return error('비밀번호를 입력해주세요.');

    const hashedPw = await hashPassword(password);
    const comment = await env.DB.prepare(
      'SELECT password FROM gallery_comments WHERE id = ? AND post_id = ?'
    ).bind(commentId, postId).first();
    if (!comment) return error('댓글을 찾을 수 없습니다.', 404);
    if (comment.password !== hashedPw) return error('비밀번호가 일치하지 않습니다.', 403);

    await env.DB.prepare('DELETE FROM gallery_comments WHERE id = ?').bind(commentId).run();

    return json({ message: '댓글이 삭제되었습니다.' });
  }

  return error('Method not allowed', 405);
}

async function handleGalleryLike(request, env, postId) {
  if (request.method === 'POST') {
    const visitorId = getVisitorId(request);
    if (!visitorId) return error('방문자 정보가 없습니다.', 400);

    const post = await env.DB.prepare('SELECT id, like_count FROM gallery_posts WHERE id = ?').bind(postId).first();
    if (!post) return error('글을 찾을 수 없습니다.', 404);

    const existing = await env.DB.prepare(
      'SELECT 1 FROM gallery_likes WHERE post_id = ? AND visitor_id = ?'
    ).bind(postId, visitorId).first();

    if (existing) {
      await env.DB.prepare('DELETE FROM gallery_likes WHERE post_id = ? AND visitor_id = ?').bind(postId, visitorId).run();
      await env.DB.prepare('UPDATE gallery_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?').bind(postId).run();
      const updated = await env.DB.prepare('SELECT like_count FROM gallery_posts WHERE id = ?').bind(postId).first();
      return json({ liked: false, like_count: updated.like_count });
    } else {
      await env.DB.prepare('INSERT INTO gallery_likes (post_id, visitor_id) VALUES (?, ?)').bind(postId, visitorId).run();
      await env.DB.prepare('UPDATE gallery_posts SET like_count = like_count + 1 WHERE id = ?').bind(postId).run();
      const updated = await env.DB.prepare('SELECT like_count FROM gallery_posts WHERE id = ?').bind(postId).first();
      return json({ liked: true, like_count: updated.like_count });
    }
  }

  return error('Method not allowed', 405);
}

async function handleGalleryLikeStatus(request, env, postId) {
  const visitorId = getVisitorId(request);
  const liked = visitorId ? !!(await env.DB.prepare('SELECT 1 FROM gallery_likes WHERE post_id = ? AND visitor_id = ?').bind(postId, visitorId).first()) : false;
  const post = await env.DB.prepare('SELECT like_count FROM gallery_posts WHERE id = ?').bind(postId).first();
  return json({ liked, like_count: post?.like_count || 0 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const visitorId = getVisitorId(request);
    let setCookieHeader = null;
    if (!visitorId) {
      const newId = crypto.randomUUID();
      setCookieHeader = `visitor_id=${newId}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }

    try {
      let response;

      // Gallery routes
      if (url.pathname === '/api/gallery/posts') {
        response = await handleGalleryPosts(request, env);
      }
      else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)$/)[1]);
        response = await handleGalleryPost(request, env, postId);
      }
      else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments$/)[1]);
        response = await handleGalleryComments(request, env, postId);
      }
      else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments\/(\d+)$/)) {
        const match = url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments\/(\d+)$/);
        response = await handleGalleryCommentDelete(request, env, parseInt(match[1]), parseInt(match[2]));
      }
      else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/like$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/like$/)[1]);
        if (request.method === 'GET') {
          response = await handleGalleryLikeStatus(request, env, postId);
        } else {
          response = await handleGalleryLike(request, env, postId);
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