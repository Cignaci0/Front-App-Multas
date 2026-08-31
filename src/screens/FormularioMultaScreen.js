import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../api/axios';

const FormularioMultaScreen = ({ route, navigation }) => {
  const { tipo_multa } = route.params; // Pasado desde MenuScreen
  
  const [patente, setPatente] = useState('');
  const [location, setLocation] = useState(null);
  const [fotos, setFotos] = useState({
    foto1: null,
    foto2: null,
    foto3: null,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación para registrar la multa.');
        setLocationLoading(false);
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitud: currentLoc.coords.latitude.toString(),
        longitud: currentLoc.coords.longitude.toString()
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const tomarFoto = async (fotoKey) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Comprimir mucho más la imagen
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }], // Reducir dimensiones
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        setFotos(prev => ({
          ...prev,
          [fotoKey]: manipResult.base64
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!patente) {
      Alert.alert('Error', 'Debe ingresar la patente');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Esperando ubicación, intente nuevamente');
      return;
    }

    setLoading(true);
    
    const payload = {
      foto1: fotos.foto1 || '',
      foto2: fotos.foto2 || '',
      foto3: fotos.foto3 || '',
      patente: patente,
      tipo_multa: tipo_multa,
      latitud: location.latitud,
      longitud: location.longitud
    };

    try {
      await api.post('/multa', payload);
      Alert.alert('Éxito', 'Multa registrada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo registrar la multa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Multa</Text>

      <Text style={styles.label}>Patente del vehículo</Text>
      <TextInput
        style={styles.input}
        value={patente}
        onChangeText={setPatente}
        placeholder="Ej: PT-CL-23"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Evidencia (Fotos)</Text>
      <View style={styles.fotosContainer}>
        {['foto1', 'foto2', 'foto3'].map((fotoKey, index) => (
          <TouchableOpacity 
            key={fotoKey} 
            style={[styles.fotoBtn, fotos[fotoKey] ? styles.fotoBtnSuccess : null]}
            onPress={() => tomarFoto(fotoKey)}
          >
            {fotos[fotoKey] ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${fotos[fotoKey]}` }} 
                style={styles.fotoThumb} 
              />
            ) : (
              <Text style={styles.fotoBtnText}>Tomar Foto {index + 1}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Guardar Multa</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  infoText: {
    fontSize: 14,
    color: '#004080',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 25,
  },
  fotosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  fotoBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    borderRadius: 8,
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fotoBtnSuccess: {
    borderStyle: 'solid',
    borderColor: '#28a745',
  },
  fotoBtnText: {
    color: '#0066CC',
    textAlign: 'center',
    fontSize: 12,
  },
  fotoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitBtn: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FormularioMultaScreen;
