var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-1FODsw/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-1FODsw/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Visitor-Id",
  "Access-Control-Max-Age": "86400"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
__name(json, "json");
function error(message, status = 400) {
  return json({ error: message }, status);
}
__name(error, "error");
function now() {
  return (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
}
__name(now, "now");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
function getVisitorId(request) {
  const headerId = request.headers.get("X-Visitor-Id");
  if (headerId)
    return headerId;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/visitor_id=([^;]+)/);
  return match ? match[1] : null;
}
__name(getVisitorId, "getVisitorId");
function parseBody(request) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS")
    return { ok: true, data: null };
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: false, data: null, error: "Content-Type must be application/json" };
  }
  return request.json().then((data) => ({ ok: true, data })).catch(() => ({ ok: false, data: null, error: "Invalid JSON" }));
}
__name(parseBody, "parseBody");
async function handlePosts(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;
    const countResult = await env.DB.prepare("SELECT COUNT(*) as total FROM posts").first();
    const total = countResult?.total || 0;
    const { results } = await env.DB.prepare(
      `SELECT p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at, p.like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
       FROM posts p
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    return json({ posts: results, total, page, totalPages: Math.ceil(total / limit) });
  }
  if (request.method === "POST") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { title, content, password, image_url } = body.data;
    if (!title || !content || !password)
      return error("\uC81C\uBAA9, \uB0B4\uC6A9, \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO posts (title, content, password, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(title, content, hashedPw, image_url || null, now(), now()).run();
    return json({ id: result.meta.last_row_id, message: "\uAE00\uC774 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 201);
  }
  return error("Method not allowed", 405);
}
__name(handlePosts, "handlePosts");
async function handlePost(request, env, postId) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const { results: comments } = await env.DB.prepare(
      "SELECT id, post_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC"
    ).bind(postId).all();
    return json({ post, comments });
  }
  if (request.method === "PUT") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { title, content, password, image_url } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare("SELECT password FROM posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (post.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare(
      "UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content), image_url = COALESCE(?, image_url), updated_at = ? WHERE id = ?"
    ).bind(title || null, content || null, image_url || null, now(), postId).run();
    return json({ message: "\uAE00\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  if (request.method === "DELETE") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { password } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare("SELECT password FROM posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (post.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare("DELETE FROM comments WHERE post_id = ?").bind(postId).run();
    await env.DB.prepare("DELETE FROM likes WHERE post_id = ?").bind(postId).run();
    await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
    return json({ message: "\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  return error("Method not allowed", 405);
}
__name(handlePost, "handlePost");
async function handleComments(request, env, postId) {
  if (request.method === "POST") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { content, password } = body.data;
    if (!content || !password)
      return error("\uB0B4\uC6A9\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO comments (post_id, content, password, created_at) VALUES (?, ?, ?, ?)"
    ).bind(postId, content, hashedPw, now()).run();
    return json({ id: result.meta.last_row_id, message: "\uB313\uAE00\uC774 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 201);
  }
  return error("Method not allowed", 405);
}
__name(handleComments, "handleComments");
async function handleCommentDelete(request, env, postId, commentId) {
  if (request.method === "DELETE") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { password } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const comment = await env.DB.prepare(
      "SELECT password FROM comments WHERE id = ? AND post_id = ?"
    ).bind(commentId, postId).first();
    if (!comment)
      return error("\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (comment.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
    return json({ message: "\uB313\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  return error("Method not allowed", 405);
}
__name(handleCommentDelete, "handleCommentDelete");
async function handleLike(request, env, postId) {
  if (request.method === "POST") {
    const visitorId = getVisitorId(request);
    if (!visitorId)
      return error("\uBC29\uBB38\uC790 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", 400);
    const post = await env.DB.prepare("SELECT id, like_count FROM posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const existing = await env.DB.prepare(
      "SELECT 1 FROM likes WHERE post_id = ? AND visitor_id = ?"
    ).bind(postId, visitorId).first();
    if (existing) {
      await env.DB.prepare("DELETE FROM likes WHERE post_id = ? AND visitor_id = ?").bind(postId, visitorId).run();
      await env.DB.prepare("UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?").bind(postId).run();
      const updated = await env.DB.prepare("SELECT like_count FROM posts WHERE id = ?").bind(postId).first();
      return json({ liked: false, like_count: updated.like_count });
    } else {
      await env.DB.prepare("INSERT INTO likes (post_id, visitor_id) VALUES (?, ?)").bind(postId, visitorId).run();
      await env.DB.prepare("UPDATE posts SET like_count = like_count + 1 WHERE id = ?").bind(postId).run();
      const updated = await env.DB.prepare("SELECT like_count FROM posts WHERE id = ?").bind(postId).first();
      return json({ liked: true, like_count: updated.like_count });
    }
  }
  return error("Method not allowed", 405);
}
__name(handleLike, "handleLike");
async function handleLikeStatus(request, env, postId) {
  const visitorId = getVisitorId(request);
  const liked = visitorId ? !!await env.DB.prepare("SELECT 1 FROM likes WHERE post_id = ? AND visitor_id = ?").bind(postId, visitorId).first() : false;
  const post = await env.DB.prepare("SELECT like_count FROM posts WHERE id = ?").bind(postId).first();
  return json({ liked, like_count: post?.like_count || 0 });
}
__name(handleLikeStatus, "handleLikeStatus");
async function handleGalleryPosts(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 12;
    const offset = (page - 1) * limit;
    const totalResult = await env.DB.prepare("SELECT COUNT(*) as count FROM gallery_posts").first();
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const { results: posts } = await env.DB.prepare(
      "SELECT id, title, content, image_url, created_at, like_count, (SELECT COUNT(*) FROM gallery_comments WHERE post_id = gallery_posts.id) as comment_count FROM gallery_posts ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();
    return json({ posts, total, totalPages, page });
  }
  if (request.method === "POST") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { title, content, password, image_url } = body.data;
    if (!title || !content || !password)
      return error("\uC81C\uBAA9, \uB0B4\uC6A9, \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO gallery_posts (title, content, password, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(title, content, hashedPw, image_url || null, now(), now()).run();
    return json({ id: result.meta.last_row_id, message: "\uAC24\uB7EC\uB9AC \uAE00\uC774 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 201);
  }
  return error("Method not allowed", 405);
}
__name(handleGalleryPosts, "handleGalleryPosts");
async function handleGalleryPost(request, env, postId) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const post = await env.DB.prepare("SELECT * FROM gallery_posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const { results: comments } = await env.DB.prepare(
      "SELECT id, post_id, content, created_at FROM gallery_comments WHERE post_id = ? ORDER BY created_at ASC"
    ).bind(postId).all();
    return json({ post, comments });
  }
  if (request.method === "PUT") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { title, content, password, image_url } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare("SELECT password FROM gallery_posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (post.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare(
      "UPDATE gallery_posts SET title = COALESCE(?, title), content = COALESCE(?, content), image_url = COALESCE(?, image_url), updated_at = ? WHERE id = ?"
    ).bind(title || null, content || null, image_url || null, now(), postId).run();
    return json({ message: "\uAE00\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  if (request.method === "DELETE") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { password } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const post = await env.DB.prepare("SELECT password FROM gallery_posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (post.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare("DELETE FROM gallery_comments WHERE post_id = ?").bind(postId).run();
    await env.DB.prepare("DELETE FROM gallery_likes WHERE post_id = ?").bind(postId).run();
    await env.DB.prepare("DELETE FROM gallery_posts WHERE id = ?").bind(postId).run();
    return json({ message: "\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  return error("Method not allowed", 405);
}
__name(handleGalleryPost, "handleGalleryPost");
async function handleGalleryComments(request, env, postId) {
  if (request.method === "POST") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { content, password } = body.data;
    if (!content || !password)
      return error("\uB0B4\uC6A9\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const post = await env.DB.prepare("SELECT id FROM gallery_posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO gallery_comments (post_id, content, password, created_at) VALUES (?, ?, ?, ?)"
    ).bind(postId, content, hashedPw, now()).run();
    return json({ id: result.meta.last_row_id, message: "\uB313\uAE00\uC774 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 201);
  }
  return error("Method not allowed", 405);
}
__name(handleGalleryComments, "handleGalleryComments");
async function handleGalleryCommentDelete(request, env, postId, commentId) {
  if (request.method === "DELETE") {
    const body = await parseBody(request);
    if (!body.ok)
      return error(body.error);
    const { password } = body.data;
    if (!password)
      return error("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    const hashedPw = await hashPassword(password);
    const comment = await env.DB.prepare(
      "SELECT password FROM gallery_comments WHERE id = ? AND post_id = ?"
    ).bind(commentId, postId).first();
    if (!comment)
      return error("\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    if (comment.password !== hashedPw)
      return error("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 403);
    await env.DB.prepare("DELETE FROM gallery_comments WHERE id = ?").bind(commentId).run();
    return json({ message: "\uB313\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  return error("Method not allowed", 405);
}
__name(handleGalleryCommentDelete, "handleGalleryCommentDelete");
async function handleGalleryLike(request, env, postId) {
  if (request.method === "POST") {
    const visitorId = getVisitorId(request);
    if (!visitorId)
      return error("\uBC29\uBB38\uC790 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", 400);
    const post = await env.DB.prepare("SELECT id, like_count FROM gallery_posts WHERE id = ?").bind(postId).first();
    if (!post)
      return error("\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    const existing = await env.DB.prepare(
      "SELECT 1 FROM gallery_likes WHERE post_id = ? AND visitor_id = ?"
    ).bind(postId, visitorId).first();
    if (existing) {
      await env.DB.prepare("DELETE FROM gallery_likes WHERE post_id = ? AND visitor_id = ?").bind(postId, visitorId).run();
      await env.DB.prepare("UPDATE gallery_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?").bind(postId).run();
      const updated = await env.DB.prepare("SELECT like_count FROM gallery_posts WHERE id = ?").bind(postId).first();
      return json({ liked: false, like_count: updated.like_count });
    } else {
      await env.DB.prepare("INSERT INTO gallery_likes (post_id, visitor_id) VALUES (?, ?)").bind(postId, visitorId).run();
      await env.DB.prepare("UPDATE gallery_posts SET like_count = like_count + 1 WHERE id = ?").bind(postId).run();
      const updated = await env.DB.prepare("SELECT like_count FROM gallery_posts WHERE id = ?").bind(postId).first();
      return json({ liked: true, like_count: updated.like_count });
    }
  }
  return error("Method not allowed", 405);
}
__name(handleGalleryLike, "handleGalleryLike");
async function handleGalleryLikeStatus(request, env, postId) {
  const visitorId = getVisitorId(request);
  const liked = visitorId ? !!await env.DB.prepare("SELECT 1 FROM gallery_likes WHERE post_id = ? AND visitor_id = ?").bind(postId, visitorId).first() : false;
  const post = await env.DB.prepare("SELECT like_count FROM gallery_posts WHERE id = ?").bind(postId).first();
  return json({ liked, like_count: post?.like_count || 0 });
}
__name(handleGalleryLikeStatus, "handleGalleryLikeStatus");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
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
      if (url.pathname === "/api/posts") {
        response = await handlePosts(request, env);
      } else if (url.pathname.match(/^\/api\/posts\/(\d+)$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)$/)[1]);
        response = await handlePost(request, env, postId);
      } else if (url.pathname.match(/^\/api\/posts\/(\d+)\/comments$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)\/comments$/)[1]);
        response = await handleComments(request, env, postId);
      } else if (url.pathname.match(/^\/api\/posts\/(\d+)\/comments\/(\d+)$/)) {
        const match = url.pathname.match(/^\/api\/posts\/(\d+)\/comments\/(\d+)$/);
        response = await handleCommentDelete(request, env, parseInt(match[1]), parseInt(match[2]));
      } else if (url.pathname.match(/^\/api\/posts\/(\d+)\/like$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/posts\/(\d+)\/like$/)[1]);
        if (request.method === "GET") {
          response = await handleLikeStatus(request, env, postId);
        } else {
          response = await handleLike(request, env, postId);
        }
      } else if (url.pathname === "/api/gallery/posts") {
        response = await handleGalleryPosts(request, env);
      } else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)$/)[1]);
        response = await handleGalleryPost(request, env, postId);
      } else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments$/)[1]);
        response = await handleGalleryComments(request, env, postId);
      } else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments\/(\d+)$/)) {
        const match = url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/comments\/(\d+)$/);
        response = await handleGalleryCommentDelete(request, env, parseInt(match[1]), parseInt(match[2]));
      } else if (url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/like$/)) {
        const postId = parseInt(url.pathname.match(/^\/api\/gallery\/posts\/(\d+)\/like$/)[1]);
        if (request.method === "GET") {
          response = await handleGalleryLikeStatus(request, env, postId);
        } else {
          response = await handleGalleryLike(request, env, postId);
        }
      } else {
        return error("Not found", 404);
      }
      if (setCookieHeader) {
        response.headers.set("Set-Cookie", setCookieHeader);
      }
      return response;
    } catch (err) {
      console.error(err);
      return error("Internal server error", 500);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error2 = reduceError(e);
    return Response.json(error2, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-1FODsw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-1FODsw/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
