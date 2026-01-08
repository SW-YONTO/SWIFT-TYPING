import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, LogIn, UserCheck, Zap, Trophy, Target, Star, Edit3, Check, X } from 'lucide-react';
import { userManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

// Available avatars (15 avatars)
const AVATARS = Array.from({ length: 15 }, (_, i) => `avatar${i + 1}.png`);

const UserManager = ({ onUserSelect, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1.png');
  const [error, setError] = useState('');
  const [editingAvatar, setEditingAvatar] = useState(null);
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const loadedUsers = userManager.getUsers();
    // Ensure all users have avatars (backward compatibility)
    const usersWithAvatars = loadedUsers.map(user => ({
      ...user,
      avatar: user.avatar || 'avatar1.png'
    }));
    setUsers(usersWithAvatars);
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

    const newUser = userManager.addUser(newUsername.trim(), selectedAvatar);
    loadUsers();
    setNewUsername('');
    setSelectedAvatar('avatar1.png');
    setShowAddUser(false);
    onUserSelect(newUser);
  };

  const handleDeleteUser = (userId, e) => {
    e.stopPropagation();
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

  const handleChangeAvatar = (userId, newAvatar) => {
    userManager.updateUserAvatar(userId, newAvatar);
    loadUsers();
    setEditingAvatar(null);
  };

  const getAvatarPath = (avatar) => {
    try {
      return new URL(`../assets/avatars/${avatar}`, import.meta.url).href;
    } catch {
      return new URL('../assets/avatars/avatar1.png', import.meta.url).href;
    }
  };

  // Empty state - no users
  if (users.length === 0 && !showAddUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
        <div className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 text-center border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${theme.accent} bg-opacity-10 flex items-center justify-center`}>
            <User className={`w-10 h-10 ${theme.accent.replace('bg-', 'text-')}`} />
          </div>
          <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome to Swift Typing
          </h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 text-lg`}>
            Create your profile to start improving your typing skills
          </p>
          <button
            onClick={() => setShowAddUser(true)}
            className={`${theme.accent} text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto text-lg font-semibold shadow-lg`}
          >
            <Plus className="w-6 h-6" />
            Create Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className={`max-w-5xl w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className={`w-8 h-8 ${theme.accent.replace('bg-', 'text-')}`} />
            <h2 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Select Your Profile
            </h2>
          </div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
            Choose your account to continue your typing journey
          </p>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {users.map((user) => (
            <div
              key={user.id}
              className={`relative group cursor-pointer transition-all duration-300 rounded-2xl p-6 border-2 ${
                currentUser && currentUser.id === user.id
                  ? `${theme.accent} bg-opacity-5 border-opacity-100 shadow-lg transform scale-105`
                  : `${isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-750' : 'border-gray-200 hover:border-gray-300'} hover:shadow-xl`
              }`}
              onClick={() => handleSelectUser(user)}
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-4">
                <div className={`relative mb-4`}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-1">
                    <img
                      src={getAvatarPath(user.avatar)}
                      alt={user.username}
                      className={`w-full h-full rounded-full object-cover border-4 ${
                        currentUser && currentUser.id === user.id
                          ? `${theme.accent.replace('bg-', 'border-')} shadow-lg`
                          : `${isDarkMode ? 'border-gray-700' : 'border-white'}`
                      } transition-all`}
                    />
                  </div>
                  {currentUser && currentUser.id === user.id && (
                    <div className={`absolute -bottom-2 -right-2 ${theme.accent} text-white p-2 rounded-full shadow-lg`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                  )}
                  {/* Edit Avatar Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAvatar(user.id);
                    }}
                    className={`absolute -top-1 -right-1 p-1.5 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-full shadow-md hover:scale-110 transition-transform ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>

                <h3 className={`font-bold text-xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {user.username}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Stats */}
              <div className={`grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Tests</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.totalTests}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className={`w-4 h-4 ${theme.accent.replace('bg-', 'text-')}`} />
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>WPM</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.averageWPM}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Accuracy</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.averageAccuracy}%</p>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteUser(user.id, e)}
                className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  isDarkMode 
                    ? 'bg-red-900 bg-opacity-20 text-red-400 hover:bg-opacity-30' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Delete Profile
              </button>

              {/* Avatar Selection Modal */}
              {editingAvatar === user.id && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAvatar(null);
                  }}
                >
                  <div
                    className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Choose Avatar
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => handleChangeAvatar(user.id, avatar)}
                          className={`relative rounded-full overflow-hidden transition-all hover:scale-110 p-0.5 ${
                            user.avatar === avatar
                              ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg ring-4 ring-blue-300'
                              : 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300'
                          }`}
                        >
                          <div className={`rounded-full overflow-hidden ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } p-1`}>
                            <img
                              src={getAvatarPath(avatar)}
                              alt={`Avatar ${avatar}`}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                          {user.avatar === avatar && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center rounded-full">
                              <Check className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAvatar(null);
                      }}
                      className={`mt-4 w-full py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} hover:opacity-80 transition-opacity`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add User Section */}
        {showAddUser ? (
          <form onSubmit={handleAddUser} className={`border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Create New Profile
            </h3>
            
            {/* Avatar Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative rounded-full overflow-hidden transition-all hover:scale-110 p-0.5 ${
                      selectedAvatar === avatar
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg ring-4 ring-blue-300'
                        : 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300'
                    }`}
                  >
                    <div className={`rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } p-1`}>
                      <img
                        src={getAvatarPath(avatar)}
                        alt={`Avatar ${avatar}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter your username"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-offset-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                } transition-all`}
                autoFocus
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddUser(false);
                  setNewUsername('');
                  setSelectedAvatar('avatar1.png');
                  setError('');
                }}
                className={`px-6 py-3 border-2 rounded-xl transition-all ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className={`border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-6 text-center`}>
            <button
              onClick={() => setShowAddUser(true)}
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-800'} px-8 py-3 rounded-xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto font-semibold`}
            >
              <Plus className="w-5 h-5" />
              Add New Profile
            </button>
          </div>
        )}

        {/* Continue Button */}
        {currentUser && !showAddUser && (
          <div className={`mt-6 text-center border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
            <button
              onClick={() => onUserSelect(currentUser)}
              className={`${theme.accent} text-white px-10 py-4 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto text-lg font-bold shadow-xl`}
            >
              <LogIn className="w-6 h-6" />
              Continue as {currentUser.username}
              <Star className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
