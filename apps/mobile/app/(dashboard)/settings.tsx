import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../src/services/api.service';
import { useAuthStore } from '../../src/store/auth.store';
import { INDUSTRY_LABELS } from '@bizbot/shared';

const WHATSAPP_GREEN = '#25D366';
const INDUSTRIES = Object.entries(INDUSTRY_LABELS);

interface BusinessProfile {
  name: string;
  industry: string;
  phone: string;
  planTier: string;
  waPhoneNumberId: string | null;
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { clearAuth, user } = useAuthStore();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('OTHER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiService.getBusinessProfile().then((data) => {
      const p = data as BusinessProfile;
      setProfile(p);
      setName(p.name);
      setIndustry(p.industry);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateBusinessProfile({ name, industry });
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch {
      Alert.alert('Error', t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: clearAuth },
    ]);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={WHATSAPP_GREEN} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Plan Badge */}
      <View style={styles.planBanner}>
        <Text style={styles.planText}>Current Plan: {profile?.planTier ?? 'FREE'}</Text>
      </View>

      {/* Business Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Profile</Text>

        <Text style={styles.label}>{t('settings.businessName')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your Business Name"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>{t('settings.industry')}</Text>
        <View style={styles.industryGrid}>
          {INDUSTRIES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.industryBtn, industry === key && styles.industryBtnActive]}
              onPress={() => setIndustry(key)}
            >
              <Text style={[styles.industryText, industry === key && styles.industryTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </View>

      {/* WhatsApp Config */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.whatsapp')}</Text>
        <Text style={styles.configRow}>Phone Number ID: {profile?.waPhoneNumberId ?? 'Not configured'}</Text>
        <Text style={styles.hint}>
          Configure your WhatsApp Business API credentials in the web dashboard.
        </Text>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.configRow}>Phone: {user?.phone}</Text>
        <Text style={styles.configRow}>Role: {user?.role}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  planBanner: { backgroundColor: WHATSAPP_GREEN, padding: 12, alignItems: 'center' },
  planText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#1A1A2E',
  },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  industryBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0',
  },
  industryBtnActive: { backgroundColor: WHATSAPP_GREEN, borderColor: WHATSAPP_GREEN },
  industryText: { fontSize: 13, color: '#555' },
  industryTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    marginTop: 20, backgroundColor: WHATSAPP_GREEN, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  configRow: { fontSize: 14, color: '#444', marginBottom: 8 },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  logoutBtn: {
    marginTop: 12, borderWidth: 1, borderColor: '#ff4444', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  logoutText: { color: '#ff4444', fontWeight: '700', fontSize: 15 },
});
