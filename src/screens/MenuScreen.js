import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../api/axios';

const MenuScreen = ({ navigation }) => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get('/tipoMulta/menu');
      setMenuData(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el menú');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (padre) => {
    if (expandedId === padre) {
      setExpandedId(null);
    } else {
      setExpandedId(padre);
    }
  };

  const handleSelectHijo = (hijo) => {
    navigation.navigate('FormularioMulta', { tipo_multa: hijo.id });
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.padre;

    return (
      <View style={styles.menuItem}>
        <TouchableOpacity 
          style={styles.padreButton} 
          onPress={() => toggleExpand(item.padre)}
        >
          <Text style={styles.padreText}>{item.padre}</Text>
          <Text style={styles.icon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && item.hijos && item.hijos.length > 0 && (
          <View style={styles.hijosContainer}>
            {item.hijos.map((hijo) => (
              <TouchableOpacity
                key={hijo.id}
                style={styles.hijoButton}
                onPress={() => handleSelectHijo(hijo)}
              >
                <Text style={styles.hijoText}>{hijo.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {isExpanded && (!item.hijos || item.hijos.length === 0) && (
          <View style={styles.hijosContainer}>
            <Text style={styles.emptyText}>No hay opciones disponibles</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona el tipo de multa</Text>
      <FlatList
        data={menuData}
        keyExtractor={(item, index) => item.padre || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    marginVertical: 20,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2, // shadow for android
    shadowColor: '#000', // shadow for ios
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  padreButton: {
    padding: 18,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    color: '#fff',
    fontSize: 16,
  },
  hijosContainer: {
    backgroundColor: '#fff',
  },
  hijoButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hijoText: {
    fontSize: 16,
    color: '#444',
  },
  emptyText: {
    padding: 15,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default MenuScreen;
