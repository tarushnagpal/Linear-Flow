import {
  LinearClient,
  LinearFetch,
  User,
  Issue,
  Team,
  CommentPayload,
} from "@linear/sdk";
import {
  IdComparator,
  IssueFilter,
  NullableCycleFilter,
} from "@linear/sdk/dist/_generated_documents";

// get all issues
// attach a sub issue to an issue
// comment on that issue the started time
// fetch the details for the sub issue like the id, checkout branch

export default class Linear {
  linearClient: LinearClient;
  me: User = {} as User;
  teams: Team[] = [];

  constructor(apiKey: string) {
    console.log("test", apiKey);
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
      // orderBy: PaginationOrderBy.CreatedAt,
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

  async addStartCommentToIssue(issueIdentifier: string) {
    console.log("adding start comment to issue", issueIdentifier);

    const issues = await this.me.assignedIssues({});

    const trimmedIssueIdentifier = issueIdentifier.trimStart().trimEnd();

    issues.nodes.map(async (i) => {
      // console.log("issue", i.identifier, i.identifier.trimStart().trimEnd() === issueIdentifier.trimStart().trimEnd());
      if (i.identifier.trimStart().trimEnd() === trimmedIssueIdentifier) {
        console.log("creating comment for issue", i.identifier);
        await this.linearClient.createComment({
          issueId: i.id,
          body: "Started at: " + new Date().toLocaleString(),
        });
      }
    });
  }

  async addEndCommentToIssue(issueIdentifier: string) {
    const issue = await this.me.assignedIssues({});

    const trimmedIssueIdentifier = issueIdentifier.trimStart().trimEnd();

    issue.nodes.map(async (i) => {
      if (i.identifier.trimStart().trimEnd() === trimmedIssueIdentifier) {
        await this.linearClient.createComment({
          issueId: i.id,
          body: "Ended at: " + new Date().toLocaleString(),
        });
      }
    });
  }

  async updateIssueComment(issueIdentifier: string) {
    const issue = await this.me.assignedIssues({});

    const trimmedIssueIdentifier = issueIdentifier.trimStart().trimEnd();

    issue.nodes.map(async (i) => {
      if (i.identifier.trimStart().trimEnd() === trimmedIssueIdentifier) {
        const comments = await i.comments();

        comments.nodes.map(async (c) => {
          if (c.body.startsWith("Ended at:")) {
            await this.linearClient.updateComment(c.id, {
              body: "Ended at: " + new Date().toLocaleString(),
            });
          }
        });
      }
    });
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

  issues.map((i) => console.log(i));
})();
