// TravelMate: rule-based autonomous-agent demonstration. No bookings or live prices are made.

const $ = id => document.getElementById(id);
const STORAGE_KEY = "travelmate.preferences.v1";
let currentPlan = null;
let currentStep = -1;
let toastTimer;

const destinationData = {
  mysuru: {
    name: "Mysuru",
    activities: {
      nature: ["Stroll through Brindavan Gardens", "Enjoy a relaxed visit to Karanji Lake"],
      culture: ["Explore Mysuru Palace from the outside or visit during public hours", "Walk around Devaraja Market"],
      food: ["Try a local dosa breakfast and Mysore pak"],
      adventure: ["Take a nature walk in the Chamundi Hills area"],
      relaxation: ["Pause at a quiet café near the city centre"]
    },
    note: "Known for its palace, markets, gardens, and local food."
  },
  goa: {
    name: "Goa",
    activities: {
      nature: ["Spend time at a beach and enjoy the coastal views", "Explore a nature trail"],
      culture: ["Visit a historic church or heritage district", "Explore a local market"],
      food: ["Try local Goan cuisine at a well-reviewed restaurant"],
      adventure: ["Consider a guided water activity if conditions and budget allow"],
      relaxation: ["Plan a slower afternoon at the beach"]
    },
    note: "Offers beaches, heritage areas, food, and outdoor activities."
  },
  jaipur: {
    name: "Jaipur",
    activities: {
      nature: ["Visit a garden or viewpoint in the cooler hours"],
      culture: ["Explore a historic fort or palace", "Walk through the old city's markets"],
      food: ["Try local Rajasthani food"],
      adventure: ["Consider a guided heritage walk"],
      relaxation: ["Take a break at a courtyard café"]
    },
    note: "Known for historic architecture, markets, and Rajasthani cuisine."
  },
  manali: {
    name: "Manali",
    activities: {
      nature: ["Enjoy mountain views and a local nature walk"],
      culture: ["Explore the old town and local temples respectfully"],
      food: ["Try Himachali dishes at a local eatery"],
      adventure: ["Look into a guided outdoor activity appropriate for the season"],
      relaxation: ["Plan a relaxed riverside or café stop where permitted"]
    },
    note: "A mountain destination for scenery, local culture, and outdoor activities."
  },
  default: {
    name: "your destination",
    activities: {
      nature: ["Look for a public park or nature spot"],
      culture: ["Explore a local landmark or museum"],
      food: ["Try a local speciality at a well-reviewed eatery"],
      adventure: ["Check for a safe, guided outdoor activity"],
      relaxation: ["Leave time for a relaxed café or rest stop"]
    },
    note: "Generic suggestions are shown because this demo has no live destination search."
  }
};

const travelStyles = {
  budget: "Budget-friendly",
  balanced: "Balanced",
  comfort: "Comfort",
  adventure: "Adventure",
  sightseeing: "Sightseeing"
};

