import { Model, Statemachine, Action, Expression, StringExpression, BinaryExpression, Transition } from 'statelang-language';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface GenerationContext {
    name: string;
    variables: any[];
    states: any[];
    actions: Map<string, Action | undefined>;
    transitions: any[];
    abstrMethods:Map<string, string>;
    initial: any;
    eventSignatures: Map<string, EventSignature>;

}
interface EventSignature {
    name: string;
    parameters: { name: string; type: string }[];
}

const typeMap = new Map<string, string>([
    ['int', 'int'],
    ['long', 'long'],
    ['float', 'float'],
    ['boolean', 'boolean'],
    ['char', 'char'],
    ['string', 'String']
]);
export function generateCode(model: Model, filePath: string, destination?: string): string {
    if (!destination) destination = 'out';
    if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });

    for(var i = 0; i < model.statemachine.length; i++){

        const stm = model.statemachine[i];
        generateStateMachine(stm, destination);
    }

    return destination;
}

// Statemachine
function generateStateMachine(stm: Statemachine, destination: string,): void {

 
    const ctx = createGenerationContext(stm);
    writeContextClass(ctx, destination);
    writeAbstractState(ctx, destination);
    writeConcreteStates(ctx, destination);
}

// Kontext
function createGenerationContext(stm: Statemachine): GenerationContext {
        const ctx: GenerationContext = {
        name: capitalize(stm.name),
        variables: stm.variables,
        states: stm.states,
        transitions: stm.transitions,
        initial: stm.initial,
        actions: new Map(),
        eventSignatures: new Map(),
        abstrMethods: new Map,
    };

 for (const t of stm.transitions) {
        if (t.event) {
            const eventName = t.event.name;
            if (!ctx.eventSignatures.has(eventName)) {
                ctx.eventSignatures.set(eventName, {
                    name: eventName,
                    parameters: t.event.params || []
                });
            }
            if (!ctx.actions.has(eventName)) {
                ctx.actions.set(eventName, t.action);
            }
        }
    }
 for(var i = 0; i < stm.states.length; i++){
        const state = stm.states[i];       
        if (state.entryAction) addMethodSet(ctx, "onEntry", state.entryAction);
        if (state.exitAction) addMethodSet(ctx, "onExit", state.exitAction);
    }

    ctx.actions.forEach((action, name) => {
        addMethodToContext(ctx, name, action);
    });

    return ctx;
}

//  Writer (I/O) 
function writeContextClass(ctx: GenerationContext, destination: string): void {
    const code = buildContextClass(ctx);
    writeJava(destination, `${ctx.name}.java`, code);
}

function writeAbstractState(ctx: GenerationContext, destination: string): void {
    const code = buildAbstractState(ctx);
    writeJava(destination, `State.java`, code);
}

function writeConcreteStates(ctx: GenerationContext, destination: string): void {
        for (let i = 0; i < ctx.states.length; i++) {
        const state = ctx.states[i];
        const code = buildConcreteState(ctx, state);
        writeJava(destination, `${capitalize(state.name)}.java`, code);
    }
}

function writeJava(dir: string, file: string, content: string) {
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
}
 
// Code-Erzeugung

