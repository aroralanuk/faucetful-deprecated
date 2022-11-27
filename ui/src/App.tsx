import { Box } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// import Navigation from '../components/Navigation';
import TopNav from '../components/top-nav';

// import LP from '../pages/lp';
// import Swap from '../pages/swap';
import './App.css';

function App() {
  const tabs = [
    {
      path: '/swap',
      name: 'Swap',
      component: Swap,
    },
    {
      path: '/lp',
      name: 'Provide Liquidity',
      component: LP,
    },
  ];

  return (
    <BrowserRouter>
      <TopNav />
      <Box
        textAlign="center"
        fontSize="xl"
        w={['90%', '85%', '80%']}
        maxW={800}
        mx="auto"
      >
        {/* <Box pt={10} pb={10}>
          <Navigation />
        </Box> */}
      </Box>
    </BrowserRouter>
  );
}

export default App;
