import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../src/services/api.service';

interface DashboardStats {
  totals: {
    totalMessages: number;
    botReplies: number;
    newCustomers: number;
  };
  conversationsByStatus: Record<string, number>;
}

const WHATSAPP_GREEN = '#25D366';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await apiService.getDashboardStats(7);
      setStats(data as DashboardStats);
    } catch {
      // silently fail — show cached or empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={WHATSAPP_GREEN} />
      </View>
    );
  }

  const metrics = [
    { label: t('dashboard.totalMessages'), value: stats?.totals.totalMessages ?? 0, icon: '💬' },
    { label: t('dashboard.botReplies'), value: stats?.totals.botReplies ?? 0, icon: '🤖' },
    { label: t('dashboard.newCustomers'), value: stats?.totals.newCustomers ?? 0, icon: '👤' },
    { label: t('dashboard.openConversations'), value: stats?.conversationsByStatus?.OPEN ?? 0, icon: '📂' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={WHATSAPP_GREEN} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
        <Text style={styles.subtext}>{t('dashboard.last7Days')}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.card}>
            <Text style={styles.cardIcon}>{m.icon}</Text>
            <Text style={styles.cardValue}>{m.value.toLocaleString('en-IN')}</Text>
            <Text style={styles.cardLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Bot Efficiency */}
      {stats && stats.totals.totalMessages > 0 && (
        <View style={styles.efficiencyCard}>
          <Text style={styles.efficiencyTitle}>🤖 Bot Efficiency</Text>
          <Text style={styles.efficiencyValue}>
            {Math.round((stats.totals.botReplies / stats.totals.totalMessages) * 100)}%
          </Text>
          <Text style={styles.efficiencyLabel}>of queries handled automatically</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: WHATSAPP_GREEN, padding: 20, paddingTop: 10 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtext: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    width: '47%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  cardLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  efficiencyCard: {
    margin: 12, backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  efficiencyTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  efficiencyValue: { fontSize: 48, fontWeight: '900', color: WHATSAPP_GREEN },
  efficiencyLabel: { fontSize: 13, color: '#999', marginTop: 4 },
});
