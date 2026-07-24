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
                <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy">
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  .gallery-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }
  .gallery-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    border-color: rgba(100, 160, 255, 0.3);
  }
  .gallery-image-wrap {
    display: block;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: rgba(255,255,255,0.02);
    text-decoration: none;
  }
  .gallery-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .gallery-card:hover .gallery-image-wrap img {
    transform: scale(1.05);
  }
  .no-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-secondary, #888);
    font-size: 0.9rem;
  }
  .no-image-placeholder span:first-child { font-size: 2.5rem; opacity: 0.5; }
  .gallery-info { padding: 16px; }
  .gallery-title {
    margin: 0 0 10px 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .gallery-title a { color: var(--text-primary, #f0f0f0); text-decoration: none; }
  .gallery-title a:hover { color: #64a0ff; }
  .gallery-meta {
    display: flex;
    gap: 12px;
    font-size: 0.8rem;
    color: var(--text-secondary, #999);
  }
  .gallery-likes { color: #ff6b6b; }
  .empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary, #888);
  }
  .write-link {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 24px;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    border-radius: 12px;
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }
  .write-link:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(100, 160, 255, 0.4); }
  .error { text-align: center; padding: 40px; color: #ff6b6b; }
  .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
  .pagination .page-btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-primary, #f0f0f0);
    font-size: 0.9em;
    text-decoration: none;
    transition: all 0.2s;
  }
  .pagination .page-btn:hover {
    background: rgba(100, 160, 255, 0.2);
    border-color: rgba(100, 160, 255, 0.5);
  }
  .pagination .page-btn.active {
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    border-color: transparent;
    font-weight: 600;
  }
  @media (max-width: 600px) {
    .gallery-grid { grid-template-columns: 1fr; }
  }
`;

const formStyles = `
  :host { display: block; }
  .form-card { padding: 8px 0; }
  .form-title {
    font-size: 1.4em;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--text-primary, #f0f0f0);
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-secondary, #999);
    margin-bottom: 6px;
  }
  .form-group input[type="url"] {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 1em;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .form-group input[type="url"]:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  input[type="text"], input[type="password"] {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 1em;
    margin-bottom: 12px;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  input:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .textarea-wrap { position: relative; margin-bottom: 12px; }
  .textarea-wrap textarea {
    width: 100%;
    padding: 14px 48px 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 1em;
    resize: vertical;
    min-height: 160px;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .textarea-wrap textarea:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .emoji-toggle-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06);
    font-size: 1.15em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 2;
  }
  .emoji-toggle-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.08);
  }
  .emoji-panel {
    display: none;
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: rgba(30, 30, 40, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 10;
    animation: emojiSlideUp 0.2s ease;
  }
  .emoji-panel.open { display: block; }
  @keyframes emojiSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .emoji-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25em;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .emoji-item:hover {
    background: rgba(255,255,255,0.12);
    transform: scale(1.2);
  }
  .form-actions { display: flex; gap: 12px; margin-top: 16px; }
  .submit-btn {
    padding: 12px 32px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.95em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(100, 160, 255, 0.25);
  }
  .submit-btn:hover {
    background: linear-gradient(135deg, rgba(100, 160, 255, 1), rgba(80, 130, 255, 1));
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(100, 160, 255, 0.4);
  }
  .submit-btn:active { transform: translateY(0); }
  .cancel-btn {
    padding: 12px 24px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cancel-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: var(--text-primary, #f0f0f0);
  }
  .error { text-align: center; padding: 40px 0; color: #ff6b6b; }
`;

const detailStyles = `
  :host { display: block; }
  .detail { padding: 8px 0; }
  .post-header { margin-bottom: 24px; }
  .post-title {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--text-primary, #f0f0f0);
    line-height: 1.4;
  }
  .post-meta { font-size: 0.85em; color: var(--text-secondary, #888); }
  .post-edited { margin-left: 6px; opacity: 0.7; }
  .post-image {
    margin: 20px 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .post-image img {
    width: 100%;
    max-height: 600px;
    object-fit: contain;
    display: block;
    background: rgba(0,0,0,0.3);
  }
  .post-content {
    font-size: 1.05em;
    line-height: 1.7;
    color: var(--text-primary, #e0e0e0);
    padding: 20px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .post-actions {
    display: flex;
    gap: 8px;
    padding: 16px 0;
    align-items: center;
  }
  .like-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,107,107,0.3);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .like-btn:hover, .like-btn.liked {
    background: rgba(255,107,107,0.15);
    border-color: rgba(255,107,107,0.5);
    color: #ff6b6b;
  }
  .like-btn.liked .like-icon { transform: scale(1.15); }
  .edit-btn, .delete-btn {
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
  }
  .delete-btn:hover { border-color: rgba(255,80,80,0.5); color: #ff5050; }
  .edit-btn:hover { border-color: rgba(100,160,255,0.5); color: #64a0ff; }
  .delete-btn { margin-left: 4px; }

  .comments-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .comments-title {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: var(--text-primary, #f0f0f0);
  }
  .comments-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .comment {
    padding: 14px 18px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
  }
  .comment:hover {
    background: rgba(255,255,255,0.06);
  }
  .comment-content { font-size: 0.95em; line-height: 1.6; color: var(--text-primary, #e0e0e0); white-space: pre-wrap; word-break: break-word; }
  .comment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  .comment-date { font-size: 0.8em; color: var(--text-secondary, #888); }
  .comment-delete-btn {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: var(--text-secondary, #888);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.75em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .comment-delete-btn:hover { border-color: rgba(255,80,80,0.4); color: #ff5050; }

  .comment-form-wrap {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(12px);
  }
  .comment-form { display: flex; flex-direction: column; gap: 12px; }
  .comment-input-area { position: relative; }
  .comment-input-area textarea {
    width: 100%;
    padding: 14px 48px 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95em;
    line-height: 1.6;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .comment-input-area textarea:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .emoji-toggle-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06);
    font-size: 1.1em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 2;
  }
  .emoji-toggle-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.08);
  }
  .emoji-panel {
    display: none;
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: rgba(30, 30, 40, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 10;
    animation: emojiSlideUp 0.2s ease;
  }
  .emoji-panel.open { display: block; }
  @keyframes emojiSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .emoji-item {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .emoji-item:hover {
    background: rgba(255,255,255,0.12);
    transform: scale(1.2);
  }
  .comment-bottom-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .comment-bottom-row input {
    flex: 1;
    max-width: 220px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9em;
    transition: border-color 0.2s, background 0.2s;
  }
  .comment-bottom-row input:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .comment-submit-btn {
    padding: 10px 24px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(100, 160, 255, 0.2);
    white-space: nowrap;
  }
  .comment-submit-btn:hover {
    background: linear-gradient(135deg, rgba(100, 160, 255, 1), rgba(80, 130, 255, 1));
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.4);
  }
  .comment-submit-btn:active { transform: translateY(0); }

  .pw-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .pw-modal-overlay.open { display: flex; }
  .pw-modal {
    background: rgba(30, 30, 45, 0.97);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 28px;
    width: 340px;
    max-width: 90vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    animation: modalSlideUp 0.25s ease;
  }
  @keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .pw-modal-title {
    font-size: 1.1em;
    font-weight: 700;
    color: var(--text-primary, #f0f0f0);
    text-align: center;
    margin-bottom: 18px;
  }
  .pw-modal-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95em;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .pw-modal-input:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.08);
  }
  .pw-modal-error {
    color: #ff6b6b;
    font-size: 0.82em;
    min-height: 20px;
    margin-top: 6px;
    text-align: center;
  }
  .pw-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
  }
  .pw-modal-cancel {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 500;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pw-modal-cancel:hover {
    border-color: rgba(255,255,255,0.25);
    color: var(--text-primary, #f0f0f0);
  }
  .pw-modal-confirm {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(100, 160, 255, 0.2);
  }
  .pw-modal-confirm:hover {
    background: linear-gradient(135deg, rgba(100, 160, 255, 1), rgba(80, 130, 255, 1));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.35);
  }
`;

const detailStyles = `
  :host { display: block; }
  .detail { padding: 8px 0; }
  .post-header { margin-bottom: 24px; }
  .post-title {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--text-primary, #f0f0f0);
    line-height: 1.4;
  }
  .post-meta { font-size: 0.85em; color: var(--text-secondary, #888); }
  .post-edited { margin-left: 6px; opacity: 0.7; }
  .post-image {
    margin: 20px 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .post-image img {
    width: 100%;
    max-height: 600px;
    object-fit: contain;
    display: block;
    background: rgba(0,0,0,0.3);
  }
  .post-content {
    font-size: 1.05em;
    line-height: 1.7;
    color: var(--text-primary, #e0e0e0);
    padding: 20px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .post-actions {
    display: flex;
    gap: 8px;
    padding: 16px 0;
    align-items: center;
  }
  .like-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,107,107,0.3);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .like-btn:hover, .like-btn.liked {
    background: rgba(255,107,107,0.15);
    border-color: rgba(255,107,107,0.5);
    color: #ff6b6b;
  }
  .like-btn.liked .like-icon { transform: scale(1.15); }
  .edit-btn, .delete-btn {
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
  }
  .delete-btn:hover { border-color: rgba(255,80,80,0.5); color: #ff5050; }
  .edit-btn:hover { border-color: rgba(100,160,255,0.5); color: #64a0ff; }
  .delete-btn { margin-left: 4px; }

  .comments-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .comments-title {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: var(--text-primary, #f0f0f0);
  }
  .comments-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .comment {
    padding: 14px 18px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
  }
  .comment:hover {
    background: rgba(255,255,255,0.06);
  }
  .comment-content { font-size: 0.95em; line-height: 1.6; color: var(--text-primary, #e0e0e0); white-space: pre-wrap; word-break: break-word; }
  .comment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  .comment-date { font-size: 0.8em; color: var(--text-secondary, #888); }
  .comment-delete-btn {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: var(--text-secondary, #888);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.75em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .comment-delete-btn:hover { border-color: rgba(255,80,80,0.4); color: #ff5050; }

  .comment-form-wrap {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(12px);
  }
  .comment-form { display: flex; flex-direction: column; gap: 12px; }
  .comment-input-area { position: relative; }
  .comment-input-area textarea {
    width: 100%;
    padding: 14px 48px 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95em;
    line-height: 1.6;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .comment-input-area textarea:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .emoji-toggle-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06);
    font-size: 1.1em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 2;
  }
  .emoji-toggle-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.08);
  }
  .emoji-panel {
    display: none;
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: rgba(30, 30, 40, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 10;
    animation: emojiSlideUp 0.2s ease;
  }
  .emoji-panel.open { display: block; }
  @keyframes emojiSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .emoji-item {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .emoji-item:hover {
    background: rgba(255,255,255,0.12);
    transform: scale(1.2);
  }
  .comment-bottom-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .comment-bottom-row input {
    flex: 1;
    max-width: 220px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.9em;
    transition: border-color 0.2s, background 0.2s;
  }
  .comment-bottom-row input:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.07);
  }
  .comment-submit-btn {
    padding: 10px 24px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(100, 160, 255, 0.2);
    white-space: nowrap;
  }
  .comment-submit-btn:hover {
    background: linear-gradient(135deg, rgba(100, 160, 255, 1), rgba(80, 130, 255, 1));
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.4);
  }
  .comment-submit-btn:active { transform: translateY(0); }

  .pw-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .pw-modal-overlay.open { display: flex; }
  .pw-modal {
    background: rgba(30, 30, 45, 0.97);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 28px;
    width: 340px;
    max-width: 90vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    animation: modalSlideUp 0.25s ease;
  }
  @keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .pw-modal-title {
    font-size: 1.1em;
    font-weight: 700;
    color: var(--text-primary, #f0f0f0);
    text-align: center;
    margin-bottom: 18px;
  }
  .pw-modal-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: var(--text-primary, #f0f0f0);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.95em;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .pw-modal-input:focus {
    outline: none;
    border-color: rgba(100, 160, 255, 0.5);
    background: rgba(255,255,255,0.08);
  }
  .pw-modal-error {
    color: #ff6b6b;
    font-size: 0.82em;
    min-height: 20px;
    margin-top: 6px;
    text-align: center;
  }
  .pw-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
  }
  .pw-modal-cancel {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--text-secondary, #999);
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 500;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pw-modal-cancel:hover {
    border-color: rgba(255,255,255,0.25);
    color: var(--text-primary, #f0f0f0);
  }
  .pw-modal-confirm {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, rgba(100, 160, 255, 0.85), rgba(80, 130, 255, 0.9));
    color: #fff;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(100, 160, 255, 0.2);
  }
  .pw-modal-confirm:hover {
    background: linear-gradient(135deg, rgba(100, 160, 255, 1), rgba(80, 130, 255, 1));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(100, 160, 255, 0.35);
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
    this.shadowRoot.innerHTML = `
      <style>${formStyles}</style>
      <div class="form-card">
        <h2 class="form-title">${isEdit ? '글 수정' : '새 글 작성'}</h2>
        <div id="post-form">
          <input type="text" name="title" placeholder="제목" value="${isEdit ? escapeAttr(existing.title) : ''}" required maxlength="100">
          <div class="form-group">
            <label for="image_url">이미지 URL (선택)</label>
            <input type="url" name="image_url" id="image_url" placeholder="https://example.com/image.jpg" value="${isEdit ? escapeAttr(existing.image_url || '') : ''}" maxlength="500">
          </div>
          <div class="textarea-wrap">
            <textarea name="content" placeholder="내용을 입력하세요..." rows="10" required maxlength="5000">${isEdit ? escapeHtml(existing.content) : ''}</textarea>
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
        ${post.image_url ? `<div class="post-image"><img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" loading="lazy"></div>` : ''}
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '"').replace(/'/g, ''');
}

customElements.define('gallery-post', GalleryPost);