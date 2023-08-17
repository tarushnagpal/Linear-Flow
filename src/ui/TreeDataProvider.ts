import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Linear from '../services/linear/linear';

class IssueType extends vscode.TreeItem {
  constructor(
    public readonly title: string,
  ) {
    super(title, vscode.TreeItemCollapsibleState.Collapsed);
  }

  public get type() {
    return 'issuetype';
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'media', 'dark', 'dependency.svg')
  };
}

class LinearIssue extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly description?: string,
  ) {
    super(title, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label}`;
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
    console.log('constructred');
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
    return issues.map(issue => new LinearIssue(issue.title, issue.description));
  }

}
