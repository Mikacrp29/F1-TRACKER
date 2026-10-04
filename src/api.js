const BASE = "https://api.jolpi.ca/ergast/f1";
const YEAR = new Date().getFullYear();

const get = async (path) => {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return (await r.json()).MRData;
};

const COUNTRY_FLAG = {
  Australia:"🇦🇺", China:"🇨🇳", Japan:"🇯🇵", USA:"🇺🇸", "United States":"🇺🇸", Canada:"🇨🇦",
  Monaco:"🇲🇨", Spain:"🇪🇸", Austria:"🇦🇹", UK:"🇬🇧", Belgium:"🇧🇪", Hungary:"🇭🇺",
  Netherlands:"🇳🇱", Italy:"🇮🇹", Singapore:"🇸🇬", Azerbaijan:"🇦🇿", Mexico:"🇲🇽",
  Brazil:"🇧🇷", Qatar:"🇶🇦", UAE:"🇦🇪", Bahrain:"🇧🇭", "Saudi Arabia":"🇸🇦",
};
const NAT_FLAG = {
  British:"🇬🇧", Italian:"🇮🇹", Dutch:"🇳🇱", Monegasque:"🇲🇨", Australian:"🇦🇺", French:"🇫🇷",
  Spanish:"🇪🇸", German:"🇩🇪", Thai:"🇹🇭", Canadian:"🇨🇦", Mexican:"🇲🇽", Finnish:"🇫🇮",
  Japanese:"🇯🇵", Brazilian:"🇧🇷", Argentine:"🇦🇷", "New Zealander":"🇳🇿", Swedish:"🇸🇪",
  Chinese:"🇨🇳", Danish:"🇩🇰", American:"🇺🇸",
};
const TEAM_COLOR = {
  mercedes:"#27F4D2", ferrari:"#E8002D", mclaren:"#FF8000", red_bull:"#3671C6",
  alpine:"#0093CC", rb:"#6692FF", racing_bulls:"#6692FF", haas:"#B6BABD",
  williams:"#64C4FF", audi:"#f50537", sauber:"#f50537", cadillac:"#aa1111",
  aston_martin:"#358C75",
};
const colorOf = (id) => TEAM_COLOR[id] || "#888888";
const gpName = (r) => r.raceName.replace("Grand Prix", "GP");
const toISO = (o) => (o ? `${o.date}T${o.time || "12:00:00Z"}` : null);

// ── Calendrier ──
export async function fetchCalendar() {
  const d = await get("/current.json?limit=100");
  return d.RaceTable.Races.map((r) => {
    const sessions = {};
    const add = (k, o) => { if (o) sessions[k] = toISO(o); };
    add("fp1", r.FirstPractice);
    add("fp2", r.SecondPractice);
    add("fp3", r.ThirdPractice);
    add("sprintQ", r.SprintQualifying || r.SprintShootout);
    add("sprint", r.Sprint);
    add("quali", r.Qualifying);
    sessions.race = toISO(r);
    return {
      round: +r.round,
      name: gpName(r),
      circuit: r.Circuit.circuitName,
      city: r.Circuit.Location.locality,
      country: r.Circuit.Location.country,
      flag: COUNTRY_FLAG[r.Circuit.Location.country] || "🏁",
      hasSprint: !!r.Sprint,
      sessions,
    };
  });
}

// ── Classements ──
export async function fetchDrivers() {
  const d = await get("/current/driverStandings.json");
  const list = d.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  return list.map((s) => ({
    pos: +s.position,
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    short: s.Driver.code,
    team: s.Constructors[0]?.name || "",
    flag: NAT_FLAG[s.Driver.nationality] || "🏁",
    pts: +s.points,
    wins: +s.wins,
    color: colorOf(s.Constructors[0]?.constructorId),
  }));
}

export async function fetchConstructors() {
  const d = await get("/current/constructorStandings.json");
  const list = d.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
  return list.map((s) => ({
    id: s.Constructor.constructorId,
    pos: +s.position,
    name: s.Constructor.name,
    flag: NAT_FLAG[s.Constructor.nationality] || "🏁",
    pts: +s.points,
    wins: +s.wins,
    color: colorOf(s.Constructor.constructorId),
  }));
}

// ── Résultats (course + sprint) ──
const mapResult = (race, type) => {
  const list = (type === "sprint" ? race.SprintResults : race.Results) || [];
  const fl = list.find((x) => x.FastestLap?.rank === "1");
  return {
    round: +race.round,
    type,
    name: gpName(race) + (type === "sprint" ? " — Sprint" : ""),
    flag: COUNTRY_FLAG[race.Circuit.Location.country] || "🏁",
    date: new Date(race.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    circuit: race.Circuit.circuitName,
    pole: list.find((x) => x.grid === "1")?.Driver.code || "—",
    fast: fl ? `${fl.Driver.code} · ${fl.FastestLap.Time.time}` : "—",
    top: list.slice(0, 10).map((x) => ({
      pos: +x.position,
      drv: x.Driver.code,
      name: `${x.Driver.givenName} ${x.Driver.familyName}`,
      team: x.Constructor.name,
      gap: x.position === "1" ? "Vainqueur" : x.Time?.time || x.status,
      pts: +x.points,
      color: colorOf(x.Constructor.constructorId),
      flag: NAT_FLAG[x.Driver.nationality] || "🏁",
    })),
    dnf: list.filter((x) => !/^(Finished|\+)/.test(x.status)).map((x) => `${x.Driver.code} (${x.status})`),
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Les résultats passés ne changent plus : on les garde en cache dans le navigateur
export async function fetchResults(cal) {
  const out = [];
  const finished = cal.filter((g) => Date.now() > new Date(g.sessions.race).getTime() + 7200000);
  for (const g of finished) {
    const types = g.hasSprint ? ["race", "sprint"] : ["race"];
    for (const type of types) {
      const key = `f1res-${YEAR}-${g.round}-${type}`;
      let item = null;
      try { item = JSON.parse(localStorage.getItem(key)); } catch {}
      if (!item) {
        try {
          const d = await get(`/current/${g.round}/${type === "sprint" ? "sprint" : "results"}.json`);
          const race = d.RaceTable.Races[0];
          if (race) {
            item = mapResult(race, type);
            try { localStorage.setItem(key, JSON.stringify(item)); } catch {}
          }
        } catch (e) { console.warn("Résultat manquant", g.round, type, e); }
        await sleep(300); // on évite la limite de requêtes de l'API
      }
      if (item) out.push(item);
    }
  }
  // plus récent d'abord, course avant sprint
  return out.sort((a, b) => b.round - a.round || (a.type === "race" ? -1 : 1));
}