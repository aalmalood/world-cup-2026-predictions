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

const flags = {
  "Mexico": "🇲🇽",
  "Czech Republic": "🇨🇿",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "Canada": "🇨🇦",
  "Bosnia and Herzegovina": "🇧🇦",
  "Qatar": "🇶🇦",
  "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷",
  "Haiti": "🇭🇹",
  "Morocco": "🇲🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "United States": "🇺🇸",
  "Australia": "🇦🇺",
  "Paraguay": "🇵🇾",
  "Türkiye": "🇹🇷",
  "Germany": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Ivory Coast": "🇨🇮",
  "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱",
  "Japan": "🇯🇵",
  "Sweden": "🇸🇪",
  "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪",
  "Egypt": "🇪🇬",
  "Iran": "🇮🇷",
  "New Zealand": "🇳🇿",
  "Spain": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Saudi Arabia": "🇸🇦",
  "Uruguay": "🇺🇾",
  "France": "🇫🇷",
  "Norway": "🇳🇴",
  "Senegal": "🇸🇳",
  "Iraq": "🇮🇶",
  "Argentina": "🇦🇷",
  "Algeria": "🇩🇿",
  "Austria": "🇦🇹",
  "Jordan": "🇯🇴",
  "Portugal": "🇵🇹",
  "DR Congo": "🇨🇩",
  "Uzbekistan": "🇺🇿",
  "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia": "🇭🇷",
  "Ghana": "🇬🇭",
  "Panama": "🇵🇦"
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
const knockoutContainer = document.getElementById("knockoutContainer");
const resultBox = document.getElementById("resultBox");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6bI2BMlRjOEvN3Sx4PShcB8yY_ISoRPL0W6fQPc-kP6zyuHIzYWCG5g_Ge1VbdpHsoQ/exec";

let knockoutRounds = {
  r32: [],
  r16: [],
  qf: [],
  sf: [],
  final: []
};

function teamLabel(team) {
  return `
    <span class="team-with-flag">
      <span class="flag">${flags[team] || "🏳️"}</span>
      <span>${team}</span>
    </span>
  `;
}

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
      <div class="team-left">${teamLabel(teamA)}</div>
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
      <div class="team-right">${teamLabel(teamB)}</div>
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

function emptyStats(team, groupLetter) {
  return {
    team,
    group: groupLetter,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    position: 0
  };
}

function calculateGroup(groupLetter) {
  const teamsInGroup = groups[groupLetter];
  const stats = {};

  teamsInGroup.forEach(team => {
    stats[team] = emptyStats(team, groupLetter);
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

    if (homeInput.value === "" || awayInput.value === "") {
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

  table.forEach((row, index) => {
    row.position = index + 1;
  });

  return table;
}

function updateGroupTable(groupLetter, table) {
  const tbody = document.querySelector(`#table-${groupLetter} tbody`);
  tbody.innerHTML = "";

  table.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}. ${teamLabel(row.team)}</td>
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
  const allTeamsRanked = [];

  Object.keys(groups).forEach(groupLetter => {
    const table = calculateGroup(groupLetter);
    allTables[groupLetter] = table;
    updateGroupTable(groupLetter, table);

    qualified[groupLetter] = {
      first: table[0]?.team || "",
      second: table[1]?.team || "",
      third: table[2]?.team || ""
    };

    table.forEach(team => allTeamsRanked.push(team));
  });

  renderQualified(qualified, allTables);
  buildKnockout(allTables);

  return { qualified, allTables, knockoutRounds };
}

function renderQualified(qualified, allTables) {
  qualifiedContainer.innerHTML = "";

  const thirdPlaceTeams = Object.values(allTables)
    .map(table => table[2])
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    })
    .slice(0, 8)
    .map(row => row.team);

  Object.entries(qualified).forEach(([groupLetter, result]) => {
    const div = document.createElement("div");
    div.className = "qualified-item";

    const thirdStatus = thirdPlaceTeams.includes(result.third)
      ? `${teamLabel(result.third)}`
      : "-";

    div.innerHTML = `
      <strong>Group ${groupLetter}</strong>
      1st: ${teamLabel(result.first)}<br>
      2nd: ${teamLabel(result.second)}<br>
      Best 3rd: ${thirdStatus}
    `;

    qualifiedContainer.appendChild(div);
  });
}

function getQualifiedTeams(allTables) {
  const groupWinners = [];
  const runnersUp = [];
  const thirdPlaceTeams = [];

  Object.values(allTables).forEach(table => {
    groupWinners.push(table[0]);
    runnersUp.push(table[1]);
    thirdPlaceTeams.push(table[2]);
  });

  const bestThirds = thirdPlaceTeams
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    })
    .slice(0, 8);

  const seededTeams = [...groupWinners, ...runnersUp, ...bestThirds];

  seededTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  return seededTeams.map((item, index) => ({
    seed: index + 1,
    team: item.team,
    group: item.group,
    points: item.points,
    gd: item.gd,
    gf: item.gf
  }));
}

