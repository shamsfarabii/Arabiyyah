export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AppAlertButton = {
  text: string;
  onPress?: () => void;
  style?: AppAlertButtonStyle;
};

export type AppAlertRequest = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
};

type AppAlertListener = (request: AppAlertRequest) => void;

let listener: AppAlertListener | null = null;

export function registerAppAlertHandler(next: AppAlertListener | null): void {
  listener = next;
}

/** Drop-in replacement for `Alert.alert` with app-themed dialogs. */
export function appAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
): void {
  const resolvedButtons = buttons?.length ? buttons : [{ text: 'OK' }];
  listener?.({ title, message, buttons: resolvedButtons });
}
