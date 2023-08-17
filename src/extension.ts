// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from 'child_process';

import * as vscode from 'vscode';
import { LinearIssue, LinearIssueProvider } from './ui/TreeDataProvider';
import { getWebviewContent } from './ui/TicketDetailWebView';
import { Issue } from '@linear/sdk';
import Hyperbeam from '@hyperbeam/web';

const linearAPIStorageKey = 'LINEAR_API_STORAGE_KEY';

// checkout the branch
// push the branch with one commit
// create a PR
// take input of folder that needs to be opened

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const apiKey = context.globalState.get(linearAPIStorageKey);
	if (apiKey && (apiKey as string).startsWith('lin_api')) {
		const linearIssueProvider = new LinearIssueProvider(apiKey as string);
		linearIssueProvider.linear.init().then(() => vscode.window.registerTreeDataProvider('linearIssues', linearIssueProvider));
	}
	
	vscode.commands.registerCommand('ticket-connect.inputLinearApiKey', async () => {
		const input = await vscode.window.showInputBox({
			placeHolder: 'lin_api_*',
			prompt: 'Enter Linear API Key',
		});
		const linearIssueProvider = new LinearIssueProvider(input!);
		await linearIssueProvider.linear.init();

		// Only set when successful
		context.globalState.update(linearAPIStorageKey, input);
		const x = vscode.window.registerTreeDataProvider('linearIssues', linearIssueProvider);
	});

	vscode.commands.registerCommand('ticket-connect.openTicketInWebView', async (issue: Issue) => {
		console.log('got', issue);

		// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
			'ticketDetails', // Identifies the type of the webview. Used internally
			'Ticket Details', // Title of the panel displayed to the user
			vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
			{
				enableScripts: true,
			}
		);
		const comments = await issue.comments();
		panel.webview.html = getWebviewContent(issue, comments.nodes);
	});

	vscode.commands.registerCommand('ticket-connect.openTicketInEditor', async () => {
		exec('cd /Users/akshit/Desktop/test-repo && git checkout -b test-branch-3');
		exec('cd /Users/akshit/Desktop/test-repo && git commit -m "test commit" --allow-empty', (err, stdout, stderr) => {
			if (err) {
				return;
			}
			exec('cd /Users/akshit/Desktop/test-repo && git push origin test-branch-3');
		});

		exec('ls ../', (err, stdout, stderr) => {
			if (err) {
				return;
			}

			const folders = stdout.split('\n').filter((x) => x);

			const quickPick = vscode.window.createQuickPick();
			quickPick.items = folders.map((folder) => ({ label: `/Users/akshit/dyte/${folder}` }));
			
			quickPick.onDidHide(() => quickPick.dispose());
			quickPick.show();
		});
		
		// let uri = vscode.Uri.file('');
		// let success = await vscode.commands.executeCommand('vscode.openFolder', uri);
	});
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
