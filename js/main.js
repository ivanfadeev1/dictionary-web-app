/* Animation */

const searchContainer = document.querySelector(".main__search");

function animateSearchBar() {
  searchContainer.classList.add("animation-search-input");
  setTimeout(
    () => searchContainer.classList.remove("animation-search-input"),
    2000,
  );
}

/* Theme toggle */

const themeToggleInput = document.querySelector(".toggle__input");
const themeToggleLabel = document.querySelector(".header__theme-toggle");

function handleThemeToggleChange() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.theme = isDark ? "dark" : "light";
}

function themeToggleLabelKeydown(event) {
  if (event.key === "Enter") themeToggleLabel.click();
}

themeToggleInput.addEventListener("change", handleThemeToggleChange);
themeToggleLabel.addEventListener("keydown", themeToggleLabelKeydown);

/* Result display and history navigation */

const headerLogo = document.querySelector(".header__logo");
const mainContent = document.querySelector(".main__content");
const resultTemplate =
  document.getElementById("result-template").content.firstElementChild;
const meaningTemplate = document.getElementById("result__meaning-template")
  .content.firstElementChild;
const definitionTemplate = document.getElementById(
  "result__definition-item-template",
).content.firstElementChild;
const sourceTemplate = document.getElementById("result__source-template")
  .content.firstElementChild;
const notFoundTemplate =
  document.getElementById("not-found-template").content.firstElementChild;

function addSynonymItem(parentElement, synonymData) {
  const synonymItem = document.createElement("a");
  synonymItem.classList.add("result__synonym-item");
  synonymItem.href = "#";
  synonymItem.textContent = synonymData;
  parentElement.append(synonymItem);

  async function handleSynonymItemClick(event) {
    event.preventDefault();
    await fetchAndAddSearchResult(synonymItem.textContent);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }

  synonymItem.addEventListener("click", handleSynonymItemClick);
}

function addDefinitionItem(parentElement, definitionData) {
  const definitionItem = definitionTemplate.cloneNode(true);
  const definitionValue = definitionItem.querySelector(
    ".result__definition-value",
  );
  const definitionExample = definitionItem.querySelector(
    ".result__definition-example",
  );

  definitionValue.textContent = definitionData.definition;

  if (!definitionData.example) {
    definitionExample.remove();
  } else {
    const [firstExample] = definitionData.example.split(/\s{2,}/);

    const isQuote = firstExample[0] === firstExample[0].toUpperCase();
    definitionExample.textContent = isQuote
      ? `“${firstExample}”`
      : firstExample;
  }

  parentElement.append(definitionItem);
}

function addMeaningItem(parentElement, meaningData) {
  const meaningItem = meaningTemplate.cloneNode(true);
  const partOfSpeechTitle = meaningItem.querySelector(
    ".result__part-of-speech-title",
  );
  const definitionList = meaningItem.querySelector(".result__definition-list");
  const synonymWrapper = meaningItem.querySelector(".result__synonym-wrapper");
  const synonymList = meaningItem.querySelector(".result__synonym-list");

  partOfSpeechTitle.textContent = meaningData.partOfSpeech;

  if (!meaningData.definitions.length) {
    definitionList.remove();
  } else {
    meaningData.definitions.forEach((definitionData) =>
      addDefinitionItem(definitionList, definitionData),
    );
  }

  if (!meaningData.synonyms.length) {
    synonymWrapper.remove();
  } else {
    meaningData.synonyms.forEach((synonymData) =>
      addSynonymItem(synonymList, synonymData),
    );
  }

  parentElement.append(meaningItem);
}

function displayResult(data) {
  const result = resultTemplate.cloneNode(true);
  const wordTitle = result.querySelector(".result__word-title");
  const phonetic = result.querySelector(".result__phonetic");
  const audio = result.querySelector(".result__audio");
  const audioButton = result.querySelector(".result__audio-button");
  const source = sourceTemplate.cloneNode(true);
  const sourceLink = source.querySelector(".result__source-link");

  mainContent.innerHTML = "";
  mainContent.append(result);

  wordTitle.textContent = data.word;
  phonetic.textContent =
    data.phonetic ||
    data.phonetics[0].text ||
    data.phonetics[1].text ||
    "phonetics unavailable";

  audio.src =
    data.phonetics[0].audio ||
    data.phonetics[1].audio ||
    data.phonetics[2].audio;

  audioButton.addEventListener("click", () => audio.play());

  data.meanings.forEach((meaningData) => addMeaningItem(result, meaningData));

  const sourceUrl = data.sourceUrls[0];
  sourceLink.href = sourceUrl;
  sourceLink.textContent = sourceUrl;

  result.append(source);
}

