import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useValue } from '../../../components/context/ContextProvider';


export default function DetailsScreen({ navigation }) {
  const { state, dispatch } = useValue();
  const [details, setDetails] = useState(state.details);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const { categorie, debut, fin, description } = details;
    const valid = categorie && debut.trim() && fin.trim() && description.trim().length >= 10;
    setIsValid(valid);
  }, [details]);

  const handleNext = () => {
    dispatch({ type: 'UPDATE_DETAILS', payload: details });
    navigation.navigate('Location');
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={details.categorie}
        onValueChange={val => setDetails(d => ({ ...d, categorie: val }))}>
        <Picker.Item label="-- Sélectionnez une catégorie --" value="" />
        <Picker.Item label="Terrassement" value="terrassement" />
        {/* ...other enum options... */}
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Début (e.g. PK1+500 or P10)"
        value={details.debut}
        onChangeText={t => setDetails(d => ({ ...d, debut: t }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Fin"
        value={details.fin}
        onChangeText={t => setDetails(d => ({ ...d, fin: t }))}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description (min 10 caractères)"
        multiline
        value={details.description}
        onChangeText={t => setDetails(d => ({ ...d, description: t }))}
      />
      {isValid && (
        <Button title="Suivant" onPress={handleNext} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, marginVertical: 8, padding: 8, borderRadius: 4 }
});
