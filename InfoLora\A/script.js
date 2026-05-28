let currentNewsIndex = 0;
const newsItems = document.querySelectorAll('.news-item');
const dots = document.querySelectorAll('.dot');

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('timestamp').textContent = now.toLocaleDateString('en-US', options);
}

// Carousel functions
function showNews(index) {
    newsItems.forEach(item => item.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (index >= newsItems.length) currentNewsIndex = 0;
    if (index < 0) currentNewsIndex = newsItems.length - 1;
    
    newsItems[currentNewsIndex].classList.add('active');
    dots[currentNewsIndex].classList.add('active');
}

function nextNews() {
    currentNewsIndex++;
    if (currentNewsIndex >= newsItems.length) currentNewsIndex = 0;
    showNews(currentNewsIndex);
}

function prevNews() {
    currentNewsIndex--;
    if (currentNewsIndex < 0) currentNewsIndex = newsItems.length - 1;
    showNews(currentNewsIndex);
}

function goToNews(index) {
    currentNewsIndex = index;
    showNews(currentNewsIndex);
}

// Auto-rotate news every 6 seconds
function startAutoRotate() {
    setInterval(() => {
        nextNews();
    }, 6000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTimestamp();
    updateWeatherData();
    showNews(0);
    startAutoRotate();
    
    // Update timestamp every minute
    setInterval(updateTimestamp, 60000);
});

// Simulate real-time weather updates
function updateWeatherData() {
    // Simulate changing temperature
    const tempVariation = Math.sin(Date.now() / 30000) * 2;
    const baseTemp = 23 + tempVariation;
    
    // Update temperature widget
    const tempDisplay = document.querySelector('.temperature-display');
    if (tempDisplay) tempDisplay.textContent = Math.round(baseTemp);
    
    // Simulate humidity variation
    const humidityVariation = Math.cos(Date.now() / 25000) * 3;
    const baseHumidity = 65 + humidityVariation;
    const humidity = Math.max(30, Math.min(90, baseHumidity));
    
    // Update humidity widget
    const humidityValue = document.querySelector('.humidity-value');
    if (humidityValue) humidityValue.textContent = Math.round(humidity);
    
    // Update humidity circle progress
    const percentage = humidity / 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDasharray = circumference * percentage + ', ' + circumference;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.strokeDasharray = strokeDasharray;
    }
    
    // Update every 5 seconds
    setTimeout(updateWeatherData, 5000);
}

// Add interactivity to chart bars
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.chart-bar').forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        
        bar.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
});

// Log initialization
console.log('Weather Dashboard Initialized');
console.log('Mock Data:', {
    location: 'São Paulo, Brazil',
    temperature: '23°C',
    humidity: '65%',
    airQuality: 'Good (45 AQI)',
    wind: '12 km/h NE',
    pressure: '1013 mb',
    uvIndex: 6
});
