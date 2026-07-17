class FlipClock {
    constructor() {
        this.cards = {};
        this.prev = {};
        this.is24Hour = true;

        const ids = ['hours-tens', 'hours-ones', 'minutes-tens', 'minutes-ones', 'seconds-tens', 'seconds-ones'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            this.cards[id] = {
                topDigit: el.querySelector('.card-top .card-digit'),
                bottomDigit: el.querySelector('.card-bottom .card-digit'),
                flapFrontDigit: el.querySelector('.flap-front .card-digit'),
                flapBackDigit: el.querySelector('.flap-back .card-digit'),
                flapEl: el.querySelector('.flap'),
                card: el
            };
            this.prev[id] = null;
        });

        this.dateEl = document.getElementById('date');
        this.ampmEl = document.getElementById('ampm');
        this.formatBtn = document.getElementById('format-btn');
        this.formatText = document.getElementById('format-text');
        this.formatBtn.addEventListener('click', () => this.toggleFormat());

        // 달력
        this.calPanel = document.getElementById('calendar-panel');
        this.calTitle = document.getElementById('cal-title');
        this.calDays = document.getElementById('cal-days');
        this.calYear = new Date().getFullYear();
        this.calMonth = new Date().getMonth();
        this.calOpen = false;

        this.dateEl.addEventListener('click', () => this.toggleCalendar());
        document.getElementById('cal-close').addEventListener('click', () => this.closeCalendar());
        document.getElementById('cal-prev').addEventListener('click', () => this.calNav(-1));
        document.getElementById('cal-next').addEventListener('click', () => this.calNav(1));

        this.tick();
        setInterval(() => this.tick(), 1000);
    }

    toggleFormat() {
        this.is24Hour = !this.is24Hour;
        this.formatText.textContent = this.is24Hour ? '24H' : '12H';
        this.ampmEl.classList.toggle('visible', !this.is24Hour);
        Object.keys(this.prev).forEach(id => this.prev[id] = null);
        this.tick();
    }

    tick() {
        const now = new Date();
        let h = now.getHours();
        let ampm = '';
        if (!this.is24Hour) {
            ampm = h < 12 ? 'AM' : 'PM';
            h = h % 12 || 12;
        }
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const hs = String(h).padStart(2, '0');

        this.ampmEl.textContent = ampm;
        this.flip('hours-tens', hs[0]);
        this.flip('hours-ones', hs[1]);
        this.flip('minutes-tens', m[0]);
        this.flip('minutes-ones', m[1]);
        this.flip('seconds-tens', s[0]);
        this.flip('seconds-ones', s[1]);

        this.dateEl.textContent = now.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });
    }

    flip(id, val) {
        if (this.prev[id] === val) return;

        const c = this.cards[id];

        if (this.prev[id] === null) {
            c.topDigit.textContent = val;
            c.bottomDigit.textContent = val;
            c.flapFrontDigit.textContent = val;
            c.flapBackDigit.textContent = val;
            this.prev[id] = val;
            return;
        }

        const old = this.prev[id];

        c.topDigit.textContent = val;
        c.flapFrontDigit.textContent = old;
        c.flapBackDigit.textContent = val;

        c.card.classList.remove('flipping');
        void c.flapEl.offsetWidth;
        c.card.classList.add('flipping');

        setTimeout(() => {
            c.bottomDigit.textContent = val;
        }, 175);

        setTimeout(() => {
            c.card.classList.remove('flipping');
            c.flapFrontDigit.textContent = val;
            c.flapBackDigit.textContent = val;
        }, 350);

        this.prev[id] = val;
    }

    /* ===== 달력 ===== */
    toggleCalendar() {
        if (this.calOpen) {
            this.closeCalendar();
        } else {
            this.openCalendar();
        }
    }

    openCalendar() {
        const now = new Date();
        this.calYear = now.getFullYear();
        this.calMonth = now.getMonth();
        this.renderCalendar();
        this.calPanel.classList.add('open');
        this.calOpen = true;
    }

    closeCalendar() {
        this.calPanel.classList.remove('open');
        this.calOpen = false;
    }

    calNav(dir) {
        this.calMonth += dir;
        if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
        if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
        this.renderCalendar();
    }

    renderCalendar() {
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
                            '7월', '8월', '9월', '10월', '11월', '12월'];
        this.calTitle.textContent = `${this.calYear}년 ${monthNames[this.calMonth]}`;

        const firstDay = new Date(this.calYear, this.calMonth, 1).getDay();
        const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();

        let html = '';
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-day empty"></div>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = (firstDay + d - 1) % 7;
            let cls = 'cal-day';
            if (d === todayDate && this.calMonth === todayMonth && this.calYear === todayYear) cls += ' today';
            if (dayOfWeek === 0) cls += ' sunday';
            if (dayOfWeek === 6) cls += ' saturday';
            html += `<div class="${cls}">${d}</div>`;
        }
        this.calDays.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => new FlipClock());