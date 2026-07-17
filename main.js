
import './news-widget.js';
import './fortune-widget.js';

class PageHeader extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    const title = document.createElement('h1');
    title.textContent = this.getAttribute('title');

    const subtitle = document.createElement('p');
    subtitle.textContent = this.getAttribute('subtitle');

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      .wrapper {
        text-align: center;
        animation: fadeInDown 1s ease-out;
      }
      h1 {
        font-size: clamp(2.5rem, 8cqi, 4rem);
        margin: 0;
        font-weight: 800;
        letter-spacing: -0.02em;
        background: linear-gradient(to bottom, #ffffff, #e0e0e0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 10px 20px rgba(0,0,0,0.2);
      }
      p {
        font-size: 1.25rem;
        margin-block-start: 0.5rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        text-transform: uppercase;
        letter-spacing: 0.2em;
      }
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    wrapper.appendChild(title);
    wrapper.appendChild(subtitle);
  }
}

class SocialLinks extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    const links = [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'LinkedIn', url: 'https://linkedin.com' },
      { name: 'Blog', url: 'https://naver.com' },
    ];

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.textContent = link.name;
      wrapper.appendChild(a);
    });

    const style = document.createElement('style');
    style.textContent = `
      .wrapper {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-block-start: 1rem;
      }
      a {
        color: var(--primary-oklch, #4a90e2);
        text-decoration: none;
        font-size: 1.1rem;
        font-weight: 700;
        padding: 0.5rem 1.2rem;
        border-radius: 12px;
        background: oklch(1 0 0 / 0.4);
        border: 1px solid var(--border-glass, rgba(255,255,255,0.3));
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      }
      a:hover {
        background: var(--primary-oklch, #4a90e2);
        color: white;
        transform: translateY(-5px);
        box-shadow: 0 10px 20px -5px var(--primary-glow, rgba(74,144,226,0.4));
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
  }
}

customElements.define('page-header', PageHeader);
customElements.define('social-links', SocialLinks);
