// the same Premier League file we used in Week 13
const SITE = "https://raw.githubusercontent.com";
// the folder for the 2025/26 season
const FOLDER = "/openfootball/football.json/master/2025-26";
// the file for England's first division: the Premier League
const FILE = "/en.1.json";
// glue the three parts into one address
const SEASON_URL = SITE + FOLDER + FILE;

// the description the model reads, so it knows the tool exists
const teamRecordTool = {
  type: "function",
  function: {
    name: "get_team_record",
    description: "Get one Premier League team's 2025/26 record: "
      + "played, won, drawn, lost, goals, and points.",
    parameters: {
      type: "object",
      properties: {
        team: { type: "string", description: "The team name, like Arsenal" },
      },
      required: ["team"],
    },
  },
};

// every tool the model may ask for; today there is one
export const TOOLS = [teamRecordTool];

// most scores look like { ft: [2, 1] }; a few 0-0 games are just [0, 0]
function readScore(match) {
  // is the score already a plain list?
  const isList = Array.isArray(match.score);
  // if so, use it as it is
  if (isList) {
    // [home goals, away goals]
    return match.score;
  }
  // otherwise the full-time score is under ft
  return match.score.ft;
}

// the tool itself: plain JavaScript that counts a team's results
async function getTeamRecord(teamText) {
  // load the season, as in Week 13
  const response = await fetch(SEASON_URL);
  // read the body as JSON
  const season = await response.json();
  // the season object holds a list called matches
  const matches = season.matches;
  // lowercase the search so "arsenal" finds "Arsenal FC"
  const lowerSearch = teamText.toLowerCase();

  // the full team names that fit the search
  const teamNames = [];
  // look at every match
  for (const match of matches) {
    // check the home team, then the away team
    for (const name of [match.team1, match.team2]) {
      // lowercase this name too
      const lowerName = name.toLowerCase();
      // does the name fit the search?
      const fits = lowerName.includes(lowerSearch);
      // is it already on our list?
      const alreadyListed = teamNames.includes(name);
      // only add each name once
      if (fits && !alreadyListed) {
        // remember this team name
        teamNames.push(name);
      }
    }
  }
  // no team fits: tell the model so it can tell the user
  if (teamNames.length === 0) {
    // the model reads this message
    return { error: "No Premier League team matches " + teamText };
  }
  // more than one fits, like "Manchester": the model should ask
  if (teamNames.length > 1) {
    // put the names in one line, like "Manchester City FC, Manchester United FC"
    const nameList = teamNames.join(", ");
    // the model reads this message
    return { error: "More than one team matches: " + nameList };
  }

  // exactly one team fits
  const team = teamNames[0];
  // start every count at zero
  const record = {
    team: team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
  // go through the season one match at a time
  for (const match of matches) {
    // was this team at home?
    const atHome = match.team1 === team;
    // was this team away?
    const away = match.team2 === team;
    // skip matches this team did not play
    if (!atHome && !away) {
      // go to the next match
      continue;
    }
    // [home goals, away goals]
    const score = readScore(match);
    // our goals: the home number if at home, else the away number
    let scored = score[1];
    // their goals: the other number
    let conceded = score[0];
    // flip the two if our team was at home
    if (atHome) {
      // our goals are the home number
      scored = score[0];
      // their goals are the away number
      conceded = score[1];
    }
    // one more game played
    record.played = record.played + 1;
    // add our goals
    record.goalsFor = record.goalsFor + scored;
    // add their goals
    record.goalsAgainst = record.goalsAgainst + conceded;
    // a win is worth 3 points
    if (scored > conceded) {
      // count the win
      record.won = record.won + 1;
      // add 3 points
      record.points = record.points + 3;
    } else if (scored === conceded) {
      // count the draw
      record.drawn = record.drawn + 1;
      // a draw is worth 1 point
      record.points = record.points + 1;
    } else {
      // count the loss; no points
      record.lost = record.lost + 1;
    }
  }
  // hand the finished record back
  return record;
}

// run the tool the model asked for, and return what it found
export async function runTool(toolCall) {
  // the model's request is under function
  const request = toolCall.function;
  // which tool it wants
  const toolName = request.name;
  // its arguments arrive as JSON text, like '{"team":"Arsenal"}'
  const args = JSON.parse(request.arguments);
  // is it the one tool we have?
  if (toolName === "get_team_record") {
    // run it; wait for the season to load and the counting to finish
    const result = await getTeamRecord(args.team);
    // hand back the record
    return result;
  }
  // the model asked for a tool we do not have
  return { error: "There is no tool called " + toolName };
}
