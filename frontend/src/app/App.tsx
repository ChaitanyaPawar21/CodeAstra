import "./index.css"
import { AnalysisProvider } from '../features/analysis/context/AnalysisContext';
import { AppRouter } from './AppRouter';

function App() {
  return (
    <AnalysisProvider>
      <AppRouter />
    </AnalysisProvider>
  );
}

export default App;
