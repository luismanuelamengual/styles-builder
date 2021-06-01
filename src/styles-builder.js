import arg from 'arg';
import fs from 'fs-extra';
import path from 'path';
import sass from 'node-sass';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--watch': Boolean,
            '--src': String,
            '--dest': String,
            '--type': String,
            '-w': '--watch',
            '-s': '--src',
            '-d': '--dest',
            '-t': '--type'
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    const watch = args['--watch'] || false;
    const source = args['--src'] || process.cwd();
    const destination = args['--dest'] || source;
    const type = args['--type'] || 'compressed';
    return { watch, source, destination, type };
}

function transformSassFiles(file, options, pattern) {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
        fs.readdirSync(file).forEach((subDirectory) => {
            const subDirectoryToSearch = path.resolve(file, subDirectory);
            transformSassFiles(subDirectoryToSearch, options, pattern);
        });
    } else if (stat.isFile() && file.endsWith(pattern)) {
        console.log(`Reading file "${file}" ..`);
        try {
            const srcDirectory = options.source;
            const distDirectory = options.destination;
            const outputFile = path.resolve(__dirname, distDirectory,`${file.replace(`/${srcDirectory}/`,`/${distDirectory}/`)}.js`);
            const result = sass.renderSync({file: file, outputStyle: options.type});
            if (!result.error) {
                const content = `const styles = \`${result.css.toString()}\`; export default styles;`
                fs.outputFileSync(outputFile, content);
                console.log(`Successfully created file "${outputFile}" ..`);
            }
        } catch (e) {
            console.log(`Error creating file "${outputFile}" ..`);
        }
    }
}

export function stylesBuilder(args) {
    console.log('STYLES BUILDER !!');
    let options = parseArgumentsIntoOptions(args);
    if (options.watch) {
        console.log('WATCH !!');
    } else {
        transformSassFiles(options.source, options, ".scss");
    }
}