function buildContextClass(ctx: GenerationContext): string {
const abClName = capitalize(ctx.name);

let contCl = `public class ${abClName} {\n`;

// Variablen
for (const v of ctx.variables) {
    if (v.type) {
        let value = '';

        if (v.value) {
            value = getExpression(v.value);
        }

        const javaType = typeMap.get(v.type.toLowerCase());

        contCl += `    protected ${javaType} ${v.name}`;

        if (value) {
            contCl += ` = ${value};\n`;
        } else {
            contCl += `;\n`;
        }
}

    contCl += `    private State currentState;\n\n`;

    const constrParam = ctx.variables
    .filter(v => v.type && !v.value)
    .map(v => `${typeMap.get(v.type.toLowerCase())} ${v.name}`)
    .join(', ');


    contCl += `    public ${abClName}(${constrParam}) {\n`;
       for (const v of ctx.variables) {
    if (v.type && !v.value) {
        contCl += `        this.${v.name} = ${v.name};\n`;
    }
}
    const startState = ctx.initial?.target?.ref?.name || ctx.states[0]?.name;
    if (startState) {
        contCl += `        this.currentState = new ${capitalize(startState)}(this);\n`;
    }
    contCl += `    }\n\n`;

    contCl += `    void setState(State state) {
        this.currentState = state;
    }\n`;
    contCl += `  State getState() {
        return currentState;
    }\n`;


    //Getter/Setter
        for (const v of ctx.variables) {
            if(v.type){
            const Cap = capitalize(v.name);
            const javaType = typeMap.get(v.type.toLowerCase());
            contCl += `    public ${javaType} get${capitalize(v.name)}() {\n      return ${v.name}; \n}\n`;
            contCl += `    public void set${capitalize(v.name)} (${javaType} ${v.name}) {\n      this.${v.name} = ${v.name}; \n}\n`; 
            contCl += `    public void increment${Cap}() { this.${v.name}++; }\n`;
            contCl += `    public void decrement${Cap}() { this.${v.name}--; }\n`;
            }
        }       
        var statearr = ctx.states;
        for(var i = 0; i < ctx.states.length; i++){
            var state = statearr[i];
        if (state.entryAction) addMethodToContext(ctx, "onEntry", state.entryAction);
        if (state.exitAction) addMethodToContext(ctx, "onExit", state.exitAction);
        }


 for (const actionName of ctx.actions.keys()) {
    const sig = ctx.eventSignatures.get(actionName);
    
    if (actionName === "onEntry" || actionName === "onExit") {
        contCl += `    public void ${actionName}() {\n        currentState.${actionName}();\n    }\n`;
    } else {

        const triggerCall = `${actionName}`;
        if (sig && sig.parameters.length > 0) {
            contCl += `    public void ${actionName}(${Params(sig)}) {\n`;
            contCl += `        currentState.${triggerCall}(${Args(sig)});\n    }\n`;
        } else {
            contCl += `    public void ${actionName}() {\n        currentState.${triggerCall}();\n    }\n`;
        }
    }
}
}
    
    contCl += `}\n`;
    return contCl;
}

   function buildAbstractState(ctx: GenerationContext): string {
    const abClName = capitalize(ctx.name);

    let stateClass =
`public abstract class State {

    protected ${abClName} context;

    public State(${abClName} context) {
        this.context = context;
    }
`;
    stateClass += `    public void onEntry() { }\n`;
    stateClass += `    public void onExit() { }\n\n`;

    for (const [_,m] of ctx.abstrMethods) {
        if (!m.includes("onEntry") && !m.includes("onExit")) {
            stateClass += `    ${m}\n`;
        }
    }


    stateClass += `}\n`;
    return stateClass;
}

