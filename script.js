const apiKey = "Here Your API Code";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const searchInput = document.querySelector(".search-container input");
const searchButton = document.querySelector(".search-container button");

// Weather condition icons mapping
const weatherIcons = {
    Clouds: "clouds.png",
    Clear: "clear.png",
    Rain: "rain.png",
    Drizzle: "drizzle.png",
    Mist: "mist.png",
    Snow: "snow.png",
    Thunderstorm: "thunderstorm.png"
};

// Initialize with current date
updateCurrentDate();

function updateCurrentDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.querySelector(".current-date").textContent = 
        new Date().toLocaleDateString(undefined, options);
}

function createHourCard(time, temp, icon, description) {
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
        <p class="hour-time">${time}</p>
        <img src="images/${icon}" class="hour-icon" alt="${description}">
        <p class="hour-temp">${temp}°C</p>
    `;
    return card;
}

function createDayCard(dayName, maxTemp, minTemp, icon, description) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
        <p class="day-name">${dayName}</p>
        <img src="images/${icon}" class="day-icon" alt="${description}">
        <div class="day-temps">
            <span class="day-max">${maxTemp}°</span>
            <span class="day-min">${minTemp}°</span>
        </div>
    `;
    return card;
}

async function fetchWeatherData(city) {
    if (!city) {
        showError("Enter the name of city first.");
        alert('ERROR! Name of city isn\'t entered.');
        return;
    }

    try {
        updateCurrentDate();
        
        const currentResponse = await fetch(apiUrl + city + `&appid=${apiKey}`);
        if (!currentResponse.ok) {
            if(currentResponse.status == 404){
              showError(`\'${searchInput.value}\' is not found. Check the spelling and try again`);
              alert('ERROR! City doesn\'t exist.');
            }
            else
            {
              showError("Data weather is unavailable");
              alert('ERROR! API request failed.');
            }
            return;
        }
        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(forecastUrl + city + `&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        updateCurrentWeather(currentData);
        updateHourlyForecast(forecastData);
        updateWeeklyForecast(forecastData);

        document.querySelector(".weather-results").style.display = "block";
        document.querySelector(".error-message").style.display = "none";
    } catch (error) {
        showError("Failed to fetch weather data. Please try again.");
        console.error("Error fetching weather:", error);
    }
}

function updateCurrentWeather(data) {
    const cityNameElement = document.querySelector(".city-name");
    const locationIcon = document.querySelector(".location-icon");
    
    cityNameElement.textContent = data.name;
    locationIcon.style.display = "inline-block";
    
    document.querySelector(".temperature").textContent = Math.round(data.main.temp) + "°C";
    document.querySelector(".weather-description").textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    document.querySelector(".humidity-value").textContent = data.main.humidity + "%";
    document.querySelector(".wind-speed").textContent = data.wind.speed + " km/h";
    
    const weatherMain = data.weather[0].main;
    const weatherIcon = document.querySelector(".weather-icon");
    weatherIcon.src = `images/${weatherIcons[weatherMain] || "clear.png"}`;
    weatherIcon.alt = data.weather[0].description;
}

function updateHourlyForecast(data) {
    const hourlyContainer = document.querySelector(".hourly-forecast");
    hourlyContainer.innerHTML = "";
    
    const hourlyForecasts = data.list.slice(0, 8);
    
    hourlyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(item.main.temp);
        const icon = weatherIcons[item.weather[0].main] || "clear.png";
        const description = item.weather[0].description;
        
        hourlyContainer.appendChild(
            createHourCard(time, temp, icon, description)
        );
    });
}

function updateWeeklyForecast(data) {
    const weeklyContainer = document.querySelector(".weekly-forecast");
    weeklyContainer.innerHTML = "";
    
    // Group forecasts by day and calculate min/max temps
    const dailyForecasts = {};
    const today = new Date().toDateString();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
        const dateString = date.toDateString();
        
        // Skip if it's today
        if (dateString === today) return;
        
        if (!dailyForecasts[dateString]) {
            dailyForecasts[dateString] = {
                dayName: dayName,
                temps: [],
                icons: {},
                description: item.weather[0].description
            };
        }
        
        dailyForecasts[dateString].temps.push(Math.round(item.main.temp));
        const weatherMain = item.weather[0].main;
        dailyForecasts[dateString].icons[weatherMain] = (dailyForecasts[dateString].icons[weatherMain] || 0) + 1;
    });
    
    // Get the next 7 days (excluding today)
    const forecastDays = Object.values(dailyForecasts).slice(0, 7);
    
    forecastDays.forEach(day => {
        // Find most frequent weather condition
        const mostFrequentWeather = Object.keys(day.icons).reduce((a, b) => 
            day.icons[a] > day.icons[b] ? a : b
        );
        
        const maxTemp = Math.max(...day.temps);
        const minTemp = Math.min(...day.temps);
        const icon = weatherIcons[mostFrequentWeather] || "clear.png";
        
        weeklyContainer.appendChild(
            createDayCard(day.dayName, maxTemp, minTemp, icon, day.description)
        );
    });
}

function showError(message) {
    const errorElement = document.querySelector(".error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
    document.querySelector(".weather-results").style.display = "none";
    document.querySelector(".location-icon").style.display = "none";
}

// Event listeners
searchButton.addEventListener("click", () => {
    fetchWeatherData(searchInput.value.trim());
});

searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        fetchWeatherData(searchInput.value.trim());
    }
});
