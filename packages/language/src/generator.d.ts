import { Model, Statemachine, Action } from 'statelang-language';
export declare function generateCode(model: Model, filePath: string, destination: string | undefined): string;
export declare function generateStateMachineInterfaces(stm: Statemachine): string;
export declare function getActionCode(action?: Action): string;
