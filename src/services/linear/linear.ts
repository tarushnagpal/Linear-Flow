require("dotenv").config();

import { LinearClient, LinearFetch, User, Issue, Team } from "@linear/sdk";
import { NullableCycleFilter } from "@linear/sdk/dist/_generated_documents";

// get all issues
// attach a sub issue to an issue
// comment on that issue the started time
// fetch the details for the sub issue like the id, checkout branch

class Linear {
  linearClient: LinearClient;
  me: User = {} as User;
  teams: Team[] = [];

  constructor(apiKey: string) {
    this.linearClient = new LinearClient({ apiKey });
  }

  async init() {
    this.me = await this.linearClient.viewer;

    this.teams = (await this.me.teams()).nodes;
  }

  info() {
    console.log(this.me.name);

    this.teams.forEach((t) => console.log(t.name));
  }

  async getAllIssues(): Promise<Issue[]> {
    const myIssues = await this.me.assignedIssues();

    return myIssues.nodes;
  }

  async getAllIssuesInCurrentSprint(): Promise<Issue[]> {
    const issuePromises = this.teams.flatMap(async (t) => {
      const cycles = (await t.cycles()).nodes;

      const now = new Date();

      const activeSprint = cycles.filter(
        (c) => c.startsAt <= now && c.endsAt > now
      )[0];

      return (
        await this.me.assignedIssues({
          filter: { cycle: { id: activeSprint.id } as NullableCycleFilter },
        })
      ).nodes;
    });
    let issues: Issue[] = [];
    const teamIssues = await Promise.all(issuePromises);
    teamIssues.map((ti) => ti.map((issue) => issues.push(issue)));

    return issues;
  }
}

// const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

// async function getMyIssues() {
//   const me = await linearClient.viewer;
//   const myIssues = await me.assignedIssues({
//     filter: {
//       cycle,
//     },
//   });

//   if (myIssues.nodes.length) {
//     myIssues.nodes.map((issue) =>
//       console.log(`${me.displayName} has issue: ${issue.title}`)
//     );
//   } else {
//     console.log(`${me.displayName} has no issues`);
//   }

//   const ts = await linearClient.teams();

//   ts.nodes.map(async (t) => {
//     if (t.name === "Socket and Livestreaming") {
//       console.log(t.name);

//       const cycles = await t.cycles();

//       const now = new Date();

//       cycles.nodes.map((c) => {
//         if (c.startsAt <= now && c.endsAt > now) {
//           console.log(c);
//         }
//       });
//     }
//   });
// }

(async () => {
  const l = new Linear(process.env.LINEAR_API_KEY as string);

  await l.init();

  l.info();

  //   const issues = await l.getAllIssues();

  //   issues.map((i) => console.log(i));

  const issues = await l.getAllIssuesInCurrentSprint();

  issues.map((i) => console.log(i.title));
})();
