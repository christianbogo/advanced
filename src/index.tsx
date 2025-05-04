import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { FilterProvider } from './filter/FilterContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider } from './form/FormContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <FormProvider>
          <App />
        </FormProvider>
      </FilterProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
