// StudyMate: a small rule-based assistant for demonstrating prompting techniques.

const techniqueSelect = document.getElementById("technique");
const techniqueCard = document.getElementById("techniqueCard");
const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const chatMessages = document.getElementById("chatMessages");
const welcome = document.getElementById("welcome");
const clearChatButton = document.getElementById("clearChat");

const techniqueInfo = {
  zero: {
    title: "Zero-shot",
    description: "Ask a question directly. The assistant uses predefined rules without examples in the prompt."
  },
  few: {
    title: "Few-shot",
    description: "The assistant compares your question with example question-and-answer pairs to find a similar pattern."
  },
  role: {
    title: "Role prompting",
    description: "The assistant answers in the style of a friendly teacher, using clear language and simple examples."
  }
};

// FAQ entries are easy to extend: add keywords and an answer to this array.
const faqRules = [
  {
    keywords: ["photosynthesis", "plants make food"],
    answer: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose (sugar) and oxygen."
  },
  {
    keywords: ["study better", "study tips", "how to study", "study effectively"],
    answer: "Make a study timetable, divide topics into smaller sections, practise questions, take short breaks, and revise regularly."
  },
  {
    keywords: ["recursion", "recursive function"],
    answer: "Recursion is a programming technique in which a function calls itself to solve smaller versions of a problem. A base case stops the repeated calls."
  },
  {
    keywords: ["library timing", "library timings", "library hours", "when does the library", "library open", "library close"],
    answer: "I don't have your college's confirmed library timings. Please check your college website, library notice board, or contact the library staff."
  },
  {
    keywords: ["scholarship", "apply for scholarship", "scholarships"],
    answer: "Start by checking the official scholarship portal and your college's scholarship office. Review eligibility, deadlines, and required documents such as income, caste/category (if applicable), marksheets, and bank details. Requirements vary by scheme."
  },
  {
    keywords: ["attendance", "attendance requirement", "attendance percentage"],
    answer: "Attendance requirements depend on your institution and course rules. Check your student handbook or ask your department office for the official minimum percentage."
  },
  {
    keywords: ["contact faculty", "contact my faculty", "faculty email", "professor contact", "teacher contact"],
    answer: "Use your institution's official faculty directory or learning portal to find the correct contact details. You can also ask your class representative or department office."
  },
  {
    keywords: ["study material", "study materials", "notes", "lecture notes", "learning material"],
    answer: "Check your learning management system, class group, faculty-shared drive, and library resources. If materials are missing, ask the subject faculty."
  },
  {
    keywords: ["manage time", "time management", "manage my time", "schedule my day"],
    answer: "List your tasks, rank them by importance, and schedule focused study blocks. Try 25 minutes of focused work followed by a 5-minute break, and leave some buffer time for unexpected tasks."
  },
  {
    keywords: ["assignment deadline", "miss an assignment", "late assignment", "missed assignment"],
    answer: "Contact your faculty as soon as possible, explain the situation honestly, and ask whether late submission is allowed. Check your course policy and submit the work as soon as you can."
  },
  {
    keywords: ["prepare for exams", "exam preparation", "prepare for exam", "exam tips"],
    answer: "Check the syllabus, prioritise high-weight topics, practise past questions, and test yourself without looking at notes. Plan short revision sessions and get enough sleep before the exam."
  },
  {
    keywords: ["what is a variable", "define variable", "variables in programming"],
    answer: "A variable is a named place to store a value in a program. For example, in JavaScript, let score = 10; creates a variable named score with the value 10."
  },
  {
    keywords: ["what is an algorithm", "define algorithm", "algorithm"],
    answer: "An algorithm is a finite set of clear steps used to solve a problem or complete a task. A recipe is a simple everyday example of an algorithm."
  },
  {
    keywords: ["hello", "hi", "hey"],
    answer: "Hi! I'm StudyMate. Ask me about study strategies, programming basics, exams, scholarships, or common student FAQs."
  },
  {
    keywords: ["thank you", "thanks"],
    answer: "You're welcome! Keep going, and feel free to ask another question."
  }
];

