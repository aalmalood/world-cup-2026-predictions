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

const flagCodes = {
  "Mexico": "mx",
  "Czech Republic": "cz",
  "South Africa": "za",
  "South Korea": "kr",
  "Canada": "ca",
  "Bosnia and Herzegovina": "ba",
  "Qatar": "qa",
  "Switzerland": "ch",
  "Brazil": "br",
  "Haiti": "ht",
  "Morocco": "ma",
  "Scotland": "gb-sct",
  "United States": "us",
  "Australia": "au",
  "Paraguay": "py",
  "Türkiye": "tr",
  "Germany": "de",
  "Curaçao": "cw",
  "Ivory Coast": "ci",
  "Ecuador": "ec",
  "Netherlands": "nl",
  "Japan": "jp",
  "Sweden": "se",
  "Tunisia": "tn",
  "Belgium": "be",
  "Egypt": "eg",
  "Iran": "ir",
  "New Zealand": "nz",
  "Spain": "es",
  "Cabo Verde": "cv",
  "Saudi Arabia": "sa",
  "Uruguay": "uy",
  "France": "fr",
  "Norway": "no",
  "Senegal": "sn",
  "Iraq": "iq",
  "Argentina": "ar",
  "Algeria": "dz",
  "Austria": "at",
  "Jordan": "jo",
  "Portugal": "pt",
  "DR Congo": "cd",
  "Uzbekistan": "uz",
  "Colombia": "co",
  "England": "gb-eng",
  "Croatia": "hr",
  "Ghana": "gh",
  "Panama": "pa",
  "TBD": ""
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
  third: [],
  final: []
};

let knockoutMemory = {};

function saveKnockoutValue(matchId, field, value) {
  if (!knockoutMemory[matchId]) {
    knockoutMemory[matchId] = {};
  }

  knockoutMemory[matchId][field] = value;
}

function applySavedKnockoutData(match) {
  const saved = knockoutMemory[match.id] || {};

  return {
    ...match,
    homeScore: saved.homeScore || "",
    awayScore: saved.awayScore || "",
    manualWinner: saved.manualWinner || ""
  };
}

