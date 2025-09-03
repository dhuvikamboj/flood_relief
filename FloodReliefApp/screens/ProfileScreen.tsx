import { StyleSheet, Button, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { state, logout, updateProfile } = useAuth();
  const navigation = useNavigation();

  const user = state.user;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || '');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setEmergencyContact(user?.emergency_contact || '');
  }, [user]);

  useEffect(() => {
    if (!state.isAuthenticated) {
      // redirect to login if not authenticated
      navigation.navigate('Login' as never);
    }
  }, [state.isAuthenticated, navigation]);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will automatically switch to login screen due to auth state change
    } catch (error) {
      // Handle logout error if needed
    }
  };

  if (state.loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#B0B0B0', dark: '#2D2D2D' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="person.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <ThemedText>Manage your profile and account settings.</ThemedText>
      {state.isAuthenticated ? (
        <ThemedView style={styles.authContainer}>
          <ThemedText>Welcome, {state.user?.email}</ThemedText>
          <Button title="Logout" onPress={handleLogout} />

          {!editing ? (
            <View style={{ marginTop: 12 }}>
              <Button title="Edit Profile" onPress={() => setEditing(true)} />
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              <TextInput value={name} onChangeText={setName} placeholder="Name" style={styles.input} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" style={styles.input} />
              <TextInput value={address} onChangeText={setAddress} placeholder="Address" style={styles.input} />
              <TextInput value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Emergency Contact" style={styles.input} />
              <Button
                title="Save"
                onPress={async () => {
                  try {
                    await updateProfile({ name, phone, address, emergency_contact: emergencyContact });
                    setEditing(false);
                  } catch (err) {
                    // handle error (toast, alert)
                  }
                }}
              />
              <Button title="Cancel" onPress={() => setEditing(false)} />
            </View>
          )}
        </ThemedView>
      ) : (
        <ThemedText>Please log in to access your profile.</ThemedText>
      )}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Personal Information</ThemedText>
        <ThemedText>
          Update your contact details and emergency information.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Notifications</ThemedText>
        <ThemedText>
          Configure alerts for flood warnings and updates.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Account Settings</ThemedText>
        <ThemedText>
          Change password, privacy settings, and more.
        </ThemedText>
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
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  authContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
