import {
  LinearClient,
  User,
  Issue,
  Team,
} from "@linear/sdk";
import {
  IdComparator,
  NullableCycleFilter,
} from "@linear/sdk/dist/_generated_documents";
import * as vscode from "vscode";

// get all issues
// attach a sub issue to an issue
// comment on that issue the started time
// fetch the details for the sub issue like the id, checkout branch

export default class Linear {

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

    const issues = await this.me.assignedIssues({});

    const trimmedIssueIdentifier = issueIdentifier.trimStart().trimEnd();

    issues.nodes.map(async (i) => {
      if (i.identifier.trimStart().trimEnd() === trimmedIssueIdentifier) {
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
