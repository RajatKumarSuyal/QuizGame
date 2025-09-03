// ===== DOM Elements =====
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");
const questionText = document.getElementById("question-text");
const answerContainer = document.getElementById("answers-container");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionSpan = document.getElementById("total-questions");
const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementById("result-message");
const progressBar = document.getElementById("progress");

// ===== Variables =====
let questionPool = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answerLocked = false;

// ===== Decode HTML Entities (from API) =====
function decodeHTMLEntities(text) {
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

// ===== Fetch Questions from API =====
async function fetchQuestionPool(total = 100) {
  let allQuestions = [];
  const batchSize = 50;
  const requests = Math.ceil(total / batchSize);

  for (let i = 0; i < requests; i++) {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${batchSize}&difficulty=easy&type=multiple`
    );
    const data = await response.json();

    if (!data.results) continue;

    const formatted = data.results.map((q) => {
      const incorrectAnswers = q.incorrect_answers.map((ans) => ({
        text: decodeHTMLEntities(ans),
        correct: false,
      }));
      const correctAnswer = {
        text: decodeHTMLEntities(q.correct_answer),
        correct: true,
      };
      const answers = [...incorrectAnswers, correctAnswer].sort(
        () => Math.random() - 0.5
      );
      return { question: decodeHTMLEntities(q.question), answers };
    });

    allQuestions = [...allQuestions, ...formatted];
  }

  return allQuestions;
}

// ===== Pick Random Questions =====
function getRandomQuestions(pool, count = 10) {
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

// ===== Start Quiz =====
async function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  scoreSpan.textContent = 0;

  startScreen.classList.remove("active");
  quizScreen.classList.add("active");

  // Load pool once
  if (questionPool.length === 0) {
    questionPool = await fetchQuestionPool(100); // safe pool size
  }

  quizQuestions = getRandomQuestions(questionPool, 10);

  totalQuestionSpan.textContent = quizQuestions.length;
  maxScoreSpan.textContent = quizQuestions.length;

  showQuestion();
}

// ===== Show Question =====
function showQuestion() {
  resetState();
  answerLocked = false;

  let currentQuestion = quizQuestions[currentQuestionIndex];
  questionText.innerHTML = currentQuestion.question;

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.innerHTML = answer.text;
    button.classList.add("answer-btn");
    button.addEventListener("click", () => selectAnswer(button, answer));
    answerContainer.appendChild(button);
  });

  currentQuestionSpan.textContent = currentQuestionIndex + 1;
  updateProgress();
}

// ===== Reset Answer Buttons =====
function resetState() {
  while (answerContainer.firstChild) {
    answerContainer.removeChild(answerContainer.firstChild);
  }
}

// ===== Select Answer =====
function selectAnswer(selectedButton, answer) {
  if (answerLocked) return;
  answerLocked = true;

  const buttons = Array.from(answerContainer.children);

  // highlight answers
  buttons.forEach((button, i) => {
    const isCorrect = quizQuestions[currentQuestionIndex].answers[i].correct;
    if (isCorrect) {
      button.classList.add("correct");
    }
    if (button === selectedButton && !isCorrect) {
      button.classList.add("incorrect");
    }
  });

  if (answer.correct) {
    score++;
    scoreSpan.textContent = score;
  }

  // move to next question
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      showQuestion();
    } else {
      showResult();
    }
  }, 1000);
}

// ===== Show Result =====
function showResult() {
  quizScreen.classList.remove("active");
  resultScreen.classList.add("active");

  finalScoreSpan.textContent = score;

  if (score === quizQuestions.length) {
    resultMessage.textContent = "🎉 Perfect Score! Amazing!";
  } else if (score >= quizQuestions.length / 2) {
    resultMessage.textContent = "👍 Good Job!";
  } else {
    resultMessage.textContent = "Keep Practicing!";
  }
}

// ===== Restart Quiz =====
function restartQuiz() {
  resultScreen.classList.remove("active");
  quizScreen.classList.add("active");

  currentQuestionIndex = 0;
  score = 0;
  scoreSpan.textContent = 0;

  quizQuestions = getRandomQuestions(questionPool, 10);
  totalQuestionSpan.textContent = quizQuestions.length;
  maxScoreSpan.textContent = quizQuestions.length;

  showQuestion();
}

// ===== Progress Bar =====
function updateProgress() {
  const progressPercent =
    ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  progressBar.style.width = progressPercent + "%";
}

// ===== Event Listeners =====
startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);

