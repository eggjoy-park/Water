class NewsWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.fetchNews();
  }

  async fetchNews() {
    // Note: Using a proxy to bypass CORS issues with the News API on the client-side.
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const apiUrl = '/api/news-proxy'; // This should be your proxy endpoint that securely calls News API

    try {
      const response = await fetch(`${proxyUrl}${apiUrl}`);
      if (!response.ok) {
        throw new Error('뉴스 정보를 가져오는 데 실패했습니다.');
      }
      const data = await response.json();
      this.renderNews(data.articles);
    } catch (error) {
      this.shadowRoot.innerHTML = `<p>${error.message}</p>`;
    }
  }

  renderNews(articles) {
    const style = `
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin-bottom: 10px;
        cursor: pointer;
      }
      a {
        text-decoration: none;
        color: #333;
        font-weight: bold;
      }
      .modal {
        display: none;
        position: fixed;
        z-index: 1;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
      }
      .modal-content {
        background-color: #fefefe;
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
      }
      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
      }
    `;

    const newsList = articles.map(article => `
      <li><a href="#" data-url="${article.url}">${article.title}</a></li>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <ul>${newsList}</ul>
      <div id="newsModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <iframe id="newsFrame" width="100%" height="500px"></iframe>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = e.target.dataset.url;
        this.openModal(url);
      });
    });

    this.shadowRoot.querySelector('.close').addEventListener('click', () => {
      this.closeModal();
    });
  }

  openModal(url) {
    this.shadowRoot.getElementById('newsFrame').src = url;
    this.shadowRoot.getElementById('newsModal').style.display = 'block';
  }

  closeModal() {
    this.shadowRoot.getElementById('newsModal').style.display = 'none';
  }
}

customElements.define('news-widget', NewsWidget);
