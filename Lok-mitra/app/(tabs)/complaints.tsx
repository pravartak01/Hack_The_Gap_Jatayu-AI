import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CitizenComplaint, getMyCitizenComplaints } from '@/lib/authApi';

export default function ComplaintsTabScreen() {
  const [complaints, setComplaints] = useState<CitizenComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const sortedComplaints = useMemo(() => {
    return [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [complaints]);

  const loadComplaints = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const data = await getMyCitizenComplaints();
      setComplaints(data.complaints);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadComplaints(false);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadComplaints(true);
  };

  const statusTone = (status: CitizenComplaint['status']) => {
    if (status === 'Resolved') {
      return { bg: '#E9F8EF', text: '#0F7A40' };
    }
    if (status === 'Routed') {
      return { bg: '#EDF5FF', text: '#2458A7' };
    }
    if (status === 'Under Review') {
      return { bg: '#FFF7E8', text: '#9A6400' };
    }
    return { bg: '#FFF0EF', text: '#B3261E' };
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroMini}>Citizen Grievance Desk</Text>
          <Text style={styles.title}>Your Complaints</Text>
          <Text style={styles.subtitle}>Track status, routing actions, and major municipal updates in real time.</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#138044" />
            <Text style={styles.centerStateText}>Loading complaints...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to fetch complaints</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadComplaints(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && sortedComplaints.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No complaints yet</Text>
            <Text style={styles.emptyText}>Raised complaints will appear here with actions and municipal updates.</Text>
          </View>
        ) : null}

        {!loading && !error
          ? sortedComplaints.map((item) => {
              const tone = statusTone(item.status);
              const latestLogs = (item.logs ?? []).slice(-2).reverse();

              return (
                <View key={item._id} style={styles.complaintCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.complaintId}>{item.complaintId}</Text>
                    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusText, { color: tone.text }]}>{item.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.complaintTitle}>{item.title}</Text>
                  <Text style={styles.complaintDescription} numberOfLines={3}>
                    {item.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Issue ID:</Text>
                    <Text style={styles.metaValue}>{item.issueId || 'Pending'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Department:</Text>
                    <Text style={styles.metaValue}>{item.assignedDepartment || 'Not assigned'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Submitted:</Text>
                    <Text style={styles.metaValue}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>Major Actions</Text>
                  {latestLogs.length > 0 ? (
                    latestLogs.map((log, index) => (
                      <View key={`${item._id}-log-${index}`} style={styles.actionItem}>
                        <View style={styles.actionDot} />
                        <View style={styles.actionContent}>
                          <Text style={styles.actionTitle}>{log.action || 'Update'}</Text>
                          <Text style={styles.actionMessage}>{log.message || 'Action updated by municipal operations.'}</Text>
                          <Text style={styles.actionTime}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Time not available'}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noActions}>No municipal actions recorded yet.</Text>
                  )}
                </View>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scroll: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 16,
  },
  heroMini: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6B7280',
  },
  centerState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  centerStateText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C9C6',
    padding: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B3261E',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#B3261E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  complaintId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  complaintTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  complaintDescription: {
    marginTop: 6,
    fontSize: 13,
    color: '#5B6470',
    lineHeight: 19,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  metaValue: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  divider: {
    marginTop: 12,
    marginBottom: 10,
    height: 1,
    backgroundColor: '#EDF2F7',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  actionDot: {
    marginTop: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#138044',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  actionMessage: {
    marginTop: 2,
    fontSize: 12,
    color: '#5B6470',
    lineHeight: 17,
  },
  actionTime: {
    marginTop: 3,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  noActions: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#5B6470',
    lineHeight: 19,
  },
});
