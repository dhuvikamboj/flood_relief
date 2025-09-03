import { StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, state } = useAuth();
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await register(email, password);
      Alert.alert('Success', 'Account created successfully!');
      // Navigation will automatically switch to main tabs due to auth state change
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#505050' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="person.badge.plus.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Sign Up</ThemedText>
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button
          title={state.loading ? 'Creating account...' : 'Sign Up'}
          onPress={handleSignup}
          disabled={state.loading}
        />
        <TouchableOpacity onPress={navigateToLogin}>
          <ThemedText style={styles.link}>
            Already have an account? Login
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
