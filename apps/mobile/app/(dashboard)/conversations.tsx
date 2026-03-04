import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../src/services/api.service';

interface ConversationItem {
  id: string;
  status: string;
  botEnabled: boolean;
  lastMessageAt: string;
  customer: { phone: string; name: string | null };
  messages: Array<{ content: string; direction: string; createdAt: string }>;
}

const WHATSAPP_GREEN = '#25D366';

export default function ConversationsScreen() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'BOT' | 'RESOLVED'>('ALL');

  const load = async () => {
    try {
      const result = await apiService.listConversations(1, filter === 'ALL' ? undefined : filter) as { data: ConversationItem[] };
      setConversations(result.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const handleToggleBot = async (id: string, currentlyEnabled: boolean) => {
    try {
      await apiService.toggleBot(id, !currentlyEnabled);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, botEnabled: !currentlyEnabled } : c)),
      );
    } catch {
      // ignore
    }
  };

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'OPEN', label: t('conversations.open') },
    { key: 'BOT', label: t('conversations.bot') },
    { key: 'RESOLVED', label: t('conversations.resolved') },
  ];

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const lastMsg = item.messages[0];
    const displayName = item.customer.name ?? item.customer.phone;
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
      <View style={styles.item}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemHeader}>
            <Text style={styles.customerName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.time}>
              {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMsg?.direction === 'OUTBOUND' ? '↩ ' : ''}{lastMsg?.content ?? '...'}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <View style={[styles.badge, { backgroundColor: item.status === 'OPEN' ? '#e8f5e9' : item.status === 'BOT' ? '#e3f2fd' : '#f5f5f5' }]}>
            <Text style={[styles.badgeText, { color: item.status === 'OPEN' ? '#2e7d32' : item.status === 'BOT' ? '#1565c0' : '#666' }]}>
              {item.status}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.botToggle, item.botEnabled && styles.botToggleActive]}
            onPress={() => handleToggleBot(item.id, item.botEnabled)}
          >
            <Text style={styles.botToggleText}>🤖</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={WHATSAPP_GREEN} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={WHATSAPP_GREEN} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('conversations.empty')}</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#999', fontSize: 15 },
  filterBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5' },
  filterBtnActive: { backgroundColor: WHATSAPP_GREEN },
  filterText: { fontSize: 13, fontWeight: '500', color: '#666' },
  filterTextActive: { color: '#fff' },
  item: { flexDirection: 'row', padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: WHATSAPP_GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  itemBody: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', flex: 1 },
  time: { fontSize: 11, color: '#999' },
  lastMessage: { fontSize: 13, color: '#666' },
  itemActions: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  botToggle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  botToggleActive: { backgroundColor: '#e3f2fd' },
  botToggleText: { fontSize: 14 },
  separator: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 72 },
});
