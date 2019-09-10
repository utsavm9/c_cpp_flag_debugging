import * as vscode from 'vscode';

export async function getArgs() {

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
        args[index] = '"' + args[index].replace(quote, '\\\\\\"') + '"';
    }
    const argsLine = args.join(", ");

    //Replacing the args in launch.json
    vscode.workspace.findFiles('.vscode/launch.json').then(files => {

        vscode.workspace.openTextDocument(files[0]).then(document => {

            const launchText = document.getText();
            const args = /("args"\s*:\s*\[).*(\])/g;
            let split = launchText.split(args);
            let lineNumber = (split.length <= 1) ? -1 : split[0].split(/\n/g).length;
            let argsLine = document.lineAt(lineNumber - 1);

            let rangeToEdit = argsLine.range;
            let modifiedArgs = argsLine.text.replace(args, '$1"' + quickPicked + '"$2');

            let wEdit = new vscode.WorkspaceEdit();
            wEdit.replace(document.uri, rangeToEdit, modifiedArgs);
            let fileEdit = vscode.workspace.applyEdit(wEdit).then(_ => {
                let cppTools = vscode.extensions.getExtension('ms-vscode.cpptools');

                if (cppTools && cppTools.isActive === false) {
                    cppTools.activate().then(function () {
                        vscode.commands.executeCommand('C_Cpp.BuildAndDebugActiveFile');
                    }, function () {
                        console.log("Extension failed to load.");
                    });
                } else {
                    vscode.commands.executeCommand('C_Cpp.BuildAndDebugActiveFile');
                }
            });

        });
    });
}