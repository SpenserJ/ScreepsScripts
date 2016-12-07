let batchedMessages = [];

export const log = (type, payload = {}) => {
  const message = {
    type,
    payload,
    meta: {
      tick: Game.time,
    }
  };
  batchedMessages.push(message);
}

export const debug = (...message) => {
  console.log('Debug:', ...message);
};

export const logBatched = () => {
  if (batchedMessages.length === 0) { return; }
  console.log('COMMANDER:', JSON.stringify(batchedMessages));
  batchedMessages = [];
}
