const countries = [
  { name: 'United States', flagUrl: 'https://www.countryflags.io/US/flat/64.png' },
  { name: 'United Kingdom', flagUrl: 'https://www.countryflags.io/GB/flat/64.png' },
  // Add more countries with flag URLs
];

// Function to create the dropdown
function createDropdown() {
  const dropdownContainer = document.getElementById('dropdownContainer');
  const dropdown = document.createElement('select');

  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country.name;
    option.text = country.name;

    const flag = document.createElement('img');
    flag.src = country.flagUrl;
    flag.className = 'flag-icon';

    option.prepend(flag);
    dropdown.appendChild(option);
  });

  dropdownContainer.appendChild(dropdown);
}

// Call the function to create the dropdown
createDropdown();