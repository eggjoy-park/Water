class FortuneWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.renderFortune();
  }

  getSeed() {
    const now = new Date();
    return Math.floor((now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()) % 1000);
  }

  randomValue(seed) {
    return ((seed * 9301 + 49297) % 233280) / 233280;
  }

  pick(array, offset) {
    const seed = this.getSeed() + offset;
    const index = Math.floor(this.randomValue(seed) * array.length);
    return array[index];
  }

  renderFortune() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const fortunes = {
      overall: [
        '오늘은 차분하게 하나씩 정리하면 좋은 결과를 얻을 수 있어요.',
        '새로운 만남이나 기회가 찾아올 수 있는 날입니다.',
        '작은 변화가 큰 성과로 이어질 수 있으니 주의를 기울여 보세요.',
        '자신감 있는 한 걸음이 행운을 부를 수 있습니다.',
        '오늘은 여유를 가지면 예상 밖의 좋은 기회를 발견할 수 있습니다.',
      ],
      love: [
        '대화를 통해 좋은 관계를 쌓을 수 있는 날입니다.',
        '마음이 가는 사람과 자연스럽게 가까워질 수 있어요.',
        '조금 더 솔직하게 표현하면 관계가 좋아질 수 있습니다.',
        '작은 배려가 큰 감동을 줄 수 있는 하루입니다.',
        '서로의 차이를 이해하는 마음이 필요합니다.',
      ],
      money: [
        '지출을 한 번 더 점검하면 불필요한 비용을 줄일 수 있습니다.',
        '작은 수입이 쌓여 큰 안정감을 만들어줄 수 있어요.',
        '투자나 계획을 세우기에 좋은 시기입니다.',
        '급한 결정보다는 신중하게 고민하는 편이 유리합니다.',
        '실수가 아닌 경험으로 받아들이면 더 나은 재정 관리가 가능합니다.',
      ],
      work: [
        '집중력이 좋아져 목표를 빠르게 달성할 수 있습니다.',
        '협력과 소통이 오늘의 업무를 순조롭게 만들어줍니다.',
        '새로운 아이디어를 공유하면 긍정적인 반응을 얻을 수 있어요.',
        '작은 성취를 쌓으며 자신감을 키우기에 좋습니다.',
        '계획을 정리하면 남은 과제가 더 명확해집니다.',
      ],
    };

    const overall = this.pick(fortunes.overall, 1);
    const love = this.pick(fortunes.love, 2);
    const money = this.pick(fortunes.money, 3);
    const work = this.pick(fortunes.work, 4);
    const luckyScore = Math.floor(this.randomValue(this.getSeed() + 5) * 40) + 60;

    const style = `
      :host {
        display: block;
      }
      .fortune-card {
        font-family: 'Noto Sans KR', sans-serif;
        position: relative;
        border: 1px solid rgba(124, 58, 237, 0.12);
        border-radius: 22px;
        padding: 24px;
        background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
        box-shadow: 0 18px 44px rgba(76, 29, 149, 0.10);
        overflow: hidden;
      }
      .fortune-card::before {
        content: '';
        position: absolute;
        top: -60%;
        left: -20%;
        width: 60%;
        height: 220%;
        background: radial-gradient(circle, rgba(236, 72, 153, 0.10) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
      }
      .fortune-card::after {
        content: '';
        position: absolute;
        bottom: -40%;
        right: -20%;
        width: 60%;
        height: 180%;
        background: radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
      }
      .fortune-card > * { position: relative; z-index: 1; }

      .fortune-card-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 4px;
        animation: fortuneSlideIn 0.5s ease-out both;
      }
      .fortune-card-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        letter-spacing: 0.4px;
      }
      .fortune-sparkle {
        font-size: 1rem;
        display: inline-block;
        animation: sparkleTwinkle 2.4s ease-in-out infinite;
      }
      .fortune-sparkle:last-child { animation-delay: 1.2s; }
      @keyframes sparkleTwinkle {
        0%, 100% { opacity: 0.5; transform: scale(0.85) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.2) rotate(25deg); }
      }

      .fortune-date {
        font-size: 0.85rem;
        color: #94a3b8;
        text-align: center;
        margin-bottom: 18px;
        letter-spacing: 0.4px;
        font-weight: 500;
        animation: fortuneSlideIn 0.5s ease-out 0.1s both;
      }

      .fortune-score-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 4px auto 24px;
        width: 144px;
        height: 144px;
        animation: fortuneSlideIn 0.5s ease-out 0.2s both;
      }
      .fortune-score-ring {
        position: absolute;
        inset: 0;
      }
      .fortune-score-ring-bg { fill: none; stroke: #eef2ff; stroke-width: 10; }
      .fortune-score-progress {
        fill: none;
        stroke-width: 10;
        stroke-linecap: round;
        transform-box: fill-box;
        transform-origin: center;
        transform: rotate(-90deg);
        animation: scoreFill 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
      }
      @keyframes scoreFill {
        from { stroke-dashoffset: 377; }
      }
      .fortune-score-text {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        z-index: 1;
      }
      .fortune-score-text strong {
        font-size: 2.1rem;
        font-weight: 800;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #f59e0b 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        line-height: 1;
      }
      .fortune-score-text small {
        font-size: 0.68rem;
        color: #94a3b8;
        letter-spacing: 2px;
        font-weight: 700;
        margin-top: 4px;
      }
      .fortune-score-sparkles {
        position: absolute;
        inset: -14px;
        pointer-events: none;
      }
      .fortune-score-sparkles .sp {
        position: absolute;
        font-size: 0.9rem;
        opacity: 0.85;
        animation: sparkleFloat 3s ease-in-out infinite;
      }
      .fortune-score-sparkles .sp1 { top: 8%; left: 4%; color: #fbbf24; }
      .fortune-score-sparkles .sp2 { top: 14%; right: -4%; color: #a78bfa; animation-delay: 0.4s; }
      .fortune-score-sparkles .sp3 { bottom: 18%; right: 6%; color: #ec4899; animation-delay: 0.8s; }
      .fortune-score-sparkles .sp4 { bottom: 8%; left: -4%; color: #fbbf24; animation-delay: 1.2s; }
      .fortune-score-sparkles .sp5 { top: 50%; left: -12%; color: #a78bfa; animation-delay: 1.6s; }
      .fortune-score-sparkles .sp6 { top: -2%; left: 42%; color: #ec4899; animation-delay: 2s; }
      @keyframes sparkleFloat {
        0%, 100% { transform: translateY(0) scale(0.7); opacity: 0.45; }
        50% { transform: translateY(-8px) scale(1.15); opacity: 1; }
      }

      .fortune-overall-card {
        position: relative;
        padding: 18px 22px;
        border-radius: 16px;
        background: linear-gradient(135deg, #fef7ff 0%, #fff8ee 100%);
        border: 1px solid rgba(236, 72, 153, 0.18);
        margin-bottom: 16px;
        animation: fortuneSlideIn 0.5s ease-out 0.35s both;
      }
      .fortune-overall-card p {
        margin: 0;
        font-size: 0.96rem;
        line-height: 1.7;
        color: #475569;
        font-weight: 500;
        text-align: center;
      }
      .quote-mark {
        position: absolute;
        font-size: 2.4rem;
        color: #ec4899;
        opacity: 0.18;
        font-family: Georgia, serif;
        font-weight: 700;
        line-height: 1;
      }
      .quote-mark.start { top: 4px; left: 12px; }
      .quote-mark.end { bottom: -10px; right: 14px; }

      .fortune-items {
        display: grid;
        gap: 10px;
      }
      .fortune-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #f1f5f9;
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        position: relative;
        overflow: hidden;
        animation: fortuneSlideIn 0.5s ease-out both;
      }
      .fortune-item:nth-of-type(1) { animation-delay: 0.5s; }
      .fortune-item:nth-of-type(2) { animation-delay: 0.6s; }
      .fortune-item:nth-of-type(3) { animation-delay: 0.7s; }
      .fortune-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.10);
      }
      .fortune-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
      }
      .fortune-item-icon {
        flex-shrink: 0;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        color: #fff;
        position: relative;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.10);
      }
      .fortune-item-icon::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.30) 0%, transparent 60%);
        pointer-events: none;
      }
      .fortune-item-body {
        flex: 1;
        min-width: 0;
      }
      .fortune-item-body strong {
        display: block;
        font-size: 0.92rem;
        font-weight: 700;
        margin-bottom: 4px;
        letter-spacing: 0.3px;
      }
      .fortune-item-body span {
        display: block;
        font-size: 0.88rem;
        color: #64748b;
        line-height: 1.55;
      }

      .fortune-item-love { border-color: rgba(236, 72, 153, 0.18); }
      .fortune-item-love::before { background: linear-gradient(180deg, #fda4af, #ec4899); }
      .fortune-item-love .fortune-item-icon { background: linear-gradient(135deg, #fda4af 0%, #ec4899 100%); }
      .fortune-item-love:hover { border-color: rgba(236, 72, 153, 0.45); box-shadow: 0 14px 30px rgba(236, 72, 153, 0.18); }
      .fortune-item-love .fortune-item-body strong { color: #be185d; }

      .fortune-item-money { border-color: rgba(245, 158, 11, 0.18); }
      .fortune-item-money::before { background: linear-gradient(180deg, #fcd34d, #f59e0b); }
      .fortune-item-money .fortune-item-icon { background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%); }
      .fortune-item-money:hover { border-color: rgba(245, 158, 11, 0.45); box-shadow: 0 14px 30px rgba(245, 158, 11, 0.18); }
      .fortune-item-money .fortune-item-body strong { color: #b45309; }

      .fortune-item-work { border-color: rgba(79, 70, 229, 0.18); }
      .fortune-item-work::before { background: linear-gradient(180deg, #818cf8, #4f46e5); }
      .fortune-item-work .fortune-item-icon { background: linear-gradient(135deg, #818cf8 0%, #4f46e5 100%); }
      .fortune-item-work:hover { border-color: rgba(79, 70, 229, 0.45); box-shadow: 0 14px 30px rgba(79, 70, 229, 0.18); }
      .fortune-item-work .fortune-item-body strong { color: #3730a3; }

      @keyframes fortuneSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .fortune-sparkle,
        .fortune-score-sparkles .sp,
        .fortune-score-progress,
        .fortune-card-header,
        .fortune-date,
        .fortune-score-wrap,
        .fortune-overall-card,
        .fortune-item {
          animation: none;
        }
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <section class="fortune-card">
        <div class="fortune-card-header">
          <span class="fortune-sparkle" aria-hidden="true">✨</span>
          <h3>오늘의 운세</h3>
          <span class="fortune-sparkle" aria-hidden="true">✨</span>
        </div>
        <div class="fortune-date">${formattedDate}</div>
        <div class="fortune-score-wrap" role="img" aria-label="행운 지수 ${luckyScore}%">
          <div class="fortune-score-sparkles" aria-hidden="true">
            <span class="sp sp1">✦</span>
            <span class="sp sp2">✧</span>
            <span class="sp sp3">✦</span>
            <span class="sp sp4">✧</span>
            <span class="sp sp5">✦</span>
            <span class="sp sp6">✧</span>
          </div>
          <svg class="fortune-score-ring" viewBox="0 0 144 144" width="144" height="144" aria-hidden="true">
            <defs>
              <linearGradient id="fortuneScoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#7c3aed"/>
                <stop offset="50%" stop-color="#ec4899"/>
                <stop offset="100%" stop-color="#f59e0b"/>
              </linearGradient>
            </defs>
            <circle class="fortune-score-ring-bg" cx="72" cy="72" r="60" />
            <circle class="fortune-score-progress" cx="72" cy="72" r="60"
                    stroke="url(#fortuneScoreGrad)"
                    stroke-dasharray="${(2 * Math.PI * 60).toFixed(2)}"
                    stroke-dashoffset="${(2 * Math.PI * 60 * (1 - luckyScore / 100)).toFixed(2)}" />
          </svg>
          <div class="fortune-score-text">
            <strong>${luckyScore}%</strong>
            <small>행운 지수</small>
          </div>
        </div>
        <div class="fortune-overall-card">
          <span class="quote-mark start" aria-hidden="true">"</span>
          <p>${overall}</p>
          <span class="quote-mark end" aria-hidden="true">"</span>
        </div>
        <div class="fortune-items">
          <div class="fortune-item fortune-item-love">
            <div class="fortune-item-icon" aria-hidden="true">💗</div>
            <div class="fortune-item-body">
              <strong>연애</strong>
              <span>${love}</span>
            </div>
          </div>
          <div class="fortune-item fortune-item-money">
            <div class="fortune-item-icon" aria-hidden="true">💰</div>
            <div class="fortune-item-body">
              <strong>금전</strong>
              <span>${money}</span>
            </div>
          </div>
          <div class="fortune-item fortune-item-work">
            <div class="fortune-item-icon" aria-hidden="true">⚡</div>
            <div class="fortune-item-body">
              <strong>일</strong>
              <span>${work}</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('fortune-widget', FortuneWidget);
