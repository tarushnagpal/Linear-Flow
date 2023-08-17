import { Comment, Issue, WorkflowState } from "@linear/sdk";
import { marked } from "marked";

export function getWebviewContent(issue: Issue, comments: Comment[], state?: WorkflowState) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Details</title>
        <script>
            function openInEditor() {
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    command: 'openineditor'
                })
            }
        </script>
    </head>
    <body>
        <div style="height: 100vh; width: 85vw; display: flex; flex-direction: column; align-items: space-between; padding: 10% 5%; border: 1px #cccccc; background: #333344;" id="container">
            <div style="display: flex; flex-direction: column; background-color:rgba(25, 26, 45, 0.8); box-shadow:0px 0px 3px 1px #444; padding: 20px; border-radius: 5px">
                <div style="color:rgb(238, 239, 252);font-size: 22px;font-weight: 500;margin-bottom: 10px; display: flex; flex-direction: row; align-items: flex-end">
                    <div> ${issue.title}</div> <div style="font-weight:300; font-size: 18px;margin-left: 5px;">${issue.branchName}</div>
                </div>
                ${state && `<div style="display:flex; flex-direction:row; align-items: flex-end"><div style="height:16px;width:16px;border-radius:100%;background-color:${state.color}; margin-right: 5px;"></div><div>${state.name}</div></div>`}
                <div style="color:rgb(210, 211, 224);font-size: 15px; margin-bottom: 10px;"> ${issue.description ? marked.parse(issue.description) : ''} </div>
                ${comments.length > 0 ? '<div style="font-size: 14px; text-decoration:underline;">Comments</div>' : ''}
                ${comments.map(c => {
                    return (`<div style="font-size: 14px;">${
                        marked.parse(c.body)
                    }</div>`);
                })}
            </div>
            <div onclick="openInEditor()" style="color:rgb(210,211,224); font-size: 15px; margin-top: 20px;">
                <u>Open in editor</u>
            </div>
        </div>
    </body>
    </html>`;
}