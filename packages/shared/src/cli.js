function parseArgs(argv = process.argv.slice(2)) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith("--")) {
      acc._.push(arg);
      return acc;
    }

    const [rawKey, rawValue] = arg.slice(2).split("=");
    acc[rawKey] = rawValue === undefined ? true : rawValue;
    return acc;
  }, { _: [] });
}

module.exports = {
  parseArgs
};
