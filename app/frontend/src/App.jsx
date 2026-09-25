import { useEffect, useState } from 'react'
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Droplets,
  Wind,
  Eye,
  MapPin,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
  Waves,
  Route,
  Zap,
} from 'lucide-react'
import './App.css'

function WeatherIcon({ code, time, size = 34 }) {
  const hour = time
    ? new Date(time).getHours()
    : new Date().getHours()

  const isNight = hour < 6 || hour >= 18

  const props = {
    size,
    strokeWidth: 1.8,
  }

  if (code === 0) {
    return isNight ? <Moon {...props} /> : <Sun {...props} />
  }

  if (code <= 3) {
    return isNight
      ? <CloudMoon {...props} />
      : <CloudSun {...props} />
  }

  if (code <= 48) {
    return <CloudFog {...props} />
  }

  if (code <= 67) {
    return <CloudRain {...props} />
  }

  if (code <= 77) {
    return <Snowflake {...props} />
  }

  if (code <= 82) {
    return <CloudRain {...props} />
  }

  return <CloudLightning {...props} />
}

function weatherDescription(code) {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  return 'Thunderstorm'
}

function formatHour(time) {
  return new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDay(time, index) {
  if (index === 0) return 'Today'

  return new Date(time).toLocaleDateString([], {
    weekday: 'short',
  })
}

function App() {
  const [activeDay, setActiveDay] = useState(0)
  const [show24Hours, setShow24Hours] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [showRiskMap, setShowRiskMap] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadWeather() {
      try {
        const url =
          'https://api.open-meteo.com/v1/forecast' +
          '?latitude=-1.286389' +
          '&longitude=36.817223' +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m,visibility' +
          '&hourly=temperature_2m,precipitation_probability,weather_code' +
          '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code' +
          '&timezone=Africa%2FNairobi' +
          '&forecast_days=7'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Weather request failed')
        }

        const data = await response.json()
        setWeather(data)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadWeather()
  }, [])

  if (loading) {
    return (
      <main className="weather-app">
        <section className="hero-weather">
          <h2>WeatherProof</h2>
          <p>Loading live Nairobi weather...</p>
        </section>
      </main>
    )
  }

  if (error || !weather) {
    return (
      <main className="weather-app">
        <section className="hero-weather">
          <h2>WeatherProof</h2>
          <p>Unable to load live weather data.</p>
          <p>Please refresh the page and try again.</p>
        </section>
      </main>
    )
  }

  const current = weather.current
  const hourlyData = weather.hourly
  const dailyData = weather.daily

  const hourly = hourlyData.time
    .map((time, index) => ({
      time,
      temp: Math.round(
        hourlyData.temperature_2m[index]
      ),
      code: hourlyData.weather_code[index],
      rain:
        hourlyData.precipitation_probability[index],
    }))
    .filter((item) => {
      const now = new Date()
      return new Date(item.time) >= now
    })
    .slice(0, 5)

  const extendedHourly = hourlyData.time
    .map((time, index) => ({
      time,
      temp: Math.round(
        hourlyData.temperature_2m[index]
      ),
      code: hourlyData.weather_code[index],
      rain:
        hourlyData.precipitation_probability[index],
    }))
    .filter((item) => {
      const now = new Date()
      return new Date(item.time) >= now
    })
    .slice(0, 24)

  const days = dailyData.time.map((time, index) => ({
    day: formatDay(time, index),
    high: Math.round(
      dailyData.temperature_2m_max[index]
    ),
    low: Math.round(
      dailyData.temperature_2m_min[index]
    ),
    code: dailyData.weather_code[index],
    rain: `${dailyData.precipitation_probability_max[index]}%`,
  }))

  const selectedDay = days[activeDay]

  // Infrastructure risk engine
  const rainProbability =
    dailyData.precipitation_probability_max[0] || 0

  const precipitation =
    current.precipitation || 0

  const windGusts =
    current.wind_gusts_10m || 0

  const visibility =
    current.visibility || 10000

  const floodScore = Math.min(
    100,
    Math.round(
      rainProbability * 0.6 +
      precipitation * 10
    )
  )

  const roadScore = Math.min(
    100,
    Math.round(
      rainProbability * 0.35 +
      (100 - Math.min(visibility / 100, 100)) * 0.4 +
      Math.min(windGusts, 80) * 0.25
    )
  )

  const severeScore = Math.min(
    100,
    Math.round(
      (current.weather_code >= 95 ? 70 : 0) +
      Math.min(windGusts, 100) * 0.3
    )
  )

  const overallRisk = Math.round(
    floodScore * 0.45 +
    roadScore * 0.35 +
    severeScore * 0.2
  )

  const riskLevel =
    overallRisk >= 70
      ? 'HIGH'
      : overallRisk >= 40
        ? 'MEDIUM'
        : 'LOW'

  return (
    <main className="weather-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◒</span>
          <span>WeatherProof</span>
        </div>

        <button className="location-button">
          <MapPin size={17} />
          Nairobi, Kenya
          <ChevronDown size={16} />
        </button>

        <button
          className="menu-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          <Menu size={22} />
        </button>
      </header>

      {showMenu && (
        <div className="menu-panel">
          <button onClick={() => setShowMenu(false)}>
            Weather
          </button>

          <button onClick={() => setShowMenu(false)}>
            Risk Intelligence
          </button>

          <button onClick={() => setShowMenu(false)}>
            Alerts
          </button>
        </div>
      )}

      <section className="hero-weather">
        <div className="hero-location">
          <MapPin size={16} />
          <span>Nairobi</span>
          <span className="updated">
            Live weather data
          </span>
        </div>

        <div className="current-weather">
          <div>
            <div className="weather-icon">
              <WeatherIcon
                code={current.weather_code}
                size={58}
              />
            </div>

            <div className="condition">
              {weatherDescription(
                current.weather_code
              )}
            </div>
          </div>

          <div className="temperature">
            <span>
              {Math.round(
                current.temperature_2m
              )}
            </span>
            <sup>°C</sup>
          </div>
        </div>

        <div className="weather-summary">
          <span>
            Feels like{' '}
            {Math.round(
              current.apparent_temperature
            )}
            °C
          </span>

          <span>•</span>

          <span>
            High {days[0].high}°
          </span>

          <span>•</span>

          <span>
            Low {days[0].low}°
          </span>
        </div>

        <div className="quick-stats">
          <div>
            <span className="stat-icon">
              <Droplets size={21} />
            </span>

            <strong>
              {current.relative_humidity_2m}%
            </strong>

            <small>Humidity</small>
          </div>

          <div>
            <span className="stat-icon">
              <Wind size={21} />
            </span>

            <strong>
              {Math.round(
                current.wind_speed_10m
              )}{' '}
              km/h
            </strong>

            <small>Wind</small>
          </div>

          <div>
            <span className="stat-icon">
              <CloudRain size={21} />
            </span>

            <strong>
              {days[0].rain}
            </strong>

            <small>Rain chance</small>
          </div>

          <div>
            <span className="stat-icon">
              <Eye size={21} />
            </span>

            <strong>
              {Math.round(
                current.visibility / 1000
              )}{' '}
              km
            </strong>

            <small>Visibility</small>
          </div>
        </div>
      </section>

      <section className="alert-card">
        <div className="alert-icon">
          <AlertTriangle size={24} />
        </div>

        <div className="alert-content">
          <div className="alert-label">
            WEATHER ALERT
          </div>

          <h3>
            {days[0].rain !== '0%'
              ? 'Rain may affect infrastructure'
              : 'No major rain risk detected'}
          </h3>

          <p>
            Current forecast indicates a{' '}
            {days[0].rain} chance of precipitation today.
          </p>
        </div>

        <button
          onClick={() =>
            setShowAlert(!showAlert)
          }
        >
          {showAlert ? (
            <>
              Hide details{' '}
              <ChevronUp size={15} />
            </>
          ) : (
            <>
              View details{' '}
              <ChevronRight size={15} />
            </>
          )}
        </button>
      </section>

      {showAlert && (
        <div className="detail-card">
          <h3>Weather Advisory</h3>

          <p>
            WeatherProof is monitoring
            precipitation, wind and visibility
            conditions to identify possible
            infrastructure risks.
          </p>
        </div>
      )}

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              FORECAST
            </span>

            <h2>Hourly forecast</h2>
          </div>

          <button
            className="text-button"
            onClick={() =>
              setShow24Hours(!show24Hours)
            }
          >
            {show24Hours
              ? 'Show fewer hours ↑'
              : 'Next 24h →'}
          </button>
        </div>

        <div className="hourly-row">
          {(show24Hours
            ? extendedHourly
            : hourly
          ).map((hour, index) => (
            <div
              className={`hour ${
                index === 0
                  ? 'selected'
                  : ''
              }`}
              key={`${hour.time}-${index}`}
            >
              <span>
                {index === 0
                  ? 'Now'
                  : formatHour(hour.time)}
              </span>

              <strong>
                <WeatherIcon
                  code={hour.code}
                  time={hour.time}
                  size={29}
                />
              </strong>

              <b>{hour.temp}°</b>
            </div>
          ))}
        </div>
      </section>

      <section className="risk-card">
        <div className="risk-header">
          <div>
            <span className="eyebrow">
              WEATHERPROOF INTELLIGENCE
            </span>

            <h2>Infrastructure risk</h2>
          </div>

          <span className="risk-badge">
            LIVE
          </span>
        </div>

        <p className="risk-description">
          WeatherProof uses current weather
          conditions and forecast signals to
          identify possible infrastructure risks
          in Nairobi.
        </p>

        <div className="overall-risk">
          <strong>
            {overallRisk}/100
          </strong>

          <span>
            Overall infrastructure risk ·{' '}
            {riskLevel}
          </span>
        </div>

        <div className="risk-items">
          <div>
            <span>
              <Waves size={22} />
            </span>

            <div>
              <strong>Flooding</strong>

              <small>
                Rain probability:{' '}
                {days[0].rain}
              </small>
            </div>

            <b>
              {floodScore >= 70
                ? 'High'
                : floodScore >= 40
                  ? 'Medium'
                  : 'Low'}
            </b>
          </div>

          <div>
            <span>
              <Route size={22} />
            </span>

            <div>
              <strong>
                Road disruption
              </strong>

              <small>
                Based on precipitation
                and visibility
              </small>
            </div>

            <b>
              {roadScore >= 70
                ? 'High'
                : roadScore >= 40
                  ? 'Medium'
                  : 'Low'}
            </b>
          </div>

          <div>
            <span>
              <Zap size={22} />
            </span>

            <div>
              <strong>
                Severe weather
              </strong>

              <small>
                Monitoring current
                weather conditions
              </small>
            </div>

            <b>
              {severeScore >= 70
                ? 'High'
                : severeScore >= 40
                  ? 'Medium'
                  : 'Low'}
            </b>
          </div>
        </div>

        <button
          className="risk-button"
          onClick={() =>
            setShowRiskMap(!showRiskMap)
          }
        >
          {showRiskMap
            ? 'Hide risk map ↑'
            : 'Explore risk map →'}
        </button>
      </section>

      {showRiskMap && (
        <div className="detail-card">
          <h3>
            Infrastructure Risk Map
          </h3>

          <p>
            Live weather signals are being used
            to identify areas where rainfall,
            reduced visibility or severe weather
            may affect infrastructure.
          </p>

          <div className="risk-map-placeholder">
            Nairobi Risk Intelligence

            <span>
              Flooding • Roads • Severe Weather
            </span>
          </div>
        </div>
      )}

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              OUTLOOK
            </span>

            <h2>7-day forecast</h2>
          </div>
        </div>

        <div className="forecast-list">
          {days.map((day, index) => (
            <button
              className={`forecast-day ${
                activeDay === index
                  ? 'active'
                  : ''
              }`}
              key={day.day}
              onClick={() =>
                setActiveDay(index)
              }
            >
              <strong>
                {day.day}
              </strong>

              <span className="day-icon">
                <WeatherIcon
                  code={day.code}
                  size={28}
                />
              </span>

              <span className="rain">
                <Droplets size={14} />
                {day.rain}
              </span>

              <span className="temps">
                <b>{day.high}°</b>
                <small>
                  {day.low}°
                </small>
              </span>
            </button>
          ))}
        </div>

        <div className="detail-card">
          <div className="selected-day">
            <div>
              <span className="eyebrow">
                SELECTED DAY
              </span>

              <h3>
                {selectedDay.day}{' '}
                forecast
              </h3>
            </div>

            <span className="selected-day-icon">
              <WeatherIcon
                code={selectedDay.code}
                size={42}
              />
            </span>
          </div>

          <p>
            Expected high of{' '}
            <strong>
              {selectedDay.high}°C
            </strong>{' '}
            and low of{' '}
            <strong>
              {selectedDay.low}°C
            </strong>
            , with a{' '}
            <strong>
              {selectedDay.rain}
            </strong>{' '}
            chance of rain.
          </p>
        </div>
      </section>

      <footer>
        <div className="brand">
          <span className="brand-mark">
            ◒
          </span>

          <span>
            WeatherProof
          </span>
        </div>

        <span>
          Weather intelligence for safer
          communities.
        </span>
      </footer>
    </main>
  )
}

export default App