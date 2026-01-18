class NewsWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedCategory = this.getAttribute('category') || 'general';
  }

  connectedCallback() {
    this.render();
    this.fetchNews();
  }

  async fetchNews() {
    let rssUrl = '';

    switch (this.selectedCategory) {
      case 'business':
        rssUrl = 'https://www.mk.co.kr/rss/30100041/';
        break;
      case 'technology':
        rssUrl = 'https://www.zdnet.co.kr/rss/topic/technology.xml';
        break;
      default: // general
        rssUrl = 'https://www.yonhapnewstv.co.kr/browse/feed/';
        break;
    }

    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('뉴스 정보를 가져오는 데 실패했습니다.');
      }
      const data = await response.json();
      this.renderNews(data.items);
    } catch (error) {
      this.updateNewsList(`<p>${error.message}</p>`);
    }
  }

  render() {
    const style = `
      .news-widget-container {
        font-family: 'Noto Sans KR', sans-serif;
      }
      .category-buttons {
        margin-bottom: 1rem;
      }
      .category-buttons button {
        border: 1px solid #ddd;
        background-color: #f9f9f9;
        padding: 0.5rem 1rem;
        cursor: pointer;
        border-radius: 8px;
        margin-right: 0.5rem;
      }
      .category-buttons button.active {
        background-color: #007bff;
        color: white;
        border-color: #007bff;
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

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="news-widget-container">
        <div class="category-buttons">
          <button data-category="general" class="${this.selectedCategory === 'general' ? 'active' : ''}">주요 뉴스</button>
          <button data-category="business" class="${this.selectedCategory === 'business' ? 'active' : ''}">경제</button>
          <button data-category="technology" class="${this.selectedCategory === 'technology' ? 'active' : ''}">IT</button>
        </div>
        <div id="news-list"></div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.category-buttons button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.selectedCategory = e.target.dataset.category;
        this.updateActiveButton();
        this.fetchNews();
      });
    });
  }

  updateActiveButton() {
      this.shadowRoot.querySelectorAll('.category-buttons button').forEach(button => {
          if (button.dataset.category === this.selectedCategory) {
              button.classList.add('active');
          } else {
              button.classList.remove('active');
          }
      });
  }

  renderNews(articles) {
    const shuffledArticles = this.shuffleArray(articles);
    const newsList = shuffledArticles.slice(0, 5).map(article => `
      <li><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></li>
    `).join('');

    this.updateNewsList(`<ul>${newsList}</ul>`);
  }
  
  updateNewsList(content) {
      this.shadowRoot.getElementById('news-list').innerHTML = content;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

customElements.define('news-widget', NewsWidget);