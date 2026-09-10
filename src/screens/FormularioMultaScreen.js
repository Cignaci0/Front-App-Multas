import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../api/axios';
import { comunas } from '../utils/dataGeografica';

export const validarPatente = (rawPatente) => {
  if (!rawPatente || !rawPatente.trim()) {
    return { isValid: false, error: null };
  }

  const clean = rawPatente.toUpperCase().replace(/[\s-]/g, '');

  if (/[^A-ZÑ0-9]/.test(clean)) {
    return { isValid: false, error: 'La patente contiene caracteres no permitidos' };
  }

  const letters = clean.replace(/[^A-ZÑ]/g, '');
  const numbers = clean.replace(/[^0-9]/g, '');

  const tieneVocal = /[AEIOU]/.test(letters);
  const tieneEne = /Ñ/.test(letters);

  if (tieneVocal && tieneEne) {
    return { isValid: false, error: 'No se permite combinar vocales con la letra Ñ' };
  }

  if (tieneVocal && letters.length > 2) {
    return { isValid: false, error: 'Las patentes con vocales deben tener máximo 2 letras' };
  }

  if (tieneEne && letters.length !== 4) {
    return { isValid: false, error: 'Las patentes con la letra Ñ deben tener 4 letras' };
  }

  if (letters.length === 2) {
    if (tieneEne) {
      return { isValid: false, error: 'Las patentes de 2 letras no pueden contener la letra Ñ' };
    }
    if (numbers.length !== 4 || clean.length !== 6) {
      return { isValid: false, error: 'Formato de 2 letras requiere 4 números' };
    }
    return { isValid: true, error: null, formatted: `${letters}${numbers}` };
  }

  if (letters.length === 4) {
    if (tieneVocal) {
      return { isValid: false, error: 'Las patentes de 4 letras no pueden contener vocales' };
    }
    if (numbers.length !== 2 || clean.length !== 6) {
      return { isValid: false, error: 'Formato de 4 letras requiere 2 números' };
    }
    return { isValid: true, error: null, formatted: `${letters}${numbers}` };
  }

  return { 
    isValid: false, 
    error: letters.length < 2 
      ? 'Debe ingresar al menos 2 letras' 
      : 'Formato inválido (debe ser 2 letras + 4 números, o 4 letras + 2 números)' 
  };
};

const FormularioMultaScreen = ({ route, navigation }) => {
  const { tipo_multa } = route.params; // Pasado desde MenuScreen
  
  const [patente, setPatente] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [comuna, setComuna] = useState('');
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

      try {
        let geocode = await Location.reverseGeocodeAsync({
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude
        });
        if (geocode.length > 0) {
          const addressObj = geocode[0];
          const street = addressObj.street || addressObj.name || '';
          const number = addressObj.streetNumber || '';
          const fullAddress = `${street} ${number}`.trim();
          setUbicacion(fullAddress);

          // Buscar comuna en dataGeografica.js
          const normalizeString = (str) => {
            return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
          };
          
          const geocodeCity = normalizeString(addressObj.city);
          const geocodeSubregion = normalizeString(addressObj.subregion);
          
          const foundComuna = comunas.find(c => {
            const cName = normalizeString(c.nombre);
            return cName === geocodeCity || cName === geocodeSubregion;
          });

          if (foundComuna) {
            setComuna(foundComuna.nombre);
          } else {
            setComuna(addressObj.city || addressObj.subregion || '');
          }
        }
      } catch (e) {
        console.log("Error al obtener dirección", e);
      }
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

  const patenteValidation = validarPatente(patente);

  const handleSubmit = async () => {
    if (!patenteValidation.isValid) {
      Alert.alert('Patente inválida', patenteValidation.error || 'Debe ingresar una patente válida');
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
      patente: patenteValidation.formatted || patente,
      tipo_multa: tipo_multa,
      latitud: location.latitud.toString(),
      longitud: location.longitud.toString(),
      direccion: ubicacion,
      comuna: comuna
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

  const isFormValid = patenteValidation.isValid && ubicacion.trim() !== '' && location !== null && fotos.foto1 !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Multa</Text>

      <Text style={styles.label}>Patente del vehículo</Text>
      <TextInput
        style={[styles.input, patente.trim() !== '' && !patenteValidation.isValid ? styles.inputError : null]}
        value={patente}
        onChangeText={(text) => setPatente(text.toUpperCase())}
        placeholder="Ej: AA1234 o BBBB12"
        autoCapitalize="characters"
      />
      {patente.trim() !== '' && !patenteValidation.isValid && patenteValidation.error && (
        <Text style={styles.errorText}>{patenteValidation.error}</Text>
      )}

      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        value={ubicacion}
        onChangeText={setUbicacion}
        placeholder={locationLoading ? "Buscando dirección..." : "Ej: Isidora Goyenechea 345"}
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
        style={[styles.submitBtn, (!isFormValid || loading) && styles.submitBtnDisabled]} 
        onPress={handleSubmit}
        disabled={!isFormValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Efectuar Multa</Text>
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
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
    marginTop: -15,
    marginBottom: 15,
    fontWeight: '500',
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
  submitBtnDisabled: {
    backgroundColor: '#94d3a2', // Verde más claro/opaco para indicar que está inactivo
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FormularioMultaScreen;