function buildKnockout(allTables) {
  const qualifiedTeams = getQualifiedTeams(allTables);

  if (qualifiedTeams.length < 32) {
    knockoutContainer.innerHTML = "<p>Enter all group scores to generate the knockout stage.</p>";
    return;
  }

  knockoutRounds.r32 = [];

  for (let i = 0; i < 16; i++) {
    knockoutRounds.r32.push({
      id: `r32-${i}`,
      round: "r32",
      label: `Match ${i + 1}`,
      home: qualifiedTeams[i],
      away: qualifiedTeams[31 - i],
      winner: ""
    });
  }

  renderKnockout();
}

function getWinnerFromMatch(match) {
  const homeScore = document.querySelector(`[data-ko="${match.id}"][data-side="home"]`)?.value;
  const awayScore = document.querySelector(`[data-ko="${match.id}"][data-side="away"]`)?.value;
  const manualWinner = document.querySelector(`[data-winner="${match.id}"]`)?.value;

  if (manualWinner) return manualWinner;

  if (homeScore === "" || awayScore === "") return "";

  const h = Number(homeScore);
  const a = Number(awayScore);

  if (h > a) return match.home.team;
  if (a > h) return match.away.team;

  return "";
}

function createNextRound(previousRound, roundName, roundLabel) {
  const nextRound = [];

  for (let i = 0; i < previousRound.length; i += 2) {
    const winnerA = getWinnerFromMatch(previousRound[i]);
    const winnerB = getWinnerFromMatch(previousRound[i + 1]);

    nextRound.push({
      id: `${roundName}-${i / 2}`,
      round: roundName,
      label: `${roundLabel} ${i / 2 + 1}`,
      home: winnerA ? { team: winnerA } : { team: "TBD" },
      away: winnerB ? { team: winnerB } : { team: "TBD" },
      winner: ""
    });
  }

  return nextRound;
}

function renderKnockout() {
  knockoutContainer.innerHTML = "";

  knockoutRounds.r16 = createNextRound(knockoutRounds.r32, "r16", "R16");
  knockoutRounds.qf = createNextRound(knockoutRounds.r16, "qf", "QF");
  knockoutRounds.sf = createNextRound(knockoutRounds.qf, "sf", "SF");
  knockoutRounds.final = createNextRound(knockoutRounds.sf, "final", "Final");

  const rounds = [
    { key: "r32", title: "Round of 32" },
    { key: "r16", title: "Round of 16" },
    { key: "qf", title: "Quarterfinals" },
    { key: "sf", title: "Semifinals" },
    { key: "final", title: "Final" }
  ];

  rounds.forEach(round => {
    const column = document.createElement("div");
    column.className = "round-column";
    column.innerHTML = `<h3>${round.title}</h3>`;

    knockoutRounds[round.key].forEach(match => {
      column.appendChild(createKnockoutMatch(match));
    });

    knockoutContainer.appendChild(column);
  });

  const finalMatch = knockoutRounds.final[0];
  const champion = finalMatch ? getWinnerFromMatch(finalMatch) : "";

  if (champion) {
    const championBox = document.createElement("div");
    championBox.className = "champion-box";
    championBox.innerHTML = `🏆 Champion: ${teamLabel(champion)}`;
    knockoutContainer.appendChild(championBox);
  }
}

