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
      '113': '☀️', // Sunny/Clear
      '116': '⛅️', // Partly cloudy
      '119': '☁️', // Cloudy
      '122': '☁️', // Overcast
      '143': '🌫', // Mist
      '176': '🌦', // Patchy rain possible
      '179': '🌨', // Patchy snow possible
      '182': '🌨', // Patchy sleet possible
      '185': '🌨', // Patchy freezing drizzle possible
      '200': '⛈', // Thundery outbreaks possible
      '227': '🌬️', // Blowing snow
      '230': ' blizzard', // Blizzard
      '248': '🌫', // Fog
      '260': '🌫', // Freezing fog
      '263': '🌦', // Patchy light drizzle
      '266': '🌦', // Light drizzle
      '281': '🌨', // Freezing drizzle
      '284': '🌨', // Heavy freezing drizzle
      '293': '🌦', // Patchy light rain
      '296': '🌦', // Light rain
      '299': '🌧', // Moderate rain at times
      '302': '🌧', // Moderate rain
      '305': '🌧', // Heavy rain at times
      '308': '🌧', // Heavy rain
      '311': '🌨', // Light freezing rain
      '314': '🌨', // Moderate or heavy freezing rain
      '317': '🌨', // Light sleet
      '320': '🌨', // Moderate or heavy sleet
      '323': '🌨', // Patchy light snow
      '326': '🌨', // Light snow
      '329': '雪', // Moderate snow at times
      '332': '雪', // Moderate snow
      '335': '🌨', // Patchy heavy snow
      '338': 'SNOW', // Heavy snow
      '350': '🌨', // Ice pellets
      '353': '🌦', // Light rain shower
      '356': '🌧', // Moderate or heavy rain shower
      '359': '🌧', // Torrential rain shower
      '362': '🌨', // Light sleet showers
      '365': '🌨', // Moderate or heavy sleet showers
      '368': '🌨', // Light snow showers
      '371': '🌨', // Moderate or heavy snow showers
      '374': '🌨', // Light showers of ice pellets
      '377': '🌨', // Moderate or heavy showers of ice pellets
      '386': '⛈', // Patchy light rain with thunder
      '389': '⛈', // Moderate or heavy rain with thunder
      '392': '⛈', // Patchy light snow with thunder
      '395': '⛈', // Moderate or heavy snow with thunder
    };
    return icons[weatherCode] || ''
  }

  async fetchWeather() {
    try {
      const response = await fetch('https://wttr.in/?format=j1&lang=ko');
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
    const description = current.weatherDesc[0].value;
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
