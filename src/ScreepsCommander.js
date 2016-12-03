export const log = (type, payload = {}) => {
  // TODO: Set up batch processing
  console.log('COMMANDER:', JSON.stringify({
    type,
    payload,
    meta: {
      tick: Game.time,
    }
  }));
}

export const debug = (...message) => {
  console.log('Debug:', ...message);
};
