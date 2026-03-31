import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const cityUpdates = [
  {
    id: 'u1',
    department: 'Admin Control Room',
    priority: 'High',
    category: 'Operations',
    title: 'City Monitoring Bulletin',
    details:
      'Central dashboard reports normal city movement across Chhatrapati Sambhajinagar. Emergency teams remain on active standby in all zones.',
    time: '10:30 AM',
  },
  {
    id: 'u2',
    department: 'Traffic Department',
    priority: 'Medium',
    category: 'Mobility',
    title: 'Peak Hour Diversion',
    details:
      'Temporary traffic diversion announced near Kranti Chowk and CIDCO junction to ease evening congestion in Chhatrapati Sambhajinagar.',
    time: '09:50 AM',
  },
  {
    id: 'u3',
    department: 'Municipal Department',
    priority: 'Medium',
    category: 'Sanitation',
    title: 'Sanitation Drive Update',
    details:
      'Ward-level waste collection and road cleaning drive completed in Gulmandi and Osmanpura areas of Chhatrapati Sambhajinagar.',
    time: '09:05 AM',
  },
  {
    id: 'u4',
    department: 'Fire Department',
    priority: 'Low',
    category: 'Safety',
    title: 'Safety Inspection Notice',
    details:
      'Routine fire safety inspections are being carried out at selected market complexes and public buildings across Chhatrapati Sambhajinagar.',
    time: '08:40 AM',
  },
  {
    id: 'u5',
    department: 'Police Department',
    priority: 'High',
    category: 'Security',
    title: 'Public Safety Advisory',
    details:
      'Patrolling has been increased in high-footfall zones. Citizens in Chhatrapati Sambhajinagar are advised to report suspicious activity immediately.',
    time: '08:10 AM',
  },
];

function getPriorityTone(priority: string) {
  if (priority === 'High') {
    return {
      text: '#991B1B',
      bg: '#FEE2E2',
      border: '#FCA5A5',
      dot: '#DC2626',
    };
  }

  if (priority === 'Medium') {
    return {
      text: '#9A3412',
      bg: '#FFEDD5',
      border: '#FDBA74',
      dot: '#EA580C',
    };
  }

  return {
    text: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    dot: '#059669',
  };
}

export default function UpdatesTabScreen() {
  const highPriority = cityUpdates.filter((item) => item.priority === 'High').length;
  const departmentsActive = new Set(cityUpdates.map((item) => item.department)).size;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Live Civic Bulletin</Text>
          <Text style={styles.title}>Chhatrapati Sambhajinagar Updates</Text>
          <Text style={styles.subtitle}>
            Official updates from Admin and all core departments, organized for fast decision making.
          </Text>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{cityUpdates.length}</Text>
              <Text style={styles.quickStatLabel}>Total Bulletins</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{highPriority}</Text>
              <Text style={styles.quickStatLabel}>High Priority</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{departmentsActive}</Text>
              <Text style={styles.quickStatLabel}>Departments</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={[styles.filterChipText, styles.filterChipTextActive]}>All</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>High</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Medium</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Low</Text>
          </View>
        </View>

        {cityUpdates.map((update) => (
          <View key={update.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineDot, { backgroundColor: getPriorityTone(update.priority).dot }]} />
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.updateCard}>
              <View style={styles.rowTop}>
                <Text style={styles.department}>{update.department}</Text>
                <Text style={styles.time}>{update.time}</Text>
              </View>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: getPriorityTone(update.priority).bg,
                      borderColor: getPriorityTone(update.priority).border,
                    },
                  ]}
                >
                  <Text style={[styles.priorityText, { color: getPriorityTone(update.priority).text }]}>
                    {update.priority} Priority
                  </Text>
                </View>

                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{update.category}</Text>
                </View>
              </View>

              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.details}>{update.details}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F1EC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 34,
  },
  heroCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    padding: 18,
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  quickStatsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  quickStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  quickStatLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#0F766E',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: '#D1D5DB',
  },
  updateCard: {
    flex: 1,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#1E293B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  department: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
  },
  categoryText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  updateTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  details: {
    marginTop: 6,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
