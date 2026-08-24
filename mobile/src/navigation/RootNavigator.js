import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { Step1CategoryScreen } from '../screens/Step1CategoryScreen';
import { Step2ProfileScreen } from '../screens/Step2ProfileScreen';
import { Step3IncomeScreen } from '../screens/Step3IncomeScreen';
import { Step4DetailsScreen } from '../screens/Step4DetailsScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Step1Category" component={Step1CategoryScreen} />
        <Stack.Screen name="Step2Profile" component={Step2ProfileScreen} />
        <Stack.Screen name="Step3Income" component={Step3IncomeScreen} />
        <Stack.Screen name="Step4Details" component={Step4DetailsScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
