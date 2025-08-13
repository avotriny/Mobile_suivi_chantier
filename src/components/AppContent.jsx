import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useValue } from './context/ContextProvider';
import Loading from './Loading/Loading';
import Notification from './Notification/Notification';
import AuthScreen from '../Screen/AuthScreen/AuthScreen';
import AppMain from './AppMain';


export default function AppContent() {
  const { state: { loading, currentUser } } = useValue();

  return (
    <Fragment>
      <Notification />
      {loading && <Loading />}
      {!loading && !currentUser && <AuthScreen />}
      {!loading && currentUser && (
        <NavigationContainer>
          <AppMain />
        </NavigationContainer>
      )}
    </Fragment>
  );
}