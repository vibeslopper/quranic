(function () {
  "use strict";

  var modes = [
    { id: "number-name", label: "Number → name", description: "See a surah number and choose its transliterated name." },
    { id: "name-number", label: "Name → number", description: "See a transliterated name and enter its surah number." },
    { id: "name-meaning", label: "Name → meaning", description: "See a transliterated name and choose its English meaning." },
    { id: "meaning-name", label: "Meaning → name", description: "See an English meaning and choose the transliterated name." },
    { id: "meaning-number", label: "Meaning → number", description: "See an English meaning and enter its surah number." },
    { id: "arabic-name", label: "Arabic → name", description: "See the Arabic name and choose its English transliteration." },
    { id: "order", label: "Surah order", description: "Choose the surah immediately before or after another surah." }
  ];

  var modeSelect = document.getElementById("mode-select");
  var rangeSelect = document.getElementById("range-select");
  var modeDescription = document.getElementById("mode-description");
  var roundSize = document.getElementById("round-size");
  var startButton = document.getElementById("start-button");
  var studyButton = document.getElementById("study-button");
  var setupScreen = document.getElementById("setup-screen");
  var studyScreen = document.getElementById("study-screen");
  var quizScreen = document.getElementById("quiz-screen");
  var studyList = document.getElementById("study-list");
  var progressSummary = document.getElementById("progress-summary");
  var resetProgressButton = document.getElementById("reset-progress-button");
  var resetConfirmation = document.getElementById("reset-confirmation");
  var confirmResetButton = document.getElementById("confirm-reset-button");
  var cancelResetButton = document.getElementById("cancel-reset-button");
  var roundResult = document.getElementById("round-result");
  var activeMode = document.getElementById("active-mode");
  var questionCounter = document.getElementById("question-counter");
  var questionHeading = document.getElementById("question-heading");
  var arabicCaption = document.getElementById("arabic-caption");
  var arabicPrompt = document.getElementById("arabic-prompt");
  var answerForm = document.getElementById("answer-form");
  var choicesFieldset = document.getElementById("choices-fieldset");
  var choiceList = document.getElementById("choice-list");
  var numberAnswerField = document.getElementById("number-answer-field");
  var numberAnswerInput = document.getElementById("number-answer-input");
  var submitAnswerButton = document.getElementById("submit-answer-button");
  var exitQuizButton = document.getElementById("exit-quiz-button");
  var answerFeedback = document.getElementById("answer-feedback");
  var nextQuestionButton = document.getElementById("next-question-button");
  var setupStorageStatus = document.getElementById("setup-storage-status");
  var quizStorageStatus = document.getElementById("storage-status");

  var currentMode = "number-name";
  var currentRange = { first: 1, last: 114 };
  var questionQueue = [];
  var questionIndex = 0;
  var currentOptions = [];
  var selectedChoice = -1;
  var answerLocked = false;
  var currentProgress = null;
  var correctThisRound = 0;
  var answeredThisRound = 0;

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isValidSurahData() {
    if (typeof SURAHS === "undefined" || !Array.isArray(SURAHS) || SURAHS.length !== 114) {
      return false;
    }
    for (var i = 0; i < SURAHS.length; i += 1) {
      var surah = SURAHS[i];
      if (!surah || surah.number !== i + 1 || typeof surah.name !== "string" || !surah.name ||
        typeof surah.arabic !== "string" || !surah.arabic || typeof surah.meaning !== "string" || !surah.meaning) {
        return false;
      }
      if (surah.meaningSource !== "source" && surah.meaningSource !== "agent") {
        return false;
      }
      if (surah.meaningQuizEligible !== undefined && typeof surah.meaningQuizEligible !== "boolean") {
        return false;
      }
    }
    return true;
  }

  function getMode(modeId) {
    for (var i = 0; i < modes.length; i += 1) {
      if (modes[i].id === modeId) {
        return modes[i];
      }
    }
    return modes[0];
  }

  function isMeaningMode(modeId) {
    return modeId === "name-meaning" || modeId === "meaning-name" || modeId === "meaning-number";
  }

  function isChoiceMode(modeId) {
    return modeId !== "name-number" && modeId !== "meaning-number";
  }

  function answerFieldForMode(modeId) {
    return modeId === "name-meaning" ? "meaning" : "name";
  }

  function meaningLabel(surah) {
    return surah.meaning + (surah.meaningSource === "agent" ? " *" : "");
  }

  function rangeFromSelect() {
    if (rangeSelect.value === "all") {
      return { first: 1, last: 114 };
    }
    var parts = rangeSelect.value.split("-");
    return { first: Number(parts[0]), last: Number(parts[1]) };
  }

  function surahsInRange(range, modeId) {
    var result = [];
    for (var i = 0; i < SURAHS.length; i += 1) {
      var surah = SURAHS[i];
      if (surah.number < range.first || surah.number > range.last) {
        continue;
      }
      if (isMeaningMode(modeId) && surah.meaningQuizEligible === false) {
        continue;
      }
      result.push(surah);
    }
    return result;
  }

  function meaningSurahs() {
    var result = [];
    for (var i = 0; i < SURAHS.length; i += 1) {
      if (SURAHS[i].meaningQuizEligible !== false) {
        result.push(SURAHS[i]);
      }
    }
    return result;
  }

  function shuffle(items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temporary = result[i];
      result[i] = result[j];
      result[j] = temporary;
    }
    return result;
  }

  // Ignore transliteration punctuation and common prefixes when screening distractors.
  function normalizedAnswer(value) {
    return value.toLowerCase()
      .replace(/[’'`]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(the|al|an|as|at|ad|ar|az|ash|adh)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function editDistance(first, second) {
    var previous = [];
    for (var i = 0; i <= second.length; i += 1) {
      previous[i] = i;
    }
    for (var row = 1; row <= first.length; row += 1) {
      var current = [row];
      for (var column = 1; column <= second.length; column += 1) {
        var substitution = previous[column - 1] + (first.charAt(row - 1) === second.charAt(column - 1) ? 0 : 1);
        current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, substitution);
      }
      previous = current;
    }
    return previous[second.length];
  }

  function wordsAreNear(first, second) {
    if (first === second) {
      return first.length >= 4;
    }
    var shorter = first.length < second.length ? first : second;
    var longer = first.length < second.length ? second : first;
    if (shorter.length >= 4 && longer.indexOf(shorter) === 0) {
      return true;
    }
    return shorter.length >= 5 && editDistance(first, second) <= 2;
  }

  function answersAreNear(first, second) {
    var firstKey = normalizedAnswer(first);
    var secondKey = normalizedAnswer(second);
    if (!firstKey || !secondKey || firstKey === secondKey) {
      return true;
    }
    var firstWords = firstKey.split(" ");
    var secondWords = secondKey.split(" ");
    for (var i = 0; i < firstWords.length; i += 1) {
      for (var j = 0; j < secondWords.length; j += 1) {
        if (wordsAreNear(firstWords[i], secondWords[j])) {
          return true;
        }
      }
    }
    return false;
  }

  function sameMeaningGroup(first, second) {
    return Boolean(first.meaningGroup && first.meaningGroup === second.meaningGroup);
  }

  function sameNameGroup(first, second) {
    return Boolean(first.nameGroup && first.nameGroup === second.nameGroup);
  }

  function answerLabel(surah, field) {
    return field === "meaning" ? meaningLabel(surah) : surah.name;
  }

  function makeChoices(correctSurah, pool, field, omittedNumber) {
    var correctLabel = answerLabel(correctSurah, field);
    var distractors = [];
    for (var i = 0; i < pool.length; i += 1) {
      var candidate = pool[i];
      if (candidate.number === correctSurah.number || candidate.number === omittedNumber) {
        continue;
      }
      if (sameMeaningGroup(correctSurah, candidate)) {
        continue;
      }
      if (field === "name" && sameNameGroup(correctSurah, candidate)) {
        continue;
      }
      var candidateLabel = answerLabel(candidate, field);
      if (answersAreNear(correctLabel, candidateLabel)) {
        continue;
      }
      var nearAnotherOption = false;
      for (var j = 0; j < distractors.length; j += 1) {
        var previousOptionSurah = SURAHS[distractors[j].number - 1];
        if (sameMeaningGroup(candidate, previousOptionSurah) ||
          (field === "name" && sameNameGroup(candidate, previousOptionSurah)) ||
          answersAreNear(candidateLabel, distractors[j].label)) {
          nearAnotherOption = true;
          break;
        }
      }
      if (!nearAnotherOption) {
        distractors.push({ number: candidate.number, label: candidateLabel, correct: false });
      }
    }
    if (distractors.length < 3) {
      return [];
    }
    var choices = shuffle(distractors).slice(0, 3);
    choices.push({ number: correctSurah.number, label: correctLabel, correct: true });
    return shuffle(choices);
  }

  function orderReferenceFor(surah, range) {
    // Keep the requested neighbour inside the selected range at its boundaries.
    if (surah.number === range.first) {
      return { number: surah.number + 1, direction: "before" };
    }
    if (surah.number === range.last) {
      return { number: surah.number - 1, direction: "after" };
    }
    if (Math.random() < 0.5) {
      return { number: surah.number + 1, direction: "before" };
    }
    return { number: surah.number - 1, direction: "after" };
  }

  function canStartRound(modeId, targets, range) {
    if (!targets.length) {
      return false;
    }
    if (!isChoiceMode(modeId)) {
      return true;
    }
    var pool = isMeaningMode(modeId) ? meaningSurahs() : SURAHS;
    var field = answerFieldForMode(modeId);
    for (var i = 0; i < targets.length; i += 1) {
      var omittedNumber = null;
      if (modeId === "order") {
        omittedNumber = orderReferenceFor(targets[i], range).number;
      }
      if (makeChoices(targets[i], pool, field, omittedNumber).length !== 4) {
        return false;
      }
    }
    return true;
  }

  function emptyProgress() {
    return { version: 1, surahs: {} };
  }

  function validProgress(progress) {
    if (!isObject(progress) || progress.version !== 1 || !isObject(progress.surahs)) {
      return false;
    }
    for (var key in progress.surahs) {
      if (!hasOwn(progress.surahs, key)) {
        continue;
      }
      var number = Number(key);
      var record = progress.surahs[key];
      if (!Number.isInteger(number) || number < 1 || number > 114 || String(number) !== key || !isObject(record)) {
        return false;
      }
      if (!Number.isInteger(record.attempts) || record.attempts < 0 || record.attempts > 1000000000) {
        return false;
      }
      if (!Number.isInteger(record.correct) || record.correct < 0 || record.correct > record.attempts) {
        return false;
      }
    }
    return true;
  }

  function progressKey(modeId) {
    return "quranic.surahs.v1." + modeId;
  }

  function setStorageMessage(message) {
    setupStorageStatus.textContent = message;
    quizStorageStatus.textContent = message;
  }

  function loadProgress(modeId) {
    var raw;
    try {
      raw = localStorage.getItem(progressKey(modeId));
    } catch (error) {
      setStorageMessage("Browser storage is unavailable; progress will not be saved between visits.");
      return emptyProgress();
    }
    if (raw === null) {
      setStorageMessage("");
      return emptyProgress();
    }
    var saved;
    try {
      saved = JSON.parse(raw);
    } catch (error) {
      setStorageMessage("Saved progress was invalid and has been ignored.");
      return emptyProgress();
    }
    if (!validProgress(saved)) {
      setStorageMessage("Saved progress was invalid and has been ignored.");
      return emptyProgress();
    }
    setStorageMessage("");
    return saved;
  }

  function saveProgress(modeId, progress) {
    try {
      localStorage.setItem(progressKey(modeId), JSON.stringify(progress));
      setStorageMessage("");
      return true;
    } catch (error) {
      setStorageMessage("Progress could not be saved in this browser.");
      return false;
    }
  }

  function showProgressSummary(modeId) {
    var progress = loadProgress(modeId);
    var attempts = 0;
    var correct = 0;
    var surahsPractised = 0;
    for (var key in progress.surahs) {
      if (!hasOwn(progress.surahs, key)) {
        continue;
      }
      attempts += progress.surahs[key].attempts;
      correct += progress.surahs[key].correct;
      surahsPractised += 1;
    }
    progressSummary.textContent = attempts ? correct + " correct out of " + attempts + " answers across " + surahsPractised + " surahs." : "No saved answers for this mode yet.";
  }

  function updateSettings() {
    if (!isValidSurahData()) {
      startButton.disabled = true;
      studyButton.disabled = true;
      roundSize.textContent = "Surah data is incomplete or invalid.";
      return;
    }
    currentMode = modeSelect.value;
    currentRange = rangeFromSelect();
    var mode = getMode(currentMode);
    var targets = surahsInRange(currentRange, currentMode);
    modeDescription.textContent = mode.description;
    showProgressSummary(currentMode);
    resetConfirmation.hidden = true;
    roundSize.textContent = targets.length ? targets.length + " question" + (targets.length === 1 ? "" : "s") + " in this round." : "No surahs in this range can be practised in this mode.";
    if (targets.length && !canStartRound(currentMode, targets, currentRange)) {
      roundSize.textContent = "There are not enough distinct answers in this range to make four-choice questions.";
      startButton.disabled = true;
    } else {
      startButton.disabled = !targets.length;
    }
  }

  function buildStudyTable() {
    while (studyList.firstChild) {
      studyList.removeChild(studyList.firstChild);
    }
    for (var i = 0; i < SURAHS.length; i += 1) {
      var surah = SURAHS[i];
      var row = document.createElement("tr");
      row.className = "border-b border-slate-200 dark:border-slate-700";

      var numberCell = document.createElement("td");
      numberCell.className = "px-3 py-3 align-top";
      numberCell.textContent = String(surah.number);
      row.appendChild(numberCell);

      var nameCell = document.createElement("td");
      nameCell.className = "px-3 py-3 align-top font-medium";
      nameCell.textContent = surah.name;
      row.appendChild(nameCell);

      var arabicCell = document.createElement("td");
      arabicCell.className = "px-3 py-3 align-top text-right font-serif text-2xl";
      arabicCell.setAttribute("lang", "ar");
      arabicCell.setAttribute("dir", "rtl");
      arabicCell.textContent = surah.arabic;
      row.appendChild(arabicCell);

      var meaningCell = document.createElement("td");
      meaningCell.className = "px-3 py-3 align-top";
      meaningCell.textContent = meaningLabel(surah);
      row.appendChild(meaningCell);
      studyList.appendChild(row);
    }
  }

  function showScreen(screen) {
    setupScreen.hidden = screen !== "setup";
    studyScreen.hidden = screen !== "study";
    quizScreen.hidden = screen !== "quiz";
  }

  function buildRound(modeId, targets, range) {
    var questions = [];
    for (var i = 0; i < targets.length; i += 1) {
      var question = { answerNumber: targets[i].number };
      if (modeId === "order") {
        var reference = orderReferenceFor(targets[i], range);
        question.referenceNumber = reference.number;
        question.direction = reference.direction;
      }
      questions.push(question);
    }
    return shuffle(questions);
  }

  function answerPool(modeId) {
    return isMeaningMode(modeId) ? meaningSurahs() : SURAHS;
  }

  function renderChoices(correctSurah, modeId, omittedNumber) {
    while (choiceList.firstChild) {
      choiceList.removeChild(choiceList.firstChild);
    }
    var field = answerFieldForMode(modeId);
    currentOptions = makeChoices(correctSurah, answerPool(modeId), field, omittedNumber);
    selectedChoice = -1;
    for (var i = 0; i < currentOptions.length; i += 1) {
      (function (optionIndex) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "choice-option w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700 aria-pressed:bg-blue-100 aria-pressed:ring-2 aria-pressed:ring-blue-700 dark:border-slate-600 dark:bg-slate-950 dark:hover:bg-slate-800 dark:focus-visible:ring-blue-400 dark:aria-pressed:bg-slate-800 dark:aria-pressed:ring-blue-400";
        button.setAttribute("aria-pressed", "false");
        button.textContent = (optionIndex + 1) + ". " + currentOptions[optionIndex].label;
        button.addEventListener("click", function () {
          selectChoice(optionIndex);
        });
        choiceList.appendChild(button);
      }(i));
    }
  }

  function selectChoice(index) {
    if (answerLocked || index < 0 || index >= currentOptions.length) {
      return;
    }
    selectedChoice = index;
    var buttons = choiceList.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i += 1) {
      var selected = i === index;
      buttons[i].setAttribute("aria-pressed", selected ? "true" : "false");
    }
    buttons[index].focus();
  }

  function promptForQuestion(question, answerSurah, referenceSurah) {
    if (currentMode === "number-name") {
      return "What is the name of surah number " + answerSurah.number + "?";
    }
    if (currentMode === "name-number") {
      return "What is the number of " + answerSurah.name + "?";
    }
    if (currentMode === "name-meaning") {
      return "What does " + answerSurah.name + " mean in English?";
    }
    if (currentMode === "meaning-name") {
      return "Which surah has the meaning “" + meaningLabel(answerSurah) + "”?";
    }
    if (currentMode === "meaning-number") {
      return "What is the number of the surah meaning “" + meaningLabel(answerSurah) + "”?";
    }
    if (currentMode === "arabic-name") {
      return "Choose the transliterated name for this Arabic name.";
    }
    return "Which surah comes immediately " + question.direction + " surah number " + referenceSurah.number + " (" + referenceSurah.name + ")?";
  }

  function renderQuestion() {
    var question = questionQueue[questionIndex];
    var answerSurah = SURAHS[question.answerNumber - 1];
    var referenceSurah = currentMode === "order" ? SURAHS[question.referenceNumber - 1] : answerSurah;
    var numericMode = currentMode === "name-number" || currentMode === "meaning-number";
    activeMode.textContent = getMode(currentMode).label;
    questionCounter.textContent = "Question " + (questionIndex + 1) + " of " + questionQueue.length;
    questionHeading.textContent = promptForQuestion(question, answerSurah, referenceSurah);
    arabicCaption.textContent = currentMode === "arabic-name" ? "Arabic name" : "Arabic hint";
    arabicPrompt.textContent = referenceSurah.arabic;
    arabicPrompt.setAttribute("lang", "ar");
    arabicPrompt.setAttribute("dir", "rtl");
    choicesFieldset.hidden = numericMode;
    numberAnswerField.hidden = !numericMode;
    numberAnswerInput.value = "";
    numberAnswerInput.disabled = false;
    submitAnswerButton.disabled = false;
    answerLocked = false;
    selectedChoice = -1;
    answerFeedback.textContent = "";
    answerFeedback.classList.remove("text-emerald-700", "dark:text-emerald-300", "text-rose-700", "dark:text-rose-300");
    nextQuestionButton.hidden = true;
    if (!numericMode) {
      renderChoices(answerSurah, currentMode, currentMode === "order" ? question.referenceNumber : null);
      var firstChoice = choiceList.querySelectorAll("button")[0];
      if (firstChoice) {
        firstChoice.focus();
      }
    } else {
      numberAnswerInput.focus();
    }
  }

  function recordAnswer(number, isCorrect) {
    var key = String(number);
    if (!hasOwn(currentProgress.surahs, key)) {
      currentProgress.surahs[key] = { attempts: 0, correct: 0 };
    }
    currentProgress.surahs[key].attempts += 1;
    if (isCorrect) {
      currentProgress.surahs[key].correct += 1;
    }
    saveProgress(currentMode, currentProgress);
  }

  function correctAnswerText(surah) {
    if (currentMode === "name-number" || currentMode === "meaning-number") {
      return String(surah.number);
    }
    if (currentMode === "order") {
      return surah.number + ". " + surah.name;
    }
    if (currentMode === "name-meaning") {
      return meaningLabel(surah);
    }
    return surah.name;
  }

  function submitAnswer() {
    if (answerLocked) {
      return;
    }
    var question = questionQueue[questionIndex];
    var isCorrect = false;
    if (isChoiceMode(currentMode)) {
      if (selectedChoice < 0 || !currentOptions[selectedChoice]) {
        answerFeedback.textContent = "Choose an answer first.";
        answerFeedback.classList.remove("text-emerald-700", "dark:text-emerald-300");
        answerFeedback.classList.add("text-rose-700", "dark:text-rose-300");
        return;
      }
      isCorrect = currentOptions[selectedChoice].correct;
    } else {
      var rawValue = numberAnswerInput.value.trim();
      var number = Number(rawValue);
      if (!rawValue || !Number.isInteger(number) || number < 1 || number > 114) {
        answerFeedback.textContent = "Enter a whole number from 1 to 114.";
        answerFeedback.classList.remove("text-emerald-700", "dark:text-emerald-300");
        answerFeedback.classList.add("text-rose-700", "dark:text-rose-300");
        numberAnswerInput.focus();
        return;
      }
      isCorrect = number === question.answerNumber;
    }

    answerLocked = true;
    answeredThisRound += 1;
    if (isCorrect) {
      correctThisRound += 1;
    }
    recordAnswer(question.answerNumber, isCorrect);
    var answerSurah = SURAHS[question.answerNumber - 1];
    var answerText = correctAnswerText(answerSurah);
    answerFeedback.textContent = isCorrect ? "Correct — " + answerText + "." : "Incorrect. The right answer is " + answerText + ".";
    answerFeedback.classList.remove("text-emerald-700", "dark:text-emerald-300", "text-rose-700", "dark:text-rose-300");
    if (isCorrect) {
      answerFeedback.classList.add("text-emerald-700", "dark:text-emerald-300");
    } else {
      answerFeedback.classList.add("text-rose-700", "dark:text-rose-300");
    }
    submitAnswerButton.disabled = true;
    numberAnswerInput.disabled = true;
    var choiceButtons = choiceList.querySelectorAll("button");
    for (var i = 0; i < choiceButtons.length; i += 1) {
      choiceButtons[i].disabled = true;
    }
    nextQuestionButton.hidden = false;
    nextQuestionButton.textContent = questionIndex === questionQueue.length - 1 ? "Finish practice" : "Next question";
    nextQuestionButton.focus();
  }

  function finishPractice(completed) {
    showScreen("setup");
    if (completed) {
      roundResult.textContent = "Practice complete: " + correctThisRound + " of " + questionQueue.length + " correct on the first answer.";
    } else {
      roundResult.textContent = "Practice ended: " + correctThisRound + " correct from " + answeredThisRound + " answered.";
    }
    updateSettings();
    startButton.focus();
  }

  function startPractice() {
    currentMode = modeSelect.value;
    currentRange = rangeFromSelect();
    var targets = surahsInRange(currentRange, currentMode);
    if (!isValidSurahData() || !canStartRound(currentMode, targets, currentRange)) {
      roundSize.textContent = "This practice set does not have enough valid data and distinct answers.";
      return;
    }
    questionQueue = buildRound(currentMode, targets, currentRange);
    questionIndex = 0;
    correctThisRound = 0;
    answeredThisRound = 0;
    currentProgress = loadProgress(currentMode);
    roundResult.textContent = "";
    showScreen("quiz");
    renderQuestion();
  }

  function nextQuestion() {
    if (questionIndex + 1 < questionQueue.length) {
      questionIndex += 1;
      renderQuestion();
    } else {
      finishPractice(true);
    }
  }

  function resetCurrentModeProgress() {
    try {
      localStorage.removeItem(progressKey(modeSelect.value));
    } catch (error) {
      setStorageMessage("Progress could not be reset because browser storage is unavailable.");
      resetConfirmation.hidden = true;
      return;
    }
    setStorageMessage("");
    resetConfirmation.hidden = true;
    roundResult.textContent = "Progress for this mode has been reset.";
    updateSettings();
    resetProgressButton.focus();
  }

  function openStudyView() {
    showScreen("study");
    document.getElementById("study-heading").focus();
  }

  function returnToSetup() {
    showScreen("setup");
    updateSettings();
    startButton.focus();
  }

  if (!isValidSurahData()) {
    startButton.disabled = true;
    studyButton.disabled = true;
    roundSize.textContent = "Surah data is incomplete or invalid.";
  } else {
    buildStudyTable();
    updateSettings();
  }

  modeSelect.addEventListener("change", function () {
    roundResult.textContent = "";
    updateSettings();
  });
  rangeSelect.addEventListener("change", updateSettings);
  startButton.addEventListener("click", startPractice);
  studyButton.addEventListener("click", openStudyView);
  document.getElementById("study-back-button").addEventListener("click", returnToSetup);
  document.getElementById("confirm-reset-button").addEventListener("click", resetCurrentModeProgress);
  document.getElementById("cancel-reset-button").addEventListener("click", function () {
    resetConfirmation.hidden = true;
    resetProgressButton.focus();
  });
  resetProgressButton.addEventListener("click", function () {
    resetConfirmation.hidden = false;
    confirmResetButton.focus();
  });
  answerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    submitAnswer();
  });
  nextQuestionButton.addEventListener("click", nextQuestion);
  exitQuizButton.addEventListener("click", function () {
    finishPractice(false);
  });
  document.addEventListener("keydown", function (event) {
    if (quizScreen.hidden || answerLocked || !isChoiceMode(currentMode)) {
      return;
    }
    var tagName = event.target && event.target.tagName;
    if (tagName === "INPUT" || tagName === "SELECT" || tagName === "TEXTAREA") {
      return;
    }
    if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      selectChoice(Number(event.key) - 1);
    } else if (event.key === "Enter" && event.target.classList && event.target.classList.contains("choice-option")) {
      event.preventDefault();
      submitAnswer();
    }
  });
}());
