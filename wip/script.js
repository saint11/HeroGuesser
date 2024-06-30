document.addEventListener("DOMContentLoaded", () => {

  const heroInput = document.getElementById("hero-input");
  const suggestions = document.getElementById("suggestions");
  const guessButton = document.getElementById("guess-button");
  const guessesContainer = document.getElementById("guesses");
  const resultContainer = document.getElementById("results");
  const randomHeroButton = document.getElementById("random-hero-button");

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
      chooseHero();

      randomHeroButton.addEventListener("click", () => {
        window.location.href = `${window.location.pathname}?random=true`;
      });

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
      function getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        return day;
      }

      function chooseHero() {
        const urlParams = new URLSearchParams(window.location.search);
        isRandom = urlParams.get('random') === 'true';

        if (isRandom) {
            const randomIndex = Math.floor(Math.random() * heroes.length);
            chosenHero = heroes[randomIndex];

            // Add "(random!)" text under the title
            const title = document.querySelector("h1");
            const randomText = document.createElement("div");
            randomText.textContent = "(random!)";
            randomText.style.fontSize = "0.5em";
            randomText.style.color = "#888";
            title.appendChild(randomText);
    
            console.log(chosenHero.localized_name);

        } else {
            const dayOfYear = getDayOfYear();
            const randomIndex = dayOfYear % heroes.length;
            chosenHero = heroes[randomIndex];
        }
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
        guessDiv.classList.add("guess", "animate__animated", "animate__bounceIn");

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
          lastGuess.classList.add('old');
          lastGuess.classList.remove("animate__animated");
        }

        const stats = [
          { id: "primary_attr", label: "Attribute", value: `${getPrimaryAttrIcon(hero.primary_attr)}` },
          { id: "base_str", label: "Base Strength", value: hero.base_str },
          { id: "base_agi", label: "Base Agility", value: hero.base_agi },
          { id: "base_int", label: "Base Intelligence", value: hero.base_int },
          { id: "roles", label: "Roles", value: hero.roles.join(', ') },
          { id: "attack_type", label: "Attack Type", value: `${hero.attack_type} ${getAttackTypeIcon(hero.attack_type)}` },
          { id: "attack_range", label: "Attack Range", value: `${hero.attack_range} ${getAttackTypeIcon(hero.attack_type)}` },
          { id: "base_armor", label: "Base Armor", value: hero.base_armor },
          { id: "move_speed", label: "Move Speed", value: hero.move_speed },
          { id: "legs", label: "Legs", value: hero.legs },
        ];
        stats.forEach((stat, index) => {
          const statDiv = document.createElement("div");
          statDiv.id = stat.id;
          statDiv.innerHTML = `<span>${stat.label}:</span> ${stat.value}`;
          statDiv.classList.add("animate__animated", "animate__flipInX");
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
            heroInput.focus();
            guessButton.disabled = false;
          }, stats.length * (DELAY * 1000)); // Delay to match the animation delay
        }

        hero = "";
        suggestions.innerHTML = '';
      }

      function getPrimaryAttrIcon(primaryAttr) {
        const strengthIcon = 'img/strength.png';
        const agilityIcon = 'img/agility.png';
        const intelligenceIcon = 'img/intelligence.png';
        const universalIcon = 'img/universal.png';

        switch (primaryAttr.toLowerCase()) {
          case 'str':
            return `<img src="${strengthIcon}" alt="Strength" style="width: 24px; height: 24px;">`;
          case 'agi':
            return `<img src="${agilityIcon}" alt="Agility" style="width: 24px; height: 24px;">`;
          case 'int':
            return `<img src="${intelligenceIcon}" alt="Intelligence" style="width: 24px; height: 24px;">`;
          default:
            return `<img src="${universalIcon}" alt="Intelligence" style="width: 24px; height: 24px;">`;
        }
      }

      function getAttackTypeIcon(attackType) {
        const meleeIcon = 'img/melee.png';
        const rangedIcon = 'img/ranged.png';

        if (attackType.toLowerCase() === 'melee') {
          return `<img src="${meleeIcon}" alt="Melee" style="width: 24px; height: 24px;">`;
        } else if (attackType.toLowerCase() === 'ranged') {
          return `<img src="${rangedIcon}" alt="Ranged" style="width: 24px; height: 24px;">`;
        } else {
          return ''; // Return an empty string if the attack type is neither melee nor ranged
        }
      }


      function compareStats(guessHero, chosenHero, guessDiv) {
        let stats = "";

        stats += compareText(guessHero.primary_attr, chosenHero.primary_attr, guessDiv.querySelector('#primary_attr'));
        stats += compareText(guessHero.attack_type, chosenHero.attack_type, guessDiv.querySelector('#attack_type'));
        stats += compareArrayIndividual(guessHero.roles, chosenHero.roles, guessDiv.querySelector('#roles'));
        stats += compareNumber(guessHero.base_armor, chosenHero.base_armor, guessDiv.querySelector('#base_armor'));
        stats += compareNumber(guessHero.base_str, chosenHero.base_str, guessDiv.querySelector('#base_str'));
        stats += compareNumber(guessHero.base_agi, chosenHero.base_agi, guessDiv.querySelector('#base_agi'));
        stats += compareNumber(guessHero.base_int, chosenHero.base_int, guessDiv.querySelector('#base_int'));
        stats += compareNumber(guessHero.move_speed, chosenHero.move_speed, guessDiv.querySelector('#move_speed'));
        stats += compareNumber(guessHero.legs, chosenHero.legs, guessDiv.querySelector('#legs'));
        stats += compareNumber(guessHero.attack_range, chosenHero.attack_range, guessDiv.querySelector('#attack_range'));

        suggestedStats.push(stats);
      }

      function compareArrayIndividual(guessArray, actualArray, div) {
        if (div) {
            const matchCount = guessArray.filter(value => actualArray.includes(value)).length;
            if (matchCount === actualArray.length && matchCount === guessArray.length) {
                div.classList.add("correct");
                return '🟩';
            } else if (matchCount > 0) {
                div.classList.add("partial");
                const highlightedRoles = guessArray.map(value => {
                    return actualArray.includes(value) ? `<span style="color: green;">${value}</span>` : value;
                }).join(', ');
                div.innerHTML = `<span>Roles:</span> ${highlightedRoles}`;
                return '🟨';
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
        heroIcon.src = `img/heroes/${iconPath}`;
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

        // Show the random hero button
        randomHeroButton.style.display = 'block';
      }

      function copyToClipboard(container) {
        let textToCopy = Array.from(container.querySelectorAll(".guess-result"))
          .map(guessDiv => Array.from(guessDiv.querySelectorAll(".result-block"))
            .map(block => block.textContent)
            .join(" "))
          .join("\n") + `\nI guessed the Dota 2 hero! Try it yourself at https://saint11.github.io/HeroGuesser/`; // Replace with your actual game URL
        
          if (isRandom){
          textToCopy += `\nMy random hero was ${chosenHero.localized_name}`
        }
        navigator.clipboard.writeText(textToCopy);
      }

    })
    .catch(error => console.error('Error fetching hero data:', error));
});