async function fetchAndAddSearchResult(input) {
  let word = input;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    if (!response.ok) throw new Error("Word not found");
    const data = await response.json();
    displayResult(data[0]);
    document.title = word[0].toUpperCase() + word.slice(1);
  } catch (err) {
    mainContent.innerHTML = "";
    mainContent.append(notFoundTemplate);
    word = "not-found";
    document.title = "Not found";
    animateSearchBar();
  } finally {
    if (window.history.state?.word !== word) {
      window.history.pushState({ word }, "", `?word=${word.toLowerCase()}`);
    }
  }
}

async function handlePopstate(event) {
  if (!window.location.search) {
    headerLogo.click();
    return;
  }

  const word = event.state?.word;
  if (word) await fetchAndAddSearchResult(word);
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
}

function loadDefaultResult() {
  const word = window.location.search.split("=")[1];
  fetchAndAddSearchResult(word || "keyboard");
  animateSearchBar();
}

function loadEmptyResult(event) {
  event.preventDefault();
  mainContent.innerHTML = "";
  if (window.history.state?.word !== "") {
    const currentURL = new URL(window.location.href);
    currentURL.searchParams.delete("word");
    window.history.pushState({ word: "" }, "", currentURL);
  }
  searchInput.parentNode.classList.remove("search--invalid");
  animateSearchBar();
}

headerLogo.addEventListener("click", loadEmptyResult);
window.addEventListener("popstate", handlePopstate);
window.addEventListener("DOMContentLoaded", loadDefaultResult);

/* Search bar interface */

const searchInput = document.querySelector(".search__input");
const searchButton = document.querySelector(".search__button");

function handleSearchInputFocus() {
  searchInput.parentNode.classList.remove("search--invalid");
  searchInput.parentNode.classList.add("search--active");
}

function handleSearchInputBlur() {
  searchInput.parentNode.classList.remove("search--active");
}

function handleSearchSubmit(event) {
  if (event.type === "keydown" && event.key !== "Enter") return;

  if (!searchInput.value) {
    searchInput.parentNode.classList.add("search--invalid");
    mainContent.innerHTML = "";
  } else {
    fetchAndAddSearchResult(searchInput.value);
    searchInput.value = "";
  }

  searchInput.blur();
}

searchInput.addEventListener("focus", handleSearchInputFocus);
searchInput.addEventListener("blur", handleSearchInputBlur);
searchInput.addEventListener("keydown", handleSearchSubmit);
searchButton.addEventListener("click", handleSearchSubmit);

/* Custom select */

const fontSetting = document.querySelector(".header__font-setting");
const fontButton = document.querySelector(".header__font-button");
const fontButtonValue = document.querySelector(".header__font-button-value");
const fontList = document.querySelector(".header__font-list");

let timerId;

function showFontSetting() {
  clearTimeout(timerId);
  fontSetting.classList.add("header__font-setting--active");
  fontButton.setAttribute("aria-expanded", true);
}

function hideFontSetting() {
  fontSetting.classList.remove("header__font-setting--active");
  fontButton.setAttribute("aria-expanded", false);
}

function toggleFontSetting() {
  if (fontSetting.classList.contains("header__font-setting--active")) {
    hideFontSetting();
  } else {
    showFontSetting();
  }
}

function handleFontSettingPointerenter() {
  if (document.documentElement.clientWidth <= 814) return;
  showFontSetting();
}

function handleFontSettingPointerleave() {
  if (document.documentElement.clientWidth <= 814) return;

  timerId = setTimeout(() => {
    hideFontSetting();
  }, 300);
}

function handleFontOptionSelection(event) {
  let targetOptionLabel = event.target.closest(".header__font-option-label");
  if (event.type === "keyup" && event.key === "Enter") {
    targetOptionLabel = event.target.nextElementSibling;
  }
  if (!targetOptionLabel) return;

  fontButtonValue.textContent = targetOptionLabel.textContent;
  document.body.className = `body--${targetOptionLabel.previousElementSibling.id}`;
  hideFontSetting();
}

fontButton.addEventListener("click", toggleFontSetting);
fontButton.addEventListener("pointerenter", handleFontSettingPointerenter);
fontButton.addEventListener("pointerleave", handleFontSettingPointerleave);
fontList.addEventListener("pointerenter", handleFontSettingPointerenter);
fontList.addEventListener("pointerleave", handleFontSettingPointerleave);
fontList.addEventListener("click", handleFontOptionSelection);
fontList.addEventListener("keyup", handleFontOptionSelection);
