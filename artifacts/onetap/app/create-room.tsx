import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateRoom } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function CreateRoomScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const createRoomMutation = useCreateRoom();

  const handleCreate = async () => {
    if (!name) return;
    setIsLoading(true);
    try {
      const room = await createRoomMutation.mutateAsync({
        data: { name, maxPlayers, isPrivate }
      });
      router.replace(`/room/${room.id}`);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const adjustPlayers = (delta: number) => {
    setMaxPlayers(prev => Math.min(Math.max(prev + delta, 2), 16));
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.foreground }]}>{t('play.createRoom')}</Text>
        
        <View style={styles.form}>
          <Input
            label={t('room.name')}
            value={name}
            onChangeText={setName}
            placeholder="Awesome Party"
            autoFocus
          />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('room.maxPlayers')}</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity 
                style={[styles.counterBtn, { backgroundColor: colors.secondary }]}
                onPress={() => adjustPlayers(-1)}
              >
                <FontAwesome name="minus" size={16} color={colors.secondaryForeground} />
              </TouchableOpacity>
              <Text style={[styles.counterText, { color: colors.foreground }]}>{maxPlayers}</Text>
              <TouchableOpacity 
                style={[styles.counterBtn, { backgroundColor: colors.secondary }]}
                onPress={() => adjustPlayers(1)}
              >
                <FontAwesome name="plus" size={16} color={colors.secondaryForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <TouchableOpacity 
              style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setIsPrivate(!isPrivate)}
              activeOpacity={0.8}
            >
              <View style={styles.toggleTextContainer}>
                <FontAwesome name="lock" size={18} color={colors.foreground} />
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{t('room.private')}</Text>
              </View>
              <View style={[
                styles.toggleIndicator,
                { backgroundColor: isPrivate ? colors.primary : colors.secondary }
              ]}>
                <View style={[
                  styles.toggleThumb, 
                  { 
                    backgroundColor: colors.primaryForeground,
                    transform: [{ translateX: isPrivate ? 14 : 0 }]
                  }
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('common.cancel')}
            variant="ghost"
            onPress={() => router.back()}
            style={{ flex: 1 }}
          />
          <Button
            title={t('room.create')}
            onPress={handleCreate}
            isLoading={isLoading}
            disabled={!name}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 32,
  },
  form: {
    marginBottom: 48,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 32,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleIndicator: {
    width: 44,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