// Normalise text to make matching less sensitive to case and punctuation.
function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Return the first answer whose keywords occur in the question.
function findRuleAnswer(question) {
  const normalizedQuestion = normalize(question);
  for (const rule of faqRules) {
    if (rule.keywords.some(keyword => normalizedQuestion.includes(normalize(keyword)))) {
      return rule.answer;
    }
  }
  return null;
}

// A tiny few-shot example set. Similar keywords help select a known answer.
const fewShotExamples = [
  { question: "How can I study better?", answer: "Make a study timetable, divide topics into smaller sections, practise questions, and revise regularly.", keywords: ["study better", "study tips", "study effectively"] },
  { question: "Explain recursion.", answer: "Recursion is a programming technique in which a function calls itself to solve smaller versions of a problem. A base case stops the repeated calls.", keywords: ["recursion", "recursive function"] },
  { question: "How do I prepare for exams?", answer: "Check the syllabus, prioritise high-weight topics, practise past questions, and test yourself without looking at notes. Plan short revision sessions and get enough sleep before the exam.", keywords: ["prepare for exams", "exam preparation", "exam tips"] }
];

function makeAnswer(question, technique) {
  const normalizedQuestion = normalize(question);
  let answer = null;

  if (technique === "few") {
    // Few-shot mode tries its examples first, then uses the general FAQ rules.
    const example = fewShotExamples.find(item =>
      item.keywords.some(keyword => normalizedQuestion.includes(normalize(keyword)))
    );
    if (example) answer = example.answer;
  }

  if (!answer) answer = findRuleAnswer(question);

  if (!answer) {
    return "I'm not sure how to answer that yet. Try asking about exam preparation, study tips, scholarships, attendance, library timings, study materials, photosynthesis, or recursion.";
  }

  if (technique === "role") {
    // Role prompting is represented as a teacher-like tone, not a live LLM persona.
    if (normalizedQuestion.includes("recursion")) {
      return "Let's make it simple. Imagine a set of smaller boxes, each containing another box, until you reach the final one. Recursion works similarly: a function calls itself on a smaller problem. The base case is the final box—it tells the function when to stop.\n\nIn short: recursive function + smaller problem + base case = recursion.";
    }
    if (normalizedQuestion.includes("photosynthesis")) {
      return "Think of a plant as a tiny food factory. It takes in sunlight, water, and carbon dioxide, then makes glucose (its food) and releases oxygen. That process is called photosynthesis.\n\nRemember: sunlight provides the energy.";
    }
    return "Let's work through this clearly. " + answer + "\n\nTip: Write down the key steps and review them later to help remember them.";
  }

  if (technique === "few") {
    return "Based on similar example questions:\n\n" + answer;
  }
  return answer;
}

function addMessage(text, sender, technique = null) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "assistant" ? "S" : "Y";

  const body = document.createElement("div");
  body.className = "message-body";

  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent = sender === "assistant" ? "STUDYMATE" : "YOU";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  body.append(name, bubble);

  if (sender === "assistant" && technique) {
    const meta = document.createElement("div");
    meta.className = "answer-meta";
    meta.textContent = `Answered with ${techniqueInfo[technique].title}`;
    body.append(meta);
  }

  message.append(avatar, body);
  chatMessages.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function submitQuestion(question) {
  const cleaned = question.trim();
  if (!cleaned) return;
  welcome.hidden = true;
  addMessage(cleaned, "user");
  const technique = techniqueSelect.value;
  addMessage(makeAnswer(cleaned, technique), "assistant", technique);
  questionInput.value = "";
  questionInput.focus();
}

function updateTechniqueCard() {
  const info = techniqueInfo[techniqueSelect.value];
  techniqueCard.querySelector("strong").textContent = info.title;
  techniqueCard.querySelector("p").textContent = info.description;
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  submitQuestion(questionInput.value);
});

document.querySelectorAll("[data-question]").forEach(button => {
  button.addEventListener("click", () => submitQuestion(button.dataset.question));
});

techniqueSelect.addEventListener("change", updateTechniqueCard);

clearChatButton.addEventListener("click", () => {
  chatMessages.replaceChildren();
  welcome.hidden = false;
  questionInput.value = "";
  questionInput.focus();
});

updateTechniqueCard();
