// assembler.js translates assembly code into binary

// A-instruction sets address register (A-register) with a value

// C-instruction
// a bit (A/M selector bit)
// c bits (control bits c1-c6)
// d bits (destination bits)
// j bits (jump bits)

// 111a   c1 c2 c3 c4  c5 c6 d1 d2  d3 j1 j2 j3
// AMsel  zD nD zA nA  f  no A  D   M  lt eq gt (compare to 0)

// @2       0000 0000 0000 0010
// D=A      1110 1100 0001 0000
// @3       0000 0000 0000 0011
// D=D+A    1110 0000 1001 0000
// @0       0000 0000 0000 0000
// M=D      1111 0011 0000 1000

//          0000 0000 0000 0010
//          1110 1100 0001 0000
//          0000 0000 0000 0011
//          1110 0000 1001 0000
//          0000 0000 0000 0000
//          1110 0011 0000 1000

// Read the assembly code
// for simple A-instruction
// it's just "hey is there an @?"
// turn it into binary

// for C instructions (non-jump)
// D=D+A
// D=              D+A
// set dest bit    lookup operation in table
// if A/M selector (a bit) is on we use M (memory)
//      else use A-register

// @42      0000 0000 0010 1010
// D=A      1110 1100 0001 0000
// @0       0000 0000 0000 0000
// D;JGT    1110 0011 0000 0001

//          0000 0000 0010 1010
//          1110 1100 0001 0000
//          0000 0000 0000 0000
//          1110 0011 0000 0001

// output .hack file

// typical c-instruction has two parts
// 1. destination
// 2. computation

// a jump c-instruction has two different parts
// 1. subject of our comparison
// (which passes through the ALU)
// 2. condition (lt, eq, gt 0)

const lookupJump = {
    'JGT': '001',
    'JEQ': '010',
    'JGE': '011',
    'JLT': '100',
    'JNE': '101',
    'JLE': '110',
    'JMP': '111'
};

const lookupDest = {
    'M': '001',
    'D': '010',
    'MD': '011',
    'A': '100',
    'AM': '101',
    'AD': '110',
    'AMD': '111'
};

// 111a   c1 c2 c3 c4  c5 c6 d1 d2  d3 j1 j2 j3
// AMsel  zD nD zA nA  f  no A  D   M  lt eq gt (compare to 0)

const comps = {
    '0': '101010',
    '1': '111111',
    '-1': '111010',
    'D': '001100',
    'A': '110000',
    '!D': '001101',
    '!A': '110001',
    '-D': '001111',
    '-A': '110011',
    'D+1': '011111',
    'A+1': '110111',
    'D-1': '001110',
    'A-1': '110010',
    'D+A': '000010',
    'D-A': '010011',
    'A-D': '000111',
    'D&A': '000000',
    'D|A': '010101',

    'M': '110000',
    '!M': '110001',
    '-M': '110011',
    'M+1': '110111',
    'M-1': '110010',
    'D+M': '000010',
    'D-M': '010011',
    'M-D': '000111',
    'D&M': '000000',
    'D|M': '010101'
};

function lookupComps(query) {
    if (query.includes('M')) {
        return `1${comps[query]}`;
    }
    return `0${comps[query]}`;
};

const fs = require('node:fs');

const assembly = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') :
    `@42
    D=A
    @0 
    D;JGT`;

function assemble(assembly) {
    const lines = assembly.split('\n').map(line => line.trim());

    const binary = [];

    lines.forEach(line => {
        // deal with A-instructions
        if (line[0] === '@') {
            const value = Number(line.slice(1));
            const str = value.toString(2).padStart(16, 0);
            binary.push(str);
        }
        //deal with C-instructions
        // 111

        let str = '111';
        if (line.includes('=')) {
            // typical c-instruction (ALU operation)
            const [dest, operation] = line.split('=');

            str = str + lookupComps(operation);

            str = str + lookupDest[dest];

            // no jump
            str = str + '000';

            binary.push(str);
        }

        if (line.includes(';')) {
            const [op, jump] = line.split(';');

            str = str + lookupComps(op);

            // dest
            str = str + '000';

            str = str + lookupJump[jump];

            binary.push(str);
        }
    });
    return binary.join('\n');
}

const outFileName = process.argv[2] ? process.argv[2].split('.')[0] + '.hack' : 'temp.hack';
const binary = assemble(assembly);
fs.writeFileSync(outFileName, binary, 'utf8');

// TODO:
// 1. handle comments
// 2. add symbol handling logic
