import "./index.css"
import { AnalysisProvider } from '../features/analysis/context/AnalysisContext';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { AppRouter } from './AppRouter';

function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <AppRouter />
      </AnalysisProvider>
    </AuthProvider>
  );
}

export default App;
