// REST Countries API App
class CountriesApp {
  constructor() {
    this.countries = [];
    this.filteredCountries = [];
    this.isLoading = false;
    this.error = null;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadTheme();
    this.fetchCountries();
  }

  cacheElements() {
    this.elements = {
      searchInput: document.getElementById('searchInput'),
      regionFilter: document.getElementById('regionFilter'),
      countriesGrid: document.getElementById('countriesGrid'),
      themeToggle: document.getElementById('themeToggle'),
      loading: document.getElementById('loading')
    };
  }

  setupEventListeners() {
    this.elements.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    this.elements.regionFilter.addEventListener('change', this.handleRegionFilter.bind(this));
    this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async fetchCountries() {
    this.isLoading = true;
    this.showLoading();

    try {
      const response = await fetch('https://restcountries.com/v3.1/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.countries = await response.json();
      this.filteredCountries = [...this.countries];
      this.error = null;
      
      this.renderCountries();
    } catch (error) {
      console.error('Error fetching countries:', error);
      this.error = 'Failed to fetch countries from API. Using fallback data.';
      await this.loadFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  async loadFallbackData() {
    try {
      const response = await fetch('./data.json');
      this.countries = await response.json();
      this.filteredCountries = [...this.countries];
      this.renderCountries();
    } catch (error) {
      console.error('Error loading fallback data:', error);
      this.showError();
    }
  }

  handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      this.filterByRegion(this.elements.regionFilter.value);
      return;
    }

    this.filteredCountries = this.countries.filter(country => 
      country.name.common.toLowerCase().includes(searchTerm)
    );

    this.renderCountries();
  }

  handleRegionFilter(event) {
    this.filterByRegion(event.target.value);
  }

  filterByRegion(region) {
    if (region === '') {
      this.filteredCountries = [...this.countries];
    } else {
      this.filteredCountries = this.countries.filter(country => 
        country.region === region
      );
    }

    const searchTerm = this.elements.searchInput.value.toLowerCase().trim();
    if (searchTerm !== '') {
      this.filteredCountries = this.filteredCountries.filter(country => 
        country.name.common.toLowerCase().includes(searchTerm)
      );
    }

    this.renderCountries();
  }

  renderCountries() {
    if (this.filteredCountries.length === 0) {
      this.showNoResults();
      return;
    }

    const countriesHTML = this.filteredCountries.map(country => this.createCountryCard(country)).join('');
    this.elements.countriesGrid.innerHTML = countriesHTML;
  }

  createCountryCard(country) {
    const name = country.name.common || 'Unknown';
    const population = country.population ? country.population.toLocaleString() : 'Unknown';
    const region = country.region || 'Unknown';
    const capital = country.capital ? country.capital[0] : 'No capital';
    const flag = country.flags ? country.flags.svg || country.flags.png : '';

    return `
      <article class="country-card" data-country="${name.toLowerCase().replace(/\s+/g, '-')}">
        <img class="country-card__flag" src="${flag}" alt="Flag of ${name}" loading="lazy">
        <div class="country-card__content">
          <h2 class="country-card__name">${name}</h2>
          <div class="country-card__info">
            <div class="country-card__info-item">
              <strong>Population:</strong> ${population}
            </div>
            <div class="country-card__info-item">
              <strong>Region:</strong> ${region}
            </div>
            <div class="country-card__info-item">
              <strong>Capital:</strong> ${capital}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  showLoading() {
    this.elements.countriesGrid.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading countries...</span>
      </div>
    `;
  }

  showError() {
    this.elements.countriesGrid.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Something went wrong</h2>
        <p>${this.error || 'Failed to load countries. Please try again.'}</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  showNoResults() {
    this.elements.countriesGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h2>No countries found</h2>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    `;
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    const icon = this.elements.themeToggle.querySelector('i');
    const text = this.elements.themeToggle.querySelector('span');
    
    if (isDarkMode) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      text.textContent = 'Light Mode';
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      text.textContent = 'Dark Mode';
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.body.classList.add('dark-mode');
      const icon = this.elements.themeToggle.querySelector('i');
      const text = this.elements.themeToggle.querySelector('span');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      text.textContent = 'Light Mode';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CountriesApp();

  // Add click handlers for country cards
  document.addEventListener('click', (event) => {
    const countryCard = event.target.closest('.country-card');
    if (countryCard) {
      const countryName = countryCard.dataset.country;
      window.location.href = `detail.html?country=${encodeURIComponent(countryName)}`;
    }
  });
});
