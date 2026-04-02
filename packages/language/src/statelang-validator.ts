import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { State, Statemachine, StatelangAstType, Transition } from './generated/ast.js';
import type { StatelangServices } from './statelang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: StatelangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.StatelangValidator;
    const checks: ValidationChecks<StatelangAstType> = {
        Statemachine: [
            validator.checkStatemachineHasInitial,
            validator.checkStatemachineHasStates,
            validator.checkUniqueStateNames,
            validator.checkUniqueVariableNames,
            validator.checkUnreachableStates,
        ],
        State: [
            validator.checkFinalStateHasNoExitAction,
            validator.checkFinalStateHasNoOutgoingTransitions,
        ],
        Transition: [
            validator.checkTransitionSourceNotFinal,
            validator.checkDuplicateTransitionEvent,
        ],
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class StatelangValidator {

    /** A statemachine should declare an initial state. */
    checkStatemachineHasInitial(stm: Statemachine, accept: ValidationAcceptor): void {
        if (!stm.initial) {
            accept('warning', `Statemachine '${stm.name}' has no initial state declared.`, {
                node: stm, property: 'name'
            });
        }
    }

    /** A statemachine must have at least one state. */
    checkStatemachineHasStates(stm: Statemachine, accept: ValidationAcceptor): void {
        if (stm.states.length === 0) {
            accept('error', `Statemachine '${stm.name}' must define at least one state.`, {
                node: stm, property: 'name'
            });
        }
    }

    /** State names must be unique within a statemachine. */
    checkUniqueStateNames(stm: Statemachine, accept: ValidationAcceptor): void {
        const seen = new Set<string>();
        for (const state of stm.states) {
            if (seen.has(state.name)) {
                accept('error', `Duplicate state name '${state.name}'.`, {
                    node: state, property: 'name'
                });
            } else {
                seen.add(state.name);
            }
        }
    }

    /** Variable names must be unique within a statemachine. */
    checkUniqueVariableNames(stm: Statemachine, accept: ValidationAcceptor): void {
        const seen = new Set<string>();
        for (const v of stm.variables) {
            if (seen.has(v.name)) {
                accept('error', `Duplicate variable name '${v.name}'.`, {
                    node: v, property: 'name'
                });
            } else {
                seen.add(v.name);
            }
        }
    }

    /** Warn about states that are not reachable from the initial state. */
    checkUnreachableStates(stm: Statemachine, accept: ValidationAcceptor): void {
        if (!stm.initial?.target.ref) return;

        const reachable = new Set<string>();
        const queue: string[] = [stm.initial.target.ref.name];

        while (queue.length > 0) {
            const current = queue.pop()!;
            if (reachable.has(current)) continue;
            reachable.add(current);
            for (const t of stm.transitions) {
                if (t.source.ref?.name === current) {
                    const targetName = t.target.ref?.name;
                    if (targetName && !reachable.has(targetName)) {
                        queue.push(targetName);
                    }
                }
            }
        }

        for (const state of stm.states) {
            if (!reachable.has(state.name)) {
                accept('warning', `State '${state.name}' is unreachable from the initial state.`, {
                    node: state, property: 'name'
                });
            }
        }
    }

    /** Final states must not have an exit action — they are never left. */
    checkFinalStateHasNoExitAction(state: State, accept: ValidationAcceptor): void {
        if (state.final && state.exitAction) {
            accept('warning',
                `Final state '${state.name}' has an exit action, but final states are never left. The exit action will never be executed.`,
                { node: state, property: 'exitAction' }
            );
        }
    }

    /** Final states must not have outgoing transitions (checked at state level for clarity). */
    checkFinalStateHasNoOutgoingTransitions(state: State, accept: ValidationAcceptor): void {
        if (!state.final) return;
        const stm = state.$container;
        const outgoing = stm.transitions.filter(t => t.source.ref?.name === state.name);
        if (outgoing.length > 0) {
            accept('error',
                `Final state '${state.name}' must not have outgoing transitions.`,
                { node: state, property: 'name' }
            );
        }
    }

    /** Transitions must not originate from a final state. */
    checkTransitionSourceNotFinal(transition: Transition, accept: ValidationAcceptor): void {
        const source = transition.source.ref;
        if (source?.final) {
            accept('error',
                `Transition from final state '${source.name}' is not allowed. Final states cannot have outgoing transitions.`,
                { node: transition, property: 'source' }
            );
        }
    }

    /**
     * Within the same source state, two transitions with the same event name are
     * ambiguous (unless distinguished by a guard — in that case we only warn).
     */
    checkDuplicateTransitionEvent(transition: Transition, accept: ValidationAcceptor): void {
        const stm = transition.$container;
        const sourceName = transition.source.ref?.name;
        const eventName = transition.event?.name;
        if (!sourceName || !eventName) return;

        const siblings = stm.transitions.filter(
            t => t !== transition &&
                 t.source.ref?.name === sourceName &&
                 t.event?.name === eventName
        );

        if (siblings.length > 0) {
            const hasGuard = !!transition.guard || siblings.some(s => !!s.guard);
            if (hasGuard) {
                accept('hint',
                    `Multiple transitions from '${sourceName}' on event '${eventName}'. Ensure guards are mutually exclusive.`,
                    { node: transition, property: 'event' }
                );
            } else {
                accept('warning',
                    `Ambiguous transition: multiple transitions from '${sourceName}' on event '${eventName}' without guards.`,
                    { node: transition, property: 'event' }
                );
            }
        }
    }
}
