// AuthScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signUp, confirmSignUp, signIn } from './cognito';

type Mode = 'login' | 'register' | 'confirm';

interface Props {
  onLoginSuccess: (idToken: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(email, password);
      onLoginSuccess(result.IdToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password);
      setMode('confirm');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await confirmSignUp(email, code);
      setMode('login');
      setError('Account confirmed — please log in.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>HelaGovi</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' && 'Log in to your account'}
            {mode === 'register' && 'Create an account'}
            {mode === 'confirm' && 'Enter the confirmation code sent to your email'}
          </Text>

          {mode !== 'confirm' && (
            <>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#B4B2A9"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#B4B2A9"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}

          {mode === 'confirm' && (
            <>
              <Text style={styles.fieldLabel}>Confirmation code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter the 6-digit code"
                placeholderTextColor="#B4B2A9"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {mode === 'login' && (
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
            </TouchableOpacity>
          )}
          {mode === 'register' && (
            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
            </TouchableOpacity>
          )}
          {mode === 'confirm' && (
            <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Confirming...' : 'Confirm'}</Text>
            </TouchableOpacity>
          )}

          {mode === 'login' && (
            <TouchableOpacity onPress={() => { setMode('register'); setError(null); }}>
              <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
          )}
          {mode !== 'login' && (
            <TouchableOpacity onPress={() => { setMode('login'); setError(null); }}>
              <Text style={styles.link}>Back to login</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1EFE8' },
  container: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#173404', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#5F5E5A', textAlign: 'center', marginTop: 6, marginBottom: 28 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#2C2C2A', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D1C7',
  },
  error: { color: '#D85A30', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  link: { color: '#0F6E56', fontSize: 13, textAlign: 'center', marginTop: 16 },
});