const GALLERY_API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:8787'
  : 'https://board-worker.eggjoy.workers.dev';

function formatDate(iso) {
  const d = new Date(iso + 'Z');
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getVisitorId() {
  let id = localStorage.getItem('visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
  }
  return id;
}

class BoardGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.posts = [];
    this.page = 1;
    this.totalPages = 1;
  }

  connectedCallback() {
    this.page = this.getCurrentPage();
    this.fetchPosts();
  }

  getCurrentPage() {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('page') || '1');
  }

  async fetchPosts() {
    try {
      const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts?page=${this.page}`);
      const data = await res.json();
      this.posts = data.posts || [];
      this.totalPages = data.totalPages || 1;
      this.render();
      this.renderPagination(data.total || 0);
    } catch (err) {
      this.shadowRoot.innerHTML = `<p class="error">갤러리 글을 불러오는 데 실패했습니다.</p>`;
    }
  }

  renderPagination(total) {
    const container = this.shadowRoot.getElementById('pagination');
    if (!container) return;
    if (this.totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    if (this.page > 1) html += `<a class="page-btn" href="gallery.html?page=${this.page - 1}">이전</a>`;
    for (let i = 1; i <= this.totalPages; i++) {
      html += `<a class="page-btn ${i === this.page ? 'active' : ''}" href="gallery.html?page=${i}">${i}</a>`;
    }
    if (this.page < this.totalPages) html += `<a class="page-btn" href="gallery.html?page=${this.page + 1}">다음</a>`;
    container.innerHTML = html;
  }

  render() {
    if (this.posts.length === 0) {
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="empty">아직 게시글이 없습니다.<br><a href="gallery-post.html" class="write-link">첫 글 작성하기</a></div>
        <div id="pagination" class="pagination"></div>
      `;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="gallery-grid">
        ${this.posts.map(p => `
          <article class="gallery-card" data-id="${p.id}">
            ${p.image_url ? `
              <a href="gallery-post.html?id=${p.id}" class="gallery-image-wrap">
                <img src="${p.image_url}" alt="${escapeHtml(p.title)}" loading="lazy">
                <div class="gallery-image-overlay">
                  <span>자세히 보기 →</span>
                </div>
              </a>
            ` : `
              <a href="gallery-post.html?id=${p.id}" class="gallery-image-wrap no-image">
                <div class="no-image-placeholder">
                  <span>📷</span>
                  <span>이미지 없음</span>
                </div>
              </a>
            `}
            <div class="gallery-info">
              <h3 class="gallery-title"><a href="gallery-post.html?id=${p.id}">${escapeHtml(p.title)}</a></h3>
              <div class="gallery-meta">
                <span class="gallery-date">${formatDate(p.created_at)}</span>
                <span class="gallery-likes">♥ ${p.like_count || 0}</span>
                <span class="gallery-comments">💬 ${p.comment_count || 0}</span>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
      <div id="pagination" class="pagination"></div>
    `;
  }
}

const styles = `
  :host { display: block; }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .gallery-card {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation: cardFadeIn 0.5s ease backwards;
    backdrop-filter: blur(10px);
  }
  .gallery-card:nth-child(1) { animation-delay: 0.02s; }
  .gallery-card:nth-child(2) { animation-delay: 0.06s; }
  .gallery-card:nth-child(3) { animation-delay: 0.10s; }
  .gallery-card:nth-child(4) { animation-delay: 0.14s; }
  .gallery-card:nth-child(5) { animation-delay: 0.18s; }
  .gallery-card:nth-child(6) { animation-delay: 0.22s; }
  .gallery-card:nth-child(7) { animation-delay: 0.26s; }
  .gallery-card:nth-child(8) { animation-delay: 0.30s; }

  .gallery-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(100,160,255,0.15), rgba(160,100,255,0.05), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .gallery-card:hover::before {
    opacity: 1;
  }
  .gallery-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow:
      0 20px 60px rgba(0,0,0,0.4),
      0 0 40px rgba(100, 160, 255, 0.08);
    border-color: rgba(100, 160, 255, 0.2);
    background: rgba(255,255,255,0.05);
  }

  .gallery-image-wrap {
    display: block;
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: rgba(255,255,255,0.02);
    text-decoration: none;
  }
  .gallery-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .gallery-card:hover .gallery-image-wrap img {
    transform: scale(1.1);
  }

  .gallery-image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.4s ease;
    display: flex;
    align-items: flex-end;
    padding: 20px;
  }
  .gallery-card:hover .gallery-image-overlay {
    opacity: 1;
  }
  .gallery-image-overlay span {
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    opacity: 0.9;
  }

  .no-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-secondary, #666);
    font-size: 0.9rem;
    background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05));
  }
  .no-image-placeholder span:first-child {
    font-size: 3rem;
    opacity: 0.4;
    filter: grayscale(0.5);
  }

  .gallery-info {
    padding: 18px 20px 20px;
    position: relative;
  }
  .gallery-title {
    margin: 0 0 12px 0;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .gallery-title a {
    color: var(--text-primary, #f0f0f0);
    text-decoration: none;
    transition: color 0.2s;
  }
  .gallery-title a:hover { color: #64a0ff; }

  .gallery-meta {
    display: flex;
    gap: 16px;
    font-size: 0.8rem;
    color: var(--text-secondary, #777);
  }
  .gallery-meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .gallery-likes { color: rgba(255, 107, 107, 0.8); }
  .gallery-comments { color: rgba(100, 200, 255, 0.7); }

  .empty {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-secondary, #666);
    font-size: 1.1rem;
  }
  .write-link {
    display: inline-block;
    margin-top: 16px;
    padding: 12px 32px;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    border-radius: 14px;
    color: #fff;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.25);
  }
  .write-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(100, 160, 255, 0.4);
  }

  .error {
    text-align: center;
    padding: 40px;
    color: #ff6b6b;
    font-size: 1rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 32px;
    flex-wrap: wrap;
  }
  .pagination .page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: var(--text-secondary, #999);
    font-size: 0.9rem;
    font-family: 'Noto Sans KR', sans-serif;
    text-decoration: none;
    transition: all 0.25s ease;
    backdrop-filter: blur(8px);
  }
  .pagination .page-btn:hover {
    background: rgba(100, 160, 255, 0.15);
    border-color: rgba(100, 160, 255, 0.4);
    color: #fff;
    transform: translateY(-1px);
  }
  .pagination .page-btn.active {
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.9), rgba(80, 130, 255, 0.95));
    border-color: transparent;
    color: #fff;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.35);
  }

  @keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 600px) {
    .gallery-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .gallery-info { padding: 14px 16px 16px; }
    .gallery-title { font-size: 0.95rem; }
  }
`;

const formStyles = `
  :host { display: block; padding: 20px 0; }
  .form-card {
    padding: 32px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }
  .form-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--text-primary, #f0f0f0);
    letter-spacing: -0.01em;
  }
  .form-group {
    margin-bottom: 18px;
  }
  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary, #888);
    margin-bottom: 8px;
    letter-spacing: 0.01em;
  }
  .form-group input[type="url"],
  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95rem;
    box-sizing: border-box;
    transition: all 0.25s ease;
    outline: none;
  }
  .form-group input[type="url"]:focus,
  input[type="text"]:focus,
  input[type="password"]:focus {
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.08);
  }
  input[type="text"] { margin-bottom: 18px; }
  input[type="password"] { margin-bottom: 0; }

  .textarea-wrap {
    position: relative;
    margin-bottom: 18px;
  }
  .textarea-wrap textarea {
    width: 100%;
    padding: 14px 52px 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95rem;
    line-height: 1.7;
    resize: vertical;
    min-height: 180px;
    box-sizing: border-box;
    transition: all 0.25s ease;
    outline: none;
  }
  .textarea-wrap textarea:focus {
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.08);
  }

  .emoji-toggle-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.06);
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 2;
  }
  .emoji-toggle-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.1);
  }
  .emoji-panel {
    display: none;
    position: absolute;
    bottom: calc(100% + 10px);
    right: 0;
    background: rgba(25, 25, 35, 0.97);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
    z-index: 10;
    animation: emojiSlideUp 0.2s ease;
  }
  .emoji-panel.open { display: block; }
  @keyframes emojiSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
  }
  .emoji-item {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .emoji-item:hover {
    background: rgba(255,255,255,0.12);
    transform: scale(1.25);
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }
  .submit-btn {
    padding: 14px 36px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.9), rgba(80, 130, 255, 1));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.3);
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(100, 160, 255, 0.45);
  }
  .submit-btn:active { transform: translateY(0); }
  .cancel-btn {
    padding: 14px 28px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .cancel-btn:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: var(--text-primary, #f0f0f0);
  }

  .error { text-align: center; padding: 40px 0; color: #ff6b6b; }

  @media (max-width: 600px) {
    .form-card { padding: 20px; }
    .form-actions { flex-direction: column; }
    .submit-btn, .cancel-btn { width: 100%; justify-content: center; }
  }
`;

const detailStyles = `
  :host { display: block; }

  .detail { position: relative; }

  .post-header {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .post-title {
    font-size: 1.65rem;
    font-weight: 700;
    margin: 0 0 10px 0;
    color: var(--text-primary, #f0f0f0);
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .post-meta {
    font-size: 0.85rem;
    color: var(--text-secondary, #777);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .post-edited {
    font-size: 0.75rem;
    padding: 2px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.06);
    color: var(--text-secondary, #888);
  }

  .post-image {
    margin: 24px 0;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    background: rgba(0,0,0,0.2);
  }
  .post-image img {
    width: 100%;
    max-height: 600px;
    object-fit: contain;
    display: block;
    transition: transform 0.3s ease;
  }
  .post-image:hover img {
    transform: scale(1.02);
  }

  .post-content {
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--text-primary, #e0e0e0);
    padding: 24px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .post-actions {
    display: flex;
    gap: 8px;
    padding: 20px 0;
    align-items: center;
    flex-wrap: wrap;
  }
  .like-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 24px;
    border: 1px solid rgba(255,107,107,0.25);
    background: rgba(255,107,107,0.05);
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .like-btn:hover {
    background: rgba(255,107,107,0.12);
    border-color: rgba(255,107,107,0.4);
    color: #ff6b6b;
  }
  .like-btn.liked {
    background: rgba(255,107,107,0.15);
    border-color: rgba(255,107,107,0.5);
    color: #ff6b6b;
  }
  .like-btn.liked .like-icon {
    animation: heartBeat 0.35s ease;
  }
  @keyframes heartBeat {
    0% { transform: scale(1); }
    30% { transform: scale(1.4); }
    60% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  .like-count { font-variant-numeric: tabular-nums; min-width: 1.2em; }

  .edit-btn, .delete-btn {
    padding: 10px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .edit-btn { margin-left: auto; }
  .edit-btn:hover {
    border-color: rgba(100,160,255,0.4);
    background: rgba(100,160,255,0.08);
    color: #64a0ff;
  }
  .delete-btn:hover {
    border-color: rgba(255,80,80,0.4);
    background: rgba(255,80,80,0.08);
    color: #ff5050;
  }

  .comments-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .comments-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: var(--text-primary, #f0f0f0);
  }
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  .comment {
    padding: 16px 20px;
    border-radius: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    transition: all 0.2s ease;
    animation: commentFadeIn 0.3s ease backwards;
  }
  .comment:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  .comment-content {
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--text-primary, #e0e0e0);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .comment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }
  .comment-date {
    font-size: 0.8rem;
    color: var(--text-secondary, #777);
  }
  .comment-delete-btn {
    padding: 4px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
    background: transparent;
    color: var(--text-secondary, #777);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .comment-delete-btn:hover {
    border-color: rgba(255,80,80,0.3);
    background: rgba(255,80,80,0.06);
    color: #ff5050;
  }
  @keyframes commentFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .comment-form-wrap {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(12px);
  }
  .comment-form { display: flex; flex-direction: column; gap: 14px; }

  .comment-input-area { position: relative; }
  .comment-input-area textarea {
    width: 100%;
    padding: 14px 52px 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9rem;
    line-height: 1.7;
    resize: vertical;
    min-height: 90px;
    box-sizing: border-box;
    transition: all 0.25s ease;
    outline: none;
  }
  .comment-input-area textarea:focus {
    border-color: rgba(100, 160, 255, 0.4);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.06);
  }

  .emoji-toggle-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.06);
    font-size: 1.15rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 2;
  }
  .emoji-toggle-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.1);
  }
  .emoji-panel {
    display: none;
    position: absolute;
    bottom: calc(100% + 10px);
    right: 0;
    background: rgba(25, 25, 35, 0.97);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
    z-index: 10;
    animation: emojiSlideUp 0.2s ease;
  }
  .emoji-panel.open { display: block; }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
  }
  .emoji-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .emoji-item:hover {
    background: rgba(255,255,255,0.12);
    transform: scale(1.25);
  }
  @keyframes emojiSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .comment-bottom-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .comment-bottom-row input {
    flex: 1;
    max-width: 200px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.85rem;
    transition: all 0.25s ease;
    outline: none;
  }
  .comment-bottom-row input:focus {
    border-color: rgba(100, 160, 255, 0.4);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.06);
  }
  .comment-submit-btn {
    padding: 12px 28px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px rgba(100, 160, 255, 0.25);
    white-space: nowrap;
  }
  .comment-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(100, 160, 255, 0.4);
  }
  .comment-submit-btn:active { transform: translateY(0); }

  .pw-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.25s ease;
  }
  .pw-modal-overlay.open { display: flex; }
  .pw-modal {
    background: rgba(25, 25, 40, 0.97);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 32px;
    width: 360px;
    max-width: 90vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    animation: modalSlideUp 0.3s ease;
  }
  @keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .pw-modal-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary, #f0f0f0);
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: -0.01em;
  }
  .pw-modal-input {
    width: 100%;
    padding: 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95rem;
    box-sizing: border-box;
    transition: all 0.25s ease;
    outline: none;
  }
  .pw-modal-input:focus {
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.08);
  }
  .pw-modal-error {
    color: #ff6b6b;
    font-size: 0.8rem;
    min-height: 22px;
    margin-top: 8px;
    text-align: center;
  }
  .pw-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  .pw-modal-cancel {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pw-modal-cancel:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
  }
  .pw-modal-confirm {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.9), rgba(80, 130, 255, 1));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.3);
  }
  .pw-modal-confirm:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(100, 160, 255, 0.4);
  }
  .pw-modal-confirm:active { transform: translateY(0); }

  @media (max-width: 600px) {
    .post-title { font-size: 1.3rem; }
    .post-content { font-size: 0.95rem; }
    .comment-bottom-row { flex-direction: column; }
    .comment-bottom-row input { max-width: 100%; }
    .comment-submit-btn { width: 100%; justify-content: center; }
    .edit-btn, .delete-btn { margin-left: 0; }
  }
`;

customElements.define('gallery-list', BoardGallery);

// ─── Gallery Post Component ──────────────────────────────────
class GalleryPost extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.post = null;
    this.liked = false;
  }

  connectedCallback() {
    this.renderForm();
  }

  getPostId() {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('id'));
  }

  renderForm() {
    const id = this.getPostId();
    if (!id) {
      this.renderWriteForm();
    } else {
      this.fetchPost(id);
    }
  }

  async fetchPost(id) {
    try {
      const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      this.post = data.post;
      this.renderDetail(data.post, data.comments || []);
    } catch {
      this.shadowRoot.innerHTML = `<p class="error">게시글을 찾을 수 없습니다.</p>`;
    }
  }

  renderWriteForm(existing = null) {
    const isEdit = !!existing;
    const savedPw = existing?._savedPassword || '';
    
    // Check for draft from image generator via URL params
    const params = new URLSearchParams(location.search);
    const draftTitle = existing?.title || params.get('draft_title') || '';
    const draftContent = existing?.content || params.get('draft_content') || '';
    const draftImage = existing?.image_url || params.get('draft_image') || '';
    
    this.shadowRoot.innerHTML = `
      <style>${formStyles}</style>
      <div class="form-card">
        <h2 class="form-title">${isEdit ? '글 수정' : '새 글 작성'}</h2>
        <div id="post-form">
          <input type="text" name="title" placeholder="제목" value="${isEdit ? escapeAttr(existing.title) : escapeAttr(draftTitle)}" required maxlength="100">
          <div class="form-group">
            <label for="image_url">이미지 URL (선택)</label>
            <input type="url" name="image_url" id="image_url" placeholder="https://example.com/image.jpg" value="${isEdit ? escapeAttr(existing.image_url || '') : escapeAttr(draftImage)}" maxlength="2000000">
          </div>
          <div class="textarea-wrap">
            <textarea name="content" placeholder="내용을 입력하세요..." rows="10" required maxlength="50000">${isEdit ? escapeHtml(existing.content) : escapeHtml(draftContent)}</textarea>
            <button type="button" class="emoji-toggle-btn" id="emoji-toggle" title="이모티콘">😊</button>
            <div class="emoji-panel" id="emoji-panel">
              <div class="emoji-grid">
                <span class="emoji-item">😀</span><span class="emoji-item">😂</span><span class="emoji-item">😍</span>
                <span class="emoji-item">🥰</span><span class="emoji-item">😎</span><span class="emoji-item">🤔</span>
                <span class="emoji-item">😢</span><span class="emoji-item">😡</span><span class="emoji-item">🥳</span>
                <span class="emoji-item">🤩</span><span class="emoji-item">😴</span><span class="emoji-item">🤗</span>
                <span class="emoji-item">👍</span><span class="emoji-item">👎</span><span class="emoji-item">👏</span>
                <span class="emoji-item">🙌</span><span class="emoji-item">💪</span><span class="emoji-item">🤝</span>
                <span class="emoji-item">❤️</span><span class="emoji-item">🔥</span><span class="emoji-item">⭐</span>
                <span class="emoji-item">🎉</span><span class="emoji-item">✅</span><span class="emoji-item">💯</span>
                <span class="emoji-item">😮</span><span class="emoji-item">🫡</span><span class="emoji-item">🤣</span>
                <span class="emoji-item">😘</span><span class="emoji-item">🥺</span><span class="emoji-item">😤</span>
                <span class="emoji-item">👻</span><span class="emoji-item">💀</span><span class="emoji-item">🤡</span>
                <span class="emoji-item">🐶</span><span class="emoji-item">🐱</span><span class="emoji-item">🐼</span>
                <span class="emoji-item">🌈</span><span class="emoji-item">☀️</span><span class="emoji-item">🌙</span>
              </div>
            </div>
          </div>
          <input type="password" name="password" placeholder="${isEdit ? '비밀번호 확인' : '비밀번호 (수정/삭제 시 필요)'}" value="${escapeAttr(savedPw)}" required maxlength="50" autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')">
          <div class="form-actions">
            <button type="button" class="submit-btn" id="submit-btn">${isEdit ? '수정 완료' : '작성하기'}</button>
            <button type="button" class="cancel-btn" onclick="location.href='gallery.html'">취소</button>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('submit-btn').addEventListener('click', async () => {
      const form = this.shadowRoot.getElementById('post-form');
      const title = form.querySelector('input[name="title"]').value;
      const content = form.querySelector('textarea[name="content"]').value;
      const image_url = form.querySelector('input[name="image_url"]').value;
      const password = form.querySelector('input[name="password"]').value;

      if (!title || !content || !password) {
        alert('제목, 내용, 비밀번호를 모두 입력해주세요.');
        return;
      }

      const body = { title, content, password, image_url: image_url || undefined };

      try {
        const url = isEdit ? `${GALLERY_API_BASE}/api/gallery/posts/${existing.id}` : `${GALLERY_API_BASE}/api/gallery/posts`;
        const method = isEdit ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        location.href = `gallery-post.html?id=${isEdit ? existing.id : data.id}`;
      } catch (err) {
        alert(err.message || '작성에 실패했습니다.');
      }
    });

    const emojiToggle = this.shadowRoot.getElementById('emoji-toggle');
    const emojiPanel = this.shadowRoot.getElementById('emoji-panel');
    const contentTextarea = this.shadowRoot.querySelector('textarea[name="content"]');

    if (emojiToggle && emojiPanel) {
      emojiToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPanel.classList.toggle('open');
      });

      this.shadowRoot.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', () => {
          if (contentTextarea) {
            const start = contentTextarea.selectionStart;
            const end = contentTextarea.selectionEnd;
            const val = contentTextarea.value;
            contentTextarea.value = val.slice(0, start) + item.textContent + val.slice(end);
            contentTextarea.selectionStart = contentTextarea.selectionEnd = start + item.textContent.length;
            contentTextarea.focus();
          }
          emojiPanel.classList.remove('open');
        });
      });

      this.shadowRoot.addEventListener('click', (e) => {
        if (!emojiPanel.contains(e.target) && e.target !== emojiToggle) {
          emojiPanel.classList.remove('open');
        }
      });
    }
  }

  renderDetail(post, comments) {
    this.post = post;
    this.shadowRoot.innerHTML = `
      <style>${detailStyles}</style>
      <div class="detail">
        <div class="post-header">
          <h2 class="post-title">${escapeHtml(post.title)}</h2>
          <div class="post-meta">
            <span class="post-date">${formatDate(post.created_at)}</span>
            ${post.updated_at !== post.created_at ? `<span class="post-edited">(수정됨)</span>` : ''}
          </div>
        </div>
        ${post.image_url ? `<div class="post-image"><img src="${post.image_url}" alt="${escapeHtml(post.title)}" loading="lazy"></div>` : ''}
        <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
        <div class="post-actions">
          <button class="like-btn ${this.liked ? 'liked' : ''}" id="like-btn">
            <span class="like-icon">♥</span>
            <span class="like-count" id="like-count">${post.like_count}</span>
          </button>
          <button class="edit-btn" id="edit-btn">수정</button>
          <button class="delete-btn" id="delete-btn">삭제</button>
        </div>

        <div class="comments-section">
          <h3 class="comments-title">댓글 (${comments.length})</h3>
          <div class="comments-list">
            ${comments.map(c => `
              <div class="comment">
                <div class="comment-content">${escapeHtml(c.content).replace(/\n/g, '<br>')}</div>
                <div class="comment-footer">
                  <span class="comment-date">${formatDate(c.created_at)}</span>
                  <button class="comment-delete-btn" data-id="${c.id}">삭제</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="comment-form-wrap">
            <form id="comment-form" class="comment-form">
              <div class="comment-input-area">
                <textarea name="content" placeholder="댓글을 입력하세요..." rows="3" required maxlength="1000"></textarea>
                <button type="button" class="emoji-toggle-btn" id="emoji-toggle" title="이모티콘">😊</button>
                <div class="emoji-panel" id="emoji-panel">
                  <div class="emoji-grid">
                    <span class="emoji-item">😀</span><span class="emoji-item">😂</span><span class="emoji-item">😍</span>
                    <span class="emoji-item">🥰</span><span class="emoji-item">😎</span><span class="emoji-item">🤔</span>
                    <span class="emoji-item">😢</span><span class="emoji-item">😡</span><span class="emoji-item">🥳</span>
                    <span class="emoji-item">🤩</span><span class="emoji-item">😴</span><span class="emoji-item">🤗</span>
                    <span class="emoji-item">👍</span><span class="emoji-item">👎</span><span class="emoji-item">👏</span>
                    <span class="emoji-item">🙌</span><span class="emoji-item">💪</span><span class="emoji-item">🤝</span>
                    <span class="emoji-item">❤️</span><span class="emoji-item">🔥</span><span class="emoji-item">⭐</span>
                    <span class="emoji-item">🎉</span><span class="emoji-item">✅</span><span class="emoji-item">💯</span>
                    <span class="emoji-item">😮</span><span class="emoji-item">🫡</span><span class="emoji-item">🤣</span>
                    <span class="emoji-item">😘</span><span class="emoji-item">🥺</span><span class="emoji-item">😤</span>
                    <span class="emoji-item">👻</span><span class="emoji-item">💀</span><span class="emoji-item">🤡</span>
                    <span class="emoji-item">🐶</span><span class="emoji-item">🐱</span><span class="emoji-item">🐼</span>
                    <span class="emoji-item">🌈</span><span class="emoji-item">☀️</span><span class="emoji-item">🌙</span>
                  </div>
                </div>
              </div>
              <div class="comment-bottom-row">
                <input type="password" name="password" placeholder="비밀번호" required maxlength="50" autocomplete="off">
                <button type="submit" class="comment-submit-btn">댓글 작성</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="pw-modal-overlay" id="pw-modal">
        <div class="pw-modal">
          <div class="pw-modal-title" id="pw-modal-title">비밀번호 입력</div>
          <input type="password" class="pw-modal-input" id="pw-modal-input" placeholder="비밀번호를 입력하세요" maxlength="50" autocomplete="new-password">
          <div class="pw-modal-error" id="pw-modal-error"></div>
          <div class="pw-modal-actions">
            <button type="button" class="pw-modal-cancel" id="pw-modal-cancel">취소</button>
            <button type="button" class="pw-modal-confirm" id="pw-modal-confirm">확인</button>
          </div>
        </div>
      </div>
    `;

    // Load like status
    fetch(`${GALLERY_API_BASE}/api/gallery/posts/${post.id}/like`, {
      headers: { 'X-Visitor-Id': getVisitorId() }
    }).then(r => r.json()).then(d => {
      const btn = this.shadowRoot.getElementById('like-btn');
      const count = this.shadowRoot.getElementById('like-count');
      if (d.liked) btn.classList.add('liked');
      count.textContent = d.like_count;
      this.liked = d.liked;
    });

    // Like toggle
    this.shadowRoot.getElementById('like-btn').addEventListener('click', async () => {
      const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'X-Visitor-Id': getVisitorId() }
      });
      const data = await res.json();
      const btn = this.shadowRoot.getElementById('like-btn');
      const count = this.shadowRoot.getElementById('like-count');
      btn.classList.toggle('liked', data.liked);
      count.textContent = data.like_count;
      this.liked = data.liked;
    });

    // Edit
    this.shadowRoot.getElementById('edit-btn').addEventListener('click', async () => {
      const pw = await showPasswordModal(this.shadowRoot, '글 수정 - 비밀번호 입력');
      if (!pw) return;
      this.renderWriteForm({ ...post, _savedPassword: pw, image_url: post.image_url });
    });

    // Delete
    this.shadowRoot.getElementById('delete-btn').addEventListener('click', async () => {
      const pw = await showPasswordModal(this.shadowRoot, '글 삭제 - 비밀번호 입력');
      if (!pw) return;
      try {
        const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts/${post.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        location.href = 'gallery.html';
      } catch (err) {
        alert(err.message || '삭제에 실패했습니다.');
      }
    });

    // Comment form
    this.shadowRoot.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts/${post.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fd.get('content'), password: fd.get('password') })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        this.fetchPost(post.id);
      } catch (err) {
        alert(err.message || '댓글 작성에 실패했습니다.');
      }
    });

    // Emoji picker for comments
    const emojiToggle = this.shadowRoot.getElementById('emoji-toggle');
    const emojiPanel = this.shadowRoot.getElementById('emoji-panel');
    const commentTextarea = this.shadowRoot.querySelector('.comment-form textarea');

    if (emojiToggle && emojiPanel) {
      emojiToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPanel.classList.toggle('open');
      });

      this.shadowRoot.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', () => {
          if (commentTextarea) {
            const start = commentTextarea.selectionStart;
            const end = commentTextarea.selectionEnd;
            const val = commentTextarea.value;
            commentTextarea.value = val.slice(0, start) + item.textContent + val.slice(end);
            commentTextarea.selectionStart = commentTextarea.selectionEnd = start + item.textContent.length;
            commentTextarea.focus();
          }
          emojiPanel.classList.remove('open');
        });
      });

      this.shadowRoot.addEventListener('click', (e) => {
        if (!emojiPanel.contains(e.target) && e.target !== emojiToggle) {
          emojiPanel.classList.remove('open');
        }
      });
    }

    // Comment delete
    this.shadowRoot.querySelectorAll('.comment-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cid = btn.dataset.id;
        const pw = await showPasswordModal(this.shadowRoot, '댓글 삭제 - 비밀번호 입력');
        if (!pw) return;
        try {
          const res = await fetch(`${GALLERY_API_BASE}/api/gallery/posts/${post.id}/comments/${cid}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          this.fetchPost(post.id);
        } catch (err) {
          alert(err.message || '삭제에 실패했습니다.');
        }
      });
    });
  }
}

function showPasswordModal(shadowRoot, title) {
  return new Promise((resolve) => {
    const overlay = shadowRoot.getElementById('pw-modal');
    const input = shadowRoot.getElementById('pw-modal-input');
    const error = shadowRoot.getElementById('pw-modal-error');
    const titleEl = shadowRoot.getElementById('pw-modal-title');
    const confirmBtn = shadowRoot.getElementById('pw-modal-confirm');
    const cancelBtn = shadowRoot.getElementById('pw-modal-cancel');

    titleEl.textContent = title;
    input.value = '';
    error.textContent = '';
    overlay.classList.add('open');
    input.focus();

    const cleanup = () => {
      overlay.classList.remove('open');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
      overlay.removeEventListener('click', onBg);
    };

    const onConfirm = () => {
      const val = input.value.trim();
      if (!val) {
        error.textContent = '비밀번호를 입력해주세요.';
        input.focus();
        return;
      }
      cleanup();
      resolve(val);
    };

    const onCancel = () => { cleanup(); resolve(null); };

    const onKey = (e) => {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    };

    const onBg = (e) => {
      if (e.target === overlay) onCancel();
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
    overlay.addEventListener('click', onBg);
  });
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class PageHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .header { text-align: center; padding: 40px 20px 20px; }
        .title { font-size: 1.8em; font-weight: 700; color: var(--text-primary, #f0f0f0); margin: 0 0 8px; }
        .subtitle { font-size: 0.95em; color: var(--text-secondary, #888); margin: 0; }
      </style>
      <div class="header">
        <h1 class="title">${this.getAttribute('title') || 'Water'}</h1>
        <p class="subtitle">${this.getAttribute('subtitle') || ''}</p>
      </div>
    `;
  }
}
customElements.define('page-header', PageHeader);

customElements.define('gallery-post', GalleryPost);