import type {
    Model,
    Statemachine,
    Expression,
    BinaryExpression,
    BoolExpression,
    FloatExpression,
    IntExpression,
    ReferenceExpression,
    StringExpression,
} from './generated/ast.js';

/**
 * Generates a PlantUML statechart string for all statemachines in the model.
 */
export function generatePlantUML(model: Model): string {
    return model.statemachine
        .map(stm => generateStatemachinePuml(stm))
        .join('\n\n');
}

function generateStatemachinePuml(stm: Statemachine): string {
    const lines: string[] = [];

    lines.push('@startuml');
    lines.push(`title ${stm.name}`);
    lines.push('hide empty description');
    lines.push('');

    // States (with optional entry/exit annotations)
    for (const state of stm.states) {
        if (state.final) {
            lines.push(`state ${state.name} <<end>>`);
            continue;
        }
        const hasAnnotations = state.entryAction || state.exitAction;
        if (hasAnnotations) {
            lines.push(`state ${state.name} {`);
            if (state.entryAction) {
                lines.push(`  ${state.name} : entry /`);
            }
            if (state.exitAction) {
                lines.push(`  ${state.name} : exit /`);
            }
            lines.push('}');
        } else {
            lines.push(`state ${state.name}`);
        }
    }

    lines.push('');

    // Initial pseudo-state arrow
    if (stm.initial) {
        const target = stm.initial.target.ref?.name;
        if (target) {
            let line = `[*] --> ${target}`;
            if (stm.initial.action) {
                line += ' : /';
            }
            lines.push(line);
        }
    }

    // Transitions
    for (const t of stm.transitions) {
        const source = t.source.ref?.name;
        const target = t.target.ref?.name;
        if (!source || !target) continue;

        const labelParts: string[] = [];

        if (t.event) {
            let eventStr = t.event.name;
            if (t.event.params.length > 0) {
                eventStr += `(${t.event.params.map(p => p.name).join(', ')})`;
            }
            labelParts.push(eventStr);
        }

        if (t.guard) {
            labelParts.push(`[${expressionToString(t.guard.condition)}]`);
        }

        // if (t.action) {
        //     labelParts.push('/');
        // }

        const label = labelParts.join(' ');
        lines.push(label
            ? `${source} --> ${target} : ${label}`
            : `${source} --> ${target}`
        );
    }

    lines.push('');
    lines.push('@enduml');

    return lines.join('\n');
}

function expressionToString(expr: Expression): string {
    switch (expr.$type) {
        case 'BinaryExpression': {
            const b = expr as BinaryExpression;
            return `${expressionToString(b.left)} ${b.op} ${expressionToString(b.right)}`;
        }
        case 'BoolExpression':
            return String((expr as BoolExpression).value);
        case 'IntExpression':
            return String((expr as IntExpression).value);
        case 'FloatExpression':
            return String((expr as FloatExpression).value);
        case 'StringExpression':
            return (expr as StringExpression).value;
        case 'ReferenceExpression':
            return (expr as ReferenceExpression).value;
        default:
            return '?';
    }
}
