import chalk from 'chalk';

export const logger = {
    info: (msg) => console.log(chalk.cyan('ℹ ') + msg),
    success: (msg) => console.log(chalk.green('✅ ') + msg),
    warn: (msg) => console.log(chalk.yellow('⚠️  ') + msg),
    error: (msg) => console.log(chalk.red('❌ ') + msg),
    file: (msg) => console.log(chalk.gray('  📄 ') + msg),
    section: (msg) => console.log('\n' + chalk.bold.magenta('🔱 ' + msg)),
    dryRun: (msg) => console.log(chalk.blue('  [DRY-RUN] ') + msg),
    matched: (msg) => console.log(chalk.green('  ✅ ') + msg),
    mismatch: (msg) => console.log(chalk.red('  ❌ ') + msg),
    missing: (msg) => console.log(chalk.yellow('  ⚠️  ') + msg),
};
