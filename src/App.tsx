import Picker from './components/Picker';
import Settings from './components/Settings';

function getWindowMode(): 'picker' | 'settings' {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('window');
  return mode === 'settings' ? 'settings' : 'picker';
}

export default function App() {
  const mode = getWindowMode();
  return mode === 'settings' ? <Settings /> : <Picker />;
}
