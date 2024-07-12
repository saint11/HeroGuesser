import { submitFeedback, submitGuesses, getWorldStats } from './api.js';
import { getDayCountFrom2024, getHoursUntilNextDay, formatNumber } from './calc.js'

document.addEventListener("DOMContentLoaded", () => {

  const heroInput = document.getElementById("hero-input");
  const suggestions = document.getElementById("suggestions");
  const guessButton = document.getElementById("guess-button");
  const guessesContainer = document.getElementById("guesses");
  const resultContainer = document.getElementById("results");
  const randomHeroButton = document.getElementById("random-hero-button");
  const randomHeroButtonIntro = document.getElementById("random-hero-button-intro");
  const instructions = document.getElementById("instructions");
  const feedbackTitle = document.getElementById('feedback-title');
  const worldStats = document.getElementById('world-stats');

  const gamelink = "https://saint11.github.io/HeroGuesser/";

  const DELAY = 0.2;

  let selectedHeroes = [];
  let suggestedHeroes = [];
  let suggestedStats = [];
  let suggestedIndex = 0;
  let heroes = [];
  let chosenHero = null;
  let gg = false;
  let seededRandom = -1;
  let heroReported = "None";
  let reportInitialized = false;
  let guessCount = 0;
  let worldInfo = {};
  let current_day = 0;

  const urlParams = new URLSearchParams(window.location.search);
  seededRandom = urlParams.get('random');

  // Before anything, get the current day
  current_day = getDayCountFrom2024() - 185;

  // show world stats, if available
  fetchWorldStats();

  // Fetch hero data from the JSON file
  fetch('dota2_heroes.json')
    .then(response => response.json())
    .then(data => {
      heroes = data;
      chooseHero();

      randomHeroButtonIntro.addEventListener("click", () => {
        window.location.href = `${window.location.pathname}?random=${getLargeRandomInt()}`;
      });
      randomHeroButton.addEventListener("click", () => {
        window.location.href = `${window.location.pathname}?random=${getLargeRandomInt()}`;
      });

      heroInput.addEventListener("input", () => {
        const query = heroInput.value.toLowerCase();
        suggestions.innerHTML = '';

        if (query == "gg") {
          suggestedHeroes = [];
        }
        else if (query) {
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

      // Linear Congruential Generator (LCG)
      function LCG(seed) {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        seed = (a * seed + c) % m;
        return seed;
      }

      // Fisher-Yates Shuffle
      function shuffle(array, seed) {
        let m = array.length, t, i;
        while (m) {
          seed = LCG(seed);
          i = Math.floor((seed / m) % m);
          m--;
          t = array[m];
          array[m] = array[i];
          array[i] = t;
        }
        return array;
      }

      // Function to get a hero deterministically
      function getHero(seed) {
        seed += 124;
        // Generate an array of hero indices
        let indices = Array.from({ length: heroes.length }, (_, i) => i);

        // Shuffle the indices using the seed
        indices = shuffle(indices, seed);

        // Get the hero for the current day
        const todayIndex = seed % heroes.length;
        const chosenHero = heroes[indices[todayIndex]];
        console.log(chosenHero);
        return chosenHero;
      }

      function chooseHero() {
        const title = document.querySelector("h1");
        const randomText = document.createElement("div");
        randomText.textContent = "(random!)";
        randomText.style.fontSize = "0.5em";
        randomText.style.color = "#8AD";
        if (seededRandom > 0) {
          chosenHero = getHero(seededRandom);

          randomText.textContent = "(random!)";
        }
        else {
          chosenHero = chosenHero = getHero(current_day);
          randomText.textContent = `Day #${current_day} (${getHoursUntilNextDay().toFixed(0)} hours left)`;
        }

        title.appendChild(randomText);
      }

      function getLargeRandomInt() {
        return Math.floor(Math.random() * 20000);
      }

      function addGuess(hero = null) {
        guessCount++;

        // Disable input and button
        heroInput.disabled = true;
        guessButton.disabled = true;

        if (!hero) {

          // Player gave up
          if (heroInput.value.toLowerCase() == "gg") {
            hero = chosenHero;
            gg = true;
          }

          else {
            const firstSuggestion = suggestedHeroes[suggestedIndex];
            let heroName = heroInput.value.trim();
            if (firstSuggestion) {
              heroName = firstSuggestion;
            }
            hero = heroes.find(h => h.localized_name.toLowerCase() === heroName.toLowerCase());
          }
        }

        if (!hero) {
          alert("Please enter a valid hero name.");
          heroInput.disabled = false;
          guessButton.disabled = false;
          return;
        }

        if (instructions) {
          instructions.style.display = 'none';
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

        // Add feedback button with an icon and tooltip
        const feedbackButton = document.createElement("button");
        feedbackButton.classList.add("feedback-button");
        feedbackButton.innerHTML = '<i class="fas fa-flag"></i>';
        feedbackButton.title = "Report!";
        const heroName = hero.localized_name;
        feedbackButton.addEventListener("click", () => {
          heroReported = heroName;
          openFeedbackModal(heroReported)
        });
        heroNameDiv.appendChild(feedbackButton);

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
          { id: "gender", label: "Gender", value: hero.gender },
          { id: "difficulty", label: "Difficulty", value: createDiamonds(hero.difficulty) },
          { id: "weapon_type", label: "Weapon", value: hero.weapon_type, tooltip: "<p>Possible weapon types are:</p><br><ul><li>Unarmed</li><li>Bow</li><li>Blunt</li><li>Blade (anything with an edge)</li><li>Magical</li><li>Other(guns, spit, etc)</li></ul>" },
          { id: "roles", label: false, value: hero.roles.join(', '), tooltip: "From Dota 2 official website" },
          { id: "attack_range", label: "Attack Range", value: `${hero.attack_range} ${getAttackTypeIcon(hero.attack_type, chosenHero.attack_type)}` },
          { id: "armor", label: "Armor", value: (hero.base_armor + hero.base_agi * 0.167).toFixed(1), tooltip: "Armor at level 1 without any bonuses." },
          { id: "move_speed", label: "Move Speed", value: hero.move_speed },
          { id: "legs", label: "Legs", value: hero.legs, tooltip: "<ul><li>Legs do NOT count the mount.</li><li>Legs do NOT count hands, even if the hero stands on it.</li></ul>" },
        ];

        stats.forEach((stat, index) => {
          const statDiv = document.createElement("div");
          statDiv.id = stat.id;
          if (stat.label) {
            statDiv.innerHTML = `<span>${stat.label}:</span> ${stat.value}`;
          }
          else {
            statDiv.innerHTML = `${stat.value}`;
          }

          if (stat.tooltip) {
            statDiv.classList.add('tooltip'); // Add a class for styling
            statDiv.dataset.tooltip = stat.tooltip; // Store the tooltip text in a data attribute

            statDiv.addEventListener('mouseover', (event) => {
              const tooltip = document.getElementById('global-tooltip');
              tooltip.innerHTML = event.currentTarget.dataset.tooltip;
              tooltip.style.display = 'block';
            });

            statDiv.addEventListener('mousemove', (event) => {
              const tooltip = document.getElementById('global-tooltip');
              tooltip.style.left = (event.pageX + 10) + 'px'; // Position tooltip near the mouse cursor
              tooltip.style.top = (event.pageY + 10) + 'px';
            });

            statDiv.addEventListener('mouseout', () => {
              const tooltip = document.getElementById('global-tooltip');
              tooltip.style.display = 'none';
            });
          }

          statDiv.classList.add("animate__animated", "animate__flipInX");
          statDiv.style.animationDelay = `${index * DELAY}s`;
          heroStatsDiv.appendChild(statDiv);
        });

        guessDiv.appendChild(heroStatsDiv);
        guessesContainer.appendChild(guessDiv, guessesContainer.firstChild);
        heroStatsDiv.scrollIntoView({ block: "end", behavior: "smooth" });

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

      function openFeedbackModal(heroName) {
        const modal = document.getElementById('feedback-modal');
        const closeButton = modal.querySelector('.close-button');

        suggestions.style.display = 'none';

        feedbackTitle.innerText = `Report ${heroName} for intentional feeding`;

        // Show the modal
        modal.style.display = 'block';

        // Event listener to close the modal
        closeButton.addEventListener('click', () => {
          modal.style.display = 'none';
          suggestions.style.display = 'block';
        });

        // Close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
          if (event.target === modal) {
            modal.style.display = 'none';
            suggestions.style.display = 'block';
          }
        });

        // Add dynamic fields for each stat on the report window
        if (!reportInitialized) {
          reportInitialized = true;
          const dynamicFieldsContainer = document.getElementById('dynamic-feedback-fields');

          const stats = [
            { id: "primary_attr", label: "Attribute" },
            { id: "gender", label: "Gender" },
            { id: "difficulty", label: "Difficulty" },
            { id: "weapon_type", label: "Weapon", disclaimer: "Possible weapon types are:<br><ul><li>Unarmed</li><li>Bow</li><li>Blunt</li><li>Blade (anything with an edge)</li><li>Magical</li><li>Other(guns, spit, etc)</li></ul>" },
            { id: "roles", label: "Roles", disclaimer: "Values directly from Dota 2 official website. (I also don't agree with some)" },
            { id: "attack_range", label: "Attack Range", },
            { id: "armor", label: "Armor", disclaimer: "Armor at level 1 without any bonuses." },
            { id: "move_speed", label: "Move Speed" },
            {
              id: "legs", label: "Legs", disclaimer: `<ul><li>Legs do NOT count the mount (horse, lizard), just the hero.
  <li>Legs do NOT count hands, even if the hero stands on it. If it has opposing thumbs, it doesn't count.
  <li>Underlord do not have 4 legs, he has 4 arms, 2 legs. Don't fight me, fight Valve</ul>` },
          ];

          stats.forEach(stat => {
            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('feedback-field');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = `feedback-${stat.id}`;
            radio.name = 'feedback-stat';
            radio.value = stat.id;

            const label = document.createElement('label');
            label.htmlFor = `feedback-${stat.id}`;
            label.textContent = `${stat.label}`;

            fieldDiv.appendChild(radio);
            fieldDiv.appendChild(label);

            dynamicFieldsContainer.appendChild(fieldDiv);

            // Add event listener for the radio button
            radio.addEventListener('change', () => {
              const feedbackDisclaimer = document.getElementById('feedback-disclaimer');
              if (stat.disclaimer) {
                feedbackDisclaimer.style.display = 'block';
                feedbackDisclaimer.innerHTML = `${stat.disclaimer}`;
              } else {
                feedbackDisclaimer.style.display = 'none';
              }
            });
          });
        }
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

      function getAttackTypeIcon(attackType, correct) {
        let isCorrect = (attackType == correct) ? "_correct" : "_wrong";

        const meleeIcon = `img/melee${isCorrect}.png`;
        const rangedIcon = `img/ranged${isCorrect}.png`;

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
        stats += compareText(guessHero.gender, chosenHero.gender, guessDiv.querySelector('#gender'));
        stats += compareNumber(guessHero.difficulty, chosenHero.difficulty, guessDiv.querySelector('#difficulty'));
        stats += compareText(guessHero.weapon_type, chosenHero.weapon_type, guessDiv.querySelector('#weapon_type'));
        stats += compareArrayIndividual(guessHero.roles, chosenHero.roles, guessDiv.querySelector('#roles'));
        stats += compareAttack(guessHero.attack_range, chosenHero.attack_range, guessHero.attack_type, chosenHero.attack_type, guessDiv.querySelector('#attack_range'));
        stats += compareNumber((guessHero.base_armor + guessHero.base_agi * 0.167).toFixed(1), (chosenHero.base_armor + chosenHero.base_agi * 0.167).toFixed(1), guessDiv.querySelector('#armor'));
        stats += compareNumber(guessHero.move_speed, chosenHero.move_speed, guessDiv.querySelector('#move_speed'));
        stats += compareNumber(guessHero.legs, chosenHero.legs, guessDiv.querySelector('#legs'));

        suggestedStats.push(stats);
      }

      function compareArrayIndividual(guessArray, actualArray, div) {
        if (div) {
          const matchCount = guessArray.filter(value => actualArray.includes(value)).length;
          if (matchCount === actualArray.length && matchCount === guessArray.length) {
            div.classList.add("correct");
            return '🟩';
          } else if (matchCount > 0) {
            div.classList.add("incorrect");
            const highlightedRoles = guessArray.map(value => {
              return actualArray.includes(value) ? `<span style="color: green;">${value}</span>` : value;
            }).join(', ');
            if (actualArray.length != guessArray.length && matchCount == guessArray.length) {
              div.innerHTML = `${highlightedRoles}, <span>[...]</span>`;
            }
            else {
              div.innerHTML = `${highlightedRoles}`;
            }
            return '🟨';
          } else {
            div.classList.add("incorrect");
            return '🟥';
          }
        }
        return '🟥';
      }

      function createDiamonds(difficulty) {
        const container = document.createElement('difficulty-container');

        for (let i = 0; i < 3; i++) {
          const diamond = document.createElement('div');
          if (difficulty > i) {
            diamond.className = 'diamond';
          }
          else {
            diamond.className = 'diamond empty';
          }

          container.appendChild(diamond);
        }

        return container.innerHTML;
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

      function compareAttack(guessAttackRange, actualAttackRange, guessType, actualType, div) {
        if (div) {

          if (guessAttackRange > actualAttackRange) {
            div.innerHTML += ` ⬇️`;
          }
          else if (guessAttackRange < actualAttackRange) {
            div.innerHTML += ` ⬆️`;
          }

          if (guessAttackRange == actualAttackRange && guessType == actualType) {
            div.classList.add("correct");
            return '🟩';
          } else if (guessType == actualType) {
            div.classList.add("partial");
            return '🟨';
          }
          else if (guessAttackRange == actualAttackRange) {
            div.classList.add("partial");
            return '🟨';
          }
          else {
            div.classList.add("incorrect");
            return '🟥';
          }
        }
      }

      function compareNumber(guessValue, actualValue, div) {
        let difference = Math.abs(guessValue - actualValue);
        let result = '🟥';

        if (div) {
          // Close enough
          if (difference < 0.001) {
            div.classList.add("correct");
            result = '🟩';
          } else {
            // Close call
            if (difference < 0.6) {
              div.classList.add("partial");
            }
            else {
              div.classList.add("incorrect");
            }
            if (guessValue > actualValue) {
              div.innerHTML += ` ⬇️`;
            } else {
              div.classList.add("incorrect");
              div.innerHTML += ` ⬆️`;
            }

          }
        }

        return result;
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
        if (gg) {

          const giveUpMessages = [
            "GG! You gave up!",
            "GG! Maybe try again with Aegis next time!",
            // TODO: Add more messages
          ];

          // Select a random message
          const randomIndex = Math.floor(Math.random() * giveUpMessages.length);
          let shareMessageContent = giveUpMessages[randomIndex];

          if (worldInfo) {
            shareMessageContent += ` But don't worry, ${worldInfo.player_count_gave_up} others also gave up today!`;
          }

          shareMessage.innerHTML = shareMessageContent;

        }
        else {
          shareMessage.innerHTML = `You guessed today's Dota 2 hero!`;
        }

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

        const guessData = {
          random: (seededRandom > 0),
          guesses: guessCount,
          gaveUp: gg,
          day: current_day
        };
        submitGuesses(guessData)
          .then(response => console.log(response))
          .catch(error => console.error(error));
      }

      function copyToClipboard(container) {
        let guessText = "";
        if (seededRandom > 0) {
          if (!gg) {
            guessText = `I guessed a random Dota 2 hero!\nttps://saint11.github.io/HeroGuesser/?random=${getLargeRandomInt()}`;
          }
          else {
            guessText = `I Gave up guessing a random Dota 2 hero!\nttps://saint11.github.io/HeroGuesser/?random=${getLargeRandomInt()}`;
          }
        }
        else {
          if (!gg) {
            guessText = `I guessed today's Dota 2 hero!\nhttps://saint11.github.io/HeroGuesser/`;
          }
          else {
            guessText = `I gave up guessing today's Dota 2 hero!\nhttps://saint11.github.io/HeroGuesser/`;
          }
        }

        let textToCopy = Array.from(container.querySelectorAll(".guess-result"))
          .map(guessDiv => Array.from(guessDiv.querySelectorAll(".result-block"))
            .map(block => block.textContent)
            .join(" "))
          .join("\n") + "\n" + guessText;

        navigator.clipboard.writeText(textToCopy);
      }


      // Function to fetch and display the changelog
      async function fetchChangelog() {
        const url = 'changelog.md'; // Path to your markdown file

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch changelog');
          }
          const markdown = await response.text();
          const converter = new showdown.Converter();
          const html = converter.makeHtml(markdown);
          document.getElementById('changelog-content').innerHTML = html;
        } catch (error) {
          console.error('Error fetching changelog:', error);
          document.getElementById('changelog-content').innerHTML = '<p>Error loading changelog.</p>';
        }
      }

      // Event listener for changelog button
      document.getElementById('changelog-button').addEventListener('click', () => {
        const changelogContent = document.getElementById('changelog-content');
        if (changelogContent.style.display === 'none') {
          fetchChangelog();
          changelogContent.style.display = 'block';
          document.getElementById('changelog-button').textContent = 'Hide Changelog';
        } else {
          changelogContent.style.display = 'none';
          document.getElementById('changelog-button').textContent = 'Show Changelog';
        }
      });

      // Event listener to handle form submission
      document.getElementById('feedback-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const feedbackForm = document.getElementById('feedback-form');
        const formData = new FormData(feedbackForm);

        const data = {
          hero: heroReported,
          feedback: formData.get('feedback'),
          stat: formData.get('feedback-stat')
        };

        try {
          const message = await submitFeedback(data);
          alert(message);
        } catch (error) {
          alert(error.message);
        }

        document.getElementById('feedback-modal').style.display = 'none';
        suggestions.style.display = 'block';
      });
    })
    .catch(error => console.error('Error fetching hero data:', error));


  async function fetchWorldStats() {
    try {
      const worldInfoData = await getWorldStats(current_day);

      if (worldInfoData) {
        const worldInfo = worldInfoData[0];

        if (seededRandom > 0 && worldInfo.player_count_random && worldInfo.average_guesses_random) { // Playing a random game
          worldStats.innerHTML = `<p>${worldInfo.player_count_random} random games were played today! The average number of guesses was ${formatNumber(worldInfo.average_guesses_random)}.</p>`;
        } else if (!seededRandom && worldInfo.player_count_no_random && worldInfo.average_guesses_no_random) { // Playing a normal game
          worldStats.innerHTML = `<p>${worldInfo.player_count_no_random} players guessed today, with an average of ${formatNumber(worldInfo.average_guesses_no_random)} guesses.</p>`;
        } else {
          console.log(worldInfo);
          worldStats.innerHTML = `<p>World stats are currently unavailable. Sorry!</p>`;
        }
      } else {
        worldStats.remove();
      }
    } catch (error) {
      console.error('Error fetching world stats:', error);
      worldStats.innerHTML = `<p>World stats are currently unavailable due to an error. Sorry!</p>`;
    }
  }
});

