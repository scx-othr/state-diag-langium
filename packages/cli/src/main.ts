import type { Model } from 'statelang-language';
import { createStatelangServices, StatelangLanguageMetaData } from 'statelang-language';
import chalk from 'chalk';
import { Command } from 'commander';
import { extractAstNode } from './util.js';
import { NodeFileSystem } from 'langium/node';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateCode } from 'statelang-language';

// CommonJS-kompatibles __dirname
const __dirname = path.resolve();

async function generateAction(source: string, destination: string): Promise<void> {
    const services = createStatelangServices(NodeFileSystem).Statelang;
    const model = await extractAstNode<Model>(source, services);

    const outputDir = generateCode(model, source, destination);
    console.log(chalk.green(`Code generated successfully in: ${outputDir}`));
}

async function main() {
    const packagePath = path.resolve(__dirname, '../../package.json');   
    const packageContent = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
    const program = new Command();
    program.version(packageContent.version);

    const fileExtensions = StatelangLanguageMetaData.fileExtensions.join(', ');

    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<destination>', 'destination directory')
        .description('Generates code for a provided source file.')
        .action(generateAction);

    program.parse(process.argv);
}

// main ausführen
main().catch(err => {
    console.error(chalk.red('Error:'), err);
    process.exit(1);
});
