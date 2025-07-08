// src/AppContent.jsx
import React from 'react';
import { Fragment } from 'react';
import { useValue } from './context/ContextProvider';
import AppMain from './AppMain';
import Notification from './Notification/Notification';
import Loading from './Loading/Loading';
import AuthScreen from '../Screen/AuthScreen/AuthScreen';

export default function AppContent() {
  const { state: { loading, currentUser } } = useValue();

  return (
    <Fragment>
      {/* Toujours rendre Notification */}
      <Notification />

      {/* Si on charge, on affiche Loading */}
      {loading && <Loading />}

      {/* Si pas de user et pas en train de charger, on affiche la page de login */}
      {!loading && !currentUser && <AuthScreen />}

      {/* Si user connecté, on affiche l’app principale */}
      {!loading && currentUser && <AppMain />}
    </Fragment>
  );
}
