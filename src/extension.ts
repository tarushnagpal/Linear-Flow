// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LinearIssueProvider } from './ui/TreeDataProvider';
import { getWebviewContent } from './ui/TicketDetailWebView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('ticket-connect.inputLinearApiKey', async () => {
		const input = await vscode.window.showInputBox({
			placeHolder: 'lin_api_*',
			prompt: 'Enter Linear API Key',
		});
		const linearIssueProvider = new LinearIssueProvider(input!);
		console.log('vefore');
		await linearIssueProvider.linear.init();
		const x = vscode.window.registerTreeDataProvider('linearIssues', linearIssueProvider);
		console.log('x', x);
	});

	context.subscriptions.push(disposable, vscode.commands.registerCommand('ticket-connect.showTicket', () => {
		// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
		  'catCoding', // Identifies the type of the webview. Used internally
		  'Cat Coding', // Title of the panel displayed to the user
		  vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
		  {} // Webview options. More on these later.
		);
		// panel.webview.html = getWebviewContent();
	  }), vscode.commands.registerCommand('ticket-connect.openTicketInEditor', async () => {
		// let uri = vscode.Uri.file('');
		// let success = await vscode.commands.executeCommand('vscode.openFolder', uri);
	  }));
}

// This method is called when your extension is deactivated
export function deactivate() {}
