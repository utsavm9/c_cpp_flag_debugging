import * as vscode from 'vscode';

export async function getArgs() {

    //Replacing the args in launch.json
    vscode.workspace.findFiles('.vscode/launch.json').then(async files => {

        //Ensuring the file exists beforehand
        if (files.length < 1) {
            vscode.window.showWarningMessage('A launch.json does not already exist. Create one now or use "Debug: Open launch.json" in the command palette later. Then try again to debug with arguments.');
            vscode.commands.executeCommand('debug.addConfiguration');
            return;
        }

        //Getting flags
        const quickPicked = await vscode.window.showInputBox({
            prompt: "Enter flags to debug your program with"
        });

        //Converting to array of arguments
        let args: string[];
        if (quickPicked) {
            args = quickPicked.split(' ');
        } else {
            return;
        }

        //Processing each argument for quotes
        for (let index in args) {
            const quote = /\"/g;
            args[index] = `"${args[index].replace(quote, '\\\\\\"')}"`;
        }
        const argsJSON = args.join(", ");


        //Replacing in launch.json
        vscode.workspace.openTextDocument(files[0]).then(async launchJSON => {

            //Saving the state of file for restore.
            if (launchJSON.isDirty) {
                await launchJSON.save();
            }

            //Removing all current args property and adding new ones
            const args = /"args"\s*:\s*\[.*\]\s*,/g;
            const nameProp = /(([\t\ ]*)"name"\s*:)/g;
            let argsDoc = launchJSON.getText().replace(args, '').replace(nameProp, `$2"args": [${argsJSON}],\n$1`);

            let wEdit = new vscode.WorkspaceEdit();
            wEdit.replace(launchJSON.uri, launchJSON.validateRange(new vscode.Range(0, 0, Infinity, Infinity)), argsDoc);

            //Applying the edit
            vscode.workspace.applyEdit(wEdit).then(async () => {
                let cppTools = vscode.extensions.getExtension('ms-vscode.cpptools');

                if (cppTools && cppTools.isActive === false) {
                    cppTools.activate().then(async () => {
                        await vscode.commands.executeCommand('C_Cpp.BuildAndDebugActiveFile').then();
                    }, reason => {
                        vscode.window.showInformationMessage("Unable to launch Microsoft C/C++ Debug Tools extension. Is it installed?", reason);
                    });
                } else {
                    await vscode.commands.executeCommand('C_Cpp.BuildAndDebugActiveFile');
                }
            });

        }, reason => {
            vscode.window.showInformationMessage("Unable to open launch.json.", reason);
        });
    }, reason => {
        vscode.window.showInformationMessage("Unable to search for launch.json.", reason);
    });
}
