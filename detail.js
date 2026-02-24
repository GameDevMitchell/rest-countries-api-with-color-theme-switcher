// Country Detail Page
class CountryDetail {
    constructor() {
        this.country = null;
        this.borderCountries = [];
        this.isLoading = false;
        this.error = null;

        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadTheme();
        this.loadCountryData();
    }

    cacheElements() {
        this.elements = {
            backButton: document.getElementById('backButton'),
            themeToggle: document.getElementById('themeToggle'),
            countryDetail: document.getElementById('countryDetail'),
            loading: document.getElementById('loading')
        };
    }

    setupEventListeners() {
        this.elements.backButton.addEventListener('click', () => {
            window.history.back();
        });

        this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    async loadCountryData() {
        this.isLoading = true;
        this.showLoading();

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const countryName = urlParams.get('country');

            if (!countryName) {
                throw new Error('No country specified');
            }

            // Try to get from API first
            const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.country = data[0]; // API returns array

            if (this.country.borders && this.country.borders.length > 0) {
                await this.loadBorderCountries(this.country.borders);
            }

            this.renderCountryDetail();
        } catch (error) {
            console.error('Error fetching country details:', error);
            this.error = 'Failed to fetch country details. Using fallback data.';
            await this.loadFallbackData();
        } finally {
            this.isLoading = false;
        }
    }

    async loadFallbackData() {
        try {
            const response = await fetch('./data.json');
            const allCountries = await response.json();

            const urlParams = new URLSearchParams(window.location.search);
            const countryName = urlParams.get('country');

            this.country = allCountries.find(c =>
                c.name.common.toLowerCase().replace(/\s+/g, '-') === countryName
            );

            if (!this.country) {
                throw new Error('Country not found in fallback data');
            }

            if (this.country.borders && this.country.borders.length > 0) {
                await this.loadBorderCountriesFromFallback(this.country.borders, allCountries);
            }

            this.renderCountryDetail();
        } catch (error) {
            console.error('Error loading fallback data:', error);
            this.showError();
        }
    }

    async loadBorderCountries(borderCodes) {
        try {
            const response = await fetch(`https://restcountries.com/v3.1/alpha?codes=${borderCodes.join(',')}`);
            if (response.ok) {
                this.borderCountries = await response.json();
            }
        } catch (error) {
            console.error('Error loading border countries:', error);
        }
    }

    async loadBorderCountriesFromFallback(borderCodes, allCountries) {
        this.borderCountries = allCountries.filter(country =>
            borderCodes.includes(country.cca3)
        );
    }

    renderCountryDetail() {
        if (!this.country) {
            this.showError();
            return;
        }

        const countryHTML = this.createCountryDetailHTML();
        this.elements.countryDetail.innerHTML = countryHTML;
    }

    createCountryDetailHTML() {
        const name = this.country.name.common || 'Unknown';
        const nativeName = this.getNativeName();
        const population = this.country.population ? this.country.population.toLocaleString() : 'Unknown';
        const region = this.country.region || 'Unknown';
        const subregion = this.country.subregion || 'Unknown';
        const capital = this.country.capital ? this.country.capital[0] : 'No capital';
        const topLevelDomain = this.country.tld ? this.country.tld[0] : 'Unknown';
        const currencies = this.getCurrencies();
        const languages = this.getLanguages();
        const flag = this.country.flags ? this.country.flags.svg || this.country.flags.png : '';

        return `
      <div class="country-detail__content">
        <img class="country-detail__flag" src="${flag}" alt="Flag of ${name}" loading="lazy">
        
        <div class="country-detail__info">
          <h1 class="country-detail__name">${name}</h1>
          
          <div class="country-detail__details">
            <div class="country-detail__details-column">
              <div class="country-detail__detail-item">
                <strong>Native Name:</strong> ${nativeName}
              </div>
              <div class="country-detail__detail-item">
                <strong>Population:</strong> ${population}
              </div>
              <div class="country-detail__detail-item">
                <strong>Region:</strong> ${region}
              </div>
              <div class="country-detail__detail-item">
                <strong>Sub Region:</strong> ${subregion}
              </div>
              <div class="country-detail__detail-item">
                <strong>Capital:</strong> ${capital}
              </div>
            </div>
            
            <div class="country-detail__details-column">
              <div class="country-detail__detail-item">
                <strong>Top Level Domain:</strong> ${topLevelDomain}
              </div>
              <div class="country-detail__detail-item">
                <strong>Currencies:</strong> ${currencies}
              </div>
              <div class="country-detail__detail-item">
                <strong>Languages:</strong> ${languages}
              </div>
            </div>
          </div>
          
          ${this.borderCountries.length > 0 ? this.createBorderCountriesHTML() : ''}
        </div>
      </div>
    `;
    }

    getNativeName() {
        if (!this.country.name.nativeName) return 'Unknown';

        const nativeNames = Object.values(this.country.name.nativeName);
        if (nativeNames.length === 0) return 'Unknown';

        const firstNativeName = nativeNames[0];
        return firstNativeName.common || firstNativeName.official || 'Unknown';
    }

    getCurrencies() {
        if (!this.country.currencies) return 'Unknown';

        const currencies = Object.values(this.country.currencies);
        if (currencies.length === 0) return 'Unknown';

        return currencies.map(currency => currency.name || 'Unknown').join(', ');
    }

    getLanguages() {
        if (!this.country.languages) return 'Unknown';

        const languages = Object.values(this.country.languages);
        if (languages.length === 0) return 'Unknown';

        return languages.join(', ');
    }

    createBorderCountriesHTML() {
        const borderCountriesHTML = this.borderCountries.map(country => {
            const name = country.name.common || 'Unknown';
            const countrySlug = name.toLowerCase().replace(/\s+/g, '-');
            return `
        <a href="detail.html?country=${encodeURIComponent(countrySlug)}" class="border-country">
          ${name}
        </a>
      `;
        }).join('');

        return `
      <div class="country-detail__borders">
        <h3 class="country-detail__borders-title">Border Countries:</h3>
        <div class="country-detail__borders-list">
          ${borderCountriesHTML}
        </div>
      </div>
    `;
    }

    showLoading() {
        this.elements.countryDetail.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading country details...</span>
      </div>
    `;
    }

    showError() {
        this.elements.countryDetail.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Country not found</h2>
        <p>${this.error || 'Unable to load country details. Please try again.'}</p>
        <button onclick="window.location.href='index.html'">Back to Home</button>
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

// Initialize the detail page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CountryDetail();
});