function createKnockoutMatch(match) {
  const div = document.createElement("div");
  div.className = "knockout-match";

  const homeTeam = match.home?.team || "TBD";
  const awayTeam = match.away?.team || "TBD";

  div.innerHTML = `
    <div class="knockout-match-title">${match.label}</div>

    <div class="knockout-team-row">
      <div class="knockout-team-name">${teamLabel(homeTeam)}</div>
      <input class="knockout-score" type="number" min="0" data-ko="${match.id}" data-side="home">
    </div>

    <div class="knockout-team-row">
      <div class="knockout-team-name">${teamLabel(awayTeam)}</div>
      <input class="knockout-score" type="number" min="0" data-ko="${match.id}" data-side="away">
    </div>

    <select class="winner-select" data-winner="${match.id}">
      <option value="">Winner if draw / penalties</option>
      <option value="${homeTeam}">${homeTeam}</option>
      <option value="${awayTeam}">${awayTeam}</option>
    </select>
  `;

  div.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("input", renderKnockout);
    input.addEventListener("change", renderKnockout);
  });

  return div;
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

function collectKnockout() {
  const allMatches = [
    ...knockoutRounds.r32,
    ...knockoutRounds.r16,
    ...knockoutRounds.qf,
    ...knockoutRounds.sf,
    ...knockoutRounds.final
  ];

  return allMatches.map(match => {
    const homeScore = document.querySelector(`[data-ko="${match.id}"][data-side="home"]`)?.value || "";
    const awayScore = document.querySelector(`[data-ko="${match.id}"][data-side="away"]`)?.value || "";
    const winner = getWinnerFromMatch(match);

    return {
      round: match.round,
      label: match.label,
      homeTeam: match.home.team,
      awayTeam: match.away.team,
      homeScore,
      awayScore,
      winner
    };
  });
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
    groupScores: collectScores(),
    qualified: calculation.qualified,
    tables: calculation.allTables,
    knockout: collectKnockout()
  };

  localStorage.setItem("worldCup2026Prediction", JSON.stringify(prediction, null, 2));

  resultBox.textContent = JSON.stringify(prediction, null, 2);

  alert("Prediction saved locally. Next step: we will send it to Google Sheets.");
}

function resetAll() {
  const confirmReset = confirm("Are you sure you want to clear all scores?");
  if (!confirmReset) return;

  document.querySelectorAll(".score-input, .knockout-score").forEach(input => {
    input.value = "";
  });

  document.querySelectorAll(".winner-select").forEach(select => {
    select.value = "";
  });

  document.getElementById("playerName").value = "";
  localStorage.removeItem("worldCup2026Prediction");
  resultBox.textContent = "No result yet.";

  calculateAll();
}

function getChampionName() {
  const finalMatch = knockoutRounds.final?.[0];

  if (!finalMatch) {
    return "";
  }

  return getWinnerFromMatch(finalMatch) || "";
}

async function submitToGoogleSheets() {
  const playerName = document.getElementById("playerName").value.trim();

  if (!playerName) {
    alert("Please enter your name first.");
    return;
  }

  const calculation = calculateAll();

  const prediction = {
    playerName,
    submittedAt: new Date().toISOString(),
    champion: getChampionName(),
    groupScores: collectScores(),
    qualified: calculation.qualified,
    tables: calculation.allTables,
    knockout: collectKnockout()
  };

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(prediction)
    });

    localStorage.setItem(
      "worldCup2026Prediction",
      JSON.stringify(prediction, null, 2)
    );

    resultBox.textContent = JSON.stringify(prediction, null, 2);

    alert("Prediction submitted. Check your Google Sheet.");

  } catch (error) {
    console.error(error);
    alert("Submission failed. Please check the Apps Script URL.");
  }
}


document.getElementById("calculateBtn").addEventListener("click", calculateAll);
document.getElementById("saveBtn").addEventListener("click", saveLocally);
document.getElementById("submitBtn").addEventListener("click", submitToGoogleSheets);
document.getElementById("resetBtn").addEventListener("click", resetAll);

renderGroups();

