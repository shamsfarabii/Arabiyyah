import { Linking } from 'react-native';

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Could not open link: ${detail}`, { cause: error });
  }
}
