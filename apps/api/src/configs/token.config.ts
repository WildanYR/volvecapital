/* eslint-disable node/prefer-global/process */
export function TokenConfig() {
  return {
    token: {
      secret: process.env.SECRET,
    },
  };
}
