import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

export default function Login() {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useI18n();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login({ data: { email, password } });
      router.replace('/(main)/(tabs)/play');
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle({ data: { token: 'demo_google_token', provider: 'google' } });
      router.replace('/(main)/(tabs)/play');
    } catch (e: any) {
      setError(e?.message || 'Google login failed');
    }
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithApple({ data: { token: 'demo_apple_token', provider: 'apple' } });
      router.replace('/(main)/(tabs)/play');
    } catch (e: any) {
      setError(e?.message || 'Apple login failed');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>OneTap</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Play fast, play hard.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="player@onetap.gg"
          />
          
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.mainBtn}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            title="Continue with Google"
            variant="secondary"
            onPress={handleGoogleLogin}
            style={styles.socialBtn}
            icon={<FontAwesome name="google" size={18} color={colors.secondaryForeground} />}
          />
          
          {Platform.OS === 'ios' && (
            <Button
              title="Continue with Apple"
              variant="secondary"
              onPress={handleAppleLogin}
              style={styles.socialBtn}
              icon={<FontAwesome name="apple" size={18} color={colors.secondaryForeground} />}
            />
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t('auth.noAccount')}
            </Text>
            <Button
              title={t('auth.register')}
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
  },
  form: {
    width: '100%',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mainBtn: {
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  socialBtn: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
});
