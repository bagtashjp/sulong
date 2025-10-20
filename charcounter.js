import { readdirSync, createReadStream, writeFileSync, appendFileSync} from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import process from 'process';

let filePaths = [];
const writePath = 'written.txt';
const excludedFolderNames = ['node_modules', '.git', '.wrangler', 'assets']; // example folders to skip

function listFilesRecursive(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (excludedFolderNames.includes(entry.name)) {
        console.log('\t🚫 Skipping folder:', fullPath);
        return; 
      }
      console.log('\t📁 Folder:', fullPath);
      listFilesRecursive(fullPath);
    } else if (entry.isFile()) {
      if (entry.name === 'written.txt') {
        return; 
      }
      console.log('\t📄 File:', fullPath);
      filePaths.push(fullPath);
    }
  });
}
//let rawCharCount = 0; // With lines and indents
//let wordCount = 0; // Split by whitespace
//let rawLineCount = 0; // Number of lines
//let lineCount = 0; // Non-empty lines
//let count = 0; // Character count
async function mainCounter() {
    listFilesRecursive(process.cwd());
    writeFileSync(writePath, "", "utf-8");
    
    console.log("Counting files now " + filePaths.length)
    for await (const filePath of filePaths) {
        appendFileSync(writePath, `\n--- File: ${filePath}---\n`, "utf-8");
        await processFile(filePath);
    }
    //console.log("Total lines (raw):", rawLineCount);
   // console.log("Total lines (minus empty):", lineCount);
    //console.log("Total 'developer' wordcount:", wordCount);
    //console.log("Total characters (with spaces):", rawCharCount);
    //console.log("Total characters (without indents and spaces):", count);
}

async function processFile(filePath) {
    const fileStream = createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    for await (const line of rl) {
        //wordCount += line.trim().split(/\s+/).length;
        if (line.trim().length > 0) {
          appendFileSync(writePath, line + "\n", "utf-8");
        }
        //rawLineCount++;
        //rawCharCount += line.length;
        //count += line.trim().length;
    }
}
(async() => await mainCounter())();