import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulos</Text>

      <TouchableOpacity 
        style={styles.buttonMultas} 
        onPress={() => navigation.navigate('Menu')}
      >
        <Text style={styles.buttonText}>TRANSITO</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.buttonModulo} 
        onPress={() => { /* No hace nada por ahora */ }}
      >
        <Text style={styles.buttonText}>ORDENANZAS</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.buttonModulo} 
        onPress={() => { /* No hace nada por ahora */ }}
      >
        <Text style={styles.buttonText}>OBRAS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  buttonMultas: {
    backgroundColor: '#0066CC', // Azul activo
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonModulo: {
    backgroundColor: '#999', // Gris (inactivo/pendiente)
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
