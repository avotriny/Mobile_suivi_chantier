import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reducer from './reducer';

const Context = createContext();

export const useValue = () => useContext(Context);

const initialState = {
  currentUser: null,
  openLogin: false,
  loading: false,
  alert: { open: false, severity: 'info', message: '' },
  profile: { open: false, file: null, photoURL: '' },
  images: [],
  details: { categorie: '', description: '', debut: '', fin: '' },
  location: { lng: 0, lat: 0 },
  chantiers: [],
  updatedChantier: null,
  chantier: null,
  users: [],
  section: 0,
  conversations: [],
  messages: [],
  openMessage: false,
};

const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Charger l'utilisateur courant au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem('currentUser');
        const user = json ? JSON.parse(json) : null;
        if (user) dispatch({ type: 'UPDATE_USER', payload: user });
      } catch (e) {
        console.error('Erreur AsyncStorage currentUser:', e);
      }
    };
    loadUser();
  }, []);

  // Charger les données du chantier quand currentUser change
  useEffect(() => {
    if (!state.currentUser) return;
    const loadChantier = async () => {
      try {
        const key = String(state.currentUser.id);
        const json = await AsyncStorage.getItem(key);
        const data = json ? JSON.parse(json) : null;
        if (data?.location) dispatch({ type: 'UPDATE_LOCATION', payload: data.location });
        if (data?.details) dispatch({ type: 'UPDATE_DETAILS', payload: data.details });
        if (data?.images) dispatch({ type: 'UPDATE_IMAGES', payload: data.images });
        if (data?.updatedChantier) dispatch({ type: 'UPDATE_UPDATED_CHANTIER', payload: data.updatedChantier });
        if (data?.deletedImages) dispatch({ type: 'UPDATE_DELETED_IMAGES', payload: data.deletedImages });
        if (data?.addedImages) dispatch({ type: 'UPDATE_ADDED_IMAGES', payload: data.addedImages });
      } catch (e) {
        console.error('Erreur AsyncStorage chantier:', e);
      }
    };
    loadChantier();
  }, [state.currentUser]);


  return (
    <Context.Provider value={{ state, dispatch, mapRef, containerRef }}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;
