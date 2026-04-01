/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.StatelangValidator;
    const checks = {
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
}
//# sourceMappingURL=statelang-validator.js.map