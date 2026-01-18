
class NewsWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.fetchNews();
  }

  async fetchNews() {
    const category = this.getAttribute('category') || 'general';
    let rssUrl = '';
    let categoryTitle = '';

    switch (category) {
      case 'business':
        rssUrl = 'https://www.mk.co.kr/rss/30100041/';
        categoryTitle = '경제';
        break;
      case 'technology':
        rssUrl = 'https://www.zdnet.co.kr/rss/topic/technology.xml';
        categoryTitle = 'IT';
        break;
      default:
        rssUrl = 'https://www.yonhapnewstv.co.kr/browse/feed/';
        categoryTitle = '주요 뉴스';
        break;
    }

    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('뉴스 정보를 가져오는 데 실패했습니다.');
      }
      const data = await response.json();
      this.renderNews(data.items, categoryTitle);
    } catch (error) {
      this.shadowRoot.innerHTML = `<p>${error.message}</p>`;
    }
  }

  renderNews(articles, title) {
    const style = `
      h3 {
        font-size: 1.2rem;
        color: #333;
        margin-bottom: 1rem;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      li:last-child {
        border-bottom: none;
      }
      a {
        text-decoration: none;
        color: #333;
        font-weight: normal;
        font-size: 0.9rem;
      }
      a:hover {
        text-decoration: underline;
        color: #007bff;
      }
    `;

    const newsList = articles.slice(0, 5).map(article => `
      <li><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></li>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <h3>${title}</h3>
      <ul>${newsList}</ul>
    `;
  }
}

customElements.define('news-widget', NewsWidget);
