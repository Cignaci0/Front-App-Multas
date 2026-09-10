import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../api/axios';

const MenuScreen = ({ navigation }) => {
  const [queryText, setQueryText] = useState('');
  const [tiposMulta, setTiposMulta] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiposMulta(queryText);
  }, [queryText]);

  const fetchTiposMulta = async (query) => {
    setLoading(true);
    try {
      const response = await api.get('/tipoMulta', {
        params: {
          query: query,
          pagina: '',
          tamanio: '',
        },
      });
      setTiposMulta(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los tipos de multa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMulta = (item) => {
    setQueryText('');
    navigation.navigate('FormularioMulta', { tipo_multa: item.id });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => handleSelectMulta(item)}
    >
      <Text style={styles.itemText}>{item.nombre}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona el tipo de multa</Text>

      {/* Recuadro con bordes redondeados en la parte superior */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="digite palabra clave o código de multa"
          placeholderTextColor="#999"
          value={queryText}
          onChangeText={setQueryText}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={tiposMulta}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron tipos de multa</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25, // Bordes redondeados
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    elevation: 2, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#888',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default MenuScreen;
