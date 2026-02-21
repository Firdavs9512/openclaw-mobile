import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/common/Themed';

export default function ChatScreen() {
  const { sessionKey } = useLocalSearchParams<{ sessionKey: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Session: {sessionKey}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
