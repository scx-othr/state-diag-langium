# Semi-formal modeling for state charts
This repository includes the source code for a state chart modeling language based on VSCode and Langium. The modeling workflow consists of 3 steps:
1. Define a state chart using a textual modeling language in a dedicated text editor
2. Generate the state chart into intermediate Java representation (containing stubs with natural language instructions)
3. Use the MDELLMProcessor to convert the natural language instructions into Java source code fragments, which are woven into the code base.

This repository contains a sample project (GumballMachine). To verify the correctness of generation, this repository includes JUnit test cases, whose execution is referred to as optional step 4 below.

## Prerequisites
- Node.js
- Langium: Install via `npm i -g langium`
- MDELLMProcessor extension (for step 3): See https://github.com/tbuchmann/mdellmprocessor
- Test runner for Java extension (for step 4): https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-test

## Building and running this extension
Open the parent folder of this file in VSCode. Execute the following commands on the terminal:
- `npm install`
- `npm run build`
- Press F5 to start a VSCode instance with this extension loaded. From this instance, open the [runtime](runtime) directory of this folder.

## Step 1: Modeling
In the second VSCode instance, you may now open the file [GumballMachine.sdl](runtime/GumballMachine.sdl).  and modify it, while being assisted by syntax highlighting and code completion.

## Step 2: Generator
Right-click on the file file [GumballMachine.sdl](runtime/GumballMachine.sdl) in the VSCode runtime instance, and execute the action \emph{Generate Java code}. The intermediate generation result is stored in [src/gen](runtime/src/gen).

## Step 3: MDELLMProcessor
- Configure the MDELLMProcessor via the VSCode settings menu (`Ctrl+,`, search for "AI Server Settings"). See README.md of the modellmprocessor repository.
- Right-click on the [src/gen](runtime/src/gen) folder and select "Process Java Folder". VSCode notifications show the LLM-based generation process.

## Step 4: Verify the result with JUnit tests (optional)
For the Gumball example, we provide a JUnit test with two methods, one designed by the *state coverage* and one by the *transition coverage* criterion.
- From the second instance, open [src/test/GumballMachineTest.java](runtime/src/test/GumballMachineTest.java).
- If JUnit dependency problems are reported, open the *Testing* view from the left menu and Select *Enable Java Tests*, then *JUnit Jupiter*. The dependency is downloaded and the problems should disappear.
- Execute the test cases by clicking on the marker of the class declaration.