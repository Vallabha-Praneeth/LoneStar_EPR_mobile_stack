// Mock for react-native-launch-arguments.
// In the Jest environment there is no native process info, so we return an
// empty arguments object. This means isE2E will be undefined (not 'true'),
// so secureTextEntry remains true — matching production behaviour in tests.
export const LaunchArguments = {
  value: <T extends Record<string, unknown>>(): T => ({} as T),
};
