# TravelMate — Mini Autonomous Travel Agent

A college lab activity demo built with HTML, CSS, and vanilla JavaScript. The agent is rule-based and uses simulated tools and illustrative estimates.

## Run locally
1. Download and extract `TravelMate.zip`.
2. Open the extracted `TravelMate` folder.
3. Double-click `index.html` to launch it in your browser.

No Node.js, npm, API key, database, or server is required. An internet connection is only needed for optional Google Fonts; the application works without them.

## Features
- Travel request form: origin, destination, date, budget, style, and activities.
- Rule-based planner and sample destination suggestions.
- Simulated budget, itinerary, and comparison tools.
- Visible agent lifecycle and observations.
- Re-planning when the selected option exceeds budget.
- LocalStorage memory for travel preferences.
- Human approval or modification step. Approval only records the choice in the demo; it never books or pays.

## Concepts demonstrated
- Goal: the submitted travel request.
- LLM simulation: keyword/form-driven rules instead of a real LLM.
- Memory: preferences saved in browser localStorage.
- Planning: day-wise itinerary.
- Reasoning: compare estimates and preferences.
- Tools: destination, budget, itinerary, and comparison functions.
- Observations: tool outputs in the activity panel.
- Re-planning: switch to a lower-cost option when possible.
- Human-in-the-loop: user approves or modifies the proposed plan.

## Important limitation
All prices are illustrative fixed demo values. Destination suggestions are predefined. There are no live searches, bookings, reservations, or payments.
