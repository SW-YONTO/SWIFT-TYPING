import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, LogIn, UserCheck } from 'lucide-react';
import { userManager } from '../utils/storage';

const UserManager = ({ onUserSelect, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(userManager.getUsers());
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    setError('');

    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (users.some(user => user.username.toLowerCase() === newUsername.toLowerCase())) {
      setError('Username already exists');
      return;
    }

    const newUser = userManager.addUser(newUsername.trim());
    loadUsers();
    setNewUsername('');
    setShowAddUser(false);
    onUserSelect(newUser);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? All progress will be lost.')) {
      userManager.deleteUser(userId);
      loadUsers();
      
      if (currentUser && currentUser.id === userId) {
        onUserSelect(null);
      }
    }
  };

  const handleSelectUser = (user) => {
    userManager.setCurrentUser(user.id);
    onUserSelect(user);
  };

  if (users.length === 0 && !showAddUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Swift Typing</h2>
          <p className="text-gray-600 mb-6">Create a user profile to start your typing journey</p>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Select User</h2>
          <p className="text-gray-600">Choose your profile to continue</p>
        </div>

        {/* User List */}
        <div className="space-y-4 mb-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                currentUser && currentUser.id === user.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectUser(user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    currentUser && currentUser.id === user.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.username}</h3>
                    <div className="text-sm text-gray-600">
                      Tests: {user.totalTests} | Avg WPM: {user.averageWPM} | Avg Accuracy: {user.averageAccuracy}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentUser && currentUser.id === user.id && (
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add User Form */}
        {showAddUser ? (
          <form onSubmit={handleAddUser} className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                  autoFocus
                  // Disable auto-suggestions for username input
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUsername('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="border-t pt-6 text-center">
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>
        )}

        {/* Continue Button */}
        {currentUser && (
          <div className="mt-6 text-center">
            <button
              onClick={() => onUserSelect(currentUser)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto text-lg"
            >
              <LogIn className="w-5 h-5" />
              Continue as {currentUser.username}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
