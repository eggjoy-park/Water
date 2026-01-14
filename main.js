
class PageHeader extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    const title = document.createElement('h1');
    title.textContent = this.getAttribute('title');

    const subtitle = document.createElement('p');
    subtitle.textContent = this.getAttribute('subtitle');

    const style = document.createElement('style');
    style.textContent = `
      .wrapper {
        text-align: center;
      }
      h1 {
        font-size: 2.5rem;
        margin: 0;
        font-weight: 700;
      }
      p {
        font-size: 1.2rem;
        margin: 0;
        color: #666;
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
    wrapper.setAttribute('class', 'wrapper');

    const links = [
      { name: 'GitHub', url: '#' },
      { name: 'LinkedIn', url: '#' },
      { name: 'Twitter', url: '#' },
    ];

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      wrapper.appendChild(a);
    });

    const style = document.createElement('style');
    style.textContent = `
      .wrapper {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }
      a {
        color: var(--primary-color);
        text-decoration: none;
        font-size: 1.1rem;
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
  }
}

customElements.define('page-header', PageHeader);
customElements.define('social-links', SocialLinks);
