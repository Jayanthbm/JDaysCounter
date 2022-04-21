import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {Provider as PaperProvider} from 'react-native-paper';
import {name as appName} from './app.json';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
Icon.loadFont();
import 'react-native-gesture-handler';
export default function Main() {
  return (
    <PaperProvider>
      <App />
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
