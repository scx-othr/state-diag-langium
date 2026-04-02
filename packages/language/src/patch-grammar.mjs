/**
 * Post-processing patch for the Langium-generated statelang.tmLanguage.json.
 * Run automatically after `langium generate` via the langium:generate script.
 * Idempotent: safe to run multiple times.
 *
 * Adds custom patterns to the repository and includes them in the top-level
 * patterns list, before the generic keyword rule.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const grammarPath = join(__dir, '..', 'syntaxes', 'statelang.tmLanguage.json');

const grammar = JSON.parse(readFileSync(grammarPath, 'utf8'));
if (!grammar.repository) grammar.repository = {};

// ── Repository entries ────────────────────────────────────────────────────────

grammar.repository['embedded-java'] = {
    name: 'meta.embedded.block.java.statelang',
    begin: '\\bimpl\\s+\\bjava\\b\\s*<<',
    beginCaptures: { '0': { name: 'keyword.control.statelang' } },
    end: '>>',
    endCaptures: { '0': { name: 'punctuation.definition.tag.statelang' } },
    contentName: 'source.java',
    patterns: [{ include: 'source.java' }]
};

grammar.repository['state-declarations'] = {
    patterns: [
        // `initial <Name>` — initial state target reference
        {
            match: '(?<=\\binitial\\s{1,20})([_a-zA-Z][\\w_]*)',
            captures: { '1': { name: 'entity.name.type.state.initial.statelang' } }
        },
        // `final state <Name>` — final state declaration
        {
            match: '(?<=\\bfinal\\s{1,20}state\\s{1,20})([_a-zA-Z][\\w_]*)',
            captures: { '1': { name: 'entity.name.type.state.final.statelang' } }
        },
        // `state <Name>` — normal state declaration
        {
            match: '(?<=\\bstate\\s{1,20})([_a-zA-Z][\\w_]*)',
            captures: { '1': { name: 'entity.name.type.state.statelang' } }
        }
    ]
};

grammar.repository['state-references'] = {
    patterns: [
        // Source state before `->`
        {
            match: '([_a-zA-Z][\\w_]*)(?=\\s*->)',
            captures: { '1': { name: 'entity.name.type.state.reference.statelang' } }
        },
        // Target state after `->`
        {
            match: '(?<=->)\\s*([_a-zA-Z][\\w_]*)',
            captures: { '1': { name: 'entity.name.type.state.reference.statelang' } }
        }
    ]
};

// ── Top-level patterns: inject before keyword rule ────────────────────────────

const INCLUDE_KEYS = ['embedded-java', 'state-declarations', 'state-references'];

// Remove any existing includes for these keys (idempotency)
grammar.patterns = grammar.patterns.filter(
    p => !INCLUDE_KEYS.includes(p.include?.replace('#', ''))
);

// Find index of the keyword rule, insert before it
const kwIndex = grammar.patterns.findIndex(p => p.name === 'keyword.control.statelang');
const insertAt = kwIndex >= 0 ? kwIndex : 0;
grammar.patterns.splice(insertAt, 0, ...INCLUDE_KEYS.map(k => ({ include: `#${k}` })));

// ── Write out ─────────────────────────────────────────────────────────────────

writeFileSync(grammarPath, JSON.stringify(grammar, null, 2), 'utf8');
console.log('patch-grammar: statelang.tmLanguage.json patched successfully.');
