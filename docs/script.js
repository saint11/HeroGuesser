document.addEventListener("DOMContentLoaded", () => {
  const heroInput = document.getElementById("hero-input");
  const suggestions = document.getElementById("suggestions");
  const guessButton = document.getElementById("guess-button");
  const guessesContainer = document.getElementById("guesses");
  let selectedHeroes = [];
  let heroes = [];
  let chosenHero = null;

  // Fetch hero data from the JSON file
  fetch('dota2_heroes.json')
      .then(response => response.json())
      .then(data => {
          heroes = data;
          chooseRandomHero();

          heroInput.addEventListener("input", () => {
              const query = heroInput.value.toLowerCase();
              suggestions.innerHTML = '';

              if (query) {
                  const filteredHeroes = heroes.filter(hero => hero.localized_name.toLowerCase().includes(query));
                  filteredHeroes.forEach((hero, index) => {
                      const li = document.createElement("li");
                      li.textContent = hero.localized_name;
                      if (index === 0) {
                          li.classList.add("highlighted");
                      }
                      li.addEventListener("click", () => {
                          heroInput.value = hero.localized_name;
                          suggestions.innerHTML = '';
                          addGuess(hero);
                      });
                      suggestions.appendChild(li);
                  });
              }
          });

          heroInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                  e.preventDefault();
                  addGuess();
              }
          });

          guessButton.addEventListener("click", () => {
              addGuess();
          });

          function chooseRandomHero() {
              const randomIndex = Math.floor(Math.random() * heroes.length);
              chosenHero = heroes[randomIndex];
              console.log("Chosen Hero:", chosenHero.localized_name);
          }

          function addGuess(hero = null) {
              if (!hero) {
                  const firstSuggestion = suggestions.querySelector("li.highlighted");
                  let heroName = heroInput.value.trim();
                  if (firstSuggestion) {
                      heroName = firstSuggestion.textContent;
                  }
                  hero = heroes.find(h => h.localized_name.toLowerCase() === heroName.toLowerCase());
              }

              if (!hero) {
                  alert("Please enter a valid hero name.");
                  return;
              }

              selectedHeroes.push(hero.localized_name);
              console.log(selectedHeroes);

              // Clear the input field and set the placeholder to the last guessed hero
              heroInput.value = '';
              heroInput.placeholder = `Last guess: ${hero.localized_name}`;

              // Display and compare hero stats
              const guessDiv = document.createElement("div");
              guessDiv.classList.add("guess");

              const heroNameDiv = document.createElement("div");
              heroNameDiv.classList.add("hero-name");
              heroNameDiv.textContent = hero.localized_name;
              guessDiv.appendChild(heroNameDiv);

              const heroStatsDiv = document.createElement("div");
              heroStatsDiv.classList.add("hero-stats");

              heroStatsDiv.innerHTML = `
                  <div id="primary_attr"><span>Primary Attribute:</span> ${hero.primary_attr}</div>
                  <div id="attack_type"><span>Attack Type:</span> ${hero.attack_type}</div>
                  <div id="roles"><span>Roles:</span> ${hero.roles.join(', ')}</div>
                  <div id="base_armor"><span>Base Armor:</span> ${hero.base_armor}</div>
                  <div id="base_str"><span>Base Strength:</span> ${hero.base_str}</div>
                  <div id="base_agi"><span>Base Agility:</span> ${hero.base_agi}</div>
                  <div id="base_int"><span>Base Intelligence:</span> ${hero.base_int}</div>
                  <div id="move_speed"><span>Move Speed:</span> ${hero.move_speed}</div>
                  <div id="legs"><span>Legs:</span> ${hero.legs}</div>
                  <div id="attack_range"><span>Attack Range:</span> ${hero.attack_range}</div>
              `;

              guessDiv.appendChild(heroStatsDiv);
              guessesContainer.insertBefore(guessDiv, guessesContainer.firstChild);

              compareStats(hero, chosenHero, guessDiv);

              hero = "";
              suggestions.innerHTML = '';
          }

          function compareStats(guessHero, chosenHero, guessDiv) {
              compareText(guessHero.primary_attr, chosenHero.primary_attr, guessDiv.querySelector('#primary_attr'));
              compareText(guessHero.attack_type, chosenHero.attack_type, guessDiv.querySelector('#attack_type'));
              compareArray(guessHero.roles, chosenHero.roles, guessDiv.querySelector('#roles'));
              compareNumber(guessHero.base_armor, chosenHero.base_armor, guessDiv.querySelector('#base_armor'));
              compareNumber(guessHero.base_str, chosenHero.base_str, guessDiv.querySelector('#base_str'));
              compareNumber(guessHero.base_agi, chosenHero.base_agi, guessDiv.querySelector('#base_agi'));
              compareNumber(guessHero.base_int, chosenHero.base_int, guessDiv.querySelector('#base_int'));
              compareNumber(guessHero.move_speed, chosenHero.move_speed, guessDiv.querySelector('#move_speed'));
              compareNumber(guessHero.legs, chosenHero.legs, guessDiv.querySelector('#legs'));
              compareNumber(guessHero.attack_range, chosenHero.attack_range, guessDiv.querySelector('#attack_range'));
          }

          function compareText(guessValue, actualValue, div) {
              if (div) {
                  if (guessValue === actualValue) {
                      div.classList.add("correct");
                  } else {
                      div.classList.add("incorrect");
                  }
              }
          }

          function compareArray(guessArray, actualArray, div) {
              if (div) {
                  const matchCount = guessArray.filter(value => actualArray.includes(value)).length;
                  if (matchCount === actualArray.length && matchCount === guessArray.length) {
                      div.classList.add("correct");
                  } else if (matchCount > 0) {
                      div.classList.add("partial");
                  } else {
                      div.classList.add("incorrect");
                  }
              }
          }

          function compareNumber(guessValue, actualValue, div) {
              if (div) {
                  if (guessValue === actualValue) {
                      div.classList.add("correct");
                  } else if (guessValue > actualValue) {
                      div.classList.add("incorrect");
                      div.textContent += ` ⬇️`;
                  } else {
                      div.classList.add("incorrect");
                      div.textContent += ` ⬆️`;
                  }
              }
          }
      })
      .catch(error => console.error('Error fetching hero data:', error));
});
