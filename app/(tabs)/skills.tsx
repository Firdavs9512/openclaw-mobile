import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkillCard } from '@/components/skills/SkillCard';
import { useTheme } from '@/theme';

interface Skill {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  description: string;
  active: boolean;
}

const SKILLS: Skill[] = [
  {
    id: '1',
    name: 'Gmail',
    icon: 'envelope',
    description: 'Email boshqaruvi',
    active: true,
  },
  {
    id: '2',
    name: 'Calendar',
    icon: 'calendar',
    description: 'Taqvim va rejalar',
    active: true,
  },
  {
    id: '3',
    name: 'Browser',
    icon: 'globe',
    description: 'Veb sahifalarni ochish',
    active: true,
  },
  {
    id: '4',
    name: 'GitHub',
    icon: 'github',
    description: 'PR, Issues boshqaruvi',
    active: false,
  },
  {
    id: '5',
    name: 'Spotify',
    icon: 'music',
    description: 'Musiqa boshqaruvi',
    active: false,
  },
  {
    id: '6',
    name: 'Telegram',
    icon: 'send',
    description: 'Xabarlar integratsiyasi',
    active: true,
  },
];

export default function SkillsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: Skill }) => (
    <SkillCard
      name={item.name}
      icon={item.icon}
      description={item.description}
      active={item.active}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skills</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Faol plaginlar va integratsiyalar
        </Text>
      </View>

      <FlatList
        data={SKILLS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListFooterComponent={
          <Pressable
            style={[styles.addButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
              + Yangi skill qo&apos;shish
            </Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  addButton: {
    marginHorizontal: 6,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
