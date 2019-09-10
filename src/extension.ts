import * as vscode from 'vscode';
import { getArgs } from './getArgs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.debugFlags', getArgs);
    context.subscriptions.push(disposable);
}

export function deactivate() { }
