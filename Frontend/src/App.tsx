import { useRef } from 'react';
import MembershipForm from './MembershipForm';
import MembershipList, { type MembershipListRef } from './MembershipList';
import './App.css';

function App() {
  const listRef = useRef<MembershipListRef>(null);

  const handleMembershipCreated = () => {
    listRef.current?.refresh();
  };

  return (
    <div className="app-container">
      <MembershipForm onMembershipCreated={handleMembershipCreated} />
      <MembershipList ref={listRef} />
    </div>
  );
}

export default App;