function formatINR(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function loadMemory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveMemory(preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  renderMemory();
}

function renderMemory() {
  const memory = loadMemory();
  const content = $("memoryContent");
  const rows = [
    ["Preferred style", memory.style ? travelStyles[memory.style] || memory.style : ""],
    ["Typical budget", memory.budget ? formatINR(memory.budget) : ""],
    ["Last destination", memory.destination || ""],
    ["Favourite activities", Array.isArray(memory.activities) ? memory.activities.join(", ") : ""]
  ].filter(row => row[1]);

  if (!rows.length) {
    content.innerHTML = '<div class="memory-empty">No preferences saved yet. Generate a trip plan and the agent will remember your choices in this browser.</div>';
    return;
  }
  content.innerHTML = rows.map(([label, value]) =>
    `<div class="memory-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`
  ).join("");
}

function getSelectedActivities() {
  return [...document.querySelectorAll('#activityChips input:checked')].map(input => input.value);
}

function getTripRequest() {
  return {
    origin: $("origin").value.trim(),
    destination: $("destination").value.trim(),
    date: $("travelDate").value,
    budget: Number($("budget").value),
    style: $("style").value,
    activities: getSelectedActivities()
  };
}

function destinationTool(destination, activities) {
  const key = destination.toLowerCase().trim();
  const data = destinationData[key] || destinationData.default;
  const selected = activities.length ? activities : ["culture", "nature"];
  const suggestions = [];
  selected.forEach(activity => {
    (data.activities[activity] || []).slice(0, 2).forEach(item => {
      if (!suggestions.includes(item)) suggestions.push(item);
    });
  });
  if (!suggestions.length) suggestions.push(...data.activities.culture);
  return { destination: data.name === "your destination" ? destination : data.name, note: data.note, suggestions: suggestions.slice(0, 5), simulated: !destinationData[key] };
}

// Budget tool uses fixed illustrative amounts and should not be treated as a live quote.
function budgetTool(request) {
  const days = 2;
  const styleFactor = { budget: 0.72, balanced: 1, comfort: 1.42, adventure: 1.12, sightseeing: 1.02 }[request.style] || 1;
  const distanceFactor = request.origin.toLowerCase() === request.destination.toLowerCase() ? 0.65 : 1;
  const transport = Math.round(1800 * styleFactor * distanceFactor);
  const stay = Math.round(1500 * days * styleFactor);
  const food = Math.round(650 * days * (request.style === "comfort" ? 1.2 : 1));
  const activities = Math.round(900 * (request.activities.length || 1) * 0.65);
  const local = Math.round(450 * days);
  const total = transport + stay + food + activities + local;
  return { transport, stay, food, activities, local, total, days, styleFactor };
}

function comparisonTool(request, baseBudget) {
  const options = [
    { id: "budget", name: "Budget route", factor: 0.78, tag: "Lowest cost", description: "Basic transport and economical stay." },
    { id: "balanced", name: "Balanced route", factor: 1, tag: "Recommended", description: "A practical balance of cost and comfort." },
    { id: "comfort", name: "Comfort route", factor: 1.34, tag: "More comfort", description: "More comfortable transport and stay." }
  ].map(option => ({ ...option, cost: Math.round(baseBudget.total * option.factor) }));

  const preferred = request.style === "budget" ? "budget" :
    request.style === "comfort" ? "comfort" : "balanced";
  let selected = options.find(option => option.id === preferred);
  if (selected.cost > request.budget) {
    selected = options.filter(option => option.cost <= request.budget).sort((a, b) => a.cost - b.cost)[0] || options[0];
  }
  return { options, selected };
}

function itineraryTool(request, destination) {
  const selected = destination.suggestions;
  const first = selected[0] || "Explore a local landmark";
  const second = selected[1] || "Try a local food speciality";
  const third = selected[2] || "Enjoy a relaxed local walk";
  return [
    { day: 1, title: "Arrive and explore", details: `Travel from ${request.origin} to ${request.destination}. Check in, have a meal, then ${first.charAt(0).toLowerCase() + first.slice(1)}.` },
    { day: 2, title: "Discover the destination", details: `${second}. Later, ${third.charAt(0).toLowerCase() + third.slice(1)}. Keep time for meals and rest.` }
  ];
}

function setLifecycleStep(step) {
  currentStep = step;
  document.querySelectorAll(".life-step").forEach((element, index) => {
    element.classList.toggle("complete", index < step);
    element.classList.toggle("active", index === step);
  });
  $("lifecycleStatus").textContent = step >= 5 ? "Awaiting approval" : step >= 0 ? `Step ${step + 1} of 6` : "Waiting";
  $("lifecycleStatus").classList.toggle("done", step >= 5);
}

function finishLifecycle() {
  document.querySelectorAll(".life-step").forEach(element => {
    element.classList.remove("active");
    element.classList.add("complete");
  });
  $("lifecycleStatus").textContent = "Approved in demo";
  $("lifecycleStatus").classList.add("done");
}

function renderObservations(observations) {
  $("observations").innerHTML = observations.map(item => `
    <div class="observation">
      <div class="obs-icon">${item.icon}</div>
      <div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.text)}</p></div>
    </div>`).join("");
}

function renderPlan(plan) {
  $("emptyPlan").hidden = true;
  $("planContent").hidden = false;
  $("planSubtitle").textContent = `${plan.request.origin} → ${plan.request.destination} · ${plan.request.date}`;
  const budget = plan.budget;
  const selected = plan.comparison.selected;
  const overBudget = selected.cost > plan.request.budget;
  const budgetLines = [
    ["Transport", budget.transport], ["Accommodation", budget.stay], ["Food", budget.food],
    ["Activities", budget.activities], ["Local transport", budget.local]
  ];
  const dateLabel = plan.request.date ? new Date(plan.request.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date not set";

  $("planContent").innerHTML = `
    <div class="plan-summary">
      <div><strong>${escapeHTML(plan.request.destination)}</strong><span>${escapeHTML(plan.request.origin)} · ${escapeHTML(dateLabel)} · ${escapeHTML(travelStyles[plan.request.style])}</span></div>
      <div class="budget-total">${formatINR(selected.cost)}<small>estimated total</small></div>
    </div>
    ${overBudget ? `<div class="budget-warning">The selected estimate is above your budget. Consider the budget route or increase your budget. This demo will recommend the lowest-cost option if none fit.</div>` : `<div class="budget-ok">✓ The selected option is within your stated budget (estimated).</div>`}
    <div class="subheading">Estimated budget breakdown</div>
    <div class="budget-list">${budgetLines.map(([label, amount]) => `
      <div class="budget-line"><span>${label}</span><strong>${formatINR(amount)}</strong><div class="bar"><span style="width:${Math.max(4, Math.min(100, amount / Math.max(budget.total, 1) * 100))}%"></span></div></div>`).join("")}
    </div>
    <div class="subheading">Day-wise itinerary · ${plan.itinerary.length} days</div>
    <div class="itinerary">${plan.itinerary.map(day => `
      <div class="day"><div class="day-badge"><span>DAY</span><strong>${day.day}</strong></div><div><h3>${escapeHTML(day.title)}</h3><p>${escapeHTML(day.details)}</p></div></div>`).join("")}
    </div>
    <div class="subheading">Compare travel approaches</div>
    <div class="option-grid">${plan.comparison.options.map(option => `
      <div class="option ${option.id === selected.id ? "recommended" : ""}">
        ${option.id === selected.id ? `<span class="option-tag">✓ Selected</span>` : `<span class="option-tag">${escapeHTML(option.tag)}</span>`}
        <h3>${escapeHTML(option.name)}</h3><div class="price">${formatINR(option.cost)}</div>
        <p>${escapeHTML(option.description)}</p>
        <div class="fit">${option.cost <= plan.request.budget ? "Within budget" : "Over budget"}</div>
      </div>`).join("")}
    </div>
    <p class="form-note">All figures are simulated estimates for the lab demo. They are not quotes, live fares, or confirmed availability.</p>
  `;
  renderApproval(plan, false);
}

function renderApproval(plan, approved) {
  const area = $("approvalContent");
  if (approved) {
    area.innerHTML = `<div class="approved-state"><span>✓</span><div><strong>Plan approved in this demo</strong>Your selection has been recorded locally. No ticket, hotel, or payment action was performed.</div></div>`;
    return;
  }
  area.innerHTML = `
    <p class="approval-summary">Proposed: <strong>${escapeHTML(plan.request.origin)} → ${escapeHTML(plan.request.destination)}</strong> · ${formatINR(plan.comparison.selected.cost)} estimated. Review the itinerary before approving.</p>
    <div class="approval-actions"><button id="approvePlan" class="approve-button" type="button">✓ Approve plan</button><button id="modifyPlan" class="modify-button" type="button">✎ Modify plan</button></div>`;
  $("approvePlan").addEventListener("click", approvePlan);
  $("modifyPlan").addEventListener("click", () => {
    $("destination").focus();
    $("tripForm").scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Edit your trip details, then generate a new plan.");
  });
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function runAgent(request) {
  // Step 1: identify goal.
  setLifecycleStep(0);
  const goal = `Plan a ${request.style} trip from ${request.origin} to ${request.destination} within ${formatINR(request.budget)}.`;

  // Step 2: recall memory and update preferences.
  setLifecycleStep(1);
  const previous = loadMemory();
  const remembered = previous.destination ? `Previous destination: ${previous.destination}.` : "No earlier destination saved.";
  const preferences = {
    style: request.style,
    budget: request.budget,
    destination: request.destination,
    activities: request.activities
  };
  saveMemory(preferences);

  // Step 3: call simulated tools.
  setLifecycleStep(2);
  const destination = destinationTool(request.destination, request.activities);
  const budget = budgetTool(request);
  const itinerary = itineraryTool(request, destination);
  const comparison = comparisonTool(request, budget);

  // Step 4: observe tool outputs.
  setLifecycleStep(3);
  const observations = [
    { icon: "⌖", title: "Destination tool", text: `${destination.note} Suggestions: ${destination.suggestions.join("; ")}${destination.simulated ? " (generic suggestions; destination is not in the sample data)." : ""}` },
    { icon: "₹", title: "Budget tool", text: `Illustrative ${budget.days}-day base estimate: ${formatINR(budget.total)}. This is generated from fixed demo amounts, not live prices.` },
    { icon: "▤", title: "Memory tool", text: `${remembered} Saved current style, budget, destination, and activity preferences to this browser.` },
    { icon: "↔", title: "Comparison tool", text: `Compared budget (${formatINR(comparison.options[0].cost)}), balanced (${formatINR(comparison.options[1].cost)}), and comfort (${formatINR(comparison.options[2].cost)}) estimates.` }
  ];

  // Step 5: evaluate budget and re-plan to a lower-cost option when possible.
  setLifecycleStep(4);
  const fits = comparison.options.filter(option => option.cost <= request.budget);
  const replanned = comparison.selected.id !== request.style && request.style !== "adventure" && request.style !== "sightseeing";
  if (fits.length && comparison.selected.cost > request.budget) {
    comparison.selected = fits.sort((a, b) => a.cost - b.cost)[0];
  }
  if (!fits.length) {
    observations.push({ icon: "!", title: "Re-planning observation", text: "All simulated options exceed the entered budget. The lowest-cost option is shown; consider changing dates, destination, or budget." });
  } else if (replanned || comparison.selected.id !== request.style) {
    observations.push({ icon: "↻", title: "Re-planning", text: `Adjusted the recommendation to ${comparison.selected.name} based on the budget and selected preferences.` });
  } else {
    observations.push({ icon: "✓", title: "Plan evaluation", text: "The selected approach matches the chosen style and is compared against the budget." });
  }

  const plan = { request, goal, destination, budget, itinerary, comparison, observations };
  currentPlan = plan;
  renderObservations(observations);
  renderPlan(plan);
  setLifecycleStep(5);
}

function approvePlan() {
  if (!currentPlan) return;
  renderApproval(currentPlan, true);
  finishLifecycle();
  showToast("Plan approved in demo only — no bookings were made.");
}

$("tripForm").addEventListener("submit", event => {
  event.preventDefault();
  const request = getTripRequest();
  if (!request.origin || !request.destination || !request.date || !Number.isFinite(request.budget) || request.budget <= 0) {
    showToast("Please complete all required trip details.");
    return;
  }
  runAgent(request);
  $("planCard").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("resetMemory").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderMemory();
  showToast("Saved preferences have been reset.");
});

function setDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $("travelDate").value = localDate;
  $("travelDate").min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

setDefaultDate();
renderMemory();
