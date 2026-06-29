class FortuneWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.birthDate = '';
    this.birthYear = '';
    this.birthMonth = '';
    this.birthDay = '';
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

  isValidDate(dateString) {
    const date = new Date(dateString);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === dateString
    );
  }

  calculateBiorhythm(birthDate) {
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((today - birth) / msPerDay);

    const cycles = {
      physical: Math.sin((2 * Math.PI * diffDays) / 23),
      emotional: Math.sin((2 * Math.PI * diffDays) / 28),
      intellectual: Math.sin((2 * Math.PI * diffDays) / 33),
    };

    return {
      physical: cycles.physical,
      emotional: cycles.emotional,
      intellectual: cycles.intellectual,
      days: diffDays,
    };
  }

  getCycleSeries(birthDate, length = 15) {
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((today - birth) / msPerDay);
    const offset = Math.floor((length - 1) / 2);

    return Array.from({ length }, (_, index) => {
      const day = diffDays + (index - offset);
      return {
        label: index === offset ? '오늘' : `${index - offset}`,
        physical: Math.sin((2 * Math.PI * day) / 23),
        emotional: Math.sin((2 * Math.PI * day) / 28),
        intellectual: Math.sin((2 * Math.PI * day) / 33),
      };
    });
  }

  describeCycle(value) {
    const strength = Math.round(value * 100);
    let status = '보통';
    if (Math.abs(value) < 0.1) {
      status = '전환기';
    } else if (value >= 0.6) {
      status = '최상';
    } else if (value <= -0.6) {
      status = '주의';
    } else if (value > 0) {
      status = '긍정적';
    } else {
      status = '부정적';
    }
    return { strength, status };
  }

  getBiorhythmGraphSvg(series) {
    if (!series || series.length === 0) return '';

    const width = 380;
    const height = 200;
    const padTop = 26;
    const padBottom = 32;
    const padLeft = 38;
    const padRight = 18;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;
    const points = series.length;
    const step = innerW / (points - 1);
    const midY = padTop + innerH / 2;
    const todayIndex = Math.floor((points - 1) / 2);

    const toX = i => padLeft + i * step;
    const toY = v => padTop + innerH * (1 - (v + 1) / 2);

    const ptsFor = key => series.map((item, i) => ({ x: toX(i), y: toY(item[key]) }));

    // Catmull-Rom → Cubic Bezier (smooth interpolation)
    const smoothPath = pts => {
      if (pts.length < 2) return '';
      const parts = [`M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        parts.push(
          `C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
        );
      }
      return parts.join(' ');
    };

    const areaPath = pts => {
      const line = smoothPath(pts);
      const firstX = pts[0].x.toFixed(2);
      const lastX = pts[pts.length - 1].x.toFixed(2);
      return `${line} L${lastX} ${midY.toFixed(2)} L${firstX} ${midY.toFixed(2)} Z`;
    };

    const palette = {
      physical: '#3b82f6',
      emotional: '#f97316',
      intellectual: '#10b981',
    };
    const fontFamily = "'Noto Sans KR', system-ui, -apple-system, sans-serif";

    const physPts = ptsFor('physical');
    const emoPts = ptsFor('emotional');
    const intPts = ptsFor('intellectual');

    const ticks = [
      { v: 1, label: '+100%' },
      { v: 0.5, label: '+50%' },
      { v: 0, label: '0' },
      { v: -0.5, label: '-50%' },
      { v: -1, label: '-100%' },
    ];

    const gridLines = ticks
      .map(({ v, label }) => {
        const y = toY(v);
        const isZero = v === 0;
        return `
          <line x1="${padLeft}" y1="${y.toFixed(2)}" x2="${width - padRight}" y2="${y.toFixed(2)}"
                stroke="${isZero ? '#cbd5e1' : '#e2e8f0'}"
                stroke-dasharray="${isZero ? '3 3' : '2 4'}"
                stroke-width="${isZero ? 1 : 0.7}" />
          <text x="${padLeft - 6}" y="${(y + 3).toFixed(2)}" text-anchor="end"
                font-size="9" fill="#94a3b8" font-family="${fontFamily}">${label}</text>
        `;
      })
      .join('');

    const dayLabels = series
      .map((item, i) => {
        const x = toX(i).toFixed(2);
        const isToday = i === todayIndex;
        return `
          <text x="${x}" y="${height - 14}" text-anchor="middle"
                font-size="${isToday ? 10 : 9}"
                font-weight="${isToday ? 700 : 400}"
                fill="${isToday ? '#0f172a' : '#94a3b8'}"
                font-family="${fontFamily}">${item.label}</text>
        `;
      })
      .join('');

    const todayX = toX(todayIndex);
    const todayMarker = `
      <line class="bio-today-marker" x1="${todayX.toFixed(2)}" y1="${padTop}"
            x2="${todayX.toFixed(2)}" y2="${height - padBottom}"
            stroke="#475569" stroke-dasharray="3 3" stroke-width="0.9" opacity="0.55" />
      <rect class="bio-today-badge" x="${(todayX - 17).toFixed(2)}" y="${(padTop - 18).toFixed(2)}"
            width="34" height="15" rx="7.5" fill="#0f172a" />
      <text class="bio-today-badge" x="${todayX.toFixed(2)}" y="${(padTop - 7).toFixed(2)}"
            text-anchor="middle" font-size="9" font-weight="700" fill="#fff"
            font-family="${fontFamily}">오늘</text>
    `;

    const todayPoints = ['physical', 'emotional', 'intellectual']
      .map(key => {
        const item = series[todayIndex];
        const x = toX(todayIndex);
        const y = toY(item[key]);
        return `
          <circle class="bio-today-dot" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="6"
                  fill="${palette[key]}" opacity="0.22" />
          <circle class="bio-today-dot" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4"
                  fill="#fff" stroke="${palette[key]}" stroke-width="2" />
        `;
      })
      .join('');

    const normalPoints = series
      .map((item, i) => {
        if (i === todayIndex) return '';
        const x = toX(i).toFixed(2);
        return `
          <circle cx="${x}" cy="${toY(item.physical).toFixed(2)}" r="1.6"
                  fill="${palette.physical}" opacity="0.78" />
          <circle cx="${x}" cy="${toY(item.emotional).toFixed(2)}" r="1.6"
                  fill="${palette.emotional}" opacity="0.78" />
          <circle cx="${x}" cy="${toY(item.intellectual).toFixed(2)}" r="1.6"
                  fill="${palette.intellectual}" opacity="0.78" />
        `;
      })
      .join('');

    return `
      <div class="biorhythm-graph">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="바이오리듬 그래프">
          <defs>
            <linearGradient id="bioPanelBg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#fbfcff" />
              <stop offset="100%" stop-color="#eef2fb" />
            </linearGradient>
            <linearGradient id="bioAreaPhysical" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${palette.physical}" stop-opacity="0.32" />
              <stop offset="100%" stop-color="${palette.physical}" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="bioAreaEmotional" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${palette.emotional}" stop-opacity="0.32" />
              <stop offset="100%" stop-color="${palette.emotional}" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="bioAreaIntellectual" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${palette.intellectual}" stop-opacity="0.32" />
              <stop offset="100%" stop-color="${palette.intellectual}" stop-opacity="0" />
            </linearGradient>
            <filter id="bioGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bioPanelBg)" rx="14" />
          ${gridLines}
          ${todayMarker}
          <path class="bio-area bio-area-1" d="${areaPath(physPts)}" fill="url(#bioAreaPhysical)" />
          <path class="bio-area bio-area-2" d="${areaPath(emoPts)}" fill="url(#bioAreaEmotional)" />
          <path class="bio-area bio-area-3" d="${areaPath(intPts)}" fill="url(#bioAreaIntellectual)" />
          <path class="bio-line bio-line-1" pathLength="1000" d="${smoothPath(physPts)}"
                fill="none" stroke="${palette.physical}" stroke-width="2.4"
                stroke-linecap="round" stroke-linejoin="round" filter="url(#bioGlow)" />
          <path class="bio-line bio-line-2" pathLength="1000" d="${smoothPath(emoPts)}"
                fill="none" stroke="${palette.emotional}" stroke-width="2.4"
                stroke-linecap="round" stroke-linejoin="round" filter="url(#bioGlow)" />
          <path class="bio-line bio-line-3" pathLength="1000" d="${smoothPath(intPts)}"
                fill="none" stroke="${palette.intellectual}" stroke-width="2.4"
                stroke-linecap="round" stroke-linejoin="round" filter="url(#bioGlow)" />
          ${normalPoints}
          ${todayPoints}
          ${dayLabels}
        </svg>
        <div class="biorhythm-legend">
          <span><strong style="color:${palette.physical};">●</strong> 신체</span>
          <span><strong style="color:${palette.emotional};">●</strong> 감정</span>
          <span><strong style="color:${palette.intellectual};">●</strong> 지능</span>
        </div>
      </div>
    `;
  }

  getBiorhythmHtml(birthDate) {
    if (!birthDate) {
      return `
        <div class="biorhythm-empty">생년월일을 입력하면 오늘의 바이오리듬이 표시됩니다.</div>
      `;
    }

    if (!this.isValidDate(birthDate)) {
      return `
        <div class="biorhythm-empty">유효한 생년월일을 입력해주세요.</div>
      `;
    }

    const result = this.calculateBiorhythm(birthDate);
    const series = this.getCycleSeries(birthDate);
    const physical = this.describeCycle(result.physical);
    const emotional = this.describeCycle(result.emotional);
    const intellectual = this.describeCycle(result.intellectual);

    return `
      <div class="biorhythm-cards">
        <div class="biorhythm-card">
          <strong>신체</strong>
          <span>${physical.strength}%</span>
          <small>${physical.status}</small>
        </div>
        <div class="biorhythm-card">
          <strong>감정</strong>
          <span>${emotional.strength}%</span>
          <small>${emotional.status}</small>
        </div>
        <div class="biorhythm-card">
          <strong>지능</strong>
          <span>${intellectual.strength}%</span>
          <small>${intellectual.status}</small>
        </div>
      </div>
      <p class="biorhythm-info">출생일부터 오늘까지 ${result.days}일이 지났습니다.</p>
      ${this.getBiorhythmGraphSvg(series)}
    `;
  }

  onBirthDateSubmit(event) {
    event.preventDefault();
    const year = this.shadowRoot.querySelector('#birth-year').value;
    const month = this.shadowRoot.querySelector('#birth-month').value.padStart(2, '0');
    const day = this.shadowRoot.querySelector('#birth-day').value.padStart(2, '0');
    this.birthYear = year;
    this.birthMonth = month;
    this.birthDay = day;
    this.birthDate = `${year}-${month}-${day}`;
    this.renderFortune();
  }

  handleDateInput(event) {
    const target = event.target;
    const value = target.value.replace(/[^0-9]/g, '');
    target.value = value;

    if (target.id === 'birth-year' && value.length >= 4) {
      this.shadowRoot.querySelector('#birth-month').focus();
    }
    if (target.id === 'birth-month' && value.length >= 2) {
      this.shadowRoot.querySelector('#birth-day').focus();
    }
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
      .fortune-wrapper {
        display: grid;
        grid-template-columns: minmax(260px, 1fr) minmax(300px, 360px);
        gap: 24px;
        align-items: start;
        max-width: 840px;
        margin: 0 auto;
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

      .biorhythm-card-wrapper {
        font-family: 'Noto Sans KR', sans-serif;
        border: 1px solid #dde1ff;
        border-radius: 20px;
        padding: 22px;
        background: #fff;
        box-shadow: 0 12px 26px rgba(0, 0, 0, 0.08);
        min-width: 0;
      }

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
      @media (max-width: 760px) {
        .fortune-wrapper {
          grid-template-columns: 1fr;
        }
        .fortune-card,
        .biorhythm-card-wrapper {
          padding: 18px;
        }
        .biorhythm-form {
          grid-template-columns: 1fr;
        }
        .biorhythm-form button {
          grid-column: auto;
          width: 100%;
        }
      }
      .fortune-left,
      .fortune-right {
        display: grid;
        gap: 16px;
      }

      .biorhythm-panel {
        padding: 16px;
        border-radius: 20px;
        background: #f8f9ff;
        border: 1px solid #dde1ff;
        box-shadow: inset 0 0 0 1px rgba(44, 78, 239, 0.05);
      }
      .biorhythm-form {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr 0.8fr;
        gap: 8px;
        margin-bottom: 18px;
        align-items: end;
      }
      .biorhythm-form label {
        grid-column: 1 / -1;
        font-size: 0.95rem;
        color: #555;
      }
      .biorhythm-form input {
        width: 100%;
        max-width: 100%;
        padding: 12px 14px;
        border: 1px solid #d9d9d9;
        border-radius: 14px;
        font-size: 1rem;
      }
      #birth-year {
        max-width: 120px;
      }
      #birth-month,
      #birth-day {
        max-width: 90px;
      }
      .biorhythm-form input[type='number']::-webkit-outer-spin-button,
      .biorhythm-form input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .biorhythm-form button {
        grid-column: 3 / 4;
        height: 46px;
        border: none;
        border-radius: 14px;
        background: #2c4edf;
        color: white;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .biorhythm-form button:hover {
        transform: translateY(-2px);
      }
      @media (max-width: 760px) {
        .fortune-wrapper {
          grid-template-columns: 1fr;
        }
        .fortune-card,
        .biorhythm-card-wrapper {
          padding: 18px;
        }
        .biorhythm-form {
          grid-template-columns: 1fr;
        }
        .biorhythm-form button {
          grid-column: auto;
          width: 100%;
        }
      }
      .fortune-right {
        min-width: 0;
      }
      .biorhythm-graph svg {
        width: 100%;
        height: auto;
      }
      .biorhythm-legend {
        gap: 12px;
      }
      .biorhythm-empty {
        padding: 16px;
        background: #f7f8ff;
        border-radius: 16px;
        color: #555;
        text-align: center;
      }
      .biorhythm-cards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }
      .biorhythm-card {
        padding: 18px 16px;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #eef2ff;
        box-shadow: 0 10px 24px rgba(42, 77, 255, 0.06);
        min-height: 130px;
        display: grid;
        gap: 10px;
        justify-items: start;
      }
      .biorhythm-card strong {
        display: block;
        font-size: 0.95rem;
        margin-bottom: 8px;
        color: #1a1a1a;
      }
      .biorhythm-card span {
        font-size: 1.4rem;
        font-weight: 700;
        color: #2c4edf;
      }
      .biorhythm-card small {
        display: block;
        margin-top: 6px;
        color: #666;
      }
      .biorhythm-info {
        margin-top: 18px;
        color: #666;
        font-size: 0.95rem;
      }
      .biorhythm-graph {
        margin-top: 18px;
      }
      .biorhythm-legend {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 12px;
        font-size: 0.9rem;
        color: #555;
      }
      .biorhythm-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="fortune-wrapper">
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
            <span class="quote-mark start" aria-hidden="true">“</span>
            <p>${overall}</p>
            <span class="quote-mark end" aria-hidden="true">”</span>
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
        <section class="biorhythm-card-wrapper">
          <h3>바이오리듬</h3>
          <form class="biorhythm-form" id="biorhythm-form">
            <label>생년월일을 숫자로 입력하세요</label>
            <input id="birth-year" type="text" inputmode="numeric" maxlength="4" placeholder="YYYY" value="${this.birthYear}" />
            <input id="birth-month" type="text" inputmode="numeric" maxlength="2" placeholder="MM" value="${this.birthMonth}" />
            <input id="birth-day" type="text" inputmode="numeric" maxlength="2" placeholder="DD" value="${this.birthDay}" />
            <button type="submit">보기</button>
          </form>
          ${this.getBiorhythmHtml(this.birthDate)}
        </section>
      </div>
    `;

    const form = this.shadowRoot.querySelector('#biorhythm-form');
    form.addEventListener('submit', event => this.onBirthDateSubmit(event));

    this.shadowRoot.querySelector('#birth-year').addEventListener('input', event => this.handleDateInput(event));
    this.shadowRoot.querySelector('#birth-month').addEventListener('input', event => this.handleDateInput(event));
    this.shadowRoot.querySelector('#birth-day').addEventListener('input', event => this.handleDateInput(event));
  }
}

customElements.define('fortune-widget', FortuneWidget);
