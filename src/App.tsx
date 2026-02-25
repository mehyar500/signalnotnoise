import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { AppLayout } from '@/layouts/AppLayout';
import { Home } from '@/pages/Home';
import { ClusterDetail } from '@/pages/ClusterDetail';
import { Research } from '@/pages/Research';
import { Auth } from '@/pages/Auth';
import { Blindspot } from '@/pages/Blindspot';
import { Digest } from '@/pages/Digest';

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cluster/:id" element={<ClusterDetail />} />
            <Route path="/blindspot" element={<Blindspot />} />
            <Route path="/digest" element={<Digest />} />
            <Route path="/research" element={<Research />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </Provider>
  );
}
