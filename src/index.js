import React from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultWallets, darkTheme } from '@rainbow-me/rainbowkit';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@rainbow-me/rainbowkit/styles.css';

const { connectors } = getDefaultWallets({
  appName: 'MorSwap',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Only Using metamask for now
  chains: [arbitrumSepolia],
});

const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
  connectors,
});

const queryClient = new QueryClient();

const root = createRoot(document.getElementById('root'));
const customTheme = {
  ...darkTheme(),
  colors: {
    ...darkTheme().colors,
    accentColor: '#387a3a',
    accentColorForeground: '#ffffff',
    connectButtonBackground: '#3f413e',
    connectButtonText: '#4CAF50',
    modalBackground: '#2D2D2D',
    modalText: '#ffffff',
  },
  fonts: {
    body: 'Roboto, Arial, sans-serif',
  },
  radii: {
    ...darkTheme().radii,
    connectButton: '10px',
  },
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider chains={[arbitrumSepolia]} theme={customTheme} modalSize="compact">
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  </React.StrictMode>
);
