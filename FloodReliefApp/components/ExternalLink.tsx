import { Linking, TouchableOpacity } from 'react-native';
import { type ComponentProps } from 'react';
import { openBrowserAsync } from 'expo-web-browser';
import { Platform } from 'react-native';

type Props = ComponentProps<typeof TouchableOpacity> & { href: string };

export function ExternalLink({ href, children, ...rest }: Props) {
  return (
    <TouchableOpacity
      {...rest}
      onPress={async () => {
        if (Platform.OS !== 'web') {
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        } else {
          // On web, use regular linking
          Linking.openURL(href);
        }
      }}
    >
      {children}
    </TouchableOpacity>
  );
}