function teamLabel(team) {
  const code = flagCodes[team];

  if (!team || team === "TBD") {
    return `
      <span class="team-with-flag">
        <span class="flag-placeholder"></span>
        <span>TBD</span>
      </span>
    `;
  }

  const flagUrl = code
    ? `https://flagcdn.com/w40/${code}.png`
    : "";

  return `
    <span class="team-with-flag">
      ${
        flagUrl
          ? `<img class="flag-img" src="${flagUrl}" alt="${team} flag">`
          : `<span class="flag-placeholder"></span>`
      }
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
  const qualified = {
    winners: {},
    runnersUp: {},
    thirds: {},
    bestThirdGroups: []
  };

  Object.entries(allTables).forEach(([groupLetter, table]) => {
    qualified.winners[groupLetter] = table[0];
    qualified.runnersUp[groupLetter] = table[1];
    qualified.thirds[groupLetter] = table[2];
  });

  const bestThirds = Object.entries(qualified.thirds)
    .map(([groupLetter, team]) => ({
      ...team,
      group: groupLetter
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    })
    .slice(0, 8);

  qualified.bestThirdGroups = bestThirds.map(team => team.group);

  return qualified;
}

function assignThirdPlaceTeams(qualified) {
  const usedThirdGroups = new Set();

  function pickThird(allowedGroups) {
    const candidates = allowedGroups
      .filter(groupLetter => qualified.bestThirdGroups.includes(groupLetter))
      .filter(groupLetter => !usedThirdGroups.has(groupLetter))
      .map(groupLetter => qualified.thirds[groupLetter])
      .filter(Boolean)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.localeCompare(b.team);
      });

    const selected = candidates[0];

    if (!selected) {
      return { team: "TBD" };
    }

    usedThirdGroups.add(selected.group);
    return selected;
  }

  return { pickThird };
}


function buildKnockout(allTables) {
  const qualified = getQualifiedTeams(allTables);
  const thirdPicker = assignThirdPlaceTeams(qualified);

  function W(groupLetter) {
    return qualified.winners[groupLetter] || { team: "TBD" };
  }

  function R(groupLetter) {
    return qualified.runnersUp[groupLetter] || { team: "TBD" };
  }

  function T(allowedGroups) {
    return thirdPicker.pickThird(allowedGroups);
  }

  const officialRoundOf32 = [
    {
      id: "m73",
      label: "Match 73",
      home: R("A"),
      away: R("B")
    },
    {
      id: "m74",
      label: "Match 74",
      home: W("E"),
      away: T(["A", "B", "C", "D", "F"])
    },
    {
      id: "m75",
      label: "Match 75",
      home: W("F"),
      away: R("C")
    },
    {
      id: "m76",
      label: "Match 76",
      home: W("C"),
      away: R("F")
    },
    {
      id: "m77",
      label: "Match 77",
      home: W("I"),
      away: T(["C", "D", "F", "G", "H"])
    },
    {
      id: "m78",
      label: "Match 78",
      home: R("E"),
      away: R("I")
    },
    {
      id: "m79",
      label: "Match 79",
      home: W("A"),
      away: T(["C", "E", "F", "H", "I"])
    },
    {
      id: "m80",
      label: "Match 80",
      home: W("L"),
      away: T(["E", "H", "I", "J", "K"])
    },
    {
      id: "m81",
      label: "Match 81",
      home: W("D"),
      away: T(["B", "E", "F", "I", "J"])
    },
    {
      id: "m82",
      label: "Match 82",
      home: W("G"),
      away: T(["A", "E", "H", "I", "J"])
    },
    {
      id: "m83",
      label: "Match 83",
      home: R("K"),
      away: R("L")
    },
    {
      id: "m84",
      label: "Match 84",
      home: W("H"),
      away: R("J")
    },
    {
      id: "m85",
      label: "Match 85",
      home: W("B"),
      away: T(["E", "F", "G", "I", "J"])
    },
    {
      id: "m86",
      label: "Match 86",
      home: W("J"),
      away: R("H")
    },
    {
      id: "m87",
      label: "Match 87",
      home: W("K"),
      away: T(["D", "E", "I", "J", "L"])
    },
    {
      id: "m88",
      label: "Match 88",
      home: R("D"),
      away: R("G")
    }
  ];

  knockoutRounds.r32 = officialRoundOf32.map(match => {
    return applySavedKnockoutData({
      id: match.id,
      round: "r32",
      label: match.label,
      home: match.home,
      away: match.away,
      winner: ""
    });
  });

  renderKnockout();
}

function getWinnerFromMatch(match) {
  if (match.manualWinner) {
    return match.manualWinner;
  }

  if (match.homeScore === "" || match.awayScore === "") {
    return "";
  }

  if (match.homeScore === undefined || match.awayScore === undefined) {
    return "";
  }

  const h = Number(match.homeScore);
  const a = Number(match.awayScore);

  if (h > a) return match.home.team;
  if (a > h) return match.away.team;

  return "";
}

function createNextRound(previousRound, roundName, roundLabel) {
  const nextRound = [];

  for (let i = 0; i < previousRound.length; i += 2) {
    const winnerA = getWinnerFromMatch(previousRound[i]);
    const winnerB = getWinnerFromMatch(previousRound[i + 1]);

    const match = {
      id: `${roundName}-${i / 2}`,
      round: roundName,
      label: `${roundLabel} ${i / 2 + 1}`,
      home: winnerA ? { team: winnerA } : { team: "TBD" },
      away: winnerB ? { team: winnerB } : { team: "TBD" },
      winner: ""
    };

    nextRound.push(applySavedKnockoutData(match));
  }

  return nextRound;
}

function findMatch(matchId) {
  const allMatches = [
    ...knockoutRounds.r32,
    ...knockoutRounds.r16,
    ...knockoutRounds.qf,
    ...knockoutRounds.sf,
    ...knockoutRounds.final
  ];

  return allMatches.find(match => match.id === matchId);
}

function makeMatch(id, round, label, homeMatchId, awayMatchId) {
  const homePrevious = findMatch(homeMatchId);
  const awayPrevious = findMatch(awayMatchId);

  const homeWinner = homePrevious ? getWinnerFromMatch(homePrevious) : "";
  const awayWinner = awayPrevious ? getWinnerFromMatch(awayPrevious) : "";

  const match = {
    id,
    round,
    label,
    home: homeWinner ? { team: homeWinner } : { team: "TBD" },
    away: awayWinner ? { team: awayWinner } : { team: "TBD" },
    winner: ""
  };

  return applySavedKnockoutData(match);
}

function renderKnockout() {
  knockoutContainer.innerHTML = "";

  knockoutRounds.r16 = [
    makeMatch("m89", "r16", "Match 89", "m73", "m75"),
    makeMatch("m90", "r16", "Match 90", "m74", "m77"),
    makeMatch("m91", "r16", "Match 91", "m76", "m78"),
    makeMatch("m92", "r16", "Match 92", "m79", "m80"),
    makeMatch("m93", "r16", "Match 93", "m83", "m84"),
    makeMatch("m94", "r16", "Match 94", "m81", "m82"),
    makeMatch("m95", "r16", "Match 95", "m86", "m88"),
    makeMatch("m96", "r16", "Match 96", "m85", "m87")
  ];

  knockoutRounds.qf = [
    makeMatch("m97", "qf", "Match 97", "m89", "m90"),
    makeMatch("m98", "qf", "Match 98", "m93", "m94"),
    makeMatch("m99", "qf", "Match 99", "m91", "m92"),
    makeMatch("m100", "qf", "Match 100", "m95", "m96")
  ];

  knockoutRounds.sf = [
    makeMatch("m101", "sf", "Match 101", "m97", "m98"),
    makeMatch("m102", "sf", "Match 102", "m99", "m100")
  ];

  knockoutRounds.third = [
    makeMatch("m103", "third", "Match 103 - Third Place", "m101", "m102")
  ];

  knockoutRounds.final = [
    makeMatch("m104", "final", "Match 104 - Final", "m101", "m102")
  ];

  const rounds = [
    { key: "r32", title: "Round of 32" },
    { key: "r16", title: "Round of 16" },
    { key: "qf", title: "Quarterfinals" },
    { key: "sf", title: "Semifinals" },
    { key: "third", title: "Third Place" },
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
      <input 
        class="knockout-score" 
        type="number" 
        min="0" 
        inputmode="numeric"
        data-ko="${match.id}" 
        data-side="home"
        value="${match.homeScore || ""}">
    </div>

    <div class="knockout-team-row">
      <div class="knockout-team-name">${teamLabel(awayTeam)}</div>
      <input 
        class="knockout-score" 
        type="number" 
        min="0" 
        inputmode="numeric"
        data-ko="${match.id}" 
        data-side="away"
        value="${match.awayScore || ""}">
    </div>

    <select class="winner-select" data-winner="${match.id}">
      <option value="">Winner if draw / penalties</option>
      <option value="${homeTeam}" ${match.manualWinner === homeTeam ? "selected" : ""}>${homeTeam}</option>
      <option value="${awayTeam}" ${match.manualWinner === awayTeam ? "selected" : ""}>${awayTeam}</option>
    </select>
  `;

  const homeInput = div.querySelector(`[data-ko="${match.id}"][data-side="home"]`);
  const awayInput = div.querySelector(`[data-ko="${match.id}"][data-side="away"]`);
  const winnerSelect = div.querySelector(`[data-winner="${match.id}"]`);

  homeInput.addEventListener("input", () => {
    match.homeScore = homeInput.value;
    saveKnockoutValue(match.id, "homeScore", homeInput.value);
  });

  awayInput.addEventListener("input", () => {
    match.awayScore = awayInput.value;
    saveKnockoutValue(match.id, "awayScore", awayInput.value);
  });

  homeInput.addEventListener("blur", renderKnockout);
  awayInput.addEventListener("blur", renderKnockout);

  winnerSelect.addEventListener("change", () => {
    match.manualWinner = winnerSelect.value;
    saveKnockoutValue(match.id, "manualWinner", winnerSelect.value);
    renderKnockout();
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
    ...knockoutRounds.third,
    ...knockoutRounds.final
  ];

  return allMatches.map(match => {
    return {
      round: match.round,
      label: match.label,
      homeTeam: match.home.team,
      awayTeam: match.away.team,
      homeScore: match.homeScore || "",
      awayScore: match.awayScore || "",
      winner: getWinnerFromMatch(match)
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
  knockoutMemory = {};
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

