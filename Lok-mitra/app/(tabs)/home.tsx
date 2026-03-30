import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { createCitizenComplaint } from '@/lib/authApi';

const LOCATION_REFRESH_MS = 10 * 60 * 1000;
const COMPLAINT_CATEGORIES = ['Garbage', 'Road Issue', 'Environment', 'Electricity'];

export default function HomeTabScreen() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const [lastLocationSync, setLastLocationSync] = useState<string>('Not synced');
  const [locationLoading, setLocationLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const resolvedLocation = useMemo(() => {
    if (latitude == null || longitude == null) {
      return locationLabel;
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }, [latitude, longitude, locationLabel]);

  const fetchLiveLocation = async (silent = false) => {
    setLocationLoading(true);
    if (!silent) {
      setMessage('');
    }

    try {
      const permission = await Location.getForegroundPermissionsAsync();
      const finalPermission =
        permission.status === 'granted' ? permission : await Location.requestForegroundPermissionsAsync();

      if (finalPermission.status !== 'granted') {
        setLocationLabel('Permission required');
        if (!silent) {
          setIsError(true);
          setMessage('Location permission denied. Please allow location access.');
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(current.coords.latitude);
      setLongitude(current.coords.longitude);

      const reverse = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      if (reverse.length > 0) {
        const first = reverse[0];
        const place = [first.name, first.city || first.subregion, first.region]
          .filter(Boolean)
          .join(', ');
        setLocationLabel(place || 'Live location available');
      } else {
        setLocationLabel('Live location available');
      }

      setLastLocationSync(new Date().toLocaleTimeString());
      if (!silent) {
        setIsError(false);
        setMessage('Live location synced successfully.');
      }
    } catch (error) {
      if (!silent) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : 'Unable to fetch location');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    void fetchLiveLocation(true);
    const intervalId = setInterval(() => {
      void fetchLiveLocation(true);
    }, LOCATION_REFRESH_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setIsError(true);
      setMessage('Media permission denied. Please allow gallery access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 6,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 6));
      setIsError(false);
      setMessage(`${result.assets.length} image(s) added from gallery.`);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setIsError(true);
      setMessage('Camera permission denied. Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 6));
      setIsError(false);
      setMessage('Photo captured and added to complaint.');
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((asset) => asset.uri !== uri));
  };

  const submitComplaint = async () => {
    setComplaintLoading(true);
    setMessage('');

    try {
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required');
      }

      if (images.length === 0) {
        throw new Error('Please attach at least one complaint image');
      }

      const files = images.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `complaint-${Date.now()}-${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));

      const locationNote =
        locationLabel && locationLabel !== 'Locating...' && locationLabel !== 'Permission required'
          ? `Location: ${locationLabel}`
          : 'Location: unavailable';

      await createCitizenComplaint({
        title: `${title.trim()} [${category.trim()}]`,
        description: `${description.trim()}\n\n${locationNote}`,
        files,
      });

      setIsError(false);
      setMessage('Complaint raised successfully and sent to backend.');
      setTitle('');
      setDescription('');
      setImages([]);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Failed to raise complaint');
    } finally {
      setComplaintLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroAccentSaffron} />
          <View style={styles.heroAccentGreen} />
          <Text style={styles.heroMini}>Government of India - Citizen Safety Network</Text>
          <Text style={styles.heroTitle}>Lok Mitra</Text>
          <Text style={styles.heroSubtitle}>Real-time alerts, live location coverage, and citizen complaint response.</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Location Status</Text>
            <Text style={styles.statValue}>{locationLoading ? 'Syncing' : 'Active'}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Last Sync</Text>
            <Text style={styles.statValue}>{lastLocationSync}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Live Location for Alerts</Text>
          <Text style={styles.subtitle}>Automatically refreshed every 10 minutes.</Text>

          <View style={styles.locationBox}>
            <Text style={styles.locationHeading}>Current Place</Text>
            <Text style={styles.locationValue}>{resolvedLocation}</Text>
            <Text style={styles.locationCoords}>
              Coordinates: {latitude && longitude ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'Not available'}
            </Text>
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => fetchLiveLocation(false)} disabled={locationLoading}>
            <Text style={styles.secondaryBtnText}>{locationLoading ? 'Refreshing...' : 'Refresh Location Now'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Raise Complaint</Text>
          <Text style={styles.subtitle}>Attach evidence from camera/gallery with auto location tagging.</Text>

          <TextInput
            style={styles.input}
            placeholder="Complaint title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8B8B8B"
          />

          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownLabel}>Complaint Category</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setIsCategoryOpen((prev) => !prev)}
              activeOpacity={0.85}
            >
              <Text style={styles.dropdownTriggerText}>{category}</Text>
              <Text style={styles.dropdownChevron}>{isCategoryOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isCategoryOpen ? (
              <View style={styles.dropdownMenu}>
                {COMPLAINT_CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.dropdownItem,
                      item === category ? styles.dropdownItemActive : undefined,
                      item === COMPLAINT_CATEGORIES[COMPLAINT_CATEGORIES.length - 1] ? styles.dropdownItemLast : undefined,
                    ]}
                    onPress={() => {
                      setCategory(item);
                      setIsCategoryOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, item === category ? styles.dropdownItemTextActive : undefined]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue in detail"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#8B8B8B"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.cameraBtn]} onPress={pickFromCamera}>
              <Text style={styles.actionBtnText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.galleryBtn]} onPress={pickFromGallery}>
              <Text style={styles.actionBtnText}>Pick from Gallery</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
              {images.map((asset) => (
                <View key={asset.assetId || asset.uri} style={styles.previewWrap}>
                  <Image source={{ uri: asset.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeChip} onPress={() => removeImage(asset.uri)}>
                    <Text style={styles.removeChipText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={submitComplaint} disabled={complaintLoading}>
            <Text style={styles.primaryBtnText}>{complaintLoading ? 'Submitting...' : 'Submit Complaint'}</Text>
          </TouchableOpacity>
        </View>

        {message ? (
          <View style={[styles.msgBox, isError ? styles.msgErr : styles.msgOk]}>
            <Text style={[styles.msgText, { color: isError ? '#D93025' : '#138044' }]}>{message}</Text>
          </View>
        ) : null}
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 38,
    gap: 12,
  },
  heroCard: {
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 18,
    overflow: 'hidden',
  },
  heroAccentSaffron: {
    position: 'absolute',
    top: -34,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE3CF',
  },
  heroAccentGreen: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DAF2E5',
  },
  heroMini: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '800',
    color: '#102A43',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#52606D',
    maxWidth: '88%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },
  statValue: {
    marginTop: 6,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E3DB',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#5B6470',
  },
  locationBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D7E7DD',
    backgroundColor: '#F2FBF6',
  },
  locationHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A4856',
  },
  locationValue: {
    marginTop: 6,
    fontSize: 14,
    color: '#0F5132',
    fontWeight: '700',
  },
  locationCoords: {
    marginTop: 4,
    fontSize: 12,
    color: '#52606D',
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DFE3E8',
    borderRadius: 10,
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1C1C1C',
  },
  dropdownWrap: {
    marginTop: 12,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#DFE3E8',
    borderRadius: 10,
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#1C1C1C',
    fontWeight: '600',
  },
  dropdownChevron: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DFE3E8',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: '#EEF8F2',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#0F5132',
  },
  textarea: {
    minHeight: 110,
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
  },
  cameraBtn: {
    borderColor: '#9FD6B8',
    backgroundColor: '#EAF7EF',
  },
  galleryBtn: {
    borderColor: '#FFCCA6',
    backgroundColor: '#FFF4EE',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#138044',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewRow: {
    marginTop: 12,
    gap: 10,
    paddingRight: 8,
  },
  previewWrap: {
    width: 104,
  },
  previewImage: {
    width: 104,
    height: 104,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE3E8',
  },
  removeChip: {
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 5,
  },
  removeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  msgBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  msgErr: {
    backgroundColor: '#FFF0EF',
    borderColor: '#F5C4BF',
  },
  msgOk: {
    backgroundColor: '#EDF7F1',
    borderColor: '#B5DFC8',
  },
  msgText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
