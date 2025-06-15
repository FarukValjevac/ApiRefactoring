import { useRef } from 'react';
import MembershipForm from './MembershipForm';
import MembershipList, { type MembershipListRef } from './MembershipList';
import './App.css';

/**
 * @component App
 * The root component of the application.
 * Its primary role is to orchestrate the main layout and facilitate
 * communication between its direct children: `MembershipForm` and `MembershipList`.
 */
function App() {
  
  const listRef = useRef<MembershipListRef>(null);

  /**
   * Callback function passed to `MembershipForm`.
   * When a membership is successfully created in the form, this function is called.
   * It then uses the ref to call the `refresh` method exposed by `MembershipList`.
   */
  const handleMembershipCreated = () => {
    listRef.current?.refresh();
  };

  return (
    <div className="app-container">
      {/* The form component. It receives a callback to notify the parent of a successful creation. */}
      <MembershipForm onMembershipCreated={handleMembershipCreated} />

      {/* The list component. The `ref` is attached here so the parent can access its methods. */}
      <MembershipList ref={listRef} />
    </div>
  );
}

export default App;