import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'wabyloan.token';
const USER_KEY = 'wabyloan.user';

export async function saveSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function loadSession() {
  const [[, token], [, userRaw]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token) return { token: null, user: null };
  try {
    return { token, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return { token, user: null };
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
