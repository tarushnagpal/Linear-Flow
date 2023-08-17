require("dotenv").config();

import { LinearClient, LinearFetch, User, Issue, Team } from "@linear/sdk";
import {
  IdComparator,
  NullableCycleFilter,
  PaginationOrderBy,
} from "@linear/sdk/dist/_generated_documents";

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
    const myIssues = await this.me.assignedIssues({
      orderBy: PaginationOrderBy.CreatedAt,
    });

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
          filter: {
            cycle: {
              id: { eq: activeSprint.id } as IdComparator,
            } as NullableCycleFilter,
          },
        })
      ).nodes;
    });
    let issues: Issue[] = [];
    const teamIssues = await Promise.all(issuePromises);
    teamIssues.map((ti) =>
      ti.map(async (issue) => {
        const parent = await issue.parent;

        if (parent === undefined) {
          issues.push(issue);
        }
      })
    );

    return issues;
  }

  async getSubIssuesOfIssues(issueId: string): Promise<Issue[]> {
    const issue = await this.me.assignedIssues({
      filter: {
        parent: { id: { eq: issueId } as IdComparator } as NullableCycleFilter,
      },
    });

    return issue.nodes;
  }

  async addSubIssueToIssue(teamId: string, parentIssueId: string) {
    await this.linearClient.createIssue({
      teamId: teamId,
      parentId: parentIssueId,
      title: "Test Sub Issue",
      assigneeId: this.me.id,
    });
  }

  async addStartCommentToIssue(issueId: string) {
    await this.linearClient.createComment({
      issueId: issueId,
      body: "Started at: " + new Date().toLocaleString(),
    });
  }
}

(async () => {
  const l = new Linear(process.env.LINEAR_API_KEY as string);

  await l.init();

  const issues = await l.getAllIssuesInCurrentSprint();

  issues.map(async (i) => {
    const team = await i.team;

    if (team?.name === "Socket and Livestreaming") {
      console.log(`team id: ${team.id}`);

      console.log(`issue title: ${i.title} id: ${i.id}`);
    }
  });

  //   await l.addSubIssueToIssue("c4196cb6-0690-4265-bf6a-678a033c40fc", "2f7a26d1-c460-4f44-bc4f-80bb5dc4e92b");

//   const subIssues = await l.getSubIssuesOfIssues(
//     "2f7a26d1-c460-4f44-bc4f-80bb5dc4e92b"
//   );

//   console.log(subIssues);

//   await l.addStartCommentToIssue(subIssues[0].id);
})();
