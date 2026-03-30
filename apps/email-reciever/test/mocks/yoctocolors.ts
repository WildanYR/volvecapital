type ColorFormatter = (value: string) => string;

const passthrough: ColorFormatter = value => value;

const cliColor = {
  green: passthrough,
  bold: passthrough,
  blue: passthrough,
  red: passthrough,
  yellow: passthrough,
  magenta: passthrough,
  gray: passthrough,
};

export default cliColor;
