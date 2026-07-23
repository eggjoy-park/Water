const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
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
      const res = await fetch(`${API_BASE}/api/posts?page=${this.page}`);
      const data = await res.json();
      this.posts = data.posts || [];
      this.totalPages = data.totalPages || 1;
      this.render();
      this.renderPagination(data.total || 0);
    } catch (err) {
      this.shadowRoot.innerHTML = `<p class="error">게시글을 불러오는 데 실패했습니다.</p>`;
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
        <div class="empty">아직 게시글이 없습니다.<br><a href="post.html" class="write-link">첫 글 작성하기</a></div>
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
              <a href="post.html?id=${p.id}" class="gallery-image-wrap">
                <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy">
              </a>
            ` : `
              <a href="post.html?id=${p.id}" class="gallery-image-wrap no-image">
                <div class="no-image-placeholder">
                  <span>📷</span>
                  <span>이미지 없음</span>
                </div>
              </a>
            `}
            <div class="gallery-info">
              <h3 class="gallery-title"><a href="post.html?id=${p.id}">${escapeHtml(p.title)}</a></h3>
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

customElements.define('gallery-list', BoardGallery);