function buildConcreteState(ctx: GenerationContext, state: any): string {
    const ctxName = capitalize(ctx.name);
    const stateName = capitalize(state.name);

    const outgoing = ctx.transitions.filter(
        (t: Transition) => t.source.ref?.name === state.name
    );

    const transitionsByTrigger = new Map<string, Transition[]>();

    for (const t of outgoing) {
        const triggerName = t.event?.name ?? t.action?.name;
        
        if (!triggerName) continue;

        if (!transitionsByTrigger.has(triggerName)) {
            transitionsByTrigger.set(triggerName, []);
        }
        transitionsByTrigger.get(triggerName)!.push(t);
    }

    let code = `public class ${stateName} extends State {\n\n`;
    code += `    public ${stateName}(${ctxName} context) {\n`;
    code += `        super(context);\n`;
    code += `    }\n\n`;

    const buildMethod = (action: any, methodName: string) => {
        let mCode = "";
        if (action) {
            if (action.description) {
                const desc = action.description.replace(/^["']|["']$/g, '');
                mCode += `    /** @prompt ${desc} */\n`;
            }
            mCode += `    @Override\n`;
            mCode += `    public void ${methodName}() {\n`;
            mCode += generateBody(action);
            mCode += `    }\n\n`;
        }
        return mCode;
    };

    code += buildMethod(state.entryAction, "onEntry");
    code += buildMethod(state.exitAction, "onExit");

    for (const [triggerName, transitions] of transitionsByTrigger.entries()) {
        const sig = ctx.eventSignatures.get(triggerName);

        const actionWithDesc = transitions.find(t => t.action?.description)?.action;
        if (actionWithDesc?.description) {
            const desc = actionWithDesc.description.replace(/^["']|["']$/g, '');
            code += `    /** @prompt ${desc} */\n`;
        }

        code += `    @Override\n`;
        code += `    public void ${triggerName}(${Params(sig)}) {\n`;

        transitions.forEach((t, i) => {
            // Guard bestimmen
            let guardExpr = 'true';
            if (t.guard?.condition) {
                guardExpr = getExpression(t.guard.condition);
            }

            if (i === 0) {
                code += `        if (${guardExpr}) {\n`;
            } else {
                code += `        else if (${guardExpr}) {\n`;
            }

            if (t.action) {
                code += generateBody(t.action);
            }

            // State-Übergang
            const targetName = t.target.ref?.name;
            code +=
                `            this.onExit();\n` +
                `            context.setState(new ${capitalize(targetName)}(context));\n` +
                `            context.getState().onEntry();\n` +
                `        }\n`;
        });
        code += `}\n`;

    }

    code += `}\n`;
    return code;
}


// Hilfsfunktionen


function addMethodSet(
    ctx: GenerationContext,
    name: string,
    action?: Action
) {
    if (!ctx.actions.has(name)) {
        ctx.actions.set(name, action);
        const methodDef =
    `public void ${name}() {
        
    }
`;
        ctx.abstrMethods.set(name,methodDef);
    }
}

function addMethodToContext(
    ctx: GenerationContext,
    name: string,
    action?: Action
) {
    if (name === "onEntry" || name === "onExit") return;

    if (!ctx.actions.has(name)) {
        ctx.actions.set(name, action);
    }

    const sig = ctx.eventSignatures.get(name);

    let params = '';
    if (sig && sig.parameters.length > 0) {
        params = sig.parameters
            .map(p => `${typeMap.get(p.type) ?? p.type} ${p.name}`)
            .join(', ');
    }

    if (!ctx.abstrMethods.has(name)) {
        ctx.abstrMethods.set(
            name,
            `public void ${name}(${params}){};`
        );
    }
}


function Params(sig?: EventSignature): string {
    if (sig){
    return sig.parameters
        .map(p => `${typeMap.get(p.type) ?? p.type} ${p.name}`)
        .join(', ');
} else{
    return '';
}
}

function Args(sig?: EventSignature): string {
    if (sig && sig.parameters.length > 0){
    return sig.parameters.map(p => p.name).join(', ');
} else {
    return '';
}
}

function generateBody(action?: Action): string {
    if (!action) return `        // TODO: Implement function\n`;

    let result = '';

    if (action.description) {
        result +=
`         // generated start
        // generated end
`;
    }
 
    if (action.content) {
        const code = action.content?.replace('<<', '').replace('>>', '');
        if (code.length > 0) {
            result += code
                .split('\n')
                .map(line => `        ${line}`)
                .join('\n') + '\n';
        }
    } else if (!action.description) {
        result += `        // TODO: Implement function\n`;
    }

    return result;
}


export function getActionCode(action?: Action): string {
    if (!action?.content){
        return '';
    } else{
        return action.content.replace('<<', '').replace('>>', '');
    }
}

function getExpression(x?: Expression): string {
    if (!x) return "true";

    switch (x.$type) {
        case 'IntExpression':
        case 'FloatExpression':
        case 'BoolExpression':
            return `${(x as any).value}`;

        case 'BinaryExpression':
            const binExp = x as BinaryExpression;
            return `(${getExpression(binExp.left)} ${binExp.op} ${getExpression(binExp.right)})`;

        case 'ReferenceExpression':
            const refExp = x as any;
            return `context.get${capitalize(refExp.value)}()`;

        case 'StringExpression':
            return `"${(x as StringExpression).value}"`;

        default:
            console.log("Unbekannter Typ im Generator:", x.$type);
            return "true";
    }
}

function capitalize(word?: string): string {
    if (!word || word.length == 0) {
        return ''; }
    var anfang = word.charAt(0).toUpperCase();
    var rest = word.slice(1);
    word = anfang+rest;

    return word;
}
