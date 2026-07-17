class WeatherWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.fetchWeather();
  }

  getWeatherIcon(weatherCode) {
    const icons = {
      '113': '☀️', // 맑음
      '116': '⛅️', // 부분 흐림
      '119': '☁️', // 흐림
      '122': '☁️', // 온통 흐림
      '143': '🌫', // 안개
      '176': '🌦', // 소나기 가능
      '179': '🌨', // 눈/진눈깨비 가능
      '182': '🌨', // 진눈깨비 가능
      '185': '🌨', // 어는 비 가능
      '200': '⛈', // 천둥 번개 가능
      '227': '🌬️', // 눈보라
      '230': ' severe_blizzard', // 심한 눈보라
      '248': '🌫', // 안개
      '260': '🌫', // 어는 안개
      '263': '🌦', // 가벼운 이슬비
      '266': '🌦', // 가벼운 이슬비
      '281': '🌨', // 어는 이슬비
      '284': '🌨', // 강한 어는 이슬비
      '293': '🌦', // 가벼운 소나기
      '296': '🌦', // 가벼운 비
      '299': '🌧', // 때때로 보통 비
      '302': '🌧', // 보통 비
      '305': '🌧', // 때때로 강한 비
      '308': '🌧', // 강한 비
      '311': '🌨', // 가벼운 어는 비
      '314': '🌨', // 보통/강한 어는 비
      '317': '🌨', // 가벼운 진눈깨비
      '320': '🌨', // 보통/강한 진눈깨비
      '323': '🌨', // 가벼운 눈
      '326': '🌨', // 가벼운 눈
      '329': '雪', // 때때로 보통 눈
      '332': '雪', // 보통 눈
      '335': '🌨', // 때때로 강한 눈
      '338': ' severe_snow', // 강한 눈
      '350': '🌨', // 얼음 알갱이
      '353': '🌦', // 가벼운 비 소나기
      '356': '🌧', // 보통/강한 비 소나기
      '359': '🌧', // 폭우 소나기
      '362': '🌨', // 가벼운 진눈깨비 소나기
      '365': '🌨', // 보통/강한 진눈깨비 소나기
      '368': '🌨', // 가벼운 눈 소나기
      '371': '🌨', // 보통/강한 눈 소나기
      '374': '🌨', // 가벼운 얼음 알갱이 소나기
      '377': '🌨', // 보통/강한 얼음 알갱이 소나기
      '386': '⛈', // 천둥을 동반한 가벼운 비
      '389': '⛈', // 천둥을 동반한 보통/강한 비
      '392': '⛈', // 천둥을 동반한 가벼운 눈
      '395': '⛈', // 천둥을 동반한 보통/강한 눈
    };
    return icons[weatherCode] || ''
  }

  async fetchWeather() {
    try {
      const response = await fetch('https://wttr.in/서울?format=j1&lang=ko');
      if (!response.ok) {
        throw new Error('날씨 정보를 가져오는 데 실패했습니다.');
      }
      const data = await response.json();
      this.renderWeather(data);
    } catch (error) {
      this.shadowRoot.innerHTML = `<p>${error.message}</p>`;
    }
  }

  renderWeather(data) {
    const { current_condition: [current], nearest_area: [area] } = data;
    const temperature = current.temp_C;
    const description = current.lang_ko[0].value;
    const location = area.areaName[0].value;
    const weatherIcon = this.getWeatherIcon(current.weatherCode);
    const today = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const formattedDate = today.toLocaleDateString('ko-KR', dateOptions);

    const style = `
      .weather-widget {
        font-family: 'Noto Sans KR', sans-serif;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        background-color: #ffffff;
        margin: 20px auto;
        width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
      }
      .weather-widget:hover {
        transform: translateY(-5px);
      }
      .weather-date {
        font-size: 1em;
        color: #666;
        margin-bottom: 10px;
      }
      .weather-location {
        font-size: 1.3em;
        font-weight: 700;
        color: #333;
      }
      .weather-icon {
        font-size: 3em;
        margin: 10px 0;
      }
      .weather-temp {
        font-size: 2.5em;
        margin: 10px 0;
        font-weight: 700;
        color: #111;
      }
      .weather-desc {
        font-size: 1.1em;
        text-transform: capitalize;
        color: #555;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="weather-widget">
        <div class="weather-date">${formattedDate}</div>
        <div class="weather-location">${location}</div>
        <div class="weather-icon">${weatherIcon}</div>
        <div class="weather-temp">${temperature}°C</div>
        <div class="weather-desc">${description}</div>
      </div>
    `;
  }
}

customElements.define('weather-widget', WeatherWidget);
