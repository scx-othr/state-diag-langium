import { Model, Statemachine, State, Transition, Action } from 'statelang-language';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './util.js';

/* Mapping interner Typnamen zu Java-Typen 
const typeMap = new Map<string, string>([
    ['Decimal', 'Double'],
    ['String', 'String'],
    ['Boolean', 'Boolean'],
    ['Integer', 'Integer']
]);

export function generateCode(model: Model, filePath: string, destination: string | undefined): string {
    if (!destination) destination = 'out';
    if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });

    for(var i = 0; i < model.statemachine.length; i++){
        const stm = model.statemachine[i];
        const code = generateStateMachineInterfaces(stm);
        const fileName = `${stm.name}.java`;
        const fileOut = path.join(destination, fileName);
        fs.writeFileSync(fileOut, code, 'utf-8');
        console.log(`Generated: ${fileOut}`);
    }

    return destination;
}
export function generateStateMachineInterfaces(stm: Statemachine): string {
    var result = '';
    const className = stm.name;
    var statearr = stm.states;
    const transitionarr = stm.transitions;

    
    for(var i = 0; i < stm.states.length; i++){
        var state = statearr[i];
        var stateName = state.name; 
        const ifaceName = capitalize(stateName);
        const implName = '${ifaceName}Impl';
        const outgoing = stm.transitions.filter(t => t.source.ref?.name === stateName);
        result += `public interface ${ifaceName} {\n`;
        if (state.entryAction) result += `    void onEntry();\n`;
        if (state.doAction) result += `    void onDo();\n`;
        if (state.exitAction) result += `    void onExit();\n`;
        for (let j = 0; j < outgoing.length; j++) {
            const t = outgoing[j];
            if (t.event) {
                result += `    void on${capitalize(t.event)}();\n`;
            }
        
        result += '}\n\n';
       
    } result += "public interface " + ifaceName + " {\n";
       result += `public class ${implName} implements ${ifaceName} {\n`;


        if (state.entryAction) result += `    @Override\n    public void onEntry() {\n        // TODO: Entry Action\n    }\n`;
        if (state.doAction) result += `    @Override\n    public void onDo() {\n        // TODO: Do Action\n    }\n`;
        if (state.exitAction) result += `    @Override\n    public void onExit() {\n        // TODO: Exit Action\n    }\n`;
        for (let j = 0; j < outgoing.length; j++) {
            const t = outgoing[j];
            if (t.event) {
                result += `    @Override\n    public void on${capitalize(t.event)}() {\n        // TODO: Transition Action\n    }\n`;
            }
        }
        result += '}\n\n';
    }

    return result;
}

export function getActionCode(action?: Action): string {

    if (!action?.code){
        return '';
    } else{
        return action.code.replace(/^["']|["']$/g, '');
    }
}

function capitalize(word?: string): string {
    if (!word || word.length == 0) {
        return ''; }
    var anfang = word.charAt(0).toUpperCase
    var rest = word.slice(1);
    word = anfang+rest;
    return word;

}
    */
