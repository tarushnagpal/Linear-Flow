import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Linear from '../services/linear/linear';
import { Issue } from '@linear/sdk';

class IssueType extends vscode.TreeItem {
  constructor(
    public readonly title: string,
  ) {
    super(title, title.startsWith('Current') ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
  }

  public get type() {
    return 'issuetype';
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'media', 'dark', 'dependency.svg')
  };
}

export class LinearIssue extends vscode.TreeItem {
  issue: Issue;
  
  constructor(
    public readonly title: string,
    public readonly _issue: Issue,
    public readonly description?: string,
  ) {
    super(title, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label}`;
    this.issue = _issue;

    this.command = {
      title: 'Open',
      command: 'ticket-connect.openTicketInWebView',
      arguments: [this.issue]
    };
  }

  public get type() {
    return 'issue';
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'media', 'dark', 'dependency.svg')
  };
}

const currentSprintTitle = 'Current Sprint';
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
    console.log('Gti');
    return element;
  }

  getChildren(element?: LinearIssue | IssueType): Thenable<LinearIssue[] | IssueType[]> {
    console.log('Gc');
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
    console.log('gotIssues');
    return issues.map(issue => new LinearIssue(issue.title, issue, issue.description));
  }

}
