# StudyMate — Study Assistant Agent

A simple, offline-friendly, rule-based study assistant built with HTML, CSS, and vanilla JavaScript.

## Run locally
1. Download and extract `StudyMate.zip`.
2. Open the extracted `studymate` folder.
3. Double-click `index.html` to open it in your browser.

No installation, API key, server, or database is required. An internet connection is only needed if you want the optional Google Fonts to load; the app still works without them.

## Optional: run with VS Code
1. Open the folder in VS Code.
2. If you have the Live Server extension, right-click `index.html`.
3. Select **Open with Live Server**.

## Prompting techniques
- **Zero-shot:** Uses direct keyword/rule matching without examples.
- **Few-shot:** Checks a small set of example questions and answers before the general FAQ rules.
- **Role prompting:** Presents answers in a friendly teacher-like style with plain-language explanations.

## Customise the FAQ
Open `script.js` and add an object to the `faqRules` array. Each object has a `keywords` list and an `answer`.

This is a rule-based simulation of prompting techniques, not an LLM. It does not call an AI API and cannot answer arbitrary questions outside its predefined rules.
