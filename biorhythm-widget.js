class BiorhythmWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.birthDate = '';
    this.birthYear = '';
    this.birthMonth = '';
    this.birthDay = '';
  }

  connectedCallback() {
    this.render();
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
    this.render();
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

  render() {
    const style = `
      :host {
        display: block;
      }
      .biorhythm-wrapper {
        font-family: 'Noto Sans KR', sans-serif;
      }
      .biorhythm-card-wrapper {
        border: 1px solid #dde1ff;
        border-radius: 20px;
        padding: 22px;
        background: #fff;
        box-shadow: 0 12px 26px rgba(0, 0, 0, 0.08);
        min-width: 0;
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
        .biorhythm-form {
          grid-template-columns: 1fr;
        }
        .biorhythm-form button {
          grid-column: auto;
          width: 100%;
        }
      }
      .biorhythm-graph svg {
        width: 100%;
        height: auto;
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
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="biorhythm-wrapper">
        <div class="biorhythm-card-wrapper">
          <form class="biorhythm-form" id="biorhythm-form">
            <label>생년월일을 숫자로 입력하세요</label>
            <input id="birth-year" type="text" inputmode="numeric" maxlength="4" placeholder="YYYY" value="${this.birthYear}" />
            <input id="birth-month" type="text" inputmode="numeric" maxlength="2" placeholder="MM" value="${this.birthMonth}" />
            <input id="birth-day" type="text" inputmode="numeric" maxlength="2" placeholder="DD" value="${this.birthDay}" />
            <button type="submit">보기</button>
          </form>
          ${this.getBiorhythmHtml(this.birthDate)}
        </div>
      </div>
    `;

    const form = this.shadowRoot.querySelector('#biorhythm-form');
    form.addEventListener('submit', event => this.onBirthDateSubmit(event));

    this.shadowRoot.querySelector('#birth-year').addEventListener('input', event => this.handleDateInput(event));
    this.shadowRoot.querySelector('#birth-month').addEventListener('input', event => this.handleDateInput(event));
    this.shadowRoot.querySelector('#birth-day').addEventListener('input', event => this.handleDateInput(event));
  }
}

customElements.define('biorhythm-widget', BiorhythmWidget);
