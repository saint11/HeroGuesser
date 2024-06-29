document.addEventListener("DOMContentLoaded", () => {

  const heroInput = document.getElementById("hero-input");
  const suggestions = document.getElementById("suggestions");
  const guessButton = document.getElementById("guess-button");
  const guessesContainer = document.getElementById("guesses");
  const resultContainer = document.getElementById("results");
  const gamelink = "https://saint11.github.io/HeroGuesser/";

  const DELAY = 0.2;

  let selectedHeroes = [];
  let suggestedHeroes = [];
  let suggestedStats = [];
  let suggestedIndex = 0;
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
          const exactMatches = [];
          const prefixMatches = [];
          const substringMatches = [];

          heroes.forEach(hero => {
            const name = hero.localized_name.toLowerCase();
            if (name === query) {
              exactMatches.push(hero);
            } else if (name.startsWith(query)) {
              prefixMatches.push(hero);
            } else if (name.includes(query)) {
              substringMatches.push({ hero, index: name.indexOf(query) });
            }
          });

          // Sort substring matches by the position of the match
          substringMatches.sort((a, b) => a.index - b.index);

          // Combine all matches, exact matches first, then prefix matches, then substring matches
          const filteredHeroes = [...exactMatches, ...prefixMatches, ...substringMatches.map(item => item.hero)];

          suggestedIndex = 0;
          suggestedHeroes = [];

          filteredHeroes.forEach((hero, index) => {
            suggestedHeroes.push(hero.localized_name);

            const li = document.createElement("li");

            // Get the hero icon and append it to the list item
            const heroIcon = getHeroIconImgTag(hero);
            li.appendChild(heroIcon);

            // Append the hero name
            const heroNameText = document.createTextNode(` ${hero.localized_name}`);
            li.appendChild(heroNameText);

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
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (suggestedIndex > 0) {
            suggestedIndex -= 1;
            updateSuggestionsHighlight();
          }
        }
      });

      heroInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (suggestedIndex < suggestedHeroes.length - 1) {
            suggestedIndex += 1;
            updateSuggestionsHighlight();
          }
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

      function updateSuggestionsHighlight() {
        const suggestionItems = suggestions.querySelectorAll('li');
        suggestionItems.forEach((item, index) => {
          if (index === suggestedIndex) {
            item.classList.add("highlighted");
            item.scrollIntoView({ block: "nearest", behavior: "smooth" });
          } else {
            item.classList.remove("highlighted");
          }
        });
      }

      function chooseRandomHero() {
        const randomIndex = Math.floor(Math.random() * heroes.length);
        chosenHero = heroes[randomIndex];
        console.log("Chosen Hero:", chosenHero.localized_name);
      }

      function addGuess(hero = null) {
        // Disable input and button
        heroInput.disabled = true;
        guessButton.disabled = true;

        if (!hero) {
          const firstSuggestion = suggestedHeroes[suggestedIndex];
          let heroName = heroInput.value.trim();
          if (firstSuggestion) {
            heroName = firstSuggestion;
          }
          hero = heroes.find(h => h.localized_name.toLowerCase() === heroName.toLowerCase());
        }

        if (!hero) {
          alert("Please enter a valid hero name.");
          heroInput.disabled = false;
          guessButton.disabled = false;
          return;
        }

        selectedHeroes.push(hero.localized_name);

        // Clear the input field and set the placeholder to the last guessed hero
        heroInput.value = '';
        heroInput.placeholder = `Last guess: ${hero.localized_name}`;

        // Display and compare hero stats
        const guessDiv = document.createElement("div");
        guessDiv.classList.add("guess", "animate__animated", "animate__fadeIn");

        const heroNameDiv = document.createElement("div");
        heroNameDiv.classList.add("hero-name");

        // Get the hero icon and append it to the hero name div
        const heroIcon = getHeroIconImgTag(hero);
        heroNameDiv.appendChild(heroIcon);

        const heroNameText = document.createElement("span");
        heroNameText.textContent = hero.localized_name;
        heroNameDiv.appendChild(heroNameText);
        guessDiv.appendChild(heroNameDiv);

        const heroStatsDiv = document.createElement("div");
        heroStatsDiv.classList.add("hero-stats");

        // Fade the previous guess
        const lastGuess = guessesContainer.querySelector('.guess');
        if (lastGuess) {
          lastGuess.classList.add('faded');
        }

        const stats = [
          { id: "primary_attr", label: "Primary Attribute", value: hero.primary_attr },
          { id: "attack_type", label: "Attack Type", value: hero.attack_type },
          { id: "roles", label: "Roles", value: hero.roles.join(', ') },
          { id: "base_armor", label: "Base Armor", value: hero.base_armor },
          { id: "base_str", label: "Base Strength", value: hero.base_str },
          { id: "base_agi", label: "Base Agility", value: hero.base_agi },
          { id: "base_int", label: "Base Intelligence", value: hero.base_int },
          { id: "move_speed", label: "Move Speed", value: hero.move_speed },
          { id: "legs", label: "Legs", value: hero.legs },
          { id: "attack_range", label: "Attack Range", value: hero.attack_range },
        ];

        stats.forEach((stat, index) => {
          const statDiv = document.createElement("div");
          statDiv.id = stat.id;
          statDiv.innerHTML = `<span>${stat.label}:</span> ${stat.value}`;
          statDiv.classList.add("animate__animated", "animate__fadeIn");
          statDiv.style.animationDelay = `${index * DELAY}s`;
          heroStatsDiv.appendChild(statDiv);
        });

        guessDiv.appendChild(heroStatsDiv);
        guessesContainer.insertBefore(guessDiv, guessesContainer.firstChild);

        compareStats(hero, chosenHero, guessDiv);

        // Check if the guessed hero is the correct one
        if (hero.localized_name === chosenHero.localized_name) {
          // Show confetti after all stats have been revealed
          setTimeout(() => {
            showConfetti();
            setTimeout(() => {
              // Re-enable input and button after confetti
              heroInput.disabled = false;
              guessButton.disabled = false;
            }, 5000); // Adjust this timeout to match the duration of the confetti animation
          }, stats.length * (DELAY * 1000)); // Delay to match the animation delay
        } else {
          // Re-enable input and button immediately if guess is incorrect
          setTimeout(() => {
            heroInput.disabled = false;
            guessButton.disabled = false;
          }, stats.length * (DELAY * 1000)); // Delay to match the animation delay
        }

        hero = "";
        suggestions.innerHTML = '';
      }

      function compareStats(guessHero, chosenHero, guessDiv) {
        let stats = "";

        stats += compareText(guessHero.primary_attr, chosenHero.primary_attr, guessDiv.querySelector('#primary_attr'));
        stats += compareText(guessHero.attack_type, chosenHero.attack_type, guessDiv.querySelector('#attack_type'));
        stats += compareArray(guessHero.roles, chosenHero.roles, guessDiv.querySelector('#roles'));
        stats += compareNumber(guessHero.base_armor, chosenHero.base_armor, guessDiv.querySelector('#base_armor'));
        stats += compareNumber(guessHero.base_str, chosenHero.base_str, guessDiv.querySelector('#base_str'));
        stats += compareNumber(guessHero.base_agi, chosenHero.base_agi, guessDiv.querySelector('#base_agi'));
        stats += compareNumber(guessHero.base_int, chosenHero.base_int, guessDiv.querySelector('#base_int'));
        stats += compareNumber(guessHero.move_speed, chosenHero.move_speed, guessDiv.querySelector('#move_speed'));
        stats += compareNumber(guessHero.legs, chosenHero.legs, guessDiv.querySelector('#legs'));
        stats += compareNumber(guessHero.attack_range, chosenHero.attack_range, guessDiv.querySelector('#attack_range'));

        suggestedStats.push(stats);
      }

      function compareText(guessValue, actualValue, div) {
        if (div) {
          if (guessValue === actualValue) {
            div.classList.add("correct");
            return '🟩';
          } else {
            div.classList.add("incorrect");
            return '🟥';
          }
        }
        return '🟥';
      }

      function compareArray(guessArray, actualArray, div) {
        if (div) {
          const matchCount = guessArray.filter(value => actualArray.includes(value)).length;
          if (matchCount === actualArray.length && matchCount === guessArray.length) {
            div.classList.add("correct");
            return '🟩';
          } else if (matchCount > 0) {
            div.classList.add("partial");
            return '🟨';
          } else {
            div.classList.add("incorrect");
            return '🟥';
          }
        }
        return '🟥';
      }

      function compareNumber(guessValue, actualValue, div) {
        if (div) {
          if (guessValue === actualValue) {
            div.classList.add("correct");
            return '🟩';
          } else if (guessValue > actualValue) {
            div.classList.add("incorrect");
            div.textContent += ` ⬇️`;
            return '🟥';
          } else {
            div.classList.add("incorrect");
            div.textContent += ` ⬆️`;
            return '🟥';
          }
        }
        return '🟥';
      }

      function getHeroIconImgTag(hero) {
        const heroIcon = document.createElement("img");
        const iconPath = getIconPath(hero.icon);
        heroIcon.src = `img/${iconPath}`;
        heroIcon.alt = `${hero.localized_name} icon`;
        heroIcon.style.width = '24px'; // Adjust size as needed
        heroIcon.style.height = '24px';
        return heroIcon;
      }

      function getIconPath(apiPath) {
        // Remove the trailing "?" if it exists
        const cleanPath = apiPath.split('?')[0];
        // Extract the hero name from the cleaned path
        const parts = cleanPath.split('/');
        const iconFile = parts[parts.length - 1]; // e.g., "antimage.png"
        return iconFile; // This assumes your local path is "img/antimage.png"
      }
      function showConfetti() {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Remove the input field, guess button, and suggestions
        heroInput.style.display = 'none';
        guessButton.style.display = 'none';
        suggestions.style.display = 'none';

        // Generate blocks for each guess using suggestedStats
        suggestedStats.reverse().forEach((stats, index) => {
          const guessDiv = document.createElement("div");
          guessDiv.classList.add("guess-result");

          const block = document.createElement("div");
          block.classList.add("result-block");
          block.textContent = stats;
          guessDiv.appendChild(block);

          resultContainer.appendChild(guessDiv);
        });
        // Add the message with the link
        const shareMessage = document.createElement("p");
        shareMessage.innerHTML = `I guessed the Dota 2 hero! Try it yourself at <a href="${gamelink}" target="_blank">${gamelink}</a>`;
        shareMessage.classList.add("share-message");
        resultContainer.appendChild(shareMessage);

        // Add the copy to clipboard button
        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy to Clipboard";
        copyButton.classList.add("copy-button");
        copyButton.addEventListener("click", () => copyToClipboard(resultContainer));
        resultContainer.appendChild(copyButton);

      }

      function copyToClipboard(container) {
        const textToCopy = Array.from(container.querySelectorAll(".guess-result"))
            .map(guessDiv => Array.from(guessDiv.querySelectorAll(".result-block"))
            .map(block => block.textContent)
            .join(" "))
            .join("\n") + `\nI guessed the Dota 2 hero! Try it yourself at https://saint11.github.io/HeroGuesser/`; // Replace with your actual game URL
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert("Copied to clipboard!");
        });
    }

    })
    .catch(error => console.error('Error fetching hero data:', error));
});
