import type { ValidationChecks } from 'langium';
import type { StatelangAstType } from './generated/ast.js';
import type { StatelangServices } from './statelang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: StatelangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.StatelangValidator;
    const checks: ValidationChecks<StatelangAstType> = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        /*
        Element: validator.checkElement
        */
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class StatelangValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    /*
    checkElement(element: Element, accept: ValidationAcceptor): void {
        // Always accepts
    }
    */
}
