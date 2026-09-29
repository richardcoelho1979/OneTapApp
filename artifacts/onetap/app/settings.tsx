import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const colors = useColors();
  const { t, locale, supportedLocales, setLocale } = useI18n();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      t('auth.logoutTitle'),
      t('auth.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logoutConfirm'), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('settings.account')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('auth.username')}</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{user?.username}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('auth.email')}</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('settings.preferences')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('settings.language')}</Text>
            </View>
            {supportedLocales.map((loc, index) => (
              <TouchableOpacity 
                key={loc.code}
                style={[styles.row, index < supportedLocales.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={() => setLocale(loc.code)}
              >
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>{loc.flag} {loc.nativeName}</Text>
                {locale === loc.code && (
                  <Feather name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.destructive }]}>{t('auth.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          OneTap v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
  },
});
