import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Linear from '../services/linear/linear';
import { Issue, WorkflowState } from '@linear/sdk';

class IssueType extends vscode.TreeItem {
  constructor(
    public readonly title: string,
  ) {
    super(title, title.startsWith('Current') ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = path.join(__filename, '..', '..', '..', 'media', title.startsWith('Current') ? 'sprint.svg' : 'list.svg');
  }

  public get type() {
    return 'issuetype';
  }

}

export class LinearIssue extends vscode.TreeItem {
  issue: Issue;
  
  constructor(
    public readonly title: string,
    public readonly _issue: Issue,
    public readonly status?: WorkflowState,
    public readonly description?: string,
  ) {
    super(title, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label}`;
    this.issue = _issue;

    this.command = {
      title: 'Open',
      command: 'linear-flow.openTicketInWebView',
      arguments: [this.issue]
    };
    
    const statusType = status?.type;
    this.iconPath = path.join(__filename, '..', '..', '..', 'media', 
      statusType === 'completed' ? 'full_circle.svg' : statusType === 'started' ? 'half_circle.svg' : 'empty_circle.svg'
    );
  }

  public get type() {
    return 'issue';
  }

}

const currentSprintTitle = 'Current Cycle';
const allIssueTitle = 'All Issues';

const issueTypes = [
  new IssueType(currentSprintTitle),
  new IssueType(allIssueTitle)
];

export class LinearIssueProvider implements vscode.TreeDataProvider<LinearIssue | IssueType> {
  #linear: Linear;

  constructor(linearKey: string) {
    this.#linear = new Linear(linearKey);
  }

  get linear() {
    return this.#linear;
  }

  getTreeItem(element: LinearIssue): vscode.TreeItem {
    return element;
  }

  getChildren(element?: LinearIssue | IssueType): Thenable<LinearIssue[] | IssueType[]> {
    if (element?.type === 'issuetype') {
      if (element.title === currentSprintTitle) {return Promise.resolve(this.getIssues('current'));}
      else {return Promise.resolve(this.getIssues('all'));};
    }
    return Promise.resolve(issueTypes);
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private async getIssues(type: 'current' | 'all'): Promise<LinearIssue[]> {
    const issues = type === 'current' ? await this.#linear.getAllIssuesInCurrentSprint() : await this.#linear.getAllIssues();
    const issueAndStates = await Promise.all(issues.map(async (issue) => ({ issue, state: await issue.state })));
    return issueAndStates.map((issueAndState) => {
      const issue = issueAndState.issue;
      return new LinearIssue(issue.title, issue, issueAndState.state,issue.description);
    });
  }

}
