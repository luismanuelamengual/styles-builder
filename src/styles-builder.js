import arg from 'arg';
import fs from 'fs-extra';
import path from 'path';
import sass from 'node-sass';
import gaze from 'gaze';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--watch': Boolean,
            '--src': String,
            '--dist': String,
            '--type': String,
            '-w': '--watch',
            '-s': '--src',
            '-d': '--dist',
            '-t': '--type'
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    const watch = args['--watch'] || false;
    const source = args['--src'] || process.cwd();
    const destination = args['--dist'] || source;
    const type = args['--type'] || 'compressed';
    return { watch, source, destination, type };
}

function transformSassFiles(options, file) {
    file = file || options.source;
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
        fs.readdirSync(file).forEach((subDirectory) => {
            const subDirectoryToSearch = path.resolve(file, subDirectory);
            transformSassFiles(options, subDirectoryToSearch);
        });
    } else if (stat.isFile() && file.endsWith(".scss")) {
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
            console.log(e);
        }
    }
}

function watchSassFiles(options) {
    transformSassFiles(options);
    gaze(options.source + '/**/*.scss', function(err, watcher) {
        const watched = this.watched();
        this.on('changed', function(filepath) {
            transformSassFiles(options, filepath);
        });
        this.on('added', function(filepath) {
            transformSassFiles(options, filepath);
        });
    });
}

export function stylesBuilder(args) {
    console.log('---- STYLES BUILDER ----');
    let options = parseArgumentsIntoOptions(args);
    if (options.watch) {
        watchSassFiles(options);
    } else {
        transformSassFiles(options);
    }
}
