let state = null;
const listeners = new Set();

export const initState = (initialState) => {
  state = initialState;
};

export const getState = () => state;

export const setState = (nextState) => {
  state = nextState;
  listeners.forEach((listener) => listener(state));
};

export const updateState = (updater) => {
  setState(updater(state));
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
