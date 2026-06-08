const groups = {
  A: ["Mexico", "Czech Republic", "South Africa", "South Korea"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Haiti", "Morocco", "Scotland"],
  D: ["United States", "Australia", "Paraguay", "Türkiye"],
  E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Norway", "Senegal", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"]
};

const fixtureOrder = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2]
];

const groupsContainer = document.getElementById("groupsContainer");
const qualifiedContainer = document.getElementById("qualifiedContainer");
const resultBox = document.getElementById("resultBox");

function createGroupCard(groupLetter, teams) {
  const card = document.createElement("div");
  card.className = "group-card";

  const header = document.createElement("div");
  header.className = "group-header";
  header.textContent = `Group ${groupLetter}`;

  const body = document.createElement("div");
  body.className = "group-body";

  fixtureOrder.forEach((pair, matchIndex) => {
    const teamA = teams[pair[0]];
    const teamB = teams[pair[1]];

    const row = document.createElement("div");
    row.className = "match-row";

    row.innerHTML = `
      <div class="team-left">${teamA}</div>
      <input class="score-input" type="number" min="0"
        data-group="${groupLetter}"
        data-match="${matchIndex}"
        data-team="${teamA}"
        data-side="home">
      <div class="vs">-</div>
      <input class="score-input" type="number" min="0"
        data-group="${groupLetter}"
        data-match="${matchIndex}"
        data-team="${teamB}"
        data-side="away">
      <div class="team-right">${teamB}</div>
    `;

    body.appendChild(row);
  });

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  tableWrap.innerHTML = `
    <table class="standings" id="table-${groupLetter}">
      <thead>
        <tr>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GF</th>
          <th>GA</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  body.appendChild(tableWrap);
  card.appendChild(header);
  card.appendChild(body);

  return card;
}

function renderGroups() {
  groupsContainer.innerHTML = "";

  Object.entries(groups).forEach(([groupLetter, teams]) => {
    const card = createGroupCard(groupLetter, teams);
    groupsContainer.appendChild(card);
  });

  document.querySelectorAll(".score-input").forEach(input => {
    input.addEventListener("input", calculateAll);
  });

  calculateAll();
}

function emptyStats(team) {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  };
}

function calculateGroup(groupLetter) {
  const teamsInGroup = groups[groupLetter];
  const stats = {};

  teamsInGroup.forEach(team => {
    stats[team] = emptyStats(team);
  });

  fixtureOrder.forEach((pair, matchIndex) => {
    const teamA = teamsInGroup[pair[0]];
    const teamB = teamsInGroup[pair[1]];

    const homeInput = document.querySelector(
      `input[data-group="${groupLetter}"][data-match="${matchIndex}"][data-side="home"]`
    );

    const awayInput = document.querySelector(
      `input[data-group="${groupLetter}"][data-match="${matchIndex}"][data-side="away"]`
    );

    if (!homeInput.value || !awayInput.value) {
      return;
    }

    const homeGoals = Number(homeInput.value);
    const awayGoals = Number(awayInput.value);

    stats[teamA].played += 1;
    stats[teamB].played += 1;

    stats[teamA].gf += homeGoals;
    stats[teamA].ga += awayGoals;

    stats[teamB].gf += awayGoals;
    stats[teamB].ga += homeGoals;

    if (homeGoals > awayGoals) {
      stats[teamA].wins += 1;
      stats[teamB].losses += 1;
      stats[teamA].points += 3;
    } else if (awayGoals > homeGoals) {
      stats[teamB].wins += 1;
      stats[teamA].losses += 1;
      stats[teamB].points += 3;
    } else {
      stats[teamA].draws += 1;
      stats[teamB].draws += 1;
      stats[teamA].points += 1;
      stats[teamB].points += 1;
    }

    stats[teamA].gd = stats[teamA].gf - stats[teamA].ga;
    stats[teamB].gd = stats[teamB].gf - stats[teamB].ga;
  });

  const table = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  return table;
}

function updateGroupTable(groupLetter, table) {
  const tbody = document.querySelector(`#table-${groupLetter} tbody`);
  tbody.innerHTML = "";

  table.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}. ${row.team}</td>
      <td>${row.played}</td>
      <td>${row.wins}</td>
      <td>${row.draws}</td>
      <td>${row.losses}</td>
      <td>${row.gf}</td>
      <td>${row.ga}</td>
      <td>${row.gd}</td>
      <td><strong>${row.points}</strong></td>
    `;

    tbody.appendChild(tr);
  });
}

function calculateAll() {
  const qualified = {};
  const allTables = {};

  Object.keys(groups).forEach(groupLetter => {
    const table = calculateGroup(groupLetter);
    allTables[groupLetter] = table;
    updateGroupTable(groupLetter, table);

    qualified[groupLetter] = {
      first: table[0]?.team || "",
      second: table[1]?.team || ""
    };
  });

  renderQualified(qualified);
  return { qualified, allTables };
}

function renderQualified(qualified) {
  qualifiedContainer.innerHTML = "";

  Object.entries(qualified).forEach(([groupLetter, result]) => {
    const div = document.createElement("div");
    div.className = "qualified-item";

    div.innerHTML = `
      <strong>Group ${groupLetter}</strong>
      1st: ${result.first || "-"}<br>
      2nd: ${result.second || "-"}
    `;

    qualifiedContainer.appendChild(div);
  });
}

function collectScores() {
  const scores = [];

  Object.entries(groups).forEach(([groupLetter, teamsInGroup]) => {
    fixtureOrder.forEach((pair, matchIndex) => {
      const teamA = teamsInGroup[pair[0]];
      const teamB = teamsInGroup[pair[1]];

      const homeInput = document.querySelector(
        `input[data-group="${groupLetter}"][data-match="${matchIndex}"][data-side="home"]`
      );

      const awayInput = document.querySelector(
        `input[data-group="${groupLetter}"][data-match="${matchIndex}"][data-side="away"]`
      );

      scores.push({
        group: groupLetter,
        match: matchIndex + 1,
        homeTeam: teamA,
        awayTeam: teamB,
        homeScore: homeInput.value,
        awayScore: awayInput.value
      });
    });
  });

  return scores;
}

function saveLocally() {
  const playerName = document.getElementById("playerName").value.trim();

  if (!playerName) {
    alert("Please enter your name first.");
    return;
  }

  const calculation = calculateAll();

  const prediction = {
    playerName,
    submittedAt: new Date().toISOString(),
    scores: collectScores(),
    qualified: calculation.qualified,
    tables: calculation.allTables
  };

  localStorage.setItem("worldCup2026Prediction", JSON.stringify(prediction, null, 2));

  resultBox.textContent = JSON.stringify(prediction, null, 2);

  alert("Prediction saved locally. Next step: we will send it to Google Sheets.");
}

function resetAll() {
  const confirmReset = confirm("Are you sure you want to clear all scores?");
  if (!confirmReset) return;

  document.querySelectorAll(".score-input").forEach(input => {
    input.value = "";
  });

  document.getElementById("playerName").value = "";
  localStorage.removeItem("worldCup2026Prediction");
  resultBox.textContent = "No result yet.";

  calculateAll();
}

document.getElementById("calculateBtn").addEventListener("click", calculateAll);
document.getElementById("saveBtn").addEventListener("click", saveLocally);
document.getElementById("resetBtn").addEventListener("click", resetAll);

renderGroups();
