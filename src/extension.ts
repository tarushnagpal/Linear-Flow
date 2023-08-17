// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from 'child_process';

import * as vscode from 'vscode';
import { LinearIssue, LinearIssueProvider } from './ui/TreeDataProvider';
import { getWebviewContent } from './ui/TicketDetailWebView';
import { Issue } from '@linear/sdk';

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

		panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'openineditor':
				  vscode.commands.executeCommand('ticket-connect.openTicketInEditor', [issue.branchName]);
				  return;
			  }
			},
			undefined,
			context.subscriptions
		);
	});

	vscode.commands.registerCommand('ticket-connect.openTicketInEditor', async (branchName: string) => {
		console.log('got', branchName);
		// const branchName = issue.branchName;

		const baseFolder = '/Users/akshit/dyte';

		exec(`ls ${baseFolder}`, (err, stdout, stderr) => {
			if (err) {
				console.log('err', err);
				return;
			}

			const folders = stdout.split('\n').filter((x) => x);

			const quickPick = vscode.window.createQuickPick();
			quickPick.items = folders.map((folder) => ({ label: `${baseFolder}/${folder}` }));
			
			quickPick.onDidChangeSelection((selection) => {
				const folderPath = selection[0].label;

				exec(`cd ${folderPath} && git checkout -b ${branchName}`, (err, stdout, stderr) => {
					if (err) {
						console.log('err', err);
						return;
					}
				});

				exec(`cd ${folderPath} && git commit -m "branch created from ticket-connect" --allow-empty`, (err, stdout, stderr) => {
					if (err) {
						console.log('err', err);
						return;
					}

					console.log('stdout', stdout);

					exec('pwd', (err, stdout, stderr) => {
						console.log('pwd', stdout);
					});

					exec(`cd ${folderPath} && git push origin ${branchName}`, (err, stdout, stderr) => {
						if (err) {
							console.log('err', err);
							return;
						}
					});
				});
				
				
				const uri = vscode.Uri.file(folderPath);
				vscode.commands.executeCommand('vscode.openFolder', uri);
				quickPick.hide();
			});

			quickPick.onDidHide(() => quickPick.dispose());
			quickPick.show();
		});
	});
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
