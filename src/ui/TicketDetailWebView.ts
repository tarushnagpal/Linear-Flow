import { Comment, Issue } from "@linear/sdk";
import { marked } from "marked";

export function getWebviewContent(issue: Issue, comments: Comment[]) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Details</title>
        <script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.umd.min.js"></script>
    </head>
    <body>
        <div style="height: 100vh; width: 85vw; display: flex; flex-direction: column; align-items: space-between; background-color:rgb(25, 26, 35); padding: 10% 5%;" id="container">
            <div>
                <div style="color:rgb(238, 239, 252);font-size: 22px;font-weight: 500;margin-bottom: 10px;"> ${issue.title} </div>
                <div style="color:rgb(210, 211, 224);font-size: 15px; margin-bottom: 10px;"> ${issue.description ? marked.parse(issue.description) : ''} </div>
                ${comments.length > 0 ? '<div style="font-size: 14px; text-decoration:underline;">Comments</div>' : ''}
                ${comments.map(c => {
                    return (`<div style="font-size: 14px;">${
                        marked.parse(c.body)
                    }</div>`);
                })}
            </div>
            <div><u>Open in editor</u></div>
        </div>
    </body>
    </html>`;
}