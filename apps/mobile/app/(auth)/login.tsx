import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { IndianPhoneSchema, OtpSchema } from '@bizbot/shared';
import { apiService } from '../../src/services/api.service';
import { useAuthStore } from '../../src/store/auth.store';
import { type JwtPayload } from '@bizbot/shared';

type Step = 'phone' | 'otp';

const WHATSAPP_GREEN = '#25D366';
const DARK = '#1A1A2E';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { setTokens } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const result = IndianPhoneSchema.safeParse(phone);
    if (!result.success) {
      Alert.alert('Invalid Number', t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await apiService.sendOtp(result.data);
      setNormalizedPhone(result.data);
      setStep('otp');
      startCountdown();
    } catch {
      Alert.alert('Error', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpResult = OtpSchema.safeParse(otp);
    if (!otpResult.success) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const tokens = await apiService.verifyOtp(normalizedPhone, otp);
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1])) as JwtPayload;
      await setTokens(tokens, payload);
    } catch {
      Alert.alert('Invalid OTP', 'The OTP is incorrect or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t('auth.otpTitle')}</Text>
              <Text style={styles.otpHint}>
                {t('auth.otpSubtitle', { phone: normalizedPhone })}
              </Text>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.verify')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={countdown === 0 ? handleSendOtp : undefined}
                disabled={countdown > 0 || loading}
              >
                <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                  {countdown > 0
                    ? t('auth.resendIn', { seconds: countdown })
                    : t('auth.resend')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.changePhone}>← Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHATSAPP_GREEN },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 8,
  },
  logoText: { fontSize: 40, fontWeight: '800', color: WHATSAPP_GREEN },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: DARK, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  countryCode: {
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 14, marginRight: 8,
  },
  countryCodeText: { fontSize: 15, fontWeight: '500', color: DARK },
  phoneInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 17, color: DARK,
  },
  otpHint: { fontSize: 13, color: '#666', marginBottom: 16 },
  otpInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 16, fontSize: 28, color: DARK, textAlign: 'center',
    letterSpacing: 8, marginBottom: 16,
  },
  button: {
    backgroundColor: WHATSAPP_GREEN, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', shadowColor: WHATSAPP_GREEN,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendButton: { marginTop: 16, alignItems: 'center' },
  resendText: { color: WHATSAPP_GREEN, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: '#aaa' },
  changePhone: { textAlign: 'center', marginTop: 12, color: '#888', fontSize: 13 },
});
