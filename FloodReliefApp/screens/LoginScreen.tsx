import { StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, state } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await login(email, password);
      Alert.alert('Success', 'Logged in successfully!');
      // Navigation will automatically switch to main tabs due to auth state change
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C0C0C0', dark: '#404040' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="lock.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Login</ThemedText>
      </ThemedView>
      <ThemedView style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title={state.loading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={state.loading}
        />
        <TouchableOpacity onPress={navigateToSignup}>
          <ThemedText style={styles.link}>
            Don't have an account? Sign Up
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  link: {
    textAlign: 'center',
    marginTop: 10,
  },
});
